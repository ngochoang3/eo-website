# MONETIZATION — VIP, COSMETICS, SHOP SYSTEMS (10-12, 16-17)
> Game: Slime MMORPG | Date: 2026-06-14
> Systems: VIP, Cosmetic Shop, Limited Shop, Whale System, Event Monetization, Housing/Pet Monetization

---

## SYSTEM 10 — VIP SYSTEM

### 10.1 VIP Philosophy

VIP = Quality of Life upgrades. NEVER damage upgrades.
VIP XP = lifetime investment tracking. Never reset.

### 10.2 VIP XP Sources

| Source | VIP XP Earned |
|---|---|
| $1 USD spent | 1 VIP XP |
| Battle Pass Premium | +10 VIP XP bonus |
| Monthly Card (any) | +5 VIP XP/month active |
| Weekly Pass completion | +2 VIP XP/week |
| First Recharge | +10 VIP XP bonus |

### 10.3 VIP Level Table

| VIP Level | XP Required | Key Perk | Extra |
|---|---|---|---|
| VIP 1 | 5 XP ($5) | Inventory +10 slots | Daily 5 Diamond |
| VIP 2 | 20 XP ($20) | AH listings +5 | Dungeon queue skip |
| VIP 3 | 50 XP ($50) | Teleport cost −20% | Daily 10 Diamond |
| VIP 4 | 100 XP ($100) | AFK income +10% | Housing income +5% |
| VIP 5 | 200 XP ($200) | Dungeon Tickets cap +2/day | Inventory +20 slots |
| VIP 6 | 350 XP ($350) | Crafting queue +1 slot | Daily 20 Diamond |
| VIP 7 | 600 XP ($600) | AH commission −1% | Guild contribution cap +10% |
| VIP 8 | 1,000 XP ($1,000) | Market listing speed × 2 | Pet stable +1 slot |
| VIP 9 | 2,000 XP ($2,000) | AFK income +20% (total) | VIP Lounge access |
| VIP 10 | 3,500 XP ($3,500) | Dedicated support slot | Exclusive "VIP 10" nameplate |
| VIP 11 | 5,000 XP ($5,000) | Exclusive VIP Housing Theme | Monthly 100 Prestige Coin |
| VIP 12+ | +2,000/level | Exclusive title per level | — |
| VIP ∞ | Uncapped | Level display only (above 12) | Cosmetic milestone badges |

### 10.4 VIP Perk Detail (NON-POWER)

**Inventory Bonus:**
- VIP 1: +10 slots = can carry more items (convenience)
- VIP 5: +20 more = total +30 extra slots
- NOT power: inventory size doesn't affect combat

**AFK Income +10% / +20%:**
- VIP 4: AFK gold income ×1.1
- VIP 9: AFK gold income ×1.2 (cumulative)
- Economy check: Gold AFK already capped at 8h → maximum additional gold = 20% of 8h cap

At Level 1000, cap = ~200K gold/8h. VIP 9 user gets +40K gold/day.
F2P gets 200K/day; VIP9 gets 240K/day.
Gold sink more than covers this (AH tax, enhancement, housing).
**VERDICT: Acceptable QoL, not P2W.**

**Dungeon Ticket +2/day (VIP 5):**
- Base: 6 tickets/day (refills 2/hr capped at 6)
- VIP5: 8 tickets/day
- Impact: +33% dungeon runs → faster gear progress, NOT pay-for-gear
- Mitigation: All dungeon gear also available via AH (player economy)
- **VERDICT: Mild P2W risk → Acceptable (convenience not advantage)**

**Teleport Cost −20% (VIP 3):**
- Standard teleport: 1,000-5,000 gold
- VIP3: 800-4,000 gold
- Impact: Gold savings (minor, not power)

**AH Commission −1% (VIP 7):**
- Standard: 5% (1% list + 4% sale)
- VIP7: 4% (1% list + 3% sale)
- Impact: Slightly more gold when selling → small advantage
- **VERDICT: Acceptable (already common in MMORPG)**

### 10.5 VIP UI Design

```
[VIP Panel]
  VIP Level badge (gold crown, animated)
  XP progress bar: current/next level XP
  Perks unlocked (checkmarks, locked perks greyed)
  Next perk preview: "VIP 4 — Unlock at $100 total spend"
  
[VIP Lounge] (VIP 9+)
  Separate social area on world map
  Exclusive NPC with special dialog
  Daily gift for VIP 9+ (cosmetic item or materials)
  Nameplate showing VIP level in chat
```

### 10.6 VIP Economy Analysis

VIP 9 requires $2,000 lifetime → player spent $2K → they deserve significant QoL.
AFK income bonus: max +40K gold/day at high level → game handles via gold sinks.
No diamond gifting from VIP (only Daily Diamond at VIP 1/3/6 = minor 5-20/day).

---

## SYSTEM 11 — COSMETIC SHOP

### 11.1 Shop Categories

**Permanent Cosmetic Shop (always available, refreshes monthly)**

| Category | Items Available | Price Range (Diamond) | Notes |
|---|---|---|---|
| Costume | 8-12 sets | 1,200-3,000 | Full outfit, male/female variants |
| Weapon Skin | 12-20 skins | 600-1,800 | Visual only, no stat change |
| Mount Skin | 6-10 skins | 800-2,000 | Mount appearance, same speed |
| Pet Skin | 8-15 skins | 400-1,200 | Per pet family |
| Pet Effect | 6-10 effects | 300-800 | Aura/trail/sparkle |
| Avatar Frame | 15-20 frames | 100-500 | Static + animated options |
| Nameplate | 10-15 plates | 150-400 | Background + text style |
| Chat Bubble | 8-12 bubbles | 80-200 | Per-message visual |
| Profile Decoration | 10-15 | 100-300 | Background, sticker, border |
| Skill Effect Skin | 4-8 skins | 800-2,000 | Visual of skill FX only |
| Housing Skin | 5-8 themes | 500-2,000 | External building appearance |
| Pet Emote | 6-10 emotes | 200-500 | Pet-specific animations |

### 11.2 Gacha Cosmetic Banner System

**Standard Cosmetic Banner (always active)**
- 100 Diamond per pull / 1,000 for ×10 pull
- Pity at 90 pulls (guaranteed Rare cosmetic)
- Banner contains: Avatar frames, chat bubbles, pet effects, accessories
- All items: is_power=false ✅

**Featured Cosmetic Banner (seasonal, limited)**
- 150 Diamond per pull / 1,400 for ×10 pull
- Featured: 1 Legendary Costume + 2 Rare items + 5 Common items
- Pity: 80 pulls for Featured item guaranteed (soft pity at 60)
- 50/50: First pity → 50% get Featured. If lose → guaranteed next pity
- Rate disclosure: MANDATORY (store compliance)

```
Standard Banner Rate Disclosure:
  Legendary:  0.6% (guarantee at 90 pulls)
  Epic:        5.0%
  Rare:        20.0%
  Common:      74.4%

Featured Banner Rate Disclosure:
  Featured Costume:  0.75% (soft pity 60, hard pity 80)
  Epic:               5.0%
  Rare:               25.0%
  Common:             69.25%
```

### 11.3 Archive Shop

After 2 seasons, limited items enter Archive:
- Price: 1.5× original diamond price (scarcity premium)
- Rotation: 10 items/month available in Archive
- Some items remain exclusive forever (never return) — stated at purchase

### 11.4 Bundle Cosmetics Value Ratio

```
Costume + Weapon Skin + Avatar Frame (bundle):
  Individual: 2,400 + 1,200 + 300 = 3,900 Diamond
  Bundle: 2,800 Diamond (28% discount)
  
Mount Skin + Pet Skin bundle:
  Individual: 1,600 + 800 = 2,400 Diamond
  Bundle: 1,800 Diamond (25% discount)
```

---

## SYSTEM 12 — LIMITED SHOP

### 12.1 Daily Shop

Resets 00:00 UTC. 6 slots, 3 discounted, 3 regular.

| Slot | Category | Discount | Duration |
|---|---|---|---|
| Flash Deal 1 | Random Common Cosmetic | -30% | 24h |
| Flash Deal 2 | Random Material Bundle | -20% | 24h |
| Flash Deal 3 | Stamina Pack | -25% | 24h |
| Regular 1 | Dungeon Ticket ×5 | — | 24h |
| Regular 2 | Pet Treat Pack | — | 24h |
| Regular 3 | Enhancement Stone Pack | — | 24h |

### 12.2 Weekly Shop

Resets Monday 00:00 UTC. Premium items at value pricing.

| Item | Price | Limit |
|---|---|---|
| Rare Costume | 1,800 Diamond | 1× per player |
| Featured Pet Skin | 1,200 Diamond | 1× per player |
| Mount Skin | 1,500 Diamond | 1× per player |
| Enhancement Fragment ×10 | 600 Diamond | 1× per player |
| Rare Housing Decor Box | 400 Diamond | 2× per player |
| Dungeon Key (Epic) ×3 | 300 Diamond | 3× per player |

### 12.3 Monthly Shop

Changes 1st of each month. Exclusive items not available elsewhere.

| Item | Price | Exclusivity |
|---|---|---|
| Monthly Exclusive Costume | 2,500 Diamond | THIS month only |
| Monthly Housing Theme | 1,200 Diamond | THIS month only |
| Monthly Pet Skin | 900 Diamond | THIS month only |
| Monthly Weapon Skin | 1,500 Diamond | THIS month only |
| Limited Title (3 available) | 300-800 Diamond | THIS month only |

Monthly exclusives enter Archive after 12 months.

### 12.4 Flash Sale (48h, 3× per month)

```
Flash Sale Event:
  Duration: 48 hours
  Timing: Weekends (Friday 18:00 UTC - Sunday 18:00 UTC)
  Discount: 30-50% off selected items
  Items: Previous season cosmetics, limited quantity
  Limit: 1× each item per player per sale
  Notification: Push notification 1h before sale starts
```

### 12.5 Festival Bundle

| Festival | Bundle Content | Price | Availability |
|---|---|---|---|
| Lunar New Year | Dragon Mount Skin + CNY Costume + Housing Lantern Set | $29.99 | 2 weeks |
| Halloween | Ghost Pet Skin + Spooky Housing Set + Halloween Frame | $19.99 | 2 weeks |
| Christmas | Reindeer Mount + Elf Costume + Xmas Housing Theme | $29.99 | 2 weeks |
| Summer | Beach Outfit + Surfboard Weapon Skin + Beach Housing | $19.99 | 3 weeks |

---

## SYSTEM 16 — WHALE SYSTEM

### 16.1 Top-up Ranking

Weekly ranking based on diamond purchased (not spent):

| Rank | Weekly Prize | Extra |
|---|---|---|
| Rank 1 | "Week's Top Patron" title + 1,000 Prestige Coin + 500 Diamond | Shown in server |
| Rank 2-3 | 500 Prestige Coin + 300 Diamond | — |
| Rank 4-10 | 200 Prestige Coin + 100 Diamond | — |
| Rank 11-30 | 100 Prestige Coin + 50 Diamond | — |
| Rank 31-50 | 50 Prestige Coin | — |

**Anti-P2W**: Prestige Coin = cosmetic only. Diamond = cosmetic only.
Rank 1 visible to server → social status (not power).

Monthly ranking: Similar structure with Exclusive "Month's Patron" nameplate.

### 16.2 Prestige Exclusive Cosmetics (is_power=false)

Items ONLY available via Prestige Coin or Lifetime Recharge milestones:

| Item | Prestige Coin | Notes |
|---|---|---|
| "Void Walker" Costume | 2,000 | Unique model not in any shop |
| "Celestial Dragon" Mount | 3,000 | Animated particle trail |
| "Soul Phoenix" Pet Costume | 1,500 | Wing spread animation |
| "God's Eye" Weapon Skin | 2,500 | Glowing eye weapon effect |
| Custom Chat Color | 500 | Unique color not in base colors |
| "Patron of the World" Title | 800 | Golden animated text |
| Animated Avatar Border | 1,200 | Full animated frame |
| Guild Hall Prestige Banner | 1,000 | Displayed in guild hall |

### 16.3 Prestige Frame System

Different frame styles show spending commitment:
- Bronze Frame: Lifetime $100
- Silver Frame: Lifetime $500
- Gold Frame: Lifetime $1,000
- Platinum Frame: Lifetime $3,000
- Diamond Frame: Lifetime $5,000
- Void Frame: Lifetime $10,000

Frames are cosmetic indicators. Do NOT convey power.

### 16.4 Whale Protection

- Monthly spend cap warning: If player spends >$500 in 30 days → soft warning popup
- Spending review: Backend flags accounts spending >$1,000 in 7 days for review
- Refund policy: 24h refund window on any purchase (then standard store policy)
- Minor protection: Age verification for accounts purchasing >$100/month

---

## SYSTEM 17 — EVENT MONETIZATION

### 17.1 Lucky Draw (Event Gacha)

Seasonal lucky draw with guaranteed item at milestone:

```
Lucky Draw Structure:
  Cost: 200 Diamond per draw / 1,800 for ×10
  Pool: Event-exclusive cosmetics (is_power=false)
  Guaranteed: After 50 draws → guaranteed featured item (rate up cosmetic)
  Pity carries over within event (resets after event ends)
  
Rate Disclosure (mandatory):
  Featured Event Costume: 1.0%
  Rare Event Items:        15.0%
  Uncommon Items:          35.0%
  Common Items:            49.0%
```

### 17.2 Festival Event Monetization

**Template per Festival (4× per year):**

| Revenue Product | Price | Notes |
|---|---|---|
| Festival Battle Pass | $7.99 (30 days) | 40 levels, festival rewards track |
| Festival Bundle | $19.99 | Costume + Mount + Housing + Diamond |
| Festival Daily Recharge | $5 / $10 / $20 | Festival-themed bonus items |
| Festival Lucky Draw | 200/draw | Festival-exclusive cosmetics |
| Festival Monthly Card | $9.99 | Double festival token earn rate |

### 17.3 Anniversary Event (Year 1+)

Every server year: 1-month anniversary event.

```
Anniversary Revenue:
  - Anniversary Bundle (all-in-one): $49.99
    Contains: Year N costume + Mount + Pet + Housing + Frame + Title
  - Anniversary Lucky Draw: event-exclusive historical skins (return of old limited)
  - Anniversary Battle Pass: $14.99 (mega rewards, 60 days)
  - Diamond Double Campaign (3 days only): 2× on all diamond packs
```

### 17.4 Limited Collaboration Event

If IP collaboration occurs:

```
Collaboration products:
  - Collab Costume Pack: $24.99 (unique IP-inspired designs)
  - Collab Pet Skin: $9.99
  - Collab Lucky Draw: 150/draw (IP-themed cosmetics)
  - Collab Bundle: $39.99 (full set)
  
Compliance: IP holder approval required for all designs
Duration: 2-4 weeks
Return policy: Collab items NEVER return to Archive (IP agreement)
```

---

## HOUSING MONETIZATION

### Housing Pass — $9.99 / season

| Content | Details |
|---|---|
| Instant Housing Coin | 500 Housing Coin |
| Seasonal Furniture Set | 10 exclusive seasonal pieces |
| Daily Housing Coin | 20/day for 30 days = 600 more |
| Housing Rating Bonus | +5% rating score during season |
| Exclusive Building Skin | 1 exterior skin for housing |
| "Housing Patron" profile badge | Cosmetic |

Housing Pass does NOT affect combat. Rating bonus = better ranking/cosmetic recognition.

### Furniture Shop

| Category | Items | Price (Diamond) |
|---|---|---|
| Seasonal Furniture Sets | 6-10 items/season | 200-800/item |
| Prestige Furniture (animated) | 3-5 items | 800-2,000 |
| Biome Exclusive Furniture | 2-3/biome rotation | 300-600 |
| Festival Furniture | Event-only | 150-500 |
| Guild Hall Furniture | Guild building items | 400-1,200 |

Housing furniture is purely decorative — rating bonus is cosmetic (rankings, not power).

### Housing Battle Pass — $14.99 / season

Separate from main Battle Pass. Only Housing XP:
- 60 levels of housing-exclusive content
- Housing Coin (100-500/level)
- Exclusive furniture not available elsewhere
- Housing-themed Avatar Frame at Level 60

---

## PET MONETIZATION

### Pet Cosmetic System

| Product | Price | Notes |
|---|---|---|
| Pet Skin (per pet family) | 400-1,200 Diamond | Visual only, same pet stats |
| Pet Costume | 300-800 Diamond | Outfit overlay on pet |
| Pet Effect (Aura/Trail) | 200-500 Diamond | Particle effect |
| Pet Emote Pack | 150-300 Diamond | 3-5 emotes per pack |
| Pet Name Plate | 100-200 Diamond | Display tag above pet |
| Pet House Decoration | 200-400 Diamond | Housing pet stable cosmetic |

### Pet Collection Album

```
Pet Collection Album Feature:
  Players display their pet collection in Housing
  Premium Album Slot: 100 Diamond per extra display slot (base 6, max 20)
  Album Skin: 500 Diamond (decorative frame for the display)
  
Collection album score contributes to Housing Rating (minor)
```

### Pet Name Change

- 300 Diamond per rename
- First rename free on any pet captured

### Pet Prestige

After pet reaches max loyalty (100):
- Prestige Activation: 500 Diamond
- Pet gets animated aura effect
- "Prestige" badge visible in pet icon
- Stats UNCHANGED (same pet, different visual)

---

## CROSS-SERVER MONETIZATION

### Cross-Server Season Pass — $19.99

Only available during Cross-Server events:
- Cross-Server exclusive cosmetic (never available on local server)
- Cross-Server ranking frame
- 2,000 Cross-Server Token (for Cross-Server Shop)

### Cross-Server Shop

| Item | Cross-Server Token | Notes |
|---|---|---|
| Cross-Server Exclusive Title | 1,000 | "World Champion" etc |
| Cross-Server Mount Skin | 2,500 | Unique model |
| Cross-Server Guild Banner | 500/month | Monthly subscription |
| Cross-Server Profile Badge | 300 | Rank-specific |

Cross-Server tokens earned by participation, also purchasable at 100 Diamond = 100 token.
All items: is_power=false ✅

---

## PLAYER ECONOMY MONETIZATION

### Marketplace Tax System

```
AH Transaction Tax:
  Listing fee:     1% of starting price (non-refundable)
  Sale commission: 4% of final sale price
  
  Total gold sink per transaction: 5%
  Anti-inflation: All taxes are gold destroyed (not redistributed)
```

### Premium AH Listing

- VIP 2+: +5 extra AH listing slots
- Diamond Listing: 30 Diamond → Featured slot (top of search results, 24h)
- Premium Buyout: Player can offer 10 Diamond to seller for priority buyout

### Housing Visitor System

```
Visitor Monetization:
  - Housing Showcase Fee: 0 Diamond (free to visit)
  - "Tip Jar" furniture: Visitors can tip 10-100 housing_coin (cosmetic social feature)
  - Featured Housing: 200 Diamond/week to appear at top of Housing Directory
  
Revenue: Featured Housing listings (server-wide, ~50 slots/week)
```

### Creator Economy (Future Phase)

```
Player Decoration Trading:
  Players with Housing designer skill can sell custom decoration LAYOUTS
  Platform: In-game "Design Market"
  Cut: 10% platform fee per design sale
  Price: 50-500 gold (F2P friendly)
  
This creates F2P content while driving social engagement
```

---

*Document: MONETIZATION_VIP_COSMETICS.md | Version: 1.0 | Date: 2026-06-14*
*Covers: Systems 10-12, 16-17, Housing Monetization, Pet Monetization, Cross-Server, Player Economy*
