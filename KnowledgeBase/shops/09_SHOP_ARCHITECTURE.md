# SHOP ARCHITECTURE DESIGN — Slime MMORPG Production Bible
> Game: Slime MMORPG | System: Shop Architecture | Version: 1.0 | Date: 2026-06-14
> GAP: GAP-16 MEDIUM | shop_db.json define 23 static shops, thiếu rotation logic

---

## 1. Purpose & Design Goals

- **Economy Sink**: Shops là primary gold/currency sink mechanism
- **Content Discovery**: NPC shops introduce items player chưa biết
- **Rotation Engine**: Tạo urgency "mua hôm nay kẻo hết" mà không tạo FOMO độc hại
- **is_power Invariant**: Mọi item bán bằng premium_gem phải is_power = false
- **KHÔNG viết lại NPCDialogManager.cs** — chỉ design rotation layer on top

---

## 2. Shop Types

| Type | Count | Currency | Rotation | Description |
|---|---|---|---|---|
| NPC Static | 8 | gold | None | Permanent basic items |
| NPC Rotating | 6 | gold | Daily/Weekly | Limited stock, refresh |
| Guild Shop | 1 | guild_coin | Weekly | Member-only items |
| Event Shop | 3 | event_token | Per-Event | Event-exclusive |
| Season Shop | 2 | season_token | Per-Season | Season exclusive |
| Premium Shop | 3 | premium_gem | Monthly | Cosmetic ONLY (is_power=false) |
| **Total** | **23** | | | Match shop_db.json |

---

## 3. NPC Static Shops (8 shops)

Không rotate. Available 24/7. Sell basic consumables và materials.

**Shop List:**

| Shop ID | NPC | Location | Items Sold |
|---|---|---|---|
| shop_001 | General Merchant | Biome 1 Hub | Potions, repair kits, basic materials |
| shop_002 | Weapon Smith | Biome 1 Hub | Basic weapons T1-T3 |
| shop_003 | Armor Smith | Biome 1 Hub | Basic armor T1-T3 |
| shop_004 | Alchemist | Biome 3 Hub | Advanced potions, elixirs |
| shop_005 | Rune Crafter | Biome 5 Hub | Basic runes T1-T2 |
| shop_006 | Housing Merchant | Player Housing | Furniture basics |
| shop_007 | Pet Merchant | Biome 7 Hub | Pet food, basic pet equipment |
| shop_008 | Dungeon Provisioner | Dungeon Entrance | Dungeon consumables |

**Stock Rules:** Infinite stock. Gold cost only. No is_power violation possible (no premium_gem).

---

## 4. NPC Rotating Shops (6 shops)

Có rotation timer và limited stock.

| Shop ID | NPC | Currency | Rotation | Daily Stock |
|---|---|---|---|---|
| shop_rot_001 | Wandering Merchant | Random biome | Daily 00:00 UTC | 5 items, 3 each |
| shop_rot_002 | Rare Materials Trader | Biome 3 | Weekly Mon 00:00 | 8 items, 2 each |
| shop_rot_003 | Equipment Dealer | Biome 6 | Daily | 10 items (random rarity) |
| shop_rot_004 | Skill Book Vendor | Guild Hall | Weekly | 4 mastery items |
| shop_rot_005 | Relic Trader | Biome 10 | Weekly | 3 relics, 1 each |
| shop_rot_006 | Enchantment Vendor | Biome 15 | Daily | 6 enhancement materials |

**Rotation Logic:**
```
ShopRotationManager.GenerateRotation(shopId, rotationType):
  - Pull from rotation_pool (defined per shop in shop_db.json)
  - Apply rarity weights: Common 50%, Uncommon 30%, Rare 15%, Epic 4%, Legendary 1%
  - Assign daily stock quantity
  - Store rotation state in shop_rotation_state table
  - Broadcast S2C_ShopRefresh to nearby players
```

---

## 5. Guild Shop (1 shop)

| Currency | guild_coin |
|---|---|
| Access | Guild members only (verify server-side) |
| Rotation | Weekly (Monday reset) |

**Items (Weekly Pool — 8 items per week, rotate từ 40 item pool):**

| Item | Giá gc | is_power | Type |
|---|---|---|---|
| Emblem Skin A/B/C | 200-500 | false | Cosmetic |
| Chat Badge Gold | 150 | false | Cosmetic |
| Guild Hall Teleport x5 | 50 | false | Utility |
| EXP Potion Small x3 | 40 | false | Consumable |
| Repair Kit x5 | 60 | false | Consumable |
| Craft Material Bundle | 80 | false | Material |
| Inventory Expansion (7d) | 120 | false | Utility |
| Avatar Frame (seasonal) | 300 | false | Cosmetic |

**INVARIANT CHECK:** Mọi guild shop item: is_power = false. Server validate trước khi add to shop catalog.

---

## 6. Event Shop (3 shops)

Mỗi event có dedicated shop. Available trong event duration.

**Event Shop Structure:**

| Item Type | Giá event_token | is_power | Notes |
|---|---|---|---|
| Event Exclusive Cosmetic | 200-1000 | false | Available only during event |
| Permanent Cosmetic | 500-2000 | false | Added to wardrobe |
| Consumable Bundle | 30-100 | false | Limited qty per account |
| Event Title | 1000 | false | Permanent once earned |
| Craft Material | 50-150 | false | Weekly cap x5 |

---

## 7. Season Shop (2 shops)

| Shop | Currency | Rotation |
|---|---|---|
| Season Reward Shop | season_token | Active during season |
| Season Legacy Shop | season_token | Active 1 month after season end |

**Legacy Shop:** Cho phép player spend leftover season_token sau khi season end, nhưng chỉ cho items từ previous season.

---

## 8. Premium Shop (3 shops) — CRITICAL INVARIANT

**INVARIANT: Mọi item bán bằng premium_gem PHẢI is_power = false.**

| Shop | Items |
|---|---|
| Premium Cosmetic Shop | Avatar frames, name effects, chat colors, mount skins |
| Premium Convenience Shop | Inventory slot expansion (30d), AH listing fee discount (30d) |
| Premium Bundle Shop | Value bundles (cosmetic packs) |

**Catalog Validation:**
```
OnAddPremiumShopItem(item):
  if (item.is_power == true):
    REJECT — log violation — alert admin
  else:
    ADD to catalog
```

**Absolute Ban List (cannot appear in premium shop):**
- Equipment with combat stats
- Skill power enhancers
- Enhancement materials
- Anything that increases DPS/HP/DEF directly

---

## 9. Shop State Persistence

```
TABLE shop_rotation_state
  shop_id           VARCHAR(32)   PK
  rotation_id       UUID
  rotation_start    TIMESTAMP
  rotation_end      TIMESTAMP     -- null for static
  items             JSONB         -- [{itemId, price, stock_remaining, stock_max}]
  sold_counts       JSONB         -- {itemId: count}

TABLE shop_purchase_log
  purchase_id       UUID          PK
  player_id         BIGINT        FK
  shop_id           VARCHAR(32)
  item_id           VARCHAR(32)
  quantity          INT
  currency_type     VARCHAR(32)
  currency_amount   BIGINT
  purchased_at      TIMESTAMP
```

---

## 10. Economy Integration

**Gold Sinks:**
- NPC Static shops: casual daily spending (potions, repairs)
- NPC Rotating shops: targeted spending (rare materials)
- Dungeon Provisioner: pre-dungeon spending

**guild_coin Sinks:**
- Guild Shop (primary sink for guild_coin)

**event_token Sinks:**
- Event Shop (primary sink)
- Enough items to spend most tokens in event period

**season_token Sinks:**
- Season Shop + Legacy Shop

**premium_gem Sinks:**
- Premium Shop (cosmetic) + Gacha Banner (primary)

---

## 11. Network Requirements

| Packet | Direction | Description |
|---|---|---|
| C2S_ShopOpen | C→S | Open shop (shopId) |
| S2C_ShopData | S→C | Shop catalog + rotation state |
| C2S_ShopBuy | C→S | Purchase (shopId, itemId, qty) |
| S2C_ShopBuyResult | S→C | Success/fail + updated stock |
| S2C_ShopRefresh | S→C | Push: shop rotated (daily/weekly) |
| C2S_GuildShopOpen | C→S | Open guild shop (validate membership) |

---

## 12. Anti-Exploit Rules

| Rule | Protection |
|---|---|
| Stock manipulation | Stock count tracked server-side, client không trust |
| Race condition buying | DB row lock khi decrement stock |
| Guild shop bypass | Guild membership verified server-side on every purchase |
| is_power bypass | Server validate catalog entry trước mỗi purchase |
| Price manipulation | Client không send price — server lookup từ catalog |
| Duplicate purchase | Idempotency key (UUID RequestId) per purchase |

---

*Document: 09_SHOP_ARCHITECTURE.md | Version: 1.0 | Date: 2026-06-14*
*Dependencies: NPCDialogManager, GuildManager, EconomySinkManager, BannerManager*
