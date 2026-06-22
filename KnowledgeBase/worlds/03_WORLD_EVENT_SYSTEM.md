# WORLD EVENT SYSTEM — Design Document v1.0
**Slime MMORPG | Principal Design Document | Production-Ready**
**Path:** `_design/expansion/03_WORLD_EVENT_SYSTEM.md`
**Status:** DRAFT → REVIEW → APPROVED
**Last Updated:** 2026-06-13
**Author:** Principal MMORPG System Architect

---

## TABLE OF CONTENTS
1. [Purpose](#1-purpose)
2. [Design Goals](#2-design-goals)
3. [Gameplay Flow](#3-gameplay-flow)
4. [Economy Integration](#4-economy-integration)
5. [Progression Integration](#5-progression-integration)
6. [Multiplayer Integration](#6-multiplayer-integration)
7. [Server Authority Rules](#7-server-authority-rules)
8. [Anti-Exploit Rules](#8-anti-exploit-rules)
9. [Database Structure](#9-database-structure)
10. [Save Data Structure](#10-save-data-structure)
11. [Network Requirements](#11-network-requirements)
12. [Edge Cases](#12-edge-cases)
13. [Future Scalability](#13-future-scalability)

---

## 1. PURPOSE

World Event System tạo ra các sự kiện động, theo lịch, và theo mùa trong thế giới MMORPG, nhằm:

- **Tăng engagement hàng ngày/tuần:** Player có lý do login theo giờ cụ thể (World Boss 20:00, Gold Rush 18:00)
- **Tạo cảm giác thế giới sống động:** Biome không tĩnh lặng — invasion ngẫu nhiên, dynamic events kích hoạt theo player count
- **Khuyến khích hợp tác:** World Boss, Invasion Events yêu cầu nhiều player cùng tham gia
- **Tạo vòng lặp kinh tế lành mạnh:** Event tokens là currency riêng biệt, tránh inflation gold
- **Liên kết với hệ thống hiện có:** TerritoryWarManager, BestiaryManager, ReputationManager, SeasonManager — không tái tạo, chỉ mở rộng

World Event System là **lớp trên cùng** của content loop, hoạt động song song với Quest, Dungeon, Territory War mà không thay thế chúng.

---

## 2. DESIGN GOALS

### 2.1 Primary Goals

| # | Goal | Metric để đo |
|---|------|-------------|
| G1 | Player có sự kiện để tham gia mọi giờ trong ngày | Min 1 event active mọi thời điểm trên mỗi active biome |
| G2 | Solo player không bị loại khỏi reward | Min reward floor = 10% của max reward |
| G3 | Event không tạo power creep | Event rewards: tokens + cosmetics + EXP, KHÔNG có stat gear vượt normal drop |
| G4 | Server không quá tải | Max 50 active event instances đồng thời toàn server |
| G5 | Event không predictable 100% | Dynamic events có yếu tố random trong trigger window |
| G6 | Liên kết sinh thái hệ thống | Mọi event type đều feed vào ít nhất 1 existing system |

### 2.2 Secondary Goals

- Event history có thể xem lại (player missed event → xem recap)
- Announcement system đủ sớm để player chuẩn bị (24h trước scheduled events)
- Event participation không mandatory cho main progression

### 2.3 Non-Goals (KHÔNG thiết kế trong doc này)

- PvP events (handled by TerritoryWarManager)
- Dungeon-specific events (handled by DungeonManager)
- Achievement events (handled by Achievement System doc 04)
- Premium pay-to-win event bonuses

---

## 3. GAMEPLAY FLOW

### 3.1 Event Type Overview

```
EVENT TYPES
├── Dynamic Events (player-triggered, biome-based)
├── Scheduled Events (server cron, predetermined)
├── World Boss Events (daily/weekly, shared HP)
├── Territory Events (link TerritoryWarManager)
├── Seasonal Events (4 major + 2 mini/year)
├── Invasion Events (random biome, 30-min window)
└── Treasure Hunt (weekly, server-wide puzzle)
```

### 3.2 Dynamic Events

**Trigger Mechanism:**

Dynamic events kích hoạt khi một hoặc nhiều điều kiện đạt ngưỡng trong biome:

```
TRIGGER CONDITIONS (ALL must be met or specific combo):
├── player_count_in_biome >= threshold (varies per event type)
├── time_since_last_event >= cooldown_minutes
├── random_roll < spawn_probability (0.0–1.0)
└── optional: server_time within allowed_hours window
```

**Ví dụ: "Slime Tide" Event (Biome 3)**

| Phase | Điều kiện | Hành động |
|-------|-----------|-----------|
| Pre-event Check | Mỗi 5 phút server check biome player count | Nếu >= 5 players AND cooldown expired → roll spawn |
| Announcement | 3 phút trước spawn | Broadcast S2C_EventSpawn với countdown |
| Active Phase | 15–60 phút | Monster spawn rate ×3, kill counter hiển thị toàn biome |
| Completion | Kill target đạt (e.g. 500 slimes) hoặc timer hết | Reward distribution, 2h cooldown |
| Failure | Timer hết, target không đạt | Partial reward (50%), cooldown 30 phút |

**Dynamic Event Catalog (Biome-specific examples):**

| Event Name | Biome | Trigger | Kill Target | Duration | Base Reward |
|-----------|-------|---------|------------|----------|------------|
| Slime Tide | 3 | 5+ players | 500 slimes | 30 min | 50 event tokens |
| Crystal Frenzy | 7 | 10+ players | 300 crystal golems | 45 min | 75 event tokens |
| Shadow Surge | 12 | 8+ players | 400 shadow wraiths | 60 min | 100 event tokens |
| Fungal Bloom | 5 | 3+ players | 200 spore caps | 20 min | 30 event tokens |
| Frost Stampede | 18 | 15+ players | 600 ice beasts | 60 min | 120 event tokens |

**Scaling Formula (Player Count Buckets):**

```
Bucket A: 1–10 players
  Kill Target × 0.5
  Reward × 0.6
  Min reward floor = 10 tokens

Bucket B: 11–50 players
  Kill Target × 1.0 (base)
  Reward × 1.0 (base)

Bucket C: 51–200 players
  Kill Target × 2.5
  Reward × 1.4

Bucket D: 200+ players
  Kill Target × 5.0
  Reward × 1.8 (soft cap)
```

**Scaling là server-side calculation tại thời điểm event spawn.** Target và reward KHÔNG thay đổi trong khi event đang active (snapshot tại spawn time).

### 3.3 Scheduled Events

**Server Cron Schedule (UTC+7 giờ Việt Nam):**

| Event | Schedule (Cron) | Duration | Reward |
|-------|----------------|---------|--------|
| Gold Rush Hour | `0 18 * * *` (hàng ngày 18:00) | 2h | 2× gold drop |
| Silver Sprint | `0 12 * * 6` (thứ 7, 12:00) | 3h | 2× silver craft mats |
| Weekend Boss | `0 20 * * 6` (thứ 7, 20:00) | 4h | Boss spawn enhanced loot |
| Monday Madness | `0 7 * * 1` (thứ 2, 07:00) | 2h | 1.5× EXP |
| Monthly Grand Harvest | `0 20 1 * *` (ngày 1 mỗi tháng, 20:00) | 24h | Event token ×3 |

**Announcement Timeline:**

```
T-24h: In-game notification banner (all online players)
T-6h:  System chat broadcast
T-1h:  Popup notification (dismissable)
T-15m: Event lobby countdown visible in HUD
T-0:   Event starts, S2C_EventSpawn broadcast
```

**Storage in `event_schedule` table** — xem mục 9.

### 3.4 World Boss Events

**Boss Pool:** 59 bosses (boss_db.json) + event-exclusive variants. Event variants là reskins với modified stats, không phải enemies mới.

**Spawn Schedule:**

| Tier | Schedule | Biome | HP Pool |
|------|---------|-------|---------|
| Daily Boss (Tier 1) | 2× per day (12:00, 20:00) | Rotates biomes 1–7 | 1,000,000 HP |
| Daily Boss (Tier 2) | 1× per day (20:00) | Rotates biomes 8–14 | 5,000,000 HP |
| Weekly Boss | Saturday 20:00 | Rotates biomes 15–21 | 50,000,000 HP |
| Monthly Apex Boss | First Sunday 20:00 | Biome 21 (cố định) | 500,000,000 HP |

**Shared HP Pool Mechanics:**

- HP là một pool duy nhất, shared toàn bộ player trong biome
- Damage từ mỗi player cộng dồn vào pool tổng
- Server broadcast HP pool update mỗi 1 giây qua `S2C_WorldBossHp`
- Client hiển thị HP bar chung + personal DPS counter

**Contribution & Loot System:**

```
Personal Contribution % = (player_damage / total_damage_dealt) × 100

Reward Tiers:
  Top 1%  contribution: Diamond Chest + event tokens × 5 + leaderboard title
  Top 10% contribution: Gold Chest + event tokens × 3
  Top 25% contribution: Silver Chest + event tokens × 2
  Participated (> 0%): Bronze Chest + event tokens × 1

FLOOR RULE: Minimum 1 Bronze Chest nếu player deal ít nhất 0.01% damage
```

**Leaderboard Top 10 Bonus:**

Top 10 DPS contributors trong World Boss nhận thêm:
- Exclusive cosmetic item (non-power, event-specific skin)
- "Slayer" title prefix tạm thời (7 ngày)
- Bestiary progress credit ×2 cho boss đó

**Event-Exclusive Boss Variants:**

| Variant Type | Difference từ Base | Drop Rate |
|-------------|-------------------|----------|
| Enraged | HP ×2, ATK ×1.5 | +20% token yield |
| Corrupted | Debuff aura radius | +10% rare mat |
| Phantom | Phased fight (3 phases) | Unique cosmetic drop |

### 3.5 Territory Events

Territory Events **sử dụng lại** TerritoryWarManager.cs thay vì tạo hệ thống mới.

**Integration Points:**

```
TerritoryWarManager → WorldEventSystem (hooks):
  OnWarStart()       → register_territory_event_instance()
  OnWarEnd()         → finalize_territory_event_rewards()
  OnCapturePoint()   → increment_event_contribution()
```

**Territory Event Types:**

| Type | Trigger | Duration | Reward |
|------|---------|---------|--------|
| War Window | Lịch TerritoryWar (existing) | 1–2h | event tokens + reputation |
| Siege Event | Guild với territory tier 3+ | 3h | Siege tokens (sub-currency) |
| Capture the Flag | Special biome events (biome 10, 15, 20) | 45 min | Flag carrier bonus rewards |
| Resource Conflict | Two guilds contest same resource node | 30 min | Resource × 5 winner, × 1 loser |

**Capture the Flag Flow:**

1. Server spawn Flag object tại center biome
2. Player picks up flag → debuff: movement -20%, combat skills only 50% effectiveness
3. Carry flag to team base → score point
4. Flag dropped on death → respawn timer 30s
5. 5 points = win, hoặc more points when 45 min ends
6. Reward: base tokens + bonus per carry success

### 3.6 Seasonal Events

**Annual Calendar:**

| Season | Tháng | Theme | Exclusive Currency |
|--------|-------|-------|------------------|
| Spring Festival | Tháng 3–4 | Sakura, renewal | Spring Petals |
| Summer Blaze | Tháng 6–7 | Heat, adventure | Sun Coins |
| Autumn Harvest | Tháng 9–10 | Harvest, mystery | Moon Shards |
| Winter Wonderland | Tháng 12–1 | Snow, celebration | Frost Gems |
| Mini Event: Moon Festival | Tháng 8 (2 tuần) | Mid-Autumn | Moon Tokens |
| Mini Event: New Year | Tháng 1 (1 tuần) | Celebration | Lucky Coins |

**Seasonal Currency Integration:**

Seasonal currencies map vào `CurrencyData.specialCurrency` dict (existing):

```
specialCurrency["spring_petals"] = amount
specialCurrency["sun_coins"] = amount
specialCurrency["moon_shards"] = amount
specialCurrency["frost_gems"] = amount
```

Seasonal currencies **expire** sau khi season kết thúc (30 ngày grace period). Unused tokens convert 10:1 sang gold khi expire.

**Seasonal Content Structure:**

```
SEASONAL EVENT
├── Seasonal Quest Chain (5–8 quests, links QuestStateMachine.cs)
├── Seasonal Dungeon (1–2 dungeons in dungeon_db.json, flagged seasonal)
├── Seasonal Monster Variants (reskins trong monster_db.json)
├── Seasonal Shop (exclusive cosmetics, non-power)
├── Seasonal Achievement Set (ties into Achievement System)
└── Seasonal Title (ties into Title System)
```

**Exclusive Cosmetics Policy:**

- Seasonal cosmetics KHÔNG re-release trong cùng năm (prestige value)
- Năm 2+ (ví dụ Summer 2027): cosmetics mới, không repeat Summer 2026
- Core mechanics của seasonal dungeons có thể re-use với new story

### 3.7 Invasion Events

**Trigger:** Hoàn toàn random, server-controlled, không thể predict.

```
INVASION TRIGGER:
  - Random roll mỗi 15 phút per biome: 2% chance
  - Không trigger trong vòng 4h sau invasion gần nhất (per biome)
  - Không trigger nếu < 3 active players trong biome
  - Ưu tiên biomes không có active event khác
```

**Invasion Mechanics:**

| Parameter | Value |
|-----------|-------|
| Monster count | Biome base spawn × 3 |
| Duration | 30 phút |
| Notice time | 60 giây trước spawn |
| Player threshold | Chỉ cần 1 player, scale by presence |
| Success condition | Kill 80% spawned monsters |
| Failure condition | Timer hết trước khi đạt 80% |

**Invasion Scaling:**

```
Players in biome → spawn count multiplier:
1–2 players:   ×1.0 (base count, không reduce xuống dưới base)
3–10 players:  ×2.0
11–30 players: ×3.0 (standard)
31+ players:   ×4.0 (max)
```

**Invasion Rewards:**

| Outcome | Reward |
|---------|--------|
| Success (≥80% killed) | event_tokens × 20, Invasion Crate (rare loot), +50 Reputation |
| Partial (50–79% killed) | event_tokens × 10, Common Crate, +20 Reputation |
| Failed (<50% killed) | event_tokens × 5 (participation), +5 Reputation |

**Personal contribution** tính bằng kill count trong invasion window. Kill credit ghi server-side, không tính kill bởi summons/pets nếu player offline.

### 3.8 Treasure Hunt

**Weekly Treasure Hunt System:**

- 1 active Treasure Hunt per week, server-wide
- Reset: mỗi thứ 2 00:00 UTC+7
- Chỉ có thể có 1 winner (first complete)
- Sau khi winner tìm thấy: announcement toàn server, loot chest biến mất
- Players khác nhận consolation reward nếu đã complete ít nhất 1 clue

**3-Stage Puzzle Structure:**

```
STAGE 1 — NPC Dialog Clue
  - Server chọn 1 trong 10 NPC templates
  - NPC dialog có cryptic message khi talk
  - Clue dẫn đến location trong biome
  - All players có thể talk NPC và nhận clue
  - Clue text là same for everyone (parallel solve)

STAGE 2 — Location Puzzle
  - Reach specific coordinates in biome (±5 unit radius)
  - Interact with hidden object (invisible until player steps in range 3)
  - Hidden object reveals second clue
  - Second clue dẫn đến Stage 3

STAGE 3 — Final Chest
  - Unique loot chest spawn tại hidden location
  - First player interact → claim unique reward
  - Chest despawn sau 10 phút nếu không claimed (mystery prize lost)
  - Consolation chests spawn nearby cho other participants (không có unique item)
```

**Treasure Hunt Loot Table:**

| Chest Type | Contents |
|-----------|---------|
| Grand Chest (winner) | Unique cosmetic + event_tokens × 200 + Treasure Title (7 days) |
| Stage 3 Consolation | event_tokens × 50 + rare material ×3 |
| Stage 2 Consolation | event_tokens × 20 |
| Stage 1 Consolation | event_tokens × 5 |

**Discovery Tracking:**

- `treasure_hunt_progress` table ghi mỗi player đã complete stage nào
- Consolation reward chỉ claim 1 lần per week per player
- Winner tracked trong `world_event_rewards_claimed` với special flag

---

## 4. ECONOMY INTEGRATION

### 4.1 Event Token Economy

**Event Tokens** là primary currency của World Event System.

```
EARN:
  Dynamic Events: 10–120 tokens (by event type + scaling)
  Scheduled Events: varies (20–200 tokens)
  World Boss: 10–500 tokens (by tier + contribution)
  Invasion: 5–20 tokens
  Treasure Hunt: 5–200 tokens
  Territory Events: 15–100 tokens

SPEND (Event Shop):
  Cosmetic Skins: 500–2000 tokens
  Mounts: 3000–8000 tokens
  Emotes: 200–500 tokens
  Decorative Pets: 1500–4000 tokens (non-combat, is_power=false)
  Consumable Buffs (EXP only, no stat): 50–200 tokens
  Seasonal Currency Converter: 100 tokens → 50 seasonal currency
```

**Token Sink Mechanisms (Gold Sinks during Events):**

| Mechanism | Cost | Benefit |
|-----------|------|---------|
| Event Entry Fee (premium events) | 500 gold | Access exclusive event area |
| Event Crafting (boost drops) | 1000–5000 gold | +20% drop rate for duration |
| Boss Resurrection Token | 2000 gold | Re-enter boss fight after death without waiting |
| Invasion Preparation Buff | 800 gold | +15% ATK for invasion duration |

**Inflation Prevention:**

- Event tokens không tradeable giữa players
- Token daily earn cap: 500 tokens/ngày per player
- Weekly earn cap: 2000 tokens/tuần
- Cap reset Thứ 2 00:00 UTC+7
- Server enforces cap, không phải client

### 4.2 Event Shop Catalog

**Phân loại rõ ràng — KHÔNG có stat items:**

```
Event Shop Categories:
├── Cosmetics (skins, outfits, weapon skins)
├── Mounts (visual speed = same as current mount tier)
├── Housing/Decoration (future system placeholder)
├── Emotes & Expressions
├── Decorative Pets (cosmetic follow, no combat)
└── Consumables (EXP buffs ONLY, no stat buffs)
```

**is_power flag** = false cho mọi item trong Event Shop. Server validates trước khi grant.

---

## 5. PROGRESSION INTEGRATION

### 5.1 EXP Integration

| Event Type | EXP Reward Source |
|-----------|------------------|
| Dynamic Events | Kill EXP (existing) + event completion bonus EXP |
| World Boss | Kill EXP (existing) + contribution tier EXP bonus |
| Seasonal Events | Seasonal Quest EXP (via QuestStateMachine) |
| Invasion | Kill EXP × 1.5 trong invasion window |
| Gold Rush Hour | Gold drops ×2 (không ảnh hưởng EXP) |

**Event EXP bonus stack với existing EXP modifiers:**

```
Final EXP = base_kill_exp × exp_modifier × event_bonus
  exp_modifier: from party, vip, potion
  event_bonus: 1.0 (no event), 1.5 (invasion), varies
```

### 5.2 Reputation Integration

Events link vào `ReputationManager.cs` (existing):

| Event | Reputation Effect |
|-------|-----------------|
| Dynamic Event completion | +25 Rep với biome faction |
| Invasion Repelled | +50 Rep với biome faction |
| World Boss kill | +10 Rep với Region faction |
| Territory Event win | +100 Rep với Guild faction |
| Seasonal Event quests | +varied Rep per quest |

### 5.3 Bestiary Integration

Events link vào `BestiaryManager.cs` (existing):

| Event | Bestiary Effect |
|-------|----------------|
| World Boss kill | Boss bestiary entry filled, data recorded |
| Dynamic Event kills | Regular bestiary kill count |
| World Boss Top 10 contribution | Bestiary progress ×2 cho boss đó |
| Invasion monsters | Bestiary kill count (invasion variants = same entry as normal) |

### 5.4 Achievement Triggers

Events fire achievement events (Achievement System handles tracking):

```
EVENT_FIRED → AchievementSystem.OnEvent(event_type, player_id, value)

Examples:
  WORLD_BOSS_KILL → "Boss Hunter" achievement progress
  INVASION_REPELLED → "Defender" achievement progress
  TREASURE_FOUND → hidden achievement trigger
  SEASONAL_COMPLETE → seasonal achievement progress
```

---

## 6. MULTIPLAYER INTEGRATION

### 6.1 World Boss Shared HP Broadcast

```
Broadcast frequency: 1 second intervals
Packet: S2C_WorldBossHp
Recipients: All players in boss biome (radius check server-side)
Data: current_hp, max_hp, top_3_contributors (anonymized name + %)

Performance note:
  50+ players in biome: broadcast tiếp tục
  200+ players: broadcast giảm xuống 2s intervals để giảm server load
```

### 6.2 Party Bonuses for Events

| Event Type | Party Bonus |
|-----------|------------|
| Dynamic Event | +10% event tokens nếu party 4+ members |
| World Boss | +5% contribution credit khi có party assist |
| Invasion | +15% kill EXP nếu party |
| Treasure Hunt | Không có party bonus (solo discovery rewarded) |

Party bonus chỉ áp dụng khi party members ở trong cùng biome.

### 6.3 Real-time Event State Sync

```
NEW PLAYER ENTERS BIOME (event active):
  Server gửi: S2C_EventProgress (current state, timer, kill count)
  Client render: event UI overlay, progress bar, timer

PLAYER LEAVES BIOME (event active):
  Server: remove from event participants
  Player: có thể return và vẫn nhận reward nếu đã contribute trước đó
  Reward eligibility: ghi lại khi first contribution, không bị xóa nếu leave

PLAYER DISCONNECT (event active):
  Contribution đã ghi server-side = preserved
  Reconnect within event window → still eligible for reward
  Reconnect after event → reward waiting in claim queue
```

### 6.4 Territory Event Multiplayer

Territory Events sử dụng real-time combat từ TerritoryWarManager. Không duplicate logic. Event system chỉ:
- Track event tokens separately
- Add event completion bonus on top of TerritoryWar existing rewards
- Log to `world_event_contributions` table

---

## 7. SERVER AUTHORITY RULES

### 7.1 Event Lifecycle — Server is Sole Authority

```
ALL of the following are server-controlled ONLY:
  1. Event spawn decision (trigger check, random roll)
  2. Event target values (kill count, HP pool)
  3. Player contribution tracking
  4. Event completion/failure determination
  5. Reward calculation and distribution
  6. Event despawn
  7. Cooldown enforcement

CLIENT cannot:
  - Trigger an event
  - Modify event progress
  - Claim reward without server validation
  - See event state not sent by server
```

### 7.2 Reward Distribution Protocol

```
REWARD FLOW:
  1. Event completes (server determines)
  2. Server calculates each player's contribution%
  3. Server applies reward tier (Bronze/Silver/Gold/Diamond)
  4. Server writes to reward_queue table
  5. Server sends S2C_EventComplete with personal reward summary
  6. Client shows reward UI
  7. Player claims via C2S_EventClaimReward
  8. Server validates claim (player participated, reward not already claimed)
  9. Server grants reward to player inventory/currency
  10. Server marks claimed in world_event_rewards_claimed
```

### 7.3 HP Pool Synchronization

```
World Boss HP Pool:
  Single source of truth: server memory (Redis cache)
  Updated: on every validated damage event
  Broadcast: every 1s to all participants
  Persistence: written to world_boss_instances.current_hp every 30s
  On server restart: reload from DB, broadcast resync to clients
```

### 7.4 Kill Validation

```
Kill credited to player IF:
  - Player is in biome at time of kill (server position check)
  - Player dealt > 0 damage to the monster before death
  - Player is alive OR died within last 5 seconds of kill
  - Kill packet arrived within 10s of monster death timestamp

Kill NOT credited:
  - Player teleported out of biome before kill
  - Kill dealt only by pet/summon while player offline
  - Duplicate kill packet for same monster_instance_id
```

---

## 8. ANTI-EXPLOIT RULES

### 8.1 AFK Farming Prevention

```
CONTRIBUTION FLOOR RULE:
  Player phải deal ít nhất 0.01% total event damage để qualify
  Cho Dynamic Events: tham gia ≥ 1 kill trong event window
  Time-in-biome minimum: 3 phút continuous (không teleport spam)

AFK DETECTION:
  Position không thay đổi > 5 phút trong event window → flagged
  Flagged player contribution bị giảm 50%
  3 lần flagged trong 1 tuần → temporary event ban (24h)
```

### 8.2 One Reward Per Event Instance

```
world_event_rewards_claimed table với composite unique key:
  (player_id, event_instance_id) UNIQUE

Duplicate claim attempt:
  Server returns: ERROR_ALREADY_CLAIMED
  Client shows: "Bạn đã nhận thưởng cho sự kiện này rồi."
  Logged for audit
```

### 8.3 World Boss Exploit Prevention

```
DAMAGE HACK DETECTION:
  Expected max DPS per character level calculated server-side
  Damage > expected_max_dps × 2 → flagged for review
  Auto-cap contribution at expected_max × 1.2 pending review

SUMMON/PET EXPLOIT:
  Summon damage counts toward player contribution
  BUT: player must be online and in biome when summon deals damage
  Summon kills không count nếu player offline > 30s

TELEPORT EXPLOIT (enter biome after boss near death):
  Minimum participation time: 60s in biome to receive any reward
  Late joiners (enter when boss < 10% HP): reduced tier (max Bronze)
```

### 8.4 Treasure Hunt Anti-Exploit

```
SERVER-SIDE CLUE VALIDATION:
  Stage 2 chỉ accessible sau khi server confirms Stage 1 complete
  Stage 3 chỉ accessible sau khi server confirms Stage 2 complete
  Coordinates gửi tới client sau khi validate, không gửi trước

SPEED EXPLOIT:
  Min time between stages: 60s (prevent script/macro)
  Stage 1 → Stage 2 < 60s: invalidated, must restart Stage 1

BOT DETECTION:
  Treasure hunt solve time < 3 phút (tất cả 3 stages): flagged
  Flagged players: reward held for 24h manual review
```

### 8.5 Invasion Kill Credit Exploit

```
KILL CREDIT:
  Validated by server, client chỉ gửi damage packet
  Kill packet includes: attacker_id, monster_instance_id, timestamp, damage_dealt
  Server validates: monster_instance_id còn sống, timestamp hợp lệ, attacker trong biome

DUPLICATE PACKET:
  monster_instance_id unique per invasion
  Once monster marked dead: subsequent kill packets rejected
  Logged nếu player gửi > 5 duplicate packets/min
```

---

## 9. DATABASE STRUCTURE

### 9.1 `world_events` — Event Definition Table

```sql
CREATE TABLE world_events (
    event_id          SERIAL PRIMARY KEY,
    event_code        VARCHAR(64) UNIQUE NOT NULL,   -- 'slime_tide', 'crystal_frenzy'
    event_type        VARCHAR(32) NOT NULL,           -- 'dynamic','scheduled','world_boss','invasion','seasonal','treasure_hunt','territory'
    display_name      VARCHAR(128) NOT NULL,
    description       TEXT,
    biome_id          INT REFERENCES biomes(biome_id),  -- NULL = server-wide
    trigger_type      VARCHAR(32) NOT NULL,           -- 'player_count','cron','manual','random'
    trigger_config    JSONB NOT NULL,                 -- {"min_players":5, "cooldown_minutes":120, "spawn_probability":0.3}
    duration_minutes  INT NOT NULL,
    scaling_config    JSONB NOT NULL,                 -- bucket configs: {"1_10":{"kill_mult":0.5,"reward_mult":0.6}, ...}
    base_reward_config JSONB NOT NULL,               -- {"event_tokens":50, "reputation":25}
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);
```

### 9.2 `world_event_instances` — Active/Historical Instances

```sql
CREATE TABLE world_event_instances (
    instance_id       BIGSERIAL PRIMARY KEY,
    event_id          INT REFERENCES world_events(event_id),
    biome_id          INT,
    started_at        TIMESTAMP NOT NULL,
    ends_at           TIMESTAMP NOT NULL,
    status            VARCHAR(16) NOT NULL DEFAULT 'active',  -- 'active','completed','failed','cancelled'
    player_bucket     VARCHAR(8),                             -- 'A','B','C','D' (set at spawn)
    active_player_count INT DEFAULT 0,
    kill_target       INT,                                    -- snapshotted at spawn
    kill_current      INT DEFAULT 0,
    hp_pool_max       BIGINT,                                 -- for world boss
    hp_pool_current   BIGINT,                                 -- for world boss
    total_damage_dealt BIGINT DEFAULT 0,
    reward_config     JSONB NOT NULL,                         -- snapshotted at spawn
    completion_data   JSONB,                                  -- populated at end
    created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wei_status ON world_event_instances(status, ends_at);
CREATE INDEX idx_wei_biome ON world_event_instances(biome_id, status);
```

### 9.3 `world_event_contributions` — Per-player Contribution Tracking

```sql
CREATE TABLE world_event_contributions (
    contribution_id   BIGSERIAL PRIMARY KEY,
    instance_id       BIGINT REFERENCES world_event_instances(instance_id),
    player_id         BIGINT REFERENCES players(player_id),
    contribution_type VARCHAR(32) NOT NULL,   -- 'damage','kills','healing','flag_carry'
    contribution_value BIGINT DEFAULT 0,       -- damage dealt, kills, etc.
    contribution_pct  DECIMAL(8,4) DEFAULT 0, -- calculated at event end
    reward_tier       VARCHAR(16),             -- 'diamond','gold','silver','bronze','none'
    time_in_biome_seconds INT DEFAULT 0,
    last_active_at    TIMESTAMP,
    afk_flagged       BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW(),
    UNIQUE(instance_id, player_id)
);

CREATE INDEX idx_wec_player ON world_event_contributions(player_id, instance_id);
CREATE INDEX idx_wec_instance ON world_event_contributions(instance_id, contribution_pct DESC);
```

### 9.4 `world_event_rewards_claimed` — Prevent Duplicate Claims

```sql
CREATE TABLE world_event_rewards_claimed (
    claim_id          BIGSERIAL PRIMARY KEY,
    instance_id       BIGINT REFERENCES world_event_instances(instance_id),
    player_id         BIGINT REFERENCES players(player_id),
    reward_tier       VARCHAR(16) NOT NULL,
    reward_data       JSONB NOT NULL,   -- actual items/tokens granted
    claimed_at        TIMESTAMP DEFAULT NOW(),
    claim_source      VARCHAR(32),      -- 'auto','manual_claim'
    UNIQUE(instance_id, player_id)
);
```

### 9.5 `event_schedule` — Scheduled Event Calendar

```sql
CREATE TABLE event_schedule (
    schedule_id       SERIAL PRIMARY KEY,
    event_id          INT REFERENCES world_events(event_id),
    cron_expression   VARCHAR(64),                    -- NULL if one-time
    next_occurrence   TIMESTAMP NOT NULL,
    is_recurring      BOOLEAN DEFAULT TRUE,
    announce_at       TIMESTAMP,                      -- pre-computed: next_occurrence - 24h
    announcement_sent BOOLEAN DEFAULT FALSE,
    is_enabled        BOOLEAN DEFAULT TRUE,
    override_config   JSONB,                          -- per-schedule overrides to base event config
    created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_es_next ON event_schedule(next_occurrence, is_enabled);
```

### 9.6 `world_boss_instances` — World Boss Specific State

```sql
CREATE TABLE world_boss_instances (
    boss_instance_id  BIGSERIAL PRIMARY KEY,
    instance_id       BIGINT REFERENCES world_event_instances(instance_id),
    boss_id           INT REFERENCES bosses(boss_id),        -- from boss_db.json
    boss_variant      VARCHAR(32) DEFAULT 'normal',          -- 'normal','enraged','corrupted','phantom'
    biome_id          INT NOT NULL,
    hp_max            BIGINT NOT NULL,
    hp_current        BIGINT NOT NULL,
    spawned_at        TIMESTAMP NOT NULL,
    killed_at         TIMESTAMP,
    kill_time_seconds INT,                                    -- seconds to kill (for records)
    top10_snapshot    JSONB,                                  -- top 10 at time of kill
    total_participants INT DEFAULT 0,
    created_at        TIMESTAMP DEFAULT NOW()
);
```

### 9.7 `world_boss_contributions` — Boss-specific Contribution

```sql
CREATE TABLE world_boss_contributions (
    id                BIGSERIAL PRIMARY KEY,
    boss_instance_id  BIGINT REFERENCES world_boss_instances(boss_instance_id),
    player_id         BIGINT REFERENCES players(player_id),
    total_damage      BIGINT DEFAULT 0,
    damage_pct        DECIMAL(8,4) DEFAULT 0,
    reward_tier       VARCHAR(16),
    bestiary_credit   INT DEFAULT 1,    -- 2 for top 10
    created_at        TIMESTAMP DEFAULT NOW(),
    UNIQUE(boss_instance_id, player_id)
);

CREATE INDEX idx_wbc_boss ON world_boss_contributions(boss_instance_id, damage_pct DESC);
```

### 9.8 `treasure_hunt_progress` — Weekly Treasure Hunt Tracking

```sql
CREATE TABLE treasure_hunt_progress (
    id                BIGSERIAL PRIMARY KEY,
    week_start        DATE NOT NULL,                         -- Monday of the week
    player_id         BIGINT REFERENCES players(player_id),
    stage_reached     INT DEFAULT 0,                         -- 0, 1, 2, 3
    stage1_completed_at TIMESTAMP,
    stage2_completed_at TIMESTAMP,
    stage3_completed_at TIMESTAMP,
    is_winner         BOOLEAN DEFAULT FALSE,
    consolation_claimed BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT NOW(),
    UNIQUE(week_start, player_id)
);

CREATE TABLE treasure_hunt_weekly (
    week_start        DATE PRIMARY KEY,
    clue_template_id  INT NOT NULL,                          -- which NPC + location combo
    npc_id            INT NOT NULL,
    stage1_location   JSONB NOT NULL,                        -- {biome_id, x, y, z}
    stage2_location   JSONB NOT NULL,
    chest_location    JSONB NOT NULL,
    winner_player_id  BIGINT REFERENCES players(player_id),
    winner_found_at   TIMESTAMP,
    created_at        TIMESTAMP DEFAULT NOW()
);
```

---

## 10. SAVE DATA STRUCTURE

### 10.1 WorldEventSave — Client-side (per-character)

```csharp
[Serializable]
public class WorldEventSave
{
    // Currency
    public int eventTokens;                  // current event token balance

    // Weekly Boss flags (bitfield, 64 bosses max)
    // Bit N = 1 nếu player đã receive reward từ boss N trong tuần này
    // Reset: mỗi Thứ 2 00:00 UTC+7
    public ulong weeklyBossContribFlags;     // 64 bits = 64 boss slots

    // Event reward claimed bits (rolling 256 events)
    // Maps to world_event_instances.instance_id mod 256
    // Client-side caching only; server is source of truth
    public uint[] eventRewardClaimedBits;   // 8 uints = 256 bits

    // Active event IDs visible to this player (for UI display)
    public int[] activeEventIds;            // max 20 concurrent events shown

    // Seasonal currency (mirrors CurrencyData.specialCurrency for quick access)
    public int springPetals;
    public int sunCoins;
    public int moonShards;
    public int frostGems;
    public int moonTokens;
    public int luckyCoins;

    // Treasure hunt progress (current week)
    public int treasureHuntStageReached;    // 0–3
    public bool treasureHuntConsolationClaimed;

    // Weekly event participation counter (for weekly cap enforcement display)
    public int weeklyTokensEarned;
    public int dailyTokensEarned;
    public long dailyResetTimestamp;        // Unix timestamp of last daily reset
    public long weeklyResetTimestamp;       // Unix timestamp of last weekly reset
}
```

**Lưu ý:** `eventTokens` và tất cả currency phải được server validate. Client value chỉ dùng cho display. Server là source of truth khi có conflict.

### 10.2 Server-Side Redis Cache Keys

```
world_event:active:{biome_id}               → List of active event instance IDs
world_event:instance:{instance_id}:state    → Event state (status, kill_count, timer)
world_event:boss:{instance_id}:hp           → Current HP (updated every damage event)
world_event:boss:{instance_id}:top10        → Top 10 contributors (sorted set)
world_event:player:{player_id}:daily_tokens → Daily token earn count (TTL: 24h)
world_event:player:{player_id}:weekly_tokens→ Weekly token earn count (TTL: until Monday)
treasure_hunt:week:{YYYYMMDD}:state         → Current week's hunt state
```

---

## 11. NETWORK REQUIREMENTS

### 11.1 Packet Definitions (MessagePack TCP)

**S2C_EventSpawn**
```
Packet ID: 0x2001
Direction: Server → Client
Trigger: Event spawns trong biome mà player đang ở
Broadcast: All players in biome

Fields:
  instance_id:      uint32
  event_code:       string(64)
  event_type:       uint8     (enum: dynamic=0, scheduled=1, world_boss=2, invasion=3, seasonal=4, treasure=5, territory=6)
  display_name:     string(128)
  biome_id:         uint16
  countdown_seconds:uint16    (0 = already active)
  kill_target:      uint32    (0 if not kill-based)
  duration_seconds: uint16
  player_bucket:    uint8     (A=0, B=1, C=2, D=3)
  reward_preview:   struct { bronze_tokens: uint16, gold_tokens: uint16, diamond_tokens: uint16 }
```

**S2C_EventProgress**
```
Packet ID: 0x2002
Direction: Server → Client
Trigger: Kill count update (every 10 kills) OR player enters biome during event
Broadcast: All players in biome

Fields:
  instance_id:      uint32
  kill_current:     uint32
  kill_target:      uint32
  time_remaining_s: uint16
  active_players:   uint16
  top3_contributors: array[3] { player_name: string(32), contribution_pct: float32 }
```

**S2C_EventComplete**
```
Packet ID: 0x2003
Direction: Server → Client (personal, unicast)
Trigger: Event ends, player's personal reward calculated

Fields:
  instance_id:      uint32
  outcome:          uint8   (success=0, partial=1, failed=2)
  player_reward_tier: uint8 (diamond=0, gold=1, silver=2, bronze=3, none=4)
  tokens_earned:    uint16
  bonus_items:      array[] { item_id: uint32, quantity: uint16 }
  reputation_earned:uint16
  exp_earned:       uint32
  can_claim:        bool
```

**S2C_WorldBossSpawn**
```
Packet ID: 0x2004
Direction: Server → Client
Trigger: World Boss spawns

Fields:
  boss_instance_id: uint32
  boss_id:          uint16
  boss_variant:     uint8    (normal=0, enraged=1, corrupted=2, phantom=3)
  boss_name:        string(64)
  biome_id:         uint16
  hp_max:           uint64
  hp_current:       uint64
  position:         struct { x: float32, y: float32, z: float32 }
  spawn_time:       uint32   (Unix timestamp)
```

**S2C_WorldBossHp** (existing, documented for completeness)
```
Packet ID: 0x2005
Direction: Server → Client (broadcast, 1s interval)
Fields:
  boss_instance_id: uint32
  hp_current:       uint64
  hp_max:           uint64
  total_participants: uint16
  top3:             array[3] { player_name: string(32), pct: float32 }
```

**S2C_InvasionStart**
```
Packet ID: 0x2006
Direction: Server → Client (broadcast to biome)
Trigger: Invasion begins (60s notice)

Fields:
  instance_id:      uint32
  biome_id:         uint16
  monster_count:    uint16
  duration_seconds: uint16
  kill_target:      uint16   (80% of monster_count)
  notice_seconds:   uint16   (60 = pre-spawn notice)
  scaling_bucket:   uint8
```

**C2S_EventContribution**
```
Packet ID: 0x2101
Direction: Client → Server
Trigger: Player action contributes to event (kill, damage, flag carry, etc.)

Fields:
  instance_id:      uint32
  contribution_type:uint8    (kill=0, damage=1, flag_carry=2, heal=3)
  monster_instance_id: uint32  (for kill validation)
  value:            uint32   (damage amount, kill count, etc.)
  timestamp_ms:     uint64   (client timestamp for latency compensation)

Server validates and ignores invalid packets.
```

**C2S_ClaimEventReward**
```
Packet ID: 0x2102
Direction: Client → Server

Fields:
  instance_id:      uint32
  claim_type:       uint8    (event=0, treasure_consolation=1, boss_leaderboard=2)
```

### 11.2 Bandwidth Estimates

| Packet | Size | Frequency | Players | Bandwidth |
|--------|------|-----------|---------|-----------|
| S2C_WorldBossHp | ~50 bytes | 1/s | 200 per boss | 10 KB/s per boss |
| S2C_EventProgress | ~100 bytes | ~1/10s | 100 per event | 1 KB/s per event |
| S2C_EventSpawn | ~200 bytes | Rare | Biome broadcast | Negligible |
| C2S_EventContribution | ~30 bytes | 2–5/s per player | Active | ~15 KB/s per 100 players |

**Optimization:** World Boss HP packet giảm frequency xuống 2s khi 200+ players trong biome.

---

## 12. EDGE CASES

### 12.1 Server Restart During Active Event

```
HANDLING:
  1. world_event_instances.status = 'active' được load lại
  2. ends_at còn trong tương lai → resume event
  3. Broadcast S2C_EventProgress tới tất cả players re-entering biome
  4. Kill count tiếp tục từ kill_current trong DB

  Nếu ends_at đã qua:
  1. Tính toán completion dựa trên kill_current vs kill_target
  2. Distribute rewards cho tất cả contributors
  3. Đánh dấu instance 'completed' hoặc 'failed'
```

### 12.2 World Boss — Zero Damage Players

```
Player enters biome, boss dies while player loading:
  → Player đã không deal damage
  → KHÔNG nhận reward (không qualify)
  → No floor reward cho 0% contribution

Player deals 1 damage, then disconnects:
  → Contribution ghi server-side, preserved
  → Reconnects: check claim eligibility
  → Nhận floor reward (Bronze) nếu contribution > 0
```

### 12.3 Event Collision (Multiple Events Same Biome)

```
RULE: Tối đa 1 dynamic event per biome tại một thời điểm
RULE: 1 world boss event per biome tại một thời điểm
RULE: Invasion KHÔNG spawn nếu world boss đang active trong biome
RULE: Scheduled events (Gold Rush, etc.) có thể stack với other events — chúng là server-wide buffs, không phải biome events

Collision Resolution:
  Dynamic event đang active → new dynamic event trigger bị reject
  World boss active → invasion suppressed
  Scheduled event buff → always applies regardless of active biome events
```

### 12.4 Treasure Hunt — Winner Connection Loss

```
SCENARIO: Player finds chest (Stage 3), sends interact, disconnects before receiving reward

HANDLING:
  1. Server receives interact packet, validates stage completion
  2. Marks player as winner in treasure_hunt_weekly
  3. Reward added to pending_rewards queue
  4. Player reconnects → S2C_EventComplete sent with treasure reward
  5. Chest despawns immediately when winner validated (không phải khi client confirms)
  6. Consolation chests spawn for other players
```

### 12.5 Seasonal Event Currency Expiry

```
Grace period: 30 ngày sau season end
At expiry:
  SELECT specialCurrency FROM currency_data WHERE key = 'spring_petals' AND expires_at < NOW()
  Convert: floor(amount / 10) gold
  Clear seasonal currency
  Log transaction
  Notify player via in-game mail

Player offline during expiry:
  Conversion happens server-side anyway
  Next login: player sees mail "Hoa Xuân của bạn đã chuyển thành X vàng"
```

### 12.6 Dynamic Event — Target Not Met but Timer Expired

```
Outcome: 'partial' or 'failed' based on progress:
  kill_current >= kill_target × 0.8 → partial success
    Reward: 50% of success reward
  kill_current < kill_target × 0.8 → failed
    Reward: participation tokens only (20% of success reward)
  kill_current = 0 (nobody participated) → cancelled
    No rewards, cooldown reset to 30 min instead of 2h
```

### 12.7 Player Level Mismatch for Event

```
Event in Biome 18 requires Level 400+:
  Player level < 400 enters biome → level check
  Can participate in event BUT:
    Kill credit reduced if monster 100+ levels above player (existing mechanic)
    Still receive floor reward if any contribution

No level-gate on event participation explicitly:
  Economy design allows lower players to contribute marginally
  Natural self-regulation via damage effectiveness
```

---

## 13. FUTURE SCALABILITY

### 13.1 New Event Types

Event system sử dụng `event_type` enum và `trigger_config` JSONB, cho phép thêm types mới không cần schema change:

```
Potential future types:
  - 'guild_raid':    guild-only event instance
  - 'cross_server':  multi-server event (future infra)
  - 'player_triggered': player spends currency to start event
  - 'story_event':   narrative-linked event
  - 'pvp_event':     dedicated PvP event (extends TerritoryWar)
```

### 13.2 Cross-Server World Boss (Infra Upgrade)

```
When server fleet expands:
  World Boss HP pool moves to Redis Cluster (cross-server shared state)
  HP updates via pub/sub across servers
  Leaderboard becomes cross-server sorted set
  Reward calculation isolated per-server but leaderboard global

Schema supports this: no server_id foreign keys in world boss tables
```

### 13.3 Event Content Pipeline

```
New events có thể add bằng:
  1. Insert vào world_events table
  2. Insert vào event_schedule (nếu scheduled)
  3. Hot-reload via admin API (no deploy needed)
  4. Client receives new event_code → uses generic UI template
     if specific UI not deployed

"Event Content as Data" pattern:
  display_name, description, reward_config: tất cả từ DB
  Game client không cần update để show new events
  Requires: generic event UI template (all types covered)
```

### 13.4 Analytics & Balancing

```
world_event_instances.completion_data JSONB stores:
  avg_contribution_pct distribution
  time_to_complete
  player_count snapshot at intervals

Use for:
  - Balance event kill targets per bucket
  - Adjust reward curves
  - Detect events consistently failed/too easy
  - A/B test different reward configs per event_id
```

### 13.5 Seasonal Expansion

```
Current: 4 major + 2 mini seasons/year
Scale to:
  Regional festivals (biome-specific events based on player location)
  Collaboration events (partner IP)
  Player-voted events (community poll → next dynamic event theme)

seasonal_events table has flexible JSONB config:
  Can add quest_chain_ids, exclusive_monster_ids, shop_items without schema change
```

### 13.6 Performance Scaling

```
Current design handles: ~50 concurrent event instances, 5000 CCU
Scale path:
  50K CCU: Redis Cluster for HP pools, PostgreSQL read replicas for leaderboards
  500K CCU: Biome sharding across game servers, regional deployment
  Event instances: stateless design allows horizontal scale
  world_event_contributions: partition by instance_id or month
```

---

*End of Document — WORLD_EVENT_SYSTEM v1.0*
*Engineer review: Please verify all packet IDs do not conflict with existing ID space.*
*DB review: Ensure indexes cover expected query patterns before deployment.*
