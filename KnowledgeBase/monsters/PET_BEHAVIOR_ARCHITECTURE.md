# PET BEHAVIOR ARCHITECTURE
> Game: Slime MMORPG | Document: Pet AI Design | Date: 2026-06-14
> Scope: Follow AI, pathfinding, flying/ground/giant pets, multiplayer sync, AI LOD

---

## 1. Purpose

Thiết kế hành vi AI cho pet trong Slime MMORPG:
- Pet follow player mượt mà (không stuck, không lag)
- Behavior khác nhau: ground pets, flying pets, giant pets
- Multiplayer: hiển thị pet của player khác (network-synced)
- Phản ứng với Weather và Day/Night
- AI LOD: pet xa camera dùng simplified AI (mobile optimization)
- Không ảnh hưởng đến combat (pet contribution = Power Budget 4%, handled by PetEquipmentDataSO)

---

## 2. Pet Categories & AI Types

### 2.1 Pet Movement Categories

| Category | Count | AI Type | Examples |
|---|---|---|---|
| GROUND_SMALL | ~35 | Pathfinding NavMesh | Common slimes, foxes |
| GROUND_MEDIUM | ~20 | Pathfinding NavMesh | Wolves, bears, golems |
| GROUND_GIANT | ~10 | Simplified follow | Giant turtles, elephants |
| FLYING_SMALL | ~10 | Free-roam orbital | Fairies, sprites |
| FLYING_MEDIUM | ~7 | Free-roam orbital | Dragons, phoenixes |
| AQUATIC | ~2 | Water-surface follow | Sea serpents (near water) |

Total: ~84 creatures (matches creature_db.json)

### 2.2 AI Type Definitions

**Pathfinding NavMesh**: Dùng Unity NavMesh, pathfind quanh obstacles, full terrain awareness
**Free-roam orbital**: Bay xung quanh player theo quỹ đạo elip, không cần NavMesh
**Simplified follow**: Movement đơn giản (lerp position), không pathfind — dùng cho giant pets
**Water-surface**: Chỉ active khi player ở gần water body, hide elsewhere

---

## 3. Follow AI Architecture

### 3.1 PetFollowSystem

```
PetFollowSystem {
    owner:              Transform
    petAgent:           NavMeshAgent (ground) / Transform (flying)
    followDistance:     float (2.5m small, 4m medium, 6m giant)
    catchUpThreshold:   float (8m small, 12m medium, 20m giant)
    teleportThreshold:  float (30m all) -- instant teleport
    
    State:
        IDLE           // owner stopped, pet plays idle anim
        FOLLOW         // owner walking, pet follows
        CATCH_UP       // owner too far, pet runs faster
        TELEPORT       // too far to catch up, instant tp
        IDLE_EXPLORE   // owner AFK > 30s, pet wanders nearby
        REACT          // weather/event reaction (temporary)
}
```

### 3.2 Follow Logic (Server ticks, Client predicts)

```
OnTick() every 0.5 seconds:
    dist = distance(pet.pos, owner.pos)
    
    if dist > teleportThreshold:
        TeleportToOwner()
        return
    
    if dist > catchUpThreshold:
        SetState(CATCH_UP)
        agent.speed = baseSpeed × 1.8
        return
    
    if dist > followDistance:
        SetState(FOLLOW)
        agent.speed = baseSpeed × matchOwnerSpeed()
        return
    
    if dist <= followDistance:
        SetState(IDLE)
        if ownerAFKDuration > 30s:
            SetState(IDLE_EXPLORE)
```

### 3.3 Catch-Up Logic Chi Tiết

Khi pet ở trạng thái CATCH_UP:
1. Pet chạy nhanh hơn 1.8× speed bình thường
2. Nếu path quá phức tạp (nhiều chướng ngại vật) và dist > 20m → teleport ngay
3. Khi đến gần (dist < followDistance + 2m) → return về FOLLOW
4. Cooldown teleport: 5 giây sau lần teleport trước

### 3.4 Idle Exploration (AFK Pet)

Khi owner AFK > 30 giây:
- Pet wander trong bán kính 5m xung quanh owner
- Tốc độ wander: 30% speed bình thường
- Có animation đặc biệt (sniff ground, look around)
- Nếu owner di chuyển → ngay lập tức return về FOLLOW

---

## 4. Flying Pet AI (Orbital System)

### 4.1 Orbital Parameters

```
FlyingPetOrbital {
    orbitRadius:     float  // 3m small, 5m medium
    orbitHeight:     float  // +2m small, +3m medium above owner head
    orbitSpeed:      float  // angular velocity (degrees/sec)
    orbitEccentricity: float // 0=circle, 0.3=ellipse
    phaseOffset:     float  // random start angle (unique per pet)
    bobAmplitude:    float  // vertical oscillation (0.3-0.8m)
    bobFrequency:    float  // oscillation speed
}
```

### 4.2 Flying Follow Behavior

Flying pets không dùng NavMesh:
1. Target position = owner.position + orbitOffset
2. Lerp current position → target (smooth factor 0.1/frame)
3. Orbit around owner khi IDLE: angular position += orbitSpeed × deltaTime
4. Khi CATCH_UP: lerp nhanh hơn, pause orbit
5. Không bị block bởi terrain (bay qua mọi thứ)

### 4.3 Flying Pet Collision Avoidance

Mặc dù bay qua terrain, vẫn tránh collision với:
- Kiến trúc cao (cầu, tháp): ray cast upward, adjust height
- Player khác (tránh overlap): simple separation force
- Không check obstacle phức tạp (performance)

---

## 5. Giant Pet AI (Simplified)

Giant pets (10 loại) có kích thước lớn → NavMesh phức tạp hóa:
- Không dùng NavMesh pathfinding
- Dùng **direct position lerp** với collision check đơn giản
- Follow distance lớn hơn (6m) → ít khi phải di chuyển
- Teleport threshold thấp hơn (15m thay vì 30m) — giant pets không nên xuất hiện xa
- Animation blend tree đơn giản hơn (4 states vs 8)
- Không có Idle Explore behavior

---

## 6. Multiplayer Pet Sync

### 6.1 LOD-Based Sync Strategy

| Distance từ Camera | Update Rate | Data Sent |
|---|---|---|
| < 20m | 10Hz | Full position + animation state |
| 20-50m | 5Hz | Position only |
| 50-100m | 2Hz | Position only (lerp on client) |
| > 100m | 0.5Hz | Last known position (static) |
| > 200m | 0Hz | Hidden (culled) |

### 6.2 Pet State Packet

```
// S2C — Server to Client (world state broadcast)
PetStateUpdate = 0x0620  // Dùng range 0x0600 (Pet đã có)
PetTeleport    = 0x0621
PetEmote       = 0x0622  // Visual only

PetStateUpdate payload:
    ownerId:        uint
    petId:          ushort
    position:       Vector3 (12 bytes)
    rotation:       byte (quantized yaw, 0-255 = 0-360°)
    animState:      byte (0=IDLE, 1=FOLLOW, 2=CATCHUP, 3=EXPLORE)
    currentWeather: byte (for react behavior)
```

### 6.3 Bandwidth Budget Per Player

Mỗi player có thể thấy tối đa:
- Party members: 5 pets × 10Hz = 50 updates/s
- Nearby players (<20m): max 10 pets × 10Hz = 100 updates/s
- Medium range (20-50m): max 20 pets × 5Hz = 100 updates/s
- **Total: ~250 pet position updates/second received**

Packet size: PetStateUpdate ≈ 20 bytes
Bandwidth: 250 × 20 = 5,000 bytes/s = 5 KB/s per player (acceptable)

---

## 7. Weather Reaction System

### 7.1 Pet Weather Behaviors

| Weather | Ground Pet | Flying Pet | Giant Pet |
|---|---|---|---|
| RAIN | Seek shelter (near trees/buildings) | Fly lower, faster bob | No change |
| THUNDERSTORM | Huddle near owner, scared anim | Hide behind owner | Slow down |
| BLIZZARD | Shake animation, closer follow | Land if flying | No change |
| HEATWAVE | Panting animation, seek shade | Fly slower | No change |
| AURORA | Excited animation, look up | Circle widely | Look up |
| CLEAR | Normal/happy idle variations | Normal orbit | Normal |

### 7.2 Reaction State Machine

```
WeatherReactState:
    duration: 10-30 giây (varies by weather intensity)
    animation: override current animation
    positionOffset: move closer/further from owner
    behaviorFlag: SEEK_SHELTER | HUDDLE | EXCITED | PANTING

OnWeatherChange(newWeather):
    if newWeather matches pet.reactionTable:
        SetState(REACT, duration=20s, behavior=HUDDLE)
    else:
        ClearReaction()
```

---

## 8. Day/Night Reactions

### 8.1 Nocturnal vs Diurnal Pets

| Behavior Type | Pets | Day | Night |
|---|---|---|---|
| Diurnal | Foxes, birds (~30%) | Active, playful | Drowsy animation |
| Nocturnal | Owls, bats (~15%) | Drowsy | Alert, eyes glow |
| Neutral | Slimes, golems (~55%) | Normal | Normal |

### 8.2 Night Visual Effects

Nocturnal pets ban đêm:
- Eye glow particle effect (2 particles, minimal cost)
- Increased idle animation energy
- Unique sounds (nocturnal calls)

FULL_MOON bonus:
- All pets get "excited" behavior override
- Rare: Pet does a "howl" or "sing" emote (random, 5% chance per minute)

---

## 9. Pet AI LOD System (Mobile Optimization)

### 9.1 AI LOD Levels

| LOD | Distance | Update Hz | Features |
|---|---|---|---|
| LOD0 | < 15m | 30Hz | Full AI, all animations, weather react |
| LOD1 | 15-30m | 10Hz | Follow only, 3 animations |
| LOD2 | 30-60m | 5Hz | Position update only, idle anim |
| LOD3 | 60-150m | 1Hz | Static position, simplified mesh |
| CULLED | > 150m | 0Hz | Invisible |

### 9.2 Mobile-Specific Limits

- Max visible pets on screen: 20 (Low device), 40 (Mid), 100 (High)
- Animation complexity: Full (High), 50% blend tree (Mid), 2 states only (Low)
- Shadow casting: Only LOD0 pets within 10m
- NavMesh update interval: 0.5s (không update mỗi frame)

---

## 10. Pet Emote System

### 10.1 Emote Types

| Trigger | Emote | Visual |
|---|---|---|
| Owner levels up | CELEBRATE | Jump + sparkles |
| Owner dies | SAD | Ears down, head shake |
| Owner catches creature | EXCITED | Spin |
| Weather = AURORA | GAZE_UP | Look at sky |
| Owner AFK 5 min | SLEEP | Lie down, Zzz particles |
| Owner enters combat | ALERT | Ears perked |
| Owner wins boss | CHEER | Jump repeatedly |

### 10.2 Emote Sync (C2S)

Player có thể trigger manual emote:
```
C2S_PetEmote = 0x0623
    emoteId: byte
    petSlot: byte (0-2, player có thể deploy 3 pets?)
```

---

## 11. Save Data

Pet behavior không cần save riêng — pet configuration lưu trong existing PlayerSaveData:

```csharp
// Đã có trong PlayerSaveData V5
PetData {
    equippedPetId:       string
    petStats:            Dictionary<string, float>
    petCustomization:    PetCustomData
}

// V6 thêm (từ SAVE_DATA_EXPANSION_REPORT):
// Không cần thêm gì cho behavior — behavior là runtime-only
```

Pet placement history (giờ đặt pet trong world) không cần lưu.

---

## 12. Database

Không cần database table cho pet behavior (runtime state).

Pet ownership và stats lưu trong existing `pets` table (đã có trong 28 tables).

Mới cần: Pet emote history cho analytics (optional):
```sql
-- Trong analytics_events table (đã có):
{ "event": "pet_emote", "emote_id": "CELEBRATE", "trigger": "level_up" }
```

---

## 13. Network Packets

Sử dụng range 0x0600 (Pet — đã có ~5 packets):

```
// S2C
PetStateUpdate  = 0x0620   // Position + anim state (LOD-based)
PetTeleport     = 0x0621   // Instant teleport
PetEmote        = 0x0622   // Visual emote broadcast
PetWeatherReact = 0x0623   // Weather reaction override

// C2S
PetEmoteRequest = 0x0670   // Player triggers emote manually
```

---

## 14. Architecture Diagram

```
[PetSystem Manager (Server)]
    ├── PetFollowSystem × N (one per active pet)
    │     ├── GroundPetAI (NavMesh)
    │     ├── FlyingPetAI (Orbital)
    │     └── GiantPetAI (Lerp)
    ├── WeatherReactionBridge ← WeatherScheduler
    ├── DayNightReactionBridge ← WorldTimeService
    └── PetNetworkBroadcaster (LOD-based)
          └── S2C: PetStateUpdate × players in range

[Client PetRenderer]
    ├── PetMeshRenderer (LOD0-3)
    ├── PetAnimator
    │     └── AnimatorController (Weather/DayNight blend)
    ├── PetParticleEffects (Eye glow, Celebrate, Sleep)
    └── PetSoundManager
```

---

## 15. Lost Pet Recovery

### 15.1 Stuck Detection

Pet NavMesh AI có thể bị stuck (ví dụ: terrain gap, phức tạp geometry):

```
StuckDetector:
    lastPosition:   Vector3
    stuckTimer:     float = 0
    
    OnTick():
        if Vector3.Distance(pet.position, lastPosition) < 0.1m:
            stuckTimer += tickInterval
        else:
            stuckTimer = 0
            lastPosition = pet.position
        
        if stuckTimer > 3.0s:
            TriggerRecovery()
```

### 15.2 Recovery Priority Chain

```
TriggerRecovery():
    1. NavMesh.SamplePosition(ownerPos, radius=5m):
       → If valid NavMesh nearby: Warp to nearest valid point
    2. If no valid NavMesh (out of bounds):
       → TeleportToOwner() immediately (không cần wait for teleportThreshold)
    3. If owner is in dungeon (DungeonContext = true):
       → PetSummon: pet teleports to entrance waypoint
    4. Reset stuckTimer = 0
```

### 15.3 Dungeon Recovery Waypoints

Mỗi dungeon có `PetWaypoints[]` — array of safe NavMesh positions:
- Entrance waypoint (x1)
- Boss room waypoint (x1)
- Checkpoint waypoints (xN)

Khi pet stuck trong dungeon → teleport to nearest PetWaypoint.

---

## 16. Dungeon Rules

### 16.1 Pet Behavior In Dungeons

| Rule | Normal Dungeon | Raid | World Boss |
|---|---|---|---|
| Pet visible | ✅ Yes (owner only) | ✅ Yes (party only) | ✅ Yes (LOD2+) |
| Other players see pet | ❌ No (dungeon private) | ✅ Party members | ✅ Yes (LOD by distance) |
| NavMesh type | Dungeon NavMesh | Dungeon NavMesh | Open-world |
| Follow distance | Standard | Closer (1.5m — tight spaces) | Standard |
| Teleport threshold | Reduced (15m — smaller rooms) | Reduced (15m) | Standard (30m) |
| Giant pets | Scaled down 50% or hidden | Hidden | Standard |
| Aquatic pets | Hidden (no water in dungeon) | Hidden | Varies |

### 16.2 Boss Fight Pet Rules

Khi owner tham chiến Boss:
1. Pet moves to safe zone behind owner (10m behind, không va vào boss hitbox)
2. Pet không attack (không có active combat AI)
3. Pet follows owner movement (không teleport vào combat area)
4. Nếu pet bị AoE → visual hit effect only, pet không die
5. Pet ngủ/wait animation nếu owner bị giam (stun > 5s)

### 16.3 Dungeon Exit Recovery

Khi owner exit dungeon → pet auto-teleport to world exit point với owner.
No animation — instant appearance outside dungeon entrance.

---

## 17. Housing Rules (Pet in Housing Plot)

### 17.1 Pet Behavior on Housing Plot

Khi owner vào housing plot:
- Pet behavior chuyển từ FOLLOW → HOUSING_EXPLORE mode
- Housing Explore radius: plot boundary (5×5 đến 12×12 tùy level)
- Pet wanders freely trong plot (không bị hạn chế follow distance)
- Pet tương tác với furniture (sniff, lie near, play around)

### 17.2 Pet × Furniture Interactions

| Furniture Type | Pet Reaction | Animation |
|---|---|---|
| Herb Garden | Sniff around | Sniff, dig gently |
| Pet Stable | Rest point | Lie down nearby |
| Fishing Pond | Watch fish | Sit, head-tracking |
| Crafting Station | Observe owner | Watch attentively |
| Trophy Display | Curious sniff | Look up at trophy |
| Bed/Hammock | Attempt to climb | Jump, settle |

### 17.3 Pet Stable (Plot Level 7+)

```
PetStable {
    capacity:       int (2 initially, upgradable to 5)
    stabledPets:    string[]  // petId list
    
    StablePet(petId):
        Remove from active follow
        Pet enters "stable" idle animation (resting)
        Owner can have active + stabled pets simultaneously
    
    UnstablePet(petId):
        Pet returns to FOLLOW behavior
        Brief "wake up" animation
}
```

- Stabled pets tự bổ sung Loyalty +1/hour (vs active pet +3/hour)
- Max active pets simultaneously: 1 (expansion: 3 khi có Pet Stable upgrade)

### 17.4 Visitor + Pet

Khi visitor vào housing của owner:
- Pet chào visitor (GREET animation, tail wag)
- Pet có thể được visitor pet (tap interaction → happy animation)
- Pet không follow visitor (loyal to owner only)

---

## 18. NPC Interaction

### 18.1 Pet Reaction to NPC Types

| NPC Type | Pet Reaction | Trigger |
|---|---|---|
| Quest NPC | Attentive, sit beside owner | Within 5m |
| Merchant NPC | Curious sniff at items | Owner talks to merchant |
| Guard NPC | Subdued, non-aggressive | Within 10m |
| Enemy NPC (invasion) | Aggressive bark/growl | Within 20m |
| Animal NPC (farm) | Playful, approach cautiously | Within 10m |
| Dungeon Sentinel | Alert, closer to owner | Within 15m |

### 18.2 Pet-NPC Proximity Rules

```
OnNPCProximityDetected(npcType, distance):
    if npcType == ENEMY_NPC:
        SetBehavior(ALERT_AGGRESSIVE)
        MoveCloserToOwner(1m)
    elif npcType == QUEST_NPC AND owner.isTalking:
        SetBehavior(ATTENTIVE_SIT)
    elif npcType == MERCHANT AND owner.isShoppingUI:
        SetBehavior(CURIOUS_SNIFF)
    elif distance < 3m AND npcType == FRIENDLY:
        PlayEmote(CURIOUS)
```

### 18.3 NPC Acknowledgment

Một số NPC đặc biệt có dialog khác nhau dựa trên pet:
- "Ồ, bạn có [pet_name]! Tôi thích loài đó!"
- Guard NPC: "Hãy kiểm soát thú cưng của bạn tại đây."
- Animal trainer NPC: Bonus dialogue khi có pet rare

*Implementation:* NPCDialogManager.cs kiểm tra `playerSave.petData.equippedPetId` → chọn dialog branch.

---

## 19. Future Expansion

- Pet combat assist: Pet có thể buff owner trong combat (passive, no active skills)
- Pet battle (PvE mini): Pet vs Pet combat system
- Pet breeding offspring behavior: Offspring có hybrid behaviors của 2 parents
- Pet patrol AI: Owner in dungeon → pet guard entrance
- Pet mood system: Loyalty + happiness affects behavior (high happiness = more emotes)
- Pet housing interaction expanded: Seasonal furniture triggers special pet behaviors

---

*Document: PET_BEHAVIOR_ARCHITECTURE.md | Version: 1.1 | Date: 2026-06-14*
*Updated: + Lost Pet Recovery (Sec 15), Dungeon Rules (Sec 16), Housing Rules (Sec 17), NPC Interaction (Sec 18)*
*Tích hợp với: WEATHER_SYSTEM, DAY_NIGHT_SYSTEM, WORLD_SIMULATION_ARCHITECTURE, systems/07_CREATURE_SYSTEM, HOUSING_EXPANSION*
