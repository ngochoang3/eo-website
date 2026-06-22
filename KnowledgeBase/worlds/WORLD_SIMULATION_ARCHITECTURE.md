# WORLD SIMULATION ARCHITECTURE
> Game: Slime MMORPG | Document: Integrated World Simulation Design | Date: 2026-06-14
> Scope: Tích hợp Weather + Day/Night + NPC + Monsters + Pets + Housing + Events

---

## 1. Purpose

World Simulation là layer điều phối kết nối tất cả hệ thống động trong game:
- Weather ảnh hưởng spawn + skills + visibility
- Day/Night ảnh hưởng NPC, shops, monsters, events
- Biome state tổng hợp từ territory + invasion + seasonal
- Housing interact với world economy
- Tất cả chạy trên server, client nhận state updates

---

## 2. Design Goals

- **Single Source of Truth**: WorldSimulationService trên server là authority
- **Tick-based**: World tick mỗi 5 giây (cho state changes)
- **Event-driven**: Thay đổi quan trọng broadcast ngay (không đợi tick)
- **Stateless clients**: Client không lưu world state — chỉ cache cho rendering
- **Graceful degradation**: Nếu WorldSimulation service restart, players không notice

---

## 3. World State Object

```
WorldState {
    // Time
    serverTimeMs:       long
    gameDayIndex:       uint
    timeOfDay:          TimeOfDay (enum)
    moonPhase:          byte (0-13)
    currentSeason:      byte (0-3: Spring/Summer/Autumn/Winter)
    seasonDayIndex:     byte (day within current season)
    
    // Per-Biome State (21 biomes)
    biomeStates:        BiomeState[21]
    
    // Server-Wide Events
    activeWorldEvents:  WorldEventState[]
    
    // Economy Snapshot (for UI)
    goldCirculation:    long  // for inflation monitoring
    
    lastTickAt:         long
}

BiomeState {
    biomeId:            byte
    
    // Weather
    weather:            WeatherType
    weatherIntensity:   float
    weatherTransitionMs: uint
    
    // Ownership
    ownerGuildId:       string? (null if unclaimed)
    
    // Invasion
    invasionMeter:      float (0.0-1.0)
    invasionPhase:      InvasionPhase
    
    // Spawn Conditions
    spawnRateMultiplier: float (computed from all modifiers)
    nightMonsterActive: bool
    fullMoonActive:     bool
    
    // Resources
    resourceYieldMultiplier: float
    rareResourceChance: float
    
    // Active Event
    activeEventId:      string?
    activeEventType:    byte
}
```

---

## 4. World Simulation Service Architecture

### 4.1 Service Structure

```
WorldSimulationService (Server)
├── WorldTimeService          ← ticks game clock
│     └── emit: OnPhaseChange, OnMoonPhaseChange, OnSeasonChange
├── WeatherScheduler          ← manages per-biome weather
│     └── emit: OnWeatherChange(biomeId, newWeather)
├── SpawnConditionComputer    ← aggregates all modifiers
│     ← receives: OnPhaseChange, OnWeatherChange, OnInvasionUpdate
│     └── output: biomeState.spawnRateMultiplier
├── NPCScheduleManager        ← NPC active/inactive
│     ← receives: OnPhaseChange
├── WorldEventScheduler       ← schedules/triggers events
│     ← receives: OnPhaseChange, OnMoonPhaseChange, OnWeatherChange
│     └── emit: OnEventStart(eventId), OnEventEnd(eventId)
├── InvasionStateManager      ← manages invasion meter per biome
│     ← receives: PlayerKill events
│     └── emit: OnInvasionUpdate(biomeId, meter)
├── BiomeStateAggregator      ← computes final BiomeState
│     ← receives: All of above
│     └── output: WorldState.biomeStates[21]
└── WorldStateBroadcaster     ← sends state to clients
      ← triggers: Every 30s + on important change
```

### 4.2 World Tick (Every 5 seconds)

```
WorldTick():
    1. WorldTimeService.Advance(5000ms)
       → If phase changed: emit OnPhaseChange
       → If moon phase changed: emit OnMoonPhaseChange
       → If season changed: emit OnSeasonChange
    
    2. WeatherScheduler.Tick()
       → For each biome: check weather duration
       → If expired: roll next weather, emit OnWeatherChange
    
    3. BiomeStateAggregator.Compute()
       → For each biome: combine all modifiers
       → Detect changes vs previous state
    
    4. HousingIncomeAccumulator.Tick()
       → Accumulate gold for housing plots (passive income)
    
    5. If anyBiomeStateChanged:
       → WorldStateBroadcaster.PushDelta(changedBiomes)
```

---

## 5. Spawn Condition System

### 5.1 Spawn Rate Computation

Cho mỗi biome, SpawnConditionComputer tính:

```
spawnRateMultiplier = 
    BASE_RATE (1.0)
    × timeModifier       (day=1.0, night=0.9, dusk=1.1, dawn=0.8)
    × weatherModifier    (từ WEATHER_SYSTEM.md)
    × invasionModifier   (0=1.0, fallen=0.5 — đã killed, ít monster còn lại)
    × territoryModifier  (guild-owned territory: +10% spawn rate)
    × seasonModifier     (Summer=1.2 day monsters, Winter=1.3 night monsters)
    × fullMoonModifier   (if FULL_MOON NIGHT: rare spawn ×3)
    × eventModifier      (World Boss active: surrounding areas +20%)
```

### 5.2 Rare Encounter Computation

```
rareEncounterChance =
    BASE_RARE (0.005 = 0.5%)
    × moonRarity         (FULL_MOON: ×5.0)
    × weatherRarity      (AURORA: ×10.0 for arcane creatures)
    × invasionRarity     (invasion fallen: ×3.0 for elite monsters)
    × timeRarity         (night: ×1.5, dawn: ×2.0 for dawn creatures)
    × capturedRarity     (already owns creature: ×0.2)
```

---

## 6. Seasonal System Integration

### 6.1 Season Duration

```
1 Season = 30 game days = 30 × 2h = 60 real hours
4 Seasons = 1 full year = 240 game days = 240 real hours (10 real days)
```

### 6.2 Season Effects Per Season

| Season | Main Effect | Biome Highlight | Special Events |
|---|---|---|---|
| Spring | +40% herb yields, more rain | Forest, Plains | Flower Festival |
| Summer | +30% fishing, more sun | Desert, Ocean | Summer Solstice |
| Autumn | +50% monster drops, fog | Forest, Tundra | Harvest Festival, Halloween-equiv |
| Winter | +50% ice resources, snow | Tundra, Mountain | Winter Festival, Christmas-equiv |

### 6.3 SeasonManager.cs Integration

Existing `SeasonManager.cs` handles Battle Pass. World Simulation extends it:

```
SeasonManager.OnWorldSeasonChange(season):
    // Existing: BattlePass season transition
    // NEW: WorldSimulationService.SetSeason(season)
    //      → Updates all biomeStates.seasonModifier
    //      → Triggers season-start World Event
```

---

## 7. Housing ↔ World Integration

### 7.1 Housing Income from World State

Housing passive income (`HousingManager.cs`) bị ảnh hưởng bởi world state:

```
goldPerHour =
    plotLevel × baseGoldRate    // level 1-10 base rate
    × biomeOwnershipBonus       // +20% nếu guild sở hữu biome này
    × seasonBonus               // Summer = +10% income
    × activeEventBonus          // Event ở biome này = +15% income
    × weatherBonus              // CLEAR = +5%, BLIZZARD = -20%
```

### 7.2 Creature Ranch from Biome

Pet/Creature sinh sản ở Housing Ranch:
- Ranch capacity tăng nếu guild sở hữu territory
- Creature loại xuất hiện từ biome housing đặt tại
- Weather ảnh hưởng creature mood (happiness) → breed rate

---

## 8. Event ↔ World Integration

### 8.1 Event Trigger Conditions

WorldEventScheduler check các điều kiện:

```
EventTriggerRule {
    eventType:          WorldEventType
    biomeId:            byte? (null = any)
    requireTimeOfDay:   TimeOfDay?
    requireMoonPhase:   byte?
    requireWeather:     WeatherType?
    requireMinPlayers:  int
    cooldownHours:      float
    probabilityPerTick: float  (checked every 5s tick)
}
```

### 8.2 Event ↔ Spawn Synergy

Khi World Event active:
- `WorldEventScheduler.OnEventStart()` → `SpawnConditionComputer.SetEventOverride()`
- Event-specific monsters replace normal spawn table trong event area
- Weather override set bởi event type (ví dụ: Boss → Thunderstorm)
- After event end: gradual return to normal spawn (5 phút transition)

---

## 9. Invasion System Integration

### 9.1 Invasion Meter Management

```
InvasionStateManager {
    biomeInvasionMeters[21]: float[]   // 0.0 to 1.0
    
    OnPlayerKillsInvasionMonster(biomeId):
        biomeInvasionMeters[biomeId] -= 0.005   // reduce meter
        
    OnInvasionMonsterReachesCore(biomeId):
        biomeInvasionMeters[biomeId] += 0.02    // increase meter
    
    Tick():
        for each biome with active invasion:
            meter += 0.001 per second (slow decay toward invasion)
        → if meter >= 0.9: SetPhase(CRITICAL)
        → if meter >= 1.0: SetPhase(FALLEN)
        → if meter <= 0.0 + 10min without increase: SetPhase(CLEAR)
}
```

### 9.2 Invasion × Weather Interaction

- Invasion CRITICAL → forces THUNDERSTORM in biome
- Invasion FALLEN → forces DENSE_FOG
- Clearing invasion → gradual weather normalization

---

## 10. NPC Schedule Coordinator

### 10.1 NPCScheduleManager

```
NPCScheduleManager (Server):
    OnPhaseChange(newPhase):
        for each NPC in npc_db:
            newState = npc.schedule.GetStateForPhase(newPhase)
            if newState != npc.currentState:
                npc.SetState(newState)
                // Broadcast S2C_NPCStateChange if players nearby
    
    OnEventStart(eventId):
        for each NPC with eventDialog[eventId]:
            npc.SetSpecialDialogMode(eventId)
    
    OnSeasonChange(season):
        // Update seasonal dialog trees
        // Trigger seasonal shop rotations
```

### 10.2 NPC State Broadcast

Client chỉ nhận NPC state nếu player ở trong cùng biome/zone:
- Range: 100m radius
- Rate: On-change only (không per-tick)

---

## 11. Data Flow Diagram

```
[Server — WorldSimulationService]
         │
    [5s World Tick]
         │
    ┌────┴────┐
    │ Time    │ → OnPhaseChange → NPCScheduleManager
    │ Service │                 → WorldEventScheduler
    │         │                 → SpawnConditionComputer
    └────┬────┘
         │ → OnWeatherChange → SpawnConditionComputer
    [Weather]                 → InvasionStateManager
    [Scheduler]               → EventScheduler
         │
    [BiomeStateAggregator]
         │ → WorldState (computed)
         │
    [WorldStateBroadcaster]
         ↓ (30s interval + on-change)
    S2C: WorldStateUpdate
         ↓
    [Client — WorldStateCache]
         ├── SkyManager (lighting, skybox)
         ├── WeatherRenderer
         ├── NPCManager (activate/deactivate)
         ├── SpawnManager (client-predicted spawn hints)
         ├── HousingUI (income preview)
         └── EventUI (active event display)
```

---

## 12. Save Data

WorldSimulation state là server-side ephemeral. Persistent data:

```sql
-- server_config (đã có):
world_epoch_ms, game_day_length_ms, moon_cycle_days, current_season

-- world_events table (đã có) — stores active/completed events
-- guild_territories table (đã có) — stores biome ownership
-- invasion_status (NEW column trong territory_zones):
ALTER TABLE territory_zones ADD COLUMN invasion_meter FLOAT NOT NULL DEFAULT 0.0;
```

Player save: không lưu world state (fully server-authoritative).

---

## 13. Database

Không cần new tables. Dùng existing:
- `territory_zones`: Add `invasion_meter` column
- `world_events`: Active/completed events (đã có)
- `server_config`: World time epoch, season tracking

```sql
-- Season state tracking:
INSERT INTO server_config VALUES ('current_season', '0');         -- Spring
INSERT INTO server_config VALUES ('current_season_day', '0');     -- Day within season
INSERT INTO server_config VALUES ('total_game_days', '0');        -- Since epoch
```

---

## 14. Network Packets

Dùng range 0x0500 (Weather đã reserve một số):

```
// S2C
WorldStateUpdate    = 0x0505   // Full world state (on login)
WorldStateDelta     = 0x0506   // Changed biomes only (every 30s)
BiomeEventBroadcast = 0x0507   // Important biome event (invasion, event start)
NPCStateChange      = 0x0508   // NPC active/inactive broadcast
SeasonChange        = 0x0509   // New season notification

// C2S (không cần — world state là server authority)
// Chỉ có WorldTimeRequest đã define ở 0x0551
```

**WorldStateDelta Payload:**
```
S2C_WorldStateDelta:
    changedBiomeCount: byte
    biomes: [{
        biomeId:            byte
        weatherType:        byte
        weatherIntensity:   float
        timeOfDay:          byte
        invasionMeter:      float
        spawnMultiplier:    float
        activeEventId:      string? (null if none)
    }]
```

---

## 15. Performance & Scalability

| Metric | Value | Notes |
|---|---|---|
| World tick interval | 5 seconds | 12 ticks/minute |
| State broadcast interval | 30 seconds | 2 broadcasts/minute |
| BiomeState computation | O(21) = trivial | 21 biomes |
| On-change broadcast | Immediate | For important events |
| Server memory | < 1MB | WorldState full object |
| Client network | ~500 bytes/30s | Delta state packets |

---

## 16. Disaster Recovery

Nếu WorldSimulationService restart:
1. Recompute current WorldTime từ epoch (deterministic)
2. Reload active world events từ world_events table
3. Reload territory ownership từ territory_zones table
4. WeatherScheduler restart với biome weather = CLEAR (fresh start)
5. Broadcast WorldStateUpdate (full) cho tất cả connected players
6. Total restart time: < 30 giây

---

## 17. Pet ↔ World Deep Integration

### 17.1 Pet Behavior by Time of Day

| TimeOfDay | Pet Behavior Change | Notes |
|---|---|---|
| DAWN | Wake animation (yawn/stretch) | One-shot anim on phase enter |
| DAY | Normal follow + explore | Standard behavior |
| DUSK | Slow down, yawn occasionally | IDLE_EXPLORE frequency −30% |
| NIGHT (Diurnal) | Sleep mode: follow still active but no idle wander | Pet sits near player, reduced animations |
| NIGHT (Nocturnal pet) | Energized: brighter particle effects, faster movement | +10% catch-up speed |

### 17.2 Pet Sleep System

Diurnal pets at NIGHT:
```
PetNightSleepController:
    OnTimeOfDayChanged(NIGHT):
        if pet.behavior == DIURNAL:
            pet.SetSleepMode(true)
            pet.idleExplore = false
            pet.walkSpeed *= 0.7
            PlaySleepAnimation()   // pet curls up near player (idle anim override)
            
    OnTimeOfDayChanged(DAWN):
        if pet.inSleepMode:
            pet.SetSleepMode(false)
            PlayWakeAnimation()    // yawn + stretch
            pet.idleExplore = true
            pet.walkSpeed = baseSpeed
```

Sleep mode visual: Pet model has slightly closed eyes, slower breathing animation.
Pet still follows player normally (không trở nên useless) — chỉ là cosmetic behavior.

### 17.3 Pet ↔ Weather Interaction Table

| Weather | Pet Type | Behavior | Visual Effect |
|---|---|---|---|
| LIGHT_RAIN | Aquatic | Excited: splash in puddles | Water splash particles |
| HEAVY_RAIN | Ground (all) | Hunched, slower wander | Shake water droplets emote |
| THUNDERSTORM | All | Scared: stays close to player (followDistance −30%) | Cowering animation |
| BLIZZARD | Aquatic | Distressed: speed penalty −20% | Shiver animation |
| BLIZZARD | Ice-type pet | Excited: +15% speed, happy emote | Ice sparkle particles |
| SANDSTORM | All | Distressed: eyes closed animation | Sand particle on pet |
| HEATWAVE | Fire-type pet | Excited: +10% speed | Heat shimmer aura |
| HEATWAVE | Ice-type pet | Distressed: wilting animation | Speed −15% |
| AURORA | Ethereal/Magic pet | Dance animation | Color-match aura (green/purple) |
| FOG | Ghost/Spirit pet | Camouflage effect: semi-transparent | Opacity −40% |

### 17.4 WorldSimulationService Pet Dispatch

```
WorldSimulationService.OnPhaseChange(newPhase):
    // Dispatch to connected clients — not server-side
    Broadcast(S2C_WorldStateDelta)
    // Client's PetBehaviorManager reads timeOfDay and updates behavior locally
    // No per-pet server state — behavior is deterministic from world state

WorldSimulationService.OnWeatherChange(biomeId, newWeather):
    Broadcast(S2C_BiomeWeatherUpdate to players in biome)
    // Client's PetWeatherReactionController reads new weather and adjusts
```

Không có server-side pet state change — client xử lý behavior change locally sau khi nhận world update. Consistent và không tốn server bandwidth.

---

## 18. Housing ↔ Night Lighting Automation

### 18.1 Trigger

```
WorldSimulationService.OnPhaseChange(newPhase):
    if newPhase == DUSK or newPhase == NIGHT:
        Broadcast(S2C_HousingNightLightingOn)
    elif newPhase == DAWN or newPhase == DAY:
        Broadcast(S2C_HousingNightLightingOff)
```

Client HousingLightingManager nhận packet và bật/tắt light furniture.

### 18.2 HousingNightLighting Packets

```
HousingNightLightingOn  = 0x0F20  // S2C: DUSK/NIGHT — bật tất cả light furniture
HousingNightLightingOff = 0x0F21  // S2C: DAWN/DAY — tắt tất cả light furniture
```

### 18.3 Per-House Visibility

Khi player đứng ngoài housing plot, nhìn vào:
- Night: Nhà sáng (window glow sprites visible)
- Day: Nhà bình thường

Window glow: Billboard sprite trên window furniture, chỉ hiển thị khi DUSK/NIGHT. Không dùng Unity point light cho exterior view (mobile optimization).

### 18.4 Integration với Housing Income

Night lighting state ảnh hưởng đến Housing Rating (nhỏ):

```
HousingRatingBonus:
    hasLightFurniture AND autoLightingEnabled: +0.2 sao bonus
    (vì nhà có đèn = immersive + welcoming)
```

---

## 19. NPC Visiting Player Housing (Social Events)

### 19.1 Overview

Một số NPC đặc biệt có thể "visit" nhà player vào thời điểm nhất định:
- Tạo surprise event cho owner
- Guests để lại special item hoặc dialog
- Contributes to Housing Rating (visited by special NPC)

### 19.2 NPC Visitor Types

| NPC Type | When They Visit | Frequency | Gift |
|---|---|---|---|
| Wandering Merchant | Random weekday, MORNING | 1×/week max | Rare material × 3 |
| Festival Spirit | During seasonal event | Once per event | Event cosmetic |
| Guild NPC | If guild reputation HIGH | 1×/month | Guild coin × 100 |
| Mystery Scholar | After completing specific quest chain | Once | Unique housing decor |
| Royal Envoy | If Housing Rank TOP 10 | Monthly | Title unlock |

### 19.3 NPC Visit Rules

```
NPCHousingVisitScheduler:
    candidateHouses = houses with allowPublic=true OR allowGuildMembers=true
    
    SelectHouseForVisit(npcType):
        filter by: plot_level >= npcType.minPlotLevel
        filter by: permission allows this NPC
        sort by: housing_rating DESC
        pick: random from top 20% (not always best house — variety)
    
    OnVisitStart(npcId, ownerId):
        if owner is online:
            SendPushNotification(owner, "A visitor has arrived at your home!")
        NPCVisitLog entry created
        NPCVisitDuration = 15 minutes real time
        
    OnVisitEnd():
        if owner claimed gift: remove
        else: mail gift to owner (using Mail System)
```

### 19.4 Player Notification

- If online: Banner notification "A Wandering Merchant is at your home!"
- Button: "Visit Now" → teleport to housing plot
- If offline: Mail notification on next login with gift already delivered

### 19.5 Network Packets

```
HousingNPCVisitStart  = 0x0F22  // S2C: notify owner of NPC visit
HousingNPCVisitGift   = 0x0F23  // S2C: claim gift from visiting NPC
HousingNPCVisitEnd    = 0x0F24  // S2C: NPC has left
```

### 19.6 Database

```sql
CREATE TABLE housing_npc_visits (
    visit_id        BIGSERIAL PRIMARY KEY,
    player_id       BIGINT NOT NULL,
    npc_id          VARCHAR(32) NOT NULL,
    visit_start     TIMESTAMP NOT NULL,
    visit_end       TIMESTAMP,
    gift_claimed    BOOL NOT NULL DEFAULT FALSE,
    gift_item_id    VARCHAR(32),
    gift_quantity   INT
);
```

---

## 20. Future Expansion

- Dynamic biome: Một số biomes có thể transform vĩnh viễn (Desert → Oasis) sau chain events
- Player-driven weather: Guild ritual skill có thể trigger weather event (1/week)
- World calendar: Server-wide event calendar (festivals, boss schedules) visible to players
- Biome health system: Overfarming reduces resource yields until "rested"
- World story events: Sequential world events forming a narrative arc (seasonal story)

---

*Document: WORLD_SIMULATION_ARCHITECTURE.md | Version: 1.1 | Date: 2026-06-14*
*Added: Section 17 (Pet × World deep integration), Section 18 (Housing Night Lighting), Section 19 (NPC Housing Visits)*
*Tích hợp với: WEATHER_SYSTEM, DAY_NIGHT_SYSTEM, PET_BEHAVIOR_ARCHITECTURE, WORLD_EVENT_SYSTEM, HOUSING_SYSTEM, HOUSING_EXPANSION*
