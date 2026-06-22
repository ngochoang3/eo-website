# SYSTEM 14 — Dungeon Architecture
> Status: MISSING → thiết kế từ đầu
> Ngày: 2026-06-13

---

# 1. Purpose

Dungeon Architecture định nghĩa **toàn bộ framework** cho instanced content: Normal Dungeon, Hard Dungeon, Elite Dungeon, Raid, Tower of Ascension, và World Boss. Bao gồm room layout, encounter design, loot rules, timer, và progression.

---

# 2. Design Philosophy

- **Instanced:** Mỗi party có instance riêng — không share enemy với người khác
- **Biome-themed:** Mỗi biome có 3 dungeons ở 3 độ khó
- **Time-gated:** Daily/Weekly clear limit để prevent over-farming
- **Element-sensitive:** Biome dungeon có element weakness → khuyến khích preparation
- **Personal loot:** Không cạnh tranh drop với party member
- **Boss phase-based:** Mỗi boss có phase từ boss_mechanics_db.json

---

# 3. Core Loop

```
[Player at biome entrance NPC]
        │
        ▼
[Select dungeon + difficulty]
        │
        ▼
[Form party (1-4 players) OR solo]
        │
        ▼
[Server creates instance → enter]
        │
        ▼
[Room 1: Clear monsters → Room 2: Elite → ... → Final Room: Boss]
        │
        ▼
[Boss kill → Personal loot roll (per player)]
        │
        ▼
[Clear bonus: time bonus, no-death bonus]
        │
        ▼
[Instance destroyed after all players exit or 30 min timeout]
```

---

# 4. Progression Loop

| Dungeon Type | Unlock Condition | Party Size | Daily Limit |
|---|---|---|---|
| Normal | Biome level_min | Solo-4 | 5 |
| Hard | Clear Normal 3× | Solo-4 | 3 |
| Elite | Clear Hard 5× | 2-4 | 1 |
| Raid | Level ≥ 700 + Elite clear | 8-24 | Weekly 1 |
| Tower | Level ≥ 500 | Solo | Unlimited |
| World Boss | Public | Unlimited | Daily 1 |

---

# 5. Data Architecture

## 5.1 Entity

```
DungeonDataSO
├── id: string                   ("dun_biome01_hard")
├── name: string
├── dungeon_type: string         ("Normal","Hard","Elite","Raid","Tower","WorldBoss")
├── biome: int
├── level_req: int
├── min_party: int
├── max_party: int
├── time_limit_sec: int          (1800 = 30 min)
├── daily_limit: int
├── element_weakness: string     (hint for players)
├── room_count: int              (rooms before boss)
├── boss_id: string              (ref boss_db)
├── drop_table_id: string        (ref drop_tables)
├── clear_reward: ClearReward
│   ├── gold: int
│   ├── exp: int
│   └── bonus_item: string       (optional)
├── time_bonus_threshold_sec: int
├── no_death_bonus_item: string
└── recommended_power_pct: float (guide for players)

RoomDataSO
├── room_id: string
├── dungeon_id: string
├── room_index: int
├── room_type: string            ("Normal","Elite","Puzzle","Rest","Boss")
├── monster_spawns: MonsterSpawn[]
│   ├── monster_id: string
│   ├── count: int
│   ├── position_preset: string
│   └── is_elite_variant: bool
├── trigger_condition: string    ("all_dead","interact","timer")
├── loot_table_id: string        (room-specific loot, optional)
└── env_hazard: string           ("fire_floor","ice_floor","wind_gust","none")
```

## 5.2 Database Tables

```sql
CREATE TABLE dungeon_data (
    id                      VARCHAR(64) PRIMARY KEY,
    name                    VARCHAR(64) NOT NULL,
    dungeon_type            VARCHAR(16) NOT NULL,
    biome                   TINYINT NOT NULL,
    level_req               SMALLINT NOT NULL,
    min_party               TINYINT NOT NULL DEFAULT 1,
    max_party               TINYINT NOT NULL DEFAULT 4,
    time_limit_sec          INT NOT NULL DEFAULT 1800,
    daily_limit             TINYINT NOT NULL DEFAULT 3,
    element_weakness        VARCHAR(16),
    room_count              TINYINT NOT NULL,
    boss_id                 VARCHAR(32) REFERENCES boss_data(id),
    drop_table_id           VARCHAR(64),
    clear_reward_gold       INT NOT NULL DEFAULT 0,
    clear_reward_exp        INT NOT NULL DEFAULT 0,
    time_bonus_threshold    INT NOT NULL DEFAULT 600,
    recommended_power_pct   FLOAT NOT NULL DEFAULT 0
);

CREATE TABLE dungeon_room (
    room_id                 VARCHAR(64) PRIMARY KEY,
    dungeon_id              VARCHAR(64) REFERENCES dungeon_data(id),
    room_index              TINYINT NOT NULL,
    room_type               VARCHAR(16) NOT NULL,
    trigger_condition       VARCHAR(32) NOT NULL DEFAULT 'all_dead',
    env_hazard              VARCHAR(32) NOT NULL DEFAULT 'none',
    loot_table_id           VARCHAR(64)
);

CREATE TABLE dungeon_monster_spawn (
    spawn_id                BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_id                 VARCHAR(64) REFERENCES dungeon_room(room_id),
    monster_id              VARCHAR(32) REFERENCES monster_data(id),
    count                   TINYINT NOT NULL DEFAULT 1,
    position_preset         VARCHAR(32) NOT NULL DEFAULT 'random',
    is_elite_variant        TINYINT NOT NULL DEFAULT 0
);

CREATE TABLE player_dungeon_progress (
    player_id               BIGINT NOT NULL,
    dungeon_id              VARCHAR(64) NOT NULL,
    clear_date              DATE NOT NULL,
    clear_count             TINYINT NOT NULL DEFAULT 0,
    best_time_sec           INT,
    first_clear_at          DATETIME,
    PRIMARY KEY (player_id, dungeon_id, clear_date)
);

CREATE TABLE dungeon_instance (
    instance_id             VARCHAR(64) PRIMARY KEY,
    dungeon_id              VARCHAR(64) NOT NULL,
    party_leader_id         BIGINT NOT NULL,
    player_ids              VARCHAR(256) NOT NULL,  -- JSON array
    created_at              DATETIME NOT NULL,
    expires_at              DATETIME NOT NULL,
    current_room            TINYINT NOT NULL DEFAULT 0,
    status                  VARCHAR(16) NOT NULL DEFAULT 'active'
);
```

## 5.3 ID Rules

Dungeon: `dun_{biome:02d}_{difficulty_prefix}`
- `dun_01_nor` — Biome 1 Normal
- `dun_03_hrd` — Biome 3 Hard
- `dun_12_elt` — Biome 12 Elite
- `raid_12_a` — Biome 12 Raid tier A
- `tower_floor_{N:03d}` — Tower floor N
- `wb_biome_{N:02d}` — World Boss biome N

## 5.4 CSV Schema

`dungeon_db.csv`:
```
id,name,dungeon_type,biome,level_req,min_party,max_party,time_limit_sec,daily_limit,element_weakness,room_count,boss_id,drop_table_id,clear_reward_gold,clear_reward_exp,time_bonus_threshold,recommended_power_pct
dun_01_nor,Verdant Meadow Cave,Normal,1,1,1,4,1800,5,Fire,3,boss_001,drop_dun_01_nor,1000,5000,600,0.1
dun_01_hrd,Verdant Meadow Cave - Hard,Hard,1,10,1,4,1200,3,Fire,5,boss_001_hard,drop_dun_01_hrd,5000,20000,480,0.3
dun_01_elt,Verdant Meadow Cave - Elite,Elite,1,50,2,4,900,1,Fire,7,boss_001_elite,drop_dun_01_elt,20000,80000,360,0.5
dun_03_nor,Volcanic Ridge Cavern,Normal,3,191,1,4,1800,5,Water,3,boss_003,drop_dun_03_nor,5000,25000,600,0.2
raid_12_a,Shadow Vale Raid,Raid,12,700,8,24,3600,1,Light,10,boss_012_raid,drop_raid_12_a,50000,200000,2400,0.7
tower_floor_001,Tower Floor 1,Tower,0,1,1,1,0,0,,1,boss_tow_001,drop_tower_001,500,1000,0,0.0
wb_biome_03,Volcanic World Boss,WorldBoss,3,100,1,999,3600,1,Water,0,boss_003_world,drop_wb_03,10000,50000,0,0.0
```

## 5.5 JSON Schema

```json
{
  "name": "dungeon_db",
  "count": 147,
  "dungeons": [
    {
      "id": "dun_01_hrd",
      "name": "Verdant Meadow Cave - Hard",
      "dungeon_type": "Hard",
      "biome": 1,
      "level_req": 10,
      "min_party": 1,
      "max_party": 4,
      "time_limit_sec": 1200,
      "daily_limit": 3,
      "element_weakness": "Fire",
      "room_count": 5,
      "boss_id": "boss_001_hard",
      "drop_table_id": "drop_dun_01_hrd",
      "clear_reward": {"gold": 5000, "exp": 20000, "bonus_item": ""},
      "time_bonus_threshold_sec": 480,
      "no_death_bonus_item": "relic_shard_verdant",
      "recommended_power_pct": 0.3
    }
  ]
}
```

---

# 6. Formula Architecture

## 6.1 Difficulty Scaling

```
MonsterHP(difficulty, base_hp) =
  Normal: base_hp × 1.0
  Hard:   base_hp × 2.5
  Elite:  base_hp × 5.0
  Raid:   base_hp × 20.0
  WorldBoss: base_hp × 100.0 (shared HP, scales with player count)

MonsterATK(difficulty, base_atk) =
  Normal: base_atk × 1.0
  Hard:   base_atk × 1.5
  Elite:  base_atk × 2.5
  Raid:   base_atk × 4.0
```

## 6.2 World Boss HP Scaling

```
WorldBossHP = base_hp × 100 × sqrt(active_player_count)
  → 100 players: × 100 × 10 = × 1000
  → 1000 players: × 100 × 31.6 ≈ × 3160
  → Ensures fight takes ~15-20 min regardless of participation
```

## 6.3 Clear Rewards

```
BaseReward = dungeon.clear_reward (gold + EXP)

TimeBonusMultiplier:
  clear_time ≤ time_bonus_threshold × 0.6: × 1.5
  clear_time ≤ time_bonus_threshold × 0.8: × 1.25
  clear_time ≤ time_bonus_threshold:       × 1.1
  else: × 1.0

NoDeathBonus:
  0 deaths in party → bonus_item granted (1 per player)

FinalReward = BaseReward × TimeBonusMultiplier + NoDeathBonus
```

## 6.4 Instance Timeout

```
InstanceExpiry = created_at + time_limit_sec + 300  (5 min grace)
if Now() > InstanceExpiry:
  server.CloseInstance(instance_id, reason: "timeout")
  partial loot NOT granted
  players teleported to biome entrance
```

## 6.5 Contribution Score (Raid loot)

```
ContributionScore(player) = damage_dealt / total_raid_damage
MinScore = 0.05  (5% floor — prevent contribution exploit)
LootChance(player) = max(ContributionScore, MinScore)
```

---

# 7. Power Budget

Dungeon rewards equipment/relics/artifacts that CARRY power budget contributions. Dungeons themselves không add power — chúng là delivery mechanism.

---

# 8. Economy Impact

| Dungeon Type | Gold Source | Gold Sink |
|---|---|---|
| Normal | +1,000-5,000 | Repair cost after death |
| Hard | +5,000-20,000 | Consumable use |
| Elite | +20,000-80,000 | Party buff NPC fee |
| Raid | +50,000-200,000 | Guild consumables |
| World Boss | +10,000-50,000 | Competition buffs |

**Daily limit** prevents over-farming.

---

# 9. Anti Power Creep

- Elite drop capped to biome's power budget appropriate items
- Raid exclusive: cosmetic + rare mats, not exclusive stats
- World Boss: no exclusive power gear (all farmable via normal means too)

---

# 10. Progression Table

| Level | Dungeon Access |
|---|---|
| 1 | Biome 1 Normal |
| 10 | Biome 1 Hard |
| 50 | Biome 1 Elite |
| 96-190 | Biome 2 Normal→Elite |
| 500 | Tower of Ascension floor 1 |
| 700 | Raid access |
| 1800+ | Biome 20-21 content |

**Total dungeons:** 21 biomes × 3 difficulties + Raid per biome + Tower 100 floors + World Boss 21 = ~147 dungeons

---

# 11. Reward Structure

| Clear Type | Reward |
|---|---|
| First clear Normal | Achievement + title per biome |
| Daily clear | Gold + EXP |
| Time bonus | Extra loot roll |
| No-death | Bonus rare material |
| First Raid clear | Exclusive title |
| Tower Floor 50 | Mid-game cosmetic |
| Tower Floor 100 | End-game cosmetic + title |
| World Boss participation | World Boss currency |

---

# 12. RNG Design

```
Monster spawn: deterministic from instance_seed (RNG seeded per instance)
Loot: personal loot, XorShift64 per player per drop slot
Boss phase trigger: HP threshold (deterministic)
```

---

# 13. Anti Bad Luck System

Dungeon uses Pity System (System 11):
- Boss drop pity: `pity_type = "boss_drop_rare"` / `"boss_drop_legend"`
- Daily limit acts as soft floor (1 guaranteed attempt per day)

---

# 14. Collection Integration

"Dungeon Compendium" — tracks clear status per dungeon:
- First clear timestamp
- Best clear time
- Total runs
- No-death clears count

---

# 15. Achievement Integration

| Achievement | Condition |
|---|---|
| First Dungeon | Complete any dungeon |
| Speed Runner | Clear any dungeon under time bonus threshold |
| Deathless | Clear any Elite with 0 deaths |
| Raid Ready | Complete first Raid |
| Tower Climber | Reach Tower Floor 50 |
| World Contender | Participate in World Boss |

---

# 16. Season Integration

Season dungeons: special instance available during season (3 rooms, 1 season boss).
Season loot table injected into all biome boss tables during season.

---

# 17. PvE Integration

Dungeon IS PvE. Specific integration:
- Creature companion abilities work in dungeons (Phoenix revive, etc.)
- Element weakness shown as dungeon hint
- Housing: Personal Forge repair without city trip

---

# 18. PvP Integration

Dungeons là PvE only. No PvP in instances. Exception: Cross-server "dungeon race" (fastest clear time ranking per week) — no direct combat.

---

# 19. Social Integration

Party: 1-4 players, cross-server party allowed.
Guild: Guild Raid (8-24 members, guild-exclusive instance).
Mentor: Mentor can enter apprentice's dungeon at any level.

---

# 20. Technical Architecture

```
DungeonDataSO : ScriptableObject
├── string id, name, dungeonType
├── int biome, levelReq, minParty, maxParty
├── int timeLimitSec, dailyLimit, roomCount
├── string bossId, dropTableId, elementWeakness
└── ClearReward clearReward

RoomDataSO : ScriptableObject
├── string roomId, dungeonId
├── int roomIndex
├── string roomType, triggerCondition, envHazard
└── MonsterSpawn[] spawns

DungeonManager : MonoBehaviour (server-side authority)
├── CreateInstance(dungeonId, partyIds) : string  (instanceId)
├── AdvanceRoom(instanceId) : RoomData
├── CheckClearCondition(instanceId) : bool
├── AwardLoot(instanceId) : void
├── CloseInstance(instanceId, reason) : void
└── GetDailyProgress(playerId, dungeonId) : int

InstanceTimer : MonoBehaviour
├── StartTimer(seconds)
├── OnTimeout → DungeonManager.CloseInstance()
└── TimeRemaining : float
```

---

# 21. Save Data Architecture

`player_dungeon_progress` table (server DB), không trong PlayerSaveData JSON.
CollectionData tracks first-clear via `bitflags_dungeon_cleared: long[]` (add to schema).

---

# 22. Network Architecture

Instance create: POST /api/v1/dungeon/create → server creates instance, returns instance_id.
Room advance: server pushes RoomData to all party members.
Loot: server calculates personal loot per player, pushes LootResult.
Instance state: WebSocket channel per instance for real-time sync.

---

# 23. Security

| Threat | Prevention |
|---|---|
| Daily limit bypass | Server tracks in player_dungeon_progress |
| Fake boss kill | Server validates HP = 0 before loot award |
| Speed hack in timer | Server validates: clear_time ≥ minimum_viable_time |
| Duplicate loot | Instance ID unique per run; loot awarded once |

---

# 24. LiveOps Hooks

```
event.dungeon_exp_multiplier = 2.0       (double EXP weekend)
event.dungeon_drop_rate_boost = 1.5
event.season_dungeon_available = true
remote_config.daily_normal_limit = 5
remote_config.daily_elite_limit = 1
```

---

# 25. Content Pipeline

```
Google Sheet "Dungeon DB"
  → dungeon_db.csv
  → gen_dungeon_db.py (147 dungeons)
  → dungeon_db.json + room_spawns.json
  → DungeonDataSO[] + RoomDataSO[] (Editor import)

Tower:
  → tower_floor_config.csv (100 floors)
  → gen_tower_floors.py
  → tower_db.json
```

---

# 26. Future Expansion

- Mythic difficulty (Year 2): 4th difficulty tier, weekly lockout
- Cross-server Raid (Year 2): up to 48 players
- Dungeon modifier system: weekly affixes (fire week, ice week)
- Player-designed dungeon (Year 3): social content

---

# 27. Production Risks

| Rủi ro | Mức |
|---|---|
| Instance server cost scale | HIGH |
| 147 dungeons too much content to QA | HIGH |
| World Boss lag với 1000+ players | CRITICAL |

---

# 28. Mitigation Plan

| Rủi ro | Giải pháp |
|---|---|
| Instance cost | Auto-shutdown idle instances; share server pool |
| QA scope | Release 7 biomes × 3 diff at launch; add biomes per patch |
| World Boss lag | World Boss runs on dedicated server; HP packets batched 1/sec |

---

# 29. Unity Implementation Plan

```
Assets/script/SlimeMMO/Dungeon/
├── DungeonDataSO.cs
├── RoomDataSO.cs
├── DungeonManager.cs
├── InstanceTimer.cs
├── RoomController.cs
├── BossController.cs       (ref boss_mechanics_db.json for phases)
└── SlimeMMO.Dungeon.asmdef

generators/
├── gen_dungeon_db.py
└── gen_tower_floors.py
```

---

# 30. Final Verdict

**Status: MISSING → design complete**

Dungeon là primary PvE gameplay loop. Critical for Alpha. Implement sau NPC Architecture (cần NPC để enter dungeon). Priority: Normal/Hard dungeons for first 7 biomes → Alpha.
