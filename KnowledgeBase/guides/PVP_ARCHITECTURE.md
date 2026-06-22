# PVP / ARENA SYSTEM ARCHITECTURE
> Game: Slime MMORPG | Date: 2026-06-14 | Version: 1.0
> Power Budget: 0% (PvP rewards = cosmetics only, no power)
> Compatible: Damage Formula V10 (isPvP multiplier 0.5× already in ContextMult)

---

## MANDATORY COMPATIBILITY CHECK

```
[Source of Truth]
  01_POWER_BUDGET.md     → No PvP power source in budget (PvP rewards = cosmetic)
  09_ELEMENT_CHART.md    → ElementMult applies in PvP (adds strategic depth)
  18_SECURITY_ARCHITECTURE.md → Anti-cheat framework (speed hack, position)
  SERVER_ARCHITECTURE.md → MatchmakingService already exists in server topology
  MONETIZATION_VIP_COSMETICS.md → PvP cosmetics sold separately, never power

PvP Damage Formula (V10, isPvP flag):
  FinalDamage(PvP) = ATK × SkillMult × CritMult × ElementMult × ContextMult
                     × (1 − DefMitigation) × SituationalCap
  where: ContextMult includes isPvP ? 0.5f : 1.0f  ← already implemented

PvP DOES NOT:
  ✗ Grant power stats (all PvP rewards = cosmetic)
  ✗ Create new damage formula
  ✗ Break Power Budget
  ✓ Uses existing MatchmakingService from SERVER_ARCHITECTURE.md
  ✓ Extends existing Analytics (funnel + KPI tracking)
```

---

## 1. Design Philosophy

PvP là **competitive prestige** — bằng chứng skill, bukan power:
1. **Skill Not Pay**: 0.5× damage cap cho tất cả trong PvP → gear gap giảm mạnh
2. **Seasonal**: 90-day season (consistent với Battle Pass season)
3. **Reward = Cosmetic**: Rank reward là Avatar Frame, Title, Skin — không có stat
4. **Anti-Smurf**: Placement gates + account age check
5. **Mobile-First**: 3v3 = primary mode (5v5 quá phức tạp cho mobile)

---

## 2. PvP Modes

| Mode | Players | Duration | Type |
|---|---|---|---|
| Arena 1v1 | 1 vs 1 | Max 5 min | Ranked + Casual |
| Arena 3v3 | 3 vs 3 | Max 8 min | Ranked + Casual |
| Guild War | Guild vs Guild | 30 min (see 01_GUILD) | Guild Content |
| World PvP | Open world | No timer | FFA (flagged zone) |

**Primary ranked mode: Arena 1v1 và 3v3**

---

## 3. Damage Balancing (V10 Compatible)

```csharp
// Existing DamageCalculator.Compute() — already handles PvP:
float contextMult = Mathf.Min(ctx.bossBonus, 1.3f)
                  * (ctx.isPvp ? 0.5f : 1.0f)    // ← EXISTING, no change needed
                  * (1.0f + repBonus);             // Phase 2 reputation extension

// ADDITIONAL PvP balance caps (new, applied after formula):
float pvpDamageCap = 0.35f;  // max 35% HP in single hit (prevents one-shot)
FinalDamage = Mathf.Min(FinalDamage, target.maxHP * pvpDamageCap);

// CC duration cap in PvP:
float ccDurationPvp = Mathf.Min(statusDuration, 2.0f); // max 2s stun in PvP

// Equipment stat normalization in PvP queue (future balance lever):
// PvPStatNormalizer.Apply(playerBuild) — clamps extreme outliers
// Default: disabled (raw stats, with 0.5× modifier sufficient at launch)
```

---

## 4. Ranking System

### 4.1 Rank Tiers

| Tier | MMR Range | Reward Type |
|---|---|---|
| Bronze | 0-999 | Bronze Frame |
| Silver | 1000-1999 | Silver Frame + Title |
| Gold | 2000-2999 | Gold Frame + Title + Emote |
| Platinum | 3000-3999 | Plat Frame + Title + Emote + Skin |
| Diamond | 4000-4999 | Diamond Frame + Exclusive Skin |
| Master | 5000-5999 | Master Frame + Exclusive Aura |
| Grandmaster | 6000+ | Top 100 server — special nameplate |

### 4.2 MMR System (Elo-Based)

```
MMR formula:
  Win: MMR += K × (1 - expectedScore)
  Loss: MMR -= K × expectedScore
  
  expectedScore = 1 / (1 + 10^((opponent.MMR - player.MMR) / 400))
  K = 32 (default), K = 16 (Master+), K = 48 (provisional first 10 games)
  
  Provisional period: First 10 games of season → larger MMR swings
  Placement: Based on win rate + opponent MMR in provisional
  
  Season Start:
    Last season MMR → soft reset: new_mmr = last_mmr × 0.75 + 1000 × 0.25
    Forces re-placement, rewards consistent players
```

### 4.3 Season Timeline (90 days, consistent with Battle Pass)

```
Season rhythm:
  Day 1:      Season start, all ranks reset (soft reset)
  Day 1-75:   Active ranked period
  Day 76-83:  "Season Closing" — double MMR gain window (catch-up)
  Day 84-89:  Season lock — no new ranked games, final snapshot
  Day 90:     Season end, rewards distributed via Mail System
  
Season rewards distributed:
  Rank Frame: Permanent cosmetic based on highest rank reached
  Season Title: "[Season Name] [Rank]" (e.g., "Dawn S1 Diamond")
  Season Coin: prestige_coin × (rank_tier × 100) — buys cosmetics
  Top 100: "Grandmaster" nameplate (glowing server tag)
```

---

## 5. Matchmaking

### 5.1 Matchmaking Algorithm

```
Queue → MatchmakingService (existing server microservice):

Parameters:
  Target: |player.MMR - opponent.MMR| ≤ 200
  Expand: +100 MMR range every 30s waiting
  Hard cap: |diff| ≤ 600 (beyond this, any match better than no match)
  
  3v3: Match team MMR average vs team MMR average
       Team composition checked: max 3 of same weapon type per team
       
Queue wait time target: < 60s for 70% of matches (launch)
For Grandmaster/Top 100: Cross-server pool (from 14_CROSS_SERVER_ARCHITECTURE.md)

Anti-Smurf gate (new account restriction):
  Account age < 7 days: Casual only (no ranked)
  Account age 7-30 days: Bronze-Silver pool only
  Account age 30+ days: Full ranked pool
  Win ratio > 80% in Bronze for 20+ games: MMR boosted +500 (detected smurf)
```

### 5.2 Anti-Smurf System

```
Smurf Detection Model:
  Inputs:
    account_age_days
    win_rate_last_30_games
    avg_damage_dealt_vs_rank_avg
    skill_level_vs_rank_avg (WPL comparison)
    gear_score_vs_rank_avg
    
  Smurf Score (0-100):
    0-30:   Normal player → no action
    31-60:  Potential smurf → flag + +200 MMR next game
    61-80:  Likely smurf → +500 MMR skip placement
    81-100: Confirmed smurf → force Bronze skip to Gold
    
  False positive protection: Manual review queue for score 61-80
  GM can override via GM_TOOLS_ARCHITECTURE.md
```

---

## 6. Anti-Cheat (PvP Specific)

```
PvP anti-cheat layers (extends SECURITY_ARCHITECTURE.md):

Layer 1 — Server-Authoritative:
  All damage computed server-side (client sends: target_id, skill_id, timestamp)
  Server validates: skill CD elapsed, range check, LoS check
  
Layer 2 — Position Validation:
  Position delta check (existing speed hack detection)
  PvP arena: fixed-size arena → position > arena_bounds → force_reposition
  
Layer 3 — Skill Timing:
  Client sends skill_use_time
  Server checks: |server_time - skill_use_time| < 200ms (latency grace)
  > 500ms lag: warning + logging; > 1000ms: suspected timing hack
  
Layer 4 — Replay System:
  PvP matches recorded as action logs (not video)
  Report system: player can report → match replay reviewed by server validator
  Automated validator checks for stat anomalies
  
Layer 5 — Ban Pipeline:
  Auto-detect → flag in fraud_monitor (GM_TOOLS_ARCHITECTURE.md)
  GM reviews within 4h → GAME_MASTER ban via GM tools
```

---

## 7. World PvP (Flagged Zones)

```
PvP Zones: 3 special biomes have PvP enabled
  Shadow Vale (Biome 12): PvP always ON
  Void Realm (Biome 21): PvP always ON
  Phantom Crossing (Biome 18): PvP toggleable (event-only)

Rules:
  Entering PvP zone: auto-flagged (can't unflag inside)
  Kill rewards: 50 Guild Coin + event_token × 1 (small, not P2W)
  Death penalty: 5% gold drop (from carried gold, max 10,000g drop)
  Death penalty cap: won't kill gear progress (Enhancement safe)
  
  Griefing protection:
    Same player can't kill you again within 5 min
    Level protection: can't attack player > 200 levels lower
    New player protection: L1-200 can't enter PvP zones
```

---

## 8. PvP Rewards (ALL Cosmetic)

```
Arena Coins (PvP currency = event_token variant, expires end of season):
  Win: +10 Arena Coin
  Loss: +3 Arena Coin
  Win streak 3+: +5 bonus Arena Coin
  
Arena Coin Shop (seasonal, cosmetics only):
  PvP Weapon Skin: 300 Arena Coin
  PvP Avatar Frame: 500 Arena Coin (different from rank frame)
  PvP Pet Costume: 200 Arena Coin
  PvP Emote Pack: 150 Arena Coin
  PvP Title: 100 Arena Coin (e.g., "Gladiator", "Arena Veteran")
  
RULE: No item in Arena Coin shop has is_power = true
RULE: Arena Coin not purchasable with Diamond (competitive integrity)
```

---

## 9. Database Schema

```sql
CREATE TABLE pvp_ratings (
    player_id       BIGINT PRIMARY KEY REFERENCES players(player_id),
    current_mmr     INT NOT NULL DEFAULT 1000,
    peak_mmr        INT NOT NULL DEFAULT 1000,
    rank_tier       VARCHAR(16) NOT NULL DEFAULT 'BRONZE',
    wins            INT NOT NULL DEFAULT 0,
    losses          INT NOT NULL DEFAULT 0,
    win_streak      SMALLINT NOT NULL DEFAULT 0,
    season_id       SMALLINT NOT NULL DEFAULT 1,
    placement_done  BOOL NOT NULL DEFAULT FALSE,
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE pvp_matches (
    match_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode            VARCHAR(8) NOT NULL,      -- 1V1, 3V3
    season_id       SMALLINT NOT NULL,
    player1_id      BIGINT NOT NULL,
    player2_id      BIGINT,                   -- null for 3v3 (use team table)
    winner_id       BIGINT NOT NULL,
    duration_s      SMALLINT NOT NULL,
    mmr_delta       SMALLINT NOT NULL,
    match_log_json  JSONB,                    -- action replay log
    played_at       TIMESTAMP NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (played_at);

CREATE TABLE pvp_seasons (
    season_id       SMALLINT PRIMARY KEY,
    name            VARCHAR(64) NOT NULL,
    starts_at       TIMESTAMP NOT NULL,
    ends_at         TIMESTAMP NOT NULL,
    rewards_json    JSONB NOT NULL            -- rank → reward list
);

CREATE TABLE pvp_smurf_flags (
    player_id       BIGINT PRIMARY KEY,
    smurf_score     SMALLINT NOT NULL,
    detection_at    TIMESTAMP NOT NULL,
    reviewed        BOOL NOT NULL DEFAULT FALSE,
    reviewed_by_gm  BIGINT
);

CREATE INDEX idx_pvp_ratings_season ON pvp_ratings(season_id, current_mmr DESC);
CREATE INDEX idx_pvp_matches_season ON pvp_matches(season_id, played_at);
```

---

## 10. Network Packets

```
PvPQueueJoin        = 0x0C00  // C2S: { mode }
PvPQueueStatus      = 0x0C01  // S2C: { wait_time_est_s, queue_size }
PvPMatchFound       = 0x0C02  // S2C: { match_id, opponent_info, arena_id }
PvPMatchAccept      = 0x0C03  // C2S: accept/decline
PvPMatchStart       = 0x0C04  // S2C: match begins, countdown 5s
PvPSkillUse         = 0x0C05  // C2S: { skill_id, target_id, timestamp }
PvPDamageResult     = 0x0C06  // S2C: { damage, target_hp_remaining }
PvPMatchEnd         = 0x0C07  // S2C: { winner_id, mmr_delta, rewards }
PvPQueueLeave       = 0x0C08  // C2S
PvPRatingSync       = 0x0C09  // S2C: { mmr, rank_tier } on login
PvPReportPlayer     = 0x0C0A  // C2S: { match_id, target_id, reason }
PvPLeaderboardPage  = 0x0C0B  // C2S: request leaderboard page
```

---

## 11. Save Data (extends V9)

```csharp
public class PvPSaveData {
    public int currentMMR;
    public int peakMMR;
    public string rankTier;
    public int seasonWins;
    public int seasonLosses;
    public int arenaCoin;                // expires end of season
    public int winStreak;
    public bool placementDone;           // 10 placement games done?
    public string highestRankEverAchieved; // lifetime peak
}
```

---

## 12. Analytics

```
pvp_match_played:   { mode, duration_s, winner_rank_tier, loser_rank_tier, mmr_delta }
pvp_ranked_up:      { player_id, old_rank, new_rank, mmr }
pvp_smurf_flagged:  { player_id, smurf_score, detection_method }
pvp_report_filed:   { match_id, reporter_id, reason }
pvp_queue_abandoned:{ wait_time_s, mode }
```

---

*Document: PVP_ARCHITECTURE.md | Version: 1.0 | Date: 2026-06-14*
*Modes: 1v1 + 3v3 Arena | Seasonal 90 days | MMR Elo | Rewards: cosmetic only*
*V10: isPvP×0.5 already in ContextMult | Anti-smurf | 5-layer anti-cheat*
