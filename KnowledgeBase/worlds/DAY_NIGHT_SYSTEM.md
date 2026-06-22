# DAY/NIGHT SYSTEM ARCHITECTURE
> Game: Slime MMORPG | Document: Day/Night Cycle Design | Date: 2026-06-14
> Scope: World time, day/night cycle, moon cycle, NPC/shop/quest/monster/event schedules

---

## 1. Purpose

Hệ thống ngày/đêm tạo ra nhịp điệu tự nhiên cho thế giới Slime MMORPG:
- NPC có lịch ngủ/hoạt động thực tế
- Shop đóng cửa ban đêm (trừ đặc biệt)
- Monster thay đổi theo giờ (day monsters vs night monsters)
- Event chỉ xuất hiện vào ban đêm (AURORA, Phantom raids)
- Moon cycle ảnh hưởng đến rare spawn
- Immersion tăng, tạo lý do cho người chơi có session khác nhau

---

## 2. Design Goals

- **Server authoritative**: Tất cả time calculations trên server
- **1 game day = 2 hours real time** (đủ để thấy thay đổi, không quá chậm)
- **Day/Night ratio = 60/40** (72 phút ngày, 48 phút đêm)
- **No real-clock dependency**: Game time chạy độc lập với múi giờ của player
- **Moon cycle = 14 game days** (28 giờ thực = chu kỳ mặt trăng)
- Mobile-friendly: không yêu cầu precise timing ở client

---

## 3. Time System Architecture

### 3.1 World Time

```
WorldTime {
    serverEpochMs:     long   // server start time (Unix ms)
    gameDayLengthMs:   uint = 7,200,000  // 2 giờ thực = 1 game day
    dayPhaseMs:        uint = 4,320,000  // 72 phút = ban ngày
    transitionMs:      uint =   600,000  // 10 phút transition (dawn/dusk)
    moonCycleDays:     byte = 14
}

// Current time calculation (server):
long elapsedMs = now() - serverEpochMs
long gameDayIndex = elapsedMs / gameDayLengthMs
long positionInDay = elapsedMs % gameDayLengthMs

TimeOfDay GetCurrentPhase():
    if positionInDay < 600_000: return DAWN        (10 min)
    if positionInDay < 4_320_000: return DAY       (62 min)
    if positionInDay < 4_920_000: return DUSK      (10 min)
    if positionInDay < 7_200_000: return NIGHT     (38 min)
```

### 3.2 TimeOfDay Enum

| Phase | Duration | Visual | Gameplay |
|---|---|---|---|
| DAWN | 10 phút | Sunrise, orange sky | NPC thức, shops open |
| DAY | 62 phút | Full daylight | Full activity |
| DUSK | 10 phút | Sunset, red sky | Night monster spawn start |
| NIGHT | 38 phút | Moon + stars | Night events active |

### 3.3 Moon Phase (14-day cycle)

| Day 1-2 | Day 3-4 | Day 5-7 | Day 8-9 | Day 10-11 | Day 12-14 |
|---|---|---|---|---|---|
| NEW_MOON | CRESCENT | HALF_MOON | WAXING_GIBBOUS | FULL_MOON | WANING |

**Full Moon Effects:**
- Lycanthrope monsters xuất hiện (+200% rate)
- Rare creature encounters +50%
- AURORA probability +200% ở Tundra
- Phantom boss có thể spawn (World Event)

**New Moon Effects:**
- Shadow/Undead monsters +100%
- Visibility giảm thêm 20%
- Dark element damage +10%

---

## 4. NPC Schedule System

### 4.1 Schedule Types

| Type | Active Hours (Game Time) | Examples |
|---|---|---|
| MERCHANT_DAY | DAY + DAWN | Most shop NPCs (23/49) |
| MERCHANT_NIGHT | NIGHT + DUSK | Midnight Trader, Shadow Market |
| GUARD | 24h (không ngủ) | Town guards, Dungeon sentinels |
| TRAINER | DAY only | Skill trainers, Class masters |
| INNKEEPER | 24h | Inn rest services |
| FARMER | DAWN + DAY | Farm resources, harvest |
| QUEST_GIVER | DAY | Story quest NPCs |
| HIDDEN | NIGHT only | Secret NPC, Night quests |

### 4.2 NPC State Machine

```
NPC State Machine:
    ACTIVE → (time condition fails) → IDLE
    IDLE   → (player talks) → "Xin lỗi, tôi đang nghỉ ngơi"
    IDLE   → (time condition met) → ACTIVE
    ACTIVE → (event trigger) → SPECIAL (event dialog)
```

### 4.3 NPC Location Changes (Day/Night)

Một số NPC di chuyển theo giờ:
- Ban ngày: tại quầy hàng
- Ban đêm: tại quán rượu (vẫn có thể nói chuyện, nhưng không bán hàng)
- Ví dụ: Merchant Elena → Daytime: Shop, Nighttime: Tavern (gossip dialog)

---

## 5. Shop Schedule

### 5.1 Shop Operating Hours

| Shop Type | Open | Close | Special |
|---|---|---|---|
| NPC Static Shops (8) | DAY+DAWN | DUSK | Không đóng cửa thực sự (có NPC phụ) |
| NPC Rotating (6) | DAY only | — | Inventory rotation vẫn xảy ra khi đóng |
| Night Market | DUSK+NIGHT | DAWN | Chỉ mở ban đêm — unique items |
| Guild Shop | 24h | — | Không bị ảnh hưởng |
| Event Shops | Per event | — | Theo event schedule |
| Premium Shop | 24h | — | Không bị ảnh hưởng |

### 5.2 Night Market (Special)

Night Market là shop độc đáo:
- Chỉ mở trong DUSK + NIGHT phase
- Bán Shadow/Lunar items (cosmetic only, is_power=false)
- Dùng currency: `moon_silver` (earn từ night quests)
- Inventory thay đổi theo Moon Phase
- Full Moon night: Legendary cosmetics available

---

## 6. Quest Schedule

### 6.1 Time-Gated Quests

| Quest Type | Condition | Example |
|---|---|---|
| Day Quests | TimeOfDay = DAY | "Harvest crops before sunset" |
| Night Quests | TimeOfDay = NIGHT | "Collect moonblossoms" |
| Dawn Quests | TimeOfDay = DAWN | "Watch sunrise at peak" |
| Full Moon Quests | MoonPhase = FULL_MOON | "Defeat the Lunar Beast" |
| Time-Limited Daily | Reset daily at server reset | Standard daily quests |

### 6.2 QuestStateMachine Integration

QuestStateMachine.TryUnlock() đã check:
- Level requirement
- Quest chain prerequisite
- **New: TimeCondition** → `worldTime.IsPhase(NIGHT)`

Quest unlock check thêm field `timeCondition: TimeOfDay?` trong QuestSO.

---

## 7. Monster Spawn Schedule

### 7.1 Day vs Night Monsters

| Monster Category | Spawn Phase | Biome | Notes |
|---|---|---|---|
| Standard Slimes | DAY | Tất cả | Base enemy |
| Nocturnal Slimes | NIGHT | Forest, Swamp | +20% spawn |
| Undead | NIGHT | Graveyard, Dark Forest | +50% spawn |
| Shadow variants | NIGHT | All | 5% chance replace standard |
| Diurnal Creatures | DAY | Plains, Desert | Disappear at night |
| FULL_MOON specials | NIGHT + FULL_MOON | Tundra, Forest | Rare encounters |

### 7.2 Spawn Rate Modifiers

| Phase | Base Rate | Aggressive Monsters | Rare Encounters |
|---|---|---|---|
| DAY | 100% | 80% | 100% |
| DAWN | 80% | 60% | 120% |
| DUSK | 110% | 120% | 130% |
| NIGHT | 90% | 150% | 80% |
| FULL MOON NIGHT | 100% | 180% | 300% |

### 7.3 Boss Spawn Windows

| Boss | Spawn Time | Respawn Cooldown |
|---|---|---|
| World Boss (Standard) | Any | 6h |
| Night Raid Boss | NIGHT only | 24h |
| Full Moon Boss | FULL_MOON NIGHT | 14 days |
| Dawn Champion | DAWN only | 12h |

---

## 8. Event Schedule Integration

### 8.1 Time-Triggered Events

| Event | Trigger | Duration |
|---|---|---|
| Night Market Opening | DUSK | Until DAWN |
| AURORA Event | NIGHT + FULL_MOON + Tundra | Until DAWN |
| Treasure Hunt (Night) | Specific NIGHT + biome | 45 phút |
| Phantom Invasion | NIGHT + NEW_MOON | 30 phút |
| Sunrise Fishing | DAWN | 10 phút |
| Night Raid | NIGHT (random, 3/week) | 20 phút |

### 8.2 Event Priority Queue

```
WorldEventScheduler priority:
    1. WorldBoss (highest — override weather + day phase)
    2. Guild War (block night events in contested territory)
    3. Invasion (override spawn + weather)
    4. Night Raid
    5. Treasure Hunt
    6. Seasonal Events
    7. Standard Night Market (lowest)
```

---

## 9. Visual & Audio Architecture

### 9.1 Sky System

```
SkyManager (Client) {
    skyboxMaterial:     Material (HDRP Sky)
    sunLight:           Directional Light
    moonLight:          Directional Light (secondary)
    ambientIntensity:   float curve per time phase
    starfield:          Particle system (active at NIGHT)
    moonPhaseSprite:    Sprite (14 frames = 14 moon phases)
}
```

### 9.2 Lighting Transitions

| Transition | Duration | Method |
|---|---|---|
| Dawn → Day | 10 phút | lerp skybox + sun intensity |
| Day → Dusk | 10 phút | lerp to orange tones |
| Dusk → Night | 10 phút | lerp to dark + stars appear |
| Night → Dawn | 10 phút | stars fade, moon sets |

**Mobile optimization:**
- Light baking for static geometry (do once at build time)
- Dynamic shadows only for player + 5 nearest enemies
- Skybox: 3 variants (Day/Dusk/Night) — swap với blend shader (không procedural)
- Star field: sprite sheet, không particle system (mobile)

### 9.3 Ambient Audio

| Phase | Music | Ambient Sounds |
|---|---|---|
| DAY | Adventure track | Birds, wind |
| DAWN | Calm variation | Birds louder |
| DUSK | Tension variation | Crickets begin |
| NIGHT | Mysterious track | Crickets, owls, distant howls |
| FULL MOON | Eerie variation | Wolf howls |

---

## 10. Data Flow

```
[Server — WorldTimeService]
    ↓ every 60 seconds OR on phase change
[WorldTimeUpdate Packet S2C]
    ↓
[Client — WorldTimeManager]
    ├── TimeOfDay: update skybox, lighting
    ├── MoonPhase: update moonSprite
    ├── NPCScheduleManager: activate/deactivate NPCs
    ├── SpawnManager: update spawn tables
    ├── ShopManager: open/close shops
    └── EventScheduler: trigger time-gated events
```

---

## 11. Save Data

Day/Night system là **server-side ephemeral** — không cần player save.

Server saves:
```
server_world_state {
    epochMs:          long  // server start (in config)
    moonPhaseDay:     byte  // 0-13
    currentTimeOfDay: byte  // 0-3 (enum)
}
```

Client stores (local cache only, not persisted):
- `lastKnownTimeOfDay`: for instant UI on load
- `moonPhaseIndex`: for visual rendering

---

## 12. Database

Day/Night không cần dedicated table. Time là computable từ server epoch:

```sql
-- Trong server_config table (đã có):
INSERT INTO server_config(key, value) VALUES
    ('world_epoch_ms', '1718323200000'),  -- 2024-06-14 00:00:00 UTC
    ('game_day_length_ms', '7200000'),
    ('moon_cycle_days', '14');
```

Analytics: Log time-of-day vào analytics_events:
```json
{ "event": "session_start", "time_of_day": "NIGHT", "moon_phase": "FULL_MOON" }
```

---

## 13. Network Packets

Thêm vào range `0x0500`:

```
// S2C
WorldTimeUpdate     = 0x0503   // Every 60s hoặc phase change
WorldTimeFullSync   = 0x0504   // Full state on login

// C2S
WorldTimeRequest    = 0x0551   // Request after reconnect
```

**WorldTimeUpdate Payload:**
```
S2C_WorldTimeUpdate:
    serverTimeMs:   long      // current server time (for sync)
    gameDayIndex:   uint      // total game days since epoch
    timeOfDay:      byte      // 0=DAWN, 1=DAY, 2=DUSK, 3=NIGHT
    moonPhase:      byte      // 0-13
    nextPhaseMs:    uint      // ms until next phase change
```

**Rate Limit:** WorldTimeRequest: 5/minute/player

---

## 14. Scalability

- WorldTimeService: Single stateless service, mọi server instance dùng chung epoch
- Broadcast interval: 60 giây (1 packet per player per minute = rất thấp)
- Phase change broadcast: Push-based, không poll
- Client interpolates local time between server updates (smooth rendering)

---

## 15. Mobile Optimization

- Lighting update: max 5fps (không cần per-frame)
- Skybox swap: pre-baked (3 textures), blend shader
- NPC schedule check: event-driven (không check mỗi frame)
- Audio crossfade: AudioManager, 1 music source + 1 ambient source
- Moon sprite: 14-frame sprite sheet, swap theo moonPhaseIndex

---

## 16. Seasonal Time Adjustments

### 16.1 Overview

Mỗi Season (30 game days = 60 giờ thực) thay đổi tỷ lệ ngày/đêm:

| Season | Day Phase | Night Phase | Ratio | Effect |
|---|---|---|---|---|
| SPRING | 62 min | 38 min | 62/38 (baseline) | Balanced |
| SUMMER | 78 min | 22 min | 78/22 (longer day) | More daytime content |
| AUTUMN | 62 min | 38 min | 62/38 (same as Spring) | Balanced |
| WINTER | 44 min | 56 min | 44/56 (longer night) | More night content |

Note: DAWN và DUSK vẫn cố định 10 phút mỗi phase — chỉ DAY và NIGHT duration thay đổi.

Total 2h game day KHÔNG thay đổi:
- Summer: DAWN(10) + DAY(78) + DUSK(10) + NIGHT(22) = 120 min ✅
- Winter: DAWN(10) + DAY(44) + DUSK(10) + NIGHT(56) = 120 min ✅

### 16.2 Seasonal Time Impact on Systems

#### 16.2.1 Night Market Duration

| Season | Night Market Hours | Impact |
|---|---|---|
| SUMMER | 22 min real | Shorter window → rarer items more valuable |
| WINTER | 56 min real | Long window → players have more time to shop |

#### 16.2.2 Monster Spawn Impact

| Season | Nocturnal Spawn Window | Diurnal Spawn Window |
|---|---|---|
| SUMMER | 22 min (very short) | 78 min (very long) |
| WINTER | 56 min (long) | 44 min (short) |

Winter: Nocturnal monsters dominant → higher challenge + better night loot.
Summer: Daytime content easier + more accessible.

#### 16.2.3 Aurora Event

AURORA requires: NIGHT + FULL_MOON + Tundra biome:
- SUMMER: Window = 22 min, AURORA very rare (tight timing)
- WINTER: Window = 56 min, AURORA more accessible

### 16.3 Server Implementation

```
SeasonTimeCalculator:
    struct SeasonDayPhaseMs {
        dawnMs:  10 * 60 * 1000  // always 600,000
        dayMs:   varies by season
        duskMs:  10 * 60 * 1000  // always 600,000
        nightMs: varies by season
    }
    
    Map<Season, SeasonDayPhaseMs>:
        SPRING: { dayMs: 3,720,000, nightMs: 2,280,000 }  // 62 / 38 min
        SUMMER: { dayMs: 4,680,000, nightMs: 1,320,000 }  // 78 / 22 min
        AUTUMN: { dayMs: 3,720,000, nightMs: 2,280,000 }  // 62 / 38 min
        WINTER: { dayMs: 2,640,000, nightMs: 3,360,000 }  // 44 / 56 min
    
    GetCurrentPhase(serverTimeMs):
        gameDayMs = serverTimeMs % gameDayLengthMs  // 7,200,000
        phases = GetSeasonPhases(currentSeason)
        
        if gameDayMs < phases.dawnMs:          return DAWN
        if gameDayMs < dawn + day:             return DAY
        if gameDayMs < dawn + day + dusk:      return DUSK
        return NIGHT
```

### 16.4 Network Payload Update

`WorldTimeUpdate` packet thêm field `seasonDayRatio`:

```
S2C_WorldTimeUpdate (Updated):
    serverTimeMs:   long
    gameDayIndex:   uint
    timeOfDay:      byte      // 0=DAWN, 1=DAY, 2=DUSK, 3=NIGHT
    moonPhase:      byte      // 0-13
    nextPhaseMs:    uint      // ms until next phase change
    currentSeason:  byte      // 0=SPRING, 1=SUMMER, 2=AUTUMN, 3=WINTER (ADDED)
    dayMs:          uint      // current day phase duration (ADDED — for client UI)
    nightMs:        uint      // current night phase duration (ADDED — for client UI)
```

Client hiển thị "Summer: Long Day" indicator trên HUD khi hover lên clock icon.

### 16.5 Player-Facing Communication

| Season | HUD Clock Color | Clock Tooltip |
|---|---|---|
| SPRING | Green | "Spring — Balanced days and nights" |
| SUMMER | Orange | "Summer — Extra long day (78 min), short night (22 min)" |
| AUTUMN | Gold | "Autumn — Balanced days and nights" |
| WINTER | Blue | "Winter — Short day (44 min), long night (56 min)" |

---

## 17. Future Expansion

- Player-owned timepieces: Item xem giờ game time
- Guild time buffs: Guild skill cho phép +10 phút thêm vào night bonus window
- Day-specific crafting: Một số recipes yêu cầu specific time of day
- Eclipse event: Hiếm (1 lần/server season) — ngày + đêm cùng lúc (dark sky + day monster)
- Time manipulation skill: Legendary skill có thể "freeze time" trong dungeon (30s max)
- Daylight saving integration: Option cho server admin chọn timezone offset

---

*Document: DAY_NIGHT_SYSTEM.md | Version: 1.1 | Date: 2026-06-14*
*Added: Section 16 — Seasonal Time Adjustments (Summer longer day, Winter longer night)*
*Tích hợp với: WEATHER_SYSTEM, WORLD_SIMULATION_ARCHITECTURE, WORLD_EVENT_SYSTEM, NPC_ARCHITECTURE*
