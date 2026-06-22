# DAILY & WEEKLY ACTIVITY SYSTEM — Slime MMORPG Production Bible
> Game: Slime MMORPG | System: Daily/Weekly Activity | Version: 1.0 | Date: 2026-06-14
> GAP: GAP-05 CRITICAL | Không có daily loop = D1 retention < 25%

---

## 1. Purpose & Design Goals

Daily/Weekly Activity System là **primary retention hook** của Slime MMORPG mobile.

- **Daily Login Loop**: Player có reason cụ thể để login mỗi ngày
- **Soft Time Gate**: Khuyến khích consistent play thay vì marathon session
- **Reward Funnel**: Điều phối currency economy (gold, gem, event_token) vào tay player đúng lịch
- **Cross-System Driver**: Activity points link vào Battle Pass, Reputation, Guild quests

**Design Principle:** Daily không bao giờ gây frustration. Miss 1 ngày = mất daily reward, không bị punish nặng.

---

## 2. Daily Activity System

### 2.1 Daily Activity Pool

Mỗi ngày (reset 00:00 UTC) player nhận 10 activities ngẫu nhiên từ pool.
Server chọn dựa trên: player level range, content đã unlock, system preference diversity.

**Activity Categories:**

| Category | Sample Activities | AP Reward |
|---|---|---|
| Combat | Kill 20 monsters | 20 AP |
| Combat | Kill 3 Elite monsters | 30 AP |
| Dungeon | Complete 1 Normal Dungeon | 25 AP |
| Dungeon | Complete 1 Dungeon without dying | 40 AP |
| Crafting | Craft 5 items | 15 AP |
| Social | Donate to Guild | 10 AP |
| Social | Complete 1 Party Dungeon | 35 AP |
| Collection | Discover 1 new Bestiary entry | 20 AP |
| Economy | Buy or Sell 1 item on AH | 10 AP |
| Housing | Collect Housing generator | 15 AP |
| Quest | Complete 3 Quests | 20 AP |
| Exploration | Visit 2 different Biomes | 15 AP |

**Daily Activity Points (AP) Cap:** 200 AP/ngày
Mỗi player nhận đủ activities để kiếm được 250-300 AP nếu hoàn thành hết, nhưng cap tại 200.

### 2.2 Daily Login Bonus

| Day streak | Reward |
|---|---|
| Day 1 | 500 gold |
| Day 2 | 1 gem |
| Day 3 | 1,000 gold |
| Day 4 | 2 gem |
| Day 5 | 2,000 gold |
| Day 6 | 5 gem |
| Day 7 | 10 gem + Rare Crafting Material |
| Day 14 | 20 gem + Epic Crafting Material |
| Day 28 | 50 gem + Legendary Material |
| Day 30 | Month Completion: season_token x5 + Avatar Frame |

**Streak Rules:**
- Miss 1 ngày → streak giữ nguyên nhưng không nhận reward ngày đó
- Miss 2 ngày liên tiếp → streak reset về 0
- Timezone: server UTC, không adjust theo timezone client

---

## 3. Daily Activity Point Tiers & Rewards

| Tier | AP Required | Reward |
|---|---|---|
| T1 | 50 AP | 500 gold |
| T2 | 100 AP | 1,000 gold + 1 gem |
| T3 | 150 AP | 2,000 gold + stamina potion |
| T4 | 200 AP (daily cap) | 5,000 gold + 2 gem + EXP potion |

**Premium Pass Bonus (Battle Pass):**
- T4 reward upgraded: +2,500 gold + 1 extra gem
- Does NOT grant is_power items

---

## 4. Weekly Activity System

### 4.1 Weekly Activity Pool

Reset mỗi Thứ Hai 00:00 UTC. 7 weekly activities, player hoàn thành cả 7.

| Activity | WAP Reward |
|---|---|
| Clear 5 different Dungeons | 50 WAP |
| Kill 5 different Boss types | 60 WAP |
| Complete 50 Daily Activities total | 40 WAP |
| Reach T4 Daily Activity 5 days | 70 WAP |
| Complete 3 Guild Quests | 50 WAP |
| Spend 10,000 gold | 30 WAP |
| AH: List or Buy 5 items | 30 WAP |
| **Total** | **330 WAP** |

### 4.2 Weekly AP Reward Tiers

| Tier | WAP Required | Reward |
|---|---|---|
| W1 | 100 WAP | 5,000 gold + 5 gem |
| W2 | 200 WAP | 10,000 gold + 10 gem |
| W3 | 330 WAP (full) | 25,000 gold + 20 gem + season_token x5 + Rare equipment shard |

---

## 5. Monthly Activity Summary

| Reset | Scope | Rewards |
|---|---|---|
| Monthly (1st of month) | Monthly Activity Points (MAP) = sum of daily AP across month | Calendar rewards |
| MAP 2000 (5 days full) | season_token x10 | — |
| MAP 4000 (20 days) | exclusive avatar frame | — |
| MAP 6000 (30 days full) | "Diligent [Month]" title + 100 gem | — |

---

## 6. Reset Scheduler

```
DailyActivityManager.ScheduleReset():
  - Daily: Cron 00:00 UTC
    - Clear dailyActivityProgress{}
    - Increment dayStreak (hoặc reset nếu miss 2+)
    - Generate new activity pool (server-side random với player context)
    - Log to daily_activity_log table
    
  - Weekly: Cron Thứ Hai 00:00 UTC
    - Clear weeklyActivityProgress{}
    - Generate new weekly pool
    
  - Monthly: Cron 1st 00:00 UTC
    - Calculate MAP = sum of all daily AP in month
    - Apply monthly rewards
    - Clear monthly tracking
```

---

## 7. Economy Integration

**Activity Point Rewards dẫn đến:**
- Gold sink: Daily T4 player kiếm ~5K gold/ngày = 150K/tháng từ daily
- Gem distribution: Daily + Weekly cộng ~50 gems/tuần cho active player
- season_token: Weekly W3 + Monthly MAP source cho Battle Pass
- event_token: Một số special activities trong event period award event_token

**Activity as Reputation Source:**
Daily activities có tag faction. Complete 5 activities tagged "Grassland" trong ngày → +50 Grassland Faction Reputation.

---

## 8. Battle Pass Integration

- Daily Activity T4 = +1 Battle Pass tick
- Weekly Activity W3 = +5 Battle Pass ticks
- Monthly Activity MAP 6000 = +10 Battle Pass ticks
- Battle Pass ticks → BP EXP conversion: 1 tick = 100 BP EXP

---

## 9. Database Structure

```sql
TABLE daily_activity_log
  player_id         BIGINT      NOT NULL
  log_date          DATE        NOT NULL    -- YYYY-MM-DD UTC
  activities        JSONB       NOT NULL    -- { activityId: {completed: bool, progress: int} }
  ap_earned         SMALLINT    DEFAULT 0
  tiers_claimed     TINYINT     DEFAULT 0   -- bitmask (4 bits for T1-T4)
  login_bonus_day   SMALLINT    DEFAULT 0   -- current streak day
  login_bonus_claimed BOOL      DEFAULT false
  created_at        TIMESTAMP
  PRIMARY KEY (player_id, log_date)
  PARTITION BY RANGE (log_date)    -- monthly partitions

TABLE weekly_activity_log
  player_id         BIGINT      NOT NULL
  week_start        DATE        NOT NULL    -- Monday of this week
  activities        JSONB       NOT NULL
  wap_earned        SMALLINT    DEFAULT 0
  tiers_claimed     TINYINT     DEFAULT 0
  PRIMARY KEY (player_id, week_start)
```

---

## 10. Save Data V6 Extension

```
activityData: {
  dailyActivityPoints:    int,
  weeklyActivityPoints:   int,
  monthlyActivityPoints:  int,
  lastDailyReset:         long,       // Unix timestamp UTC
  lastWeeklyReset:        long,
  loginStreak:            int,
  loginStreakLastDate:     string,     // ISO 8601
  dailyClaimedTiers:      int,        // bitmask T1-T4
  weeklyClaimedTiers:     int,        // bitmask W1-W3
  dailyActivityProgress:  { [activityId]: int }
}
```

---

## 11. Network Requirements

| Packet | Direction | Description |
|---|---|---|
| S2C_DailyActivityReset | S→C | New day activities list |
| C2S_DailyActivityClaim | C→S | Claim tier reward (tierId) |
| S2C_DailyActivityClaimResult | S→C | Reward delivery |
| C2S_WeeklyActivityClaim | C→S | Claim weekly tier |
| S2C_ActivityProgress | S→C | Progress update (push after relevant action) |
| S2C_LoginBonusGrant | S→C | Login bonus on session start |
| C2S_LoginBonusClaim | C→S | Player explicitly claim |

---

## 12. Anti-Exploit Rules

| Exploit Vector | Protection |
|---|---|
| Clock manipulation | Server UTC clock only |
| Multi-account daily | Per-account, email-linked |
| Activity farming (AH spam) | Min 5 min cooldown between AH activities counted |
| AFK activity completion | Activities requiring kills validated via combat log |
| Streak manipulation | Server tracks lastLoginDate in UTC, client không trust |

---

*Document: 07_DAILY_WEEKLY_ACTIVITY_SYSTEM.md | Version: 1.0 | Date: 2026-06-14*
*Dependencies: BattlePass/SeasonManager, GuildQuestSystem, ReputationManager, EconomySinkManager*
