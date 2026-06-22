# GACHA ARCHITECTURE DESIGN — Slime MMORPG Production Bible
> Game: Slime MMORPG | System: Gacha/Banner Management | Version: 1.0 | Date: 2026-06-14
> GAP: GAP-07 CRITICAL | PityManager exists but BannerManager missing = zero revenue

---

## 1. Purpose & Design Goals

- **Primary Monetization**: Gacha là main revenue stream của game
- **Wire PityManager**: BannerManager MUST call PityManager.GetPityModifier() cho mỗi pull
- **Player Trust**: Transparent pity system, pull history, rates disclosed
- **Regulation Compliance**: Disclose all rates (required by App Store, Play Store)
- **Anti-exploitation**: Server-side XorShift64 RNG, client không nhận seed

**SECURITY INVARIANT:** XorShift64 SERVER-SIDE ONLY — client không bao giờ nhận seed.

---

## 2. Banner Types

| Type | Thời hạn | Rate-up | Currency |
|---|---|---|---|
| Limited Banner | 14-21 ngày | Featured 5-star | premium_gem |
| Standard Banner | Permanent | No rate-up | gem (free) + premium_gem |
| Event Banner | Event duration | Event-themed | event_token |
| Guild Banner | 1 tháng | Guild boss drops | guild_coin |
| Rerun Banner | 7-14 ngày | Old limited units | premium_gem |

Tối đa 2 banners active cùng lúc (1 Limited + 1 Standard hoặc Event).

---

## 3. Pull Rates (Standard Banner)

| Rarity | Base Rate | Soft Pity Rate (pull 70+) |
|---|---|---|
| Legendary (5-star) | 0.6% | +6% per pull (max ~100% at pull 90) |
| Epic (4-star) | 5.1% | x1.5 sau pull 70 |
| Rare (3-star) | 94.3% | Normal |

**Limited Banner Rate-up:**
- Rate-up Legendary: 50% của Legendary pulls là featured unit
- Rate-up pity: Nếu pull Legendary không phải featured → next Legendary GUARANTEED featured

---

## 4. Pity System Configuration

| Parameter | Value |
|---|---|
| soft_pity_start | Pull 70 |
| hard_pity | Pull 90 |
| soft_pity_rate_increase | +6% per pull sau soft_pity_start |
| guarantee_reset_on_hard | YES |
| cross_banner_pity_transfer | NO (per banner type) |

**PityManager Integration (CRITICAL FIX for GAP-07):**

```
BannerManager.Pull(playerId, bannerId, pullCount):
  pityRecord = PityManager.GetRecord(playerId, bannerId)
  for each pull:
    basePull = XorShift64.NextDouble(serverSeed)  // SERVER-SIDE ONLY
    pityMod = PityManager.GetPityModifier(pityRecord.failCount)
    adjustedRate = baseRate + pityMod
    result = DetermineResult(basePull, adjustedRate, banner.pool)
    PityManager.UpdateRecord(pityRecord, result)
  return results
```

---

## 5. Pull Flow

```
C2S_BannerPullSingle:
  1. Validate player has sufficient currency
  2. Deduct currency (atomic transaction)
  3. PityManager.GetRecord(playerId, bannerId)
  4. XorShift64 roll (server-side only)
  5. PityManager.UpdateRecord()
  6. Write to banner_history
  7. Add item to inventory (or mail if full)
  8. Return S2C_BannerResult
```

10-Pull Bonus: Guarantees minimum 1 Epic (4-star) nếu không có trong 10 pulls.

---

## 6. Database Structure

```sql
TABLE banners
  banner_id         VARCHAR(32)   PK
  banner_type       ENUM(limited,standard,event,guild,rerun)
  config_json       JSONB         -- full BannerConfig
  is_active         BOOL

TABLE banner_history
  pull_id           UUID          PK
  player_id         BIGINT
  banner_id         VARCHAR(32)
  item_id           VARCHAR(32)
  rarity            TINYINT
  was_pity          BOOL
  pity_count_before SMALLINT
  currency_spent    INT
  pulled_at         TIMESTAMP
  INDEX: (player_id, banner_id, pulled_at DESC)

TABLE banner_pity_state
  player_id         BIGINT
  banner_id         VARCHAR(32)
  fail_count        SMALLINT      DEFAULT 0
  guarantee_next    BOOL          DEFAULT false
  PRIMARY KEY (player_id, banner_id)
```

---

## 7. Save Data V6 Extension

```
gachaData: {
  bannerPullCounts: { [bannerId]: int },   // display cache only
  totalLifetimePulls: int
}
// Pity state: SERVER ONLY via banner_pity_state. KHÔNG lưu vào client save.
```

---

## 8. Network Requirements

| Packet | Direction | Description |
|---|---|---|
| C2S_BannerList | C→S | Get active banners |
| S2C_BannerListData | S→C | Banner list |
| C2S_BannerDetails | C→S | Full banner config + rates |
| C2S_BannerPullSingle | C→S | Single pull (idempotent UUID) |
| C2S_BannerPullMulti | C→S | 10-pull |
| S2C_BannerResult | S→C | Pull results + pity count |
| C2S_BannerHistoryQuery | C→S | Query history |
| S2C_BannerHistoryData | S→C | Pull history page |
| S2C_BannerSoftPityAlert | S→C | Push: approaching pity (pull 65+) |

---

## 9. Anti-Exploit Rules

| Rule | Protection |
|---|---|
| Client RNG | Server XorShift64 only |
| Pity manipulation | PityManager state server-only |
| Race condition | Currency deduction atomic |
| Network retry duplicate | Idempotency UUID per pull |
| Rate manipulation | Rates server-side only, client GET only |

---

## 10. Gacha Item Policy

Slime MMORPG gacha bán cosmetic skins và crafting materials:

| Category | is_power | Notes |
|---|---|---|
| Character Skins | false | Visual only |
| Pet Skins | false | Visual only |
| Mount Skins | false | Visual only |
| Equipment Blueprints | false (indirectly) | Player chọn khi nào craft |
| Housing Furniture | false | Housing system |

Blueprint từ gacha cho phép craft equipment. Stats của equipment deterministic từ Blueprint grade.

---

*Document: 10_GACHA_ARCHITECTURE.md | Version: 1.0 | Date: 2026-06-14*
*Dependencies: PityManager.cs (MUST wire), MailSystem, AnalyticsService*
