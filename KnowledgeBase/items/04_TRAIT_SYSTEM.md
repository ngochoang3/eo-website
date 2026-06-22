# SYSTEM 04 — Trait System
> Status: BLOCKER → thiếu hoàn toàn
> Power Budget: 3% (Trait share từ Trait+Rune = 6% total)
> Ngày: 2026-06-13

---

# 1. Purpose

Trait là **passive ability vĩnh viễn** mà player unlocks theo progression — không phải equipment, không tháo lắp. Trait thể hiện lựa chọn dài hạn của player và tạo nên "build archetype". Rune (hệ thống riêng, System 05) là phần socketing equipment.

---

# 2. Design Philosophy

- **Permanent unlock** — không thể "unlearn" sau khi unlock
- **3 category:** Offensive, Defensive, Utility (mỗi loại ≤ 3 active simultaneously)
- **Max 6 Trait active** — player phải chọn wisely
- **Unlock bằng gameplay** — không bao giờ bằng tiền
- **Stat đóng góp: 3%** (Trait 3% + Rune 3% = 6% tổng Trait+Rune)

---

# 3. Core Loop

```
[Complete milestone: boss kill, quest, level, collection]
          │
          ▼
[Trait Point earned (max 1/day or via content)]
          │
          ▼
[Trait Tree browser: Offensive/Defensive/Utility]
          │
          ▼
[Unlock trait node (requires prerequisite)] 
          │
          ▼
[Activate trait (max 6 active, max 3/category)]
          │
          ▼
[Trait synergy bonus if 2+ same category active]
```

---

# 4. Progression Loop

| Level Range | Traits Available | Max Active | Points Earn |
|---|---|---|---|
| 1-199 | Tier 1 (basic) | 2 | From quests only |
| 200-499 | Tier 1+2 | 3 | +1 per 50 levels |
| 500-999 | Tier 1+2+3 | 4 | +1 per 100 levels |
| 1000-1499 | All tiers | 5 | +1 per boss first-kill |
| 1500-2000 | All tiers | 6 | +1 per ascension rank |

---

# 5. Data Architecture

## 5.1 Entity

```
TraitDataSO
├── id: string               ("trait_battle_focus")
├── name: string             ("Battle Focus")
├── category: string         ("Offensive","Defensive","Utility")
├── tier: int                (1-3)
├── unlock_method: string    ("quest","level","boss_kill","collection")
├── unlock_value: string     (quest_id / level / boss_id / collection_id)
├── stat_bonus_type: string  ("atk_pct","def_pct","hp_pct","crit_rate","utility")
├── stat_bonus_pct: float    (0 to 0.005)
├── passive_desc: string
├── synergy_tag: string[]    (tags for synergy bonus)
├── prerequisite_trait: string (id of required trait, or "")
├── max_tier: int            (always same tier — no upgrade within trait)
└── lore: string
```

## 5.2 Database Tables

```sql
CREATE TABLE trait_data (
    id                  VARCHAR(64) PRIMARY KEY,
    name                VARCHAR(64) NOT NULL,
    category            VARCHAR(16) NOT NULL,
    tier                TINYINT NOT NULL,
    unlock_method       VARCHAR(32) NOT NULL,
    unlock_value        VARCHAR(64) NOT NULL,
    stat_bonus_type     VARCHAR(32) NOT NULL DEFAULT '',
    stat_bonus_pct      FLOAT NOT NULL DEFAULT 0,
    passive_desc        TEXT NOT NULL,
    synergy_tags        VARCHAR(128),
    prerequisite_trait  VARCHAR(64),
    lore                TEXT
);

CREATE TABLE player_trait (
    player_id       BIGINT NOT NULL,
    trait_id        VARCHAR(64) NOT NULL,
    is_unlocked     TINYINT NOT NULL DEFAULT 0,
    is_active       TINYINT NOT NULL DEFAULT 0,
    unlocked_at     DATETIME,
    PRIMARY KEY (player_id, trait_id)
);

CREATE TABLE trait_synergy (
    synergy_id      VARCHAR(32) PRIMARY KEY,
    tags_required   VARCHAR(128) NOT NULL,
    tags_count      TINYINT NOT NULL,
    bonus_desc      VARCHAR(128) NOT NULL,
    bonus_type      VARCHAR(32) NOT NULL,
    bonus_value     FLOAT NOT NULL
);
```

## 5.3 ID Rules

Format: `trait_{category}_{name_snake}`
- `trait_off_battle_focus` — Offensive, Battle Focus
- `trait_def_iron_skin` — Defensive, Iron Skin
- `trait_uti_swift_dodge` — Utility, Swift Dodge

## 5.4 CSV Schema

`trait_db.csv`:
```
id,name,category,tier,unlock_method,unlock_value,stat_bonus_type,stat_bonus_pct,passive_desc,synergy_tags,prerequisite_trait,lore
trait_off_battle_focus,Battle Focus,Offensive,1,level,200,atk_pct,0.003,Tăng ATK 0.3% vĩnh viễn,atk;combat,,Tập trung chiến đấu là đỉnh cao của nghệ thuật chinh phục
trait_off_crit_surge,Crit Surge,Offensive,2,boss_kill,boss_003_01,crit_rate,0.002,Tăng CritRate 0.2% vĩnh viễn,crit;atk,trait_off_battle_focus,Dòng máu chiến binh giờ đây chảy nhanh hơn
trait_def_iron_skin,Iron Skin,Defensive,1,level,100,def_pct,0.003,Tăng DEF 0.3% vĩnh viễn,def;hp,,Da thép — không phải ẩn dụ mà là thực tế
trait_def_slime_armor,Slime Armor,Defensive,2,quest,quest_0250,hp_pct,0.003,Tăng MaxHP 0.3%,hp;def,trait_def_iron_skin,Vỏ Slime là giáp tốt nhất tại Verdant Meadow
trait_uti_swift_dodge,Swift Dodge,Utility,1,level,50,,0.0,Giảm dodge CD 1s,movement;utility,,Tốc độ là sống còn
trait_uti_mana_surge,Mana Surge,Utility,2,collection,collect_50_skills,,0.0,Regenerate 1% MP mỗi 5s khi ngoài chiến đấu,mp;utility,trait_uti_swift_dodge,Slime giữ mana như hồ chứa nước
```

## 5.5 JSON Schema

```json
{
  "name": "trait_db",
  "count": 60,
  "rows": [
    {
      "id": "trait_off_battle_focus",
      "name": "Battle Focus",
      "category": "Offensive",
      "tier": 1,
      "unlock_method": "level",
      "unlock_value": "200",
      "stat_bonus_type": "atk_pct",
      "stat_bonus_pct": 0.003,
      "passive_desc": "Tăng ATK 0.3% vĩnh viễn.",
      "synergy_tags": ["atk", "combat"],
      "prerequisite_trait": "",
      "lore": "Tập trung chiến đấu là đỉnh cao của nghệ thuật chinh phục."
    }
  ]
}
```

---

# 6. Formula Architecture

## 6.1 Trait Stat Contribution

```
TraitStatPct = ∑ stat_bonus_pct[trait_i] for all ACTIVE traits
             ≤ 6 traits × 0.005 max = 0.03 = 3% ✅

Constraint:
  - Max 3 Offensive active → offensive sub-cap = 1.5%
  - Max 3 Defensive active → defensive sub-cap = 1.5%
  - Max 3 Utility active   → utility adds 0% stat (utility only)
  - Sub-cap: Offensive ≤ 2%, Defensive ≤ 1%, Utility = 0%
    → Total stat 3% ✅
```

## 6.2 Synergy Bonus

```
TraitSynergy(active_traits) =
  if 2+ traits share synergy_tag "crit":
    +0.1% crit rate bonus (NOT counted in budget — utility bonus)
  if 2+ share "atk":
    +0.1% ATK bonus (NOT in budget)
  if all 3 offensive are "combat" tagged:
    +0.2% ATK bonus (NOT in budget)

Note: synergy bonus MAX = 0.5% total → not counted in 3% trait budget
```

## 6.3 Unlock Requirements

```
Unlock by level:   player.level ≥ unlock_value
Unlock by quest:   quest_bits[quest_id] = 1
Unlock by boss:    bestiary_bits[boss_id] = 1 (first kill)
Unlock by collect: collection achievement unlocked

TraitPoint earned:
  Per 50 levels (lv 50-999): 1 point per 50 levels = 18 points
  Per 100 levels (lv 1000-1499): 5 points
  Per ascension rank: 1 point × 25 ranks = 25 points
  Per special quest: varies (story quests grant 1)
  Total available: ~60+ points (more than enough for 60 traits)
```

## 6.4 Activation Limit

```
CanActivate(trait) =
  is_unlocked = true
  AND CountActive(same_category) < 3
  AND CountActive(all) < 6
  AND (prerequisite = "" OR prerequisite is active)
```

---

# 7. Power Budget

**Allocated: 3% (Trait portion)**
- Max 4 stat-granting traits active (Offensive × 3 + Defensive × 1 or similar mix)
- Each max stat_bonus_pct = 0.005 (0.5%)
- Hard cap: 4 stat traits × 0.005 = 2% actual, 1% from synergy potential
- `PowerBudgetManager.ValidateSystemMax(traitPct, "trait", 0.03f)`

---

# 8. Economy Impact

| Tài nguyên | Source | Sink |
|---|---|---|
| Trait Points | Level, Ascension, Quest | Unlock traits (permanent) |
| Gold | — | Không cần gold để unlock |

**No P2W:** Trait unlock chỉ bằng gameplay — không bán trait points.

---

# 9. Anti Power Creep

- Max stat_bonus_pct per trait = 0.005 — hard cap trong CSV
- Server validates total trait stat ≤ 3%
- Utility traits không có stat — giúp player balance breadth vs depth

---

# 10. Progression Table

| Total Active | Stat Contribution | Notes |
|---|---|---|
| 2 (early) | 0.6% | First 2 traits |
| 3 | 0.9% | Level 200 |
| 4 | 1.2% | Level 500 |
| 5 | 1.5% | Level 1000 |
| 6 max | 3.0% | Full BIS (6 stat traits) |

---

# 11. Reward Structure

| Mốc | Reward |
|---|---|
| First trait unlock | Title "Trait Awakened" |
| 10 traits unlocked | Achievement |
| 30 traits | "Trait Scholar" |
| All 60 traits | "Trait Master" + cosmetic |
| 3 Offensive active | "War Machine" synergy visual |

---

# 12. RNG Design

Trait unlock là deterministic (meet condition → unlock). Không có RNG trong trait system. Synergy check là deterministic.

---

# 13. Anti Bad Luck System

Không áp dụng — trait là 100% deterministic unlock, không có RNG.

---

# 14. Collection Integration

"Trait Compendium" trong Collection Hall — 60 traits, track locked/unlocked/active.

---

# 15. Achievement Integration

| Achievement | Condition |
|---|---|
| First Trait | Unlock trait đầu tiên |
| Trait Scholar | 30 traits unlocked |
| All-Rounder | 2+ traits từ mỗi category active |
| Specialist | 3 traits từ 1 category active |

---

# 16. Season Integration

Season exclusive: 2-3 seasonal traits unlock trong event (event progression reward, cosmetic passive only).

---

# 17. PvE Integration

Traits áp dụng fully trong PvE. Utility traits (dodge CD, MP regen) đặc biệt hữu ích trong dungeon.

---

# 18. PvP Integration

Trait stat (3%) áp dụng trong PvP. PvP damage cap × 0.5 áp dụng. Không có trait exclude cho PvP.

---

# 19. Social Integration

Không có social element trực tiếp. Trait loadout có thể share (view-only profile).

---

# 20. Technical Architecture

## Class Diagram

```
TraitDataSO : ScriptableObject
├── string id, name, category
├── int tier
├── string unlockMethod, unlockValue
├── string statBonusType
├── float statBonusPct
├── string passiveDesc
├── string[] synergyTags
├── string prerequisiteTrait

TraitManager : MonoBehaviour
├── Dictionary<string, TraitState> _traits
├── UnlockTrait(traitId) : bool
├── ActivateTrait(traitId) : bool
├── DeactivateTrait(traitId) : bool
├── GetTotalStatPct() : float
├── CheckSynergies() : List<SynergyBonus>
├── CheckUnlockConditions() : void
└── ValidateBudget() : bool

TraitUnlockChecker : MonoBehaviour
├── OnLevelUp(int newLevel)
├── OnQuestComplete(string questId)
├── OnBossKill(string bossId)
└── OnCollectionUnlock(string collectId)
```

---

# 21. Save Data Architecture

```json
"traits": {
  "trait_off_battle_focus": true,
  "trait_off_crit_surge": true,
  "trait_def_iron_skin": true,
  "trait_def_slime_armor": false,
  "trait_uti_swift_dodge": true,
  "trait_uti_mana_surge": false
}
```

`true` = unlocked AND active, `false` = unlocked but inactive. Traits not in map = not yet unlocked.

---

# 22. Network Architecture

Unlock trigger: server validates unlock condition independently.
Activate/Deactivate: delta save `"traits"` object.
Server validates: active count ≤ 6, category limit ≤ 3, prerequisite met.

---

# 23. Security

| Threat | Prevention |
|---|---|
| Fake trait unlock | Server re-validates unlock condition |
| Too many active | Server count validates ≤ 6 total, ≤ 3/category |
| Stat inflation | Server recalcs trait total stat |

---

# 24. LiveOps Hooks

```
event.trait_unlock_xp_boost = 2.0   (event: all unlocks faster)
flag.trait_seasonal_active = true
remote_config.trait_max_active = 6
```

---

# 25. Content Pipeline

```
Google Sheet "Trait DB"
  → trait_db.csv (60 rows)
  → gen_trait_db.py
  → trait_db.json
  → TraitDataSO[] (Editor import)
```

---

# 26. Future Expansion

- Tier 4 traits (Year 2): 0.5% each, max 2 active → +1% budget (phải negotiate với Power Budget team)
- "Trait Mutation": spend resources to change synergy tags
- Class-specific traits khi thêm class system

---

# 27. Production Risks

| Rủi ro | Mức |
|---|---|
| Synergy bonus vô tình exceed budget | HIGH |
| 60 traits khó balance | MEDIUM |
| Unlock conditions bị exploit | LOW |

---

# 28. Mitigation Plan

| Rủi ro | Giải pháp |
|---|---|
| Synergy exceed | Synergy bonus không tính vào stat budget; là utility only |
| 60 traits | Group in 5 templates × 12 variants; balance per group |
| Exploit | Server re-validates mọi unlock condition |

---

# 29. Unity Implementation Plan

```
Assets/script/SlimeMMO/Trait/
├── TraitDataSO.cs
├── TraitSynergyConfigSO.cs
├── TraitManager.cs
├── TraitUnlockChecker.cs
└── SlimeMMO.Trait.asmdef

generators/
└── gen_trait_db.py
```

---

# 30. Final Verdict

**Status: BLOCKER**

3% power budget thiếu + không có build identity system. Implement sau Relic/Artifact nhưng trước Beta.
