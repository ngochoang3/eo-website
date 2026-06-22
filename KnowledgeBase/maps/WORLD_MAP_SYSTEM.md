# WORLD MAP SYSTEM ARCHITECTURE
> Game: Slime MMORPG | Date: 2026-06-14 | Version: 1.0
> Power Budget: 0% (exploration utility, no power)
> Compatible: DAY_NIGHT_SYSTEM | WEATHER_SYSTEM | 03_WORLD_EVENT_SYSTEM | Reputation Factions

---

## MANDATORY COMPATIBILITY CHECK

```
[Source of Truth]
  DAY_NIGHT_SYSTEM.md         → Time of day affects map (fog at night, events at dawn)
  WEATHER_SYSTEM.md           → Weather overlays on map
  03_WORLD_EVENT_SYSTEM.md    → World events shown on map
  REPUTATION_SYSTEM.md        → Faction biomes highlighted on map
  GATHERING_SYSTEM_DETAILED.md → Gathering nodes visible on map (Lv30+)
  HOUSING_EXPANSION.md        → Housing district visible on map

World Map DOES NOT:
  ✗ Create new power system
  ✗ Create new currency (Fast Travel costs Gold — existing)
  ✗ Override existing zone loading (Addressables handles zone streaming)
  ✓ Extends existing biome system (21 biomes already defined)
  ✓ Fast Travel: Gold sink (consistent with Economy)
  ✓ Fog of War: server-side tracking per player
```

---

## 1. Design Philosophy

World Map là **exploration reward system**:
1. **Fog of War**: Khám phá là reward — chưa đến chưa thấy
2. **Fast Travel**: Gold sink + VIP convenience (consistent với VIP QoL)
3. **Live World**: Weather, events, boss spawns hiển thị real-time
4. **Faction Territory**: Màu sắc faction tô lên map → visual faction war feel

---

## 2. World Map Structure

### 2.1 21 Biomes Layout

```
World Map: 5×5 grid (21 biomes + 4 placeholder/ocean zones)

Row 1 (North): [Ocean] [Sky Citadel(20)] [Celestial Peak(10)] [Void Realm(21)] [Ocean]
Row 2:         [Frozen Tundra(4)] [Frost Abyss(14)] [Stormy Highlands(8)] [Shadow Vale(12)] [Phantom Crossing(18)]
Row 3 (Mid):   [Crystal Cave(2)] [Blight Marsh(17)] [Ruined City(11)] [Mystic Swamp(9)] [Dark Forest(12)]
Row 4:         [Ancient Forest(6)] [Verdant Meadow(1)] [Verdant Plains(STARTER)] [Desert Dunes(7)] [Ember Plains(13)]
Row 5 (South): [Sunken Reef(5)] [Coral Labyrinth(15)] [Volcanic Ridge(3)] [Lava Fortress(19)] [Thunderspire(16)]

Connection paths (roads/paths between biomes):
  Adjacent biomes in grid = connected
  Some diagonal connections (dungeon shortcuts)
  Hidden connections: discovered through exploration
```

### 2.2 Map Visual Layers

```
Layer 1 (Base):     Biome terrain artwork
Layer 2 (Faction):  Faction color overlay (25% opacity) when reputation HONORED+
Layer 3 (Fog):      Dark overlay on undiscovered zones
Layer 4 (Weather):  Weather icon + slight overlay (rain = blue tint)
Layer 5 (Events):   Blinking markers for active events
Layer 6 (Nodes):    Gathering node density dots (Gathering Lv30+)
Layer 7 (Player):   Player position dot
Layer 8 (Friends):  Friend position dots (green, opt-in)
Layer 9 (UI):       Zone names, level requirement labels
```

---

## 3. Fog of War

```
Fog of War Rules:
  New player: Only Verdant Plains (starter zone) + 1 adjacent zone revealed
  Reveal: Enter biome zone → entire biome revealed (not granular tile)
  Explored biomes: saved in player's "exploration" save data
  
  Visual states:
    UNEXPLORED: Black fog overlay, no biome name, no features visible
    DISCOVERED: Full map visible, all features labeled
    
  Fog persistence:
    Once revealed = permanent (no fog re-apply)
    
Exploration Rewards (from 04_ACHIEVEMENT_SYSTEM.md integration):
  First visit to each biome: Achievement "Explorer of {BiomeName}"
  Visit all 21 biomes: Achievement "World Traveler" → cosmetic reward
  
Map Completionist system:
  Progress bar: "X/21 Biomes Discovered"
  Completionist reward at 21/21: Special world map skin (visual only)

Technical implementation:
  Server stores discovered_biomes as BitSet (21 bits = 3 bytes per player)
  Ultra-efficient: 100K players = 300KB total storage
```

---

## 4. Fast Travel

```
Fast Travel System:
  Unlock: Reach biome at least once (must physically go first)
  
  Fast Travel options:
    [A] Teleport Stone (consumable item):
        Craft: Jeweling Lv20 recipe (2 Magic Crystal + 5 Stone Chunk → 1 Teleport Stone)
        Gold cost: 0 (item consumed)
        Teleport to: Any discovered biome
        
    [B] Gold Teleport (direct pay):
        Cost: 500g × distance (adjacent = 1, far = 10× distance multiplier)
        Example: Adjacent biome = 500g, Cross-map = 5,000g
        Gold sink: Major gold sink for high-level players
        
    [C] Housing Portal (from HOUSING_EXPANSION.md):
        Teleport back to own Housing plot: Free (30s CD)
        Housing Portal to another player's plot: 1,000g (existing)
        
    [D] VIP Fast Travel (from MONETIZATION_VIP_COSMETICS.md):
        VIP5+: Fast Travel cost reduced 30%
        VIP8+: Fast Travel cost reduced 50%
        VIP10+: 1 free fast travel per hour
        
    [E] Dungeon Exit Portal:
        After dungeon clear → portal opens → teleport to dungeon entrance biome: Free
        
    [F] Faction HQ Teleport:
        At HONORED+ with a faction: 1 free teleport/day to faction HQ
        At REVERED+: Unlimited faction HQ teleport (once per 2h CD)
```

---

## 5. World Events on Map

```
Integration with 03_WORLD_EVENT_SYSTEM.md:

Event Markers on Map:
  🔴 World Boss Spawn: Pulsing red icon at spawn biome
      Shows: Boss name, HP remaining (%), time until despawn
      Tap: Show party invite option
      
  🟡 Seasonal Event: Yellow star at event zone
      Shows: Event name, time remaining
      
  🟢 Faction Event: Green flag at faction biome
      Shows: "Verdant Alliance Festival" + reputation bonus
      
  🔵 World PvP Active: Blue swords crossed at PvP biome
      Shows: "PvP Active" + current player count in zone
      
  ⭐ Legendary Gather Node: Gold sparkle at biome
      Shows: "Legendary Node available!" (weekly)

Real-time Map Update:
  WorldSimulationService broadcasts world state → Gateway → all clients in map view
  Map view: Only players with map open receive live updates (bandwidth optimization)
  Update rate: World events = 60s refresh; Boss HP = 10s refresh when boss active
```

---

## 6. Map Markers (Player-Placed)

```
Custom Map Markers:
  Player can place up to 5 custom markers on discovered biomes
  Marker types: ! (caution), ★ (favorite), 📦 (resource), ❓ (mystery), 🏠 (home)
  
  Shared Markers (Guild):
    Guild Leader/Officer can set guild-wide markers
    All guild members see: "Guild Rally Point" marker
    Max 3 guild markers at once
    
Use case: Mark rare node location, set rally point for world boss
Mobile UX: Long-press on map → marker menu
```

---

## 7. Minimap (In-Zone)

```
In-zone minimap:
  Always visible: top-right corner (mobile)
  Shows: 50m radius around player
  Icons: Monsters (red), NPCs (yellow), Exits (green arrow), Nodes (blue dots)
  
  Night mode (from DAY_NIGHT_SYSTEM.md):
    At NIGHT phase: minimap darkens, visibility radius reduced to 30m
    Torch item: +20m minimap radius for 5 min
    
  Weather effect on minimap (from WEATHER_SYSTEM.md):
    BLIZZARD/SANDSTORM: minimap range −50% (reduced visibility weather)
    
  Minimize: Tap minimap → shrinks to small icon
  Expand: Double-tap → full-screen zone map (same as World Map but zoomed in)
```

---

## 8. Database Schema

```sql
CREATE TABLE player_exploration (
    player_id               BIGINT PRIMARY KEY REFERENCES players(player_id),
    discovered_biomes_bits  INT NOT NULL DEFAULT 1,  -- bit 0 = biome_id 1, etc.
    first_discovery_times   JSONB,                   -- { biome_id: timestamp }
    custom_markers_json     JSONB,                   -- player map markers
    total_biomes_discovered SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE world_event_positions (
    event_id        VARCHAR(64) PRIMARY KEY,
    event_type      VARCHAR(32) NOT NULL,
    biome_id        SMALLINT NOT NULL,
    started_at      TIMESTAMP NOT NULL,
    ends_at         TIMESTAMP,
    data_json       JSONB NOT NULL    -- boss HP, player count, etc.
);

CREATE INDEX idx_world_events_active ON world_event_positions(ends_at) WHERE ends_at > NOW();
```

---

## 9. Network Packets

```
WorldMapOpen        = 0x1100  // C2S: player opens world map
WorldMapState       = 0x1101  // S2C: { discovered_biomes_bits, active_events[] }
WorldMapEventUpdate = 0x1102  // S2C: live event state update (while map open)
FastTravelRequest   = 0x1103  // C2S: { target_biome_id, method (STONE/GOLD/VIP) }
FastTravelResult    = 0x1104  // S2C: { success, gold_deducted, zone_loading }
BiomeDiscovered     = 0x1105  // S2C: { biome_id } — first time entering biome
MapMarkerSet        = 0x1106  // C2S: { biome_id, marker_type }
GuildMarkerUpdate   = 0x1107  // S2C: guild marker changed (to all guild members)
FriendPositions     = 0x1108  // S2C: { friend positions } (60s poll, opt-in)
```

---

## 10. Save Data (extends V9)

```csharp
// Added to PlayerCore:
public class ExplorationSaveData {
    public int discoveredBiomesBits;        // bitmask, 21 bits
    public Dictionary<int, long> firstDiscoveryTimes; // biome_id → unix ms
    public List<MapMarker> customMarkers;   // max 5
}

public class MapMarker {
    public int biomeId;
    public string markerType;
    public string label;                    // custom label max 20 chars
}
```

---

## 11. Analytics

```
world_map_opened:       { zone_id, session_time_s }
biome_discovered:       { biome_id, player_level, method (walk/teleport) }
fast_travel_used:       { from_biome, to_biome, method, gold_spent }
world_map_event_tapped: { event_type, player_response (join/dismiss) }
exploration_complete:   { player_id, total_days_to_complete }
```

---

*Document: WORLD_MAP_SYSTEM.md | Version: 1.0 | Date: 2026-06-14*
*21 biomes | Fog of War (bitmask) | Fast Travel (Gold sink) | Live events overlay*
*Compatible: Weather/Day-Night/WorldEvent/Reputation/Gathering | Mobile minimap*
