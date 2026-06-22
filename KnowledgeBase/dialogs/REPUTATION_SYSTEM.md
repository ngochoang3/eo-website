# REPUTATION SYSTEM ARCHITECTURE
> Game: Slime MMORPG | Date: 2026-06-14 | Version: 1.0
> Power Budget: 1% (LOCKED) | Source of Truth: systems/01_POWER_BUDGET.md
> Formula: 4 Factions × 0.25% max each = 1.0% total

---

## MANDATORY COMPATIBILITY CHECK

```
[Source of Truth]
  01_POWER_BUDGET.md → ReputationPower = ∑ combat_bonus_pct[faction] = 4 × 0.25% = 1%
  09_ELEMENT_CHART.md → Faction bonus targets enemy elements (existing 6-element system)
  00_SAVE_DATA_SYSTEM.md → ReputationSaveData extends V8
  08_MAIL_SYSTEM.md → Faction mail rewards
  ECONOMY_AUDIT.md → Faction shops use Gold (existing currency)

Reputation DOES NOT:
  ✗ Create new damage formula component
  ✗ Create new stat outside existing (ATK/DEF/HP/CRIT Rate etc.)
  ✗ Add new currency (uses existing Gold + reputation_token as consumed item)
  ✓ Combat bonus: fraction of ATK against specific enemy element type
  ✓ Shops use: Gold + event rewards (existing)
  ✓ Faction shops: Gold-only pricing, no premium_gem power items
```

---

## 1. Design Philosophy

Reputation hệ thống là **Social + Exploration Depth**:
- Người chơi khám phá thế giới → xây dựng quan hệ với faction địa phương
- Faction bonus nhỏ nhưng có ý nghĩa với build cụ thể (element-based)
- Faction shops cung cấp items thay thế cho dungeon farming
- Không P2W: Reputation chỉ qua gameplay, không bán bằng Diamond

**Core Pillars:**
- 4 Factions covering 21 biomes (Neutral biomes belong to no faction)
- Rep tiến triển chậm, phần thưởng dài hạn (6-month Exalted journey)
- Faction Shop: Unique items không có ở nơi khác (không phải best-in-slot)
- Negative Rep: Tấn công ally monsters giảm rep → choices matter

---

## 2. Faction Design (4 Factions)

### 2.1 Verdant Alliance
```
Theme:       Nature, growth, forest creatures
Biomes:      1-Verdant Meadow, 6-Ancient Forest, 8-Stormy Highlands, 
             13-Ember Plains (border), 1-Verdant Plains
Element:     Earth/Wind (biome primary)
Enemy:       Fire, Dark element monsters
Headquarters: Village of Origin (starting town) — familiar to all players

Reputation bonus at Exalted: +0.25% ATK vs Fire/Dark element enemies
Reasoning: Earth/Wind alliance fights against Fire (volcano) and Dark (shadow)
```

### 2.2 Flame Brotherhood
```
Theme:       Fire warriors, volcanic miners, desert nomads
Biomes:      3-Volcanic Ridge, 7-Desert Dunes, 19-Lava Fortress
Element:     Fire/Earth
Enemy:       Water, Ice element monsters
Headquarters: Ironforge Citadel (unlocked Level 300+)

Reputation bonus at Exalted: +0.25% ATK vs Water/Ice element enemies
Unlocks: Fire crafting recipes, Fire mount skins, volcanic building materials
```

### 2.3 Oceanic Covenant
```
Theme:       Sea races, water temples, coral civilization
Biomes:      5-Sunken Reef, 15-Coral Labyrinth, 4-Frozen Tundra (border)
Element:     Water/Light
Enemy:       Earth, Fire element monsters
Headquarters: Tidal Sanctum (unlocked Level 500+ via dungeon)

Reputation bonus at Exalted: +0.25% ATK vs Earth/Fire element enemies
Unlocks: Water breathing equipment, Aquatic mounts, Fisher recipes (Fishing unlock)
```

### 2.4 Shadow Council
```
Theme:       Mystery, shadow arts, ancient ruins, void explorers
Biomes:      12-Shadow Vale, 18-Phantom Crossing, 9-Mystic Swamp, 
             14-Frost Abyss, 21-Void Realm
Element:     Dark/Wind
Enemy:       Light, Wind element monsters
Headquarters: Hidden in Phantom Crossing (secret quest to unlock)

Reputation bonus at Exalted: +0.25% ATK vs Light/Wind element enemies
Unlocks: Dark arts recipes, Shadow mounts, Night Armor set
Note: Locked behind Level 700+ quest chain (endgame faction)
```

---

## 3. Reputation Levels

### 3.1 Level Table

| Level | Rep Points Required | Total Points | Label |
|---|---|---|---|
| Start | — | 0 | NEUTRAL |
| Lv1 | 1,000 | 1,000 | FRIENDLY |
| Lv2 | 2,000 | 3,000 | HONORED |
| Lv3 | 3,000 | 6,000 | REVERED |
| Lv4 | 4,000 | 10,000 | EXALTED |

**Hostile mode:** Rep can go NEGATIVE (kills faction allies)
- UNFRIENDLY: -500 (faction guards hostile in HQ)
- HATED: -1500 (banned from faction HQ, shops locked)
- Recovery: Complete faction quests, buy Reputation Token from neutral NPC

### 3.2 Rep Sources

| Source | Rep Gain | Notes |
|---|---|---|
| Kill enemy faction monsters | +5 rep/kill | Biome monsters linked to faction enemy |
| Complete faction daily quest | +150 rep | 3 quests/day max per faction |
| Complete faction quest chain | +500-2,000 rep | Story quests, one-time |
| Donate to faction | +100 rep / 10,000 gold | Gold sink, 5× per day |
| Faction event participation | +500-3,000 rep | Weekly faction event |
| World Boss kill in faction biome | +200 rep | First kill bonus only |
| Kill faction ally monster | -20 rep | Accidental or intentional |
| Grieve faction NPC | -500 rep | Attacking NPCs |

### 3.3 Rep Time Estimate (F2P)

```
Daily rep generation:
  3 daily quests × 150 = 450 rep/day (reliable)
  Kills during daily gameplay = ~100 rep/day
  Donate once = 100 rep/day (costs 10,000 gold)
  Total daily: ~650 rep/day

Neutral → Exalted: 10,000 rep
Time: 10,000 / 650 ≈ 15 days intensive play

BUT: Quest chains unlock at HONORED (3,000 rep) and REVERED (6,000 rep)
Gating: 15 days minimum, more realistically 30-45 days per faction

4 factions × 45 days = ~6 months to max all factions (long-term progression ✅)
```

---

## 4. Reputation Combat Bonus (Power Budget)

```
COMPATIBILITY: Uses existing ATK stat only. No new stat.

Combat bonus formula:
  ReputationBonus(faction) = 0.25% × (factionRepLevel / 4)
    
  At FRIENDLY (Lv1):  0.0625% ATK vs faction's enemy elements
  At HONORED (Lv2):   0.125%  ATK vs faction's enemy elements
  At REVERED (Lv3):   0.1875% ATK vs faction's enemy elements
  At EXALTED (Lv4):   0.250%  ATK vs faction's enemy elements

Implementation:
  In DamageCalculator.Compute(), ContextMult includes:
    float repBonus = ReputationManager.GetRepBonus(
        player.reputations, skill.element, target.element);
    contextMult *= (1.0f + repBonus);
    
  ContextMult already exists in Formula V10:
    FinalDamage = ATK × SkillMult × CritMult × ElementMult × ContextMult × ...
    contextMult is expanded: includes bossBonus + pvpMult + repBonus

Total max rep bonus:
  4 factions × 0.25% = 1.0% ATK bonus (against specific element enemies)
  PowerBudgetManager.ValidateSystemMax(repPower, "reputation", 1.0f) → server enforced

P2W check: Reputation NEVER sold for Diamond
```

---

## 5. Reputation Rewards by Level

### 5.1 FRIENDLY (Lv1) — 1,000 Rep

```
All 4 Factions at Friendly:
  ✓ Faction Shop: OPEN (basic items)
  ✓ Faction daily quests: UNLOCK
  ✓ Faction mini-map marker shown
  ✓ Faction guards: neutral (no longer ignore player)
  ✓ Cosmetic: Faction Badge (worn on character)

Verdant Alliance specific:
  → Common Recipe: Nature's Blessing Potion (HP Regen)
  → Mount: "Forest Boar" skin unlock

Flame Brotherhood specific:
  → Common Recipe: Fire Shard (Alchemy material)
  → Access: Ironforge Crafting Station (better than basic)
```

### 5.2 HONORED (Lv2) — 3,000 Rep

```
All 4 Factions at Honored:
  ✓ Faction quest chain: CHAPTER 2 unlocked
  ✓ Faction Shop: TIER 2 items available
  ✓ Title: "[Faction Name] Friend" (e.g., "Alliance Friend")
  ✓ Housing decor: Faction Flag (decoration)
  ✓ Combat bonus: 0.125% ATK vs enemy elements

Verdant Alliance specific:
  → Uncommon Recipe: Enhanced Enhancement Stone
  → Special farming zone access (exclusive biome section)

Oceanic Covenant specific:
  → Recipe: Underwater Breathing Potion (utility, no power)
  → Aquatic mount: "Sea Turtle" unlock
```

### 5.3 REVERED (Lv3) — 6,000 Rep

```
All 4 Factions at Revered:
  ✓ Faction quest chain: FINAL CHAPTER unlocked
  ✓ Faction Shop: TIER 3 items (best gear equivalent to dungeon Rare)
  ✓ Title: "[Faction Name] Champion"
  ✓ Faction HQ: VIP area access (special room)
  ✓ Guild: Faction raid invite (faction world boss)
  ✓ Combat bonus: 0.1875% ATK vs enemy elements

Flame Brotherhood specific:
  → Epic Recipe: Fire Enhancement Compound (enhances Fire element weapons)
  → Faction mount: "Volcanic Drake" unlock (Uncommon mount)

Shadow Council specific:
  → Access: Void Realm faction portal (fastest Void Realm path)
  → Special recipe: Shadow Ink (rare crafting material)
```

### 5.4 EXALTED (Lv4) — 10,000 Rep

```
All 4 Factions at Exalted:
  ✓ Achievement: "Exalted with [Faction]"
  ✓ Combat bonus: FULL 0.25% ATK vs enemy elements
  ✓ Faction Shop: ALL items available (no further gating)
  ✓ Title: "[Faction Name] Champion" UPGRADED to glowing version
  ✓ Exclusive cosmetic: Faction Armor Set (visual only, no power)
  ✓ Monthly gift: Faction Care Package (Gold + materials)
  ✓ NPC friendship: Faction leader dialogue expands

4-Faction Exalted achievement: "World Diplomat"
  → Reward: "Diplomat" Title + special Housing decor (Faction Alliance Crest)
  → 1.0% full combat bonus (all element enemies affected by some faction)
```

---

## 6. Faction Shops

### 6.1 Shop Rules

```
Rules (consistent with 09_SHOP_ARCHITECTURE.md):
  ✓ All items priced in Gold only (no Diamond for power items)
  ✓ No item can have is_power = true in Diamond shop
  ✓ Stock refreshes weekly (not daily — prevents grind dependency)
  ✓ Reputation-gated items not tradeable (prevents proxy buying)
  
Item Categories in Faction Shops:
  - Consumables: Potions, buffs (temporary, NOT power budget)
  - Equipment: Faction-themed gear (comparable to dungeon drops, not better)
  - Recipes: Crafting blueprints (major value!)
  - Materials: Faction-specific crafting materials
  - Cosmetics: Faction visual items (tradeable after 30d lockout)
  - Housing: Faction furniture/decor (tradeable)
```

### 6.2 Sample Shop Items

| Item | Faction | Rep Required | Gold Cost |
|---|---|---|---|
| Nature Enhancement Stone | Verdant | FRIENDLY | 2,000g |
| Fire Crystal (Alchemy mat) | Flame | FRIENDLY | 5,000g |
| Ocean Breathing Potion ×5 | Oceanic | HONORED | 8,000g |
| Shadow Rune Fragment | Shadow | HONORED | 15,000g |
| Verdant Armor Set (visual) | Verdant | REVERED | 50,000g |
| Drake Rider Saddle (Mount skin) | Flame | REVERED | 30,000g |
| Coral Blade Recipe | Oceanic | REVERED | 100,000g |
| Void Essence (rare mat) | Shadow | EXALTED | 200,000g |
| Faction Champion Crest (Housing) | Any | EXALTED | 75,000g |

---

## 7. Negative Reputation & Conflict

```
Faction Conflict:
  When repping up one faction, opposing faction may lose small rep
  Verdant vs Flame Brotherhood: minor conflict (Forest vs Volcano)
  Oceanic vs Shadow Council: minor conflict (Light Water vs Dark)
  
  Conflict Rep Loss: -10% of gain (raising 150 rep with Verdant = -15 with Flame)
  Players can still max ALL 4 factions, it just takes longer
  
  No "faction war" forced choice — players can pursue all 4 simultaneously
  
Hostile State Effects:
  UNFRIENDLY: Faction guards ignore player (no buff, no shop)
  HATED: Guards attack on sight within HQ zone
  Recovery missions available from neutral "Diplomacy NPC"
```

---

## 8. Analytics Events

```
rep_level_up:         { faction_id, new_level, player_level, days_since_start }
rep_shop_purchase:    { faction_id, item_id, gold_spent, rep_level }
rep_exalted_achieved: { faction_id, player_id, days_to_exalted }
rep_lost:             { faction_id, amount, reason }
world_diplomat_achieved: { player_id, date }
```

---

## 9. Database Schema

```sql
CREATE TABLE player_reputation (
    player_id       BIGINT NOT NULL REFERENCES players(player_id),
    faction_id      VARCHAR(32) NOT NULL,
    rep_points      INT NOT NULL DEFAULT 0,
    rep_level       SMALLINT NOT NULL DEFAULT 0, -- 0=Neutral,1=Friendly,...4=Exalted
    total_earned    INT NOT NULL DEFAULT 0,       -- lifetime earned
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, faction_id)
);

CREATE TABLE faction_config (
    faction_id      VARCHAR(32) PRIMARY KEY,
    faction_name    VARCHAR(64) NOT NULL,
    element         VARCHAR(16) NOT NULL,         -- primary element
    element2        VARCHAR(16),                  -- secondary element
    enemy_element   VARCHAR(16) NOT NULL,         -- bonus vs this element
    enemy_element2  VARCHAR(16),                  -- bonus vs this too
    hq_biome_id     SMALLINT NOT NULL,
    unlock_level    SMALLINT NOT NULL DEFAULT 1,
    lore_text       TEXT
);

CREATE TABLE reputation_daily_quest (
    player_id       BIGINT NOT NULL,
    faction_id      VARCHAR(32) NOT NULL,
    quest_date      DATE NOT NULL,
    quests_done     SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, faction_id, quest_date)
);

CREATE TABLE faction_shop_purchase (
    id              BIGSERIAL PRIMARY KEY,
    player_id       BIGINT NOT NULL,
    faction_id      VARCHAR(32) NOT NULL,
    item_id         VARCHAR(64) NOT NULL,
    gold_spent      INT NOT NULL,
    purchased_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reputation_player ON player_reputation(player_id);
```

---

## 10. Save Data (extends V8)

```csharp
public class ReputationSaveData {
    public Dictionary<string, FactionRepEntry> factions; // key = faction_id
    public float totalRepPowerBonus;  // cached: sum of all faction bonuses ≤1%
}

public class FactionRepEntry {
    public string factionId;
    public int repPoints;          // current total
    public int repLevel;           // 0-4 (Neutral→Exalted)
    public bool shopUnlocked;      // true at FRIENDLY+
    public long firstContactAt;    // first time entered faction biome
    public long exaltedAt;         // timestamp when hit Exalted (0 = not yet)
}
```

---

## 11. Network Packets

```
ReputationUpdate    = 0x0920  // S2C: rep points changed (kill, quest, donate)
RepLevelUp          = 0x0921  // S2C: level up animation trigger + rewards
RepShopOpen         = 0x0922  // C2S: open faction shop
RepShopPurchase     = 0x0923  // C2S: buy item { faction_id, item_id, quantity }
RepShopResult       = 0x0924  // S2C: purchase result + gold deducted
RepSync             = 0x0925  // S2C: full rep state sync (on login)
RepBonusApplied     = 0x0926  // S2C: combat rep bonus applied to ContextMult
```

---

## 12. DamageCalculator Integration (V10 Compatible)

```csharp
// In DamageCalculator.Compute() — extends existing ContextMult:

// Existing ContextMult components:
float contextMult = Mathf.Min(ctx.bossBonus, 1.3f) * (ctx.isPvp ? 0.5f : 1.0f);

// ADD reputation bonus (extends ContextMult, no new formula term):
float repBonus = ReputationManager.GetRepBonus(
    player.reputations,       // Dictionary<string, FactionRepEntry>
    skill.element,            // attacker element
    target.element            // defender element
);
contextMult *= (1.0f + repBonus);  // max repBonus = 0.01f (1% total)

// STILL using original V10 formula — only ContextMult component added:
return a.atkTotal * skillMult * critMult * elemMult * contextMult
       * (1f - defMit)
       * SituationalCap(ctx.level);

// ReputationManager.GetRepBonus():
public static float GetRepBonus(
    Dictionary<string, FactionRepEntry> reps,
    string attackElement,
    string targetElement)
{
    float total = 0f;
    foreach (var faction in factions)
    {
        if (!reps.TryGetValue(faction.faction_id, out var rep)) continue;
        if (rep.repLevel < 1) continue;
        
        float levelBonus = rep.repLevel * 0.0625f; // 0.0625% per level
        if (attackElement == faction.element && 
            IsEnemyElement(targetElement, faction))
            total += levelBonus;
    }
    return Mathf.Min(total, 0.01f); // hard cap 1%
}
```

---

## 13. Power Budget Validation (Final)

```
Reputation Power Budget Check:

  Formula: 4 factions × max 0.25% each = 1.0%
  Matches 01_POWER_BUDGET.md: "reputation: 1.0%, 4fac×0.25%" ✅
  
  At Exalted all 4: 4 × 0.25% = 1.0%
  PowerBudgetManager.ValidateSystemMax(repPower, "reputation", 1.0f) → ✅
  
  Damage Formula V10: bonus goes into ContextMult (existing component)
  No new formula term added ✅
  Uses existing ATK stat (no new stat) ✅
  
P2W Check:
  ✅ Reputation not purchasable with Diamond
  ✅ Daily quest cap prevents gold farming → rep buying
  ✅ Faction shop items: Gold only (no Diamond power path)
  ✅ Rep-gated items: Soulbound (no proxy buying via AH)
```

---

*Document: REPUTATION_SYSTEM.md | Version: 1.0 | Date: 2026-06-14*
*Power Budget: 1.0% (4 factions × 0.25% = 1.0%) | Integrated into ContextMult V10*
*Compatible: V10 Damage Formula ContextMult extension | 6-Element System | Economy V6*
