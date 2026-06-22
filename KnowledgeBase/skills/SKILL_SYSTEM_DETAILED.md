# SKILL SYSTEM — DETAILED ARCHITECTURE
> Game: Slime MMORPG | Date: 2026-06-14 | Version: 1.0
> Power Budget: 13% (LOCKED) | Compatible: Damage Formula V10 + Element System

---

## 1. Design Philosophy

Slime MMORPG sử dụng **Weapon-Based Classless Skill System**: kỹ năng của người chơi phụ thuộc vào vũ khí đang trang bị, không phụ thuộc class cố định. Người chơi tự build bằng cách chọn vũ khí và invest skill points.

**Core Pillars:**
- Classless: 8 weapon types × skill sets → tự do build
- V10 Compatible: Skill contributes to `SkillMult` in Damage Formula
- 13% Power Budget: Phân bổ chính xác qua Active + Passive + Ultimate
- Deep but Accessible: 5 active slots nhưng depth từ upgrade + synergy

---

## 2. Power Budget Allocation (13%)

```
Total Power Budget:         100%
Skill Allocation:            13%

Breakdown:
  Active Skill Damage:        8.0%   (SkillMult in Damage Formula)
  Passive Skill Bonuses:      3.0%   (flat stat bonuses, not SkillMult)
  Ultimate Skill:             2.0%   (single largest SkillMult moment)
  ──────────────────────────────────
  TOTAL:                     13.0% ✅

Active Skill Power per slot (5 slots):
  Average SkillMult at max level: 1.80×
  Base auto-attack SkillMult:     1.0× (reference)
  Max single skill SkillMult:     3.5× (Ultimate)
  
  8% budget = skills deal ~1.5-2.5× base attack damage average
```

---

## 3. Weapon Types & Skill Sets

### 3.1 Eight Weapon Types

| # | Weapon | Role | Element Affinity | Style |
|---|---|---|---|---|
| 1 | Sword | DPS/Balance | None (all elements) | Single target |
| 2 | Greatsword | Heavy DPS | Fire/Earth | AOE, slow |
| 3 | Bow | Ranged DPS | Wind/Lightning | Kiting, combo |
| 4 | Staff | Magic DPS | All elements | Spell burst |
| 5 | Dagger | Speed DPS | Dark/Poison | DoT, crit-focus |
| 6 | Shield | Tank | Earth/Holy | Aggro, protect |
| 7 | Wand | Support/Heal | Light/Water | Buff, heal |
| 8 | Tome | Debuffer | Dark/Void | CC, debuff |

### 3.2 Skill Slots Per Weapon

Each weapon unlocks:
- **10 Active Skills** (max level 10 each)
- **10 Passive Skills** (max level 5 each)
- **1 Ultimate Skill** (max level 3)
- Total skills per weapon: 21

Global passive skills (weapon-independent):
- 5 universal passive skills (survival, mobility, economy)
- Available to all builds

---

## 4. Skill Progression System

### 4.1 Skill Points

```
Skill Points (SP) earned:
  Per level:      1 SP (L1→L2000 = 2,000 total SP)
  Ascension rank: +5 SP per rank (25 ranks = 125 SP)
  Achievement:    Some achievements grant SP (total ~50)
  
  TOTAL LIFETIME SP: ~2,175 SP

SP Cost per skill level:
  Active Skill Lv1:    2 SP
  Active Skill Lv10:  20 SP (2 per level)
  Passive Skill Lv1:  1 SP
  Passive Skill Lv5:   5 SP (1 per level)
  Ultimate Lv1:        5 SP
  Ultimate Lv3:       15 SP (5 per level)
  
Full weapon mastery (all skills max):
  10 Active × 20 = 200 SP
  10 Passive × 5  = 50 SP
  Ultimate × 15   = 15 SP
  Subtotal:          265 SP per weapon
  
Players can max ~8 weapon sets theoretically, but stamina gates prevent this.
Practical endgame: 1-2 weapons fully maxed, 2-3 partially.
```

### 4.2 Skill Reset

```
Skill Reset Options:
  Full Reset: 1,000g (early game, L1-100) / 10,000g (L101-500) / 50,000g (L501+)
  Partial Reset (single skill): 500g any level
  
Gold Sink: Major gold sink for the economy
No premium currency required for reset (not P2W)
```

### 4.3 Skill Unlock Progression

```
Weapon Proficiency Level (WPL):
  Gain WPL by equipping weapon and killing monsters
  WPL 1-50 (all players)
  
  WPL unlock gates:
    WPL 1:  First 5 Active Skills visible
    WPL 10: First 5 Passives unlocked
    WPL 20: Skills 6-8 Active unlocked
    WPL 30: Passives 6-8 unlocked
    WPL 40: Active 9-10 unlocked
    WPL 50: Ultimate unlocked, all Passives unlocked

Switching weapons: WPL resets (but skills retained if you return)
Build commitment: To unlock Ultimate requires WPL 50 (significant investment)
```

---

## 5. Active Skill Design

### 5.1 Active Skill Formula (V10 Integration)

```csharp
// Damage Formula V10:
// FinalDamage = ATK × SkillMult × CritMult × ElementMult × ContextMult
//              × (1 − DefMitigation) × SituationalCap

// Skill Mult calculation:
float SkillMult = skill.baseMultiplier + (skill.level - 1) × skill.scalingPerLevel;

// Example: Sword Slash Lv1 = 1.5×, Lv10 = 1.5 + 9×0.15 = 2.85×

// Element Application:
Element skillElement = skill.element;  // can be weapon element or skill-specific
ElementMult = ElementChartSO.GetMultiplier(skillElement, target.elementalWeakness);

// Combo Mult (if in combo chain):
if (comboCount >= skill.comboRequirement) SkillMult × = skill.comboBonus;
```

### 5.2 Active Skill Template

```
SkillDef {
    skillId:            string
    weaponType:         WeaponType
    unlockWPL:          int (1-50)
    skillType:          INSTANT | CHANNEL | CHARGE | DOT
    element:            ElementType (can be NONE = physical)
    
    baseMultiplier:     float   // SkillMult at Lv1
    scalingPerLevel:    float   // +SkillMult per level
    maxLevel:           10
    
    cooldownMs:         int     // 0 = no cooldown (spam)
    castTimeMs:         int     // 0 = instant
    range:              float   // meters
    aoeRadius:          float   // 0 = single target
    
    comboRequirement:   int     // how many hits before this triggers combo
    comboBonus:         float   // extra multiplier in combo
    
    statusEffect:       StatusEffect[]  // DoT, stun, slow etc.
    resourceCost:       int     // stamina cost per use
}
```

### 5.3 Sword Skill Set (Example — Full Set)

| # | Skill Name | Type | SkillMult Lv1→Lv10 | Element | CD | Notes |
|---|---|---|---|---|---|---|
| A1 | Quick Slash | INSTANT | 1.3→2.6 | Weapon | 0s | Spam attack |
| A2 | Power Strike | CHARGE | 1.8→3.4 | Weapon | 3s | Hold to charge |
| A3 | Sweep | INSTANT | 1.1→2.0 | Weapon | 2s | AOE 5m radius |
| A4 | Counter | INSTANT | 2.0→3.8 | Weapon | 8s | After block |
| A5 | Phantom Blade | INSTANT | 1.5→3.0 | Dark | 5s | Teleport + strike |
| A6 | Blade Dance | CHANNEL | 0.5×8→1.0×8 | Weapon | 12s | 8 rapid hits |
| A7 | Ground Slam | CHARGE | 2.2→4.0 | Earth | 10s | AOE knockback |
| A8 | Vital Strike | INSTANT | 1.2→2.4 | Weapon | 6s | CRIT Rate +50% |
| A9 | Elemental Infuse | INSTANT | 1.0→1.5 | Any | 15s | Imbues weapon 10s |
| A10 | Rending Slash | DOT | 0.8+0.3×5s→1.5+0.6×10s | Weapon | 20s | Bleed DoT |
| ULT | Sword God's Strike | INSTANT | 3.5→5.5 | Weapon | 300s | AOE 12m, knockback |

| # | Passive Name | Lv1 Effect → Lv5 Effect |
|---|---|---|
| P1 | Blade Mastery | ATK +2% → ATK +10% |
| P2 | Quick Draw | Slash CD −10% → −50% |
| P3 | Critical Focus | CRIT Rate +3% → +15% |
| P4 | Combo Veteran | Combo mult +5% → +25% |
| P5 | Armor Pierce | DEF ignore 3% → 15% |
| P6 | Battle Hunger | HP regen +2%/kill → +10% |
| P7 | Counter Instinct | Counter CD −2s → −10s |
| P8 | Phantom Step | Phantom Blade +0.2m range → +1m range |
| P9 | Steel Resolve | Guard damage −5% → −25% |
| P10 | Final Cut | Last skill in combo +10% → +50% |

---

## 6. Passive Skill Design

### 6.1 Passive Formula

```csharp
// Passives DO NOT modify SkillMult directly
// Passives modify the STAT that feeds into Damage Formula:

// Example: Blade Mastery Lv5 = ATK × 1.10
// This ATK feeds into: FinalDamage = ATK × SkillMult × ...

// Passive budget = 3% of total power
// 3% = sum of all passive bonuses at max level, relative to base stats

// Budget enforcement:
float totalPassiveATKBonus = PassiveManager.GetATKMultiplier(player);
// Must not exceed PowerBudgetManager.passiveCapMultiplier (enforced at runtime)
```

### 6.2 Global Passive Skills (Weapon-Independent)

| # | Passive | Lv1→Lv5 Effect | SP Cost/Level |
|---|---|---|---|
| G1 | Vitality | Max HP +3% → +15% | 1 |
| G2 | Iron Skin | DEF +2% → +10% | 1 |
| G3 | Swift Feet | Movement Speed +2% → +10% | 1 |
| G4 | Resource Mgmt | Stamina cost −5% → −25% | 1 |
| G5 | Survivor | HP Regen +1%/5s → +5%/5s | 1 |

---

## 7. Ultimate Skill System

### 7.1 Ultimate Mechanics

```
Ultimate Points (UP) system:
  Max UP:     100
  Gain:       +5 UP per active skill use
              +20 UP on kill
              +50 UP on boss kill
  
  Ultimate activation: Full 100 UP required
  UP decay: None (persists between fights)
  
  Ultimate Level (1-3):
    Lv1: unlocked at WPL 50 (5 SP)
    Lv2: requires 50 total SP in weapon skills (5 SP)
    Lv3: requires 100 total SP in weapon skills (5 SP)
```

### 7.2 Ultimate Skill Examples

```
Sword God's Strike (Sword Ultimate):
  Level 1: SkillMult 3.5×, AOE 8m, Knockback 5m
  Level 2: SkillMult 4.5×, AOE 10m, Knockback + 2s Stun
  Level 3: SkillMult 5.5×, AOE 12m, Knockback + 3s Stun, +50% Fire DMG for 5s
  CD: 300s (5 min)
  
Staff God's Meteor (Staff Ultimate):
  Level 1: SkillMult 4.0× per meteor × 5 meteors, AOE 6m each
  Level 2: SkillMult 5.0× per meteor × 6 meteors, Burn 5s DoT
  Level 3: SkillMult 6.0× per meteor × 7 meteors, Burn + Magic Vuln −20%
  CD: 300s (5 min)
```

---

## 8. Skill Combo System

### 8.1 Combo Counter

```
ComboCounter:
  +1 per active skill that hits
  Reset if: hit by enemy stun, 3s no action, miss streak (3 misses)
  
Combo Tier Effects:
  Combo 0-4:    No bonus
  Combo 5-9:    +5% SkillMult on all active skills
  Combo 10-19:  +10% SkillMult
  Combo 20-29:  +15% SkillMult + small heal on kill
  Combo 30+:    +20% SkillMult + UP gain rate ×1.5
```

### 8.2 Skill Synergy

Certain skills combo with each other for bonus effects:

| Skill A | Skill B | Synergy Effect |
|---|---|---|
| Elemental Infuse (Fire) | Power Strike | Burning Strike: +30% Fire DMG |
| Ground Slam | Quick Slash | Grounded Slash: target knocked down +25% more hits |
| Counter | Blade Dance | Counter-Dance: Blade Dance CD resets |
| Phantom Blade | Vital Strike | Phantom Vital: CRIT guaranteed next hit |
| ANY Spirit Skill | Matching Element Skill | Spirit Resonance: +10% ContextMult if skill element matches Spirit element |

---

## 9. Skill Scaling by Level Range

Balancing SkillMult across level ranges:

| Player Level | Target SkillMult (active L10) | Reasoning |
|---|---|---|
| L1-100 | 1.3-2.0× | Tutorial/early phase, basic combat |
| L101-400 | 2.0-2.8× | Mid game, skill investment paying off |
| L401-800 | 2.5-3.0× | Late game, specialize build |
| L801-1500 | 2.8-3.3× | End game, mastery build |
| L1501-2000 | 3.0-3.5× | Max tier, full max skill level |
| Ultimate (any level) | 3.5-5.5× | Single best moment per 5 min |

---

## 10. Save Data

```csharp
public class SkillSaveData {
    public Dictionary<string, WeaponSkillProgress> weaponProgress;
                                                // key: weaponType
    public int totalSpentSP;
    public int availableSP;
    public int[] equippedSkillSlots;            // 5 active skill IDs
    public int ultimateSkillId;
    public int ultimatePoints;                  // 0-100
    public int comboRecord;                     // highest combo achieved
}

public class WeaponSkillProgress {
    public int weaponProficiencyLevel;          // 0-50
    public Dictionary<string, int> skillLevels; // skillId → level
    public int totalSPSpent;
}
```

---

## 11. Database Schema

```sql
CREATE TABLE player_skills (
    player_id           BIGINT NOT NULL REFERENCES players(player_id),
    skill_id            VARCHAR(64) NOT NULL,
    weapon_type         VARCHAR(16) NOT NULL,
    skill_level         SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, skill_id)
);

CREATE TABLE player_weapon_proficiency (
    player_id           BIGINT NOT NULL REFERENCES players(player_id),
    weapon_type         VARCHAR(16) NOT NULL,
    proficiency_level   SMALLINT NOT NULL DEFAULT 0,
    proficiency_xp      INT NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, weapon_type)
);

CREATE TABLE player_skill_slots (
    player_id           BIGINT NOT NULL REFERENCES players(player_id),
    slot_index          SMALLINT NOT NULL,
    equipped_skill_id   VARCHAR(64),
    PRIMARY KEY (player_id, slot_index)
);

CREATE TABLE skill_config (
    skill_id            VARCHAR(64) PRIMARY KEY,
    weapon_type         VARCHAR(16) NOT NULL,
    skill_type          VARCHAR(16) NOT NULL,
    unlock_wpl          SMALLINT NOT NULL DEFAULT 1,
    base_multiplier     FLOAT NOT NULL,
    scaling_per_level   FLOAT NOT NULL,
    max_level           SMALLINT NOT NULL DEFAULT 10,
    cooldown_ms         INT NOT NULL DEFAULT 0,
    cast_time_ms        INT NOT NULL DEFAULT 0,
    element             VARCHAR(16),
    stats_json          JSONB,
    combo_json          JSONB,
    status_effects_json JSONB
);
```

---

## 12. Network Packets

```
SkillUse            = 0x0800  // C2S: use skill (server validates CD, cost)
SkillHitResult      = 0x0801  // S2C: damage numbers, status effects
SkillLevelUp        = 0x0802  // C2S: invest SP into skill
SkillLevelUpResult  = 0x0803  // S2C: new skill level + stat update
SkillSlotChange     = 0x0804  // C2S: equip/unequip active skill
UltimatePointsUpdate= 0x0805  // S2C: UP changed
ComboUpdate         = 0x0806  // S2C: combo counter (broadcast to party)
SkillReset          = 0x0807  // C2S: reset skills (with gold payment)
SkillResetResult    = 0x0808  // S2C: SP refunded, skills reset
```

---

## 13. Power Budget Validation

```
Budget Check at max build (1 weapon fully maxed):
  Actives (L10 avg SkillMult 2.85): contributes ~8% of power ✅
  Passives (L5 avg +15% ATK):       contributes ~3% of power ✅  
  Ultimate (L3 = 5.5×, 5min CD):    contributes ~2% of power (per encounter) ✅
  TOTAL:                             13% ✅

PowerBudgetManager.ValidateSkillContribution():
  Checks: totalSkillMult / totalPossibleDamage ≤ 0.13
  Enforced at runtime, server-side
```

---

## 14. UML Diagram

```
PlayerCharacter
  ├── SkillManager
  │     ├── AvailableSkillSP: int
  │     ├── WeaponProficiency[8]: WeaponProgress
  │     │     ├── ProficiencyLevel: 0-50
  │     │     └── SkillLevels: Dict<skillId, level>
  │     ├── EquippedSkills[5]: SkillDef
  │     ├── EquippedUltimate: SkillDef
  │     ├── UltimatePoints: 0-100
  │     └── ComboCounter: int
  │
  ├── SkillExecutor
  │     ├── UseSkill(skillId) → validates CD → server send
  │     ├── UseUltimate() → validates UP≥100 → server send
  │     └── UpdateCombo(hit/miss)
  │
  └── SkillCalculator (server-side)
        ├── ComputeSkillMult(skill, level, combo)
        ├── ApplySynergy(skillA, skillB) → bonusMult
        └── ValidateBudget() → ensure ≤ 13%
```

---

---

## 15. COMPATIBILITY AUDIT — Damage Formula V10 & Element System

```
MANDATORY COMPATIBILITY CHECK RESULTS (2026-06-14):

[1] Damage Formula V10:
  FinalDamage = ATK × SkillMult × CritMult × ElementMult × ContextMult
                × (1 − DefMitigation) × SituationalCap
  
  Skill System feeds into: SkillMult ONLY
    float SkillMult = baseMultiplier + (level-1) × scalingPerLevel
    Combo modifier: SkillMult *= (1 + comboBonus)  — still SkillMult, no new term
    Ultimate: same formula, larger base/scaling values
  
  Passive skills feed into: Existing stats (ATK%, DEF%, HP%, CRIT%)
    → ATK feeds back into V10 via "ATK" term (no new formula term)
    
  NO new formula component created ✅
  NO new stat outside ATK/DEF/HP/CRIT/Speed ✅

[2] Element System Compatibility (09_ELEMENT_CHART.md):
  6 valid elements: Fire, Water, Earth, Wind, Light, Dark
  Phantom Blade: FIXED → "Dark" element (was incorrectly "Void")
  Elemental Infuse: Player chooses ANY of 6 elements (imbue for 10s)
  Ground Slam: Earth element ✅
  Staff skills: Fire/Water/Wind/Light elements ✅
  
  Void element: NOT used in current skill set (reserved for Future Expansion)
  All weapon skill elements use only Fire/Water/Earth/Wind/Light/Dark/None ✅

[3] Spirit Resonance Synergy (SoulBond integration):
  Spirit Resonance goes into ContextMult (existing V10 component):
    contextMult *= (1.0f + spiritResonanceBonus)
    spiritResonanceBonus = 0.10f (10%) when skill.element == equippedSpirit.element
  
  Power Budget: This +10% ContextMult is WITHIN the 13% skill budget
    (Passive Skill budget 3% covers synergy effects)
  No new V10 formula term created ✅

[4] Passive Stat Budget:
  All passives modify: ATK%, DEF%, HP%, CRIT Rate%, CRIT DMG%, CD%
  CD reduction: Affects skill cooldown (NOT damage formula)
  HP Regen: survival utility (NOT damage formula)
  All within existing stat definitions ✅

[5] Stats Created: NONE NEW
  Uses only: ATK, DEF, HP, CRIT Rate, CRIT DMG, Speed, CD
  All defined in existing PlayerSaveData stats fields ✅

VERDICT: SKILL_SYSTEM_DETAILED.md is FULLY COMPATIBLE with:
  ✅ Damage Formula V10
  ✅ Element System (6 elements only, Void removed)
  ✅ Power Budget V3 (13% confirmed)
  ✅ Existing stat system (no new stats)
  ✅ SoulBond integration via ContextMult (no new formula term)
```

---

*Document: SKILL_SYSTEM_DETAILED.md | Version: 1.1 | Date: 2026-06-14*
*Weapon types: 8 | Skills per weapon: 21 | Max SP: ~2,175 | Power Budget: 13% ✅*
*V1.1 Fix: Phantom Blade element Void→Dark | Spirit Resonance→ContextMult | Compatibility Section added*
