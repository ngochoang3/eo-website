# SYSTEM 12 — Housing System
> Status: MISSING → thiết kế từ đầu
> Power Budget: 0% (utility + social only)
> Ngày: 2026-06-13

---

# 1. Purpose

Housing cho phép player xây dựng **ngôi nhà/trang trại cá nhân** trong thế giới game. Mục đích: social hub, passive resource generation, cosmetic expression. **Không có combat power contribution**.

---

# 2. Design Philosophy

- **No power** — Housing chỉ là utility, social, passive resource
- **Visitors** — Player khác có thể visit nhà (incentive để decorate)
- **Progression tied to main game** — mở thêm housing tính năng theo level
- **Craft station** — nhà có crafting station riêng, tiện hơn ngoài field
- **Passive income** — nhà generate 1 loại resource nhỏ mỗi giờ (không ảnh hưởng balance)

---

# 3. Core Loop

```
[Player Lv 50 → Housing Plot unlocks]
        │
        ▼
[Place basic furniture (from drop/craft)]
        │
        ▼
[Upgrade Plot (Lv 1-10) → more floor space]
        │
        ▼
[Add Crafting Station → craft items in housing]
        │
        ▼
[Invite friends → Social hub]
        │
        ▼
[Passive generator (herb garden, mine) → collect hourly]
        │
        ▼
[Housing Rating → visitor count → cosmetic reward]
```

---

# 4. Progression Loop

| Plot Level | Floor Area | Furniture Slots | Unlock |
|---|---|---|---|
| 1 | 5×5 | 10 | Basic furniture |
| 2 | 6×6 | 15 | Herb garden |
| 3 | 7×7 | 20 | Basic craft station |
| 5 | 8×8 | 30 | Mine (ore passive) |
| 7 | 10×10 | 50 | Pet house |
| 10 | 12×12 | 80 | Display hall, arena |

---

# 5. Data Architecture

## 5.1 Entity

```
PlotDataSO
├── plot_id: string              ("plot_meadow_s","plot_cave_m","plot_void_xl")
├── plot_name: string
├── biome_theme: int
├── base_size_x: int             (5)
├── base_size_z: int             (5)
├── max_level: int               (10)
├── unlock_level: int            (50)
├── monthly_rent_gold: int       (1000 per month, gold sink)
└── visual_kit: string

FurnitureDataSO
├── id: string                   ("furn_table_oak_01")
├── name: string
├── category: string             ("Decoration","Functional","Generator","Display")
├── rarity: string
├── size_x, size_z: int          (footprint)
├── height: float
├── source: string               ("craft","drop","event","achievement")
├── passive_type: string         ("none","herb","ore","lumber","fish")
├── passive_yield: float         (items per hour)
├── passive_item_id: string
├── craft_cost_gold: int
├── craft_recipe: string
└── lore: string

HousingSave
├── plot_id: string
├── plot_level: int              (1-10)
├── furniture_placements: PlacedFurniture[]
│   ├── furniture_id: string
│   ├── x, y, z: float
│   ├── rotation: float
│   └── customization: string   (color/pattern if applicable)
├── last_collect_at: datetime
├── visitor_count: int
└── housing_rating: int          (1-5 stars)
```

## 5.2 Database Tables

```sql
CREATE TABLE plot_data (
    plot_id         VARCHAR(32) PRIMARY KEY,
    plot_name       VARCHAR(64) NOT NULL,
    biome_theme     TINYINT NOT NULL,
    base_size_x     TINYINT NOT NULL DEFAULT 5,
    base_size_z     TINYINT NOT NULL DEFAULT 5,
    max_level       TINYINT NOT NULL DEFAULT 10,
    unlock_level    SMALLINT NOT NULL DEFAULT 50,
    rent_gold_month INT NOT NULL DEFAULT 1000,
    visual_kit      VARCHAR(64)
);

CREATE TABLE plot_level_config (
    level           TINYINT PRIMARY KEY,
    size_x          TINYINT NOT NULL,
    size_z          TINYINT NOT NULL,
    furniture_slots INT NOT NULL,
    upgrade_gold    INT NOT NULL,
    upgrade_mat_req VARCHAR(128)
);

CREATE TABLE furniture_data (
    id              VARCHAR(64) PRIMARY KEY,
    name            VARCHAR(64) NOT NULL,
    category        VARCHAR(32) NOT NULL,
    rarity          VARCHAR(16) NOT NULL,
    size_x          TINYINT NOT NULL DEFAULT 1,
    size_z          TINYINT NOT NULL DEFAULT 1,
    source          VARCHAR(32) NOT NULL,
    passive_type    VARCHAR(16) NOT NULL DEFAULT 'none',
    passive_yield   FLOAT NOT NULL DEFAULT 0,
    passive_item_id VARCHAR(32),
    craft_cost_gold INT NOT NULL DEFAULT 0,
    lore            TEXT
);

CREATE TABLE player_housing (
    player_id       BIGINT PRIMARY KEY,
    plot_id         VARCHAR(32) REFERENCES plot_data(plot_id),
    plot_level      TINYINT NOT NULL DEFAULT 1,
    last_collect_at DATETIME,
    visitor_count   INT NOT NULL DEFAULT 0,
    housing_rating  TINYINT NOT NULL DEFAULT 1,
    furniture_json  MEDIUMTEXT,           -- JSON array of PlacedFurniture
    upgraded_at     DATETIME
);

CREATE TABLE housing_visit_log (
    visitor_id      BIGINT NOT NULL,
    host_id         BIGINT NOT NULL,
    visited_at      DATETIME NOT NULL,
    duration_sec    INT NOT NULL DEFAULT 0,
    INDEX idx_host (host_id, visited_at)
);
```

## 5.3 ID Rules

Plot: `plot_{biome_name}_{size}` → `plot_meadow_s`, `plot_cave_m`, `plot_void_xl`
Furniture: `furn_{category_prefix}_{theme}_{variant:02d}` → `furn_dec_oak_01`, `furn_gen_herb_02`

## 5.4 CSV Schema

`furniture_db.csv`:
```
id,name,category,rarity,size_x,size_z,source,passive_type,passive_yield,passive_item_id,craft_cost_gold,lore
furn_dec_oak_01,Oak Table,Decoration,Common,2,1,craft,none,0,,500,Bàn gỗ sồi thủ công từ Ancient Forest
furn_gen_herb_01,Herb Garden,Generator,Uncommon,2,2,craft,herb,0.5,item_0001,2000,Vườn thuốc nhỏ tạo ra herb mỗi giờ
furn_gen_ore_01,Small Mine,Generator,Rare,3,3,drop,ore,0.3,item_0009,0,Khai thác nhỏ tạo quặng mỗi giờ
furn_fun_forge_01,Personal Forge,Functional,Uncommon,3,2,craft,none,0,,5000,Lò rèn cá nhân — craft tại nhà
furn_fun_alchemy_01,Alchemy Table,Functional,Uncommon,2,2,craft,none,0,,4000,Bàn luyện kim cho potion
furn_dis_trophy_01,Trophy Display,Display,Rare,1,1,achievement,none,0,,0,Tủ trưng bày chiến tích
```

`plot_level_config.csv`:
```
level,size_x,size_z,furniture_slots,upgrade_gold,upgrade_mat_req
1,5,5,10,0,
2,6,6,15,50000,"meadow_fragment:5"
3,7,7,20,150000,"crystal_core:3"
4,7,7,25,300000,"volcanic_essence:2"
5,8,8,30,600000,"frozen_shard:5;ancient_bark:10"
6,8,8,40,1200000,"mystic_crystal:5"
7,10,10,50,2500000,"celestial_dust:3;ruin_stone:8"
8,10,10,60,5000000,"shadow_gem:5"
9,12,12,70,10000000,"ember_coal:10;frost_crystal:8"
10,12,12,80,20000000,"void_fragment:2"
```

## 5.5 JSON Schema

```json
{
  "player_housing": {
    "plot_id": "plot_meadow_s",
    "plot_level": 5,
    "last_collect_at": "2026-06-13T08:00:00Z",
    "visitor_count": 142,
    "housing_rating": 4,
    "furniture_placements": [
      {"furniture_id":"furn_dec_oak_01","x":2.0,"y":0,"z":3.0,"rotation":0,"customization":""},
      {"furniture_id":"furn_gen_herb_01","x":5.0,"y":0,"z":1.0,"rotation":90,"customization":""},
      {"furniture_id":"furn_fun_forge_01","x":1.0,"y":0,"z":7.0,"rotation":0,"customization":""}
    ]
  }
}
```

---

# 6. Formula Architecture

## 6.1 Passive Generation

```
PassiveYield(furniture, hoursSinceCollect) =
  min(hoursSinceCollect × passive_yield, max_accumulate_hours × passive_yield)

max_accumulate_hours = 24  (capped to prevent AFK farm)

TotalYield = ∑ PassiveYield(gen_furniture_i) for all generator furniture
```

## 6.2 Plot Upgrade Cost

```
UpgradeCost(level) = base_gold × 2^(level-1)
  Lv 1→2: 50,000
  Lv 2→3: 150,000  ...
  Lv 9→10: 20,000,000
```

## 6.3 Housing Rating

```
HousingRating = floor(
  (furniture_count_score × 0.4 +
   rarity_score × 0.3 +
   diversity_score × 0.2 +
   visitor_count_score × 0.1)
  × 5
)

furniture_count_score = min(1.0, furniture_count / furniture_max_slots)
rarity_score = (rare_count × 2 + epic_count × 3 + legend_count × 5) / 100
diversity_score = unique_categories / 5
visitor_count_score = min(1.0, visitor_count / 200)
```

## 6.4 Monthly Rent

```
MonthlyRent = plot.rent_gold_month × plot_level
  → Paid automatically from gold on 1st of each month
  → Non-payment: plot access restricted (cannot collect), not removed
```

---

# 7. Power Budget

**0% combat power.** Functional furniture (forge, alchemy) gives convenience (craft at home) not power advantage. Generator furniture is economy utility only.

---

# 8. Economy Impact

| Tài nguyên | Source | Sink |
|---|---|---|
| Gold | Gameplay | Plot upgrade, rent, furniture craft |
| Herbs/Ore/Fish | Passive generator (small) | Crafting consumables |
| Biome materials | Farming | Plot upgrade requirements |

**Anti-inflation:**
- Monthly rent creates recurring gold sink
- Passive capped at 24h — no AFK exploit
- Generator yield is small (supplement, not primary source)

---

# 9. Anti Power Creep

Housing không contribute power. Personal Forge convenience does not increase craft speed — just avoids travel to city.

---

# 10. Progression Table

| Player Level | Housing Feature |
|---|---|
| 50 | Housing plot unlocked, Plot Lv1 |
| 100 | Herb garden furniture available |
| 200 | Plot Lv3, craft station |
| 400 | Plot Lv5, mine |
| 700 | Plot Lv7, pet house |
| 1000 | Plot Lv8, display hall |
| 1500 | Plot Lv9 |
| 2000 | Plot Lv10 max |

---

# 11. Reward Structure

| Mốc | Reward |
|---|---|
| First furniture placed | Achievement "Homemaker" |
| Plot Lv5 | Title "Home Owner" |
| Plot Lv10 | Title "Estate Master" |
| 100 visitors | "Socialite" achievement |
| Rating 5 stars | "Interior Designer" title |
| All furniture types | "Collector's Home" |

---

# 12. RNG Design

No RNG in housing placement or rating. Passive yield is deterministic.
Generator items may have element RNG (which herb → random from biome's herb pool).

---

# 13. Anti Bad Luck System

Không áp dụng — housing không có RNG.

---

# 14. Collection Integration

"Home Collection" — discover furniture types. Rare/Event furniture tracked separately.
Trophy Display furniture shows achievements earned.

---

# 15. Achievement Integration

| Achievement | Condition |
|---|---|
| Homemaker | Place 1st furniture |
| Interior Expert | 50+ furniture placed |
| Five Star | Housing rating 5 |
| Social Hub | 500 visitors total |
| Full Plot | All furniture slots filled |

---

# 16. Season Integration

Seasonal furniture sets (cosmetic only): "Winter Cabin Set", "Beach House Set". Available in season shop.

---

# 17. PvE Integration

Personal Forge allows crafting equipment without going to city → convenience for players mid-dungeon session. Alchemy Table for potions. Housing is not dungeon-integrated directly.

---

# 18. PvP Integration

Không liên quan đến PvP.

---

# 19. Social Integration

- **Visit**: Visit friend's house, rate it
- **Co-op garden**: 2 players can place furniture in each other's plot (whitelisted)
- **Guild Hall**: Separate from personal housing — guild version of housing
- **Display case**: Shows off achievements, rare drops, collection pieces

---

# 20. Technical Architecture

## Class Diagram

```
PlotDataSO : ScriptableObject
├── string plotId, plotName, visualKit
├── int biomeTheme, baseSize, maxLevel, unlockLevel, rentGoldMonth

FurnitureDataSO : ScriptableObject
├── string id, name, category, rarity, source
├── int sizeX, sizeZ
├── string passiveType, passiveItemId
├── float passiveYield
├── int craftCostGold

HousingManager : MonoBehaviour
├── HousingSave _save
├── PlaceFurniture(furnitureId, x, z, rotation) : bool
├── RemoveFurniture(instanceIndex) : bool
├── CollectPassive() : ItemBundle
├── CalculateRating() : int
├── UpgradePlot() : bool
├── InvitePlayer(playerId) : void
└── ValidatePlacement(furnitureId, x, z) : bool

HousingPassiveService
├── CalculatePending(save) : ItemBundle
├── MarkCollected(save) : void
└── GetTimeUntilFull(save) : float
```

---

# 21. Save Data Architecture

```json
"housing": {
  "plot_id": "plot_meadow_s",
  "plot_level": 5,
  "last_collect_at": "2026-06-13T08:00:00Z",
  "visitor_count": 142,
  "housing_rating": 4,
  "furniture_placements": [...]
}
```

Dirty: `"housing"` (full object on any change — furniture JSON isn't split by field).

---

# 22. Network Architecture

Furniture place/remove: POST /api/v1/housing/furniture → validate slot count, collision detection.
Passive collect: POST /api/v1/housing/collect → server calculates pending yield.
Visit: GET /api/v1/housing/visit/{hostId} → read-only player housing data.

---

# 23. Security

| Threat | Prevention |
|---|---|
| Fake visitor count | Server tracks visits in housing_visit_log |
| Passive exploit | Server calculates from last_collect_at timestamp |
| Furniture collision | Server validates placement grid server-side |
| Infinite furniture | Server validates slot count < max |

---

# 24. LiveOps Hooks

```
event.housing_generator_boost = 2.0    (Holiday: double passive yield)
event.seasonal_furniture_available = true
flag.housing_system_enabled = true
remote_config.housing_max_accumulate_hours = 24
```

---

# 25. Content Pipeline

```
Google Sheet "Furniture DB"
  → furniture_db.csv (200+ items)
  → gen_furniture_db.py
  → furniture_db.json
  → FurnitureDataSO[] (Editor import)

Google Sheet "Plot Level Config"
  → plot_level_config.csv (10 rows)
  → PlotLevelConfigSO
```

---

# 26. Future Expansion

- Guild Hall (Year 1.5): larger version with guild-level furniture
- Housing Market: buy/sell furniture designs (cosmetic patterns)
- Cross-server housing district: best-rated homes featured server-wide
- Farm expansion: animal pen, fishing pond

---

# 27. Production Risks

| Rủi ro | Mức |
|---|---|
| Housing UI quá phức tạp cho mobile | HIGH |
| Passive generator economic imbalance | MEDIUM |
| Player spam visits for count manipulation | LOW |

---

# 28. Mitigation Plan

| Rủi ro | Giải pháp |
|---|---|
| Mobile UI | Snap-to-grid placement; simplified view mode |
| Economy imbalance | Generator yield capped; maximum 5 generators per plot |
| Visit manipulation | Minimum 5 minute visit counted; 1 count per visitor per day |

---

# 29. Unity Implementation Plan

```
Assets/script/SlimeMMO/Housing/
├── PlotDataSO.cs
├── PlotLevelConfigSO.cs
├── FurnitureDataSO.cs
├── HousingManager.cs
├── HousingPassiveService.cs
├── HousingRenderer.cs      (place/remove prefabs in scene)
└── SlimeMMO.Housing.asmdef

generators/
└── gen_furniture_db.py
```

---

# 30. Final Verdict

**Status: MISSING → PARTIAL after this document**

Không có BLOCKER impact (0% power) nhưng là key social/retention feature. Thiết kế đã xong — cần implement sau các BLOCKER stat systems.
