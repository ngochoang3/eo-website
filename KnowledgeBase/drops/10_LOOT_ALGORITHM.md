# SYSTEM 10 — Loot Algorithm
> Status: PARTIAL → cần formalize
> Ngày: 2026-06-13

---

# 1. Purpose

Loot Algorithm là engine phân phối phần thưởng — xác định WHAT drops, HOW MANY, với xác suất bao nhiêu. Bao gồm drop weight tables, group loot, personal loot, pity integration, và anti-farming protection.

---

# 2. Design Philosophy

- **Server-side only** — client không được biết drop weights
- **Personal loot** — mỗi player có drop riêng, không cạnh tranh
- **Weighted random** — không uniform; rare items có weight thấp
- **Pity-integrated** — loot kết hợp với pity system
- **Anti-inflation** — daily loot limits, biome-specific drops
- **Deterministic output** — given seed + weights → reproducible (auditable)

---

# 3. Core Loop

```
[Monster killed / Boss killed / Chest opened]
        │
        ▼
[Server: Determine loot table ID]
        │  (based on monster_id, biome, difficulty, context)
        ▼
[Server: Roll per player in personal loot]
        │
        ▼
[For each loot slot in table:]
  [Roll qty: uniform within range]
  [Roll item: weighted pick from pool]
  [Check pity: apply pity boost if applicable]
        │
        ▼
[Apply drop rate modifiers:]
  × difficulty_multiplier
  × biome_catch_up_multiplier (old biome ×3)
  × event_multiplier
  × vip_multiplier (cosmetic only, not P2W stat)
        │
        ▼
[Deliver to player inventory / mail if full]
```

---

# 4. Progression Loop

| Player Level | Loot Access |
|---|---|
| 1-100 | Biome 1-2 drops only |
| 100-500 | Biome 1-6 drops |
| 500-1000 | Biome 1-12 drops |
| 1000-1500 | All biomes |
| 1500-2000 | Biome 20-21 exclusive drops |
| Catch-Up | Old biome drop rate × 3 |

---

# 5. Data Architecture

## 5.1 Entity

```
DropWeightTableSO
├── id: string                    ("drop_boss_003_hard")
├── table_type: string            ("normal","boss","raid","chest","event")
├── biome: int
├── entries: DropEntry[]
│   ├── item_id: string
│   ├── weight: int               (higher = more common)
│   ├── qty_min: int
│   ├── qty_max: int
│   ├── pity_type: string         (link to PityConfigSO, or "")
│   └── is_guaranteed: bool       (always drops, weight 1000000)
├── rolls_per_kill: int           (how many rolls this table gets)
├── daily_limit: int              (0 = unlimited)
└── group_loot: bool              (false = personal loot)
```

## 5.2 Database Tables

```sql
CREATE TABLE drop_weight_table (
    id              VARCHAR(64) PRIMARY KEY,
    table_type      VARCHAR(16) NOT NULL,
    biome           TINYINT NOT NULL,
    rolls_per_kill  TINYINT NOT NULL DEFAULT 1,
    daily_limit     INT NOT NULL DEFAULT 0,
    group_loot      TINYINT NOT NULL DEFAULT 0
);

CREATE TABLE drop_weight_entry (
    table_id        VARCHAR(64) NOT NULL REFERENCES drop_weight_table(id),
    item_id         VARCHAR(32) NOT NULL,
    weight          INT NOT NULL,
    qty_min         TINYINT NOT NULL DEFAULT 1,
    qty_max         TINYINT NOT NULL DEFAULT 1,
    pity_type       VARCHAR(32),
    is_guaranteed   TINYINT NOT NULL DEFAULT 0,
    INDEX idx_table (table_id)
);

CREATE TABLE player_daily_loot (
    player_id       BIGINT NOT NULL,
    table_id        VARCHAR(64) NOT NULL,
    drop_date       DATE NOT NULL,
    drop_count      INT NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, table_id, drop_date)
);
```

## 5.3 ID Rules

Format: `drop_{source}_{biome:02d}_{difficulty}`
- `drop_mon_01_normal` — Normal monster, biome 1
- `drop_boss_03_hard` — Hard boss, biome 3
- `drop_raid_12_elite` — Elite raid, biome 12
- `drop_chest_21_event` — Event chest, biome 21

## 5.4 CSV Schema

`drop_weight_tables.csv`:
```
table_id,table_type,biome,rolls_per_kill,daily_limit,group_loot
drop_mon_01_normal,normal,1,2,0,false
drop_boss_03_hard,boss,3,5,1,false
drop_raid_12_elite,raid,12,10,1,true
```

`drop_weight_entries.csv`:
```
table_id,item_id,weight,qty_min,qty_max,pity_type,is_guaranteed
drop_mon_01_normal,gold_small,5000,10,50,,false
drop_mon_01_normal,item_0001,1000,1,3,,false
drop_mon_01_normal,equip_0010,100,1,1,equipment_rare,false
drop_mon_01_normal,equip_0020,10,1,1,equipment_epic,false
drop_mon_01_normal,equip_0050,1,1,1,equipment_legend,false
drop_boss_03_hard,gold_medium,3000,100,500,,true
drop_boss_03_hard,relic_fire_03_01,500,1,1,relic_any,false
drop_boss_03_hard,equip_0100,50,1,1,equipment_epic,false
drop_boss_03_hard,equip_0150,5,1,1,equipment_legend,false
```

## 5.5 JSON Schema

```json
{
  "name": "drop_tables",
  "tables": [
    {
      "id": "drop_boss_03_hard",
      "table_type": "boss",
      "biome": 3,
      "rolls_per_kill": 5,
      "daily_limit": 1,
      "group_loot": false,
      "entries": [
        {"item_id":"gold_medium","weight":3000,"qty_min":100,"qty_max":500,"pity_type":"","is_guaranteed":true},
        {"item_id":"relic_fire_03_01","weight":500,"qty_min":1,"qty_max":1,"pity_type":"relic_any","is_guaranteed":false},
        {"item_id":"equip_0100","weight":50,"qty_min":1,"qty_max":1,"pity_type":"equipment_epic","is_guaranteed":false},
        {"item_id":"equip_0150","weight":5,"qty_min":1,"qty_max":1,"pity_type":"equipment_legend","is_guaranteed":false}
      ]
    }
  ]
}
```

---

# 6. Formula Architecture

## 6.1 Weighted Roll

```csharp
string RollItem(DropWeightEntry[] entries, PityRecord rec, PityConfigSO cfg)
{
    // Sum total weight
    int total = 0;
    foreach (var e in entries) total += e.weight;

    // Roll
    int roll = (int)(NextFloat01() * total);
    int acc = 0;
    foreach (var e in entries)
    {
        acc += e.weight;
        if (roll < acc)
        {
            if (!string.IsNullOrEmpty(e.pityType))
            {
                // Check pity: if hard pity → force this entry
                bool pityForce = PityManager.Roll(rec, cfg);
                if (!pityForce && NextFloat01() > GetBaseRate(e, cfg))
                    return null; // roll again next entry
            }
            return e.itemId;
        }
    }
    return entries[entries.Length - 1].itemId;
}
```

## 6.2 Drop Rate Modifiers (multiplicative on qty, NOT on power)

```
EffectiveDropRate = BaseWeight × DifficultyMult × CatchUpMult × EventMult

DifficultyMult:
  Normal: ×1.0
  Hard:   ×1.5
  Elite:  ×2.0
  Heroic: ×3.0

CatchUpMult (old biome):
  Biome age fraction > 0.5 → ×3.0
  Biome age fraction > 0.8 → ×5.0

EventMult: configured via LiveOps (default 1.0)
```

## 6.3 Daily Limit Check

```
CanDrop(playerId, tableId) =
  if table.daily_limit == 0: return true
  
  count = player_daily_loot[playerId][tableId][today]
  return count < table.daily_limit
```

## 6.4 Group Loot (Raid)

```
Raid Group Loot:
  Roll 1 item per loot slot
  Random assign to 1 random member (weighted by contribution score)
  Contribution score = damage dealt / total raid damage
  Min chance for any member = 5% (floor)
```

## 6.5 Personal Loot vs Group Loot

```
Normal/Boss: personal_loot = true → each player rolls independently
Raid:        group_loot = false in design → personal loot (avoid drama)
  → Exception: Guild Raid Boss = group loot (guild strategic item)
```

---

# 7. Power Budget

Loot Algorithm không đóng góp power — nó là delivery mechanism. Power comes from items dropped.

---

# 8. Economy Impact

| Tài nguyên | Source | Sink |
|---|---|---|
| Gold drops | All monster kills | Enhancement, craft, AH tax |
| Equipment | Boss/Raid | Equip/salvage |
| Relics | Boss/Raid | Socket/sacrifice |
| Materials | Normal farming | Craft |

**Anti-inflation:**
- Daily limit trên boss loot (hard drops)
- Boss respawn timer (không farm infinitely)
- Gold drop scales with level (no low-level gold print)
- Salvage excess equipment (economy sink)

---

# 9. Anti Power Creep

- Drop weights cố định trong CSV — designer review trước mỗi patch
- Loot table version controlled
- New rare item không thể exceed power budget thông qua stats

---

# 10. Progression Table

| Content | Rolls/Kill | Rare Drop | Legend Drop |
|---|---|---|---|
| Normal Monster | 2 | 0.1% | 0.01% |
| Elite Monster | 3 | 1% | 0.05% |
| Named Monster | 5 | 3% | 0.2% |
| Dungeon Boss | 5 | 5% | 0.5% |
| Hard Dungeon Boss | 7 | 8% | 1% |
| Raid Boss | 10 | 15% | 2% |
| World Boss | 15 | 25% | 5% |

---

# 11. Reward Structure

| Content Clear | Loot Type |
|---|---|
| Normal dungeon | Equipment common/uncommon + mats |
| Hard dungeon | Equipment uncommon/rare + relic shard |
| Elite dungeon | Equipment rare/epic + relic |
| Raid (normal) | Equipment epic + artifact fragment |
| Raid (hard) | Equipment epic/legend + artifact |
| World Boss | Equipment legend + relic legend chance |
| Season Boss | Season exclusive cosmetic + currency |

---

# 12. RNG Design

- **Algorithm:** XorShift64 per roll (server-side)
- **Seed:** Per-player seed (persistent) combined with monster kill hash
- **Audit trail:** Every roll logged: table_id, roll_result, seed_state, player_id, timestamp
- **Weight granularity:** Integers 1-10,000 (not floats) to avoid floating point issues

---

# 13. Anti Bad Luck System

Loot algorithm integrates with Pity System (System 11):
- `pity_type` in drop entry links to PityConfigSO
- If pity triggered: that specific entry guaranteed → weight ignored
- Soft pity: weight multiplied by `pity_multiplier` as count approaches hard pity

---

# 14. Collection Integration

"Loot History" last 50 drops — not Collection Hall per se, but UI feature.
Item discovered tracking: `BitFlags.Set(itemDiscoveredBits, item_index)` on first drop.

---

# 15. Achievement Integration

| Achievement | Condition |
|---|---|
| First Rare Drop | Receive first rare equipment |
| Lucky | Receive Legend item without pity |
| Farming Legend | 1000 normal monster kills |
| Completionist | Discover 80% of all item types |

---

# 16. Season Integration

Season adds seasonal entries to existing drop tables:
```json
{"item_id":"season_04_coin","weight":2000,"qty_min":1,"qty_max":5,"pity_type":"","is_guaranteed":false}
```
Seasonal entries active only during season flag = true.

---

# 17. PvE Integration

| PvE Type | Drop Table | Personal/Group |
|---|---|---|
| Normal dungeon | drop_dun_{biome}_normal | Personal |
| Hard dungeon | drop_dun_{biome}_hard | Personal |
| Raid | drop_raid_{biome}_elite | Personal (changed from group) |
| World Boss | drop_world_{biome} | Personal |
| Tower | drop_tower_floor_{N} | Personal |

---

# 18. PvP Integration

PvP drops: win reward (small) — separate PvP loot table.
No equipment/power item from PvP loot (currency/cosmetic only).

---

# 19. Social Integration

Guild contribution: group dungeons track member contribution → guild token distribution.
Guild Bank receives % of guild event loot.

---

# 20. Technical Architecture

## Class Diagram

```
DropWeightTableSO : ScriptableObject
├── string id, tableType
├── int biome, rollsPerKill, dailyLimit
├── bool groupLoot
└── DropEntry[] entries

LootManager (server-side preferred, Unity for PvE prediction)
├── RollLoot(tableId, playerId, killContext) : LootResult
├── CheckDailyLimit(playerId, tableId) : bool
├── ApplyModifiers(baseWeight, context) : float
├── DeliverLoot(playerId, LootResult) : void
└── LogRoll(auditEntry) : void

LootModifierSO : ScriptableObject
├── float difficultyMult
├── float catchUpMult_tier1, tier2
└── float eventMult (from LiveOps)
```

---

# 21. Save Data Architecture

No direct save needed per roll. Results stored in inventory (equipment table, currency table).
`player_daily_loot` table tracks daily limits server-side.

---

# 22. Network Architecture

Loot rolls: server-side only. Client receives LootResult notification:
```json
{"type":"loot_result","items":[{"item_id":"equip_0100","qty":1},{"item_id":"gold_medium","qty":350}]}
```

---

# 23. Security

| Threat | Prevention |
|---|---|
| Client-side roll manipulation | Server-only RNG |
| Daily limit bypass | Server validates before awarding |
| Log tampering | Audit log append-only, signed |
| Fake loot notification | Server sends loot result, client displays only |

---

# 24. LiveOps Hooks

```
event.drop_rate_multiplier = 2.0         (double drop event)
event.gold_drop_multiplier = 3.0         (gold rush)
event.boss_loot_bonus_active = true
remote_config.daily_boss_limit = 1
remote_config.catch_up_old_biome_mult = 3.0
```

---

# 25. Content Pipeline

```
Google Sheet "Drop Weight Tables"
  → drop_weight_tables.csv + drop_weight_entries.csv
  → gen_drop_tables.py (validate: all weights sum check)
  → drop_tables.json
  → DropWeightTableSO[] (Editor import)

Balance check: gen_drop_tables.py prints expected drop rates per item
```

---

# 26. Future Expansion

- Seasonal loot table injection (already supported via LiveOps flags)
- Dynamic weight adjustment based on economy health (auto anti-inflation)
- Loot trade (limited: equip soul-unbound for 24h)

---

# 27. Production Risks

| Rủi ro | Mức |
|---|---|
| Loot inflation từ too many drop tables | HIGH |
| Daily limit bug không reset | CRITICAL |
| Rare item weight too high → inflation | HIGH |

---

# 28. Mitigation Plan

| Rủi ro | Giải pháp |
|---|---|
| Inflation | Economy Monitor: alert nếu item supply > threshold |
| Daily limit bug | Cron job verify daily_loot reset mỗi midnight UTC |
| Wrong weight | gen_drop_tables.py validation prints expected rates |

---

# 29. Unity Implementation Plan

```
Assets/script/SlimeMMO/Loot/
├── DropWeightTableSO.cs
├── LootManager.cs
├── LootModifierSO.cs
└── SlimeMMO.Loot.asmdef

generators/
└── gen_drop_tables.py
```

---

# 30. Final Verdict

**Status: PARTIAL**

Drop tables exist trong gen_boss_mechanics.py (reference only). Cần formalize `DropWeightTableSO`, `gen_drop_tables.py`, và server-side `LootManager`. Không là highest priority BLOCKER nhưng cần trước Alpha.
