# SYSTEM 15 — Damage Type Architecture
> Status: MISSING → cần define rõ ràng
> Ngày: 2026-06-13

---

# 1. Purpose

Damage Type Architecture định nghĩa **tất cả các loại sát thương** trong game, cách chúng tương tác với defense, resistance, mitigation, và cap. Tránh ambiguity giữa Physical/Magical/True damage.

---

# 2. Design Philosophy

- **3 main damage types:** Physical, Magical, True
- **True damage = không bị mitigate** (chỉ dùng cho skill/env hazard đặc biệt)
- **Element = sub-type của Magical** (không tách rời)
- **DOT (Damage over Time) = riêng category** với tick mechanics
- **Cap per source** để tránh stacking exploit

---

# 3. Core Loop

```
[Skill/Attack triggers]
        │
        ▼
[Determine DamageType + Element]
        │
        ▼
[Apply ATK type (Physical ATK vs Magical ATK)]
        │
        ▼
[Apply ElementMult (Element Chart)]
        │
        ▼
[Apply DefenseMitigation (Physical DEF vs Magic RES)]
        │
        ▼
[Apply DamageType-specific cap]
        │
        ▼
[Final damage applied to target HP]
```

---

# 4. Progression Loop

Damage types không "progress" riêng — chúng là constant framework. Player build progression:
- Early: mostly Physical (warrior) hoặc Magical (mage)
- Mid: hybrid builds, element optimization
- Late: True damage skills unlock (limited, special boss mechanics)

---

# 5. Data Architecture

## 5.1 Entity (Damage Type Definition)

```
DamageTypeConfig
├── type_id: string            ("physical","magical","true","dot_physical","dot_magical","env")
├── display_name: string
├── uses_physical_atk: bool
├── uses_magical_atk: bool
├── mitigated_by_def: bool
├── mitigated_by_res: bool
├── affected_by_element: bool
├── capped_by_pvp: bool        (all except True)
├── max_single_hit_cap: float  (prevent one-shot)
└── dot_tick_interval: float   (0 if not DOT)

SkillDataSO (updated)
├── ... (existing fields)
├── damage_type: string        ("physical","magical","true","dot_physical","dot_magical")
└── element: string            ("Fire","Water","Earth","Wind","Light","Dark","Neutral")
```

## 5.2 Damage Types Full Table

| Type ID | ATK Source | Mitigated By | Element | PvP Cap | Use Case |
|---|---|---|---|---|---|
| physical | Physical ATK | Physical DEF | No | ×0.5 | Warrior basic attack, Ranger |
| magical | Magical ATK | Magic RES | Yes (×ElementMult) | ×0.5 | Mage skills, elemental spells |
| true | — | Nothing | No | No | Boss phase ability, env hazard |
| dot_physical | Physical ATK×0.3 | Physical DEF | No | ×0.5 | Bleed, Poison (physical) |
| dot_magical | Magical ATK×0.3 | Magic RES | Yes | ×0.5 | Burn, Freeze DOT |
| env_hazard | Fixed amount | Nothing | No | No | Lava floor, spike trap |
| healing_neg | — | Nothing | No | No | Anti-heal (reverse heal) |

## 5.3 Database Tables

```sql
CREATE TABLE damage_type_config (
    type_id                 VARCHAR(32) PRIMARY KEY,
    display_name            VARCHAR(64) NOT NULL,
    uses_physical_atk       TINYINT NOT NULL DEFAULT 1,
    uses_magical_atk        TINYINT NOT NULL DEFAULT 0,
    mitigated_by_def        TINYINT NOT NULL DEFAULT 1,
    mitigated_by_res        TINYINT NOT NULL DEFAULT 0,
    affected_by_element     TINYINT NOT NULL DEFAULT 0,
    capped_by_pvp           TINYINT NOT NULL DEFAULT 1,
    max_single_hit_ratio    FLOAT NOT NULL DEFAULT 0.5,  -- max % of target MaxHP per hit
    dot_tick_interval       FLOAT NOT NULL DEFAULT 0
);

CREATE TABLE status_effect_config (
    status_id               VARCHAR(32) PRIMARY KEY,
    name                    VARCHAR(64) NOT NULL,
    damage_type             VARCHAR(32) REFERENCES damage_type_config(type_id),
    base_dps_ratio          FLOAT NOT NULL DEFAULT 0,  -- ratio of skill_base as DPS
    max_stack               TINYINT NOT NULL DEFAULT 1,
    duration_base_sec       FLOAT NOT NULL DEFAULT 3,
    is_cc                   TINYINT NOT NULL DEFAULT 0,  -- crowd control
    cc_type                 VARCHAR(16),                  -- "stun","slow","root","silence"
    cc_resist_stat          VARCHAR(32) DEFAULT 'cc_resist'
);
```

## 5.4 CSV Schema

`damage_type_config.csv`:
```
type_id,display_name,uses_physical_atk,uses_magical_atk,mitigated_by_def,mitigated_by_res,affected_by_element,capped_by_pvp,max_single_hit_ratio,dot_tick_interval
physical,Physical,true,false,true,false,false,true,0.5,0
magical,Magical,false,true,false,true,true,true,0.5,0
true,True,false,false,false,false,false,false,1.0,0
dot_physical,Physical DOT,true,false,true,false,false,true,0.3,1.0
dot_magical,Magical DOT,false,true,false,true,true,true,0.3,1.0
env_hazard,Environmental,false,false,false,false,false,false,0.2,0
```

`status_effect_config.csv`:
```
status_id,name,damage_type,base_dps_ratio,max_stack,duration_base_sec,is_cc,cc_type,cc_resist_stat
burn,Burn,dot_magical,0.05,3,3.0,false,,
bleed,Bleed,dot_physical,0.04,5,5.0,false,,
poison,Poison,dot_physical,0.03,1,8.0,false,,
freeze,Freeze,dot_magical,0.02,1,2.0,true,slow,cc_resist
stun,Stun,,0,1,1.5,true,stun,cc_resist
slow,Slow,,0,1,3.0,true,slow,cc_resist
root,Root,,0,1,2.0,true,root,cc_resist
silence,Silence,,0,1,3.0,true,silence,cc_resist
```

## 5.5 JSON Schema

```json
{
  "name": "damage_type_config",
  "types": [
    {
      "type_id": "magical",
      "display_name": "Magical",
      "uses_physical_atk": false,
      "uses_magical_atk": true,
      "mitigated_by_def": false,
      "mitigated_by_res": true,
      "affected_by_element": true,
      "capped_by_pvp": true,
      "max_single_hit_ratio": 0.5,
      "dot_tick_interval": 0
    }
  ],
  "status_effects": [
    {
      "status_id": "burn",
      "name": "Burn",
      "damage_type": "dot_magical",
      "base_dps_ratio": 0.05,
      "max_stack": 3,
      "duration_base_sec": 3.0,
      "is_cc": false,
      "cc_type": null
    }
  ]
}
```

---

# 6. Formula Architecture

## 6.1 Physical Damage

```
PhysicalDamage = PhysicalATK × SkillMult × CritMult × ContextMult
                 × (1 - PhysicalMitigation)
                 × SituationalCap

PhysicalMitigation = target.DEF / (target.DEF + 1000 + attacker.level × 5)
```

## 6.2 Magical Damage

```
MagicalDamage = MagicalATK × SkillMult × CritMult × ElementMult × ContextMult
                × (1 - MagicalMitigation)
                × SituationalCap

MagicalMitigation = target.MagicRES / (target.MagicRES + 1000 + attacker.level × 5)
ElementMult = ElementChart[skill.element][target.element]  ∈ [0.7, 1.4]
```

## 6.3 True Damage

```
TrueDamage = fixed_value OR ratio_of_target_MaxHP
           (no mitigation, no element, no cap)
           (only allowed in specific boss phase skills)
```

## 6.4 DOT Mechanics

```
DOT tick interval = status_effect_config.dot_tick_interval  (e.g. 1.0 sec)
DOT DPS = attacker.relevant_ATK × base_dps_ratio
DOT tick damage = DOT_DPS × tick_interval

Stack mechanics:
  if stack_count < max_stack: add new stack
  else: refresh duration of oldest stack
  
Total DOT = ∑ DOT_DPS(stack_i) applied per second
```

## 6.5 Max Single Hit Cap

```
SingleHitCap = target.MaxHP × max_single_hit_ratio
  Physical/Magical: target.MaxHP × 0.5  (cannot one-shot)
  True: target.MaxHP × 1.0 (can one-shot, special use only)
  
FinalDamage = min(CalculatedDamage, SingleHitCap)
```

## 6.6 CC Resist Formula

```
CCSuccess = base_cc_rate × (1 - target.cc_resist)
target.cc_resist = cc_resist_stat / (cc_resist_stat + 500)

cc_resist cap: 0.75 (75% max CC resist)
```

## 6.7 Full DamageCalculator (updated with types)

```csharp
public static DamageResult Compute(AttackParams a, DefenseParams d, ContextParams ctx)
{
    float atk = a.damageType == "physical" ? a.physicalATK : a.magicalATK;
    float skillMult = Mathf.Min(a.skillMult, a.isUltimate ? 3.0f : 1.5f);
    float critMult  = a.isCrit ? (1f + Mathf.Min(a.critDmgBonus, 1.0f)) : 1.0f;
    float elemMult  = a.affectedByElement ? ElementChart.GetMult(a.element, d.element) : 1.0f;
    float contextMult = Mathf.Min(ctx.bossBonus, 1.3f) * (ctx.isPvp ? 0.5f : 1.0f);
    
    float mitigation = 0f;
    if (a.mitigatedByDef) mitigation = d.physDEF / (d.physDEF + 1000f + ctx.levelBonus);
    if (a.mitigatedByRes) mitigation = d.magicRES / (d.magicRES + 1000f + ctx.levelBonus);

    float raw = atk * skillMult * critMult * elemMult * contextMult * (1f - mitigation);
    float capped = Mathf.Min(raw, d.maxHP * a.maxSingleHitRatio);

    return new DamageResult {
        damage = (int)capped,
        damageType = a.damageType,
        element = a.element,
        isCrit = a.isCrit,
        isEffective = elemMult > 1.0f
    };
}
```

---

# 7. Power Budget

Damage type architecture không thêm power budget. Nó định nghĩa how existing power is applied.

---

# 8. Economy Impact

Không ảnh hưởng trực tiếp. Magic RES/Physical DEF stat được sell qua equipment → drives specific equipment demand.

---

# 9. Anti Power Creep

- True damage restricted: chỉ cho boss phase mechanics (không cho player skills)
- Single hit cap 50% MaxHP: không one-shot từ 100% HP
- DOT DPS ratio fixed (không scale with crit)

---

# 10. Progression Table

| Level Range | Typical Damage Breakdown |
|---|---|
| 1-200 | Physical 70%, Magical 25%, DOT 5% |
| 200-700 | Physical 50%, Magical 40%, DOT 10% |
| 700-1400 | Element builds 60% Magical, Physical 30% |
| 1400-2000 | Hybrid 50%/50%, DOT utility |

---

# 11. Reward Structure

Damage type knowledge là informational reward — understanding element system leads to better clears → better loot.

---

# 12. RNG Design

```
Crit chance = player.crit_rate (deterministic if above threshold)
  Actual roll: XorShift64() < crit_rate → crit = true

DOT tick: deterministic timer (no RNG)
Status CC success: XorShift64() < CCSuccess formula
```

---

# 13. Anti Bad Luck System

Không áp dụng trực tiếp cho damage types. Pity trong loot system là indirect protection.

---

# 14. Collection Integration

"Combat Log" — shows damage breakdown per encounter. Achievement for landing first element-effective hit.

---

# 15. Achievement Integration

| Achievement | Condition |
|---|---|
| Element Scholar | Land effective hit with all 6 elements |
| DOT Master | Apply 5 DOT stacks simultaneously |
| True Damage | Receive/deal True damage (boss mechanic) |
| CC Immune | Land CC on a boss that resists 75% CC |

---

# 16. Season Integration

Season boss may have damage type immunity phase: "Ice Phase" → resist physical, weak to fire.

---

# 17. PvE Integration

Dungeon hazards use `env_hazard` damage type — fixed amount, bypasses defense (teach players to avoid).
Boss phase may switch damage type resistance.

---

# 18. PvP Integration

All damage types get PvP ×0.5 applied AFTER all calculation.
Exception: True damage in PvP is further capped to 10% MaxHP per hit (PvP True damage softcap).

---

# 19. Social Integration

Party buff: "Warrior tanks physical; Mage DPS magical" creates natural party role synergy.
Guild raid: assign party roles based on damage type strengths.

---

# 20. Technical Architecture

```
DamageTypeConfigSO : ScriptableObject
├── DamageTypeEntry[] types
└── StatusEffectEntry[] statusEffects

StatusEffectManager : MonoBehaviour
├── Apply(targetId, statusId, attackerId, baseATK)
├── Tick() (called every frame, process DOT)
├── Remove(targetId, statusId)
└── GetTotalDOTDamage(targetId) : float

DamageCalculator (updated)
├── DamageTypeConfigSO _dmgTypes  [inject]
├── Compute(AttackParams, DefenseParams, ContextParams) : DamageResult
└── ComputeDOTTick(DOTState, DefenseParams) : int
```

---

# 21. Save Data Architecture

Status effects không saved (temporary in combat). DOT state lives in CombatInstance only.

---

# 22. Network Architecture

In PvP: damage calculated server-side, result broadcast.
In PvE: client predicts, server confirms on hit-confirm.
DOT: server is authoritative tick source in PvP.

---

# 23. Security

| Threat | Prevention |
|---|---|
| Fake True damage | Server validates: only specific boss skill IDs can deal True |
| DOT stack exploit | Server caps stacks at max_stack |
| One-shot exploit | SingleHitCap = 50% MaxHP server-validated |

---

# 24. LiveOps Hooks

```
event.element_effective_bonus = 1.1   (Element Surge: ×1.4 → ×1.54)
event.dot_damage_boost = 1.5          (DOT season)
flag.true_damage_boss_enabled = true
remote_config.physical_crit_dmg_cap = 1.0
remote_config.magic_crit_dmg_cap = 1.0
```

---

# 25. Content Pipeline

```
Google Sheet "Damage Type Config"
  → damage_type_config.csv
  → status_effect_config.csv
  → gen_damage_types.py (simple passthrough)
  → damage_type_config.json
  → DamageTypeConfigSO (Editor import)
```

---

# 26. Future Expansion

- Damage Type 4: "Void" (from Biome 21 skills) — bypasses 25% DEF/RES
- Sub-resistance: equipment with "Fire Resist %" (already designed in element chart)
- Damage reflection mechanic (boss shield phase)

---

# 27. Production Risks

| Rủi ro | Mức |
|---|---|
| True damage abuse | CRITICAL |
| DOT stacking too powerful | HIGH |
| Element resistance gear meta kill physical builds | MEDIUM |

---

# 28. Mitigation Plan

| Rủi ro | Giải pháp |
|---|---|
| True damage | Server whitelist: only boss_mechanic skills can deal True |
| DOT stacking | Max stack cap + diminishing duration on re-apply |
| Resistance meta | Physical def/Mag res soft-capped per equipment; Physical always relevant |

---

# 29. Unity Implementation Plan

```
Assets/script/SlimeMMO/Combat/
├── DamageTypeConfigSO.cs
├── StatusEffectConfigSO.cs
├── DamageCalculator.cs    (update: integrate damage types)
├── StatusEffectManager.cs
├── DamageResult.cs        (struct)
└── SlimeMMO.Combat.asmdef

generators/
└── gen_damage_types.py
```

---

# 30. Final Verdict

**Status: MISSING → design complete**

Cần implement cùng lúc với Element Chart (System 09) — chúng bổ sung nhau trong DamageCalculator. Priority: implement Physical/Magical distinction và DOT trong Sprint 2.
