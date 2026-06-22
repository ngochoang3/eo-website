# SYSTEM 13 — NPC Architecture
> Status: MISSING → thiết kế từ đầu
> Ngày: 2026-06-13

---

# 1. Purpose

NPC Architecture định nghĩa **data model, behavior, dialog, và interaction** cho toàn bộ NPC trong game: Shop NPC, Quest Giver, Trainer, Blacksmith, Inn Keeper, Story NPC, World Event NPC.

---

# 2. Design Philosophy

- **Data-driven:** NPC dialog và reward từ JSON, không hardcode
- **State-aware:** NPC có thể biết quest state, season, time of day, biome
- **Localization-ready:** Dialog ID reference sang string table
- **Minimal AI:** NPC không có combat AI — chỉ có idle + interaction
- **Contextual:** Creature companion ảnh hưởng NPC dialog (if creature matches biome)

---

# 3. Core Loop

```
[Player approach NPC (5m radius)]
        │
        ▼
[NPC greeting animation + name tag]
        │
        ▼
[Player tap → NPC Dialog opens]
        │
        ▼
[Dialog tree: conditional branches]
  - Quest available? Show [!] icon
  - Quest complete? Show reward dialog
  - Shop? Show shop UI
  - Story? Play dialog sequence
        │
        ▼
[Interaction result: quest accept/complete, buy, sell, train]
```

---

# 4. Progression Loop

NPC mở thêm services/dialog theo player progression:
- Lv 1: Basic greeting, basic shop
- Lv 100: Unlocks special quest dialog
- Lv 500: Unlocks training service
- Lv 1000: Lore dialog chain available
- Season: Seasonal dialog branch active

---

# 5. Data Architecture

## 5.1 Entity

```
NPCDataSO
├── id: string               ("npc_smith_biome01")
├── display_name: string     ("Old Ironsmith")
├── npc_type: string[]       ("Shop","QuestGiver","Trainer","Story","Teleporter")
├── biome: int               (1)
├── location_key: string     ("verdant_meadow_town_square")
├── level_req: int           (0 = always visible)
├── dialog_tree_id: string   (ref DialogTreeSO)
├── shop_id: string          (ref ShopDataSO, if shop type)
├── quest_ids: string[]      (quests this NPC gives)
├── trainer_skill_ids: string[] (skills player can unlock)
├── faction_id: string       (which reputation faction)
├── sprite_idle: string
├── portrait: string
├── voice_sample: string
└── lore: string

DialogTreeSO
├── tree_id: string
├── DialogNode[] nodes
│   ├── node_id: string
│   ├── speaker: string      ("npc","player")
│   ├── text_key: string     (localization key)
│   ├── condition: string    (expression, e.g. "player.level >= 100")
│   ├── on_select: string    (action: "start_quest:quest_0001", "open_shop")
│   └── next_node_ids: string[]

ShopDataSO
├── shop_id: string
├── currency_type: string    ("gold","gem","season_coin","reputation_coin")
├── refresh_interval: string ("never","daily","weekly")
├── items: ShopEntry[]
│   ├── item_id: string
│   ├── price: int
│   ├── qty_limit: int       (0 = unlimited)
│   ├── level_req: int
│   ├── faction_rank_req: int (0 = no req)
│   └── is_power: bool       (must be false for premium currency items)
```

## 5.2 Database Tables

```sql
CREATE TABLE npc_data (
    id              VARCHAR(64) PRIMARY KEY,
    display_name    VARCHAR(64) NOT NULL,
    npc_type_json   VARCHAR(256) NOT NULL,
    biome           TINYINT NOT NULL,
    location_key    VARCHAR(64) NOT NULL,
    level_req       SMALLINT NOT NULL DEFAULT 0,
    dialog_tree_id  VARCHAR(64),
    shop_id         VARCHAR(64),
    faction_id      VARCHAR(32),
    sprite_idle     VARCHAR(64),
    portrait        VARCHAR(64),
    lore            TEXT
);

CREATE TABLE npc_quest_map (
    npc_id          VARCHAR(64) NOT NULL,
    quest_id        VARCHAR(32) NOT NULL,
    sort_order      TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (npc_id, quest_id)
);

CREATE TABLE shop_data (
    shop_id         VARCHAR(64) PRIMARY KEY,
    currency_type   VARCHAR(32) NOT NULL DEFAULT 'gold',
    refresh_interval VARCHAR(16) NOT NULL DEFAULT 'never'
);

CREATE TABLE shop_entry (
    shop_id         VARCHAR(64) NOT NULL,
    item_id         VARCHAR(32) NOT NULL,
    price           INT NOT NULL,
    qty_limit       INT NOT NULL DEFAULT 0,
    level_req       SMALLINT NOT NULL DEFAULT 0,
    faction_rank_req TINYINT NOT NULL DEFAULT 0,
    is_power        TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (shop_id, item_id)
);

CREATE TABLE player_shop_purchase (
    player_id       BIGINT NOT NULL,
    shop_id         VARCHAR(64) NOT NULL,
    item_id         VARCHAR(32) NOT NULL,
    purchase_date   DATE NOT NULL,
    qty_purchased   INT NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, shop_id, item_id, purchase_date)
);

CREATE TABLE dialog_tree (
    tree_id         VARCHAR(64) PRIMARY KEY,
    tree_json       MEDIUMTEXT NOT NULL
);
```

## 5.3 ID Rules

NPC: `npc_{type_prefix}_{biome:02d}_{variant:02d}`
- `npc_smi_01_01` — Smith, biome 1, variant 1
- `npc_qst_03_02` — Quest giver, biome 3, variant 2
- `npc_inn_12_01` — Innkeeper, biome 12

Shop: `shop_{npc_id}` → `shop_npc_smi_01_01`
Dialog: `dlg_{npc_id}` → `dlg_npc_smi_01_01`

## 5.4 CSV Schema

`npc_db.csv`:
```
id,display_name,npc_type,biome,location_key,level_req,dialog_tree_id,shop_id,faction_id,sprite_idle,portrait,lore
npc_smi_01_01,Ironsmith Boru,Shop|Trainer,1,meadow_town_square,1,dlg_npc_smi_01_01,shop_npc_smi_01_01,faction_green_slime,spr_npc_smith_01,port_npc_smith_01,Boru đã rèn vũ khí cho cả 3 thế hệ Slime chiến binh
npc_qst_01_01,Elder Gaia,QuestGiver|Story,1,meadow_elder_hut,1,dlg_npc_qst_01_01,,faction_green_slime,spr_npc_elder_01,port_npc_elder_01,Người già nhất tại Verdant Meadow
npc_inn_01_01,Innkeeper Mira,Inn|Shop,1,meadow_inn,1,dlg_npc_inn_01_01,shop_npc_inn_01_01,,spr_npc_inn_01,port_npc_inn_01,Mira luôn có phòng trống và tin tức mới
```

`shop_entry.csv`:
```
shop_id,item_id,price,qty_limit,level_req,faction_rank_req,is_power
shop_npc_smi_01_01,item_0001,100,0,1,0,false
shop_npc_smi_01_01,equip_0010,500,3,10,0,false
shop_npc_smi_01_01,equip_0020,2000,1,30,1,false
shop_rep_green_01,rep_exclusive_helm,50000,1,100,4,false
```

## 5.5 JSON Schema (Dialog Tree)

```json
{
  "tree_id": "dlg_npc_smi_01_01",
  "nodes": [
    {
      "node_id": "root",
      "speaker": "npc",
      "text_key": "npc.smi_01_01.greeting",
      "condition": "",
      "on_select": "",
      "next_nodes": ["opt_shop","opt_quest","opt_lore","opt_bye"]
    },
    {
      "node_id": "opt_shop",
      "speaker": "player",
      "text_key": "dialog.option.shop",
      "condition": "",
      "on_select": "open_shop:shop_npc_smi_01_01",
      "next_nodes": []
    },
    {
      "node_id": "opt_quest",
      "speaker": "player",
      "text_key": "dialog.option.quest",
      "condition": "quest_available:npc_qst_01_01",
      "on_select": "show_quests:npc_smi_01_01",
      "next_nodes": []
    },
    {
      "node_id": "opt_lore",
      "speaker": "player",
      "text_key": "dialog.option.lore",
      "condition": "player.level >= 100",
      "on_select": "",
      "next_nodes": ["lore_01"]
    },
    {
      "node_id": "lore_01",
      "speaker": "npc",
      "text_key": "npc.smi_01_01.lore_01",
      "condition": "",
      "on_select": "",
      "next_nodes": ["root"]
    }
  ]
}
```

---

# 6. Formula Architecture

## 6.1 Dialog Condition Evaluation

```csharp
bool EvaluateCondition(string cond, PlayerContext ctx)
{
    if (string.IsNullOrEmpty(cond)) return true;
    if (cond.StartsWith("player.level >= "))
        return ctx.level >= int.Parse(cond.Split(' ')[2]);
    if (cond.StartsWith("quest_available:"))
        return QuestManager.HasAvailableQuest(ctx, cond.Split(':')[1]);
    if (cond.StartsWith("quest_complete:"))
        return BitFlags.Get(ctx.questBits, QuestIndex(cond.Split(':')[1]));
    if (cond.StartsWith("faction_rank:"))
        return ctx.reputationRanks[cond.Split(':')[1]] >= int.Parse(cond.Split(':')[2]);
    return true;
}
```

## 6.2 Shop Price Formula

```
FinalPrice(entry, player) =
  base_price × currency_multiplier
  × (1 - reputation_discount)

reputation_discount = faction_rank_req > 0 ?
  player.reputationRank[shop.factionId] × 0.05  // 5% per rank
  : 0

currency_multiplier = 1.0 (gold), 1.0 (season coin), 1.0 (rep coin)
```

## 6.3 Daily Limit Reset

```
Shop refresh_interval = "daily":
  Available qty = qty_limit - player_shop_purchase[today].qty
  Resets at 00:00 UTC
```

---

# 7. Power Budget

Shop NPC: is_power = false enforced trên mọi shop_entry cho premium currency.
Gold shop có thể bán equipment (power items) — nhưng đây là farmable gold, không phải premium.

---

# 8. Economy Impact

| NPC Type | Economy Role |
|---|---|
| Blacksmith | Gold sink (buy equipment, enhance service) |
| Inn Keeper | Small gold sink (rest/buff buff) |
| Trader | Gold faucet (sell loot) AND gold sink (buy consumables) |
| Reputation Shop | Reputation coin sink |
| Season Shop | Season coin sink |

---

# 9. Anti Power Creep

- `is_power = false` trên mọi premium currency shop entry — CI validates
- Gold shop equipment: same stats as drops (no exclusive power items)
- NPC training: unlocks skills (already in skill tree) không create new power

---

# 10. Progression Table

| Biome | NPC Count | Types Available |
|---|---|---|
| Biome 1 | 8 | Smith, QuestGiver, Inn, Trainer, Story ×2, Teleport, General |
| Biome 2-10 | 5-6 | Smith, QuestGiver, Story, Teleport, Specialty |
| Biome 11-21 | 4-5 | Reduced (players pass through faster) |
| Capital City | 20+ | Full hub: all types |
| Event Area | Variable | Seasonal NPCs |

---

# 11. Reward Structure

NPC reward structure via quest completion and shop:
- Quest completion → gold, EXP, item
- Reputation shop → exclusive cosmetics per rank
- Trainer → skill unlock

---

# 12. RNG Design

Không có RNG trong NPC interaction. Shop rotation có thể random nhưng seed server-side và daily consistent per player.

---

# 13. Anti Bad Luck System

Không áp dụng — NPC là deterministic interaction.

---

# 14. Collection Integration

"NPC Codex" — meet NPC → unlock entry. 100+ NPCs total. NPC lore entries unlock khi lần đầu nói chuyện.

---

# 15. Achievement Integration

| Achievement | Condition |
|---|---|
| First Conversation | Talk to NPC lần đầu |
| All NPCs Biome 1 | Meet all 8 NPCs in biome 1 |
| World Traveler | Meet NPC in all 21 biomes |
| Shopaholic | Purchase from 20 different shops |

---

# 16. Season Integration

Seasonal NPC: appear in town square during event, offer season quests + shop.
Dialog branch `"condition": "season.active == true"` shows seasonal text.

---

# 17. PvE Integration

Quest Giver NPC là gateway cho dungeon access (give key quest).
Teleporter NPC → dungeon entrance warp.

---

# 18. PvP Integration

PvP Arena NPC: register for arena, view rankings, buy PvP cosmetics (not power).

---

# 19. Social Integration

Guild NPC: in guild hall, manage guild settings, guild shop.
Player Housing NPC: visitor can talk to hosted NPC (cosmetic placement).

---

# 20. Technical Architecture

```
NPCDataSO : ScriptableObject
├── string id, displayName
├── string[] npcTypes
├── int biome, levelReq
├── string dialogTreeId, shopId, factionId
└── string spriteIdle, portrait

ShopDataSO : ScriptableObject
├── string shopId, currencyType, refreshInterval
└── ShopEntry[] items

DialogTreeSO : ScriptableObject
├── string treeId
└── DialogNode[] nodes

NPCManager : MonoBehaviour
├── NPCDataSO[] _npcs
├── SpawnNPC(id, position) : NPCController
├── OpenDialog(npcId, player) : void
├── OpenShop(shopId, player) : void
└── CheckQuestMarkers(npcId, player) : QuestMarker

NPCController : MonoBehaviour
├── NPCDataSO data
├── DialogManager dialogManager
├── OnPlayerApproach(float dist)
├── OnPlayerInteract()
└── IdleAnimation()

DialogManager
├── CurrentTree: DialogTreeSO
├── CurrentNode: DialogNode
├── Advance(selectedOption)
└── EvaluateCondition(cond, ctx) : bool
```

---

# 21. Save Data Architecture

Player shop purchases saved in `player_shop_purchase` DB table — not in PlayerSaveData JSON (too many entries).
NPC "met" tracking: `BitFlags.Set(npcMetBits, npcIndex)` — add `npc_met_bits: long[]` to CollectionData.

---

# 22. Network Architecture

Shop purchase: POST /api/v1/shop/buy → server validates qty limit, currency balance, level req.
Dialog: client-side (no server needed except for quest triggers).
Quest trigger: POST /api/v1/quest/accept → server validates NPC gives that quest.

---

# 23. Security

| Threat | Prevention |
|---|---|
| Fake shop purchase | Server validates gold balance + qty limit |
| Power item in premium shop | CI scan: is_power = true in premium shop → fail build |
| Daily limit bypass | Server tracks in player_shop_purchase |

---

# 24. LiveOps Hooks

```
event.shop_discount_pct = 0.2       (20% off event)
event.seasonal_npc_enabled = true
flag.new_npc_available = true
remote_config.npc_interact_radius = 5.0
```

---

# 25. Content Pipeline

```
Google Sheet "NPC DB"
  → npc_db.csv
  → gen_npc_db.py
  → npc_db.json
  → NPCDataSO[] (Editor import)

Google Sheet "Shop DB"
  → shop_entry.csv
  → gen_shop_db.py
  → shop_db.json
  → ShopDataSO[] (Editor import)

Google Sheet "Dialog"
  → dialog_tree.csv (or JSON direct)
  → DialogTreeSO[] (Editor import)
```

---

# 26. Future Expansion

- AI-driven dialog (Year 3): NPC remembers player interactions
- NPC relationship system: reputation with individual NPC
- Dynamic NPC spawning based on world events
- NPC housing placement: player places NPC in their home

---

# 27. Production Risks

| Rủi ro | Mức |
|---|---|
| Dialog localization errors | MEDIUM |
| Shop daily limit not resetting | HIGH |
| is_power = true accident in gem shop | CRITICAL |

---

# 28. Mitigation Plan

| Rủi ro | Giải pháp |
|---|---|
| Localization | String table separate from dialog tree; QA per language |
| Shop reset | Cron job + monitor alert |
| Power in gem shop | CI scan auto-fail if is_power = true + currency_type = 'gem' |

---

# 29. Unity Implementation Plan

```
Assets/script/SlimeMMO/NPC/
├── NPCDataSO.cs
├── ShopDataSO.cs
├── DialogTreeSO.cs
├── NPCManager.cs
├── NPCController.cs
├── DialogManager.cs
└── SlimeMMO.NPC.asmdef

generators/
├── gen_npc_db.py
└── gen_shop_db.py
```

---

# 30. Final Verdict

**Status: MISSING → design complete, needs implementation**

NPC là core UX touchpoint. Cần implement dialog system và shop system trước Alpha. Không là highest priority BLOCKER nhưng cần trước open world access.
