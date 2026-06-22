# SYSTEM 16 — Monster Family Architecture
> Status: MISSING → thiết kế từ đầu
> Ngày: 2026-06-13

---

# 1. Purpose

Monster Family Architecture phân loại 294 monsters vào **families** có trait riêng, tạo depth cho combat preparation và khuyến khích Bestiary completion. Mỗi family có weakness riêng và drop bonus khi player equipped với "Slayer" rune/trait.

---

# 2. Design Philosophy

- **6 Monster Families:** Beast, Undead, Elemental, Construct, Demon, Humanoid
- **Family determines:** weaknesses, resistances, CC immunity, special loot
- **Slayer bonus:** Trait/Rune "Family Slayer" → +10% damage vs family (inside power budget)
- **Bestiary:** Kill 100 of each monster → unlock Family bonus (utility)
- **Boss family:** Boss thuộc family của biome chính

---

# 3. Core Loop

```
[Player enters biome] → [Scan monsters: identify family]
        │
        ▼
[Equip element matching family weakness]
        │
        ▼  (optional)
[Equip Slayer rune for that family]
        │
        ▼
[Fight → Family bonus applies if equipped]
        │
        ▼
[Kill count tracked in Bestiary]
        │
        ▼
[100 kills: unlock Family Bonus (utility)]
[1000 kills: unlock "Master Slayer" achievement]
```

---

# 4. Progression Loop

| Kill Count | Milestone |
|---|---|
| 1 | Monster discovered in Bestiary |
| 10 | Basic info unlocked (drop table hint) |
| 50 | Weakness confirmed in Bestiary |
| 100 | Family Bonus unlocked (+5% gold from family) |
| 500 | Title "Slayer of [Family]" |
| 1000 | "Master Slayer" cosmetic |

---

# 5. Data Architecture

## 5.1 Entity

```
MonsterFamilyDataSO
├── family_id: string          ("beast","undead","elemental","construct","demon","humanoid")
├── display_name: string
├── element_weakness: string   ("Fire","Water","Earth","Wind","Light","Dark")
├── element_resistance: string
├── cc_immunity: string[]      ("stun","root","sleep") or []
├── physical_dmg_bonus: float  (0.0 or small value like 0.05)
├── magic_dmg_bonus: float
├── bestiary_bonus_type: string ("gold_pct","drop_rate","exp_pct")
├── bestiary_bonus_value: float
├── slayer_trait_id: string    (ref TraitDataSO)
├── slayer_rune_id: string     (ref RuneDataSO)
├── description: string
└── icon: string

MonsterDataSO (updated)
├── ... (existing fields)
├── family_id: string          → link to MonsterFamilyDataSO
└── sub_type: string           ("alpha","boss","minion","elite","named")

MonsterKillCount (per player)
├── monster_id: string
└── kill_count: int
```

## 5.2 Family Definitions

| Family | Element Weakness | Element Resist | CC Immunity | Primary Biome |
|---|---|---|---|---|
| Beast | Fire, Wind | Water | Sleep | 1,6,7,8 (nature biomes) |
| Undead | Light | Dark | Stun (some) | 11,18 (Ruined, Phantom) |
| Elemental | Opposite element | Own element | Slow, Root | 2,3,4,5,8,9 |
| Construct | Earth | Physical | Silence | 19,20 (Lava, Sky) |
| Demon | Light | Dark, Fire | Freeze | 12,17,21 (Shadow, Void) |
| Humanoid | (none special) | — | (none) | 11,13,18 (Ruined, Ember) |

## 5.3 Database Tables

```sql
CREATE TABLE monster_family (
    family_id               VARCHAR(32) PRIMARY KEY,
    display_name            VARCHAR(64) NOT NULL,
    element_weakness        VARCHAR(16),
    element_resistance      VARCHAR(16),
    cc_immunity_json        VARCHAR(128),
    bestiary_bonus_type     VARCHAR(32) NOT NULL,
    bestiary_bonus_value    FLOAT NOT NULL DEFAULT 0.05,
    slayer_trait_id         VARCHAR(64),
    slayer_rune_id          VARCHAR(32),
    description             TEXT,
    icon                    VARCHAR(64)
);

CREATE TABLE player_bestiary (
    player_id               BIGINT NOT NULL,
    monster_id              VARCHAR(32) NOT NULL,
    kill_count              INT NOT NULL DEFAULT 0,
    first_kill_at           DATETIME,
    PRIMARY KEY (player_id, monster_id)
);

CREATE TABLE bestiary_milestone_config (
    kill_threshold          INT PRIMARY KEY,
    reward_type             VARCHAR(32) NOT NULL,
    reward_value            FLOAT NOT NULL,
    achievement_id          VARCHAR(64)
);

-- monster_data table: add family_id column
ALTER TABLE monster_data ADD COLUMN family_id VARCHAR(32) REFERENCES monster_family(family_id);
ALTER TABLE monster_data ADD COLUMN sub_type VARCHAR(16) NOT NULL DEFAULT 'normal';
```

## 5.4 CSV Schema

`monster_family.csv`:
```
family_id,display_name,element_weakness,element_resistance,cc_immunity,bestiary_bonus_type,bestiary_bonus_value,slayer_trait_id,slayer_rune_id,description
beast,Beast,Fire,Water,"sleep",gold_pct,0.05,trait_off_beast_slayer,rune_beast_t3,Sinh vật tự nhiên của các vùng đồng cỏ và rừng rậm
undead,Undead,Light,Dark,"stun",drop_rate,0.10,trait_off_undead_slayer,rune_undead_t3,Những thứ đã chết nhưng không chịu nằm yên
elemental,Elemental,Opposite,Own,"slow;root",exp_pct,0.05,trait_off_element_slayer,rune_element_t3,Hiện thân của sức mạnh nguyên tố
construct,Construct,Earth,Physical,"silence",gold_pct,0.05,trait_off_construct_slayer,rune_construct_t3,Máy móc và công trình vô hồn
demon,Demon,Light,"dark;fire","freeze",drop_rate,0.10,trait_off_demon_slayer,rune_demon_t3,Sinh vật từ các chiều không gian tối tăm
humanoid,Humanoid,,,none,exp_pct,0.08,trait_off_humanoid_slayer,rune_humanoid_t3,Kẻ thù có lý trí và chiến thuật
```

`bestiary_milestone_config.csv`:
```
kill_threshold,reward_type,reward_value,achievement_id
1,discovery,0,ach_bestiary_discover
10,drop_hint,0,
50,weakness_reveal,0,
100,gold_bonus,0.05,ach_bestiary_100
500,title_unlock,0,ach_bestiary_500
1000,cosmetic,0,ach_bestiary_1000
```

## 5.5 JSON Schema

```json
{
  "name": "monster_family",
  "families": [
    {
      "family_id": "beast",
      "display_name": "Beast",
      "element_weakness": "Fire",
      "element_resistance": "Water",
      "cc_immunity": ["sleep"],
      "bestiary_bonus_type": "gold_pct",
      "bestiary_bonus_value": 0.05,
      "slayer_trait_id": "trait_off_beast_slayer",
      "slayer_rune_id": "rune_beast_atk_t3",
      "description": "Sinh vật tự nhiên của các vùng đồng cỏ và rừng rậm.",
      "icon": "icon_family_beast"
    }
  ]
}
```

---

# 6. Formula Architecture

## 6.1 Slayer Damage Bonus

```
SlayerDamageBonus(attacker, target) =
  if attacker has SlayerTrait(target.family) active:
    +0.05 (5% additive) to FinalDamage
  if attacker has SlayerRune(target.family) socketed:
    +0.05 (5% additive) to FinalDamage
  
  Combined max = 0.10 (10% = stays within Trait+Rune budget)
  → counted within Trait 3% + Rune 3% budget envelope
```

## 6.2 Bestiary Bonus (Post-100 kills)

```
BestiaryBonusActive(player, monster) =
  player.kill_count[monster.id] >= 100
  → Applies bestiary_bonus_type per kill from that monster

gold_pct bonus: gold_drop × 1.05
drop_rate bonus: all drop weight × 1.10 for this monster
exp_pct bonus: exp × 1.05
```

## 6.3 CC Resistance

```
CCImmuneCheck(status_id, target) =
  if status_id in target.family.cc_immunity:
    return false  (CC attempt fails completely)
  else:
    apply normal CC resistance formula

Example: Undead + "stun" named mob: immune to stun → status fails
         Undead + "slow": not immune → apply cc_resist formula
```

## 6.4 Bestiary Kill Count Update

```
OnMonsterKill(player, monster):
  player.bestiary[monster.id].kill_count += 1
  CheckMilestones(player, monster)
  BitFlags.Set(bestiaryKilledBits, monster.index)  // first kill
```

## 6.5 Element vs Family

```
FinalElementMult = base_element_mult (from ElementChart)
  + family_element_bonus (if skill.element == family.element_weakness: +0.1)
  
Family element weakness is ADDITIVE to ElementChart:
  e.g. Fire vs Beast: ElementChart(Fire, Beast.element) × 1.0 + 0.0
       (Beast has no elemental form — element chart uses monster's element, not family)
  
Note: MonsterDataSO.element is the monster's individual element
      MonsterFamilyDataSO.element_weakness is what PLAYERS should use against the family
      These are separate concepts.
```

---

# 7. Power Budget

Slayer bonus (10% total) falls inside existing Trait (3%) + Rune (3%) budgets:
- Slayer Trait: 1 active trait, stat_bonus_pct = 0.005 (0.5%)
- Slayer Rune T3: 0.0006 (0.06%) per rune

Combined slayer contribution << 6% budget → safe.
Bestiary bonus (gold/EXP/drop) = utility, not power budget.

---

# 8. Economy Impact

Bestiary bonus +5% gold per family → tiny economy impact over millions of kills.
Slayer rune: creates demand for family-specific runes → specialized trade.

---

# 9. Anti Power Creep

- Slayer bonus inside existing budget
- Bestiary bonus is utility (gold/EXP) — not stat
- CC immunity prevents "one-button CC all" strategy

---

# 10. Progression Table

| Bestiary Progress | Player Time | Reward |
|---|---|---|
| 1 kill | Day 1 | Discovery |
| 10 kills per monster | Week 1 | Drop hints |
| 100 kills per monster | Month 1-3 | Gold/EXP bonus |
| 500 kills per monster | Month 3-12 | Title unlock |
| All monsters 100 kills | 6-12 months | Completion reward |
| All monsters 1000 kills | 2+ years | Legendary Slayer title |

---

# 11. Reward Structure

| Milestone | Reward |
|---|---|
| Discover new family | Achievement per family |
| 100 kills all monsters in biome | Biome Slayer title |
| Full Bestiary 100 kills | "Bestiary Master" |
| Full Bestiary 1000 kills | "Grand Slayer" legendary title + cosmetic |

---

# 12. RNG Design

Kill tracking is deterministic (count). No RNG in family mechanics except:
- CC attempt vs cc_immunity: deterministic (immune = always fail)
- Slayer damage: deterministic additive

---

# 13. Anti Bad Luck System

Bestiary bonus after 100 kills = guaranteed reward for persistence. No RNG in bestiary rewards.

---

# 14. Collection Integration

**Bestiary** là Collection Hall section:
- Grid of all 294 monsters
- Each slot: silhouette until discovered
- Shows: kill count, weakness, drop hints (after 10 kills)
- Filter by family, biome, rarity

---

# 15. Achievement Integration

| Achievement | Condition |
|---|---|
| Beast Novice | Kill 10 different Beast monsters |
| Undead Hunter | Kill 100 Undead total |
| Family Scholar | Discover all 6 families |
| Biome Complete | 100 kills on all monsters in 1 biome |
| Grand Slayer | 1000 kills on any single monster |
| Full Bestiary | 100 kills on all 294 monsters |

---

# 16. Season Integration

Season event: "Season of the Beast" — Beast monsters have 2× drop rate, seasonal slayer rune available.

---

# 17. PvE Integration

Dungeon hint: "This dungeon contains Demon family — bring Light element skills."
Boss preview: show boss family before entering room.

---

# 18. PvP Integration

Monster families không relevant trong PvP (không có monsters). Slayer runes/traits inactive in PvP context.

---

# 19. Social Integration

Guild event: "Family Hunt" — guild compete for most kills of specific family in 1 week. Guild reward: cosmetic guild banner.

---

# 20. Technical Architecture

```
MonsterFamilyDataSO : ScriptableObject
├── string familyId, displayName
├── string elementWeakness, elementResistance
├── string[] ccImmunity
├── string bestiaryBonusType
├── float bestiaryBonusValue
├── string slayerTraitId, slayerRuneId

BestiaryManager : MonoBehaviour
├── Dictionary<string, int> _killCounts
├── OnMonsterKill(monsterId)
├── GetKillCount(monsterId) : int
├── IsBonusUnlocked(monsterId) : bool
├── GetFamilyBonus(familyId) : BestiaryBonus
└── CheckMilestones(monsterId)

FamilySlayerSystem : MonoBehaviour
├── GetSlayerBonus(attacker, targetFamilyId) : float
├── IsCCImmune(familyId, statusId) : bool
└── GetFamilyElementBonus(familyId, attackElement) : float
```

---

# 21. Save Data Architecture

Kill counts: `player_bestiary` DB table (server-side).
First kill: `CollectionData.bestiaryBits` (bit-packed, 294 bits = 5 longs).

```json
"collections": {
  "bestiary_bits": [123456789, 0, 0, 0, 0]
}
```

---

# 22. Network Architecture

Kill count: delta sent on kill (immediate). `"bestiary.mon_0042": 47`
Milestone trigger: server pushes achievement notification when threshold met.

---

# 23. Security

| Threat | Prevention |
|---|---|
| Fake kill count | Server tracks kills server-side, not trusting client |
| AFK farm bot | Server validates: kill registered = valid combat session |
| CC immune exploit | CC immunity checked server-side |

---

# 24. LiveOps Hooks

```
event.family_hunt_active = "beast"     (this week's event family)
event.family_drop_rate_bonus = 2.0
flag.bestiary_milestone_active = true
remote_config.bestiary_bonus_threshold = 100
```

---

# 25. Content Pipeline

```
Google Sheet "Monster Family"
  → monster_family.csv (6 rows)
  → MonsterFamilyDataSO (direct import)

Google Sheet "Monster DB" (update existing)
  → Add family_id column to monster_db.csv
  → Re-run gen_monster_db.py (update to include family_id)
  → monster_db.json updated

bestiary_milestone_config.csv → BestiaryMilestoneConfigSO
```

---

# 26. Future Expansion

- Monster Family 7: "Ancient" (rare event monsters)
- Sub-family: "Alpha Beast" — special variant with unique CC pattern
- Family research tree: spend bestiary points to unlock additional bonuses

---

# 27. Production Risks

| Rủi ro | Mức |
|---|---|
| 294 monsters × 6 families hard to assign correctly | MEDIUM |
| Slayer bonus creates meta "always use slayer" | MEDIUM |
| Bot farm bestiary kills | HIGH |

---

# 28. Mitigation Plan

| Rủi ro | Giải pháp |
|---|---|
| Assignment errors | CSV has family_id column; automated CI test verify all 294 have valid family |
| Slayer meta | Slayer is inside budget — cannot exceed; swap cost prevents full-slayer always |
| Bot farming | Server: minimum 30s per kill credited (cannot spam); pattern detection |

---

# 29. Unity Implementation Plan

```
Assets/script/SlimeMMO/Monster/
├── MonsterFamilyDataSO.cs
├── BestiaryMilestoneConfigSO.cs
├── BestiaryManager.cs
├── FamilySlayerSystem.cs
└── SlimeMMO.Monster.asmdef

generators/
└── gen_monster_family.py  (assign family to all 294 monsters)
```

---

# 30. Final Verdict

**Status: MISSING → design complete**

Monster Family adds combat depth and long-term Bestiary goal. Not a power BLOCKER but important for combat design coherence. Implement with Dungeon Architecture (monsters need family before dungeon design finalizes).
