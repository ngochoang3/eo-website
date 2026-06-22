# GATHERING SYSTEM — DETAILED ARCHITECTURE
> Game: Slime MMORPG | Date: 2026-06-14 | Version: 1.0
> Power Budget Impact: 0% (Economy Feeder — supports Crafting System)
> Links: CRAFTING_SYSTEM_DETAILED.md | HOUSING_EXPANSION.md (Fishing Pond) | 15_OFFLINE_PROGRESS_SYSTEM.md

---

## MANDATORY COMPATIBILITY CHECK

```
[Source of Truth]
  CRAFTING_SYSTEM_DETAILED.md   → Gathering feeds all 5 crafting professions
  HOUSING_EXPANSION.md           → Fishing Pond IS gathering (deduplication check)
  15_OFFLINE_PROGRESS_SYSTEM.md → AFK gathering (offline loop)
  DAY_NIGHT_SYSTEM.md + WEATHER_SYSTEM.md → Seasonal/weather resources
  ECONOMY_AUDIT.md               → Gathering creates material supply (economy input)

Gathering DOES NOT:
  ✗ Create power (gathering stats = utility, not power budget)
  ✗ Create new currency (materials → AH for Gold, not direct currency)
  ✗ Conflict with Housing Fishing Pond (Pond = AFK auto-fishing, Skill = active fishing bonus)
  ✓ Extends: Material supply → Crafting → Enhancement/SoulBond/Gem/Rune economies
  ✓ Seasonal resources: tie to existing DAY_NIGHT_SYSTEM seasons (SUMMER/WINTER/SPRING/AUTUMN)
```

---

## 1. Design Philosophy

Gathering là **economic foundation**:
1. **Supply Chain**: Gathering → Crafting → Enhancement/SoulBond/etc. Chain hoàn chỉnh
2. **Active vs AFK**: Active gathering = better yield + rare drops; AFK = steady trickle
3. **Biome Identity**: Mỗi biome có resource đặc trưng → exploration reward
4. **Seasonal Scarcity**: Một số tài nguyên chỉ có theo mùa → economy spikes
5. **Gathering Level**: Tiến trình riêng biệt (1-50 consistent với WPL và Profession)

**Core Loop:**
```
Explore biome → Find resource node
    ↓
Gather (tap interaction, 2-5s animation)
    ↓
Yield: base materials + chance rare material
    ↓
Fill inventory → Return to craft/sell
OR
Set AFK zone → offline gathering continues
```

---

## 2. Gathering Skills (5 Total)

| # | Skill | Resource | Biomes | Feeds |
|---|---|---|---|---|
| 1 | Mining | Ore, Crystal, Gemstone | Volcano, Mountain, Cave | Blacksmithing, Jeweling |
| 2 | Logging | Wood, Bark, Rare Timber | Forest, Plains, Swamp | Blacksmithing, Tailoring, Housing |
| 3 | Herbalism | Herbs, Flowers, Mushroom | All biomes | Alchemy, Cooking |
| 4 | Fishing | Fish, Special items | Ocean, River, Lake, Housing Pond | Cooking, Alchemy |
| 5 | Foraging | Fruit, Nuts, Seeds, Insects | Forest, Plains, Desert | Cooking, Pet Feed, Mount Feed |

**Gathering Level per skill:** 1-50 (consistent with Profession levels)
**All skills independent:** Can max all 5 (time investment required)

---

## 3. Gathering Level System

### 3.1 Level Table

| Level Range | Title | Unlocks |
|---|---|---|
| 1-10 | Apprentice | Basic nodes, basic yield |
| 11-20 | Journeyman | Tier 2 nodes, reduced gather time |
| 21-30 | Skilled | Tier 3 nodes, rare drop chance +5% |
| 31-40 | Expert | Tier 4 nodes, +1 material per gather |
| 41-50 | Master | ALL nodes, rare drop +15%, legendary nodes |

### 3.2 Gathering XP

| Action | XP |
|---|---|
| Gather basic node | 20-100 XP |
| Gather rare node | 200-500 XP |
| First gather of new material | 3× bonus |
| Daily gathering mission | 800 XP/day per skill |

**Time to max (Lv50):** ~150,000 XP per skill → 1.5-2 months per skill

---

## 4. Resource Node System

### 4.1 Node Types

```
Node Tiers:
  Tier 1 (Gathering Lv1+):   Common materials, abundant
  Tier 2 (Gathering Lv10+):  Uncommon materials, moderate
  Tier 3 (Gathering Lv25+):  Rare materials, scarce
  Tier 4 (Gathering Lv40+):  Epic materials, very rare
  Legendary (Lv50 only):     Single legendary node per biome, weekly respawn

Node Respawn:
  Tier 1: 5 min respawn (player-specific — not depleted for others)
  Tier 2: 15 min respawn (player-specific)
  Tier 3: 60 min respawn (player-specific)
  Tier 4: 6 hour respawn (player-specific)
  Legendary: 7 day respawn (SERVER-WIDE — first player wins)

Node Ownership: Personal (Tier 1-4) → no competition, always available
  Exception: Legendary nodes = shared competitive spawn → social event
```

### 4.2 Node Spawning (Server-Authoritative)

```
Server spawns nodes based on:
  biome_id, tier, respawn_timer, player_gathering_level
  
Node positions: Pre-defined coordinates in biome_node_config.json
  Per biome: 20-50 Tier 1 nodes, 10-20 Tier 2, 5-10 Tier 3, 2-5 Tier 4, 1 Legendary
  Total game-wide: ~500+ active node positions
  
Client receives:
  NodeSpawn packet (0x0B00): { node_id, position, tier, type }
  NodeDepleted packet (0x0B01): { node_id, respawn_at_ms } (personal timer)
  
Node visibility: Only nodes player can access (level-gated) sent to client
```

---

## 5. Mining (Skill 1)

```
Materials by Tier:

Tier 1 — Biomes: Crystal Cave, Volcanic Ridge, Desert Dunes
  Iron Ore      → Iron Bar (Blacksmithing) → Equipment, Enhancement Stone
  Stone Chunk   → Stone Dust (Blacksmithing) → Enhancement Stone component
  
Tier 2 — Biomes: Mountain, Ruined City, Ember Plains
  Mithril Ore   → Mithril Bar (Blacksmithing) → Mid-tier equipment
  Fire Crystal  → Fire Crystal (Jeweling, Alchemy) → Fire Gem Shard, Potions

Tier 3 — Biomes: Frost Abyss, Sky Citadel, Void Realm
  Pure Crystal  → Pure Crystal (Alchemy) → Spirit Food (Rare), SoulBond
  Magic Crystal → Magic Crystal (Jeweling, Blacksmithing) → Rune crafting
  
Tier 4 — Biomes: Abyss, Volcanic core zones
  Dragon Stone  → Dragon Scale (Epic Blacksmithing) → Epic equipment
  Void Shard    → Void Essence (Jeweling, Shadow Council faction recipes)
  
Legendary Node (1 per applicable biome, weekly):
  Ancient Core  → Ancient Metal (Master Blacksmithing) → Legendary equipment

Gather Interaction:
  Tap mining node → pick animation 2-3s → yield
  Mining requires no tool (simplified mobile UX)
  Mastery Lv30: "Power Mine" — harvest node 30% faster
```

---

## 6. Logging (Skill 2)

```
Materials by Tier:

Tier 1 — Biomes: Verdant Meadow, Verdant Plains, Ancient Forest
  Common Wood   → Wood Plank (Blacksmithing, Housing) → basic items, housing furniture
  Bark          → Leather Strip (Blacksmithing) → equipment components

Tier 2 — Biomes: Ancient Forest, Mystic Swamp, Blight Marsh
  Hardwood      → Hardwood Plank (Housing expansion, Tailoring) → better furniture
  Rare Bark     → Magic Bark (Alchemy) → nature potions

Tier 3 — Biomes: Sky Citadel, Celestial Peak
  Cloud Timber  → Cloud Plank (Housing premium decor, Wing Craft)
  Spirit Wood   → Spirit Wood (Alchemy: Spirit Essence, SoulBond chain)

Tier 4 — Biomes: Phantom Crossing, Shadow Vale
  Shadow Wood   → Shadow Timber (Shadow Council recipes, rare Housing)
  Void Timber   → Void Plank (endgame Housing, Shadow craft)

Gather Interaction:
  Tap tree node → chop animation 3-4s → yield
  Mastery Lv30: Fell whole tree → double yield, 2× time
```

---

## 7. Herbalism (Skill 3)

```
Materials by Tier: (Herbalism nodes in ALL 21 biomes)

Tier 1 — All biomes:
  Common Herb   → Alchemy (HP Potion, Spirit Food Common)
  Wild Flower   → Dye Pigment (Tailoring, Housing decor)

Tier 2 — Element-specific biomes:
  Fire Herb     → ATK Potion (Alchemy Lv25)     — Volcanic/Desert biomes
  Frost Herb    → DEF Potion (Alchemy Lv25)     — Tundra/Frost biomes
  Ocean Moss    → MP Regen (Alchemy Lv25)       — Ocean/River biomes
  Shadow Leaf   → Shadow Ink (Shadow Council)   — Dark biomes
  
Tier 3 — Rare, limited biomes:
  Spirit Bloom  → Spirit Crystal (SoulBond chain) — Celestial biomes
  Void Fungus   → Void Extract (Shadow recipes)  — Void Realm only
  Dragon Lily   → Dragon Blood Drop (ATK Potion Rare) — Volcanic endgame
  
Tier 4:
  Ancient Root  → Ancient Essence (Master Alchemy) — hidden locations

Seasonal herbs (from DAY_NIGHT_SYSTEM seasons):
  SUMMER: Sunbloom available (Fire Herb rate ×2)
  WINTER: Frostpetal available (Ice Herb, only in winter)
  SPRING: Springvine (Healing Herb variant, higher yield)
  AUTUMN: Moonshroud (Alchemy for special potions)
  
  Seasonal herbs: Only spawn when season matches (1 real hour per game season)
  → Creates economy spikes and player activity peaks
```

---

## 8. Fishing (Skill 4)

### 8.1 Fishing Zones

```
Active fishing zones:
  All water bodies (rivers, lakes, ocean shores)
  Housing Fishing Pond (HOUSING_EXPANSION.md — deduplication note below)

DEDUPLICATION with HOUSING_EXPANSION.md Fishing Pond:
  Housing Pond = AFK Auto-Fisher (passive income mechanism)
  Gathering Fishing Skill = ACTIVE fishing with better yields + rare drops
  
  They coexist:
    Pond: Yields Fish for Cooking (basic), passive (AFK)
    Skill Fishing: Yields all tiers including rare items, requires player input
    Gathering Lv at Fishing DOES affect Pond: "Housing Pond Bonus"
      Fishing Lv30+ → Pond yield +20%
      Fishing Lv50 → Pond yield +50% + rare fish chance in pond
```

### 8.2 Fishing Mechanics

```
Active Fishing:
  Tap "Cast" button → cast animation
  Wait bar (3-15s, varies by zone) → fish bites → appear
  Tap again on timing → perfect catch → better yield
  Miss timing → still catch (but lower quality fish)
  
  Mobile minigame (simplified):
    "BITE!" appears → tap within 2s → caught
    No multi-step minigame (mobile-first UX)

Fishing yields:
  Tier 1 (Lv1+): Common Fish → Cooking (HP Recovery meal)
  Tier 2 (Lv15+): Uncommon Fish → Cooking (stat buff meals)
  Tier 3 (Lv30+): Rare Fish + Treasure items (Gems, Rune Fragments, Gold)
  Tier 4 (Lv45+): Epic Fish + Antique items (Housing decor)
  Legendary: Ancient Sea Dragon Egg (weekly catch, feeds into Creature System)
```

---

## 9. Foraging (Skill 5)

```
Materials by Tier:

Tier 1 — All biomes:
  Wild Fruit    → Cooking (basic meals), Pet Treat, Mount Feed
  Common Nut    → Cooking (secondary ingredient)
  Hay           → Mount Feed (Common) ← direct Mount System link

Tier 2 — Specific biomes:
  Spirit Fruit  → Spirit Crystal minor (SoulBond), Rare Mount Feed
  Desert Seed   → Alchemy (desert potions), Cooking (exotic dishes)
  Sky Grain     → Cooking (high-level meals, +ATK buff)

Tier 3:
  Moon Truffle  → Rare Cooking (Full Moon Feast, raid food)
  Rainbow Berry → Dye Pigment (rare colors for Tailoring, Wing dye)
  
Tier 4:
  Ancient Seed  → Plant in Housing Garden (Housing expansion plot)
               → Grows into Ancient Herb after 24h → Alchemy chain

Insects (sub-category):
  Firefly → Alchemical ingredient (fire potions)
  Moonbug → Rare Alchemy (Moon Elixir)
  Crystal Beetle → Jeweling ingredient
```

---

## 10. AFK Gathering (Offline Integration)

```
Integration with 15_OFFLINE_PROGRESS_SYSTEM.md:

AFK Gathering Setup:
  Player sets "AFK Gathering Zone" → selects biome + skill
  Gathering continues while offline (up to 8h cap)
  
Yield Rate (AFK vs Active):
  AFK: 40% of active yield rate (significant penalty → active play rewarded)
  AFK rare drop: 10% of active rare drop chance
  AFK legendary: Never (legendary nodes require active interaction)
  
AFK Material Cap:
  8h cap: prevents inventory overflow
  Materials stored in "Gathering Bag" (separate from main inventory, 200 slots)
  "Claim" button on login → transfer to main inventory (with overflow warning)
  
Gathering Bag:
  Free: 200 slots (more than enough for 8h AFK)
  No pay-to-expand (prevents monetization pressure)
  VIP bonus: +50 bag slots (QoL perk, consistent with MONETIZATION_VIP_COSMETICS.md)

AFK Push Notification (needs PUSH_NOTIFICATION_ARCHITECTURE):
  "Your gathering bag is 80% full!" → prompt to login
  "AFK gathering complete — claim your materials!"
```

---

## 11. Seasonal & Weather Resources

```
SEASONAL RESOURCES (from DAY_NIGHT_SYSTEM.md seasons):
  SUMMER (78 min day cycle, warmest):
    → Sunbloom Herb: Lv10+ Herbalism (Fire biomes only, summer only)
    → Goldfish: Lv20+ Fishing (spawns in lake zones, summer only)
    → Dragon Lily: Lv35+ Herbalism (Volcanic biome, summer only)
    
  WINTER (56 min night cycle, coldest):
    → Frostpetal: Lv15+ Herbalism (Tundra, winter only)
    → Ice Crystal node: +50% yield for Mining in Ice biomes
    → Snow Truffle: Lv30+ Foraging (rare winter variant)
    
  SPRING (growth):
    → Springvine Herb: +30% yield for Herbalism (all biomes)
    → Salmon Run: Lv10+ Fishing (river zones, spring only)
    
  AUTUMN (harvest):
    → Moonshroud: Lv20+ Herbalism (all biomes, evening time only)
    → Harvest Mushroom: Lv5+ Foraging (high yield season for Cooking)

WEATHER RESOURCES (from WEATHER_SYSTEM.md):
  RAIN weather: Herb nodes +30% yield
  THUNDER: Rare "Storm Crystal" spawn (Mining, 5% chance per node)
  CLEAR + daytime: Sunbloom blooms (flower opens → better Herbalism)
  BLIZZARD: Ice Crystal yield ×2 in Tundra
  
Server integration:
  WorldSimulationService broadcasts WeatherChanged + SeasonChanged
  GatheringService subscribes → adjusts node yield rates in real-time
  Client shows: "Rainy season — Herbs are blooming!" tooltip
```

---

## 12. Gathering & Economy

```
Economy Role:
  Gathering = PRIMARY material supply for entire economy
  No materials → no crafting → no enhancement stones → enhancement stalls
  → Gathering is economy foundation
  
Supply Model:
  Raw materials: Common → high supply, low AH price, stable
  Rare materials: Scarce → higher AH price, spikes in events
  Seasonal materials: Extreme scarcity → highest prices when in season
  Legendary materials: 1 per week server-wide → auction-driven prices
  
Gold Flow:
  Gatherers: Materials → AH → Gold (gatherers are gold earners)
  Crafters: Gold → buy materials → Gold from selling crafted items (net depends on craft quality)
  Players: Gold → buy consumables/materials → "buys time" for casual players
  
Anti-flooding:
  AFK cap (8h) prevents one player from flooding markets
  Node respawn timers: 5-360min prevents instant depletion
  Seasonal scarcity: prevents year-round flooding of rare herbs
```

---

## 13. Database Schema

```sql
CREATE TABLE player_gathering_skills (
    player_id       BIGINT NOT NULL REFERENCES players(player_id),
    skill_type      VARCHAR(16) NOT NULL, -- MINING/LOGGING/HERBALISM/FISHING/FORAGING
    level           SMALLINT NOT NULL DEFAULT 1,
    xp              INT NOT NULL DEFAULT 0,
    total_gathered  INT NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, skill_type)
);

CREATE TABLE gathering_afk_state (
    player_id       BIGINT PRIMARY KEY REFERENCES players(player_id),
    active_skill    VARCHAR(16),                    -- null = not AFK gathering
    biome_id        SMALLINT,
    started_at      TIMESTAMP,
    bag_json        JSONB NOT NULL DEFAULT '{}',    -- { item_id: qty } accumulated
    last_tick_at    TIMESTAMP
);

CREATE TABLE resource_node_config (
    node_id         VARCHAR(64) PRIMARY KEY,
    skill_type      VARCHAR(16) NOT NULL,
    tier            SMALLINT NOT NULL CHECK (tier BETWEEN 1 AND 4),
    biome_id        SMALLINT NOT NULL,
    yield_json      JSONB NOT NULL,                 -- { item_id: { min, max, chance } }
    gather_time_ms  INT NOT NULL DEFAULT 3000,
    respawn_ms      INT NOT NULL DEFAULT 300000,
    level_required  SMALLINT NOT NULL DEFAULT 1,
    is_legendary    BOOL NOT NULL DEFAULT FALSE,
    season_required VARCHAR(16),                    -- null = all seasons
    weather_bonus   VARCHAR(16)                     -- weather type for bonus
);

CREATE TABLE legendary_node_spawn (
    node_id         VARCHAR(64) PRIMARY KEY REFERENCES resource_node_config(node_id),
    last_harvested_by BIGINT REFERENCES players(player_id),
    last_harvested_at TIMESTAMP,
    next_spawn_at   TIMESTAMP NOT NULL
);

CREATE INDEX idx_gathering_player ON player_gathering_skills(player_id);
CREATE INDEX idx_nodes_biome_tier ON resource_node_config(biome_id, tier);
```

---

## 14. Save Data (extends V8)

```csharp
public class GatheringSaveData {
    public Dictionary<string, GatheringSkillEntry> skills;  // skill_type → entry
    public GatheringAFKState afkState;
    public Dictionary<string, int> gatheringBag;            // item_id → qty (max 200 slots)
    public int totalLifetimeGathered;
    public bool[] legendaryNodesHarvested;                  // per-season state (bit array)
}

public class GatheringSkillEntry {
    public string skillType;
    public int level;     // 1-50
    public int xp;
    public int totalGathered;
}

public class GatheringAFKState {
    public string activeSkill;    // null = not AFK
    public int biomeId;
    public long startedAt;        // Unix ms
}
```

---

## 15. Network Packets

```
NodeList            = 0x0B00  // S2C: visible nodes in current zone (on enter)
NodeGather          = 0x0B01  // C2S: { node_id }
NodeGatherResult    = 0x0B02  // S2C: { items_received, xp_gained, node_respawn_ms }
NodeDepleted        = 0x0B03  // S2C: { node_id, respawn_at_ms }
NodeRespawned       = 0x0B04  // S2C: { node_id } (player-specific)
GatheringLevelUp    = 0x0B05  // S2C: { skill_type, new_level }
LegendaryNodeSpawn  = 0x0B06  // S2C: SERVER-WIDE broadcast (server-wide rare event)
AFKGatherStart      = 0x0B07  // C2S: { skill_type, biome_id }
AFKGatherClaim      = 0x0B08  // C2S: claim bag contents
AFKGatherResult     = 0x0B09  // S2C: { items_claimed, hours_gathered }
```

---

## 16. Analytics Events

```
node_gathered:        { node_id, skill_type, tier, biome_id, level, rare_drop }
skill_level_up:       { skill_type, new_level, days_played }
afk_gather_complete:  { skill_type, hours, items_count, total_value_est }
legendary_harvested:  { node_id, player_id, server_time }
seasonal_mat_gathered:{ item_id, season, quantity }
fishing_perfect_catch:{ zone, fish_type, level }
```

---

## 17. Mobile Optimization

```
Node Rendering:
  Nodes shown as glow points on minimap (no 3D model clutter)
  Tap node → player auto-walks to range → gather starts
  
  LOD: Node 3D model shown only in 10m range
       Minimap icon shows all nodes in 50m radius
       
Gather Queue (convenience feature):
  Mark multiple nodes on minimap → auto-path to each in sequence
  Player just taps, character handles routing
  
Inventory Alert:
  90% full warning before starting AFK gather
  Auto-pause AFK if gathering bag full (don't waste offline time)
  
Battery:
  AFK gather: reduces to 1 fps (just server ticker), saves battery
  "Low Power AFK Mode" option in settings
```

---

*Document: GATHERING_SYSTEM_DETAILED.md | Version: 1.0 | Date: 2026-06-14*
*Power Budget: 0% (Economy foundation — feeds Crafting → all power systems)*
*5 Gathering Skills | Level 1-50 | AFK integration | Seasonal/Weather resources*
*Compatible: Crafting System | SoulBond (Spirit Food chain) | Housing Fishing Pond | Economy V6*
