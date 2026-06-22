# WEATHER SYSTEM ARCHITECTURE
> Game: Slime MMORPG | Document: Weather System Design | Date: 2026-06-14
> Scope: Weather types, scheduler, biome/seasonal modifiers, network sync

---

## 1. Purpose

Hệ thống thời tiết tạo ra sự đa dạng và chiều sâu cho thế giới game. Thời tiết ảnh hưởng đến:
- Spawn rate và behavior của monster
- Drop rate của tài nguyên
- Hiệu năng kỹ năng (element bonus/penalty)
- Hoạt động của NPC và shop
- Trải nghiệm visual của người chơi

**KHÔNG ảnh hưởng đến Power Budget** — weather là context modifier, không phải stat bonus vĩnh viễn.

---

## 2. Design Goals

- Thời tiết theo biome (Desert khác Forest)
- Thời tiết theo mùa (Winter = Snow nhiều hơn)
- Thời tiết theo sự kiện world (World Boss = Thunderstorm)
- Server-authoritative: server quyết định thời tiết, client chỉ render
- Transition mượt mà: không thay đổi đột ngột
- Mobile-optimized: không tốn CPU khi không render

---

## 3. Weather Types

### 3.1 Phân Loại Thời Tiết (12 loại)

| ID | Tên | Biome Áp Dụng | Duration | Frequency |
|---|---|---|---|---|
| 0 | CLEAR | Tất cả | 30-120 phút | Phổ biến nhất |
| 1 | CLOUDY | Tất cả | 20-60 phút | Thường |
| 2 | LIGHT_RAIN | Forest, Swamp, Plains | 15-45 phút | Thường |
| 3 | HEAVY_RAIN | Forest, Swamp | 10-30 phút | Thỉnh thoảng |
| 4 | THUNDERSTORM | Tất cả (event only thường) | 15-30 phút | Hiếm |
| 5 | FOG | Forest, Swamp, Tundra | 20-60 phút | Thỉnh thoảng |
| 6 | DENSE_FOG | Swamp, Dark Forest | 10-30 phút | Hiếm |
| 7 | LIGHT_SNOW | Tundra, Mountain | 20-60 phút | Theo mùa |
| 8 | BLIZZARD | Tundra | 15-30 phút | Hiếm |
| 9 | SANDSTORM | Desert, Badlands | 10-25 phút | Thỉnh thoảng |
| 10 | HEATWAVE | Desert, Volcano | 30-90 phút | Theo mùa |
| 11 | AURORA | Tundra (night only) | 20-60 phút | Rất hiếm |

### 3.2 Transition Times

- Clear → Cloudy: 2 phút
- Cloudy → Rain: 3 phút
- Rain → Thunderstorm: 2 phút
- Thunderstorm → Clear: 5 phút (gradual)
- Thunderstorm không xuất hiện đột ngột — phải qua Cloudy → Heavy Rain

---

## 4. Weather Scheduler Architecture

### 4.1 Server-Side WeatherScheduler

```
WeatherScheduler (Server Singleton)
├── BiomeWeatherState[21]         // 1 state per biome
├── WorldWeatherOverride           // event-driven override
├── SeasonWeatherTable             // seasonal probability weights
├── WeatherTransitionQueue         // pending transitions per biome
└── WeatherBroadcastTimer          // 30s sync interval
```

### 4.2 Thuật Toán Tạo Thời Tiết

```
Mỗi biome có vòng thời tiết độc lập:

1. Lấy biome.currentWeather
2. Kiểm tra WorldWeatherOverride (event đang diễn ra?)
3. Nếu có override → dùng override weather
4. Nếu không:
   a. Check biome.weatherDurationRemaining
   b. Nếu hết → roll next weather:
      weight = SeasonWeatherTable[season][biome][weatherType]
      × DayNightModifier[isNight][weatherType]
      nextWeather = WeightedRandom(weights)
   c. Tạo WeatherTransition event
5. Broadcast BiomeWeatherUpdate packet cho players trong biome
```

### 4.3 WeatherState Object

```
WeatherState {
    biomeId:            byte
    weatherType:        byte (0-11)
    intensity:          float (0.0-1.0)
    durationMs:         uint
    startedAtMs:        long (server time)
    transitionFromType: byte
    transitionMs:       uint
    windDirection:      float (degrees)
    windSpeed:          float
    temperature:        float (Celsius, for ambient effects)
}
```

---

## 5. Biome Weather Profiles

### 5.1 Probability Table (% theo biome, CLEAR = base)

| Weather | Forest | Desert | Tundra | Swamp | Ocean | Volcano | Plains |
|---|---|---|---|---|---|---|---|
| CLEAR | 40% | 50% | 35% | 30% | 40% | 45% | 50% |
| CLOUDY | 20% | 15% | 20% | 20% | 25% | 20% | 20% |
| LIGHT_RAIN | 20% | 0% | 0% | 25% | 20% | 0% | 15% |
| HEAVY_RAIN | 10% | 0% | 0% | 15% | 10% | 0% | 5% |
| FOG | 5% | 0% | 10% | 8% | 3% | 0% | 5% |
| THUNDERSTORM | 3% | 0% | 5% | 2% | 1% | 0% | 3% |
| SANDSTORM | 0% | 30% | 0% | 0% | 0% | 0% | 0% |
| LIGHT_SNOW | 0% | 0% | 15% | 0% | 0% | 0% | 2% |
| BLIZZARD | 0% | 0% | 10% | 0% | 0% | 0% | 0% |
| HEATWAVE | 0% | 5% | 0% | 0% | 0% | 35% | 0% |
| DENSE_FOG | 2% | 0% | 5% | 0% | 1% | 0% | 0% |

### 5.2 Seasonal Modifiers (multiplier trên probability trên)

| Season | Rain×M | Snow×M | Fog×M | Storm×M | Clear×M |
|---|---|---|---|---|---|
| Spring | ×1.5 | ×0.2 | ×1.3 | ×1.2 | ×0.8 |
| Summer | ×0.6 | ×0 | ×0.5 | ×1.4 | ×1.4 |
| Autumn | ×1.3 | ×0.5 | ×1.8 | ×1.1 | ×0.8 |
| Winter | ×0.8 | ×3.0 | ×1.5 | ×0.9 | ×0.7 |

---

## 6. Weather Modifiers (Gameplay Effects)

### 6.1 Monster Spawn & Behavior

| Weather | Spawn Rate | Aggro Range | Move Speed | Element Bonus |
|---|---|---|---|---|
| CLEAR | 100% | 100% | 100% | none |
| HEAVY_RAIN | +20% water/storm monsters | -10% | -5% | Water +10% |
| THUNDERSTORM | Rare lightning monsters +100% | +30% | +10% | Lightning +20% |
| BLIZZARD | Ice monsters +50% | +50% | -20% | Ice +20%, Fire -10% |
| SANDSTORM | Desert monsters +30% | -30% | -15% | Earth +15% |
| FOG | Undead/Shadow +40% | -40% | 0% | Dark +15% |
| HEATWAVE | Fire monsters +30% | +20% | +15% | Fire +15%, Water -10% |
| AURORA | Arcane/Light spirits spawn | — | 0% | Light +25% |

### 6.2 Resource & Gathering Modifiers

| Weather | Herb Yield | Ore Yield | Fish Yield | Wood Yield |
|---|---|---|---|---|
| LIGHT_RAIN | +20% Herbs | 0% | +10% Fish | +10% Wood |
| HEAVY_RAIN | +40% Rare Herbs | -10% Ore | +25% Fish | +20% Wood |
| THUNDERSTORM | +60% Lightning Herbs | 0% | -20% Fish | -20% Wood |
| BLIZZARD | -50% | -30% | -80% | -50% |
| SANDSTORM | -30% | +20% Desert Ore | 0% | -40% |
| CLEAR | 100% base | 100% base | 100% base | 100% base |
| AURORA | +100% Arcane Crystal | 0% | 0% | 0% |

### 6.3 Player Skill Element Modifiers

| Weather | Water Skill | Fire Skill | Ice Skill | Lightning | Wind |
|---|---|---|---|---|---|
| HEAVY_RAIN | +8% damage | -5% damage | 0% | +3% damage | +5% |
| THUNDERSTORM | +5% | -8% | -5% | +15% | +10% |
| BLIZZARD | +3% | -15% | +15% | -5% | -10% |
| HEATWAVE | -5% | +12% | -15% | 0% | 0% |
| SANDSTORM | 0% | +5% | -5% | -3% | +8% |

**Quan trọng:** Modifiers này áp dụng dưới dạng `ContextMult` trong Damage Formula V10:
`FinalDamage = ATK × SkillMult × CritMult × ElementMult × ContextMult × (1 − DefMit) × SitCap`

Weather không tạo permanent stat boost — chỉ là situational context multiplier.

### 6.4 Visibility & Navigation

| Weather | Visibility | Mount Speed | Fishing Spot Visible |
|---|---|---|---|
| DENSE_FOG | -70% | -20% | -50% |
| FOG | -30% | -10% | -20% |
| BLIZZARD | -50% | -30% | -30% |
| SANDSTORM | -40% | -25% | N/A |
| CLEAR/CLOUDY | 100% | 100% | 100% |

---

## 7. Event-Driven Weather Overrides

### 7.1 World Boss Weather

| Boss | Weather Override | Duration |
|---|---|---|
| Dragon Boss | THUNDERSTORM intensity=1.0 | Boss alive + 5 phút |
| Ice Giant | BLIZZARD intensity=1.0 | Boss alive |
| Sandworm | SANDSTORM intensity=1.0 | Boss alive |
| Phantom | DENSE_FOG intensity=1.0 | Boss alive |

### 7.2 Invasion Event Weather

| Invasion Phase | Weather |
|---|---|
| Scout (0-20%) | Normal + slight FOG |
| Under Attack (20-60%) | HEAVY_RAIN |
| Critical (60-90%) | THUNDERSTORM |
| Fallen (90-100%) | DENSE_FOG |

### 7.3 Seasonal Events

| Event | Weather Override |
|---|---|
| Winter Festival | LIGHT_SNOW toàn server |
| Summer Festival | CLEAR + HEATWAVE ở Desert |
| Storm Season | THUNDERSTORM tăng 3× |
| Aurora Night | AURORA ở Tundra mỗi đêm |

---

## 8. Data Flow

```
[Server — WeatherScheduler]
    ↓ (mỗi 30 giây hoặc khi transition)
[BiomeWeatherUpdate Packet S2C]
    ↓
[Client — WeatherManager]
    ├── WeatherRenderer (visual effects)
    ├── AmbientSoundManager (rain/thunder sounds)
    ├── UIWeatherWidget (HUD indicator)
    └── GameplayModifierApplier
            ├── ElementModifierCache (for DamageCalculator)
            ├── SpawnModifierCache (for spawn logic)
            └── ResourceYieldCache (for gathering)
```

---

## 9. Save Data

Weather state KHÔNG lưu vào player save (server-side authority):
- `biomeWeatherStates[21]`: Lưu trên **server** — WeatherScheduler singleton
- Client reconnect → request WeatherStateSync (single packet fetch)
- Player save chỉ lưu `lastKnownWeather` (read-only cache, không dùng cho logic)

---

## 10. Database

Weather không cần database table vì:
- State là ephemeral (reset khi server restart là OK)
- History không cần (không ảnh hưởng persistent data)

**Exception — Event Weather Log:**
```sql
-- Chỉ log khi World Boss override weather (cho analytics)
INSERT INTO world_events(event_type='WEATHER_OVERRIDE', config_json=...) 
-- Dùng bảng world_events đã có
```

---

## 11. Network Packets

Thêm vào range `0x0500` (Reserved — còn trống):

```
// S2C — Server to Client
BiomeWeatherUpdate     = 0x0500   // Broadcast khi weather thay đổi
WeatherStateSync       = 0x0501   // Full state khi player login/reconnect
WeatherTransitionStart = 0x0502   // Alert trước 2 phút (transition warning)

// C2S — Client to Server
WeatherStateRequest    = 0x0550   // Request state sau reconnect
```

**BiomeWeatherUpdate Payload:**
```
S2C_BiomeWeatherUpdate:
    biomeId:         byte
    weatherType:     byte
    intensity:       float
    transitionMs:    uint        (transition duration)
    fromWeatherType: byte
    windDirection:   float
    windSpeed:       float
```

**Rate Limit:** WeatherStateRequest: 5/minute/player (spam protection)

---

## 12. Mobile Optimization

- Weather visual effects: LOD system (High/Medium/Low dựa trên device)
- Particle count: Max 500 (Desktop), Max 150 (Mid), Max 50 (Low-end)
- Rain/Snow: Shader-based, không dùng particle nếu device < GPU benchmark
- Fog: Post-processing Unity URP (1 draw call)
- Snow: Shader overlay (không particle cho mobile low-end)
- Ambient sound: 1 audio source, cross-fade 2 giây
- WeatherManager chỉ update khi camera ở outdoor area

---

## 13. Scalability

- WeatherScheduler là **stateless per-tick**: 21 biomes × 1 byte = 21 bytes state
- Broadcast: mỗi 30 giây hoặc on-change → rất thấp bandwidth
- Event override: priority queue, O(1) apply
- Không có per-player weather state — tất cả players trong biome thấy cùng weather

---

## 14. Future Expansion

- Dynamic micro-weather: sub-biome weather zones (rain trong một góc của biome)
- Player skill gây thời tiết: Storm Mage có thể trigger thunderstorm (temporary, 2 phút)
- Guild territory weather bonus: Guild sở hữu territory ở tundra có thể unlock AURORA thường hơn
- Weather crafting recipes: Một số recipes chỉ craftable khi có weather cụ thể
- Weather prediction item: Item tiêu dùng cho phép xem thời tiết 30 phút tới

---

## 15. Visual Effects (VFX) Architecture

### 15.1 Particle System Per Weather

| Weather | Particle System | Count (Mid) | Count (Low) | Shader |
|---|---|---|---|---|
| CLEAR | None | 0 | 0 | Default skybox |
| CLOUDY | Cloud billboard sprites | 0 (static) | 0 | Cloud_Blend |
| LIGHT_RAIN | Rain_Drops particle | 200 | 80 | Rain_Streak |
| HEAVY_RAIN | Rain_Heavy particle | 400 | 120 | Rain_Streak_Heavy |
| THUNDERSTORM | Rain_Heavy + Lightning_Flash | 400 + flash | 100 + flash | Rain + FlashOverlay |
| FOG | Fog_Volume (URP post-process) | 0 | 0 | Fog_Depth |
| DENSE_FOG | Fog_Volume (dense) + mist particles | 50 | 0 | Fog_Depth_Dense |
| LIGHT_SNOW | Snow_Flake particle | 150 | 60 | Snow_Flake |
| BLIZZARD | Snow_Blizzard particle | 500 | 150 | Snow_Blizzard + Wind |
| SANDSTORM | Sand_Particle + screen tint | 300 | 100 | Sand_Overlay |
| HEATWAVE | Heat_Shimmer (screen distort) | 0 (shader) | 0 | Heatwave_Distort |
| AURORA | Aurora_Ribbon (fullscreen quad) | 0 (shader) | 0 | Aurora_Ribbon |

### 15.2 Skybox Variants

```
WeatherSkyboxController:
    Each weather type → 1-2 skybox materials
    
    CLEAR:        Skybox_Biome_Clear (biome-specific: Desert/Forest/Tundra variants)
    CLOUDY:       Skybox_Cloudy
    RAIN family:  Skybox_Overcast
    THUNDERSTORM: Skybox_Thunderstorm (dark, purple-grey tones)
    FOG family:   Skybox_Foggy (muted all colors)
    SNOW family:  Skybox_Overcast_Snow (white-grey)
    BLIZZARD:     Skybox_Blizzard (near-white, low visibility)
    SANDSTORM:    Skybox_Sandstorm (orange-brown tint)
    HEATWAVE:     Skybox_Clear + intensity +30%
    AURORA:       Skybox_Night_Aurora (green/purple bands)
    
    Transition: Lerp alpha between 2 skybox materials over transitionMs
```

### 15.3 Biome-Specific VFX

| Biome | Special VFX |
|---|---|
| Desert | Sandstorm: orange screen tint overlay 0.4 alpha |
| Tundra | Snow: footprint decals in snow (max 50 decals) |
| Swamp | Fog: Firefly particles appear in fog (20 fireflies) |
| Ocean | Rain: ripple normal-map on water surface |
| Volcano | Heatwave: lava shimmer effect intensified |
| Dark Forest | Dense_Fog: will-o-wisp light sprites (3-5 max) |

### 15.4 Lightning System (Thunderstorm)

```
LightningController:
    flashInterval: Random(8s, 20s)
    flashDuration: 0.15s
    
    OnFlash():
        DirectionalLight.intensity: 0 → 4.0 → 0 (over 0.15s)
        ScreenFlash: white overlay alpha 0 → 0.3 → 0
        Audio: PlayThunderWithDelay(Random(0.5s, 2.5s))
        
    LightningBolt visual: Billboard sprite (1-3 random shapes)
    LightningBolt position: Random in view frustum, above terrain
    Max lightning bolts visible: 1 (mobile limitation)
```

### 15.5 Screen Effects Per Weather

| Weather | Screen Effect | Intensity |
|---|---|---|
| HEAVY_RAIN | Rain droplets on screen (2D overlay) | Moderate |
| THUNDERSTORM | Rain droplets + occasional flash | High |
| BLIZZARD | Snow flakes on screen + vignette | High |
| SANDSTORM | Dust particles on screen + amber tint | High |
| DENSE_FOG | Desaturate + blur vignette | Medium |
| HEATWAVE | Distortion shader (heat waves) | Low-Medium |
| AURORA | Edge-of-screen color bands | Subtle |

### 15.6 Weather Transition VFX

```
WeatherTransitionManager:
    transitionDuration: defined per-weather (min 30s, max 120s)
    
    Steps:
    1. Begin lerp skybox material (immediate)
    2. Begin fade-out current particles (over 10s)
    3. Begin fade-in new particles (after 10s)
    4. Apply new intensity to screen effects (lerp over full duration)
    5. Dispatch WeatherChanged event → AmbientSoundManager
    
    Cancel: If new weather triggered mid-transition → skip to new target
```

### 15.7 Intensity Variable

Server sends `intensity: float (0.0–1.0)` per weather:
- intensity 0.3: Light version (less particles, softer sounds)
- intensity 1.0: Full version (max particles, full sounds)
- Particle count = baseCount × intensity
- Sound volume = baseVolume × (0.5 + intensity × 0.5)

---

## 16. Audio Effects Architecture

### 16.1 Ambient Sound Library

| Weather | Ambient Loop | Duration | Notes |
|---|---|---|---|
| CLEAR | ambient_nature_birds.ogg | 3 min loop | Biome-variant (forest/desert) |
| CLOUDY | ambient_wind_light.ogg | 2 min loop | Subtle |
| LIGHT_RAIN | ambient_rain_light.ogg | 4 min loop | Rain on leaves |
| HEAVY_RAIN | ambient_rain_heavy.ogg | 3 min loop | Loud, consistent |
| THUNDERSTORM | ambient_rain_heavy.ogg + thunder_distant.ogg | Loop + random | Thunder 10-30s intervals |
| FOG | ambient_forest_quiet.ogg | 5 min loop | Muffled normal sounds |
| DENSE_FOG | ambient_swamp_night.ogg | 4 min loop | Drips, distant calls |
| LIGHT_SNOW | ambient_snow_wind.ogg | 3 min loop | Gentle |
| BLIZZARD | ambient_blizzard.ogg | 2 min loop | Howling wind |
| SANDSTORM | ambient_sandstorm.ogg | 2 min loop | Hissing sand |
| HEATWAVE | ambient_desert_heat.ogg | 3 min loop | Cicadas, dry wind |
| AURORA | ambient_night_arctic.ogg | 5 min loop | Silent hum + wind |

### 16.2 SFX Triggered Per Weather

| Weather | SFX | Frequency | Notes |
|---|---|---|---|
| THUNDERSTORM | sfx_thunder_01-05.ogg | Random 8-20s | 5 variants, random pick |
| THUNDERSTORM | sfx_lightning_crack.ogg | Per bolt | < 0.1s after flash |
| HEAVY_RAIN | sfx_rain_footstep_splash.ogg | Per player step | Replaces normal footstep |
| BLIZZARD | sfx_wind_gust_01-03.ogg | Random 5-10s | 3 variants |
| SANDSTORM | sfx_sand_hiss.ogg | Continuous | Layered under ambient |
| LIGHT_SNOW | sfx_snow_footstep.ogg | Per player step | Soft crunch |

### 16.3 Music System Integration

```
WeatherMusicController:
    Each weather pushes modifier to MusicManager:
    
    THUNDERSTORM: intensity_modifier = 1.3 (louder, more dramatic)
    BLIZZARD:     tempo_modifier = 0.85 (slower, oppressive)
    AURORA:       switch to music_aurora_ambient track (ethereal)
    CLEAR:        restore base biome music track
    
    Crossfade duration: 4 seconds
```

### 16.4 Biome Sound Variants

Clear weather ambient differs per biome:

| Biome | CLEAR Ambient |
|---|---|
| Forest | ambient_forest_birds.ogg (rich birdsong) |
| Desert | ambient_desert_wind.ogg (dry wind + far-off crows) |
| Ocean | ambient_ocean_waves.ogg (waves, seabirds) |
| Tundra | ambient_tundra_wind.ogg (howling wind) |
| Swamp | ambient_swamp_frogs.ogg (frogs, insects) |
| Cave | ambient_cave_drips.ogg (water drips, echo) |
| Volcano | ambient_volcano_rumble.ogg (low rumble, bubbling) |

### 16.5 Audio Manager Integration

```
WeatherAmbientManager (Client):
    audioSource_ambient: AudioSource   // looping ambient
    audioSource_sfx:     AudioSource   // one-shot SFX
    audioSource_music:   AudioSource   // (shared with MusicManager)
    
    OnWeatherChanged(newWeather, intensity):
        StartCrossfade(audioSource_ambient, GetAmbientClip(newWeather), duration=3s)
        sfxTimer = GetSFXInterval(newWeather)
        
    Update():
        sfxTimer -= deltaTime
        if sfxTimer <= 0:
            PlayRandomSFX(currentWeather)
            sfxTimer = GetSFXInterval(currentWeather)
    
    Mobile: All audio clips stored as OGG, max 3 active AudioSources simultaneously
```

### 16.6 Fishing Audio Modifiers

Weather changes ambient sounds at fishing spots (extends Section 6 fishing modifiers):

| Weather | Fishing Ambient | Extra SFX |
|---|---|---|
| LIGHT_RAIN | Rain on water surface (+ripple sound) | water_splash.ogg more frequent |
| THUNDERSTORM | Thunder + rain → tense atmosphere | sfx_thunder near fishing sound |
| FOG | Muffled, quiet | No bird sounds |
| CLEAR | Birds, light breeze | sfx_fish_jump occasional |
| AURORA | Ethereal hum (Tundra only) | None |

---

*Sections 15-16 added: VFX Architecture and Audio Effects Architecture*
*Weather System document now 95% complete*

---

*Document: WEATHER_SYSTEM.md | Version: 1.0 | Date: 2026-06-14*
*Tích hợp với: DAY_NIGHT_SYSTEM, WORLD_SIMULATION_ARCHITECTURE, WORLD_EVENT_SYSTEM*
