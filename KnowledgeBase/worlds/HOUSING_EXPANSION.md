# HOUSING EXPANSION
> Game: Slime MMORPG | Document: Housing System Expansion | Date: 2026-06-14
> Scope: House Permissions, Storage, Teleport, Ranking, Animal Pen, Fishing Pond, Night Lighting
> Prerequisite: systems/12_HOUSING_SYSTEM.md (base design)

---

## 1. Purpose

Tài liệu này mở rộng `systems/12_HOUSING_SYSTEM.md` với các tính năng còn thiếu:
- Permission System (ai được vào nhà?)
- House Storage (hộp lưu trữ riêng)
- House Teleport (teleport về nhà)
- House Ranking (leaderboard server-wide)
- Animal Pen (nuôi thú/creature)
- Fishing Pond (câu cá tại nhà)
- Night Lighting (đèn tự bật)
- Network Packet Architecture (chuyển sang TCP)

---

## 2. House Permission System

### 2.1 Permission Tiers

| Tier | Ai | Quyền Hạn |
|---|---|---|
| OWNER | Chủ nhà | Toàn quyền — place/remove/upgrade/invite/ban |
| CO_OWNER | Được owner cấp (max 2) | Place/remove furniture, manage visitors |
| FRIEND | Friends list | Enter + interact với furniture, không edit |
| GUILD_MEMBER | Cùng guild | Enter + interact, không edit |
| PUBLIC | Tất cả | Enter + view only, không interact |
| BANNED | Bị ban | Không thể enter |

### 2.2 Permission Levels Per Feature

| Feature | OWNER | CO_OWNER | FRIEND | GUILD | PUBLIC | BANNED |
|---|---|---|---|---|---|---|
| Enter plot | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Sit on furniture | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Use crafting station | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Use fishing pond | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Feed animals | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Place furniture | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Remove furniture | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Access storage | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Upgrade plot | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage permissions | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 2.3 Permission Management UI

Owner có màn hình **HousingPermissionScreen** với:
- Tab "Co-Owner": Add/Remove co-owners (max 2 players)
- Tab "Blocked": Danh sách bị ban, có thể unban
- Toggle: "Allow Guild Members" (on/off)
- Toggle: "Public Access" (on/off) — nếu off → chỉ Friend + Guild
- Toggle: "Allow Crafting Station use" for GUILD tier

### 2.4 Permission Database

```sql
CREATE TABLE housing_permissions (
    owner_id        BIGINT NOT NULL REFERENCES players(player_id),
    target_id       BIGINT NOT NULL REFERENCES players(player_id),
    permission_tier VARCHAR(16) NOT NULL,  -- CO_OWNER / BANNED
    granted_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (owner_id, target_id)
);

-- Settings stored in player_housing table (ADD COLUMNS):
ALTER TABLE player_housing ADD COLUMN allow_guild_members BOOL NOT NULL DEFAULT TRUE;
ALTER TABLE player_housing ADD COLUMN allow_public BOOL NOT NULL DEFAULT TRUE;
ALTER TABLE player_housing ADD COLUMN allow_craft_for_guild BOOL NOT NULL DEFAULT TRUE;
```

### 2.5 Permission Network Packets

```
// Range 0x0F00 (Housing — đã có)
HousingPermissionUpdate = 0x0F10  // C2S: owner changes permission
HousingPermissionSync   = 0x0F11  // S2C: sync permissions to client
HousingBanPlayer        = 0x0F12  // C2S: ban player from plot
HousingEntryDenied      = 0x0F13  // S2C: notify player they're banned
```

---

## 3. House Storage (Housing Vault)

### 3.1 Design

Separate storage box trong housing — độc lập với inventory:
- Unlock: Plot Level 3+
- Capacity: 30 slots (Level 3), 60 slots (Level 7), 100 slots (Level 10)
- Item types: Bất kỳ item nào (material, equipment, consumable)
- Access: Owner only (không share được)
- Cross-session: Items persist, không expire

### 3.2 Housing Vault vs Inventory vs Bank

| Feature | Inventory | Bank (City) | Housing Vault |
|---|---|---|---|
| Access location | Anywhere | City only | Housing only |
| Capacity | 50-200 slots | 200 slots base | 30-100 slots |
| Cost | Free | Gold/slot | Free (bound to plot) |
| Item restrictions | None | None | None |
| Share với others | ❌ | ❌ | ❌ |

### 3.3 Housing Vault Save Data

```json
"housing_vault": {
    "capacity": 60,
    "items": [
        {"item_id": "mat_herb_001", "quantity": 50, "slot": 0},
        {"item_id": "equip_sword_iron", "slot": 1, "enhance_level": 5}
    ]
}
```

### 3.4 Housing Vault Database

```sql
CREATE TABLE housing_vault (
    player_id       BIGINT NOT NULL REFERENCES players(player_id),
    slot_index      TINYINT NOT NULL,
    item_id         VARCHAR(32) NOT NULL,
    quantity        INT NOT NULL DEFAULT 1,
    item_json       JSONB,    -- enhancement, sockets, etc.
    PRIMARY KEY (player_id, slot_index)
);
```

### 3.5 Housing Vault Network

```
HousingVaultOpen    = 0x0F14  // C2S: open vault
HousingVaultData    = 0x0F64  // S2C: send vault contents
HousingVaultMove    = 0x0F15  // C2S: move item into/out of vault
HousingVaultResult  = 0x0F65  // S2C: operation result
```

---

## 4. House Teleport System

### 4.1 Teleport Methods

| Method | Unlock | Cooldown | Cost |
|---|---|---|---|
| Housing Stone (consumable) | Level 50 (plot unlock) | None | 500g/use |
| Housing Portal Skill | Level 100 | 30 min | Free |
| Guild Hall Teleport | Guild member | 1 hour | Free (guild perk) |
| World Map → Housing | Always | None | 1,000g portal fee |

### 4.2 Housing Stone (Consumable Item)

```
item_id: "consumable_housing_stone"
category: "Consumable"
effect: TeleportToOwnHousing
cooldown: none (item consumed on use)
stackable: 99
source: NPC shop (500g each), crafting (10 common material)
```

Dùng từ inventory → confirm dialog → instant teleport to housing plot entrance.

### 4.3 Housing Portal Skill

Skill học từ Housing NPC (Level 100+):
```
SkillID: "skill_housing_portal"
castTime: 3s (cancel-able)
cooldown: 30 min
effect: TeleportToOwnHousing (or last visited housing if visiting)
restriction: Cannot use in combat, dungeon, or PvP zone
```

### 4.4 Housing Teleport to Other's House

Để visit nhà người khác:
1. Search in Housing Directory (server-wide list)
2. Click player name → "Visit Home"
3. Cost: 200g portal fee (gold sink)
4. Cooldown: None (can visit many homes)
5. Return: "Return Portal" appears at entrance (free, 10 min duration)

### 4.5 Anti-Exploit

- Cannot use Housing Stone in combat (combat flag check)
- Cannot use in dungeon instance
- Server validates: housing_portal_used_at + 30min < now()
- Cannot teleport into BANNED player's housing

### 4.6 Network

```
HousingTeleportRequest  = 0x0F16  // C2S: request teleport (own or visit)
HousingTeleportResult   = 0x0F66  // S2C: success + load housing scene
HousingVisitPortalSpawn = 0x0F67  // S2C: spawn return portal for visitor
```

---

## 5. House Ranking System

### 5.1 Ranking Categories

| Category | Criteria | Reset | Prize |
|---|---|---|---|
| Most Decorated | Total furniture × rarity score | Monthly | Cosmetic title |
| Most Visited | Unique visitors this month | Monthly | Housing coin bonus |
| Best Rating | Average star rating | Monthly | Decoration set |
| Most Creative | Community vote (weekly) | Weekly | Featured spot |
| Guild Housing | Best housing within guild | Monthly | Guild EXP bonus |

### 5.2 Housing Directory (Server-Wide)

Players có thể browse `HousingDirectory`:
- Sort by: Rating, Visitors, Random
- Filter by: Biome theme, Plot level, Open/Closed to public
- Featured section: Top 5 rated homes this week
- Search by player name

### 5.3 Housing Rating System (Expanded)

```
HousingRatingScore = 
    furniture_score × 0.30        // more furniture = higher
    + rarity_score × 0.25         // rarer furniture = higher
    + diversity_score × 0.15      // different categories = higher
    + theme_consistency × 0.15    // furniture matching biome theme = higher
    + visitor_score × 0.10        // more visitors = higher
    + community_vote_score × 0.05 // weekly votes

// New: Theme Consistency Bonus
theme_consistency = (furniture_matching_biome_theme / total_furniture) capped at 1.0
// Meadow theme housing: meadow furniture = full score
// Mixed themes: partial score
```

### 5.4 Community Vote System

- Every player can vote on 3 houses per week (1 vote per house)
- Vote = "Awesome!" button when visiting a house
- Vote contributes to Weekly Creative ranking
- Vote count resets Monday 00:00 UTC

### 5.5 Housing Ranking Database

```sql
CREATE TABLE housing_ranking_monthly (
    ranking_month   DATE NOT NULL,          -- 2026-06-01
    category        VARCHAR(32) NOT NULL,
    rank            SMALLINT NOT NULL,
    player_id       BIGINT NOT NULL,
    score           FLOAT NOT NULL,
    PRIMARY KEY (ranking_month, category, rank)
);

CREATE TABLE housing_votes (
    voter_id        BIGINT NOT NULL,
    host_id         BIGINT NOT NULL,
    week_start      DATE NOT NULL,
    voted_at        TIMESTAMP NOT NULL,
    PRIMARY KEY (voter_id, host_id, week_start)
);

-- Add to player_housing:
ALTER TABLE player_housing ADD COLUMN community_votes_this_week INT NOT NULL DEFAULT 0;
ALTER TABLE player_housing ADD COLUMN monthly_rank INT NULL;
```

### 5.6 Network

```
HousingDirectoryBrowse  = 0x0F17  // C2S: request directory page
HousingDirectoryData    = 0x0F68  // S2C: directory results
HousingVote             = 0x0F18  // C2S: vote on current house
HousingVoteResult       = 0x0F69  // S2C: vote recorded
HousingRankUpdate       = 0x0F6A  // S2C: push monthly rank to player
```

---

## 6. Animal Pen (Creature Farming)

### 6.1 Animal Pen Unlock

- Unlock: Plot Level 7
- Capacity: 2 creatures initially, upgradable to 8
- Animals: Captured creatures from Creature System (CreatureManager.cs)

### 6.2 Animal Pen Features

| Feature | Details |
|---|---|
| Capacity | 2 slots (L7), 4 (L8), 6 (L9), 8 (L10) |
| Upgrade cost | 500,000g per slot |
| Animal types | Any captured creature (CreatureDataSO) |
| Passive produce | Each creature type produces 1 unique material/hour |
| Max accumulate | 24 hours (same as housing generator) |
| Happiness | Feeding increases happiness → higher yield rate |
| Breed | 2 compatible creatures can breed → new creature egg (14 days) |

### 6.3 Animal Produce Table

| Creature Family | Produce | Rate | Item ID |
|---|---|---|---|
| Slime | Slime Gel | 2/hour | `mat_slime_gel` |
| Wolf | Fur | 1.5/hour | `mat_wolf_fur` |
| Fox | Fox Tail | 1/hour | `mat_fox_tail` |
| Bird | Feather | 3/hour | `mat_feather` |
| Golem | Stone Chip | 1/hour | `mat_stone_chip` |
| Dragon | Dragon Scale | 0.2/hour | `mat_dragon_scale` |
| Aquatic | Pearl | 0.5/hour | `mat_pearl` |

Dragon/Rare creatures: Much lower rate but premium materials.

### 6.4 Happiness System

```
Happiness: 0-100 (float)
    Decay: -5/hour when not fed
    Feed (correct food): +20
    Player visit: +5/day
    Weather = RAIN: Slime family +10 (loves water)
    Weather = HEATWAVE: Wolf family -15 (hates heat)
    
Happiness × Yield Multiplier:
    100: ×1.5
    75: ×1.2
    50: ×1.0
    25: ×0.7
    0: ×0.3 (stressed, minimal produce)
```

### 6.5 Animal Pen Save Data

```json
"animal_pen": {
    "capacity": 4,
    "animals": [
        {
            "creature_id": "creature_blue_slime_01",
            "happiness": 85,
            "last_fed_at": "2026-06-14T10:00:00Z",
            "pending_produce_at": "2026-06-14T11:00:00Z"
        }
    ]
}
```

### 6.6 Animal Pen Database

```sql
CREATE TABLE housing_animal_pen (
    player_id       BIGINT NOT NULL REFERENCES players(player_id),
    slot_index      TINYINT NOT NULL,
    creature_id     VARCHAR(32) NOT NULL,
    happiness       FLOAT NOT NULL DEFAULT 100.0,
    last_fed_at     TIMESTAMP,
    last_yield_at   TIMESTAMP,
    PRIMARY KEY (player_id, slot_index)
);
```

### 6.7 Network

```
AnimalPenOpen     = 0x0F19  // C2S: open pen management
AnimalPenData     = 0x0F6B  // S2C: pen contents
AnimalFeed        = 0x0F1A  // C2S: feed animal
AnimalFeedResult  = 0x0F6C  // S2C: happiness updated
AnimalPenCollect  = 0x0F1B  // C2S: collect produce
AnimalPenYield    = 0x0F6D  // S2C: yield items
```

---

## 7. Fishing Pond

### 7.1 Fishing Pond Unlock

- Unlock: Plot Level 5 (furniture: `furn_gen_fishpond_01`)
- Size: 3×3 grid (requires space in housing plot)
- Cost: 200,000g + Aqua Crystal ×5

### 7.2 Fishing Pond Mechanics

Active fishing (không phải AFK):
- Sit at pond edge → fishing mini-game
- Mini-game: tap when meter fills (similar to standard fishing)
- Duration: 1-3 minutes per catch

AFK fishing at housing pond:
- Place "Auto Fisher" furniture (unlock Level 8) → passive fish
- Rate: 0.3 fish/hour (much lower than active)
- Max accumulate: 8 hours

### 7.3 Fish Types by Pond Biome Theme

| Housing Theme | Fish Pool | Special Fish |
|---|---|---|
| Meadow | Common fish, River trout | Rare: Golden Carp (Rainy weather) |
| Ocean | Sea bass, Tuna | Rare: Rainbow Tuna (Storm) |
| Cave | Cave Fish, Blind Eel | Rare: Crystal Eel (Dense Fog) |
| Void | Shadow Fish | Rare: Void Shark (Night only) |

Weather affects fishing pond yields (mirrors WEATHER_SYSTEM modifiers).

### 7.4 Visitor Fishing

- FRIEND and GUILD visitors can fish at your pond
- Their catch goes to their own inventory (not host's)
- Host receives: Fishing_Visit_Bonus (+5% yield for 1h after each visitor fishes)
- Max 5 visitors fishing simultaneously

### 7.5 Fishing Pond Save Data

```json
"fishing_pond": {
    "unlocked": true,
    "biome_theme": "meadow",
    "auto_fisher_installed": false,
    "afk_last_collect_at": "2026-06-14T09:00:00Z",
    "total_fish_caught": 142
}
```

---

## 8. Night Lighting System

### 8.1 Auto Lighting

Khi TimeOfDay = DUSK/NIGHT:
- Nhà tự động bật các furniture loại "Lighting":
  - `furn_light_lamp_01` (Tavern Lamp)
  - `furn_light_torch_01` (Wall Torch)
  - `furn_light_crystal_01` (Crystal Chandelier)
  - `furn_light_lantern_01` (Paper Lantern)
- Owner/visitor thấy nhà sáng lên từ bên ngoài

### 8.2 Lighting Furniture Types

| Furniture | Light Color | Radius | Power Level |
|---|---|---|---|
| Tavern Lamp | Warm yellow | 5m | Low |
| Wall Torch | Orange | 3m | Low |
| Crystal Chandelier | Blue-white | 8m | Medium |
| Paper Lantern | Soft orange | 4m | Low |
| Magic Orb | Purple | 10m | High |
| Event Torch (seasonal) | Festive colors | 5m | Medium |

### 8.3 Light Toggle

Owner có thể:
- Toggle auto-lighting on/off (default: ON)
- Set individual lights: always-on / day-only / night-only / auto

### 8.4 Visual Implementation

```
HousingLightingManager (Client):
    OnTimeOfDayChanged(newPhase):
        if newPhase == DUSK or NIGHT:
            ActivateLightingFurniture()
        else:
            DeactivateLightingFurniture()
    
    ActivateLightingFurniture():
        foreach furniture in placements where category == "Lighting":
            light = GetLight(furniture)
            light.intensity = furniture.lightIntensity
            light.enabled = true
            StartParticleEffect(furniture.flameParticle)
```

Mobile optimization:
- Max 5 active light sources rendering simultaneously (LOD-based)
- Point lights baked for static furniture positions (done once at placement)
- Outdoor glow: Sprite billboard (không phải Unity point light) for visitors viewing from outside

---

## 9. Save Data Expansion

Các field mới thêm vào `HousingSave` (V6):

```csharp
// Additions to HousingSave:
public class HousingSaveV6 : HousingSave {
    // Permissions
    public bool allowGuildMembers;      // default true
    public bool allowPublic;            // default true
    public bool allowCraftForGuild;     // default true
    
    // Storage
    public List<VaultItem> vaultItems;  // max 100 items
    
    // Animal Pen
    public List<PenAnimal> penAnimals;  // max 8
    
    // Fishing Pond
    public FishingPondSave fishingPond;
    
    // Lighting
    public bool autoLightingEnabled;    // default true
    
    // Ranking
    public int monthlyRank;             // 0 = unranked
    public int communityVotesReceived;  // this week
}
```

---

## 10. Database Summary (New Tables)

```sql
-- See sections above for full CREATE TABLE statements

New tables:
    housing_permissions     (permission tiers per player pair)
    housing_vault           (storage box items)
    housing_ranking_monthly (monthly leaderboard snapshots)
    housing_votes           (weekly community votes)
    housing_animal_pen      (animal pen state)

Modified tables:
    player_housing:     +allow_guild_members, +allow_public, +allow_craft_for_guild, +community_votes_this_week, +monthly_rank
```

---

## 11. Network Packets Summary

All new housing packets use range `0x0F10–0x0F6D`:

```
// Permissions
0x0F10 HousingPermissionUpdate  (C2S)
0x0F11 HousingPermissionSync    (S2C)
0x0F12 HousingBanPlayer         (C2S)
0x0F13 HousingEntryDenied       (S2C)

// Storage
0x0F14 HousingVaultOpen         (C2S)
0x0F15 HousingVaultMove         (C2S)
0x0F64 HousingVaultData         (S2C)
0x0F65 HousingVaultResult       (S2C)

// Teleport
0x0F16 HousingTeleportRequest   (C2S)
0x0F66 HousingTeleportResult    (S2C)
0x0F67 HousingVisitPortalSpawn  (S2C)

// Ranking / Directory
0x0F17 HousingDirectoryBrowse   (C2S)
0x0F18 HousingVote              (C2S)
0x0F68 HousingDirectoryData     (S2C)
0x0F69 HousingVoteResult        (S2C)
0x0F6A HousingRankUpdate        (S2C)

// Animal Pen
0x0F19 AnimalPenOpen            (C2S)
0x0F1A AnimalFeed               (C2S)
0x0F1B AnimalPenCollect         (C2S)
0x0F6B AnimalPenData            (S2C)
0x0F6C AnimalFeedResult         (S2C)
0x0F6D AnimalPenYield           (S2C)
```

---

## 12. Mobile Optimization

- Permission check: cached per session (refresh on enter plot)
- Vault: paginated (20 items/page) — không load toàn bộ
- Animal pen: max 8 active lights — use shadow maps LOD
- Night lighting: max 5 simultaneous light sources (billboard for rest)
- Housing Directory: virtual scroll (50 results per page)
- Teleport animation: simple fade to black (không heavy load screen)

---

## 13. Anti-Exploit

| Exploit | Prevention |
|---|---|
| Fake visitor count | Server validates visit duration ≥ 5 min before counting |
| Vote manipulation | 1 vote per house per week per player, server-side |
| Vault item duplication | PostgreSQL row-lock on vault operations |
| Animal pen overflow | Server validates slot count < capacity |
| Housing teleport spam | 30-min cooldown on Housing Portal Skill |
| Permission bypass | Server checks permission on EVERY housing action |

---

## 14. Future Expansion

- Guild Hall: Shared housing for guilds (larger plot, shared permissions)
- Housing Market: Players can trade furniture designs
- Housing Season Events: Special event decor changes plot appearance
- Cross-server Housing District: Top 5 rated homes featured globally
- Housing Dungeon: Private mini-dungeon attached to plot (epic perk)
- Room System: Divide housing into rooms (bedroom, kitchen, etc.)

---

*Document: HOUSING_EXPANSION.md | Version: 1.0 | Date: 2026-06-14*
*Prerequisite: systems/12_HOUSING_SYSTEM.md*
*New: Permissions, Storage, Teleport, Ranking, Animal Pen, Fishing Pond, Night Lighting*
