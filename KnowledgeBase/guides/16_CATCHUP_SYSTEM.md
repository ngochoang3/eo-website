# CATCHUP SYSTEM — Slime MMORPG Production Bible
> Game: Slime MMORPG | System: Catch-Up Mechanics | Version: 1.0 | Date: 2026-06-14
> Dependencies: CatchUpManager.cs (expand existing), OfflineProgressSystem, DailyActivitySystem

---

## 1. Purpose & Design Goals

- **New Player Viability**: Players joining 6 months after launch can still be relevant
- **Returning Player Retention**: Players who quit 1-2 months can rejoin without feeling hopeless
- **Competitive Balance**: Catch-up mechanics must NOT collapse the endgame skill gap
- **Design Rule**: Catch-up accelerates progression speed, KHÔNG increase power ceiling

---

## 2. Catch-Up Categories

| Category | Mechanism | Scope | Duration |
|---|---|---|---|
| Level Catch-Up | Boosted EXP rate for low-level players | Auto, always-on | Until gap closes |
| Equipment Catch-Up | Increased drop rate of previous-tier gear | Auto | Until tier caught up |
| Currency Catch-Up | Boosted daily gold rewards for new players | First 30 days | First month |
| Content Unlock | Skip-ahead quest options | Player-initiated | Available always |
| Guild Catch-Up | Guild rookie bonus for new members | First 14 days in guild | Per guild join |

---

## 3. Level Catch-Up

**EXP Rate Scaling Based on Player Level vs Server Average:**

| Player Level vs Server Average | EXP Rate Bonus |
|---|---|
| More than 500 levels behind | +100% EXP from all sources |
| 200-500 levels behind | +50% EXP |
| 50-200 levels behind | +25% EXP |
| Less than 50 levels behind | No bonus |

**Server Average Update:** Calculated hourly from median active player level (logged in last 7 days).

**Source:** EXP bonus applied post-calculation in EXP pipeline:
```
finalEXP = baseEXP × (1 + catchupBonus)
catchupBonus = CatchUpManager.GetEXPBonus(playerLevel, serverMedianLevel)
```

**Display:** UI shows "Catch-Up Bonus: +X%" in EXP breakdown tooltip.

---

## 4. Equipment Catch-Up

**Problem:** Player at Level 200 in server where average is Level 500 → endgame gear is Level 500+ tier. Can't farm current-meta equipment.

**Solution:** Drop rate multiplier for "previous generation" equipment:

| Player Level | Equipment Tier Boost |
|---|---|
| Level < 200 | T1-T3 gear drop rate x2 |
| Level 200-500 | T3-T5 gear drop rate x1.5 |
| Level 500-1000 | T5-T7 gear drop rate x1.3 |
| Level 1000+ | No boost (endgame — must earn through active play) |

**Cap:** Boost applies to DROP rate only. Maximum equipment power is the same — you just find it faster.

---

## 5. New Player Currency Boost (First 30 Days)

**New Player Bonus (Days 1-30 from account creation):**

| Bonus | Multiplier |
|---|---|
| Gold from quests | x1.5 |
| Daily Activity gold reward | x1.5 |
| NPC shop discounts | -10% |
| First dungeon clear bonus | +500 gold per unique dungeon |
| Gem bonuses (starter pack) | Gifted 100 gems on first login |

**Budget-Neutral:** These bonuses don't affect endgame economy since new players spend on catch-up items, not endgame sinks.

---

## 6. Content Unlock Catch-Up

**Skip-Ahead Quests:**
- Players who join server after 3+ months can opt into "Accelerated Story Path"
- Completes side quests automatically (reward still given, story available to read)
- Unlocks content without requiring 200+ hours of side quests first

**Dungeon Auto-Unlock:**
- Players joining server aged 6+ months: dungeons 1-50 auto-unlocked
- Normal progression applies from dungeon 51+

**This is NOT power skip** — stats still require actual leveling. Only content gates removed.

---

## 7. Guild Rookie Bonus

When a new-to-guild player (joining guild for first time or rejoining after 30+ days):

| Bonus | Duration | Value |
|---|---|---|
| Guild Quest EXP bonus | 14 days | +50% Guild EXP from quests |
| Guild skill benefit | 14 days | +25% on top of current guild skill benefits |
| Contribution cap | 14 days | +50% daily CP cap (247 instead of 165) |

**Purpose:** Get new guild members contributing quickly → guild leveling stays healthy.

---

## 8. Returning Player Package

Player who was inactive > 30 days receives on return:
- Mail: "Welcome Back!" gift (100 gold × days absent, capped at 30 days = 3,000 gold)
- 5 free gems (one-time per 30-day absence window)
- Catch-up EXP boost notification
- Recommended "Return to Game" questline highlighting what's new

---

## 9. CatchUpManager.cs Expansion

**Current:** CatchUpManager.cs là minimal (single method per summary).
**Expand to:**

```
CatchUpManager:
  + GetEXPBonus(playerLevel, serverMedianLevel) → float
  + GetEquipmentDropBonus(playerLevel) → float
  + GetNewPlayerGoldBonus(accountAgeDays) → float
  + IsNewPlayerBonusActive(accountAgeDays) → bool (true if < 30 days)
  + GetReturningPlayerPackage(daysSinceLastLogin) → ReturningPackage
  + ShouldShowCatchUpNotification(playerLevel, serverMedianLevel) → bool
  + GetGuildRookieBonus(daysSinceGuildJoin) → GuildRookieBonus
```

---

## 10. Anti-Exploit Rules

| Exploit | Protection |
|---|---|
| Alt accounts for new player bonus | Bonus tied to account_id creation date, not character creation |
| Fake low level for EXP boost | Server track actual level — no manipulation |
| Veteran player on new account | "Veteran Device" flag: same device as high-level account → reduced catch-up bonus |
| Farming with new account | Daily AP cap still applies, no exception |

---

## 11. Analytics Tracking

**Catch-Up Funnel:**
- Track: "Player joined late → used catch-up → reached server median level → active retention"
- Compare D30 retention: players with catch-up vs without
- Measure time-to-catch-up (hours played to reach median level)

**Balance Monitoring:**
- If catch-up players reach median level < 1 week: bonus too strong → reduce
- If catch-up players never reach median level: bonus insufficient → increase

---

## 12. Save Data

No new save data needed. CatchUpManager derives all values from:
- `playerCore.level` (current level)
- `core.lastLoginDate` (for returning player package)
- Server median level (live calculation, no save)
- Guild join date (from guild_members table, not save data)

---

*Document: 16_CATCHUP_SYSTEM.md | Version: 1.0 | Date: 2026-06-14*
*Dependencies: CatchUpManager.cs (expand), EXP pipeline, DropRateSystem, GuildSystem*
