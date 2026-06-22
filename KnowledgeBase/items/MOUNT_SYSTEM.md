# MOUNT SYSTEM ARCHITECTURE
> Game: Slime MMORPG | Date: 2026-06-14 | Version: 1.0
> Power Budget: 1% (LOCKED) | Source of Truth: systems/01_POWER_BUDGET.md
> Compatible: Damage Formula V10 | Element System | Economy System V6

---

## MANDATORY COMPATIBILITY CHECK

```
[Source of Truth — Read Before This Doc]
  01_POWER_BUDGET.md     → mount budget_pct = 1.0% FIXED
  09_ELEMENT_CHART.md    → 6 elements: Fire/Water/Earth/Wind/Light/Dark
  00_SAVE_DATA_SYSTEM.md → PlayerSaveData schema V6→V8
  ECONOMY_AUDIT.md       → Gold sink design, no new currency unless critical
  06_COLLECTION_CODEX_SYSTEM.md → Mount entries go to Collection

Mount DOES NOT:
  ✗ Create new stat outside ATK/DEF/HP/CRIT Rate/CRIT DMG/Speed
  ✗ Add new currency (uses existing Gold + event rewards)
  ✗ Create new damage formula
  ✗ Add power beyond 1% budget
  ✓ Extends: Collection (2% budget), Economy (gold sink), Housing (stable)
```

---

## 1. Design Philosophy

Mount hệ thống phục vụ hai mục tiêu:
1. **Traversal**: Tăng Movement Speed ngoài chiến đấu — KHÔNG tính vào Power Budget (utility only)
2. **Aura Power**: Passive aura nhỏ (ATK/DEF/HP% bonus) — chiếm đúng 1% Power Budget

**Core Pillars:**
- Collection Loop: 50 mounts, unlock qua gameplay
- No P2W: Mounts mạnh nhất unlock qua event/boss, không bán power
- Cosmetic First: 80% giá trị mount là visual
- Economy Sink: Gold + gathering materials để upgrade mount

---

## 2. Power Budget Allocation (1% TOTAL)

```
Mount Power Budget: 1.0%
  
  Mount Aura — ATK% bonus:     0.4%  (max, tất cả mounts fully upgraded)
  Mount Aura — DEF% bonus:     0.3%  (max)
  Mount Aura — HP% bonus:      0.3%  (max)
  ────────────────────────────────
  TOTAL:                        1.0% ✅

Mount Speed:    utility only, KHÔNG tính vào 1%
  Base: +40% Movement Speed out of combat
  Epic: +60% Movement Speed out of combat
  Legendary: +80% Movement Speed out of combat

Power Formula:
  MountPower% = mount.rarityBase × (mount.level / 10) × mount.powerTier
  where: rarityBase[Common]=0.3, [Uncommon]=0.5, [Rare]=0.7, [Epic]=0.85, [Legendary]=1.0
  
  Max single mount (Legendary Lv10): 1.0 × 1.0 × 1.0 = 1.0% ← hard cap
  Common mount Lv1: 0.3 × 0.1 = 0.03% ← negligible
  
  PowerBudgetManager.ValidateSystemMax(mountPower, "mount", 1.0f) → enforced server-side
```

---

## 3. Mount Collection (50 Mounts)

### 3.1 Collection Table

| Family | Count | Theme | Speed Tier | Power Tier |
|---|---|---|---|---|
| Terrestrial | 20 | Land creatures | 40-50% | Low-Mid |
| Aerial | 10 | Flying creatures | 60-70% (air dash) | Mid |
| Aquatic | 5 | Water creatures | 30% land / 80% water | Mid |
| Mythical | 10 | Legendary beasts | 70-80% | High |
| Seasonal | 5 | Event-only | 50% | Mid |

### 3.2 Unlock Methods

| Rarity | Count | Unlock Method |
|---|---|---|
| Common | 18 | Kill 200 biome monsters / Stable NPC gold purchase |
| Uncommon | 14 | Complete biome quest chain / AH trade |
| Rare | 10 | Named Boss drop (rare) / Dungeon reward |
| Epic | 6 | World Boss kill reward / Event completion |
| Legendary | 2 | Server-wide event (1×/season) / Ultimate achievement |

### 3.3 Sample Mounts

```
"Verdant Boar" (Terrestrial, Common)
  Unlock: Kill 200 Forest monsters
  Speed: +40% (out of combat)
  Aura Lv10: ATK +0.12%, DEF +0.09%, HP +0.09% = 0.30% total
  Visual: Green boar with leaf saddle
  Collection entry: ✅ → Collection Codex entry #301

"Storm Gryphon" (Aerial, Rare)
  Unlock: Defeat Named Boss "Tempest Wing" in Stormy Highlands
  Speed: +60% + double-jump (air dash once per jump)
  Aura Lv10: ATK +0.28%, DEF +0.21%, HP +0.21% = 0.70% total
  Visual: Blue-silver gryphon with lightning wing pattern
  Collection entry: ✅

"Obsidian Dragon" (Mythical, Legendary)
  Unlock: "Dragon Awakening" server-wide event (1×/season)
  Speed: +80%
  Aura Lv10: ATK +0.40%, DEF +0.30%, HP +0.30% = 1.00% total ← max
  Visual: Black dragon with purple flame trail
  Collection entry: ✅
  Note: is_power = true for stat portion → never sold in premium shop
```

---

## 4. Mount Progression

### 4.1 Mount Level (1-10)

| Level | XP Required | Total XP | Aura Power |
|---|---|---|---|
| Lv1 → Lv2 | 500 | 500 | 10% of max |
| Lv2 → Lv3 | 1,500 | 2,000 | 20% |
| Lv3 → Lv4 | 3,000 | 5,000 | 30% |
| Lv4 → Lv5 | 6,000 | 11,000 | 40% |
| Lv5 → Lv6 | 10,000 | 21,000 | 50% |
| Lv6 → Lv7 | 15,000 | 36,000 | 60% |
| Lv7 → Lv8 | 22,000 | 58,000 | 70% |
| Lv8 → Lv9 | 30,000 | 88,000 | 80% |
| Lv9 → Lv10 | 42,000 | 130,000 | 100% |

**Time estimate (F2P):** Common mount Lv10 ≈ 2-3 months casual play

### 4.2 Mount Feed (XP Sources)

| Source | XP | Notes |
|---|---|---|
| Mount Feed (Common) | 100 XP | 5 Hay + 3 Fruit (Gathering drops) |
| Mount Feed (Rare) | 500 XP | 3 Rare Herb + 5 Grain + 1 Spirit Fruit |
| Stable Care (daily) | 50 XP | NPC cares for mount in Stable (passive) |
| Event Mount Race | 500-2,000 XP | Weekly event at biome |
| Mount Bond mission | 200 XP/day | Daily: ride mount 10 min |

**Economy check:** Mount Feed uses Herbalism + Foraging materials → feeds Gathering economy

### 4.3 Only Active Mount

```
Player has 1 ACTIVE mount at a time.
  Active mount: summoned with Mount button (4s summon animation)
  Dismount: combat start (automatic) or manual
  Mount persists across zones
  Mount despawns: underwater, dungeon entrance, PvP arena
  
Mount Storage:
  Stable: unlimited mount storage
  Active slot: 1 only
  Favorite: up to 5 "favorites" for quick-summon menu
```

---

## 5. Mount Skills (Passive Only — No Combat Formula)

**Rule: Mount Skills are UTILITY or PASSIVE AURA only. No new damage source.**

| Skill | Effect | Unlock | Notes |
|---|---|---|---|
| Mount Sprint | +20% speed burst for 5s (60s CD) | All mounts | Out-of-combat only |
| Mount Gather | +10% gathering yield (passive) | Rare+ mounts | Feeds gathering economy |
| Mount Trample | Knock back enemies when summoning | Epic+ mounts | No damage, CC only |
| Mount Aura | Stat bonus (ATK/DEF/HP%) | All mounts | THE power budget portion |
| Mount Resist | +2% element resistance (1 element) | Epic+ mounts | NOT power budget (utility resist) |

---

## 6. Mount Cosmetics (No Power)

```
Cosmetic items (is_power = false, always):
  Saddle Skin:       Changes saddle appearance (300-500 Diamond)
  Mount Color:       Dye kit for mount fur/scales (200 Diamond or craft)
  Trail Effect:      Particle trail behind mount (400-600 Diamond)
  Mount Name Tag:    Custom name displayed (100 Diamond)
  Mount Animation:   Idle/Run animation variant (300-400 Diamond)

Mount Color Kits:
  Basic 8 colors: craft with Dye (Gathering drop + Alchemy L10)
  Premium 4 colors: Diamond shop (seasonal rotation)
  Event colors: Event token shop

RULE: No cosmetic item affects Mount Aura stats.
```

---

## 7. Mount Stable (Housing Integration)

```
Stable in Housing Plot:
  - Player can build Stable at Housing Level 3 (small building)
  - Stable capacity: 5 mounts (base) → 20 (upgrades)
  - Passive XP generation: +50 XP/mount/day (mount in stable)
  - Stable Keeper NPC: sells Common Mount Feeds
  
Stable Upgrade costs:
  Stable Lv1 (5 slots):   5,000 Gold + 20 Lumber
  Stable Lv2 (10 slots):  25,000 Gold + 50 Lumber
  Stable Lv3 (20 slots):  100,000 Gold + 100 Lumber + 10 Iron Bar

Gold Sink: Stable construction + daily feed costs → significant gold sink
```

---

## 8. Mount Shop (Economy)

```
Mount NPC Shops (in major towns):
  Stable Master NPC:
    → Sells Common mounts for Gold
    → Sells Mount Feed (Common) for Gold
    → "Rename Mount" service (500 Gold)
    
  Event Shop (seasonal):
    → Sells Seasonal mounts for event_token
    → Event mounts: cosmetic only (lower power tier than boss drops)
    
Premium Shop:
    → Sells cosmetic skins ONLY (never power mounts)
    → "Mount Color Pack" 400 Diamond
    → "Mount Effect Pack" 600 Diamond
    → Legendary mounts NEVER in premium shop (is_power = server enforced)
```

---

## 9. Mobile Optimization

```
Mount Rendering (LOD system):
  Player + party (8m range): Full quality
  Other players (8-30m): LOD2 (reduced bones)
  Other players (30m+):   LOD3 (sprite billboard)
  
  Mount on mobile:
    Target: 60fps maintained
    Max simultaneous mounts rendered: 10 full quality
    Others: sprite mode
    
  Mount texture atlas: shared per family (1 atlas per biome family)
  
Mount Summon:
  4 second summon animation (skippable with tap)
  Auto-dismiss indoors (saves rendering)
  Mount icon in hotbar: 1-tap summon/dismiss
```

---

## 10. Database Schema

```sql
CREATE TABLE player_mounts (
    player_id       BIGINT NOT NULL REFERENCES players(player_id),
    mount_id        VARCHAR(64) NOT NULL,
    mount_level     SMALLINT NOT NULL DEFAULT 1,
    mount_xp        INT NOT NULL DEFAULT 0,
    is_active       BOOL NOT NULL DEFAULT FALSE,
    is_favorite     BOOL NOT NULL DEFAULT FALSE,
    custom_name     VARCHAR(32),
    skin_id         VARCHAR(64),             -- equipped cosmetic skin
    acquired_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, mount_id)
);

CREATE TABLE mount_config (
    mount_id        VARCHAR(64) PRIMARY KEY,
    rarity          VARCHAR(16) NOT NULL,
    family          VARCHAR(16) NOT NULL,
    biome_id        SMALLINT,
    unlock_method   VARCHAR(64) NOT NULL,
    speed_bonus     FLOAT NOT NULL,          -- out-of-combat speed %
    aura_atk_max    FLOAT NOT NULL DEFAULT 0, -- max ATK% at Lv10
    aura_def_max    FLOAT NOT NULL DEFAULT 0,
    aura_hp_max     FLOAT NOT NULL DEFAULT 0,
    power_tier      FLOAT NOT NULL,          -- 0.0-1.0 multiplier
    lore_text       TEXT
);

CREATE TABLE mount_feed_log (
    id              BIGSERIAL PRIMARY KEY,
    player_id       BIGINT NOT NULL,
    mount_id        VARCHAR(64) NOT NULL,
    feed_type       VARCHAR(32) NOT NULL,
    xp_granted      INT NOT NULL,
    fed_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mounts_player_active ON player_mounts(player_id, is_active);
```

---

## 11. Save Data (extends V8)

```csharp
public class MountSaveData {
    public List<MountEntry> ownedMounts;
    public string activeMountId;           // null = unmounted
    public List<string> favoriteMountIds;  // max 5
    public int totalMountsCollected;       // for Collection Codex
    public float currentAuraPower;         // cached: sum of active mount aura (≤1%)
}

public class MountEntry {
    public string mountId;
    public int level;                      // 1-10
    public int xp;                         // current XP
    public string equippedSkinId;
    public string customName;
    public long acquiredAt;
}
```

---

## 12. Network Packets

```
MountSummon         = 0x0900  // C2S: summon mount_id
MountSummonResult   = 0x0901  // S2C: confirm + speed buff applied
MountDismiss        = 0x0902  // C2S: dismount
MountDismissResult  = 0x0903  // S2C: confirmed
MountFeedResult     = 0x0904  // S2C: XP gained, level up if applicable
MountUnlocked       = 0x0905  // S2C: new mount added to collection
MountAuraSync       = 0x0906  // S2C: aura power recalculated (after level up)
```

---

## 13. Analytics Events

```
mount_summoned:   { mount_id, player_level, zone_id }
mount_leveled:    { mount_id, new_level, total_xp }
mount_unlocked:   { mount_id, rarity, unlock_method }
mount_feed_used:  { feed_type, xp_granted, mount_id }
mount_skin_applied: { mount_id, skin_id, source }
```

---

## 14. Power Budget Validation (Final)

```
Mount System Power Budget Check:

  Slot max (Legendary Lv10): ATK 0.40% + DEF 0.30% + HP 0.30% = 1.00%
  
  Representative endgame player (1 active mount):
    Rare mount Lv8: 0.7 × 0.8 = 0.56% contribution
    Epic mount Lv10: 0.85 × 1.0 = 0.85% contribution
    Legendary mount Lv10: 1.0 × 1.0 = 1.00% contribution (cap)
  
  PowerBudgetManager assertion:
    ValidateSystemMax(mountPower, "mount", 1.0f); → ✅
  
  P2W check:
    ✅ Legendary mount NOT sold in premium shop
    ✅ Mount Feed NOT purchasable with Diamond
    ✅ Speed bonus is utility (not in power budget)
    ✅ Cosmetics (skin, color, trail) = is_power = false
    
  Damage Formula V10 integration:
    Mount Aura → modifies ATK%, DEF%, HP% (existing stats)
    SkillMult: NOT modified by mount
    ElementMult: NOT modified by mount
    DefMitigation: HP bonus doesn't affect formula component
    ✅ No new formula term added
```

---

*Document: MOUNT_SYSTEM.md | Version: 1.0 | Date: 2026-06-14*
*Power Budget: 1.0% (ATK 0.4% + DEF 0.3% + HP 0.3%) | 50 Mounts | Speed = utility only*
*Compatible: V10 Damage Formula | Element System | Economy V6 | Save V8*
