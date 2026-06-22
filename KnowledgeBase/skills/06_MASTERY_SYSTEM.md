# SYSTEM 06 — Mastery System
> Status: BLOCKER → thiếu hoàn toàn
> Power Budget: 3% | Ngày: 2026-06-13

---

# 1. Purpose

Mastery là hệ thống **chuyên sâu kỹ năng** — mỗi skill có Mastery level riêng, tăng bằng cách sử dụng skill đó trong combat. Tạo cảm giác "mài giũa" kỹ năng và khuyến khích player chọn "main skills".

---

# 2. Design Philosophy

- **Usage-based leveling:** Mastery tăng khi dùng skill, không phải khi level nhân vật
- **Per-skill, not per-class:** Player có thể master bất kỳ skill nào họ sử dụng
- **Max Mastery 10:** Đủ tiến trình dài mà không quá phức tạp
- **Stat contribution: 3%** (cộng từ tất cả mastered skills)
- **Diminishing returns:** Mỗi level Mastery thêm ít hơn level trước

---

# 3. Core Loop

```
[Use skill in combat] → [Mastery EXP +1 per use]
        │
        ▼
[Mastery Level Up (1→10)]
        │
        ▼
[Skill Enhancement Unlocked per level:]
  - Lv2: -5% cooldown
  - Lv4: +5% base damage/effect
  - Lv6: +10% base damage/effect
  - Lv8: +1 additional effect
  - Lv10: Skill visual upgrade + max bonus
        │
        ▼
[Mastery stat contribution to Power Budget]
```

---

# 4. Progression Loop

| Mastery Level | EXP Required | Bonus |
|---|---|---|
| 0→1 | 50 uses | -5% CD |
| 1→2 | 150 uses | +0.1% stat |
| 2→3 | 300 uses | +0.1% stat |
| 3→4 | 600 uses | +5% skill eff |
| 4→5 | 1,200 uses | +0.1% stat |
| 5→6 | 2,500 uses | +10% skill eff |
| 6→7 | 5,000 uses | +0.1% stat |
| 7→8 | 10,000 uses | +1 bonus effect |
| 8→9 | 20,000 uses | +0.1% stat |
| 9→10 | 40,000 uses | Max bonus + visual |

**Stat mastery contribution:** Lv2,3,5,7,9 each add 0.1%. Max mastery 1 skill = 0.5%.

---

# 5. Data Architecture

## 5.1 Entity

```
MasteryConfigSO
├── MasteryLevel[] levels (10 entries)
│   ├── level: int
│   ├── uses_required: int
│   ├── stat_bonus_pct: float   (0 or 0.001)
│   ├── cooldown_reduction: float (0.05 at lv1)
│   ├── skill_effect_boost: float (0.05 at lv4, 0.10 at lv6)
│   ├── extra_effect: string    (desc of bonus at lv8)
│   └── visual_upgrade: bool    (true at lv10)

MasteryRecord (per player per skill)
├── skill_id: string
├── level: 0-10
└── exp: int (uses accumulated)
```

## 5.2 Database Tables

```sql
CREATE TABLE mastery_config (
    mastery_level       TINYINT PRIMARY KEY,
    uses_required       INT NOT NULL,
    stat_bonus_pct      FLOAT NOT NULL DEFAULT 0,
    cooldown_reduction  FLOAT NOT NULL DEFAULT 0,
    skill_effect_boost  FLOAT NOT NULL DEFAULT 0,
    extra_effect_desc   VARCHAR(128),
    visual_upgrade      TINYINT NOT NULL DEFAULT 0
);

CREATE TABLE player_mastery (
    player_id           BIGINT NOT NULL,
    skill_id            VARCHAR(64) NOT NULL,
    mastery_level       TINYINT NOT NULL DEFAULT 0,
    mastery_exp         INT NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, skill_id)
);
```

## 5.3 ID Rules

Mastery records keyed by `player_id + skill_id`. No separate mastery IDs needed.

## 5.4 CSV Schema

`mastery_config.csv`:
```
mastery_level,uses_required,stat_bonus_pct,cooldown_reduction,skill_effect_boost,extra_effect_desc,visual_upgrade
0,0,0,0,0,,false
1,50,0,0.05,0,"Cooldown -5%",false
2,150,0.001,0,0,,false
3,300,0.001,0,0,,false
4,600,0,0,0.05,"Damage +5%",false
5,1200,0.001,0,0,,false
6,2500,0,0,0.10,"Damage +10%",false
7,5000,0.001,0,0,,false
8,10000,0,0,0,"Unlock bonus effect",false
9,20000,0.001,0,0,,false
10,40000,0,0.05,0.05,"Full upgrade",true
```

## 5.5 JSON Schema (player mastery)

```json
"mastery": {
  "sk_war_01": {"level": 8, "exp": 14200},
  "sk_war_02": {"level": 5, "exp": 1800},
  "sk_war_05": {"level": 3, "exp": 480},
  "sk_mag_01": {"level": 1, "exp": 65}
}
```

---

# 6. Formula Architecture

## 6.1 Mastery Stat Contribution

```
MasteryStatPct(skill_id) = ∑ stat_bonus_pct[level] for level in [1..mastery_level]
  Max per skill = 0.5% (levels 2,3,5,7,9 each +0.1%)

TotalMasteryPct = ∑ MasteryStatPct(skill_i) for all skills
  Player typically masters 3-6 skills → 1.5% - 3%
  Hard cap via budget: 3%
```

## 6.2 Skill Enhancement from Mastery

```
EffectiveCooldown(skill, mastery_level) = base_cooldown × (1 - cd_reduction_total)
  cd_reduction_total = 0.05 (lv1) + 0.05 (lv10) = 0.10 (10% total, per skill)

EffectiveDamage(skill, mastery_level) = base × (1 + effect_boost_total)
  effect_boost = 0.05 (lv4) + 0.10 (lv6) = 0.15 (15% skill effectiveness boost)
  Note: This is a SKILL effectiveness boost, separate from power budget stat
  → Already captured within skill_mult budget (15%)

Bonus effect at lv8: unique per skill (e.g. Power Strike lv8: stun target 0.5s)
```

## 6.3 EXP Tracking

```
On skill use in combat: mastery_exp[skill_id] += 1
if mastery_exp[skill_id] >= uses_required[next_level]:
    mastery_level[skill_id] += 1
    mastery_exp[skill_id] -= uses_required[reached_level]
    TriggerMasteryLevelUpEvent(skill_id, new_level)
```

---

# 7. Power Budget

**Allocated: 3%**
- Player masters ~6 skills at max: 6 × 0.5% = 3% (theoretical max)
- Practical: 3-5 skills at max → 1.5-2.5%
- Budget cap enforced: `PowerBudgetManager.ValidateSystemMax(totalMastery, "mastery", 0.03f)`
- Skill effectiveness boost (15%) is INSIDE skill_mult budget, not mastery budget

---

# 8. Economy Impact

Mastery là usage-based — không cần gold. Indirect impact:
- Player stays in specific content longer to master skills → more gold/loot generated
- No economy sink directly

---

# 9. Anti Power Creep

- Fixed 10 levels per skill, stat cố định tại mỗi level
- 3% hard cap
- Skill effectiveness boost (15%) non-stackable with power budget

---

# 10. Progression Table

| # Skills Mastered (Lv10) | Total Stat | Time Estimate |
|---|---|---|
| 1 | 0.5% | ~40,000 uses = ~3 months |
| 2 | 1.0% | ~6 months |
| 3 | 1.5% | ~9 months |
| 6 (max useful) | 3.0% | ~18 months |

---

# 11. Reward Structure

| Mốc | Reward |
|---|---|
| First skill Mastery Lv5 | Achievement + title |
| Any skill Mastery Lv10 | Skill visual upgrade |
| 3 skills Lv10 | "Grandmaster" title |
| All main skills Lv10 | "Ascended Master" + unique aura |

---

# 12. RNG Design

Mastery là deterministic (count uses → level up). Không có RNG.

---

# 13. Anti Bad Luck System

Không áp dụng — Mastery là deterministic progression.

---

# 14. Collection Integration

"Mastery Board" trong Collection Hall — hiển thị mỗi skill và mastery level. Progress bar per skill.

---

# 15. Achievement Integration

| Achievement | Condition |
|---|---|
| First Mastery | Bất kỳ skill lên Mastery 1 |
| Dedicated | 1 skill Mastery 10 |
| Dual Master | 2 skills Mastery 10 |
| Grand Master | 3 skills Mastery 10 |

---

# 16. Season Integration

Season event: "Mastery Week" — EXP per use × 3 trong 7 ngày.

---

# 17. PvE Integration

Mastery EXP chỉ đếm trong combat (không countfarm/auto AFK). Raid boss kills count × 10 per skill used.

---

# 18. PvP Integration

Mastery stat áp dụng. Skill enhancement áp dụng. Không phân biệt PvP/PvE cho mastery count.

---

# 19. Social Integration

Party: nếu party skill cùng loại đều mastered → synergy bonus (utility: +1% party EXP, không power).

---

# 20. Technical Architecture

## Class Diagram

```
MasteryConfigSO : ScriptableObject
└── MasteryLevelData[] levels

MasteryManager : MonoBehaviour
├── Dictionary<string, MasteryRecord> _masteries
├── OnSkillUsed(skillId)
├── GetMasteryLevel(skillId) : int
├── GetStatContribution(skillId) : float
├── GetTotalStatPct() : float
├── GetSkillCDReduction(skillId) : float
├── GetSkillEffectBoost(skillId) : float
└── ValidateBudget() : bool

MasteryEventBus (static)
├── OnMasteryLevelUp : Action<string, int>
└── OnMasteryMaxReached : Action<string>
```

---

# 21. Save Data Architecture

```json
"mastery": {
  "sk_war_01": {"level": 8, "exp": 14200},
  "sk_war_05": {"level": 10, "exp": 0}
}
```

Dirty: `"mastery.sk_war_01"` — per-skill dirty tracking.

---

# 22. Network Architecture

Delta save triggered khi: mastery level up (immediate), or every 100 uses (batch).
Server validates: mastery_level ≤ 10, total stat ≤ 3%.

---

# 23. Security

| Threat | Prevention |
|---|---|
| Fake mastery level | Server tracks uses in DB, validates exp |
| Offline use farming | Uses only counted when server-connected |
| Spam use | Rate limit: 20 skill uses/second max |

---

# 24. LiveOps Hooks

```
event.mastery_exp_multiplier = 3.0  (Mastery Week)
flag.mastery_system_enabled = true
remote_config.max_mastery_level = 10
remote_config.mastery_exp_per_use = 1
```

---

# 25. Content Pipeline

```
Google Sheet "Mastery Config"
  → mastery_config.csv (10 rows)
  → MasteryConfigSO (direct import, simple table)
  
Skill DB (skill_db.json) already has skill list
  → MasteryManager references skill_id from SkillDataSO
```

---

# 26. Future Expansion

- Mastery Level 11-15 (Year 2): +0.5% more → lấy budget từ nguồn khác
- "Mastery Resonance": 2 skills cùng category all mastered → bonus passive
- Cross-skill mastery synergy tree

---

# 27. Production Risks

| Rủi ro | Mức |
|---|---|
| 40,000 uses per skill quá nhiều | HIGH |
| Player neglects secondary skills | MEDIUM |

---

# 28. Mitigation Plan

| Rủi ro | Giải pháp |
|---|---|
| Too many uses | Raid/Boss = ×10 uses; party = ×2 uses; event ×3 |
| Neglect secondary | Secondary skills mastery give utility bonus (not stat) as incentive |

---

# 29. Unity Implementation Plan

```
Assets/script/SlimeMMO/Mastery/
├── MasteryConfigSO.cs
├── MasteryManager.cs
├── MasteryEventBus.cs
└── SlimeMMO.Mastery.asmdef
```

---

# 30. Final Verdict

**Status: BLOCKER**

3% budget thiếu. Usage-based system tạo long-term engagement loop. Implement sau Relic/Artifact, có thể release với Beta patch 1.
