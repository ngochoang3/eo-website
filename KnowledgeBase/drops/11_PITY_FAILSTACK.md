# SYSTEM 11 — Pity & Fail Stack Architecture
> Status: BLOCKER → chưa có server-side implementation
> Ngày: 2026-06-13

---

# 1. Purpose

Pity & Fail Stack là **hệ thống bảo vệ người chơi khỏi bad luck cực đoan**. Đảm bảo mọi player đều đạt được rare item sau N lần thất bại, đồng thời tăng dần xác suất theo từng lần fail (fail stack = soft pity).

**Yêu cầu bất biến:**
- Pity state tồn tại **server-side only** — client không bao giờ biết seed hay state
- Mọi roll phải audit-traceable
- Hard pity = 100% guarantee (không exception)

---

# 2. Design Philosophy

- **2-layer protection:** Soft pity (rate tăng dần) + Hard pity (100% guarantee)
- **Fail stack ≠ pity count:** Fail stack tăng rate; pity count đếm đến guarantee
- **Per-type isolation:** Pity cho "equipment_legend" không liên quan pity "relic_epic"
- **Persistent:** Pity không reset khi logout hay đổi character
- **Transparent:** Player thấy progress bar "X/Y đến guaranteed" (không thấy seed)

---

# 3. Core Loop

```
[Attempt roll (boss kill / gacha / enhance)]
        │
        ▼
[Server: Load PityRecord(player_id, pity_type)]
        │
        ▼
[Calculate EffectiveRate = BaseRate + FailStack × StackBonus]
        │
        ▼
[Check HardPity: pity_count ≥ guaranteed_at?]
  YES → success = TRUE (skip RNG)
  NO  → success = XorShift64() < EffectiveRate
        │
        ▼
[If success:]
  pity_count = 0, fail_stack = 0
[If fail:]
  pity_count += 1
  fail_stack = min(fail_stack + 1, fail_stack_cap)
        │
        ▼
[Save PityRecord delta → DB]
[Log roll to audit_log]
```

---

# 4. Progression Loop

Pity không "progress" theo level. Nó progress theo số lần roll:

```
Soft pity zone: pity_count ≥ (guaranteed_at × 0.75)
  Rate dalam soft pity zone tăng tuyến tính từ base → 100%

Formula:
  if pity_count >= soft_pity_threshold:
    softRate = BaseRate + (pity_count - soft_pity_threshold)
               / (guaranteed_at - soft_pity_threshold)
               × (1.0 - BaseRate)
  else:
    softRate = BaseRate + fail_stack × StackBonus

EffectiveRate = max(softRate, BaseRate + fail_stack × StackBonus)
```

---

# 5. Data Architecture

## 5.1 Entity

```
PityConfigSO
├── id: string                 ("equipment_legend")
├── display_name: string       ("Legendary Equipment")
├── base_rate: float           (0.0005 = 0.05%)
├── guaranteed_at: int         (800)
├── soft_pity_threshold: int   (600)  = 75% of 800
├── fail_stack_cap: int        (300)
├── fail_stack_bonus: float    (0.0005)
├── soft_pity_enabled: bool    (true)
└── show_progress_to_player: bool (true)

PityRecord (per player per pity_type)
├── pity_type: string
├── pity_count: int            (rolls since last success)
└── fail_stack: int            (capped at fail_stack_cap)
```

## 5.2 Database Tables

```sql
CREATE TABLE pity_config (
    id                      VARCHAR(32) PRIMARY KEY,
    display_name            VARCHAR(64) NOT NULL,
    base_rate               FLOAT NOT NULL,
    guaranteed_at           INT NOT NULL,
    soft_pity_threshold     INT NOT NULL,
    fail_stack_cap          INT NOT NULL,
    fail_stack_bonus        FLOAT NOT NULL,
    soft_pity_enabled       TINYINT NOT NULL DEFAULT 1,
    show_progress           TINYINT NOT NULL DEFAULT 1
);

CREATE TABLE player_pity (
    player_id       BIGINT NOT NULL,
    pity_type       VARCHAR(32) NOT NULL REFERENCES pity_config(id),
    pity_count      INT NOT NULL DEFAULT 0,
    fail_stack      INT NOT NULL DEFAULT 0,
    last_success_at DATETIME,
    last_roll_at    DATETIME,
    PRIMARY KEY (player_id, pity_type)
);

CREATE TABLE pity_audit_log (
    log_id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    player_id       BIGINT NOT NULL,
    pity_type       VARCHAR(32) NOT NULL,
    roll_result     TINYINT NOT NULL,     -- 1=success, 0=fail
    pity_count_pre  INT NOT NULL,
    fail_stack_pre  INT NOT NULL,
    effective_rate  FLOAT NOT NULL,
    was_hard_pity   TINYINT NOT NULL DEFAULT 0,
    was_soft_pity   TINYINT NOT NULL DEFAULT 0,
    rng_seed_state  BIGINT NOT NULL,      -- snapshot XorShift64 state
    rolled_at       DATETIME NOT NULL,
    INDEX idx_player_type (player_id, pity_type),
    INDEX idx_date (rolled_at)
);
```

## 5.3 CSV Schema

`pity_config.csv`:
```
id,display_name,base_rate,guaranteed_at,soft_pity_threshold,fail_stack_cap,fail_stack_bonus,soft_pity_enabled,show_progress
equipment_common,Common Equipment,0.05,20,15,10,0.05,true,true
equipment_rare,Rare Equipment,0.01,100,75,50,0.01,true,true
equipment_epic,Epic Equipment,0.002,400,300,200,0.002,true,true
equipment_legend,Legendary Equipment,0.0005,800,600,300,0.0005,true,true
relic_rare,Rare Relic,0.01,100,75,50,0.01,true,true
relic_epic,Epic Relic,0.005,200,150,100,0.005,true,true
relic_legend,Legend Relic,0.001,500,375,200,0.001,true,true
artifact_rank,Artifact Fragment,0.02,50,37,30,0.02,true,true
creature_common,Common Creature,0.25,4,3,0,0.0,false,false
creature_rare,Rare Creature,0.10,10,7,5,0.10,true,true
creature_epic,Epic Creature,0.03,30,22,15,0.03,true,true
creature_legend,Legend Creature,0.01,100,75,30,0.01,true,true
enhance_plus10,Enhance +10 Pity,0.0,30,30,30,0.0,true,true
enhance_plus15,Enhance +15 Pity,0.0,10,10,10,0.0,true,true
enhance_plus20,Enhance +20 Pity,0.0,5,5,5,0.0,true,true
season_boss,Season Boss Drop,0.10,10,7,5,0.10,true,false
```

## 5.4 JSON Schema

`pity_config.json`:
```json
{
  "name": "pity_config",
  "rows": [
    {
      "id": "equipment_legend",
      "display_name": "Legendary Equipment",
      "base_rate": 0.0005,
      "guaranteed_at": 800,
      "soft_pity_threshold": 600,
      "fail_stack_cap": 300,
      "fail_stack_bonus": 0.0005,
      "soft_pity_enabled": true,
      "show_progress": true
    }
  ]
}
```

---

# 6. Formula Architecture

## 6.1 Core Roll Formula

```csharp
public static bool Roll(ref PityRecord rec, PityConfigSO cfg)
{
    bool hardPity = rec.pityCount >= cfg.guaranteedAt;
    bool success;

    if (hardPity)
    {
        success = true;
        LogAudit(rec, cfg, true, wasHardPity: true);
    }
    else
    {
        float effective = ComputeEffectiveRate(rec, cfg);
        float roll = NextFloat01();
        success = roll < effective;
        LogAudit(rec, cfg, success, wasHardPity: false,
                 wasSoftPity: rec.pityCount >= cfg.softPityThreshold);
    }

    if (success) { rec.pityCount = 0; rec.failStack = 0; }
    else
    {
        rec.pityCount++;
        rec.failStack = Math.Min(rec.failStack + 1, cfg.failStackCap);
    }
    return success;
}

static float ComputeEffectiveRate(PityRecord rec, PityConfigSO cfg)
{
    float stackRate = cfg.baseRate + rec.failStack * cfg.failStackBonus;

    if (cfg.softPityEnabled && rec.pityCount >= cfg.softPityThreshold)
    {
        float progress = (float)(rec.pityCount - cfg.softPityThreshold)
                       / (cfg.guaranteedAt - cfg.softPityThreshold);
        float softRate = cfg.baseRate + progress * (1f - cfg.baseRate);
        return Math.Max(stackRate, softRate);
    }
    return Math.Min(stackRate, 1f);
}
```

## 6.2 XorShift64 RNG

```csharp
static ulong _state;  // initialized from server-side seed per player

public static void InitSeed(ulong serverSeed) => _state = serverSeed;

static ulong NextUlong()
{
    _state ^= _state << 13;
    _state ^= _state >> 7;
    _state ^= _state << 17;
    return _state;
}

public static float NextFloat01() => (NextUlong() >> 11) * (1.0f / (1L << 53));
```

## 6.3 Rate Visualization (UI)

```
ShowPityProgress(rec, cfg) =
  if !cfg.show_progress: return hidden

  if rec.pityCount >= cfg.softPityThreshold:
    label = "Sắp guaranteed!"
    progress = rec.pityCount / cfg.guaranteedAt  (yellow bar)
  else:
    label = f"{rec.pityCount}/{cfg.guaranteedAt}"
    progress = rec.pityCount / cfg.guaranteedAt  (blue bar)
```

## 6.4 Enhance Pity (special case)

```
Enhance pity không có base_rate — chỉ có hard pity (auto-success):
  enhance_plus10: sau 30 thất bại liên tiếp +9→+10 → lần 31 guaranteed
  enhance_plus15: sau 10 thất bại liên tiếp +14→+15 → guaranteed
  enhance_plus20: sau 5 thất bại liên tiếp +19→+20 → guaranteed

Khác pity thường: fail_stack không tăng rate — chỉ pity_count quan trọng
```

---

# 7. Power Budget

Pity system không đóng góp power — nó là protection mechanism. Items được delivered sau pity trigger carry their own power stats.

---

# 8. Economy Impact

Pity system kiểm soát **kỳ vọng loot economy**:
- Mean attempts đến success = 1/effective_rate (với soft pity: giảm variance)
- Variance giảm → player planning tốt hơn → ít hoarding
- Hard pity = guaranteed floor → ít frustration churn

---

# 9. Anti Power Creep

Pity system không tăng power — nó chỉ ensures delivery. Tần suất nhận item tăng không ảnh hưởng power budget vì budget is về stat %, không về item count.

---

# 10. Progression Table

| Pity Type | Roll 1 | Roll 100 (stack) | Roll guarantee |
|---|---|---|---|
| equipment_legend | 0.05% | ~0.10% (stack) | 800 rolls |
| relic_legend | 0.1% | ~0.20% | 500 rolls |
| artifact fragment | 2.0% | ~4.0% | 50 kills |
| enhance +10 | (hard pity only) | — | 30 fails |
| creature_legend | 1% | ~4% | 100 attempts |

---

# 11. Reward Structure

Pity không có reward itself — nó ensures reward delivery từ các hệ thống khác.

---

# 12. RNG Design

- Algorithm: XorShift64 (period 2^64 - 1, non-zero seed)
- Seed: Per-player, server-generated at account creation
- Storage: Encrypted in server memory (không lưu plain-text)
- Audit: Mọi roll log với seed_state snapshot (để reproduce khi dispute)
- Thread safety: One RNG instance per player session (không share)

---

# 13. Anti Bad Luck System

Đây chính là hệ thống chống bad luck. Summary:

| Layer | Mechanism |
|---|---|
| Layer 1: Fail Stack | Rate tăng theo từng fail |
| Layer 2: Soft Pity | Rate tăng mạnh sau 75% of guarantee |
| Layer 3: Hard Pity | 100% guarantee at N rolls |
| Layer 4: Enhance Pity | Auto-success at specific thresholds |

---

# 14. Collection Integration

"Pity History" UI — hiển thị current pity count cho mỗi loại item (nếu show_progress = true).

---

# 15. Achievement Integration

| Achievement | Condition |
|---|---|
| Lucky First | Succeed on first attempt |
| Patient Hunter | Reach soft pity zone before success |
| Hard Earned | Trigger hard pity guarantee |

---

# 16. Season Integration

Season pity: seasonal boss drop có pity riêng (reset mỗi season).

---

# 17. PvE Integration

Pity áp dụng cho mọi PvE loot: boss drop, dungeon chest, raid reward.

---

# 18. PvP Integration

Không có pity cho PvP rewards (PvP reward là currency/cosmetic, không rare).

---

# 19. Social Integration

Pity không chia sẻ giữa players. Guild: không có guild pity (avoid exploitation).

---

# 20. Technical Architecture

## Class Diagram

```
PityConfigSO : ScriptableObject
├── string id, displayName
├── float baseRate, failStackBonus
├── int guaranteedAt, softPityThreshold, failStackCap
├── bool softPityEnabled, showProgress

PityManager (static, server-side)
├── static Dictionary<string, PityConfigSO> _configs
├── Roll(ref PityRecord, PityConfigSO) : bool
├── ComputeEffectiveRate(PityRecord, PityConfigSO) : float
├── GetProgressPercent(PityRecord, PityConfigSO) : float
├── IsInSoftPity(PityRecord, PityConfigSO) : bool
├── InitSeed(ulong serverSeed) : void
├── NextFloat01() : float
└── LogAudit(...)

PityAuditService
├── Log(playerId, pityType, result, preState, postState, rngState)
├── QueryPlayerHistory(playerId, pityType, limit) : AuditEntry[]
└── ReproduceRoll(seedState, config) : bool  [for dispute resolution]
```

---

# 21. Save Data Architecture

```json
"pity": {
  "equipment_legend": {"pity_count": 234, "fail_stack": 150},
  "relic_epic":       {"pity_count": 45,  "fail_stack": 30},
  "enhance_plus10":   {"pity_count": 12,  "fail_stack": 12},
  "creature_legend":  {"pity_count": 67,  "fail_stack": 40}
}
```

Dirty: `"pity.equipment_legend"` — per-type dirty tracking. Immediate send on every roll.

---

# 22. Network Architecture

Pity state không gửi từ client — server-authoritative hoàn toàn.
Client only receives:
```json
{"pity_progress": {"equipment_legend": {"count": 234, "max": 800, "in_soft_pity": false}}}
```
(Không gửi fail_stack — chống exploit)

---

# 23. Security

| Threat | Prevention |
|---|---|
| Fake pity count | Server maintains authoritative count |
| Reset pity cheat | Pity reset only server-initiated (on success) |
| Predict RNG | Seed never exposed; client only gets result |
| Audit manipulation | Audit log append-only, no delete/update |

---

# 24. LiveOps Hooks

```
event.pity_rate_multiplier = 1.5          (bonus event)
event.soft_pity_threshold_reduction = 0.9 (50% of guarantee instead of 75%)
flag.enhance_pity_enabled = true
remote_config.legend_guarantee_at = 800
```

---

# 25. Content Pipeline

```
Google Sheet "Pity Config"
  → pity_config.csv (16 rows)
  → gen_pity_config.py (validate: rates > 0, guaranteed > soft_threshold)
  → pity_config.json
  → PityConfigSO[] (Editor import)
```

---

# 26. Future Expansion

- Shared pity pool (family): pity_type "relic_any" shared across all relic types
- Account-wide pity (không reset per character) — already designed this way
- Pity inheritance: when a system retires, pity count transfers to new system

---

# 27. Production Risks

| Rủi ro | Mức |
|---|---|
| Client-side pity calculation (hack risk) | CRITICAL |
| Pity count desync client/server | HIGH |
| Audit log too large | MEDIUM |

---

# 28. Mitigation Plan

| Rủi ro | Giải pháp |
|---|---|
| Client-side pity | Server-only Roll(); client displays result only |
| Desync | Client requests pity sync on login; server is authoritative |
| Audit log size | Partition by month; archive >90 days to cold storage |

---

# 29. Unity Implementation Plan

```
Assets/script/SlimeMMO/Save/Pity/
├── PityManager.cs      (static, mirrors server logic for PvE prediction)
├── PityConfigSO.cs     (ScriptableObject, loads from pity_config.json)
└── PityUIBridge.cs     (reads show_progress, displays bar to player)

Assets/Resources/GameData/
└── pity_config.json

generators/
└── gen_pity_config.py
```

---

# 30. Final Verdict

**Status: BLOCKER**

PityManager chỉ có code snippet trong SAVE_DATA_SCHEMA.md — chưa có full implementation, chưa có PityConfigSO, chưa có audit log. Implement trong Sprint 2A cùng với SaveManager.
