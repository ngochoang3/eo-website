# MONETIZATION — PASS SYSTEMS (6-9 + Seasonal)
> Game: Slime MMORPG | Date: 2026-06-14
> Systems: Daily Login Pass, Weekly Pass, Monthly Card, Battle Pass, Seasonal Revenue

---

## SYSTEM 6 — DAILY LOGIN PASS

### 6.1 Design Intent

Login Pass là sản phẩm subscription ngắn hạn. Mục tiêu: mỗi ngày login có thưởng ngay lập tức, tạo habit loop.

### 6.2 Pass Tiers

**Silver Login Pass — $2.99 / 7 days**

| Day | Reward |
|---|---|
| Day 1 | 50 Diamond + Stamina ×60 |
| Day 2 | 30 Diamond + Dungeon Ticket ×2 |
| Day 3 | 50 Diamond + Common Enhancement Stone ×1 |
| Day 4 | 30 Diamond + Pet Treat (Common) ×3 |
| Day 5 | 50 Diamond + Teleport Scroll ×3 |
| Day 6 | 30 Diamond + Gold Pack ×20,000 |
| Day 7 | 100 Diamond + Housing Coin ×100 + "7-Day Survivor" Badge |

Total: 340 Diamond + all items. Diamond value alone = $5+ → 1.7× ROI

**Gold Login Pass — $4.99 / 14 days**

| Days | Reward |
|---|---|
| Day 1-7 | Same as Silver Pass |
| Day 8 | 80 Diamond + Stamina ×120 |
| Day 9 | 60 Diamond + Dungeon Ticket ×3 |
| Day 10 | 80 Diamond + Uncommon Enhancement Stone ×1 |
| Day 11 | 60 Diamond + Pet Treat (Uncommon) ×2 |
| Day 12 | 80 Diamond + Rare Material Pack ×1 |
| Day 13 | 60 Diamond + Guild Coin ×300 |
| Day 14 | 150 Diamond + Rare Housing Decor ×1 + "Fortnight Warrior" Avatar Frame |

Total: 900 Diamond + all items. Value: ~$15 → 3× ROI

**Prestige Login Pass — $9.99 / 30 days**

Days 1-14: Same as Gold Pass
| Day 15-21 | +100 Diamond/day + Dungeon Key (Rare) ×1/day |
| Day 22-28 | +120 Diamond/day + Enhancement Fragment ×1/day |
| Day 29 | 200 Diamond + Exclusive Weapon Skin Fragment ×10 |
| Day 30 | 500 Diamond + Exclusive "Month Guardian" Avatar Frame + Housing Decor Pack |

Total: 3,500+ Diamond + exclusive cosmetics → $50+ value → 5× ROI

### 6.3 Missed Day Handling

```
Policy: GRACE SYSTEM (không phạt miss)
- Player misses day N → can claim day N on day N+1 (1-day grace)
- Cannot stack missed days (only 1 grace day active at time)
- After 2 consecutive misses → those days are lost
- Motivation: be lenient with casual players, reward daily players
```

### 6.4 Renewal Logic

```
Auto-renewal: NOT available (single purchase, no subscription)
Renewal discount: If player buys same pass within 24h of expiry → 20% off
Stack: Can purchase next pass while current is active (queued)
Overlap: If Gold Pass active, cannot purchase Silver (would be downgrade)
```

### 6.5 App Store Implementation

```
Product Type: Consumable (fixed duration, not auto-renew subscription)
ProductId:    login_pass_silver_7d, login_pass_gold_14d, login_pass_prestige_30d
Validation:   Server-side receipt validation before granting pass
```

---

## SYSTEM 7 — WEEKLY PASS

### 7.1 Pass Tiers

**Reset: Monday 00:00 UTC. Each pass active for 7 days from purchase.**

**Silver Weekly Pass — $1.99**

Daily reward (claim once per day for 7 days):
| Daily Claim | Reward |
|---|---|
| Diamond | 30/day = 210 total |
| Stamina | 60/day |
| Dungeon Ticket | 1/day |

Weekly milestone (claim once on day 7):
- 100 Diamond bonus
- "Weekly Silver" cosmetic badge

Total value: ~$5 → 2.5× ROI

**Gold Weekly Pass — $4.99**

Daily reward:
| Daily | Reward |
|---|---|
| Diamond | 60/day = 420 total |
| Stamina | 120/day |
| Dungeon Ticket | 2/day |
| Pet Treat (Common) | 1/day |

Weekly milestone:
- 200 Diamond bonus
- Housing Coin ×200
- "Weekly Gold" animated border

Total value: ~$12 → 2.4× ROI

**Platinum Weekly Pass — $9.99**

Daily reward:
| Daily | Reward |
|---|---|
| Diamond | 100/day = 700 total |
| Stamina | 200/day |
| Dungeon Ticket | 3/day |
| Pet Treat (Uncommon) | 1/day |
| Enhancement Stone | 1/day (every 2 days) |

Weekly milestone:
- 500 Diamond bonus
- Rare Housing Decor ×1
- Exclusive "Platinum Guardian" Avatar Frame
- Uncommon Enhancement Fragment ×2

Total value: ~$25 → 2.5× ROI

### 7.2 Currency Flow (Weekly Pass)

Weekly Pass injects diamond into economy at predictable rate:
- Silver: 310 diamond/week = $5 equivalent
- Gold: 620 diamond/week = $10 equivalent
- Platinum: 1,200 diamond/week = $20 equivalent

All diamond sinks are cosmetic → no combat inflation.

---

## SYSTEM 8 — MONTHLY CARD

### 8.1 Design Intent

Monthly Card là sản phẩm đơn vị revenue cao nhất vì nó tạo **habit loop 30 ngày**. Mục tiêu: player mua 1 lần → habit → mua tháng sau.

### 8.2 Monthly Card Tiers

**Basic Monthly Card — $4.99 / 30 days**

Instant on purchase:
- 300 Diamond (instant)
- 3× Dungeon Ticket
- Housing Coin ×100

Daily reward (claim once per day, 30 days):
| Daily | Amount |
|---|---|
| Diamond | 30/day |
| Stamina | 60/day |
| Dungeon Ticket | 0.5/day (every 2 days) |

Total diamond: 300 (instant) + 900 (daily) = 1,200 diamond in 30 days
Market value at $0.99/60 diamond: ~$19.80 → 4× ROI from $4.99

**Premium Monthly Card — $9.99 / 30 days**

Instant on purchase:
- 600 Diamond (instant)
- 5× Dungeon Ticket
- Housing Coin ×200
- Pet Treat (Uncommon) ×5

Daily reward:
| Daily | Amount |
|---|---|
| Diamond | 60/day |
| Stamina | 120/day |
| Dungeon Ticket | 1/day |
| Pet Treat (Common) | 1/day (every 2 days) |

Total diamond: 600 + 1,800 = 2,400 diamond/month
Market value: ~$39.60 → 4× ROI from $9.99

**VIP Monthly Card — $19.99 / 30 days**

Instant on purchase:
- 1,200 Diamond (instant)
- 10× Dungeon Ticket
- Housing Coin ×500
- Pet Treat (Rare) ×3
- AFK Boost Ticket ×3 (doubles AFK income for 1h each)

Daily reward:
| Daily | Amount |
|---|---|
| Diamond | 100/day |
| Stamina | 200/day |
| Dungeon Ticket | 2/day |
| Pet Treat (Common) | 1/day |
| Weekly: Enhancement Stone | ×1/week |

Total diamond: 1,200 + 3,000 = 4,200 diamond/month
Market value: ~$69 → 3.5× ROI from $19.99

### 8.3 Daily Stamina Injection Analysis

VIP Monthly Card: 200 stamina/day → 6,000/month
Base stamina cap: 240. Natural regen: 1/5min = 288/day

VIP player total: 288 + 200 = 488 stamina/day
F2P player: 288/day

Ratio: 1.7× more stamina. This means more content played, NOT more power.
Enhancement from more play: ~10-20% faster progression → acceptable QoL (not P2W)

### 8.4 Card Stack Policy

```
Only 1 monthly card active at a time
If buy Premium while Basic active → upgrade (pay difference, extend to 30 days from now)
Cannot downgrade (no refund)
Renewal reminder: 3 days before expiry
Renewal discount: 15% off if renew within 24h of expiry
```

### 8.5 App Store Product Type

```
Product Type: Auto-Renewable Subscription (preferred) OR Consumable
ProductId:    monthly_card_basic, monthly_card_premium, monthly_card_vip

NOTE: If using Auto-Renewable Subscription:
  - Must show subscription terms clearly
  - Cancelation instructions visible
  - Grace period: 3 days for failed renewal
  
Alternative: Non-renewing subscription (simpler for compliance)
  - Player must re-purchase manually
  - Preferred for markets with strict subscription regulation (JP, KR)
```

---

## SYSTEM 9 — BATTLE PASS

### 9.1 Season Design

```
Season Duration: 90 days
Battle Pass Levels: 80 levels
XP per level: 1,000 Battle XP
Daily XP available: ~1,500 Battle XP/day (from daily quests + activities)
Total XP available in 90 days: 135,000 XP → enough to complete all 80 levels with buffer
```

### 9.2 Track Design

**Free Track (all players, no purchase)**

Every 5 levels:
| Level | Free Reward |
|---|---|
| 5 | Season Token ×100 |
| 10 | Diamond ×50 |
| 15 | Dungeon Ticket ×3 |
| 20 | Pet Treat (Common) ×5 |
| 25 | Season Token ×100 |
| 30 | Housing Coin ×200 |
| 35 | Diamond ×100 |
| 40 | Season Token ×100 |
| 45 | Enhancement Stone ×2 |
| 50 | Diamond ×100 + Avatar Frame (Season exclusive, free) |
| 55 | Season Token ×150 |
| 60 | Dungeon Ticket ×5 |
| 65 | Pet Treat (Uncommon) ×3 |
| 70 | Diamond ×150 |
| 75 | Season Token ×200 |
| 80 | Season Title (exclusive, free track) |

Free Total: ~500 Diamond + 750 Season Token + QoL items + cosmetic frame + title

**Premium Track — $9.99 / season**

Every level (all 80) has a reward. Key highlights:
| Level | Premium Reward |
|---|---|
| 1 | Diamond ×100 (immediate, justify purchase) |
| 10 | Season Weapon Skin (exclusive) |
| 20 | Diamond ×200 |
| 30 | Season Pet Costume (exclusive) |
| 40 | Diamond ×200 + Season Token ×300 |
| 50 | Season Mount Skin (exclusive) — HIGHLIGHT |
| 60 | Diamond ×300 |
| 70 | Season Housing Decoration Set |
| 80 | Season Exclusive Costume (BEST reward) |

Premium Track also unlocks all Free Track rewards simultaneously.
Premium Total: ~2,000 Diamond + all season exclusive cosmetics + QoL items
Diamond value alone: ~$33 → 3.3× ROI from $9.99

**Elite Track — $24.99 / season**

Upgrade from Premium. Adds:
| Bonus | Reward |
|---|---|
| Instant 20 Battle Pass Levels | Skip first 200 quests |
| Elite Daily Mission | +50% more daily Battle XP |
| Elite Cosmetic Set | Exclusive alternate color for season costume |
| 3× Elite Item Boxes | Random rare cosmetic items |
| "Elite Seasonal" profile badge | — |

Elite Track at Level 1: starts at Level 21 → reaches 80 with minimal daily commitment.
Target: Busy whales who want pass completion without daily grind.

### 9.3 Mission System

**Daily Missions (3 per day):**
| Mission Type | XP Reward |
|---|---|
| Kill 50 monsters | 200 XP |
| Clear 1 dungeon | 300 XP |
| Gather 30 resources | 200 XP |
| Complete 3 guild missions | 250 XP |
| Trade in Auction House | 150 XP |
| Housing: place 3 furniture | 200 XP |
| Feed your pet 3 times | 150 XP |

**Weekly Challenges (5 per week):**
| Challenge | XP Reward |
|---|---|
| Kill World Boss | 1,000 XP |
| Complete 7 dungeons | 800 XP |
| Win 3 Guild activities | 600 XP |
| Reach Enhancement +7 | 500 XP |
| Earn 100K gold this week | 400 XP |

### 9.4 Catch-Up Mechanism

After Week 4 (Day 28+):
- "Catch-Up Quests" unlock: 2× XP from completing any activity
- Catch-Up Window: last 30 days of season
- Premium Mission Bonus: Elite track players get +50% XP
- Purchase Level Skip: Buy 10 level skip = 200 Diamond (cosmetic catch-up only)

### 9.5 Battle Pass Economy Impact

Season Token generation:
- Free track + Premium: ~750 + 1,200 = 1,950 tokens/season (if Premium)
- Season Token sink: Season Shop items 200-1,200 each
- Average player burns 800-1,500 tokens → slight surplus → cosmetic archive buying

Diamond generation from Battle Pass:
- Free: 500 Diamond/season
- Premium: 2,000 Diamond/season
- Revenue-positive: Diamond returns only happen at level milestones, not enough to recoup full cost

**VERDICT:** Battle Pass is economy-safe. No gold injection. No power items.

### 9.6 Product Config

```
BattlePassConfig:
    seasonId:           "S01_2026_Q3"
    seasonName:         "Season of Storms"
    startDate:          "2026-09-01"
    endDate:            "2026-11-30"
    maxLevel:           80
    xpPerLevel:         1000
    freeTrackRewards:   [array of BattlePassRewardDef]
    premiumTrackRewards:[array of BattlePassRewardDef]
    eliteBonus:         EliteBonusConfig
    missions:           [array of BattlePassMissionDef]
    weeklyChallenges:   [array of WeeklyChallengesDef]
```

---

## SYSTEM 15 — SEASONAL REVENUE SYSTEM

### 15.1 Season Design Cycle (90 days per season)

| Season | Theme | Special Cosmetic Set |
|---|---|---|
| S1 Spring | "Bloom Awakening" | Flower/nature motifs |
| S2 Summer | "Solar Blaze" | Fire/beach/adventure |
| S3 Autumn | "Harvest Moon" | Harvest/moon/mystery |
| S4 Winter | "Frost Kingdom" | Ice/snow/regal |

Each season: New Battle Pass + Season Shop + Season Bundle + Season Currency rotation

### 15.2 Season Bundle — $29.99 / season

Contains everything season-related in one purchase:
- Battle Pass Premium (80 levels)
- 20 Level Skip
- Season Exclusive Costume (alternate color)
- Season Mount Skin
- Season Pet Costume
- 3,000 Season Token
- 1,000 Diamond

Value: ~$55+ → 1.8× ROI (slightly lower than individual items because convenience premium)

### 15.3 Season Shop Rotation

| Category | Items | Price Range (Season Token) |
|---|---|---|
| Seasonal Cosmetics | 6-8 items | 400-1,200 |
| Housing Seasonal Decor | 8-12 items | 150-600 |
| Pet Seasonal Accessories | 4-6 items | 300-800 |
| Mount Seasonal Skin | 2-3 items | 800-1,200 |
| Titles | 3-5 items | 200-500 |
| Profile Decorations | 4-6 items | 200-400 |

Season Shop closes 7 days after season ends (urgency).
Archive: After 2 seasons, seasonal items return to "Archive Shop" (diamond purchase).

### 15.4 Season Currency Economy

```
Season Token Generation (Premium BP player):
    Battle Pass: 1,950 tokens/season
    Daily Quests: 100/day × 90 days = 9,000 tokens
    Weekly Challenges: 200/week × 13 weeks = 2,600 tokens
    Events: 1,000-2,000 tokens
    
    TOTAL: ~14,550-15,550 tokens/season

Season Shop Spending (full set):
    Cosmetic set (6 items):         2,400-7,200
    Housing decor (8 items):        1,200-4,800
    Pet accessories (4 items):      1,200-3,200
    Mount skin (1):                 800-1,200
    Titles (2):                     400-1,000
    
    TOTAL POSSIBLE: 6,000-17,400 tokens

Balance: Slight deficit for completionists → drives Diamond purchases for season token topups
F2P can afford most cosmetics → Completionists spend premium
```

---

## PASS SYSTEMS REVENUE MODEL

### Revenue Matrix (100K active players, mature server)

| Product | Price | % Players Buy | Revenue |
|---|---|---|---|
| Battle Pass Premium | $9.99 | 15% = 15,000 | $149,850 |
| Battle Pass Elite | $24.99 | 3% = 3,000 | $74,970 |
| Monthly Card Basic | $4.99 | 12% = 12,000 | $59,880 |
| Monthly Card Premium | $9.99 | 8% = 8,000 | $79,920 |
| Monthly Card VIP | $19.99 | 3% = 3,000 | $59,970 |
| Season Bundle | $29.99 | 5% = 5,000 | $149,950 |
| Weekly Pass Platinum | $9.99 | 5% = 5,000 | $49,950 |
| Login Pass Prestige | $9.99 | 4% = 4,000 | $39,960 |

**TOTAL PASS SYSTEMS: ~$664,450 per 90-day season for 100K players**
**Monthly Average: ~$221,000/month from passes alone**

---

*Document: MONETIZATION_PASS.md | Version: 1.0 | Date: 2026-06-14*
*Covers: Systems 6-9, System 15 (Seasonal Revenue)*
