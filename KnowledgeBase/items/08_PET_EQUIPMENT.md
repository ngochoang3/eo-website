# SYSTEM 08 — Pet Equipment Sub-system
> Status: BLOCKER (P1) → PetDataSO thiếu equipment slots
> Power Budget: Included trong Pet System (4% tổng)
> Ngày: 2026-06-13

---

# 1. Purpose

Pet Equipment là hệ thống trang bị riêng cho Pet, khác hoàn toàn với trang bị của nhân vật. Pet có 3 equipment slots (Head, Body, Accessory) và stat riêng không overlap với player's power budget pet portion.

---

# 2. Design Philosophy

- **Pet stat tách biệt** — Pet equipment không directly boost player stat
- **Pet stat → Pet ability boost** — pet perform tốt hơn, nhưng chỉ utility pet abilities
- **3 slots per pet** — simple, không quá phức tạp
- **Budget: 4% total Pet** — trong đó 2% từ pet base, 2% từ pet equipment (nếu applicable)
- **No P2W** — tất cả pet equipment farmable

---

# 3. Core Loop

```
[Pet obtained (egg hatch/capture/event)]
        │
        ▼
[Pet levels up through battles together]
        │
        ▼
[Pet equipment unlocks at Lv 10, 20, 30 (3 slots)]
        │
        ▼
[Farm/Craft pet equipment]
        │
        ▼
[Equip → Pet stat boosts → Pet ability improves]
        │
        ▼
[Pet enhancement +0→+10 for pet equipment]
```

---

# 4. Progression Loop

| Pet Level | Unlock |
|---|---|
| 1-9 | Pet basic ability only |
| 10 | Head slot opens |
| 20 | Body slot opens |
| 30 | Accessory slot opens |
| 50 (max) | Full equipment + max ability |

---

# 5. Data Architecture

## 5.1 Entity

```
PetEquipmentDataSO
├── id: string               ("pet_helm_02")
├── name: string             ("Crystal Crown")
├── slot: string             ("head","body","accessory")
├── rarity: string
├── pet_type_req: string     ("any","magic","warrior","support")
├── pet_stat_type: string    ("pet_atk","pet_def","pet_hp","pet_speed")
├── stat_bonus: float        (flat value, not %)
├── enhance_max: int         (10)
├── level_req: int           (10/20/30 matching slot unlock)
├── biome_source: int
├── craft_recipe: string
├── lore: string

PetSave (updated)
├── uid: BIGINT
├── pet_id: string
├── level: int (1-50)
├── exp: int
├── equipment: Dictionary<string, string>  (slot → equip_uid)
│   head:      "pet_equip_uid_001"
│   body:      "pet_equip_uid_002"
│   accessory: null

PetEquipmentInstance
├── uid: BIGINT
├── equip_id: string
├── enhance_level: int (0-10)
└── acquired_at: datetime
```

## 5.2 Database Tables

```sql
CREATE TABLE pet_equipment_data (
    id              VARCHAR(32) PRIMARY KEY,
    name            VARCHAR(64) NOT NULL,
    slot            VARCHAR(16) NOT NULL,
    rarity          VARCHAR(16) NOT NULL,
    pet_type_req    VARCHAR(16) NOT NULL DEFAULT 'any',
    pet_stat_type   VARCHAR(32) NOT NULL,
    stat_bonus      FLOAT NOT NULL,
    enhance_max     TINYINT NOT NULL DEFAULT 10,
    level_req       TINYINT NOT NULL,
    biome_source    TINYINT NOT NULL,
    lore            TEXT
);

CREATE TABLE pet_equipment_enhance_config (
    enhance_level   TINYINT PRIMARY KEY,
    success_rate    FLOAT NOT NULL,
    gold_cost       INT NOT NULL,
    pet_stat_bonus  FLOAT NOT NULL
);

CREATE TABLE player_pet_equipment (
    uid             BIGINT PRIMARY KEY AUTO_INCREMENT,
    player_id       BIGINT NOT NULL,
    equip_id        VARCHAR(32) REFERENCES pet_equipment_data(id),
    enhance_level   TINYINT NOT NULL DEFAULT 0,
    acquired_at     DATETIME NOT NULL,
    INDEX idx_player (player_id)
);

-- player_pet table gets additional columns:
ALTER TABLE player_pet ADD COLUMN equip_head_uid BIGINT DEFAULT NULL;
ALTER TABLE player_pet ADD COLUMN equip_body_uid BIGINT DEFAULT NULL;
ALTER TABLE player_pet ADD COLUMN equip_acc_uid  BIGINT DEFAULT NULL;
```

## 5.3 ID Rules

Format: `pet_{slot_prefix}_{biome:02d}_{variant:02d}`
- `pet_hd_03_01` — Head, biome 3, variant 1
- `pet_bd_12_02` — Body, biome 12, variant 2
- `pet_ac_21_01` — Accessory, Void Realm

## 5.4 CSV Schema

`pet_equipment_db.csv`:
```
id,name,slot,rarity,pet_type_req,pet_stat_type,stat_bonus,enhance_max,level_req,biome_source,lore
pet_hd_01_01,Leaf Crown,head,Uncommon,any,pet_def,5.0,10,10,1,Vòng hoa từ Verdant Meadow
pet_hd_03_01,Crystal Crown,head,Rare,magic,pet_atk,8.0,10,10,2,Vương miện pha lê từ Crystal Cave
pet_bd_03_01,Flame Coat,body,Epic,warrior,pet_hp,20.0,10,20,3,Áo lửa từ Volcanic Ridge
pet_ac_09_01,Mystic Amulet,accessory,Rare,any,pet_speed,3.0,10,30,9,Bùa hộ mệnh từ Mystic Swamp
pet_hd_21_01,Void Tiara,head,Legendary,any,pet_atk,15.0,10,10,21,Vương miện Void — gắn kết với pet bí ẩn
```

## 5.5 JSON Schema

```json
{
  "name": "pet_equipment_db",
  "count": 90,
  "rows": [
    {
      "id": "pet_hd_03_01",
      "name": "Crystal Crown",
      "slot": "head",
      "rarity": "Rare",
      "pet_type_req": "magic",
      "pet_stat_type": "pet_atk",
      "stat_bonus": 8.0,
      "enhance_max": 10,
      "level_req": 10,
      "biome_source": 2,
      "lore": "Vương miện pha lê từ Crystal Cave."
    }
  ]
}
```

---

# 6. Formula Architecture

## 6.1 Pet Stat Total

```
PetBaseStat(pet_level) = pet_base_atk × (1 + level × 0.05)

PetEquipBonus(slot) = equip_base_stat_bonus × (1 + enhance_level × 0.1)

PetTotalStat = PetBaseStat + ∑ PetEquipBonus(slot_i)
```

## 6.2 Pet Equipment Enhancement

| Level | Success Rate | Gold | Stat Multiplier |
|---|---|---|---|
| +0→+1 | 100% | 500 | ×1.1 |
| +1→+2 | 100% | 1,000 | ×1.2 |
| +2→+3 | 90% | 2,500 | ×1.3 |
| +3→+4 | 80% | 5,000 | ×1.4 |
| +4→+5 | 70% | 10,000 | ×1.5 |
| +5→+6 | 60% | 20,000 | ×1.6 |
| +6→+7 | 50% | 40,000 | ×1.7 |
| +7→+8 | 40% | 80,000 | ×1.8 |
| +8→+9 | 30% | 150,000 | ×1.9 |
| +9→+10 | 20% | 300,000 | ×2.0 |

## 6.3 Pet Power Contribution to Player

```
PetPlayerPower = pet_ability_boost / 100
  → PetAbility examples:
    Support pet heals 1% of player's max HP per 5s (utility)
    Battle pet deals 5% of player's ATK as bonus hit (power: 4% budget)
  
BattlePetContribution = min(4%, total pet power budget)
SupportPetContribution = 0% (utility)
```

## 6.4 Budget Validation

```
PetPowerPct = pet_base_pct + pet_equip_additional_pct
  pet_base_pct = 2% (from base pet level and ability)
  pet_equip_additional_pct ≤ 2% (from pet equipment)
  Total ≤ 4% ✅
```

---

# 7. Power Budget

**4% total Pet System** (base pet 2% + pet equipment 2%)
- Pet equipment contributes to pet stat only
- Pet stat → pet ability → max 4% player power contribution
- `PowerBudgetManager.ValidateSystemMax(petTotalPct, "pet", 0.04f)`

---

# 8. Economy Impact

| Tài nguyên | Source | Sink |
|---|---|---|
| Pet equipment | Biome drop, craft, event | Equip on pet |
| Pet materials | Pet biome drop | Craft pet equipment |
| Gold | Gameplay | Pet enhance |
| Pet food | Craft | Pet leveling |

---

# 9. Anti Power Creep

- Pet enhance max +10 (not +20 like player equipment)
- Pet stat type separate from player stat type → no stacking issue
- Budget hard cap 4% total pet system

---

# 10. Progression Table

| Pet Level | Equip Slots | Typical Pet Stat | Player Power |
|---|---|---|---|
| 1-9 | 0 | Base only | ~1% |
| 10 | Head | +Head bonus | ~1.5% |
| 20 | Head+Body | +Body bonus | ~2.5% |
| 30 | All 3 | +Accessory | ~3.5% |
| 50 (+10 all) | All 3 enhanced | Max | ~4% |

---

# 11. Reward Structure

| Mốc | Reward |
|---|---|
| First pet equipment | Achievement |
| +10 any pet equip | "Pet Crafter" title |
| Full equipped pet | "Pet Champion" |
| Max pet stat | "Pet Master" |

---

# 12. RNG Design

```
Pet equipment drop: weighted per biome drop table
  Common 50%, Uncommon 25%, Rare 15%, Epic 8%, Legend 2%

Pet enhance RNG: same algorithm as player enhance (XorShift64)
Pity: after 5 consecutive fails → next attempt guaranteed (per slot)
```

---

# 13. Anti Bad Luck System

| Pity | Trigger | Guarantee |
|---|---|---|
| pet_enhance | 5 consecutive fail | Next success |
| pet_equip_drop | 30 biome runs no equip | 1 guaranteed |

---

# 14. Collection Integration

"Pet Equipment Compendium" — 90 items, track discovered.

---

# 15. Achievement Integration

| Achievement | Condition |
|---|---|
| Pet Equipped | 1st pet equipment |
| Fully Armed | All 3 slots equipped on 1 pet |
| Max Enhanced | 1 pet equip +10 |

---

# 16. Season Integration

Season: 2 seasonal pet equipment drops (cosmetic skin variation, same stat).

---

# 17. PvE Integration

Pet equipment unlocks at Lv 10/20/30 → tied to main game progression. Pet fights alongside in dungeon.

---

# 18. PvP Integration

Battle pet ability áp dụng trong PvP. Pet stat contributes to 4% budget in PvP (subject to × 0.5 PvP cap).

---

# 19. Social Integration

Guild: pet parade social event (cosmetic). Guild hall has pet display area.

---

# 20. Technical Architecture

## Class Diagram

```
PetEquipmentDataSO : ScriptableObject
├── string id, name, slot, rarity, petTypeReq
├── string petStatType
├── float statBonus
├── int enhanceMax, levelReq, biomeSource

PetEquipmentEnhanceConfigSO : ScriptableObject
└── EnhanceEntry[] levels

PetManager : MonoBehaviour (update existing)
├── Dictionary<string, PetSave> _pets
├── EquipPetItem(petUid, slot, equipUid) : bool
├── EnhancePetItem(petUid, slot) : bool
├── GetPetPowerContribution(petUid) : float
└── ValidatePetBudget() : bool

PetEquipmentManager : MonoBehaviour
├── GetEquippedStat(petUid) : PetStatBundle
├── GetTotalPetStat(petUid) : float
└── ValidateSlotLevel(petLevel, slot) : bool
```

---

# 21. Save Data Architecture

```json
"pets": [
  {
    "uid": 300001,
    "pet_id": "pet_rabbit_01",
    "level": 35,
    "exp": 45000,
    "equipment": {
      "head": "pet_equip_uid_0010",
      "body": "pet_equip_uid_0025",
      "accessory": null
    }
  }
]
```

`pet_equip_uid` references `player_pet_equipment` table.

---

# 22. Network Architecture

Pet equip: POST /api/v1/pet/equip → server validates pet level ≥ slot requirement.
Pet enhance: POST /api/v1/pet/enhance → atomic gold deduction + result.

---

# 23. Security

| Threat | Prevention |
|---|---|
| Equip below level req | Server validates pet level |
| Fake enhance level | Server recalcs from raw data |
| Pet power overflow | Server validates total ≤ 4% |

---

# 24. LiveOps Hooks

```
event.pet_equip_drop_rate = 2.0
event.pet_enhance_cost_discount = 0.5
flag.pet_equipment_system_enabled = true
```

---

# 25. Content Pipeline

```
Google Sheet "Pet Equipment DB"
  → pet_equipment_db.csv (90 rows)
  → gen_pet_equipment_db.py
  → pet_equipment_db.json
  → PetEquipmentDataSO[] (Editor import)
```

---

# 26. Future Expansion

- Pet equipment set bonus (Year 2)
- Pet awakening using equipment as sacrifice
- Pet equipment crafting specialization

---

# 27. Production Risks

| Rủi ro | Mức |
|---|---|
| Pet power exceeds 4% budget | HIGH |
| UI complexity với 2 separate equipment systems | MEDIUM |

---

# 28. Mitigation Plan

| Rủi ro | Giải pháp |
|---|---|
| Budget overflow | Separate pet power validation layer |
| UI complexity | Pet UI tab hoàn toàn tách biệt khỏi player equipment tab |

---

# 29. Unity Implementation Plan

```
Assets/script/SlimeMMO/Pet/
├── PetDataSO.cs          (update: add equipment slots)
├── PetEquipmentDataSO.cs (new)
├── PetEnhanceConfigSO.cs (new)
├── PetManager.cs         (update)
├── PetEquipmentManager.cs (new)
└── SlimeMMO.Pet.asmdef

generators/
└── gen_pet_equipment_db.py
```

---

# 30. Final Verdict

**Status: BLOCKER (P1)**

PetDataSO thiếu equipment fields. Pet power budget không đủ 4% khi không có equipment layer. Fix sau Creature System.
