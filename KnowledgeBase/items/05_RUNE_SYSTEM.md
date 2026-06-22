# SYSTEM 05 — Rune System
> Status: BLOCKER → thiếu hoàn toàn
> Power Budget: 3% (Rune share từ Trait+Rune = 6% total)
> Ngày: 2026-06-13

---

# 1. Purpose

Rune là hệ thống **socket vào equipment** để tăng thêm stat. Khác Trait (character-bound), Rune gắn vào item cụ thể — player có thể tháo/lắp. Tạo thêm dimension cho itemization.

---

# 2. Design Philosophy

- **Socket-based:** Equipment có 0-2 rune slots tùy rarity
- **Element-flavored:** 6 rune elements = Fire, Water, Earth, Wind, Light, Dark
- **Tiered:** 5 tiers, stat tăng theo tier
- **Removable:** Có thể tháo nhưng cần Extraction Tool (farmable)
- **Power cap: 3%** shared với Trait → cộng lại không vượt 6%

---

# 3. Core Loop

```
[Farm biome / craft / boss drop] → [Rune obtained]
          │
          ▼
[Open equipment slot] → [Socket rune]
          │
          ▼
[Stat bonus applies immediately]
          │
          ▼
[Upgrade rune: combine 3 same tier → 1 higher tier]
          │
          ▼
[Element resonance bonus khi 2+ same element socketed]
```

---

# 4. Progression Loop

| Tier | Stat Range | Craft Recipe | Drop Biome Range |
|---|---|---|---|
| 1 | +0.02% | 5 base mats | Biome 1-5 |
| 2 | +0.04% | 3 T1 runes | Biome 6-10 |
| 3 | +0.06% | 3 T2 runes | Biome 11-15 |
| 4 | +0.08% | 3 T3 runes | Biome 16-19 |
| 5 | +0.10% | 3 T4 runes | Biome 20-21 |

---

# 5. Data Architecture

## 5.1 Entity

```
RuneDataSO
├── id: string               ("rune_fire_t3")
├── name: string             ("Blazing Rune III")
├── element: string          ("Fire")
├── tier: int                (1-5)
├── stat_type: string        ("atk_pct","def_pct","hp_pct","crit_rate","skill_dmg")
├── stat_bonus_pct: float    (tier × 0.02 × 0.01)
├── drop_biome_min: int
├── drop_biome_max: int
├── craft_recipe: string[]   (ingredient IDs)
├── resonance_element: string
└── visual_color: string

EquipmentRuneSlots (extends EquipmentInstance)
├── rune_slot_1: rune_id or null
├── rune_slot_2: rune_id or null
  → Common: 0 slots
  → Uncommon: 0 slots
  → Rare: 1 slot
  → Epic: 1 slot
  → Legendary: 2 slots
```

## 5.2 Database Tables

```sql
CREATE TABLE rune_data (
    id              VARCHAR(32) PRIMARY KEY,
    name            VARCHAR(64) NOT NULL,
    element         VARCHAR(16) NOT NULL,
    tier            TINYINT NOT NULL,
    stat_type       VARCHAR(32) NOT NULL,
    stat_bonus_pct  FLOAT NOT NULL,
    drop_biome_min  TINYINT NOT NULL,
    drop_biome_max  TINYINT NOT NULL,
    visual_color    VARCHAR(16)
);

CREATE TABLE rune_slot_config (
    rarity          VARCHAR(16) PRIMARY KEY,
    slot_count      TINYINT NOT NULL
);

-- Equipment slots already in player_equipment table (rune_slot_1, rune_slot_2)

CREATE TABLE player_rune_inventory (
    player_id   BIGINT NOT NULL,
    rune_id     VARCHAR(32) NOT NULL,
    quantity    INT NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, rune_id)
);

CREATE TABLE rune_craft_recipe (
    result_rune_id  VARCHAR(32) PRIMARY KEY,
    ingredient_1    VARCHAR(32) NOT NULL,
    ingredient_qty  TINYINT NOT NULL DEFAULT 3,
    gold_cost       INT NOT NULL DEFAULT 0
);
```

## 5.3 ID Rules

Format: `rune_{element}_{stat_prefix}_t{tier}`
- `rune_fire_atk_t3` — Fire, ATK, Tier 3
- `rune_dark_crit_t5` — Dark, CritRate, Tier 5
- `rune_wind_spd_t2` — Wind, Speed (utility), Tier 2

## 5.4 CSV Schema

`rune_db.csv`:
```
id,name,element,tier,stat_type,stat_bonus_pct,drop_biome_min,drop_biome_max,visual_color
rune_fire_atk_t1,Fire Rune I,Fire,1,atk_pct,0.0002,1,5,#FF5722
rune_fire_atk_t2,Fire Rune II,Fire,2,atk_pct,0.0004,6,10,#FF7043
rune_fire_atk_t3,Fire Rune III,Fire,3,atk_pct,0.0006,11,15,#FF8A65
rune_fire_atk_t4,Fire Rune IV,Fire,4,atk_pct,0.0008,16,19,#FFAB91
rune_fire_atk_t5,Fire Rune V,Fire,5,atk_pct,0.0010,20,21,#FFCCBC
rune_water_def_t1,Water Rune I,Water,1,def_pct,0.0002,1,5,#0288D1
...
```

Total: 6 elements × 5 stat types × 5 tiers = 150 runes

## 5.5 JSON Schema

```json
{
  "name": "rune_db",
  "count": 150,
  "rows": [
    {
      "id": "rune_fire_atk_t3",
      "name": "Blazing Rune III",
      "element": "Fire",
      "tier": 3,
      "stat_type": "atk_pct",
      "stat_bonus_pct": 0.0006,
      "drop_biome_min": 11,
      "drop_biome_max": 15,
      "visual_color": "#FF8A65"
    }
  ]
}
```

---

# 6. Formula Architecture

## 6.1 Rune Stat Per Item

```
RuneStatPerItem(slot1, slot2) =
  (rune1_stat_pct if slot1 != null else 0)
+ (rune2_stat_pct if slot2 != null else 0)

TotalRuneStat = ∑ RuneStatPerItem(equip_i) for all equipped items
```

## 6.2 Max Budget Calculation

```
Max slots = 9 items × 2 slots (Legendary BIS) = 18 slots
Max stat per slot (Tier 5) = 0.0010 = 0.1%
Theoretical max = 18 × 0.1% = 1.8%

But: BIS all-legendary is late-game goal → normal mid-game max ~0.8%
Designer intent: 3% cap is comfortable headroom
→ If player has all T5 in all slots: 1.8% < 3% ✅
```

## 6.3 Element Resonance Bonus

```
ElementResonance(equipBuild) =
  Count same element runes socketed (across all items)
  2 same element: +0.05% all_stats (utility, NOT in budget)
  4 same element: +0.10% element damage bonus (utility)
  6 same element: +0.15% element damage + cosmetic glow
  → Resonance bonuses are tiny utility, not counted in 3% budget
```

## 6.4 Upgrade Formula

```
UpgradeTier(rune_tier) → rune_tier+1:
  Input: 3 × rune_tier
  Output: 1 × rune_tier+1
  Gold cost: 1000 × tier²
  Success: 100% (no RNG on craft)
```

## 6.5 Extract/Remove

```
ExtractRune(equipment_slot):
  Requires: 1 × Extraction Tool
  Result: rune returned to inventory (100% preserved)
  Extraction Tool: crafted from 5 biome_materials, 500 gold
```

---

# 7. Power Budget

**Allocated: 3%**
- Max theoretical 1.8% (all T5 Legendary BIS)
- Budget 3% gives comfortable headroom for all builds
- `PowerBudgetManager.ValidateSystemMax(totalRunePct, "rune", 0.03f)`

---

# 8. Economy Impact

| Tài nguyên | Source | Sink |
|---|---|---|
| T1-T3 runes | Biome farming | Upgrade to higher tier |
| T4-T5 runes | Biome 16-21, craft | Socket in equipment |
| Gold | Gameplay | Upgrade cost |
| Extraction Tool | Craft | Extract rune |
| Biome materials | Farm | Craft T1 runes + Tools |

**Anti-inflation:**
- T5 rune = 3³ = 27 T2 runes = 81 T1 runes → significant farm time
- Gold sink: upgrade 1 T5 costs 1000×25=25,000 gold
- Extraction Tool consumption prevents free socket-hopping

---

# 9. Anti Power Creep

- Tier 5 is hard cap — no tier 6
- Budget cap server-enforced
- Resonance bonus is utility (not stat) — no creep contribution

---

# 10. Progression Table

| Milestone | Runes State | Total Stat |
|---|---|---|
| Level 100 | T1 runes in 1-2 slots | ~0.02% |
| Level 300 | T2 in 3-4 slots | ~0.1% |
| Level 600 | T3 in 5-6 slots | ~0.2% |
| Level 1000 | T4 in 6-8 slots | ~0.5% |
| Level 1500 | T5 in 8-12 slots | ~1.0% |
| Level 2000 BIS | T5 in all 18 slots | ~1.8% |

---

# 11. Reward Structure

| Mốc | Reward |
|---|---|
| First rune socketed | Achievement |
| T3 rune obtained | "Runesmith" title |
| T5 rune obtained | "Grand Runesmith" title |
| Full resonance (6 same) | Element glow visual |
| All rune types collected | "Runic Scholar" |

---

# 12. RNG Design

```
Rune drop: WeightedRoll per biome drop table
  T1: 60%, T2: 25%, T3: 12%, T4: 2.5%, T5: 0.5%
  Element within tier: Equal weight (6 elements)

Craft: deterministic (100% success)
Extract: deterministic (100% return)
```

---

# 13. Anti Bad Luck System

| Pity | Rate | Hard Pity |
|---|---|---|
| rune_t4 drop | 2.5% | 50 drops |
| rune_t5 drop | 0.5% | 200 drops |

---

# 14. Collection Integration

"Rune Collection" — 150 rune types. Track discovered. Fill percentage shown.

---

# 15. Achievement Integration

| Achievement | Condition |
|---|---|
| First Socket | Socket rune đầu tiên |
| T5 Obtained | Craft/drop T5 rune |
| Full Element | 6 same element socketed |
| Rune Scholar | 50 rune types discovered |

---

# 16. Season Integration

Season event: T3+ rune drop rate × 2 trong season biome.

---

# 17. PvE Integration

Runes hoạt động fully trong PvE. Element resonance đặc biệt hữu ích trong element-weakness dungeon.

---

# 18. PvP Integration

Rune stat áp dụng. Element resonance damage bonus áp dụng. PvP × 0.5 cap áp dụng.

---

# 19. Social Integration

Guild craft event: guild member donate T1 runes → guild crafts T5 rune → raffle cho members.

---

# 20. Technical Architecture

## Class Diagram

```
RuneDataSO : ScriptableObject
├── string id, name, element
├── int tier
├── string statType
├── float statBonusPct
├── int dropBiomeMin, dropBiomeMax
├── string visualColor

RuneManager : MonoBehaviour  
├── SocketRune(equipUid, slot, runeId) : bool
├── ExtractRune(equipUid, slot) : bool
├── UpgradeRune(runeId) : RuneDataSO
├── GetTotalRuneStat() : float
├── GetElementResonance() : ResonanceBonus
└── ValidateBudget() : bool

RuneCraftManager : MonoBehaviour
├── CanCraft(resultRuneId) : bool
├── Craft(resultRuneId) : bool
└── GetRecipe(resultRuneId) : RuneRecipe
```

---

# 21. Save Data Architecture

Rune state saved in `player_equipment` table:
```json
"equipment": {
  "equipped": {
    "weapon": {
      "uid": 100003,
      "equip_id": "sword_031",
      "rune_slots": ["rune_fire_atk_t4", "rune_wind_crit_t3"]
    }
  }
}
```

Inventory runes: `player_rune_inventory` table (rune_id → quantity).

---

# 22. Network Architecture

Socket/Extract: POST /api/v1/rune/socket → server validates slot count per rarity, gold/tool deduction.
Upgrade: POST /api/v1/rune/upgrade → atomic: consume 3, produce 1.

---

# 23. Security

| Threat | Prevention |
|---|---|
| Free extraction | Server checks Extraction Tool inventory |
| Fake tier | Server recalcs stat from rune_id lookup |
| Slot overflow | Server validates slot count per equipment rarity |

---

# 24. LiveOps Hooks

```
event.rune_upgrade_gold_discount = 0.5
event.rune_t4_drop_rate_boost = 3.0
flag.rune_new_element_available = false
remote_config.max_rune_tier = 5
```

---

# 25. Content Pipeline

```
Google Sheet "Rune DB"
  → rune_db.csv (150 rows)
  → gen_rune_db.py
  → rune_db.json
  → RuneDataSO[] (Editor import)
```

---

# 26. Future Expansion

- T6 rune (Year 2): requires new biome → budget comes from increased headroom
- "Prismatic Rune": holds 2 elements (Year 3)
- Rune Enchanting: add secondary effect to T5 rune

---

# 27. Production Risks

| Rủi ro | Mức |
|---|---|
| T5 farming quá chậm | MEDIUM |
| 150 rune varieties confusing UX | MEDIUM |

---

# 28. Mitigation Plan

| Rủi ro | Giải pháp |
|---|---|
| T5 too slow | Rune exchange shop: 5 T4 → 1 T5 (event) |
| UX confusion | Filter by element + stat type; show recommended per class |

---

# 29. Unity Implementation Plan

```
Assets/script/SlimeMMO/Rune/
├── RuneDataSO.cs
├── RuneSlotConfigSO.cs
├── RuneManager.cs
├── RuneCraftManager.cs
└── SlimeMMO.Rune.asmdef

generators/
└── gen_rune_db.py
```

---

# 30. Final Verdict

**Status: BLOCKER**

3% rune budget + itemization depth layer thiếu. Implement cùng lúc với Trait System (cùng budget envelope Trait+Rune = 6%).
