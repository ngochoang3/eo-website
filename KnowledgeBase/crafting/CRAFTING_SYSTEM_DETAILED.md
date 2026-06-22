# CRAFTING SYSTEM — DETAILED ARCHITECTURE
> Game: Slime MMORPG | Date: 2026-06-14 | Version: 1.0
> Power Budget Impact: 0% (Economy System — not power source)
> Feeds: Enhancement System | SoulBond (Spirit Food) | Alchemy potions | Housing

---

## MANDATORY COMPATIBILITY CHECK

```
[Source of Truth — Read Before This Doc]
  01_POWER_BUDGET.md     → Crafting adds 0 power. Enhancement stones DO exist (Enhancement = 9%)
  09_ELEMENT_CHART.md    → Crafted items can have element affinity (uses existing elements)
  ECONOMY_AUDIT.md       → Crafting is gold sink + material sink (extends existing economy)
  SOULBOND_SYSTEM.md     → Spirit Food recipe goes through Alchemy
  15_OFFLINE_PROGRESS_SYSTEM.md → Craft Queue runs offline
  12_HOUSING_SYSTEM.md   → Craft stations can be placed in Housing
  08_MAIL_SYSTEM.md      → Craft Queue results delivered via mail when offline

Crafting DOES NOT:
  ✗ Create new stat (crafted gear uses existing ATK/DEF/HP/CRIT system)
  ✗ Create items stronger than dungeon best-in-slot (crafted = alternative path, not BiS)
  ✗ Create new currency (uses Gold + gathered materials)
  ✗ Create new power source (Enhancement Stones feed Enhancement System, not Crafting budget)
  ✓ Extends: Economy (gold sink, material sink), SoulBond (Spirit Food), Enhancement (stones)
```

---

## 1. Design Philosophy

Crafting là **economy backbone** — không phải power shortcut:
1. **Alternative Path**: BiS gear từ dungeon farming = BiS gear từ crafting (same power ceiling)
2. **Professions = Mastery**: Mỗi profession sâu và chuyên biệt (không spread thin)
3. **Social Economy**: Crafters depend on Gatherers → player interdependence
4. **Gold Sink**: Crafting consumes gold at every tier → inflation control
5. **Quality Depth**: RNG quality adds excitement without P2W (pity system ensures no infinite bad luck)

**Core Loop:**
```
Gather materials (Gathering System)
    ↓
Unlock recipes (Quest / NPC / Drop)
    ↓
Craft at station (queue 1-3 simultaneous)
    ↓
Quality roll (Normal → Masterwork)
    ↓
Use item / sell on AH / feed other systems
```

---

## 2. Professions (5 Total)

| # | Profession | Focus | Key Products | Links To |
|---|---|---|---|---|
| 1 | Blacksmithing | Weapons + Armor | Equipment, Enhancement Stones | Enhancement System |
| 2 | Alchemy | Potions + Special items | Potions, Spirit Food, Dyes | SoulBond, Housing |
| 3 | Tailoring | Cloth + Accessories | Accessories, Housing textiles | Equipment, Housing |
| 4 | Jeweling | Gems + Runes | Gem Shards, Rune Fragments | Gem System, Rune System |
| 5 | Cooking | Food buffs | Food buffs (temporary ContextMult boost) | Combat (ContextMult) |

**Player can learn ALL 5 professions** (no class restriction).
However, leveling all 5 to max requires significant time investment.
Practical endgame: 1-2 professions maxed, others at mid-level.

---

## 3. Profession Level System

### 3.1 Profession Level (1-50)

Consistent with Weapon Proficiency Level (WPL 1-50) from SKILL_SYSTEM_DETAILED.md.

| Level | Title | Unlocks |
|---|---|---|
| 1-10 | Apprentice | Basic recipes, 1 Craft Queue slot |
| 11-20 | Journeyman | Improved recipes, material tier 2 |
| 21-30 | Craftsman | Advanced recipes, 2 Craft Queue slots |
| 31-40 | Artisan | Rare recipes, Quality bonus +5% |
| 41-50 | Master | Epic recipes, 3 Craft Queue slots, Masterwork unlock |

### 3.2 Profession XP Sources

| Source | XP | Notes |
|---|---|---|
| Craft any item | 50-500 XP | Scales with item tier |
| First craft of recipe | 3× XP bonus | One-time per recipe |
| Craft station quality tier | +20% XP if high-grade station | |
| Daily craft mission | 1,000 XP/day | Max 1 per day per profession |

**Time to max (Lv50):** ~200,000 total XP → 2-3 months active crafting

---

## 4. Recipes

### 4.1 Recipe Discovery

```
Recipe Sources (no randomness on unlock — deterministic):
  NPC Teaching:       Most basic recipes (cost: Gold)
  Quest Reward:       Important mid-tier recipes
  Boss Drop:          Rare recipes (uncommon drops)
  World Exploration:  Recipe scrolls in treasure chests
  Reputation Shop:    Faction-exclusive recipes (require Rep level)
  Achievement:        Milestone recipes

Recipe cannot be purchased with Diamond (no P2W recipe shortcut)
```

### 4.2 Recipe Format

```
RecipeDef {
    recipe_id:          string
    profession:         BLACKSMITHING | ALCHEMY | TAILORING | JEWELING | COOKING
    profession_level:   int (1-50)
    result_item:        string (item_id)
    result_quantity:    int
    
    ingredients: [
        { item_id, quantity },
        ...  (2-5 ingredients typical)
    ]
    
    gold_cost:          int    (direct gold fee, always non-zero — gold sink)
    craft_time_ms:      int    (1,000-86,400,000 — 1s to 24h)
    quality_enabled:    bool   (if true, result may be Good/Excellent/Masterwork)
    element_affinity:   string (optional — crafted item gets element from material)
}
```

### 4.3 Recipe Examples by Profession

**Blacksmithing:**
```
Recipe: "Iron Sword"
  Profession: BLACKSMITHING Lv5
  Ingredients: Iron Bar ×5, Wood Plank ×2, Leather Strip ×1
  Gold cost: 500g
  Craft time: 60s
  Result: Iron Sword (Common quality baseline)
  Quality: YES
  
Recipe: "Common Enhancement Stone"
  Profession: BLACKSMITHING Lv15
  Ingredients: Iron Ore ×10, Stone Dust ×5, Gold Shard ×1
  Gold cost: 2,000g
  Craft time: 120s
  Result: Common Enhancement Stone ×1
  Quality: NO (quality not applicable for enhancement stones)
  Economy link: Feeds Enhancement System (9% power budget)

Recipe: "Rare Enhancement Stone"
  Profession: BLACKSMITHING Lv35
  Ingredients: Mithril Bar ×5, Magic Crystal ×3, Enhancement Stone ×3
  Gold cost: 50,000g
  Craft time: 3,600s (1 hour)
  Result: Rare Enhancement Stone ×1
  Note: Rare Enhancement Stone = higher success rate (see Enhancement System)
```

**Alchemy:**
```
Recipe: "HP Potion (Small)"
  Profession: ALCHEMY Lv1
  Ingredients: Green Herb ×3, Water Flask ×1
  Gold cost: 100g
  Craft time: 30s
  Result: HP Potion (Small) ×3
  Quality: NO

Recipe: "Spirit Food (Common)"  ← SoulBond system dependency (Phase 1)
  Profession: ALCHEMY Lv15
  Ingredients: Common Herb ×5, Spirit Crystal ×3
  Gold cost: 1,000g
  Craft time: 300s (5 min)
  Result: Spirit Food (Common) ×1 → grants 200 Bond XP
  Quality: NO (bond XP amount is fixed, not RNG)
  
Recipe: "Spirit Food (Rare)"
  Profession: ALCHEMY Lv35
  Ingredients: Rare Herb ×5, Pure Crystal ×3, Spirit Essence ×1
  Gold cost: 20,000g
  Craft time: 1,800s (30 min)
  Result: Spirit Food (Rare) ×1 → grants 1,000 Bond XP

Recipe: "Combat Potion (ATK+10% 30s)"
  Profession: ALCHEMY Lv25
  Ingredients: Fire Herb ×5, Dragon Blood Drop ×1, Empty Flask ×1
  Gold cost: 5,000g
  Craft time: 600s
  Result: ATK Potion (30s) ×1
  Effect: +10% ATK for 30s → feeds into ContextMult (existing)
  NOT power budget: temporary buff via ContextMult (existing system)
```

**Tailoring:**
```
Recipe: "Adventurer's Cloak"
  Profession: TAILORING Lv10
  Ingredients: Silk Thread ×8, Dye Pigment ×2, Leather Strip ×3
  Gold cost: 3,000g
  Craft time: 600s
  Result: Adventurer's Cloak (accessory, power from Equipment budget)
  Quality: YES

Recipe: "Housing Rug — Nature Pattern"
  Profession: TAILORING Lv20
  Ingredients: Wool ×10, Nature Dye ×3, Wood Frame ×1
  Gold cost: 5,000g
  Craft time: 1,200s
  Result: Nature Rug (Housing furniture #198)
  Economy link: Feeds Housing economy
```

**Jeweling:**
```
Recipe: "Gem Shard: Fire (Basic)"
  Profession: JEWELING Lv10
  Ingredients: Raw Fire Stone ×5, Jeweler's Tool ×1 (reusable)
  Gold cost: 3,000g
  Craft time: 300s
  Result: Fire Gem Shard ×1 → feeds Gem System (2% power budget)
  Economy link: Crafted gems = alternative to dungeon gem drops

Recipe: "Rune Fragment: ATK Rune"
  Profession: JEWELING Lv30
  Ingredients: Mithril Dust ×10, Fire Gem Shard ×3, Magic Ink ×2
  Gold cost: 30,000g
  Craft time: 3,600s
  Result: ATK Rune Fragment ×5 → combine 10 → full Rune (feeds Rune System)
```

**Cooking:**
```
Recipe: "Warrior's Meal"
  Profession: COOKING Lv5
  Ingredients: Meat ×3, Vegetables ×2, Salt ×1
  Gold cost: 200g
  Craft time: 60s
  Result: Warrior's Meal ×1
  Effect: +5% ATK for 30 min (out of combat only → applies to first attack)
  Stack: Cannot stack with Potion (category: food buff)
  Cooldown: 30 min after consumption
  Note: Food buff = temporary ContextMult (existing system). NOT in power budget.

Recipe: "Feast for Ten" (AoE buff)
  Profession: COOKING Lv40
  Ingredients: Premium Meat ×10, Exotic Herb ×5, Festival Spice ×2
  Gold cost: 50,000g
  Craft time: 1,800s
  Result: Feast ×1 → places buffet table → 10 nearby players eat → all get +8% ATK 1h
  Social mechanic: Encourages crafters joining raid groups
```

---

## 5. Craft Queue System

```
Craft Queue:
  Slots: 1 (Lv1-20) → 2 (Lv21-40) → 3 (Lv41-50)
  Queue behavior: FIFO (first in, first out)
  
  Starting a craft:
    1. Ingredients removed from inventory immediately
    2. Gold deducted immediately
    3. Timer begins (craft_time_ms)
    4. Player can do anything else
    
  Completing:
    Timer expires → item added to "Craft Result" mailbox
    If online: notification popup "Craft Complete"
    If offline: item waits in mail (consistent with 08_MAIL_SYSTEM.md)
    
  Canceling:
    Cancel = forfeit ingredients (no refund) + 50% gold refund
    Penalty prevents cancel-abuse
    
  Speedup:
    "Rush Craft" costs Gold (NOT Diamond) → not P2W
    Rush cost: remaining_time_seconds × 1 Gold/second
    Example: 3,600s remaining → 3,600 Gold to instant complete
    Max rush cost: 100,000 Gold (capped)
```

---

## 6. Quality System

### 6.1 Quality Tiers

| Quality | Roll % | Bonus vs Normal |
|---|---|---|
| Normal | 65% | Baseline stats |
| Good | 22% | Stats +10% |
| Excellent | 10% | Stats +20%, +1 Affix slot |
| Masterwork | 3% | Stats +30%, +2 Affix slots, glowing appearance |

**Masterwork unlock:** Only available at Profession Lv41+ (not beginner RNG)
**Affix slots on Masterwork:** random affix from AFFIX_SYSTEM (existing 3% budget)

### 6.2 Quality Pity System (consistent with 11_PITY_FAILSTACK.md)

```
Pity accumulation:
  Each "Normal" quality craft adds 1 Pity Point to that recipe
  
  At 5 consecutive Normal crafts:    +5% Good chance
  At 10 consecutive Normal crafts:   +5% Good, +3% Excellent chance
  At 20 consecutive Normal crafts:   +10% Good, +5% Excellent chance
  
  Pity RESETS when you get Good or higher
  Pity is per-recipe (not per-profession)
  Pity saved in DB (persistent)

Server-side RNG: Quality roll is server-authoritative
  XorShift64 RNG (consistent with existing server-side RNG from 00_SAVE_DATA_SYSTEM.md)
  Client never knows RNG seed
```

### 6.3 Quality Display

```
Item tooltip shows quality tier:
  Normal:     white name
  Good:       green name + "Good" badge
  Excellent:  blue name + sparkle effect
  Masterwork: purple name + glow + "Masterwork" badge
  
Masterwork items: show crafted by "[Player Name]" in tooltip
  → Reputation system for master crafters
  → AH shows crafter name → player-to-player economy
```

---

## 7. Craft Stations

```
Craft Station Types:
  Basic Station (in towns): All professions, Lv1-30 recipes only
  Advanced Station (in towns): All professions, Lv1-50 recipes, +5% quality
  Housing Station (player-built): Same as Advanced (Housing expansion)
  Faction Station: Only for faction-exclusive recipes

Housing Stations (from 12_HOUSING_SYSTEM.md integration):
  Blacksmith Forge: 10,000g + 50 Iron Bar → placed in Housing
  Alchemy Lab: 8,000g + 20 Glass Tube → placed in Housing
  Tailoring Bench: 5,000g + 30 Lumber → placed in Housing
  Jeweler's Table: 12,000g + 10 Gem Dust → placed in Housing
  Kitchen Hearth: 6,000g + 20 Stone + 10 Brick → placed in Housing

Housing station bonus:
  +10% quality bonus (stacks with Profession level bonus)
  +20% craft speed
  Allows visitors to use your station (social economy)
  
Gold sink: Station construction is significant gold investment
```

---

## 8. Economy Integration

```
Crafting Economy Flows:

GOLD SINK (consistent with ECONOMY_AUDIT.md):
  Recipe purchase from NPC: 500g - 500,000g per recipe
  Gold cost per craft: 100g - 200,000g (scales with tier)
  Housing station construction: 5,000g - 12,000g each
  Rush craft: 1g/s remaining (variable)
  
MATERIAL SINK:
  Raw materials (from Gathering) consumed by crafting
  Materials NOT regenerated → constant demand from Gathering
  
GOLD SOURCE (minor):
  Masterwork items sold on AH for premium prices
  Crafters sell services (advertise in Guild Chat)
  
AH INTEGRATION:
  All crafted items tradeable on AH (except soulbound)
  Crafter name shown in item tooltip on AH listings
  Masterwork items command premium prices
  
MATERIAL PRICE EQUILIBRIUM:
  High demand for common mats (Herb, Ore) → stable price floor on AH
  Seasonal rare mats → price spikes drive Gathering activity
```

---

## 9. Mobile Optimization

```
Crafting UI:
  Accessible from anywhere (no station required for UI browse)
  Must be near station to START crafting
  Queue management: top bar notification badge
  
Offline Crafting:
  Queue continues when app closed (server-side timer)
  Push notification when craft completes (uses PUSH_NOTIFICATION_ARCHITECTURE)
  If offline 8h+, up to 3 crafts auto-complete (queue fills mail)
  
Inventory management:
  "Bank" tab in crafting UI: shows housing vault materials
  Craft can draw from housing vault (range: same housing plot)
  Reduces mobile inventory pressure
```

---

## 10. Database Schema

```sql
CREATE TABLE player_professions (
    player_id           BIGINT NOT NULL REFERENCES players(player_id),
    profession          VARCHAR(16) NOT NULL,
    level               SMALLINT NOT NULL DEFAULT 1,
    xp                  INT NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, profession)
);

CREATE TABLE player_known_recipes (
    player_id           BIGINT NOT NULL REFERENCES players(player_id),
    recipe_id           VARCHAR(64) NOT NULL,
    learned_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, recipe_id)
);

CREATE TABLE craft_queue (
    queue_id            BIGSERIAL PRIMARY KEY,
    player_id           BIGINT NOT NULL REFERENCES players(player_id),
    recipe_id           VARCHAR(64) NOT NULL,
    slot_index          SMALLINT NOT NULL CHECK (slot_index BETWEEN 0 AND 2),
    started_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    completes_at        TIMESTAMP NOT NULL,
    status              VARCHAR(16) NOT NULL DEFAULT 'IN_PROGRESS',
    quality_pity        SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (player_id, slot_index)  -- one craft per slot
);

CREATE TABLE recipe_config (
    recipe_id           VARCHAR(64) PRIMARY KEY,
    profession          VARCHAR(16) NOT NULL,
    profession_level    SMALLINT NOT NULL DEFAULT 1,
    result_item_id      VARCHAR(64) NOT NULL,
    result_quantity     SMALLINT NOT NULL DEFAULT 1,
    ingredients_json    JSONB NOT NULL,             -- [{item_id, qty}...]
    gold_cost           INT NOT NULL DEFAULT 0,
    craft_time_ms       INT NOT NULL DEFAULT 1000,
    quality_enabled     BOOL NOT NULL DEFAULT TRUE,
    element_affinity    VARCHAR(16)
);

CREATE TABLE crafting_pity (
    player_id           BIGINT NOT NULL,
    recipe_id           VARCHAR(64) NOT NULL,
    consecutive_normal  SMALLINT NOT NULL DEFAULT 0,
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, recipe_id)
);

CREATE TABLE craft_history (
    id                  BIGSERIAL PRIMARY KEY,
    player_id           BIGINT NOT NULL,
    recipe_id           VARCHAR(64) NOT NULL,
    quality             VARCHAR(16) NOT NULL,
    affixes_json        JSONB,                      -- if Masterwork
    crafted_at          TIMESTAMP NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (crafted_at);
```

---

## 11. Save Data (extends V8)

```csharp
public class CraftingSaveData {
    public Dictionary<string, int> professionLevels;     // profession → level
    public Dictionary<string, int> professionXP;
    public HashSet<string> knownRecipeIds;
    public List<CraftQueueEntry> craftQueue;             // max 3
    public Dictionary<string, int> recipePity;          // recipe_id → pity count
    public int totalItemsCrafted;                        // lifetime
    public int totalMasterworkCrafted;                   // prestige stat
}

public class CraftQueueEntry {
    public string recipeId;
    public int slotIndex;
    public long completesAt;          // Unix ms timestamp
    public string status;             // IN_PROGRESS / DONE
}
```

---

## 12. Network Packets

```
CraftStart          = 0x0A00  // C2S: { recipe_id, slot_index }
CraftStartResult    = 0x0A01  // S2C: { queue_entry, ingredients_removed, gold_deducted }
CraftComplete       = 0x0A02  // S2C: { recipe_id, quality, result_item, pity_reset }
CraftCancel         = 0x0A03  // C2S: { queue_id }
CraftCancelResult   = 0x0A04  // S2C: { gold_refund, status }
RecipeLearn         = 0x0A05  // S2C: new recipe added
CraftRush           = 0x0A06  // C2S: { queue_id } (gold cost deducted server-side)
ProfessionLevelUp   = 0x0A07  // S2C: { profession, new_level, new_queue_slots }
CraftQueueSync      = 0x0A08  // S2C: full queue state on login
```

---

## 13. Analytics

```
craft_start:         { recipe_id, profession_level, slot_index }
craft_complete:      { recipe_id, quality, pity_at_craft, time_ms }
recipe_learned:      { recipe_id, source (quest/drop/npc/rep) }
craft_rush:          { queue_id, gold_spent, time_saved_ms }
masterwork_crafted:  { recipe_id, player_id, affixes }
profession_levelup:  { profession, new_level, days_played }
```

---

*Document: CRAFTING_SYSTEM_DETAILED.md | Version: 1.0 | Date: 2026-06-14*
*Power Budget: 0% (Economy system — feeds Enhancement/Gem/Rune/SoulBond)*
*5 Professions | Level 1-50 | Quality System with pity | 3-slot craft queue*
*Compatible: Economy V6 | Enhancement System | SoulBond (Spirit Food) | Save V8*
