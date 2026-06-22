# AUCTION HOUSE — DETAILED IMPLEMENTATION
> Game: Slime MMORPG | Date: 2026-06-14 | Version: 1.0
> Power Budget: 0% (economy system, gold sink)
> Existing: 5% seller fee already in ECONOMY_AUDIT.md → this document formalizes full AH design

---

## MANDATORY COMPATIBILITY CHECK

```
[Source of Truth]
  ECONOMY_AUDIT.md       → "AH tax: 5% seller fee" already defined (Section 2.2)
  SERVER_ARCHITECTURE.md → ShopService handles AH (existing microservice)
  00_SAVE_DATA_SYSTEM.md → item_id, quantity, player_id all existing schema
  CRAFTING_SYSTEM.md     → Masterwork items → AH (crafter name in tooltip)
  WING_SYSTEM.md         → Wings: Common/Uncommon tradeable, Rare+ Soulbound
  MOUNT_SYSTEM.md        → Mounts tradeable except Legendary (server event reward)

AH DOES NOT:
  ✗ Allow Diamond trading (no premium currency AH)
  ✗ Allow Soulbound item listing (server rejects)
  ✗ Bypass anti-inflation rules
  ✓ Gold ONLY currency for all transactions
  ✓ Extends existing ShopService (not new microservice)
  ✓ 5% seller tax + 3% buyer tax = 8% total gold removed from economy
     (ECONOMY_AUDIT said 5% but adding buyer tax = stronger gold sink needed)
```

---

## 1. Design Philosophy

Auction House là **player economy engine**:
1. **Price Discovery**: Players set market prices (not NPC fixed price)
2. **Gold Sink**: Total 8% per transaction removed from economy (tax)
3. **Anti-Manipulation**: Price monitoring prevents cornering/inflation
4. **Search Depth**: Rich filters → buyers find exactly what they need
5. **Mobile UX**: Simplified default view, advanced filters behind tap

---

## 2. AH Transaction Flow

```
[Seller Flow]
  Inventory → right-click item → "List on AH"
  Set quantity + price per unit
  Set duration: 12h / 24h / 48h / 72h
  Pay listing fee (3% of total listing price, upfront)
  Item moves from inventory to "AH Escrow" immediately
  
  If sold: Gold deposited to seller mailbox (net of 8% total tax)
  If expired: Item returned to seller mailbox
  
[Buyer Flow]
  Open AH → Search / Browse
  Tap item → "Buy" → confirm
  Gold deducted immediately (buyer pays face price, no extra tax on buyer)
  
  Wait time: 0 (instant delivery to inventory or mailbox if full)
  
Tax Structure:
  Listing fee (upfront, paid by seller): 3% of total listing value
  Sales fee (on sale, paid from proceeds): 5% of sale price
  Total removed from economy per transaction: 8%
  
  Unsold: Listing fee NOT refunded (gold sink even if fails)
  
  Example: List 10 Iron Ore at 1,000g each = 10,000g total
    Listing fee: 300g deducted at listing
    If sold: Seller receives 10,000g - 500g (5% fee) = 9,500g
    Total gold removed: 800g (8%)
```

---

## 3. Listing Rules

```
Listing Constraints:
  Max active listings per player: 30 (base) / 60 (VIP4+) / 100 (VIP8+)
  Min price: 1 Gold per unit
  Max price: 99,999,999 Gold per unit (99.9M cap prevents absurd listings)
  Min quantity: 1
  Max quantity: 9,999 per listing
  
What CAN be listed:
  ✅ Equipment (not Soulbound)
  ✅ Crafting materials (Ore, Herb, Wood, Fish, etc.)
  ✅ Crafted consumables (Potions, Food)
  ✅ Gems, Rune Fragments (tradeable materials)
  ✅ Wings (Common/Uncommon only, per WING_SYSTEM.md)
  ✅ Mounts (Common/Uncommon only, per MOUNT_SYSTEM.md)
  ✅ Wing skins, Mount cosmetics (after 30-day lockout)
  
What CANNOT be listed:
  ❌ Soulbound items (server hard-block)
  ❌ Diamond / premium_gem / season_token / guild_coin (currency)
  ❌ Event Token (time-limited, can't transfer)
  ❌ Spirit Food (would allow proxy buying Bond XP — violates anti-P2W)
  ❌ Enhancement Stones obtained from specific quest chains (flagged no-trade)
  ❌ Legendary Mounts, Legendary Wings (Soulbound automatically)
  ❌ Housing plot deeds (Soulbound)
```

---

## 4. Search & Filters

### 4.1 Search UI (Mobile-First)

```
[AH Main Screen — Mobile Layout]

[Search Bar: "Search items..."]     [🔍]

Category Tabs: [All] [Equipment] [Materials] [Consumables] [Cosmetics]

Sort: [Price ↑] [Price ↓] [Newest] [Expiry]

[Item Card] ×N (scrollable):
  [Item Icon] [Name] [Quality badge] [Qty available]
  [Price per unit: 1,234g]     [Buy Now]

Tap item → Detail view:
  Price chart (last 7 days)
  Lowest 5 listings
  [Buy] button with confirmation
```

### 4.2 Filter Options

```
Advanced Filters (collapsed by default, tap "Filter"):
  Category:       Equipment / Material / Consumable / Cosmetic / Gem / Rune / Mount / Wing
  Sub-category:   (depends on category) Weapon / Armor / Accessory / Ore / Herb / ...
  Rarity:         Common / Uncommon / Rare / Epic / Legendary
  Element:        Fire / Water / Earth / Wind / Light / Dark / None
  Level Req:      Slider (1-2000)
  Enhancement:    Slider (+0 to +15)
  Quality:        Normal / Good / Excellent / Masterwork
  Price range:    Min / Max gold
  Seller name:    Search by crafter name (for Masterwork items)
  
Auto-filters (quick chips):
  [Masterwork only] [Under 10K gold] [My level] [Element: {my main element}]
```

---

## 5. Price History & Market Data

```
Price History Display:
  Each item has a "Market" tab showing:
    - 7-day price chart (candlestick: high/low/avg)
    - 30-day price trend line
    - Current lowest price + quantity available
    - 24h volume (how many sold)
    
  Data refresh: 15 min cache (not real-time, saves DB load)
  
  Price history stored: 90 days rolling (seasonal data)
  
  "Market Watch" feature:
    Player can bookmark up to 10 items
    Price alert: "Notify when Iron Ore < 500g" → push notification
    
Data shown to sellers:
  "Recommended price: {X}g" (auto-calculated from last 24h average ×0.95)
  "Recent sales: {N} units at {avg}g in last 24h"
  "Your listing will be #{rank} cheapest" (price rank preview)
```

---

## 6. Anti-Manipulation Systems

### 6.1 Price Manipulation Detection

```
Anti-Cornering (single player buying all supply):
  Max purchase per item per hour: 1,000 units (prevents instant cornering)
  Cooldown after buying 500 units: 30 min before buying more
  
  Flag: Single player buys > 80% of item supply in 60 min
    → Auto-flag for GM review
    → GM can see buyer's purchase history
    
Anti-Wash Trading (buy from self via alt):
  Same IP + purchase from same player → flag
  Alt account detection (existing security layer)
  Transaction voided if wash trade confirmed
  
Anti-Price-Fixing (collusion):
  Unusual spike detection: item avg price × 5 in 24h → alert GM Dashboard
  Natural cause check: Was there a Gathering event? (explains herb price spike)
  GM can set temporary price cap on specific items during manipulation
```

### 6.2 Anti-Inflation Controls

```
Tax as Inflation Control:
  8% tax per transaction removes gold from economy
  High-turnover items (potions, herbs): multiple transactions = more tax removed
  
  At 100K players × 10 AH transactions/day × avg 5,000g/transaction:
    Daily AH gold volume: 5 billion gold
    8% tax = 400M gold/day removed from economy → significant sink
    
Price Floor (server-set on essential items):
  Some crafting materials have minimum AH price (prevents devaluation):
    Spirit Food: 5,000g minimum (protects crafting economy)
    Common Enhancement Stone: 2,000g minimum
  Price floor is LiveOps-adjustable via remote_config
  
Price Ceiling (emergency lever):
  GM can set temporary price cap on specific item (e.g., during exploit flood)
  Automatic listing: items above cap get capped (refund difference to seller)
  Notified to all: "[GM Notice] Temporary price cap on {item}: {max}g"
```

### 6.3 Exploit Prevention

```
Duplicate Item Prevention:
  Item instance_id tracked (each item has unique UUID)
  Listing creates item_in_escrow record
  Sale transfers ownership atomically (DB transaction)
  Server validates item exists in escrow before sale completes
  
Race Condition (two buyers simultaneously):
  SELECT FOR UPDATE on listing row → only one buyer wins
  Second buyer: "Item sold out" → UI refreshes to next cheapest
  
Idempotency:
  Buy request has UUID idempotency key
  Retry sends same UUID → server deduplicates → one charge only
  
Rollback:
  If delivery fails (inventory full): Gold refunded, item stays listed
  Transaction atomicity guaranteed at DB level
```

---

## 7. AH Economy Integration

```
AH + Enhancement System:
  Enhancement Stones on AH → core demand driver
  Players who fail enhancement → buy more stones → AH demand spike
  Blacksmiths craft stones → sell on AH → gold flows player-to-player
  
AH + Crafting System:
  Masterwork items → premium AH price
  Crafter name shown in listing → brand reputation
  Materials market: Herb, Ore, Fish → stable demand from Crafters
  
AH + Gathering System:
  Gatherers primary AH sellers (materials)
  AH price signals → guides where players gather (high price biome = more visitors)
  
AH + Seasonal Events:
  Seasonal herbs (Sunbloom, Frostpetal) → price spikes in season
  Event Tokens NOT tradeable (prevents proxy event rewards)
  Event cosmetics (post 30d lockout) → cosmetic AH market
  
Gold Flow via AH:
  AH is PRIMARY gold redistribution mechanism (player-to-player)
  Server only injects gold via monster kills/quests
  AH recirculates gold + removes 8% per cycle → healthy economy
```

---

## 8. Mobile UX

```
Mobile AH Optimizations:
  Default view: "Popular Items" tab (pre-filtered top 20 by volume)
  Quick buy: Double-tap = buy lowest listing (confirm 1 tap)
  Quick sell: Item → long-press → "Sell on AH" → auto-fills recommended price
  
  "Sell Stack" feature: All 50 Iron Ore at once with one price (not list individually)
  
  Saved searches: 3 saved search configs (e.g., "Rare Weapons under 50K")
  
  Watchlist widget: 5 tracked items shown on AH home (price + trend arrow)
  
  Pagination: 20 items per page, lazy-load on scroll
  AH loads: < 500ms (Redis cache for popular searches)
```

---

## 9. Database Schema

```sql
CREATE TABLE ah_listings (
    listing_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id       BIGINT NOT NULL REFERENCES players(player_id),
    item_id         VARCHAR(64) NOT NULL,
    item_instance_id UUID NOT NULL UNIQUE,    -- unique item UUID (anti-dupe)
    item_data_json  JSONB NOT NULL,            -- enhancement, quality, affixes
    quantity        INT NOT NULL DEFAULT 1,
    price_per_unit  BIGINT NOT NULL,
    listing_fee_paid BIGINT NOT NULL,         -- 3% upfront
    status          VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
                    -- ACTIVE, SOLD, EXPIRED, CANCELLED
    listed_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMP NOT NULL,
    sold_at         TIMESTAMP,
    buyer_id        BIGINT
);

CREATE TABLE ah_price_history (
    item_id         VARCHAR(64) NOT NULL,
    recorded_date   DATE NOT NULL,
    avg_price       BIGINT NOT NULL,
    min_price       BIGINT NOT NULL,
    max_price       BIGINT NOT NULL,
    volume          INT NOT NULL DEFAULT 0,
    PRIMARY KEY (item_id, recorded_date)
) PARTITION BY RANGE (recorded_date);

CREATE TABLE ah_watchlist (
    player_id       BIGINT NOT NULL,
    item_id         VARCHAR(64) NOT NULL,
    alert_below_price BIGINT,               -- null = no alert
    added_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, item_id)
);

CREATE TABLE ah_manipulation_flags (
    id              BIGSERIAL PRIMARY KEY,
    player_id       BIGINT NOT NULL,
    flag_type       VARCHAR(32) NOT NULL,  -- CORNERING/WASH_TRADE/PRICE_SPIKE
    item_id         VARCHAR(64),
    details_json    JSONB NOT NULL,
    detected_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    reviewed        BOOL NOT NULL DEFAULT FALSE,
    reviewed_by_gm  BIGINT
);

-- Indexes for performance:
CREATE INDEX idx_ah_listings_item_status ON ah_listings(item_id, status, price_per_unit)
    WHERE status = 'ACTIVE';
CREATE INDEX idx_ah_listings_seller ON ah_listings(seller_id, status);
CREATE INDEX idx_ah_listings_expires ON ah_listings(expires_at) WHERE status = 'ACTIVE';
CREATE INDEX idx_ah_price_history_item ON ah_price_history(item_id, recorded_date DESC);
```

---

## 10. Network Packets

```
AHSearch            = 0x1000  // C2S: { filters, page, sort }
AHSearchResults     = 0x1001  // S2C: { listings[], total_count, my_listings_count }
AHListItem          = 0x1002  // C2S: { item_instance_id, qty, price, duration_h }
AHListResult        = 0x1003  // S2C: { listing_id, fee_paid, expires_at }
AHBuyItem           = 0x1004  // C2S: { listing_id, qty, idempotency_key }
AHBuyResult         = 0x1005  // S2C: { success, gold_spent, item_delivered }
AHCancelListing     = 0x1006  // C2S: { listing_id }
AHCancelResult      = 0x1007  // S2C: { item_returned_to_mail }
AHPriceHistory      = 0x1008  // C2S: { item_id, days }
AHPriceData         = 0x1009  // S2C: { history[] }
AHMyListings        = 0x100A  // C2S: request my active listings
AHWatchlistSet      = 0x100B  // C2S: { item_id, alert_price }
AHPriceAlert        = 0x100C  // S2C: price alert triggered (push + in-game)
AHSoldNotification  = 0x100D  // S2C: your item sold (on login if offline)
```

---

## 11. Save Data (minimal)

```csharp
// No new save data in player core — AH state is DB-authoritative
// Only: listing count for UI badge
public class AHSaveData {
    public int activeListingCount;     // badge: items currently listed
    public int pendingGoldInMailbox;   // AH sales waiting in mail
    public List<string> watchlistItemIds; // max 10 items
}
```

---

## 12. Analytics

```
ah_listing_created:   { item_id, quantity, price, category, listing_fee }
ah_item_sold:         { item_id, quantity, price, listing_duration_h, seller_id }
ah_listing_expired:   { item_id, quantity, price, listing_duration_h }
ah_search_query:      { filters_used, results_count, result_clicked }
ah_price_alert_fired: { item_id, alert_price, current_price }
ah_manipulation_flag: { flag_type, item_id, player_id }
```

---

*Document: AUCTION_HOUSE_DETAILED.md | Version: 1.0 | Date: 2026-06-14*
*Tax: 3% listing + 5% sale = 8% gold sink | 30 listings base (100 VIP8+)*
*Anti-manipulation: cornering/wash-trade/price-spike detection*
*Compatible: Economy V6 | Crafting | Gathering | Enhancement | ShopService*
