# 06 — COLLECTION CODEX SYSTEM
**Version:** 1.0  
**Status:** Production Design  
**Author:** Principal MMORPG System Architect  
**Date:** 2026-06-13  
**Power Budget Slot:** Collection = 2.0% (LOCKED — V3 Budget)

---

## 1. PURPOSE

Collection Codex là hệ thống "bảo tàng hành trình" của người chơi trong Slime MMORPG. Thay vì chỉ là danh sách thành tích khô khan, Codex biến mỗi monster đã tiêu diệt, mỗi equipment đã nhặt được, mỗi relic đã thu thập thành một trang lịch sử sống động — có lore, monster card artwork, equipment model display, và stat history.

Mục tiêu cốt lõi:
- Tạo động lực thu thập dài hạn không phụ thuộc vào power creep
- Cung cấp account-wide bonus nhỏ (2% tổng cộng) như phần thưởng mục tiêu dài hạn
- Tạo social layer thông qua public Codex profile và guild Codex display
- Cung cấp Collection Points như cosmetic currency không ảnh hưởng power

Collection Codex là content layer hoàn chỉnh có thể độc lập với progression chính, thu hút cả casual player (lore reader) lẫn completionist.

---

## 2. DESIGN GOALS

### 2.1 Primary Goals

| Goal | Metric | Target |
|------|--------|--------|
| Long-term retention | Daily active completionist players | 15% of DAU |
| Social engagement | Codex profile views per day | 500K |
| Content depth | Average time in Codex UI per session | 3-5 minutes |
| Monetization (indirect) | Collection Shop conversion | 8% of players/month |

### 2.2 Design Principles

**NO Power-Wall:** Codex completion bonuses (2% total) phải là optional, không required để clear endgame content. A player at 0% Codex vẫn phải có thể complete all mandatory content.

**Progressive Revelation:** Codex không show hết ngay từ đầu. Entries "????" khi chưa unlock, chỉ reveal tên sau khi gặp lần đầu, reveal full lore/stats sau kill/obtain milestone.

**Retroactive Credit:** Bất kỳ monster nào đã kill trước khi Codex ra mắt sẽ được credit ngay khi login đầu tiên sau patch (migration từ bestiaryBits/bestiaryKillCounts).

**Server Authoritative:** KHÔNG có client-side collection registration. Mọi unlock đều do server validate và push xuống.

**Collection ≠ Grind Wall:** Milestone rewards tại 25%/50%/75%/100% completion, không phải per-item. Grinding đến 100% là optional achievement, không mandatory.

### 2.3 Non-Goals

- Không có equipment crafting từ Codex (tránh power inflation)
- Không có PvP modifier từ Codex bonus
- Không có guild-shared Codex bonuses (chỉ display, không shared power)
- Không có Collection Points transfer giữa players

---

## 3. GAMEPLAY FLOW

### 3.1 First-Time User Experience (FTUE)

```
[Player kills first monster]
    → Server detects first kill of monster_id
    → Server registers bestiary entry (existing BestiaryManager flow)
    → Server ALSO registers Codex Monster entry (new flow, parallel)
    → S2C_CodexEntryUnlocked packet sent
    → Client shows "CODEX UNLOCKED" toast (không block gameplay)
    → Codex UI tab pulses to indicate new entry

[Player opens Codex for first time]
    → Tutorial overlay explains: Monster / Equipment / Pet / Relic / Artifact tabs
    → Shows current progress bar per category
    → Shows "Account Bonus" panel with current vs max bonus
```

### 3.2 Monster Collection Flow

```
[Kill Loop]
Kill monster_id N → BestiaryManager updates kill count (existing)
                  → CodexManager checks kill count against milestones
                  → On milestone hit: Server registers CodexMonsterMilestone
                  → S2C_CodexEntryUnlocked (milestone_type, monster_id, reward)
                  → Client animates monster card "level up"

Milestones per monster: {1, 10, 50, 100, 500, 1000}
- Kill 1    → Monster card unlocked (name, art, basic stats)
- Kill 10   → Lore page 1 unlocked (origin story)
- Kill 50   → Lore page 2 unlocked (behavior notes) + monster card gold frame
- Kill 100  → Full stat table unlocked + weak/resist info
- Kill 500  → Rare drop table revealed + monster card animated frame
- Kill 1000 → "Hunter Expert" badge on card + account bonus contribution confirmed
```

### 3.3 Equipment Collection Flow

```
[Obtain Equipment]
Player obtains item_id (drop, craft, purchase, trade)
    → Server checks if player already has this item_id in equipCodexBits
    → If new: mark bit, log codex_completion_log, award Collection Points
    → S2C_CodexEntryUnlocked (entry_type=EQUIPMENT, item_id)
    → Client: shows "New Codex Entry" badge on item in inventory

[Equipment Set Completion]
    → Server tracks per-set completion (101 sets)
    → On set complete: bonus Collection Points, set artwork display unlocked
    → Set completion announcement in guild chat (optional, player can mute)
```

### 3.4 Pet Collection Flow

```
[Obtain Pet]
Player obtains pet (hatch egg, obtain from dungeon, event reward)
    → Server registers pet_type + variant in petCodexBits
    → Per-family tracking updated

Pet Families (10):
    Slime Family, Dragon Family, Beast Family, Undead Family, Elemental Family,
    Mechanical Family, Plant Family, Aquatic Family, Shadow Family, Holy Family

[Pet Family Completion]
    → All variants in family obtained → family badge unlocked
    → Cosmetic: "Family Master" title + animated background in Codex
```

### 3.5 Relic Collection Flow

```
[Relic Obtained]
    → relicCollectedBits[3] already tracks this (existing SaveData V5)
    → Codex reads relicCollectedBits directly — NO duplicate tracking
    → CodexManager subscribes to RelicManager.OnRelicCollected event
    → Tier completion checks:
        T1 Complete (all 45 T1 relics) → +0.15% of Relic Codex bonus unlocked
        T2 Complete (all 45 T2 relics) → +0.15% of Relic Codex bonus unlocked
        T3 Complete (all 45 T3 relics) → +0.10% of Relic Codex bonus unlocked
        Total Relic Codex → +0.4% ATK
```

### 3.6 Artifact Collection Flow

```
[Artifact Obtained]
    → First time obtaining artifact_id → artifactCodexBits updated
    → 45 artifacts total, artifactCodexBits needs 45 bits → 6 bytes (48 bits, 3 spare)
    → Completion tiers: 25%/50%/75%/100%
    → Full 45 artifacts: +0.5% HP bonus activated
```

### 3.7 Account Bonus Accumulation

```
[On Login / On Codex Entry Unlock]
Server recalculates account-wide bonus:

bonus_atk += (monsterCodexCompletion == 1.0) ? 0.003 : 0.0
bonus_atk += (equipCodexCompletion == 1.0) ? 0.005 : 0.0
bonus_atk += (petCodexCompletion == 1.0) ? 0.003 : 0.0
bonus_hp  += (petCodexCompletion == 1.0) ? 0.003 : 0.0
bonus_atk += (relicCodexCompletion == 1.0) ? 0.004 : 0.0
bonus_hp  += (artifactCodexCompletion == 1.0) ? 0.005 : 0.0

Total ATK bonus (all categories): max 1.5%
Total HP bonus (all categories): max 0.8%
Combined ceiling enforced at server: max 2.0% of power budget

S2C_CodexBonusApplied sent on any change.
```

> NOTE: Bonuses are all-or-nothing per category (không có partial bonus từ 50% completion). Chỉ 100% mới kích hoạt. Điều này là intentional để prevent "good enough" behavior và reward completionism.

---

## 4. ECONOMY INTEGRATION

### 4.1 Collection Points

Collection Points (CP) là cosmetic-only currency, không có power value.

**Sources của CP:**
| Source | CP Earned |
|--------|-----------|
| First kill/obtain mỗi Codex entry | 5 CP |
| Monster kill milestone (10/50/100/500/1000) | 2 / 5 / 10 / 20 / 50 CP |
| Equipment set completion | 100 CP |
| Pet family completion | 150 CP |
| Relic tier completion (T1/T2/T3) | 200 CP each |
| Category milestone 25% | 500 CP |
| Category milestone 50% | 1,000 CP |
| Category milestone 75% | 2,500 CP |
| Category milestone 100% | 10,000 CP |

**CP Sink — Codex Shop:**
| Item | CP Cost | Type |
|------|---------|------|
| Monster Card Frame (Silver) | 200 CP | Cosmetic |
| Monster Card Frame (Gold) | 800 CP | Cosmetic |
| Monster Card Frame (Animated) | 2,500 CP | Cosmetic |
| Housing: Codex Display Wall | 1,000 CP | Housing Furniture |
| Housing: Monster Trophy Mount | 500 CP | Housing Furniture |
| Housing: Relic Showcase Stand | 750 CP | Housing Furniture |
| Title: "Archivist" | 3,000 CP | Title Cosmetic |
| Title: "Monster Scholar" | 5,000 CP | Title Cosmetic |
| Title: "Grand Collector" | 20,000 CP | Title Cosmetic (rare) |
| Profile Background: Bestiary | 1,500 CP | Profile Cosmetic |
| Profile Background: Equipment Room | 1,500 CP | Profile Cosmetic |
| Emote: Monster Summon Pose | 2,000 CP | Emote |
| Pet Skin: Codex Edition Slime | 8,000 CP | Pet Cosmetic |

**CP Rules:**
- CP không expire
- CP không transferable
- CP không purchasable with real money (strictly earned)
- CP không xuất hiện trong economy report (không ảnh hưởng cân bằng kinh tế)

### 4.2 Codex Shop vs. Main Shop

Codex Shop là parallel shop, không thay thế premium shop. Mọi item trong Codex Shop là cosmetic, không có overlap với power items trong premium shop. Engineer cần đảm bảo shop_type flag trong backend để phân biệt rõ ràng.

### 4.3 Housing Integration (Non-Power)

Codex display furniture cho Housing system:
- Monster Trophy Mount: Hiển thị animated monster card từ Codex (player chọn)
- Relic Showcase Stand: Hiển thị 3D relic model
- Equipment Display Case: Hiển thị equipment theo set

Furniture này là VISUAL ONLY — không buff combat stats, không giới hạn theo housing tier. Tất cả players có housing access đều dùng được nếu có đủ CP.

---

## 5. PROGRESSION INTEGRATION

### 5.1 Codex-Gated Optional Content

Codex completion không gate MANDATORY content. Chỉ gate OPTIONAL content:

| Completion Requirement | Unlocked Content |
|------------------------|------------------|
| Monster Codex 50% | "Lore Room" in Biome 1-5 (flavor content) |
| Monster Codex 75% | Secret Biome: The Archive (visual only, no drops) |
| Equipment Codex 50% | Codex Forge visual tour (no crafting, educational UI) |
| Relic Codex T1 Complete | Hidden chamber in Dungeon 1 (treasure, not boss) |
| All Categories 100% | "The Grand Archive" secret room (best cosmetic drop) |

### 5.2 Achievement Integration

Codex completion triggers Achievement system events:
- `CODEX_MONSTER_25` → Achievement: "Budding Naturalist"
- `CODEX_MONSTER_100` → Achievement: "Supreme Bestiarian"
- `CODEX_EQUIP_50` → Achievement: "Item Scholar"
- `CODEX_ALL_100` → Achievement: "Grand Archivist" (Legendary tier, visible on profile)

Achievement points từ Codex không contribute to power — separate cosmetic track.

### 5.3 Season Integration

Seasonal monsters (từ SeasonManager) có separate Codex tab: "Seasonal Archive". Seasonal entries không count toward permanent category completion. Khi season kết thúc, seasonal entries lock (không lose progress, không delete, nhưng cũng không tiếp tục accumulate). Season-specific CP rewards expire with season.

### 5.4 Level Gating

| Player Level | Codex Features Unlocked |
|-------------|-------------------------|
| Level 1 | Monster Codex (basic) |
| Level 20 | Equipment Codex |
| Level 30 | Pet Codex |
| Level 50 | Relic Codex |
| Level 70 | Artifact Codex |
| Level 100 | Codex Shop opens |
| Level 200 | Account Bonus activatable |

> Rationale: Prevent new players from seeing Codex Shop at Level 1 and feeling overwhelmed. Level gates are UX gates, not hard locks.

---

## 6. MULTIPLAYER INTEGRATION

### 6.1 Public Codex Profile

Mỗi player có public Codex Profile page viewable by anyone:

```
[Codex Profile Page]
┌─────────────────────────────────────┐
│  [Avatar] PlayerName Lv.XXXX        │
│  [Grand Archivist title if earned]  │
├──────────────────────────────────────┤
│  Monster: 187/294  (63.6%)  ████░░  │
│  Equipment: 901/1521 (59.2%) ████░░  │
│  Pet: 52/84 (61.9%)  ████░░          │
│  Relic: 98/135 (72.6%) █████░        │
│  Artifact: 33/45 (73.3%) █████░      │
├──────────────────────────────────────┤
│  Featured Cards: [3 monster cards]  │
│  Collection Points Spent: 45,200    │
│  Achievement: Grand Naturalist      │
└─────────────────────────────────────┘
```

Players có thể set "featured cards" (3 slots) để flex rare/hard-to-get entries.

### 6.2 Guild Codex Display

Guild Hall có "Guild Codex Board" — aggregate display của guild members' completion:
- Tổng số monsters được kill bởi tất cả guild members
- "Guild Codex Leader": Member có highest overall completion %
- Weekly guild challenge: "Discover 50 new Codex entries this week" (collective)
- Guild Codex Board là decorative, không cung cấp power bonus

### 6.3 Codex Social Features

- "Compare Codex" với friend: Side-by-side completion view
- "Codex Discovery Feed": Recent unlocks từ friends (opt-in)
- "Missing Entries Help": Codex hiển thị "X friends have this monster — check Biome Y"
- Notification khi friend completes a category trước mình (healthy competition)

### 6.4 Party Codex Credit

Khi party kill một monster:
- TẤT CẢ party members trong cùng map zone đều nhận kill credit cho Codex
- Kill count +1 mỗi member (không shared pool)
- Item drop codex credit: CHỈ người nhận item mới được credit (không share loot codex)
- Điều này encourage party play cho monster Codex, không affect loot Codex fairness

---

## 7. SERVER AUTHORITY RULES

### 7.1 Registration Authority

```
RULE: Không có Codex entry nào được register từ client request.

Flow:
    Game Event (kill, obtain, etc.)
        → Server-side event handler
        → CodexManager.TryRegisterEntry(player_id, entry_type, entry_id)
        → Validate: player must have ACTUALLY performed the action
            (kill validated by combat log, obtain validated by inventory transaction)
        → If valid: update player_codex table, award CP, send S2C packet
        → If invalid: log anti-cheat alert, ignore

FORBIDDEN: Any C2S packet that says "register this codex entry for me"
```

### 7.2 Bonus Calculation Authority

```
RULE: Account Codex Bonus chỉ được calculate trên server.

Timing: Recalculated on:
    - Login
    - Any Codex entry unlock
    - Daily server tick (sanity check)

Result: Stored in player_stats table as codex_bonus_atk, codex_bonus_hp
Applied: Before each combat session as flat multiplier
Sent to client: Via existing stat update packet (không expose raw calculation)

Client NEVER calculates this bonus. Client chỉ display số server đã tính.
```

### 7.3 Retroactive Migration Authority

```
On first login after Codex patch:
    Server reads existing bestiaryBits[5] → populates monsterCodexBits
    Server reads existing bestiaryKillCounts → populates kill milestones
    Server reads existing relicCollectedBits[3] → populates relicCodexBits
    Server reads existing itemDiscoveryBits[24] → populates equipCodexBits (partial)
    
Migration is idempotent (safe to run multiple times).
Migration log stored in player_codex_migration table.
```

### 7.4 Shop Purchase Authority

```
C2S_CodexShopBuy {
    shop_item_id: uint16
    client_cp_balance: uint32  // advisory only, server ignores
}

Server flow:
    1. Load server-side CP balance for player
    2. Load shop item definition (price, type)
    3. Check: balance >= price
    4. Check: item not already purchased (codexShopPurchasedBits)
    5. If pass: deduct CP, mark purchased, deliver cosmetic, log transaction
    6. If fail: return error code
```

---

## 8. ANTI-EXPLOIT RULES

### 8.1 Combat Log Validation

Monster kill Codex credit requires:
- `combat_log` entry for this player + monster_id trong cùng session
- Monster phải thực sự chết (`hp_final = 0`)
- Kill không được flagged là "invalid" bởi anti-cheat combat system
- Kill timestamp phải trong 60 giây của request (prevent replay)

### 8.2 Item Obtain Validation

Equipment/Relic/Artifact Codex credit requires:
- Inventory transaction log entry: `source = DROP | CRAFT | PURCHASE | REWARD`
- KHÔNG credit nếu item_id chưa từng có trong inventory transaction log
- Trade-received items DO count (legitimate obtain)
- Cheat-spawned items (detected by anti-cheat) bị flag, không credit

### 8.3 Retroactive Injection Prevention

```
On migration (8.2 above):
    ONLY credit entries with matching audit trail in existing tables:
    - bestiaryKillCounts[monster_id] > 0 → credit monster kills
    - inventory_history có record for item_id → credit equip obtain
    - relic_inventory has relic_id → credit relic
    
    Không credit based on client-sent data.
    Không credit entries mà không có audit trail.
```

### 8.4 CP Inflation Prevention

- CP chỉ awarded một lần mỗi entry (first obtain only)
- Duplicate prevention: Check bit trước khi award CP
- CP không expire nhưng có hard cap: 999,999 CP maximum (prevent integer overflow display)
- CP award audit logged: `codex_completion_log` table

### 8.5 Codex Profile Privacy

- Profile viewable by public nhưng không reveal inventory
- Chỉ show completion %, không show WHICH specific items
- "Featured Cards" là player choice — voluntary disclosure
- Anti-stalking: Block feature có thể hide codex profile

### 8.6 Multi-Account Farming Prevention

- Codex credit per account, không per character (account-wide)
- Alt account kills không credit main account (separate accounts, separate Codex)
- Party kill credit: All party members credit, nhưng kill rate detection nếu bất thường (bot detection trong BestiaryManager đã có — reuse)

---

## 9. DATABASE STRUCTURE

### 9.1 `codex_definitions` Table

```sql
CREATE TABLE codex_definitions (
    codex_id        SERIAL PRIMARY KEY,
    entry_type      VARCHAR(20) NOT NULL,  -- MONSTER|EQUIPMENT|PET|RELIC|ARTIFACT
    entry_id        INT NOT NULL,          -- foreign key to respective table
    display_name    VARCHAR(100) NOT NULL,
    lore_pages      JSONB,                 -- array of lore page text
    artwork_asset   VARCHAR(200),          -- client asset path
    rarity          VARCHAR(20),           -- COMMON|UNCOMMON|RARE|EPIC|LEGENDARY
    set_id          INT,                   -- for equipment: which set (1-101)
    family_id       INT,                   -- for pets: which family (1-10)
    tier            INT,                   -- for relics: T1|T2|T3
    kill_milestones INT[] DEFAULT '{1,10,50,100,500,1000}', -- for monsters only
    cp_on_unlock    INT NOT NULL DEFAULT 5,
    sort_order      INT,
    is_seasonal     BOOLEAN DEFAULT FALSE,
    season_id       INT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entry_type, entry_id)
);

CREATE INDEX idx_codex_def_type ON codex_definitions(entry_type);
CREATE INDEX idx_codex_def_set ON codex_definitions(set_id) WHERE set_id IS NOT NULL;
CREATE INDEX idx_codex_def_family ON codex_definitions(family_id) WHERE family_id IS NOT NULL;
```

### 9.2 `player_codex` Table

```sql
CREATE TABLE player_codex (
    player_id           BIGINT NOT NULL,
    entry_type          VARCHAR(20) NOT NULL,
    entry_id            INT NOT NULL,
    first_obtained_at   TIMESTAMPTZ NOT NULL,
    kill_milestone_bits SMALLINT DEFAULT 0,    -- for monsters: bitmask of 6 milestones
    highest_kill_count  INT DEFAULT 0,          -- for monsters: denormalized from bestiary
    cp_awarded          INT DEFAULT 0,
    is_featured         BOOLEAN DEFAULT FALSE,  -- player chose to feature this
    PRIMARY KEY (player_id, entry_type, entry_id),
    FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX idx_player_codex_player ON player_codex(player_id);
CREATE INDEX idx_player_codex_type ON player_codex(player_id, entry_type);
```

### 9.3 `player_codex_summary` Table

```sql
-- Denormalized summary for fast lookup and display
CREATE TABLE player_codex_summary (
    player_id               BIGINT PRIMARY KEY,
    monster_count           SMALLINT DEFAULT 0,
    equipment_count         SMALLINT DEFAULT 0,
    pet_count               SMALLINT DEFAULT 0,
    relic_count             SMALLINT DEFAULT 0,
    artifact_count          SMALLINT DEFAULT 0,
    collection_points       INT DEFAULT 0,
    collection_points_spent INT DEFAULT 0,
    monster_bonus_active    BOOLEAN DEFAULT FALSE,
    equipment_bonus_active  BOOLEAN DEFAULT FALSE,
    pet_bonus_active        BOOLEAN DEFAULT FALSE,
    relic_bonus_active      BOOLEAN DEFAULT FALSE,
    artifact_bonus_active   BOOLEAN DEFAULT FALSE,
    codex_bonus_atk         DECIMAL(5,4) DEFAULT 0.0,
    codex_bonus_hp          DECIMAL(5,4) DEFAULT 0.0,
    last_entry_at           TIMESTAMPTZ,
    last_bonus_calc_at      TIMESTAMPTZ,
    FOREIGN KEY (player_id) REFERENCES players(id)
);
```

### 9.4 `codex_shop_purchases` Table

```sql
CREATE TABLE codex_shop_purchases (
    id              BIGSERIAL PRIMARY KEY,
    player_id       BIGINT NOT NULL,
    shop_item_id    SMALLINT NOT NULL,
    cp_spent        INT NOT NULL,
    purchased_at    TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX idx_codex_shop_player ON codex_shop_purchases(player_id);
```

### 9.5 `codex_completion_log` Table

```sql
-- Audit trail for all Codex events (anti-exploit, GM review)
CREATE TABLE codex_completion_log (
    id              BIGSERIAL PRIMARY KEY,
    player_id       BIGINT NOT NULL,
    event_type      VARCHAR(40) NOT NULL,  -- ENTRY_UNLOCK|MILESTONE|BONUS_ACTIVATED|CP_AWARDED|CP_SPENT
    entry_type      VARCHAR(20),
    entry_id        INT,
    detail_json     JSONB,
    cp_delta        INT DEFAULT 0,
    server_id       SMALLINT,
    session_id      BIGINT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_codex_log_player ON codex_completion_log(player_id, created_at DESC);
CREATE INDEX idx_codex_log_event ON codex_completion_log(event_type, created_at DESC);
-- Partition by month for performance
```

### 9.6 `codex_shop_definitions` Table

```sql
CREATE TABLE codex_shop_definitions (
    shop_item_id    SERIAL PRIMARY KEY,
    item_name       VARCHAR(100) NOT NULL,
    description     TEXT,
    item_type       VARCHAR(40) NOT NULL,  -- CARD_FRAME|HOUSING|TITLE|EMOTE|PET_SKIN|PROFILE_BG
    cp_cost         INT NOT NULL,
    asset_id        VARCHAR(200),
    is_active       BOOLEAN DEFAULT TRUE,
    sort_order      INT DEFAULT 0,
    added_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### 9.7 `codex_migration_log` Table

```sql
CREATE TABLE codex_migration_log (
    player_id       BIGINT PRIMARY KEY,
    migrated_at     TIMESTAMPTZ NOT NULL,
    monster_credits INT DEFAULT 0,
    equip_credits   INT DEFAULT 0,
    relic_credits   INT DEFAULT 0,
    cp_awarded      INT DEFAULT 0,
    migration_ver   SMALLINT DEFAULT 1
);
```

---

## 10. SAVE DATA STRUCTURE

### 10.1 Client-Side Save (CodexClientCache)

Client save chỉ là cache — source of truth là server database.

```csharp
[Serializable]
public class CodexClientCache
{
    // Không lưu save phía client cho Codex — tất cả từ server
    // Client chỉ cache kết quả gần nhất để hiển thị offline/fast-load
    
    // Cached from S2C_CodexProgress
    public int monsterCount;       // 0-294
    public int equipCount;         // 0-1521
    public int petCount;           // 0-84
    public int relicCount;         // 0-135
    public int artifactCount;      // 0-45
    public int collectionPoints;
    public float codexBonusAtk;    // server-calculated, display only
    public float codexBonusHp;     // server-calculated, display only
    
    // Category bonus flags (display only)
    public bool monsterBonusActive;
    public bool equipBonusActive;
    public bool petBonusActive;
    public bool relicBonusActive;
    public bool artifactBonusActive;
    
    // Shop purchased bits (for greying out shop UI)
    public byte[] shopPurchasedBits; // 4 bytes = 32 items, expand as needed
    
    public long lastSyncTimestamp;
}
```

### 10.2 Server-Side Save Data (Fields mới trong CollectionData)

Bổ sung vào CollectionData hiện có (Save Data V5):

```csharp
// EXISTING fields (không thay đổi):
// achievementBits[16], bestiaryBits[5], itemDiscoveryBits[24]
// questCompleteBits[6], relicCollectedBits[3], bestiaryKillCounts dict

// NEW fields added to CollectionData:
public struct CodexSaveExtension
{
    // Pet Codex: 84 pets, 11 bytes (88 bits, 4 spare)
    public byte[] petCodexBits;        // [11] — 84 pets

    // Artifact Codex: 45 artifacts, 6 bytes (48 bits, 3 spare)
    public byte[] artifactCodexBits;   // [6] — 45 artifacts

    // Equipment Codex: 1521 items, 191 bytes (1528 bits, 7 spare)
    // NOTE: overlaps with itemDiscoveryBits[24] for first 192 items
    // Full equip codex uses separate field
    public byte[] equipCodexBits;      // [191] — 1521 equipment

    // Codex Shop purchased: 32 items currently, expand as needed
    public uint codexShopPurchasedBits; // 32 bit flags

    // Monster kill milestones: 294 monsters × 6 bits = 1764 bits = 221 bytes
    // Each monster: 6 bits for {1,10,50,100,500,1000} milestones
    public byte[] monsterMilestoneBits; // [221]

    // Collection Points (earned - spent)
    public int collectionPoints;        // max 999,999

    // Relic tier completion flags
    public byte relicTierBits;          // bit0=T1_complete, bit1=T2_complete, bit2=T3_complete

    // Pet family completion flags (10 families, 10 bits)
    public ushort petFamilyBits;

    // Equipment set completion (101 sets, 13 bytes = 104 bits, 3 spare)
    public byte[] equipSetBits;         // [13]

    // Featured card slots (3 slots: entryType+entryId pairs)
    public FeaturedCard[] featuredCards; // array[3]
}

public struct FeaturedCard
{
    public byte entryType;   // 0=monster,1=equip,2=pet,3=relic,4=artifact
    public int entryId;
}
```

### 10.3 Save Data Size Analysis

| Field | Size |
|-------|------|
| petCodexBits[11] | 11 bytes |
| artifactCodexBits[6] | 6 bytes |
| equipCodexBits[191] | 191 bytes |
| codexShopPurchasedBits | 4 bytes |
| monsterMilestoneBits[221] | 221 bytes |
| collectionPoints | 4 bytes |
| relicTierBits | 1 byte |
| petFamilyBits | 2 bytes |
| equipSetBits[13] | 13 bytes |
| featuredCards[3] | 15 bytes (5 per card) |
| **Total new** | **~468 bytes** |

Server stores this in MessagePack format (~350 bytes compressed). Acceptable for Save Data V5 budget.

---

## 11. NETWORK REQUIREMENTS

### 11.1 Packet Definitions

#### S2C_CodexEntryUnlocked

Sent when player unlocks a new Codex entry hoặc hits a milestone.

```
S2C_CodexEntryUnlocked {
    packet_id:        0x4101
    entry_type:       uint8    // 0=MONSTER, 1=EQUIPMENT, 2=PET, 3=RELIC, 4=ARTIFACT
    entry_id:         uint32
    milestone_type:   uint8    // 0=FIRST_UNLOCK, 1=KILL_10, 2=KILL_50... 6=KILL_1000
    cp_awarded:       uint16   // Collection Points awarded this event
    total_cp:         uint32   // Player's new total CP
    category_count:   uint16   // New total entries in this category
    is_category_new_tier: bool // Did this complete a % milestone (25/50/75/100)?
    tier_milestone:   uint8    // 0=none, 1=25%, 2=50%, 3=75%, 4=100%
}
```

#### S2C_CodexBonusApplied

Sent when account bonus changes (category completed).

```
S2C_CodexBonusApplied {
    packet_id:        0x4102
    bonus_source:     uint8    // which category triggered
    new_bonus_atk:    float32  // total ATK bonus (0.0 to 0.015)
    new_bonus_hp:     float32  // total HP bonus (0.0 to 0.008)
    monster_active:   bool
    equip_active:     bool
    pet_active:       bool
    relic_active:     bool
    artifact_active:  bool
}
```

#### C2S_CodexShopBuy

```
C2S_CodexShopBuy {
    packet_id:        0x4110
    shop_item_id:     uint16
    // No CP amount — server reads from DB
}
```

#### S2C_CodexShopBuyResult

```
S2C_CodexShopBuyResult {
    packet_id:        0x4111
    success:          bool
    error_code:       uint8    // 0=ok, 1=insufficient_cp, 2=already_owned, 3=item_invalid
    shop_item_id:     uint16
    cp_spent:         uint16
    remaining_cp:     uint32
    item_delivered:   bool
}
```

#### S2C_CodexProgress (Full Sync)

Sent on login và on request. Large packet, sent infrequently.

```
S2C_CodexProgress {
    packet_id:          0x4103
    monster_count:      uint16   // entries in Codex (not kill count)
    monster_total:      uint16   // 294
    equip_count:        uint16
    equip_total:        uint16   // 1521
    pet_count:          uint16
    pet_total:          uint16   // 84
    relic_count:        uint16
    relic_total:        uint16   // 135
    artifact_count:     uint8
    artifact_total:     uint8    // 45
    collection_points:  uint32
    bonus_atk:          float32
    bonus_hp:           float32
    shop_purchased_bits: uint32
    pet_family_bits:    uint16
    relic_tier_bits:    uint8
    equip_set_bits:     uint8[13]
    featured_cards:     {entry_type:uint8, entry_id:uint32}[3]
    // Individual entry bits NOT sent in this packet (too large)
    // Request specific category bits via C2S_CodexCategoryRequest
}
```

#### C2S_CodexCategoryRequest / S2C_CodexCategoryData

```
C2S_CodexCategoryRequest {
    packet_id:    0x4104
    entry_type:   uint8
    page:         uint8  // for equipment: paged (0-5, 256 entries per page)
}

S2C_CodexCategoryData {
    packet_id:    0x4105
    entry_type:   uint8
    page:         uint8
    data_bits:    bytes  // variable length bit array for this category/page
    milestone_bits: bytes // for monsters: milestone bits per entry
}
```

### 11.2 Bandwidth Analysis

| Packet | Size | Frequency |
|--------|------|-----------|
| S2C_CodexEntryUnlocked | ~20 bytes | On unlock event |
| S2C_CodexBonusApplied | ~12 bytes | Rare (category complete) |
| S2C_CodexProgress | ~50 bytes | Login + manual refresh |
| S2C_CodexCategoryData | 32-192 bytes | On tab open |
| C2S_CodexShopBuy | 3 bytes | On purchase |

Tổng bandwidth impact: Negligible (< 0.1% của total game traffic).

### 11.3 Caching Strategy

- `S2C_CodexProgress` cached trên client 5 phút (không cần refresh mỗi frame)
- Category data cached cho đến khi có `S2C_CodexEntryUnlocked` invalidate
- Shop definitions cached 1 giờ (từ CDN, không real-time)
- Codex definitions (lore text, artwork paths) served từ CDN, không qua game server

---

## 12. EDGE CASES

### 12.1 Monster Not in Codex Definition

**Scenario:** BestiaryManager cập nhật kill count cho monster_id = 9999 nhưng codex_definitions không có entry.  
**Handling:** CodexManager bỏ qua silently. Log warning. Không crash. Monster được add vào codex_definitions khi patch tiếp theo.

### 12.2 Retroactive Migration — Missing Kill Counts

**Scenario:** Player có bestiaryBits cho monster 50 nhưng bestiaryKillCounts không có entry (data corruption).  
**Handling:** Credit kill milestone 1 (first kill) based on bit. Không credit milestones 10+ vì không có proof. Log cho GM review.

### 12.3 Item Obtained Then Deleted

**Scenario:** Player obtains item (Codex credits), then item deleted by GM for exploit.  
**Handling:** Codex credit KHÔNG bị revoke (player legitimately obtained it). Item delete là separate action. Nếu item was exploit-obtained từ đầu: anti-cheat flags the transaction, Codex credit bị denied tại time of obtain.

### 12.4 Equipment Set Partially Deleted

**Scenario:** 101 equipment sets, nhưng item re-balance patch removes 2 items from a set (set now has 0 items).  
**Handling:** Set completion requirements updated in codex_definitions. Players who completed old set retain completion status (keep CP, keep display). Set badge shows "Legacy" tag.

### 12.5 Player Hits CP Cap (999,999)

**Scenario:** Player earns CP but at 999,999.  
**Handling:** Server clips at 999,999. Sends S2C_CodexEntryUnlocked with cp_awarded=0 and note in detail field. Client shows "Max CP" indicator.

### 12.6 Multiple Simultaneous Kills

**Scenario:** AoE attack kills 10 monsters simultaneously.  
**Handling:** Server processes each kill sequentially trong same transaction. Mỗi kill generates separate Codex event. Client receives multiple S2C_CodexEntryUnlocked packets trong cùng frame — client queues và shows notification sequence (1 per second, không spam).

### 12.7 Season Monster in Permanent Bestiary

**Scenario:** Seasonal monster (mùa Halloween) được keep trong bestiary vĩnh viễn sau season.  
**Handling:** Monster entry trong codex_definitions có `is_seasonal=false` nếu permanent. SeasonManager flags the transition. Codex credit continues post-season.

### 12.8 Character Delete

**Scenario:** Player deletes a character.  
**Handling:** Codex là account-wide, không character-bound. Character delete không affect Codex. This is intentional.

### 12.9 Account Merge (Future Feature)

**Scenario:** Two accounts merged.  
**Handling:** Union of all Codex bits (keep highest kill count per monster, keep all obtained items). CP: sum both accounts, cap at 999,999. Bonus: recalculate from merged data. Deduplication via codex_migration_log.

### 12.10 Server Downtime During Codex Event

**Scenario:** Server crashes mid-Codex-unlock (after kill credited, before Codex entry written).  
**Handling:** Codex registration happens trong same database transaction as kill credit. If transaction commits: Codex registered. If rollback: neither registered. No partial state.

---

## 13. FUTURE SCALABILITY

### 13.1 Entry Count Expansion

| Current | Expansion Path |
|---------|---------------|
| 294 monsters | Up to 512 (bestiaryBits extend from [5] to [8] — 64 bytes) |
| 1521 equipment | Up to 2048 (equipCodexBits extend from [191] to [256]) |
| 135 relics | Up to 192 (relicCollectedBits extend from [3] to [4]) |
| 45 artifacts | Up to 64 (artifactCodexBits: [6] already supports 48, extend to [8]) |
| 84 pets | Up to 128 (petCodexBits extend from [11] to [16]) |

Expansion chỉ cần update bit array sizes và codex_definitions — không thay đổi schema.

### 13.2 New Entry Types

Future Codex categories có thể add mà không break existing:
- **Dungeon Codex:** Track completed dungeons, boss kills, speed records
- **Skill Codex:** Track skill usage milestones
- **World Event Codex:** Track participated events

Add new `entry_type` enum value + new bit array field trong CodexSaveExtension. Backward compatible.

### 13.3 Power Budget Expansion (IF NEEDED)

Hiện tại 2.0% budget LOCKED. Nếu future design tăng budget:
- All current categories remain at current bonus values
- New categories get allocation from expanded budget
- Không retroactively increase old category bonuses (avoid power creep)

### 13.4 Codex Shop Expansion

Shop hiện dùng `uint32 codexShopPurchasedBits` = 32 items. Expansion:
- Extend to `uint64` = 64 items (minimal save data increase)
- Or: `byte[] shopPurchasedBits` dynamic array (unlimited, slightly more complex)

### 13.5 Localization

Tất cả Codex lore text, item names, display names trong codex_definitions.lore_pages là JSONB với language key:
```json
{
  "vi": "Slime đỏ hung hãn sống ở vùng núi lửa...",
  "en": "The fierce Red Slime inhabits volcanic regions...",
  "ja": "赤いスライムは火山地帯に生息する凶暴な...",
  "zh": "凶猛的红史莱姆栖息在火山地区..."
}
```

### 13.6 Analytics Integration

`codex_completion_log` thiết kế để feed analytics pipeline:
- Daily active completionists (DAC) metric
- Funnel: first unlock → 25% → 50% → 100%
- CP earn rate vs. spend rate per player segment
- Most popular shop items
- Collection completion distribution across player base

All analytics read-only, từ replica DB, không impact game server.

---

## APPENDIX A: CATEGORY SIZE REFERENCE

| Category | Total | Milestone Type | CP per Entry | Max CP from Category |
|----------|-------|----------------|-------------|---------------------|
| Monster | 294 | Kill milestones | 5 + milestone bonuses | ~6,000 |
| Equipment | 1521 | First obtain | 5 | 7,605 + set bonuses |
| Pet | 84 | First obtain | 5 | 420 + family bonuses |
| Relic | 135 | First obtain | 5 | 675 + tier bonuses |
| Artifact | 45 | First obtain | 5 | 225 |
| Milestones (all %) | — | Category % | 500/1k/2.5k/10k | 70,000 |
| **Total Max CP** | | | | **~85,000** |

---

## APPENDIX B: ACCOUNT BONUS SUMMARY

| Category | Condition | ATK Bonus | HP Bonus |
|----------|-----------|-----------|---------|
| Monster Codex | 100% (all 294) | +0.3% | — |
| Equipment Codex | 100% (all 1521) | +0.5% | — |
| Pet Codex | 100% (all 84) | +0.3% | +0.3% |
| Relic Codex | 100% (all 135) | +0.4% | — |
| Artifact Codex | 100% (all 45) | — | +0.5% |
| **TOTAL** | | **+1.5% ATK** | **+0.8% HP** |
| **Combined Power** | | **= 2.0% budget** | **(V3 LOCKED)** |

---

*Document End — 06_COLLECTION_CODEX_SYSTEM.md*  
*Next: 07_DAILY_WEEKLY_ACTIVITY_SYSTEM.md*
