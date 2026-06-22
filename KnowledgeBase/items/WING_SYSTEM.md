# WING SYSTEM ARCHITECTURE
> Game: Slime MMORPG | Date: 2026-06-14 | Version: 1.0
> Power Budget: 2% (LOCKED) | Source of Truth: systems/01_POWER_BUDGET.md
> Compatible: Damage Formula V10 | Element System | Economy System V6

---

## MANDATORY COMPATIBILITY CHECK

```
[Source of Truth]
  01_POWER_BUDGET.md     → wing budget_pct = 2.0% FIXED
  09_ELEMENT_CHART.md    → Element Resistance system used by Wing
  00_SAVE_DATA_SYSTEM.md → WingSaveData extends PlayerSave V8
  06_COLLECTION_CODEX_SYSTEM.md → Wings add to Collection

Wing DOES NOT:
  ✗ Increase ATK (wings are defensive/mobility, not offensive)
  ✗ Add SkillMult modifier
  ✗ Create ElementMult beyond 1.4 cap
  ✗ Add new element type (uses existing Fire/Water/Earth/Wind/Light/Dark)
  ✓ Extends: DEF%, HP%, Element Resistance (all existing stats)
  ✓ Utility: Glide (fall control) — NOT power budget
```

---

## 1. Design Philosophy

Wing hệ thống là "phòng thủ và bay" — đối trọng với Mount (tấn công và tốc độ):
1. **Defense Identity**: Wings tăng DEF và HP — phù hợp với theme "bảo vệ bằng cánh"
2. **Element Resistance**: Wing có element affinity → giảm elemental damage nhận vào
3. **Glide Utility**: Kỹ năng lướt (không bay) — utility không combat
4. **Visual Prestige**: Wings là status symbol, heavily cosmetic

**Core Pillars:**
- 30 Wings tổng (collection loop nhỏ hơn Mount, nhưng visual impact lớn hơn)
- Evolution System: 3 wings cùng tier → 1 tier cao hơn (consistent với Gem fusion)
- No P2W: Wing power chỉ từ gameplay, cosmetics bán riêng
- Element Affinity: mỗi wing có 1 element → cộng resist cho element đó

---

## 2. Power Budget Allocation (2% TOTAL)

```
Wing Power Budget: 2.0%
  
  DEF% bonus (max, all wings evolved + leveled):   0.8%
  HP% bonus (max):                                  0.7%
  Element Resistance bonus (max 1 element):         0.5%
  ─────────────────────────────────────────────────────
  TOTAL:                                            2.0% ✅

Element Resistance note:
  Wing element resist: -0.5% effective ElementMult FROM that element
  Example: Fire Wing → -0.5% Fire damage received
  Still bounded: EffectiveElementMult ≥ 0.7 (existing hard cap from 09_ELEMENT_CHART.md)
  Does NOT change attack ElementMult (only defense)

Power Formula:
  WingPower% = wing.elementTier × wing.starLevel/5 × wing.wingLevel/10 × 2.0%
  where: elementTier[Common]=0.3, [Uncommon]=0.5, [Rare]=0.7, [Epic]=0.85, [Legendary]=1.0
  
  Max (Legendary 5-star Lv10): 1.0 × 1.0 × 1.0 × 2.0% = 2.0% ← hard cap
  PowerBudgetManager.ValidateSystemMax(wingPower, "wing", 2.0f) → server enforced
```

---

## 3. Wing Collection (30 Wings)

### 3.1 Wings by Element Affinity

| Element | Wings | Resistance | Biome Theme |
|---|---|---|---|
| Fire | 5 | Fire Resist | Volcano, Desert, Ember Plains |
| Water | 5 | Water Resist | Ocean, River, Sunken Reef |
| Earth | 5 | Earth Resist | Forest, Ancient Forest, Crystal Cave |
| Wind | 5 | Wind Resist | Stormy Highlands, Celestial Peak, Sky Citadel |
| Light | 5 | Light Resist | Sacred Land, Sky Citadel peak |
| Dark | 5 | Dark Resist | Shadow Vale, Abyss, Phantom Crossing |

### 3.2 Wing Rarity

| Rarity | Count | Unlock |
|---|---|---|
| Common | 12 | 3 Common → 1 Uncommon (evolution) / Quest reward |
| Uncommon | 9 | 3 Uncommon → 1 Rare / Boss drop |
| Rare | 6 | 3 Rare → 1 Epic / Dungeon reward |
| Epic | 2 | 3 Epic → 1 Legendary / Event achievement |
| Legendary | 1 per element? | No. Only 2 Legendary wings total (cross-element) |

**2 Legendary Wings (special):**
```
"Archangel's Embrace" (Light/Wind dual affinity, Legendary)
  Unlock: "Celestial Guardian" world event (1×/server lifetime)
  Stats Lv10 5★: DEF +0.8%, HP +0.7%, Light+Wind Resist +0.25% each = 2.0%
  Visual: White-gold wings, 8 feathers, divine glow trail
  
"Void Sovereign's Wings" (Dark/Fire dual affinity, Legendary)
  Unlock: Complete "Abyss Conqueror" achievement (clear Abyss dungeon 100×)
  Stats Lv10 5★: DEF +0.8%, HP +0.7%, Dark+Fire Resist +0.25% each = 2.0%
  Visual: Black-crimson wings, ember particle trail
```

---

## 4. Wing Evolution System

### 4.1 Evolution Table (consistent với Gem Fusion từ systems/11_PITY_FAILSTACK.md)

```
Evolution path:
  3× Common (same element) → 1× Uncommon
  3× Uncommon (same element) → 1× Rare
  3× Rare (same element) → 1× Epic
  3× Epic → 1× Legendary (cross-element allowed)

Evolution preserves:
  - Star level resets to 1★ (evolving upgrades tier, not star)
  - Wing Level resets to 1
  - Skin applied is removed (returned to inventory)
  
Evolution requires:
  Common → Uncommon: 3 wings + 1,000 Gold
  Uncommon → Rare:   3 wings + 10,000 Gold + 1 Wing Crystal
  Rare → Epic:       3 wings + 100,000 Gold + 3 Wing Crystal + 1 Wing Core
  Epic → Legendary:  3 wings + 500,000 Gold + 10 Wing Crystal + 5 Wing Core
  
  Wing Crystal: Drops from Aerial/Flying bosses (rare)
  Wing Core: Drops from Epic+ event content
  
Gold Sink: Large gold requirement at high evolution tiers → economy sink
```

### 4.2 Star Upgrade (1★ → 5★)

```
Star upgrade: requires Wing Dust (material from dismantle)
  1★ → 2★: 10 Wing Dust
  2★ → 3★: 30 Wing Dust
  3★ → 4★: 80 Wing Dust
  4★ → 5★: 200 Wing Dust

Wing Dust sources:
  Dismantle duplicate wings: Common=1, Uncommon=3, Rare=10, Epic=30 dust
  Boss drop (rare): 5-15 dust
  Weekly wing dungeon reward: 20-50 dust
  
Star effect on power: starLevel/5 multiplier
  1★: 20% of max power
  3★: 60% of max power
  5★: 100% of max power
```

### 4.3 Wing Level (1-10)

| Level | XP Required | Power % |
|---|---|---|
| 1→2 | 800 | 10% |
| 3→4 | 4,000 | 30% |
| 5→6 | 15,000 | 50% |
| 7→8 | 35,000 | 70% |
| 9→10 | 70,000 | 100% |

**Total to max a Legendary 5★ wing:** ~160,000 Wing XP ≈ 4-5 months F2P

Wing XP Sources:
| Source | XP | Notes |
|---|---|---|
| Wing Essence (craft) | 200 XP | Herbalism L20 + Mining L15 recipe |
| Boss kill (wing's element biome) | 30 XP | Passive when wing equipped |
| Wing Dungeon (weekly) | 500-2,000 XP | Wing-themed weekly event |
| Daily Wing Meditation | 80 XP/day | Click wing → animation → XP |

---

## 5. Glide System (Utility Only)

```
Glide mechanic:
  Trigger: Double-jump in air → wing extends → glide mode
  Effect: Fall speed reduced to 20% of normal
           Horizontal speed maintained (no acceleration)
  Duration: Unlimited (while holding)
  Cancel: Tap again / landing
  
  Glide DOES NOT:
    ✗ Allow full flight (not pay-to-fly)
    ✗ Grant speed bonus (same horizontal speed as running)
    ✗ Affect combat (despawns wings in combat start, like mount)
    
  Upgrade: Epic+ wings allow "Wind Ride" — +30% glide horizontal speed
  Visual: Wings spread animation during glide (different per wing skin)
  
  Mobile UX: Double-tap jump button → glide
  Auto-glide off: Touch ground or water
```

---

## 6. Wing Cosmetics (No Power)

```
Cosmetic Items (is_power = false, always):
  Wing Skin:          Replaces wing visual (skin slot — power stats unchanged)
  Wing Color Dye:     Recolor primary/secondary colors (300 Diamond or craft)
  Wing Trail:         Particle trail (stars, flames, petals...) (400-600 Diamond)
  Wing Sparkle:       Idle animation effect (200 Diamond)
  
  Seasonal wing skins: Event shop (event_token)
  Collaboration skins: Premium seasonal (never power)
  
Wing Skin system:
  Applied to slot → doesn't affect star/level/stats
  Skins are transferable between wings of same element
  Skins stored in skin inventory (not wing-locked)
```

---

## 7. Economy Impact

```
Wing Economy Flows:

Gold SINK (significant):
  Evolution: 3 wings merged → gold cost (10K-500K per evolution)
  Wing Dust: No gold cost but requires dismantling duplicates
  Dismantle shop: Not gold sink but recycles materials
  
Gold SOURCE: None (wings don't generate gold)

Material consumption:
  Wing Crystal: From boss loot → Flying boss demand increases
  Wing Core: From epic events → encourages event participation
  Wing Dust: From duplicate wings → encourages diverse collection over hoarding

AH integration:
  Common/Uncommon wings tradeable on AH (gold economy)
  Rare+ wings: Soulbound (NOT tradeable) ← prevents P2W buying
  Wing Crystals, Cores: Tradeable (material economy)
  Wing Skins (non-premium): Tradeable after 30-day lockout
```

---

## 8. Mobile Optimization

```
Wing rendering:
  Wings display ON character at all times when equipped (visible outside combat)
  Combat: wings fold (particle shrink animation), no physics bones in combat
  
  LOD System:
    <8m: Full wing with physics simulation (bone count 12)
    8-25m: Simplified wing (bone count 4, no physics)
    25m+: Flat sprite overlay

  Performance target: Wings add <2ms render time at 60fps
  
  Wing toggle: Settings → "Show Other Players' Wings" (default ON)
                          "Reduce Wing Effects" → disables particle trail
```

---

## 9. Database Schema

```sql
CREATE TABLE player_wings (
    player_id       BIGINT NOT NULL REFERENCES players(player_id),
    wing_id         VARCHAR(64) NOT NULL,
    star_level      SMALLINT NOT NULL DEFAULT 1 CHECK (star_level BETWEEN 1 AND 5),
    wing_level      SMALLINT NOT NULL DEFAULT 1 CHECK (wing_level BETWEEN 1 AND 10),
    wing_xp         INT NOT NULL DEFAULT 0,
    is_equipped     BOOL NOT NULL DEFAULT FALSE,
    skin_id         VARCHAR(64),
    acquired_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, wing_id)
);

CREATE TABLE wing_config (
    wing_id         VARCHAR(64) PRIMARY KEY,
    rarity          VARCHAR(16) NOT NULL,
    element         VARCHAR(16) NOT NULL,        -- Fire/Water/Earth/Wind/Light/Dark
    element2        VARCHAR(16),                 -- Legendary: dual element
    def_bonus_max   FLOAT NOT NULL DEFAULT 0,    -- DEF% at max star/level
    hp_bonus_max    FLOAT NOT NULL DEFAULT 0,
    resist_max      FLOAT NOT NULL DEFAULT 0,    -- Element resist at max
    power_tier      FLOAT NOT NULL,              -- 0.0-1.0
    unlock_method   VARCHAR(128) NOT NULL,
    lore_text       TEXT
);

CREATE TABLE wing_dust_inventory (
    player_id       BIGINT PRIMARY KEY REFERENCES players(player_id),
    wing_dust       INT NOT NULL DEFAULT 0,
    wing_crystals   INT NOT NULL DEFAULT 0,
    wing_cores      INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_wings_player ON player_wings(player_id, is_equipped);
```

---

## 10. Save Data (extends V8)

```csharp
public class WingSaveData {
    public List<WingEntry> ownedWings;
    public string equippedWingId;          // null = no wing
    public int wingDust;
    public int wingCrystals;
    public int wingCores;
    public int totalWingsCollected;        // for Collection Codex
    public float currentWingPower;         // cached ≤2%
    public float currentResistBonus;       // cached element resist%
}

public class WingEntry {
    public string wingId;
    public int starLevel;                  // 1-5
    public int level;                      // 1-10
    public int xp;
    public string skinId;
    public long acquiredAt;
}
```

---

## 11. Network Packets

```
WingEquip           = 0x0910  // C2S: equip wing_id
WingEquipResult     = 0x0911  // S2C: confirm + stat recalc (DEF%, HP%, Resist)
WingUnequip         = 0x0912  // C2S
WingLevelResult     = 0x0913  // S2C: wing XP/level update
WingStarResult      = 0x0914  // S2C: star upgrade result
WingEvolveResult    = 0x0915  // S2C: evolution complete, new wing_id granted
WingUnlocked        = 0x0916  // S2C: new wing added
WingGlideStart      = 0x0917  // C2S: enter glide (server validates mid-air)
WingGlideEnd        = 0x0918  // C2S: land / cancel glide
```

---

## 12. Power Budget Validation (Final)

```
Wing Power Budget Check:

  Max single wing (Legendary 5★ Lv10):
    DEF% = 0.8%
    HP%  = 0.7%
    Resist% = 0.5% (of 1 element)
    Total = 2.0% ✅
    
  Typical endgame (Rare 3★ Lv7):
    0.7 × 0.6 × 0.7 × 2.0% = 0.59%
    
  PowerBudgetManager.ValidateSystemMax(wingPower, "wing", 2.0f) → OK

P2W Check:
  ✅ Legendary wings NOT in premium shop
  ✅ Wing XP not purchasable with Diamond
  ✅ Wing Crystals/Cores tradeable (AH gold economy, not Diamond)
  ✅ Skins = is_power = false

Damage Formula V10 integration:
  Wing DEF% → modifies DEF stat → feeds into (1 − DefMitigation)
  Wing HP%  → modifies HP stat → not in attack formula, survival only
  Wing Resist → reduces incoming ElementMult (existing system)
  ✅ No new SkillMult modifier
  ✅ No new ElementMult value (only reduces incoming element damage)
  ✅ No new stat created
```

---

*Document: WING_SYSTEM.md | Version: 1.0 | Date: 2026-06-14*
*Power Budget: 2.0% (DEF 0.8% + HP 0.7% + Element Resist 0.5%) | 30 Wings | Evolution 3→1*
*Compatible: V10 Damage Formula | Element System resist | Economy V6 | Save V8*
