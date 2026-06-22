# LEADERBOARD SYSTEM ARCHITECTURE
> Game: Slime MMORPG | Date: 2026-06-14 | Version: 1.0
> Power Budget: 0% (leaderboard = display only, no power reward)
> Backend: Redis Sorted Sets (real-time ranking) + PostgreSQL snapshots

---

## MANDATORY COMPATIBILITY CHECK

```
[Source of Truth]
  01_POWER_BUDGET.md         → Leaderboard rewards = cosmetics only
  SERVER_ARCHITECTURE.md     → Redis Cache Cluster already exists
  14_CROSS_SERVER_ARCHITECTURE.md → Cross-server leaderboard phase 2
  MONETIZATION_VIP_COSMETICS.md → Prestige Coin rewards for top players
  PVP_ARCHITECTURE.md        → PvP MMR feeds PvP Ranking
  01_GUILD_ARCHITECTURE.md   → Guild score feeds Guild Ranking

Leaderboard DOES NOT:
  ✗ Grant power stats from ranking (all rewards cosmetic)
  ✗ Create new backend service (uses Redis Cluster already in stack)
  ✓ Power Ranking: reads PowerBudgetManager.GetActualPower() server-side
  ✓ Cross-server: extends 14_CROSS_SERVER_ARCHITECTURE.md
```

---

## 1. Design Philosophy

Leaderboard là **prestige display** — show off, not power:
1. **Multiple Rankings**: Power, PvP, Guild, Craft, Wealth — appeal to all player types
2. **Real-Time**: Redis Sorted Set → O(log N) update per score change
3. **Seasonal**: Resets with 90-day season (consistent với Battle Pass + PvP)
4. **Cross-Server**: Top players from all servers compete at cross-server tier

---

## 2. Leaderboard Categories

| Board | Score Source | Update Frequency | Scope |
|---|---|---|---|
| Power Ranking | PowerBudgetManager.GetActualPower() | On build change | Server + Cross-server |
| PvP Ranking | PvP MMR (from PVP_ARCHITECTURE.md) | After each match | Server + Cross-server |
| Guild Ranking | Guild Score (members × boss kills × donations) | Daily snapshot | Server + Cross-server |
| Level Ranking | Player Level + Ascension Rank | On level-up | Server only |
| Wealth Ranking | Gold + Diamond in account | Daily snapshot | Server only |
| Craft Ranking | Total Masterwork items crafted | On craft complete | Server only |
| Collection Ranking | Total codex entries collected | On collect | Server + Cross-server |

**Seasonal Boards** (additional, during active season):
- Season Battle Pass Level Ranking
- Season PvP Rank (same as PvP but labeled for season)
- Season Boss Kill Count

---

## 3. Backend Architecture

### 3.1 Redis Sorted Set Design

```
Redis Keys (one ZSET per board per server per season):
  lb:{server_id}:{board_type}:{season_id}
  
  Example: "lb:s01:power:3" = Power board, Server 1, Season 3
  
  ZADD lb:s01:power:3 8523.5 "player_id:12345"
  ZREVRANK lb:s01:power:3 "player_id:12345"  → rank (0-indexed)
  ZREVRANGE lb:s01:power:3 0 99              → top 100 with scores
  
Cross-server top 100:
  "lb:global:{board_type}:{season_id}" — aggregated from all servers
  Rebuilt by batch job every 15 min (not real-time for global)
  
Memory estimate:
  1 board × 100K players × ~40 bytes per entry = ~4MB per board
  10 boards × 4MB = ~40MB RAM for leaderboard data (trivial for Redis)
```

### 3.2 Score Calculation

```csharp
// Power Score: calls existing PowerBudgetManager
float powerScore = PowerBudgetManager.RecalcTotal(playerBuild).total_actual;
// Range: 0-100 (percentage of max power)
// Updates on: equip/enhance/ascension/skill change

// PvP Score: from PvP MMR
int pvpScore = player.pvpRatings.currentMMR;

// Guild Score:
// GuildScore = (guild.memberCount × 100)
//            + (guild.bossKillsThisSeason × 500)
//            + (guild.totalDonationsThisSeason / 1000)
// Updated daily by GuildService batch job

// Wealth Score: gold × 1 + diamond × 100 (diamond is rarer)
// Note: Wealth ranking is for social comparison only, no reward
// Privacy opt-out available in Social Settings
```

---

## 4. Ranking Display

```
[Leaderboard UI — Main Panel]

Tabs: [Power] [PvP] [Guild] [Level] [Craft] [Collection]

Top 100 Display:
  Rank | Avatar Frame | Name | Level | Score | Mount
  
  #1-3:   Gold/Silver/Bronze podium animation
  #4-100: Standard list rows
  
  My Rank:
    If player not in top 100 → shown at bottom: "You: #1,542 / 127,431"
    Jump button: scroll to player's position in list
    
Nearby Ranks (±5 players):
  Shows players just above and below current player
  Creates "almost there" motivation loop
  
Filter: [All] [Friends Only] [Guild Only]
  Friends Only: shows friends' ranks + mine (no need to be top 100)
  Guild Only: internal guild ranking
```

---

## 5. Seasonal Rewards

```
End-of-Season Snapshot (Day 90):
  Final rankings locked at Day 84 (Season Lock from PVP_ARCHITECTURE.md)
  Rewards sent via Mail System within 24h of season end

Power Ranking Rewards (Seasonal):
  Rank 1:         "Supreme Power" Nameplate + 1,000 prestige_coin
  Rank 2-3:       "Titan" Frame + 500 prestige_coin
  Rank 4-10:      "Legend" Frame + 200 prestige_coin
  Rank 11-50:     "Elite" Frame + 100 prestige_coin
  Rank 51-100:    "Champion" Badge + 50 prestige_coin
  
PvP Ranking Rewards: (see PVP_ARCHITECTURE.md seasonal rewards)

Guild Ranking Rewards:
  Rank 1 Guild:   Guild Hall decoration "Champion's Throne" + guild banner
                  All members: 200 prestige_coin + "Champion Guild" title
  Rank 2-3:       "Honorable Guild" title for all members + 100 prestige_coin
  Rank 4-10:      "Elite Guild" recognition + 50 prestige_coin each

Craft Ranking Rewards:
  Rank 1-3 Masterwork Crafters:  "Master Artisan" title + cosmetic tool skin
  Collection Ranking Rank 1-10:  "Scholar" title + codex skin
  
RULE: ALL rewards = cosmetic (titles, frames, nameplate glow, prestige_coin)
      prestige_coin → buys cosmetics in Prestige Store (existing monetization)
```

---

## 6. Anti-Manipulation

```
Score Manipulation Prevention:

Power Ranking:
  Server re-calculates power from raw build data (not trust client value)
  PowerBudgetManager.RecalcTotal() runs server-side on submission
  Cheated gear caught by existing Anti-Cheat → gear revoked → score corrected
  
Wealth Ranking:
  Gold amount: direct DB read (can't fake)
  Diamond: direct DB read from recharge_transactions
  Privacy flag: players can opt-out (prevents harassment of whales)
  
Guild Ranking:
  Boss kill verification: server logs kill → no client-reported kills counted
  Donation: deducted from player gold in same transaction → no fake donation
  
Leaderboard Gaming (deliberate stat manipulation):
  "Boosting" guilds: detected if guild all join same day + immediately top rank
  Suspicious join/leave: guild membership changes flagged if within 7 days of season end
  Alt account inflation: same IP multi-account detection (existing security layer)
```

---

## 7. Database Schema

```sql
CREATE TABLE leaderboard_snapshots (
    snapshot_id     BIGSERIAL PRIMARY KEY,
    board_type      VARCHAR(32) NOT NULL,
    season_id       SMALLINT NOT NULL,
    server_id       VARCHAR(8) NOT NULL,
    player_id       BIGINT,           -- null for guild boards
    guild_id        BIGINT,           -- null for player boards
    score           FLOAT NOT NULL,
    rank_position   INT NOT NULL,
    snapshot_at     TIMESTAMP NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (snapshot_at);

CREATE TABLE season_rewards_distributed (
    player_id       BIGINT NOT NULL,
    season_id       SMALLINT NOT NULL,
    board_type      VARCHAR(32) NOT NULL,
    rank_achieved   INT NOT NULL,
    rewards_json    JSONB NOT NULL,
    distributed_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, season_id, board_type)
);

CREATE INDEX idx_lb_snapshot_board ON leaderboard_snapshots(board_type, season_id, rank_position);
```

---

## 8. Network Packets

```
LeaderboardRequest  = 0x0E00  // C2S: { board_type, page (0-indexed), scope }
LeaderboardData     = 0x0E01  // S2C: { entries[], my_rank, my_score }
LeaderboardFriends  = 0x0E02  // S2C: friends-only ranking
LeaderboardGuild    = 0x0E03  // S2C: guild internal ranking
SeasonEndRewards    = 0x0E04  // S2C: season reward notification (on login post-season)
```

---

## 9. Save Data (minimal — leaderboard is server-computed)

```csharp
// No new save data needed — leaderboard reads from:
// - PowerBudgetManager (live compute)
// - PvP MMR (pvp_ratings table)
// - Guild membership (guild_members table)
// - player.level (existing core save)

// Only player preference saved:
// SocialSettings.wealthRankingPrivate = true/false (added to existing SocialSettings)
```

---

## 10. Analytics

```
leaderboard_viewed:    { board_type, tab_dwell_time_s }
leaderboard_season_reward_claimed: { board_type, rank, reward_tier }
leaderboard_rank_change: { board_type, old_rank, new_rank, score_delta }
leaderboard_nearby_clicked: { board_type } // "see my rank" button
```

---

*Document: LEADERBOARD_ARCHITECTURE.md | Version: 1.0 | Date: 2026-06-14*
*7 board types | Redis ZSET real-time | 90-day season | Rewards: cosmetic only*
*Compatible: PvP MMR | Power Budget | Guild System | Cross-Server Architecture*
