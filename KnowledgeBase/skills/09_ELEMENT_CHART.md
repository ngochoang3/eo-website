# SYSTEM 09 — Element Chart & Resistance System
> Status: BLOCKER → ElementMult hiện = 1.0 hardcode
> Power Budget: Included trong Damage Formula (không thêm budget)
> Ngày: 2026-06-13

---

# 1. Purpose

Element Chart là ma trận **6×6 tương khắc** xác định ElementMult trong công thức damage. Hiện tại ElementMult = 1.0 hardcode trong DamageCalculator.cs — đây là BLOCKER vì thiếu cả một dimension của combat depth.

**Invariant:** ElementMult ≤ 1.4 (hard cap trong damage formula)

---

# 2. Design Philosophy

- **6 elements:** Fire, Water, Earth, Wind, Light, Dark
- **3 tiers:** Effective (×1.4), Neutral (×1.0), Resisted (×0.7)
- **Biome element weakness:** Mỗi biome có 1 weakness element
- **Monster element:** Mỗi monster có element type
- **Equipment element affinity:** Skill có element type
- **Không circular:** A beats B, B beats C, A neutral vs C (không paper-scissors-stone full circle)

---

# 3. Core Loop

```
[Player uses skill with element E_attack]
        │
        ▼
[Target has element E_defense]
        │
        ▼
[Lookup ElementChart[E_attack][E_defense] → mult]
        │
        ▼
[Apply ElementMult to FinalDamage formula]
        │
        ▼
[Biome Element Bonus: if in weakness biome → ×1.1 additional]
```

---

# 4. Progression Loop

Players learn element system through:
- Level 1: Tutorial explains basic (Fire > Earth)
- Level 100: Element Chart UI unlocked in Collection
- Level 500: Element Mastery — tracking damage vs each element type
- Level 1000: Advanced element builds (stack element for max ×1.4)

---

# 5. Data Architecture

## 5.1 Element Chart (6×6 matrix)

```
ATTACKER    → DEFENDER:  Fire  Water  Earth  Wind  Light  Dark
──────────────────────────────────────────────────────────────
Fire               Fire:  1.0   0.7    1.4    1.0    1.0   1.0
Water             Water:  1.4   1.0    0.7    1.0    1.0   1.0
Earth             Earth:  0.7   1.4    1.0    1.0    1.0   1.0
Wind               Wind:  1.0   1.0    1.0    1.0    1.4   0.7
Light             Light:  1.0   1.0    1.0    0.7    1.0   1.4
Dark               Dark:  1.0   1.0    1.0    1.4    0.7   1.0
Neutral          (any):   1.0   1.0    1.0    1.0    1.0   1.0
```

**Relationships:**
- Fire beats Earth (volcanic melts rock)
- Water beats Fire (extinguish)
- Earth beats Water (absorbs)
- Wind beats Dark (light disperses darkness via wind carrying light)
- Light beats Dark (classical)
- Dark beats Light (darkness consumes light in void)
- Neutral = no element, always 1.0

## 5.2 Element ScriptableObject

```
ElementChartSO
├── ElementEntry[] entries (42 = 6 attackers × 7 defenders incl Neutral)
│   ├── attacker_element: string
│   ├── defender_element: string
│   └── multiplier: float  (0.7, 1.0, or 1.4)

BiomeElementWeaknessSO
├── BiomeWeakness[] biomes (21 entries)
│   ├── biome_id: int
│   ├── primary_element: string  (biome's own element)
│   └── weakness_element: string (what's effective against this biome's monsters)
```

## 5.3 Database Tables

```sql
CREATE TABLE element_chart (
    attacker_element    VARCHAR(16) NOT NULL,
    defender_element    VARCHAR(16) NOT NULL,
    multiplier          FLOAT NOT NULL DEFAULT 1.0,
    PRIMARY KEY (attacker_element, defender_element)
);

CREATE TABLE biome_element_weakness (
    biome_id            TINYINT PRIMARY KEY,
    primary_element     VARCHAR(16) NOT NULL,
    weakness_element    VARCHAR(16) NOT NULL,
    resistance_element  VARCHAR(16)
);

-- Monster element already in monster_data.element
-- Skill element already in skill_data.element
```

## 5.4 CSV Schema

`element_chart.csv`:
```
attacker,defender,multiplier
Fire,Fire,1.0
Fire,Water,0.7
Fire,Earth,1.4
Fire,Wind,1.0
Fire,Light,1.0
Fire,Dark,1.0
Fire,Neutral,1.0
Water,Fire,1.4
Water,Water,1.0
Water,Earth,0.7
...
```

`biome_element_weakness.csv`:
```
biome_id,biome_name,primary_element,weakness_element,resistance_element
1,Verdant Meadow,Nature/Neutral,Fire,Water
2,Crystal Cave,Ice/Light,Dark,Fire
3,Volcanic Ridge,Fire,Water,Earth
4,Frozen Tundra,Ice/Water,Fire,Water
5,Sunken Reef,Water,Wind,Fire
6,Ancient Forest,Nature/Earth,Fire,Water
7,Desert Dunes,Earth,Water,Fire
8,Stormy Highlands,Wind,Earth,Fire
9,Mystic Swamp,Dark/Water,Light,Dark
10,Celestial Peak,Wind/Light,Dark,Wind
11,Ruined City,Neutral,Light,Dark
12,Shadow Vale,Dark,Light,Fire
13,Ember Plains,Fire/Earth,Water,Fire
14,Frost Abyss,Ice/Dark,Fire,Water
15,Coral Labyrinth,Water,Wind,Earth
16,Thunderspire,Wind/Light,Dark,Wind
17,Blight Marsh,Dark/Poison,Light,Dark
18,Phantom Crossing,Dark,Light,Earth
19,Lava Fortress,Fire,Water,Fire
20,Sky Citadel,Wind/Light,Dark,Wind
21,Void Realm,Dark/Neutral,Light,Void
```

## 5.5 JSON Schema

`element_chart.json`:
```json
{
  "name": "element_chart",
  "elements": ["Fire","Water","Earth","Wind","Light","Dark","Neutral"],
  "matrix": {
    "Fire":    {"Fire":1.0,"Water":0.7,"Earth":1.4,"Wind":1.0,"Light":1.0,"Dark":1.0,"Neutral":1.0},
    "Water":   {"Fire":1.4,"Water":1.0,"Earth":0.7,"Wind":1.0,"Light":1.0,"Dark":1.0,"Neutral":1.0},
    "Earth":   {"Fire":0.7,"Water":1.4,"Earth":1.0,"Wind":1.0,"Light":1.0,"Dark":1.0,"Neutral":1.0},
    "Wind":    {"Fire":1.0,"Water":1.0,"Earth":1.0,"Wind":1.0,"Light":1.4,"Dark":0.7,"Neutral":1.0},
    "Light":   {"Fire":1.0,"Water":1.0,"Earth":1.0,"Wind":0.7,"Light":1.0,"Dark":1.4,"Neutral":1.0},
    "Dark":    {"Fire":1.0,"Water":1.0,"Earth":1.0,"Wind":1.4,"Light":0.7,"Dark":1.0,"Neutral":1.0},
    "Neutral": {"Fire":1.0,"Water":1.0,"Earth":1.0,"Wind":1.0,"Light":1.0,"Dark":1.0,"Neutral":1.0}
  }
}
```

`biome_element_weakness.json`:
```json
{
  "name": "biome_element_weakness",
  "rows": [
    {"biome_id":1,"primary_element":"Neutral","weakness_element":"Fire","resistance_element":"Water"},
    {"biome_id":3,"primary_element":"Fire","weakness_element":"Water","resistance_element":"Earth"}
  ]
}
```

---

# 6. Formula Architecture

## 6.1 ElementMult Lookup

```csharp
public static float GetElementMult(string attackElement, string defenseElement)
{
    if (!_chart.matrix.TryGetValue(attackElement, out var row)) return 1.0f;
    if (!row.TryGetValue(defenseElement, out float mult)) return 1.0f;
    return Mathf.Min(mult, 1.4f);  // hard cap
}
```

## 6.2 Full Damage Formula (updated)

```
FinalDamage = ATKtotal × SkillMult × CritMult × ElementMult × ContextMult
              × (1 − DefMitigation)
              × SituationalCap(level)

Where:
  ElementMult = GetElementMult(skill.element, target.element) ∈ [0.7, 1.4]
  BiomeBonus  = biome.weakness_element == skill.element ? 1.1 : 1.0
  (BiomeBonus NOT in ElementMult — applied as separate ContextMult multiplier)
```

## 6.3 Element Resistance in Equipment

```
EquipElementResistance(equipped) = ∑ element_resist_pct[slot_i]
  Reduces incoming ElementMult for that element:
  EffectiveElementMult = base_mult - ElementResist (min 0.7)
  Example: Fire resist 0.2 → Fire attack ×1.4 becomes ×1.2
```

## 6.4 Element Affinity in Skill

```
SkillElement = skill_db[skill_id].element
  → Used directly in ElementMult lookup
  → Neutral skill: ElementMult always 1.0
  → Element skill vs matching element gear: Rune resonance bonus applies
```

---

# 7. Power Budget

Element system không thêm vào power budget — nó là **modifier** trong damage formula đã có. ElementMult capped ≤ 1.4 đã được enforce trong DamageCalculator.

---

# 8. Economy Impact

Element information drives:
- Biome-specific gear sales (element-matching weapons)
- Rune demand (element runes for resonance)
- No direct gold sink/source

---

# 9. Anti Power Creep

- Max ElementMult = 1.4 (hard cap, not negotiable)
- Min ElementMult = 0.7 (resist — không thể làm 0 damage với element)
- BiomeBonus max 1.1 (10% bonus only when attacking weakness biome's monsters)

---

# 10. Progression Table

| Level | Element Understanding |
|---|---|
| 1 | Tutorial: Fire vs Earth demo |
| 50 | Element chart UI |
| 200 | Biome weakness shown on map |
| 500 | Element Mastery tracking |
| 1000 | Advanced: rune resonance + element combos |
| 1500 | Element synergy teams in raid |

---

# 11. Reward Structure

| Mốc | Reward |
|---|---|
| First effective hit (×1.4) | Achievement + element hint |
| Exploit all 6 weaknesses | "Element Master" |
| Clear dungeon with matching element | Bonus loot +20% |
| Collection: all element types discovered | "Scholar of Elements" |

---

# 12. RNG Design

Element system là deterministic — không có RNG trong element calculation.

---

# 13. Anti Bad Luck System

Không áp dụng — element là deterministic.

---

# 14. Collection Integration

"Element Codex" trong Collection Hall:
- 6 element entries với lore
- Element chart visualization (interactive)
- "Effective attacks landed" counter per element

---

# 15. Achievement Integration

| Achievement | Condition |
|---|---|
| Elemental Novice | First ×1.4 hit |
| Six-Element Scholar | Land ×1.4 hit with all 6 elements |
| Void Walker | Deal damage with Void element (Biome 21 only) |
| Element Guard | Block ×1.4 element with resist gear |

---

# 16. Season Integration

Season affix: "Elemental Surge" — element affinity rotates per week trong season.

---

# 17. PvE Integration

Dungeon door hints: "Biome 3 monsters are weak to Water"
Boss element weakness shown in boss HP bar UI
Raid: multiple phases may switch element (Fire phase → Water phase)

---

# 18. PvP Integration

Element applies in PvP (not removed — adds depth). Player needs element-diverse gear for PvP. PvP damage cap ×0.5 applies AFTER element mult.

---

# 19. Social Integration

Party: element buff role — 1 player tanks (earth build), 1 DPS (effective element), 1 support. Encourages diverse team composition.

---

# 20. Technical Architecture

## Class Diagram

```
ElementChartSO : ScriptableObject
├── Dictionary<string, Dictionary<string, float>> matrix
└── GetMult(attacker, defender) : float

BiomeElementWeaknessSO : ScriptableObject
└── BiomeWeakness[] biomes

ElementResistanceSO : ScriptableObject  (per equipment affix)
└── string element, float resistPct

DamageCalculator (updated)
├── ElementChartSO _chart  [inject]
├── BiomeElementWeaknessSO _biomeWeakness [inject]
├── GetElementMult(skill, target) : float
└── GetBiomeBonus(skill, biomeId) : float
```

## Updated DamageCalculator.Compute()

```csharp
public static float Compute(AttackParams a, DefenseParams d, ContextParams ctx)
{
    float skillMult  = Mathf.Min(a.skillMult, a.isUltimate ? 3.0f : 1.5f);
    float critMult   = a.isCrit ? (1f + Mathf.Min(a.critDmgBonus, 1.0f)) : 1.0f;
    float elemMult   = _chart.GetMult(a.element, d.element);          // WAS 1.0f hardcode
    float biomeMult  = _biomeWeakness.GetBonus(a.element, ctx.biomeId); // WAS missing
    float contextMult= Mathf.Min(ctx.bossBonus, 1.3f) * (ctx.isPvp ? 0.5f : 1.0f);
    float defMit     = d.defPct / (d.defPct + 1000f);

    return a.atkTotal * skillMult * critMult * elemMult * biomeMult * contextMult
           * (1f - defMit)
           * SituationalCap(ctx.level);
}
```

---

# 21. Save Data Architecture

Element state không cần save trong PlayerSaveData — nó's static data (chart) + monster state (server).
Player element resist from equipment saved trong `equipment.equipped[slot].affixes[]`.

---

# 22. Network Architecture

Element calculation chạy server-side cho PvP; client chạy predict cho PvE (reconcile with server on hit-confirm).

---

# 23. Security

| Threat | Prevention |
|---|---|
| Fake element mult | Server recalculates từ skill.element + target.element |
| Element resist cheat | Server reads equip data từ DB, không trust client |

---

# 24. LiveOps Hooks

```
event.element_effectiveness_boost = 1.1  (Element Surge event: ×1.4 → ×1.54 cap)
flag.advanced_element_enabled = true
remote_config.element_effective_mult = 1.4
remote_config.element_resist_mult = 0.7
```

---

# 25. Content Pipeline

```
Google Sheet "Element Chart" (6×7 matrix)
  → element_chart.csv
  → gen_element_chart.py (trivial: read matrix, output JSON)
  → element_chart.json
  → ElementChartSO (Editor import)

Google Sheet "Biome Weakness"
  → biome_element_weakness.csv
  → biome_element_weakness.json
  → BiomeElementWeaknessSO
```

---

# 26. Future Expansion

- Element 7: "Void" (only in Biome 21) — ×1.2 vs all, resisted by nothing, ×0.5 in PvP
- Sub-elements: Fire-Earth → Magma (×1.5 vs special enemies)
- Element stacking for coordinated raid (party all same element → ×1.5 cap)

---

# 27. Production Risks

| Rủi ro | Mức |
|---|---|
| Element system too complex for casual players | MEDIUM |
| ElementMult inconsistency client vs server | HIGH |
| Void element (future) breaks chart | MEDIUM |

---

# 28. Mitigation Plan

| Rủi ro | Giải pháp |
|---|---|
| Too complex | UI shows "Effective/Neutral/Resisted" not raw number |
| Client/server mismatch | Shared ElementChartSO loaded from same JSON on both |
| Void element | Reserve "Void" entry in chart now (all 1.0 placeholder) |

---

# 29. Unity Implementation Plan

```
Assets/script/SlimeMMO/Core/
├── ElementChartSO.cs       (update DamageCalculator to use it)
├── BiomeElementWeaknessSO.cs
└── (DamageCalculator.cs — update ElementMult from 1.0f hardcode)

Assets/Resources/GameData/
├── element_chart.json
└── biome_element_weakness.json

generators/
└── gen_element_chart.py
```

---

# 30. Final Verdict

**Status: BLOCKER (P0 — highest priority)**

`ElementMult = 1.0f` hardcode trong DamageCalculator.cs là BLOCKER nghiêm trọng nhất sau Save Data. Toàn bộ combat depth phụ thuộc vào element system. **Fix ngay trong Sprint 1.**
