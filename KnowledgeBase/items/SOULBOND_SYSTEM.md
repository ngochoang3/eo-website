# SOULBOND SYSTEM ARCHITECTURE
> Game: Slime MMORPG | Date: 2026-06-14 | Version: 1.0
> Power Budget: 4% (LOCKED) | Type: Collection + Long-term Progression

---

## 1. Design Philosophy

SoulBond là hệ thống "Spirit Collection" — người chơi tìm kiếm và kết nối với các **Ancient Spirits** ẩn trong 21 Biome của thế giới. Mỗi Spirit là một thực thể độc lập với câu chuyện riêng, mang lại passive power bonus khi đạt đủ Bond Level.

**Core Pillars:**
- Collection Loop: 60 Spirits tổng (khám phá + unlock)
- Long-Term Progression: Bond Level 1→10 per Spirit, mất nhiều tháng để maxout
- No P2W: Spirits unlock thông qua gameplay, không bán Spirit mạnh nhất
- 4% Power Budget: Phân bổ cẩn thận, không vượt ngưỡng

---

## 2. SoulBond Power Allocation (4% total)

```
Total Power Budget: 100%
SoulBond Allocation: 4%

Breakdown:
  Active Spirits (equipped, max 3 slots):   2.5%
  Passive Spirit Aura (all collected):       1.0%
  Spirit Resonance (set bonus):              0.5%
  ─────────────────────────────────────────
  TOTAL:                                     4.0% ✅

Formula:
  SoulBondPower = (ActiveBondBonus + PassiveAuraBonus + ResonanceBonus)
               / TotalPowerBase × 4%

  ActiveBondBonus   = Σ(equippedSpirit.statBonus × bondLevel / 10)
  PassiveAuraBonus  = collectedSpirits × 0.002 (capped at 60 spirits = 0.12%)
  ResonanceBonus    = activeResonanceSets × setBonus
```

---

## 3. Spirit Database (60 Spirits Total)

### 3.1 Spirit Families (6 families × 10 spirits each)

| Family | Theme | Biome | Stat Focus | Count |
|---|---|---|---|---|
| NATURE | Forest, growth | Forest, Plains, Swamp | HP, DEF | 10 |
| FIRE | Destruction, passion | Volcano, Desert | ATK, Fire DMG | 10 |
| ICE | Stillness, precision | Tundra, Mountain | CRIT Rate, Ice DMG | 10 |
| VOID | Mystery, entropy | Dark Forest, Abyss | Dark DMG, Speed | 10 |
| OCEAN | Fluidity, life | Ocean, River | Healing, Water DMG | 10 |
| LIGHT | Clarity, protection | Sacred Land, Sky | Holy DMG, Shield | 10 |

### 3.2 Spirit Rarity Tiers

| Tier | Count | Bond Strength | Unlock Method |
|---|---|---|---|
| Common | 24 | Low | Kill 100 monsters in biome |
| Uncommon | 18 | Medium | Complete biome quest chain |
| Rare | 12 | High | Defeat Named Boss (biome boss) |
| Epic | 4 | Very High | World Boss kill first time |
| Legendary | 2 | Highest | Server-wide event completion |

### 3.3 Sample Spirit Definitions

```
Spirit: "Verdant Shepherd" (Nature, Common)
  Biome: Forest
  Unlock: Kill 100 Forest monsters
  Bond Effect (per level):
    Bond Lv1: HP +50
    Bond Lv5: HP +250, DEF +15
    Bond Lv10: HP +500, DEF +30, Nature Resist +3%
  Aura Contribution: 0.002% passive
  Lore: "Ancient guardian of the Verdant Canopy..."

Spirit: "Cinder Lord" (Fire, Rare)
  Biome: Volcano
  Unlock: Defeat Named Boss "Igneus" for the first time
  Bond Effect (per level):
    Bond Lv1: ATK +30, Fire DMG +1%
    Bond Lv5: ATK +150, Fire DMG +5%
    Bond Lv10: ATK +300, Fire DMG +10%, Burn chance +5%
  Aura Contribution: 0.002% passive

Spirit: "Void Sovereign" (Void, Legendary)
  Biome: Abyss Dungeon (endgame zone)
  Unlock: Complete "Void Awakening" server-wide event (1×/season)
  Bond Effect (per level):
    Bond Lv1: All stats +0.5%
    Bond Lv5: All stats +2.5%, Dark DMG +8%
    Bond Lv10: All stats +5%, Dark DMG +15%, Void Pulse skill
  Aura Contribution: 0.002% passive
  Note: is_power contribution from Legendary Spirit capped at budget share
```

---

## 4. Bond Progression System

### 4.1 Bond XP Sources

| Source | Bond XP | Notes |
|---|---|---|
| Kill monsters in Spirit's biome | 5 XP/kill | Only when spirit is equipped |
| Complete quests in biome | 100-500 XP | Quest type matters |
| Feed Spirit (Spirit Food item) | 200 XP/feed | Consumable item, craftable |
| Spirit Dungeon (weekly event) | 500-2,000 XP | Special spirit-themed dungeon |
| Daily Spirit Meditation | 100 XP/day | Login action, click Spirit |
| Spirit Festival events | 2,000-5,000 XP | 4× per year seasonal events |

### 4.2 Bond Level XP Requirements

| Level | XP Required | Total XP | Time Estimate (F2P) |
|---|---|---|---|
| Lv1 → Lv2 | 1,000 | 1,000 | 1-2 days |
| Lv2 → Lv3 | 3,000 | 4,000 | 1 week |
| Lv3 → Lv4 | 8,000 | 12,000 | 2 weeks |
| Lv4 → Lv5 | 15,000 | 27,000 | 1 month |
| Lv5 → Lv6 | 25,000 | 52,000 | 6 weeks |
| Lv6 → Lv7 | 40,000 | 92,000 | 2 months |
| Lv7 → Lv8 | 60,000 | 152,000 | 3 months |
| Lv8 → Lv9 | 90,000 | 242,000 | 4 months |
| Lv9 → Lv10 | 130,000 | 372,000 | 5-6 months |

**Max Bond Lv10 (one spirit):** ~6 months of active play per spirit

### 4.3 Spirit Food Crafting

```
Spirit Food (Common):  5 Common Herb + 3 Crystal = 200 Bond XP
Spirit Food (Rare):    5 Rare Herb + 3 Pure Crystal + 1 Spirit Essence = 1,000 Bond XP
Spirit Essence:        Drops from Spirit Dungeon (rare), or crafted 10 Common Spirit Food
```

**Economy Check:** Spirit Food uses gathering materials. Crafting economy feeds SoulBond.

---

## 5. Active Spirit Slot System

### 5.1 Equipment Slots

| Slot | Unlock | Cost |
|---|---|---|
| Slot 1 | Level 50 (auto) | Free |
| Slot 2 | Level 150 | 50,000 gold |
| Slot 3 | Level 300 | 200,000 gold |

**Max 3 active spirits simultaneously.**

### 5.2 Spirit Activation UI

```
[Spirit Board] (accessed from character screen):
  ┌─────────────────────────────────────────┐
  │  Active Spirit Slots [3]                │
  │  [Cinder Lord Lv5] [Verdant Lv3] [___ ]│
  │                                          │
  │  Spirit Collection (60 total)           │
  │  Discovered: 23/60  │  Bonded: 15/60   │
  │                                          │
  │  Aura Power: +0.048% (24 collected)     │
  │  Resonance: FIRE SET (2/3) → +0.3%     │
  └─────────────────────────────────────────┘
```

---

## 6. Spirit Resonance (Set Bonus)

Equipping spirits of the same family triggers Resonance:

| Family | 2 Spirits | 3 Spirits |
|---|---|---|
| NATURE | DEF +3% | HP +5%, Healing Rcv +10% |
| FIRE | Fire DMG +5% | ATK +4%, Burn Spread chance |
| ICE | CRIT Rate +3% | CRIT DMG +8%, Freeze extend |
| VOID | Speed +4% | Dark DMG +6%, Shadow Step |
| OCEAN | Healing +5% | Water DMG +4%, Regen |
| LIGHT | Shield Strength +5% | Holy DMG +5%, Blind resist |

Resonance contributes to the 0.5% Spirit Resonance budget.

---

## 7. Spirit Skills (Active Ability)

At Bond Level 5+, spirits can grant 1 active skill:

| Spirit Tier | Skill Type | Notes |
|---|---|---|
| Common | Passive Skill (auto trigger) | No player action required |
| Uncommon | Triggered Skill (every 30s) | Spirit appears briefly, attacks |
| Rare | Active Skill (player-activated) | 60s cooldown |
| Epic | Ultimate Skill | 5min cooldown, major effect |
| Legendary | Signature Skill | 10min cooldown, AOE + unique mechanic |

**Example — Cinder Lord (Rare) Spirit Skill:**
```
Skill Name: "Cinder Burst"
Activation: Player presses Spirit Skill button (60s CD)
Effect: Cinder Lord appears, deals Fire DMG = 300% ATK to all enemies in 8m radius
Burn: 3s burn DoT (20% ATK/s)
Duration: Spirit visible 2 seconds, then returns
```

**ANTI-P2W CHECK:** Spirit Skills deal FIXED % of player's own ATK — no additional raw power beyond the 4% budget.

---

## 8. Monetization (NO P2W)

| Product | Price | Type | Notes |
|---|---|---|---|
| Spirit Costume (visual skin per spirit) | 300-800 Diamond | Cosmetic only | Changes spirit appearance |
| Spirit Effect Pack | 200-500 Diamond | Cosmetic | Aura effect around player |
| Spirit Name Tag | 100 Diamond | Cosmetic | Custom display name |
| Spirit Food (Rare) ×10 | Event only | NOT for direct sale | Cannot buy Bond XP |
| Spirit Album Frame | 400 Diamond | Cosmetic | Housing display |

**RULE:** Spirit Food and Bond XP are NEVER directly purchasable. Progression is gameplay-only.

---

## 9. Save Data

```csharp
// Addition to PlayerSaveData (V7):
public class SoulBondSave {
    public List<SpiritEntry> discoveredSpirits;
    public List<string> equippedSpiritIds;      // max 3 slots
    public int totalSpiritsDiscovered;
    public float totalAuraPowerBonus;           // cached computation
}

public class SpiritEntry {
    public string spiritId;                     // "spirit_cinder_lord"
    public int bondLevel;                       // 0-10
    public long bondXp;                         // current XP
    public bool isEquipped;
    public bool isSkillUnlocked;               // bond Lv5+
    public long firstBondedAt;
}
```

---

## 10. Database Tables

```sql
CREATE TABLE player_spirits (
    player_id       BIGINT NOT NULL REFERENCES players(player_id),
    spirit_id       VARCHAR(64) NOT NULL,
    bond_level      SMALLINT NOT NULL DEFAULT 0,
    bond_xp         INT NOT NULL DEFAULT 0,
    is_equipped     BOOL NOT NULL DEFAULT FALSE,
    slot_index      SMALLINT,                  -- NULL if not equipped
    first_bonded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, spirit_id)
);

CREATE INDEX idx_spirits_player ON player_spirits(player_id, is_equipped);

CREATE TABLE spirit_config (
    spirit_id       VARCHAR(64) PRIMARY KEY,
    family          VARCHAR(16) NOT NULL,
    rarity          VARCHAR(16) NOT NULL,
    biome_id        SMALLINT NOT NULL,
    unlock_condition VARCHAR(256) NOT NULL,
    stats_json      JSONB NOT NULL,            -- per-level stat bonuses
    skill_json      JSONB,                     -- spirit skill definition
    lore_text       TEXT
);
```

---

## 11. Network Packets

```
SpiritDiscovered    = 0x0700  // S2C: new spirit available
SpiritBondUpdate    = 0x0701  // S2C: bond XP/level changed
SpiritEquip         = 0x0702  // C2S: equip/unequip spirit
SpiritEquipResult   = 0x0703  // S2C: equip confirmed + stat recalc
SpiritSkillUse      = 0x0704  // C2S: activate spirit skill
SpiritSkillResult   = 0x0705  // S2C: skill effect broadcast
SpiritAuraSync      = 0x0706  // S2C: aura power update (on discovery)
```

---

## 12. Power Budget Validation

```
P2W Audit:
  ✅ Spirits unlock through gameplay only
  ✅ Bond XP not purchasable
  ✅ Max 4% power contribution (hardcoded cap in PowerBudgetManager)
  ✅ No Legendary Spirit sold directly
  ✅ Spirit Skills scale from player ATK (no independent damage source)
  
Economy Audit:
  ✅ Spirit Food = crafting economy sink (Herb + Crystal)
  ✅ No gold injection from spirits
  ✅ Spirit Dungeon = weekly content engagement (not daily grind requirement)
```

---

*Document: SOULBOND_SYSTEM.md | Version: 1.0 | Date: 2026-06-14*
*Power Budget: 4% (Active 2.5% + Aura 1.0% + Resonance 0.5%)*
*60 Spirits × 10 Bond Levels = 600 progression points*
