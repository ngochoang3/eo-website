# OFFLINE PROGRESS SYSTEM — Slime MMORPG Production Bible
> Game: Slime MMORPG | System: Offline/AFK Progress | Version: 1.0 | Date: 2026-06-14
> GAP: GAP-12 HIGH | Mobile MMORPG cần AFK farming để retain casual players

---

## 1. Purpose & Design Goals

- **Casual Retention**: Player không cần online 24/7 để tiến bộ
- **Return Incentive**: "What did I miss?" → lý do để login hàng ngày
- **Economy Safety**: Offline gold generation phải có hard cap để tránh inflation
- **Satisfying Claim**: Claim screen là micro-moment of joy
- **CatchUpManager Integration**: Expand CatchUpManager.cs (hiện rất đơn giản)

---

## 2. Offline Progress Types

| Type | Eligibility | Cap | Rate |
|---|---|---|---|
| AFK Gold Farming | Always available | 8h max accumulation | Level-scaled |
| AFK EXP Farming | Level < 500 only (catch-up) | 4h max | 20% of active rate |
| AFK Dungeon Grinding | Unlocked Dungeon 10+ | 4h max | 10% drop rate of active |
| Housing Generator | Always (Housing level-scaled) | Unlimited accumulation | Per plot level |

---

## 3. AFK Gold Farming

**Rate Formula:**
```
offline_gold_per_hour = base_gold × afk_zone_multiplier × (1 + guild_skill_afk_bonus)
base_gold = player_level × 50
afk_zone_multiplier = biome_level / 5 (where afk_zone biome = current biome at logout)
guild_skill_afk_bonus = guild Branch B4 AFK Timer bonus (0 / 5% / 10% more gold)
```

**Example (Level 100, Biome 5 / multiplier 1.0, no guild bonus):**
- base_gold = 100 × 50 = 5,000 gold/h
- Cap 8h: 40,000 gold max per offline session

**Cap Rationale:** 8h cap prevents bots from running 24h uncapped. Diminishing returns after 4h:
- Hour 1-4: 100% rate
- Hour 5-6: 75% rate
- Hour 7-8: 50% rate
- Hour 9+: 0% (cap hit, no more accumulation)

---

## 4. AFK EXP Farming (Catch-Up Only)

Available ONLY for Level < 500 (catch-up mechanic for newer/returning players).

**Rate:** 20% of active EXP rate in current biome
**Cap:** 4 hours accumulation
**Purpose:** Help new players catch up to active player base without trivializing endgame

After Level 500: EXP offline farming disabled. Endgame = active play.

---

## 5. AFK Dungeon Grinding

**Eligibility:** Dungeon must be already cleared once (can't AFK a dungeon you've never entered)

**Rate:** 10% of active dungeon drop rate
**Cap:** 4 hours
**Reward Type:** Crafting materials and gear shards only (no equipment directly)

**Logic:**
```
offline_drops = []
for hour in min(offline_hours, 4):
  for each_eligible_dungeon_mob in afk_dungeon:
    chance = base_drop_rate × 0.10
    if random() < chance:
      offline_drops.append(loot_table.roll())
return offline_drops (server-side simulated, XorShift64)
```

---

## 6. Return to Game Claim Screen

**UI Flow:**
```
Login → OfflineProgressManager.CalculateRewards(lastLogoutTimestamp, now)
         ↓
     Claim Screen (before main menu):
       "You were away for X hours Y minutes"
       [Gold: XX,XXX]  [EXP: X,XXX (if eligible)]
       [Items: X materials from dungeon]
       [Housing: XX gold from generator]
       [CLAIM ALL button]
         ↓
     Server validates → deliver rewards → clear pendingOfflineRewards{}
```

**Claim is optional:** Player can skip claim screen and receive rewards automatically to inventory/currency.

---

## 7. Economy Safety

**Hard Caps:**
- AFK gold: 8h max per offline session
- Between sessions: Offline progress RESETS on claim — không accumulate across multiple sessions without claiming
- No carry-over: If player doesn't claim before next logout, old session rewards replaced (NOT stacked)

**Economy Monitoring:**
- Analytics track daily_offline_gold_claimed per player
- Alert: if avg offline claim > 2x expected (farming bot detection)

**Anti-Bot:**
- Offline gold requires player to have been in a valid biome at logout
- Bot detection: if player never online during peak hours but always offline-claiming = flag
- IP/device fingerprint correlation with suspicious accounts

---

## 8. Housing Generator Integration

HousingSave already has `lastGeneratorCollectTimestamp` and `accumulatedGeneratorGold` — this system already works.

**AFK Progress Sync:**
- On login: OfflineProgressManager also trigger HousingManager.CollectGenerator()
- Housing generator is NOT capped — accumulates indefinitely (but rate is very small)
- Display housing earnings on same claim screen

---

## 9. Save Data V6 Extension

```
offlineData: {
  lastLogoutTimestamp:  long,             // Unix ms UTC
  afkZoneId:            string,           // biome_id at logout
  afkDungeonId:         string | null,    // dungeon if was in dungeon
  pendingOfflineRewards: {
    gold:              long,
    exp:               long,
    items:             [{ itemId: string, quantity: int }],
    housingGold:       long
  },
  offlineClaimed:       bool,             // true after claim screen shown
  lastAFKSessionHours:  float             // for analytics
}
```

---

## 10. Server-Side Calculation

```
OfflineProgressManager.CalculateOfflineRewards(playerId):
  lastLogout = save.offlineData.lastLogoutTimestamp
  now = ServerClock.UtcNow()
  offlineSeconds = now - lastLogout
  offlineHours = min(offlineSeconds / 3600, 8)  // hard cap 8h

  // Gold calculation with diminishing returns
  goldRate = GetGoldRatePerHour(player.level, afkZoneId)
  gold = CalculateGoldWithDiminishingReturns(goldRate, offlineHours)

  // EXP (catch-up only)
  exp = 0
  if player.level < 500:
    expRate = GetEXPRatePerHour(player.level, afkZoneId) × 0.20
    exp = expRate × min(offlineHours, 4)

  // Dungeon drops (server-side simulation, XorShift64)
  items = SimulateDungeonDrops(afkDungeonId, min(offlineHours, 4))

  return OfflineRewards { gold, exp, items, housingGold }
```

---

## 11. Network Requirements

| Packet | Direction | Description |
|---|---|---|
| S2C_OfflineRewardPending | S→C | On login: claim screen data |
| C2S_OfflineRewardClaim | C→S | Player claims rewards |
| S2C_OfflineRewardDelivered | S→C | Reward delivery confirmation |

---

## 12. Edge Cases

| Scenario | Handling |
|---|---|
| Server maintenance during offline | Time during maintenance NOT counted as offline time |
| Player logged out mid-dungeon | Use last known biome as afk_zone_id |
| Multiple device logout | Last device to logout sets lastLogoutTimestamp |
| VPN/clock change | Server clock only |
| Very short offline (< 5 min) | Show claim screen only if rewards > threshold (100 gold) |

---

*Document: 15_OFFLINE_PROGRESS_SYSTEM.md | Version: 1.0 | Date: 2026-06-14*
*Dependencies: CatchUpManager.cs (expand), HousingManager.cs, EconomySinkManager*
