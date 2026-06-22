# SYSTEM 02 — Relic System
> Status: BLOCKER → thiếu hoàn toàn
> Power Budget: 5% | Ngày: 2026-06-13

---

# 1. Purpose

Relic là **trang bị phụ không gắn vào body** — bộ sưu tập di vật cổ đại cung cấp bonus stat và hiệu ứng thụ động. 4 slot relic, mỗi slot độc lập. Khuyến khích farming đa dạng biome.

---

# 2. Design Philosophy

- **4 Slot độc lập** — mỗi slot có hướng stat riêng (ATK, DEF, HP, Utility)
- **Rank 1-5** — progression dài, không P2W
- **Cosmetic aura** khi equip — visual reward
- **Tổng 5% budget** — không bao giờ vượt

---

# 3. Core Loop

```
[Kill Boss / Clear Dungeon] → [Relic Drop (pity guaranteed)]
        │
        ▼
[Identify Relic] → [Equip vào slot]
        │
        ▼
[Feed duplicate relics → Relic EXP]
        │
        ▼
[Rank Up: Rank 1→5] → [Stat bonus tăng]
        │
        ▼
[Relic Set Bonus khi 2+3+4 relics cùng family]
```

---

# 4. Progression Loop

| Rank | EXP cần | Stat bonus | Visual |
|---|---|---|---|
| 1 | 0 | +0.25% | Glow nhỏ |
| 2 | 500 | +0.50% | Glow rõ |
| 3 | 1,500 | +0.75% | Aura nhỏ |
| 4 | 3,500 | +1.00% | Aura đầy đủ |
| 5 | 8,000 | +1.25% | Legendary aura |

Tổng 4 slot ở Rank 5: 4 × 1.25% = **5.0%** ✅

---

# 5. Data Architecture

## 5.1 Entity

```
RelicInstance
├── uid: BIGINT
├── relic_id: string         (ref RelicDataSO)
├── slot_index: 0-3
├── rank: 1-5
├── exp: int
└── acquired_at: datetime

RelicDataSO
├── id: string               ("relic_fire_03")
├── name: string
├── family: string           ("Fire","Earth","Water","Wind","Light","Dark","Void")
├── slot_affinity: 0-3       (preferred slot, not locked)
├── rarity: Common/Rare/Epic/Legend
├── biome: int               (primary drop biome)
├── stat_type: string        ("atk_pct","def_pct","hp_pct","utility")
├── base_pct_r1: float       (0.0025)
├── pct_per_rank: float      (0.0025)
├── max_rank: 5
├── set_family: string
├── lore: string
└── visual_effect: string
```

## 5.2 Database Tables

```sql
CREATE TABLE relic_data (
    id              VARCHAR(32) PRIMARY KEY,
    name            VARCHAR(64) NOT NULL,
    family          VARCHAR(16) NOT NULL,
    slot_affinity   TINYINT NOT NULL DEFAULT 0,
    rarity          VARCHAR(16) NOT NULL,
    biome           TINYINT NOT NULL,
    stat_type       VARCHAR(32) NOT NULL,
    base_pct_r1     FLOAT NOT NULL,
    pct_per_rank    FLOAT NOT NULL,
    set_family      VARCHAR(32),
    lore            TEXT,
    visual_effect   VARCHAR(64)
);

CREATE TABLE player_relic (
    player_id   BIGINT NOT NULL,
    slot_index  TINYINT NOT NULL,
    relic_id    VARCHAR(32) REFERENCES relic_data(id),
    rank        TINYINT NOT NULL DEFAULT 1,
    exp         INT NOT NULL DEFAULT 0,
    acquired_at DATETIME NOT NULL,
    PRIMARY KEY (player_id, slot_index)
);

CREATE TABLE relic_rank_config (
    rank        TINYINT PRIMARY KEY,
    exp_required INT NOT NULL,
    stat_bonus_pct FLOAT NOT NULL,
    visual_tier VARCHAR(32)
);
```

## 5.3 ID Rules

Format: `relic_{family}_{biome:02d}_{variant:02d}`
- `relic_fire_03_01` — Fire family, biome 3, variant 1
- `relic_void_21_03` — Void family, biome 21, variant 3

## 5.4 CSV Schema

`relic_db.csv`:
```
id,name,family,slot_affinity,rarity,biome,stat_type,base_pct_r1,pct_per_rank,set_family,lore,visual_effect
relic_fire_03_01,Ember Core,Fire,0,Epic,3,atk_pct,0.0025,0.0025,fire_set,Tìm thấy trong tàn tích Volcanic Ridge,vfx_relic_fire_glow
relic_fire_03_02,Lava Shard,Fire,2,Rare,3,hp_pct,0.0025,0.0025,fire_set,Một mảnh dung nham đã nguội,vfx_relic_fire_small
relic_earth_06_01,Ancient Root,Earth,1,Epic,6,def_pct,0.0025,0.0025,earth_set,Rễ cây nghìn tuổi,vfx_relic_earth_glow
relic_void_21_01,Void Fragment,Void,3,Legendary,21,utility,0.0025,0.0025,void_set,Mảnh vỡ từ giữa hai chiều,vfx_relic_void_aura
```

## 5.5 JSON Schema

```json
{
  "name": "relic_db",
  "count": 120,
  "rows": [
    {
      "id": "relic_fire_03_01",
      "name": "Ember Core",
      "family": "Fire",
      "slot_affinity": 0,
      "rarity": "Epic",
      "biome": 3,
      "stat_type": "atk_pct",
      "base_pct_r1": 0.0025,
      "pct_per_rank": 0.0025,
      "max_rank": 5,
      "set_family": "fire_set",
      "lore": "Tìm thấy trong tàn tích Volcanic Ridge.",
      "visual_effect": "vfx_relic_fire_glow"
    }
  ]
}
```

---

# 6. Formula Architecture

## 6.1 Stat Contribution

```
RelicStatPct(relic, rank) = base_pct_r1 + (rank - 1) × pct_per_rank
                          = 0.0025 + (rank-1) × 0.0025
                          = rank × 0.0025

TotalRelicPower = ∑ RelicStatPct(slot_i, rank_i) for i in [0,3]
               ≤ 4 × (5 × 0.0025) = 4 × 0.0125 = 0.05 = 5% ✅
```

## 6.2 EXP Requirements

```
ExpRequired(rank → rank+1) = 500 × 2^(rank-1)
  Rank 1→2: 500
  Rank 2→3: 1000
  Rank 3→4: 2000
  Rank 4→5: 4000
  Total to Rank 5: 7500 EXP
```

## 6.3 EXP from Sacrificing

```
ExpFromSacrifice(relic, rank) = 100 × rank
  Rank 1: 100 EXP
  Rank 2: 200 EXP
  Rank 3: 300 EXP
```

## 6.4 Set Bonus (family matching)

```
RelicSetBonus(n_matching) =
  n=2: +0.1% all stats (utility bonus, not budget power)
  n=3: +0.2% cooldown reduction
  n=4: +0.3% EXP gain bonus
  → Set bonus là tiện ích (không tính vào 5% power budget)
```

## 6.5 Drop Rate

```
RelicDropRate(biome, bossType) =
  NormalBoss: 2% base
  EliteBoss:  5% base
  RaidBoss:   15% base
  WorldBoss:  30% base
  → Pity: sau 50 rolls không có relic → guaranteed 1
```

---

# 7. Power Budget

**Tổng allocated: 5.0%**
- 4 slots × Rank 5 (1.25%) = 5.0% (hard cap)
- Set bonus không tính vào budget (utility only)
- `PowerBudgetManager.ValidateSystemMax(totalRelicPct, "relic", 0.05f)`

---

# 8. Economy Impact

| Tài nguyên | Source | Sink |
|---|---|---|
| Relic shard | Boss drop, event reward | Sacrifice để lấy EXP |
| Gold | Earned từ gameplay | Rank-up fee (100×rank×1000 gold) |
| Relic EXP | Sacrifice + event | Consumed khi rank up |

**Anti-inflation:**
- Relic không bán được → không tạo gold inflation
- Sacrifice system đốt excess relics
- Relic slot chỉ 4 → player không trữ vô hạn active

---

# 9. Anti Power Creep

- Stat scale đã cố định (0.25% → 1.25%) — designer không thể tăng base_pct mà không reset budget
- Power cap được assert server-side
- Không có relic vượt rank 5

---

# 10. Progression Table

| Rank | EXP Required | Total EXP | Stat Bonus | Gold Cost |
|---|---|---|---|---|
| 1 | 0 | 0 | 0.25% | 0 |
| 2 | 500 | 500 | 0.50% | 100,000 |
| 3 | 1,000 | 1,500 | 0.75% | 300,000 |
| 4 | 2,000 | 3,500 | 1.00% | 700,000 |
| 5 | 4,000 | 7,500 | 1.25% | 1,500,000 |

---

# 11. Reward Structure

| Mốc | Reward |
|---|---|
| Trang bị relic lần đầu | Achievement "First Relic" |
| Rank 3 relic đầu tiên | Title "Relic Hunter" |
| Cả 4 slot đều rank 5 | Title "Relic Master" + cosmetic aura |
| Full set (4 cùng family) | "Ancient Collector" achievement |

---

# 12. RNG Design

```
RelicDrop = WeightedRoll(drop_table_boss_{biome})
  Weight table gồm: Common 60%, Uncommon 25%, Rare 10%, Epic 4%, Legend 1%
  
RelicType = WeightedRoll(relic_pool_biome_{N})
  Equal weight giữa các relic trong pool của biome đó

Seed: Server XorShift64
```

---

# 13. Anti Bad Luck System

| Pity Type | Base Rate | Hard Pity | Fail Stack Bonus |
|---|---|---|---|
| relic_any | 5% (boss) | 20 kills | +5% |
| relic_rare | 1% | 100 | +1% |
| relic_epic | 0.5% | 200 | +0.5% |
| relic_legend | 0.1% | 500 | +0.1% |

**Soft pity:** Khi kills ≥ 80% of hard pity → rate tăng 3× tuyến tính đến hard pity.

---

# 14. Collection Integration

Collection Hall: "Relic Compendium" — hiển thị tất cả 120 relic, track discovered/owned.
`BitFlags.Set(relicDiscoveredBits, relicIndex)` khi lần đầu nhận relic loại đó.

---

# 15. Achievement Integration

| Achievement | Condition |
|---|---|
| First Relic | Nhận relic đầu tiên |
| Relic Collector I/II/III | 10/30/60 relic types discovered |
| Full Rank | 1 relic đạt rank 5 |
| Full Power | Cả 4 slot rank 5 |
| Family Master | 4 relics cùng family rank 5 |

---

# 16. Season Integration

Season "Relic Season": drop rate relic tăng 50% trong 2 tuần. Có seasonal relic exclusive (cosmetic only, stat = thường).

---

# 17. PvE Integration

| Content | Relic Drop Weight |
|---|---|
| Normal Dungeon | ×1.0 |
| Hard Dungeon | ×2.0 |
| Raid | ×4.0 |
| World Boss | ×6.0 |
| Season Boss | ×3.0 |

---

# 18. PvP Integration

Relic stat áp dụng bình thường trong PvP nhưng toàn bộ FinalDamage × 0.5 (PvP cap). Không có relic exclusive cho PvP.

---

# 19. Social Integration

Guild: "Relic Treasury" — guild member donate duplicate relics → guild event buff (utility: +5% gold drop 24h, không power).

---

# 20. Technical Architecture

## Class Diagram

```
RelicDataSO : ScriptableObject
├── string id, name, family
├── int slotAffinity, biome
├── string rarity, statType
├── float basePctR1, pctPerRank
├── int maxRank
├── string setFamily, lore, visualEffect

RelicManager : MonoBehaviour
├── RelicSave[] _slots (4)
├── EquipRelic(slot, relicId) : bool
├── UnequipRelic(slot) : void
├── RankUp(slot) : bool
├── Sacrifice(relicId) : int  (return EXP)
├── GetTotalPowerPct() : float
├── GetSetBonus() : RelicSetBonus
└── ValidateBudget() : bool

RelicRankConfigSO : ScriptableObject
└── RankEntry[] ranks (rank, exp, statPct, visual)
```

## Manager List

| Manager | Trách nhiệm |
|---|---|
| RelicManager | Equip, rank up, sacrifice, budget check |
| RelicDropManager | Drop table roll với pity |
| RelicSetManager | Detect family set, apply bonus |

## SO List

| SO | Dữ liệu |
|---|---|
| RelicDataSO | Per-relic stats |
| RelicRankConfigSO | Rank EXP table |
| RelicDropTableSO | Drop weights per biome |

---

# 21. Save Data Architecture

```json
"relics": [
  {"slot": 0, "relic_id": "relic_fire_03_01", "rank": 4, "exp": 3200},
  {"slot": 1, "relic_id": "relic_earth_06_01", "rank": 3, "exp": 1100},
  {"slot": 2, "relic_id": "relic_void_21_01", "rank": 5, "exp": 0},
  {"slot": 3, "relic_id": null, "rank": 0, "exp": 0}
]
```

Dirty fields: `"relics.0"`, `"relics.1"`, `"relics.2"`, `"relics.3"`

---

# 22. Network Architecture

Client gửi delta khi: equip/unequip, rank up, sacrifice.
Server validates: `RelicPower ≤ 5%`, `rank ≤ 5`, `sufficient gold`.

---

# 23. Security

| Threat | Prevention |
|---|---|
| Fake rank | Server recalculates từ exp, không trust rank field |
| Duplicate sacrifice | Transaction lock per relic uid |
| Phantom relic | Server verifies relic_id exists trong relic_data table |

---

# 24. LiveOps Hooks

```
event.relic_drop_rate_multiplier = 2.0  (seasonal)
event.relic_rank_gold_discount = 0.5    (weekend event)
flag.relic_system_enabled = true
remote_config.relic_max_rank = 5
```

---

# 25. Content Pipeline

```
Google Sheet "Relic DB"
  → relic_db.csv
  → gen_relic_db.py (sinh 120 relics: 21 biomes × ~6 variants)
  → relic_db.json
  → RelicDataSO[] (Editor import, DataImporter.ImportRelics())
```

---

# 26. Future Expansion

- Rank 6-7 có thể thêm trong Year 2 nhưng phải lấy budget từ hệ thống khác
- "Relic Fusion" — 2 relics cùng family → 1 relic mới (không tăng power, chỉ combine hiệu ứng)
- Relic challenge dungeon — dungeon yêu cầu specific relic family

---

# 27. Production Risks

| Rủi ro | Mức |
|---|---|
| Drop rate quá thấp → player frustration | HIGH |
| 120 relics quá nhiều để balance | MEDIUM |
| Set bonus vô tình overlap với budget | HIGH |

---

# 28. Mitigation Plan

| Rủi ro | Giải pháp |
|---|---|
| Drop rate | Pity 20 boss kills guaranteed + soft pity từ kill 16 |
| 120 relics | Chỉ cần balance stat_type per rarity; family/visual là cosmetic |
| Set bonus | Set bonus không phải stat — chỉ là utility (cooldown, EXP) → không tính budget |

---

# 29. Unity Implementation Plan

```
Assets/script/SlimeMMO/Relic/
├── RelicDataSO.cs
├── RelicRankConfigSO.cs
├── RelicManager.cs
├── RelicDropManager.cs
└── SlimeMMO.Relic.asmdef

Assets/script/SlimeMMO/Editor/
└── RelicImporter.cs (thêm ImportRelics() vào DataImporter)

Assets/Resources/GameData/
└── relic_db.json

generators/
└── gen_relic_db.py
```

---

# 30. Final Verdict

**Status: BLOCKER**

Relic là 5% power budget đang thiếu hoàn toàn. Không implement = power budget không thể đạt đúng 100% trong late game. Cần implement trước khi closed beta.
