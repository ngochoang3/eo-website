# QUEST PIPELINE ARCHITECTURE
> Game: Slime MMORPG | Date: 2026-06-14 | Version: 1.0
> Scope: Quest types, content pipeline, DB schema, QuestStateMachine integration

---

## MANDATORY EXISTING SYSTEM ANALYSIS

```
[Source of Truth — đọc trước khi thiết kế]

unity/Scripts/Content/QuestStateMachine.cs (Phase 1 — đã viết):
  - TryUnlock(questId, playerContext) → bool
  - RegisterProgress(questId, objectiveType, value) → void
  - QuestChainManager.AdvanceChain(chainId) → void
  Quest LOGIC đã có — Pipeline này định nghĩa CONTENT và DATA

TUTORIAL_ONBOARDING.md — Tutorial quests (HARDCODED):
  "The Blacksmith's Lesson", "First Strike", "A Companion for Life"
  Tutorial = hardcoded state machine (Section 2 FSM)
  Main/Side/Daily quests = pipeline-driven (separate từ tutorial)

ECONOMY_AUDIT.md:
  "Quest rewards: ~200-10,000g per quest" (gold source)
  Quest rewards phải khớp với Economy balance
  Quest gold = phần nhỏ (< 15% daily gold income)

07_DAILY_WEEKLY_ACTIVITY_SYSTEM.md:
  "Complete 3 Quests → 20 AP" (daily activity)
  Quest completion → Daily Activity progress
  Phải hook vào DailyActivityService.RegisterProgress()

04_ACHIEVEMENT_SYSTEM.md:
  Achievement "Quest Master" — số quest completed
  Quest types hook vào AchievementService.Trigger()

01_GUILD_ARCHITECTURE.md:
  Guild Quests (weekly) = separate scope, Guild-specific
  Quest Pipeline phục vụ: Main / Side / Daily / World quests
  Guild Quest = separate (đã thiết kế trong Guild doc)

MONETIZATION_TECHNICAL.md:
  VIP = không skip quest requirements
  Quest rewards: Gold/Gem OK, premium_gem = 0 (không P2W)
  is_power=false trên tất cả quest rewards

SERVER_ARCHITECTURE.md:
  Không có QuestService riêng — cần thêm hoặc embed trong CharacterService
  CharacterService đã có load/save quest state

Quest Pipeline KHÔNG:
  ✗ Tạo currency mới
  ✗ Cho phép skip quest bằng Diamond (P2W)
  ✗ Tạo power reward ngoài Power Budget
  ✗ Thay thế Tutorial (Tutorial = hardcoded FSM)
  ✓ Định nghĩa content format cho designer
  ✓ DB schema cho quest state tracking
  ✓ Extend QuestStateMachine.cs đã có
  ✓ Hook vào Daily Activity + Achievement + Economy
```

---

## 1. Design Philosophy

Quest Pipeline phục vụ 2 mục tiêu:
1. **Player Experience**: Hướng dẫn player khám phá content, tạo mục tiêu ngắn/dài hạn
2. **Content Production**: Designer tạo quest trong JSON không cần code, QA trong Editor

**Quest = Content Production Pipeline:**
```
Designer → QuestDefinitionSO.json → Git → CI Validation → Game
                                          ↓
                                    QuestValidator checks:
                                    - Reward không vượt Economy
                                    - Objective type hợp lệ
                                    - Prerequisite chain không loop
```

---

## 2. Quest Type System

### 2.1 Quest Categories

| Type | Reset | Count | Designer | Source |
|---|---|---|---|---|
| MAIN | Never | ~200 total | Level Designer | Main story chain |
| SIDE | Never | ~500 total | Content Designer | Biome/NPC specific |
| DAILY | 00:00 UTC | 10/ngày (pool 50) | LiveOps | Random pool |
| WORLD | Event-driven | Unlimited | LiveOps | Server event trigger |
| TUTORIAL | None | ~20 | Feature Dev | Hardcoded FSM |

### 2.2 Main Quest Chain

```
Main Quest Design:
  - Chương 1: Biome 1-5 (Level 1-200) — "Rise of the Slime Tamer"
  - Chương 2: Biome 6-10 (Level 201-500) — "The Ancient Pact"
  - Chương 3: Biome 11-15 (Level 501-1000) — "Chaos Rising"
  - Chương 4: Biome 16-20 (Level 1001-1500) — "The Final Seal"
  - Chương 5: Biome 21 (Level 1501-2000) — "Transcendence"

Per Chapter: ~40 quests = 200 total Main Quests
Chapter unlock: finish previous chapter's final quest

Main Quest Rules:
  ✓ Reward: Gold + Gem + Lore (no premium_gem, no P2W gear)
  ✓ Permanently completable (no time gate)
  ✓ Linear chain (next unlocks after previous complete)
  ✓ Each quest teaches 1 new game mechanic (first time)
```

### 2.3 Side Quest System

```
Side Quest Design (500 total):
  Per biome: ~20-25 side quests
  NPC-driven: each unique NPC has 3-5 side quests
  Branching: some quests have 2 endings (choice-based)

Side Quest Categories:
  FETCH:       "Mang 10 Iron Ore từ Crystal Cave"
  KILL:        "Tiêu diệt 20 Goblin Warrior"
  ESCORT:      "Hộ tống NPC Elara đến làng"
  COLLECT:     "Thu thập 5 Mystery Herb"
  CRAFT:       "Rèn 1 Steel Sword cho Blacksmith"
  EXPLORE:     "Đến 3 điểm khác nhau trong Biome 3"
  REPUTATION:  "Đạt Honored với Verdant Alliance"

Side Quest Rewards:
  Gold: 500-50,000g (dựa vào level requirement)
  Gem: 1-5 (side quests thường ít hơn main)
  Items: Crafting material, Housing furniture, Cosmetic
  NO power gear từ side quest (power comes from dungeons)
```

### 2.4 Daily Quest Pool

```
Daily Quest Pool: 50 quests, player nhận 10/ngày (server random)
Server chọn dựa trên:
  - Player level range (không assign quests quá thấp/cao)
  - Content đã unlock (không assign guild quest nếu chưa join guild)
  - Diversity check: không assign 2 quests cùng objective type

Daily Quest Pool Examples:
  D01: "Giết 30 quái vật bất kỳ" → 200g + 5 Activity Points
  D02: "Hoàn thành 1 dungeon" → 500g + 10 AP
  D03: "Bán 1 item trên AH" → 100g + 5 AP
  D04: "Thu thập 20 tài nguyên gathering" → 300g + 8 AP
  D05: "Nấu ăn 3 món" → 200g + Cooking EXP ×50 + 5 AP
  D06: "Truy cập 2 biome khác nhau" → 200g + Map Stamp
  D07: "Pet: cho pet ăn 3 lần" → 200g + Pet Food ×2
  D08: "Enchant bất kỳ item" → 500g + Enhancement Stone ×1
  D09: "Thu hoạch Housing" → 200g + Gardening EXP
  D10: "Mua 1 item từ NPC shop" → 100g + 5 AP
  ... (50 total, balanced across all systems)

Daily Quest Integration:
  Completion → DailyActivityService.RegisterProgress("QUEST_COMPLETE", 1)
  → Contributes to "Complete 3 Daily Quests" daily activity (07_DAILY_WEEKLY_ACTIVITY_SYSTEM.md)
```

### 2.5 World Quest (Event-Driven)

```
World Quests = server-spawned khi event active:
  World Boss Active → "Tham gia đánh Boss {name}" (03_WORLD_EVENT_SYSTEM.md)
  Invasion Event   → "Bảo vệ 3 làng khỏi Goblin Invasion"
  Seasonal         → "Thu thập 30 Sunbloom trong mùa Hè"

World Quest Properties:
  Duration: 1-72h (event-driven)
  Per-player progress (không share với others)
  Reward: event_token + gold (không premium_gem)
  LiveOps can push new World Quests without app update
```

---

## 3. Quest Definition Format (JSON)

### 3.1 QuestDefinitionSO Schema

```json
{
  "quest_id": "main_ch1_q01",
  "quest_type": "MAIN",
  "chain_id": "chapter_1",
  "chain_order": 1,
  "title_key": "quest_main_ch1_q01_title",
  "description_key": "quest_main_ch1_q01_desc",
  "objectives": [
    {
      "objective_id": "obj_1",
      "type": "KILL",
      "target_id": "monster_baby_slime",
      "target_count": 10,
      "progress_text_key": "quest_obj_kill_slime_progress",
      "optional": false
    },
    {
      "objective_id": "obj_2",
      "type": "REACH_LOCATION",
      "target_id": "biome_1_village",
      "target_count": 1,
      "optional": false
    }
  ],
  "prerequisites": {
    "quest_ids_completed": [],
    "min_level": 1,
    "max_level": 999,
    "required_flags": []
  },
  "rewards": {
    "gold": 500,
    "gem": 2,
    "premium_gem": 0,
    "exp": 1000,
    "items": [
      { "item_id": "iron_sword", "quantity": 1, "is_power": false }
    ],
    "activity_points": 20
  },
  "npc_giver_id": "npc_village_elder",
  "npc_turn_in_id": "npc_village_elder",
  "auto_complete": false,
  "is_repeatable": false,
  "timer_seconds": null
}
```

### 3.2 Objective Types

| Type | Description | Parameters |
|---|---|---|
| KILL | Giết N quái vật | target_id (monster/family), count |
| KILL_BOSS | Giết boss cụ thể | boss_id, count |
| COLLECT_ITEM | Thu thập N item | item_id, count |
| REACH_LOCATION | Đến vị trí/biome | biome_id hoặc poi_id |
| CRAFT | Craft N item | item_id hoặc category, count |
| GATHER | Thu hoạch N lần | skill (MINING/HERBALISM/...), count |
| ENHANCE | Enhance item đến +N | min_enhance_level |
| AH_TRANSACTION | Mua/bán trên AH | action (BUY/SELL), count |
| TALK_TO_NPC | Nói chuyện với NPC | npc_id |
| DUNGEON_COMPLETE | Hoàn thành dungeon | dungeon_id hoặc dungeon_type |
| PVP_WIN | Thắng N trận PvP | mode (ARENA_1V1/3V3), count |
| BOND_SPIRIT | Bond Spirit đến Lv N | spirit_id hoặc "any", bond_level |
| VISIT_BIOME | Đến N biome | count |
| REPUTATION_REACH | Đạt rep level | faction_id, rep_level |
| HOUSING_PLACE | Đặt N furniture | furniture_category, count |

### 3.3 Reward Constraints (Economy Integration)

```
Reward Validation Rules (QuestValidator.py):

Gold rewards:
  DAILY quest:   max 1,000g (≤ 2% daily gold income Level 100)
  SIDE quest:    max 50,000g (level-scaled: level × 50g, cap 50K)
  MAIN quest:    max 100,000g (chapter boss quests)
  WORLD quest:   max 20,000g + event_token (no inflation)

Gem rewards:
  DAILY quest:   max 5 gem
  SIDE quest:    max 15 gem
  MAIN quest:    max 50 gem (chapter completions)

premium_gem reward: ALWAYS 0 (never from quest)
is_power on quest item rewards: ALWAYS false

Validator runs:
  1. CI/CD pipeline (block PR if violation found)
  2. Editor tool (ValidationManager.cs → ImportQuests)
  3. Server-side (CharacterService rejects malformed quest config)
```

---

## 4. Quest State Machine (C# Integration)

### 4.1 Extending Existing QuestStateMachine.cs

```csharp
// QuestStateMachine.cs — EXISTING (extend, không rewrite)
// Thêm vào existing file:

public enum QuestObjectiveType {
    KILL, KILL_BOSS, COLLECT_ITEM, REACH_LOCATION, CRAFT, GATHER,
    ENHANCE, AH_TRANSACTION, TALK_TO_NPC, DUNGEON_COMPLETE,
    PVP_WIN, BOND_SPIRIT, VISIT_BIOME, REPUTATION_REACH, HOUSING_PLACE
}

public class QuestObjectiveProgress {
    public string objectiveId;
    public QuestObjectiveType type;
    public int currentProgress;
    public int targetCount;
    public bool isCompleted => currentProgress >= targetCount;
}

public class QuestState {
    public string questId;
    public QuestStatus status;   // LOCKED / AVAILABLE / ACTIVE / COMPLETED
    public List<QuestObjectiveProgress> objectiveProgress;
    public long startedAt;
    public long completedAt;
}

// RegisterProgress — already exists, extend to route to right system:
public void RegisterProgress(string objectiveType, string targetId, int amount) {
    // Find all ACTIVE quests with matching objective
    foreach (var quest in GetActiveQuests()) {
        foreach (var obj in quest.questDef.objectives) {
            if (obj.type.ToString() == objectiveType && 
                (obj.targetId == targetId || obj.targetId == "any")) {
                var progress = GetProgress(quest.questId, obj.objectiveId);
                progress.currentProgress = Mathf.Min(
                    progress.currentProgress + amount, 
                    obj.targetCount
                );
                
                // Notify UI
                GameEventBus.Publish(new QuestProgressEvent {
                    questId = quest.questId,
                    objectiveId = obj.objectiveId,
                    current = progress.currentProgress,
                    target = obj.targetCount
                });
                
                // Check completion
                if (quest.IsAllObjectivesComplete()) {
                    TryCompleteQuest(quest.questId);
                }
            }
        }
    }
}

// QuestCompleted hook → feed other systems:
private void OnQuestCompleted(string questId, QuestDefinition def) {
    // 1. Economy rewards
    EconomyService.AddGold(playerId, def.rewards.gold);
    EconomyService.AddGem(playerId, def.rewards.gem);
    MailService.SendRewardItems(playerId, def.rewards.items);
    
    // 2. Daily Activity hook
    DailyActivityService.RegisterProgress("QUEST_COMPLETE", 1);
    
    // 3. Achievement hook
    AchievementService.Trigger("QUEST_COMPLETED_TOTAL", 1);
    if (def.quest_type == "MAIN")
        AchievementService.Trigger("MAIN_QUEST_COMPLETED", 1);
    
    // 4. Quest chain advance
    if (def.chain_id != null)
        QuestChainManager.AdvanceChain(def.chain_id);
    
    // 5. Push notification cancel (if quest was daily)
    // (don't remind them about daily quests they already completed)
    
    // 6. Analytics
    AnalyticsService.Track("quest_completed", new {
        quest_id = questId,
        quest_type = def.quest_type,
        time_to_complete_min = (DateTime.UtcNow - startedAt).TotalMinutes
    });
}
```

### 4.2 Quest UI Integration

```
Quest Log (UI_UX_ARCHITECTURE.md extension):
  Tab: [Main] [Side] [Daily] [World]
  Each quest: Title / Objectives list (with progress bars) / Rewards preview
  Active tracked quest: 3 max (shows objectives on HUD)
  
NPC Quest Marker:
  Yellow ! above NPC = has available quest
  Yellow ? above NPC = player has quest to turn in
  Gray  ! = has quest but locked (level/prereq)

Mini-objective HUD (tracked quest):
  Top-right: "Kill Baby Slime 7/10" with progress bar
  Multiple tracked: stack vertically
  
Daily Quest Panel:
  Auto-refreshes at 00:00 UTC (client UTC timer)
  Shows: 10 daily quests + completion rewards + AP progress
```

---

## 5. Content Production Pipeline

### 5.1 Quest Creation Workflow

```
[Designer → Game — No Code Required]

Step 1: Designer copies quest_template.json
Step 2: Fills in quest_id, objectives, rewards, strings
Step 3: Adds localization keys to vi-VN/quests.json + en-US/quests.json
Step 4: Commits to Git → CI pipeline runs QuestValidator.py
Step 5: QuestValidator checks:
    ✓ quest_id unique (no duplicates)
    ✓ All title_key / desc_key exist in localization files
    ✓ Objective types valid (from QuestObjectiveType enum)
    ✓ target_id exists (monster_id, item_id, npc_id validated against JSON DBs)
    ✓ Reward economy limits not exceeded
    ✓ Prerequisite chain has no loops (graph cycle detection)
    ✓ is_power=false on all reward items
    ✓ premium_gem reward = 0
Step 6: CI passes → auto-import to Unity (DataImporterExtensions.ImportQuests())
Step 7: QA tests in Editor (ValidationManager.cs → Run Quest Validation)
Step 8: Deployed via Addressables OTA (no store update needed for quest content)
```

### 5.2 QuestValidator.py

```python
# generators/QuestValidator.py

import json, sys
from pathlib import Path

def validate_quests(quest_dir: Path, db_dir: Path) -> list[str]:
    errors = []
    monster_ids = load_ids(db_dir / "monster_db.json", "monster_id")
    item_ids    = load_ids(db_dir / "items_db.json",   "item_id")
    npc_ids     = load_ids(db_dir / "npc_db.json",     "npc_id")
    quest_ids   = set()
    
    for f in quest_dir.glob("**/*.json"):
        quests = json.loads(f.read_text(encoding="utf-8"))
        for q in quests:
            qid = q["quest_id"]
            
            # Unique ID check
            if qid in quest_ids:
                errors.append(f"DUPLICATE quest_id: {qid}")
            quest_ids.add(qid)
            
            # Economy limits
            r = q["rewards"]
            if r["premium_gem"] > 0:
                errors.append(f"P2W VIOLATION — {qid}: premium_gem={r['premium_gem']}")
            for item in r.get("items", []):
                if item.get("is_power", False):
                    errors.append(f"P2W VIOLATION — {qid}: reward item is_power=true")
            
            gold_caps = {"DAILY": 1000, "SIDE": 50000, "MAIN": 100000, "WORLD": 20000}
            cap = gold_caps.get(q["quest_type"], 50000)
            if r["gold"] > cap:
                errors.append(f"ECONOMY — {qid}: gold {r['gold']} > cap {cap}")
            
            # Objective target validation
            for obj in q["objectives"]:
                t = obj.get("target_id", "any")
                otype = obj["type"]
                if otype == "KILL" and t != "any" and t not in monster_ids:
                    errors.append(f"INVALID TARGET — {qid}/{obj['objective_id']}: {t}")
                if otype == "COLLECT_ITEM" and t not in item_ids:
                    errors.append(f"INVALID ITEM — {qid}: {t}")
    
    return errors

if __name__ == "__main__":
    errors = validate_quests(Path("quests/"), Path("data/"))
    if errors:
        for e in errors: print(f"ERROR: {e}")
        sys.exit(1)
    print(f"Quest validation PASSED")
```

### 5.3 DataImporterExtensions.ImportQuests()

```csharp
// DataImporterExtensions.cs — ADD to existing ImportAll():

[MenuItem("Game/Import/Import Quests")]
public static void ImportQuests() {
    var questFiles = Directory.GetFiles("Assets/Resources/Quests/", "*.json", 
                                        SearchOption.AllDirectories);
    int count = 0;
    var allQuests = new List<QuestDefinitionSO>();
    
    foreach (var file in questFiles) {
        var json = File.ReadAllText(file);
        var defs = JsonConvert.DeserializeObject<List<QuestDefinitionData>>(json);
        
        foreach (var def in defs) {
            // Runtime validation (duplicates CI check)
            if (!ValidateQuestRewards(def)) {
                Debug.LogError($"[QuestImport] Reward violation in {def.quest_id}");
                continue;
            }
            
            var so = ScriptableObject.CreateInstance<QuestDefinitionSO>();
            so.questId    = def.quest_id;
            so.questType  = Enum.Parse<QuestType>(def.quest_type);
            so.chainId    = def.chain_id;
            so.chainOrder = def.chain_order;
            so.objectives = def.objectives.Select(o => o.ToRuntime()).ToList();
            so.rewards    = def.rewards.ToRuntime();
            so.prerequisites = def.prerequisites.ToRuntime();
            
            var path = $"Assets/Resources/GameData/Quests/{def.quest_id}.asset";
            AssetDatabase.CreateOrReplaceAsset(so, path);
            count++;
        }
    }
    
    AssetDatabase.SaveAssets();
    Debug.Log($"[QuestImport] Imported {count} quests successfully");
}
```

---

## 6. Server-Side Quest Service

```
Quest Service (embed trong CharacterService — không tạo service mới):

QuestService (module):
  LoadPlayerQuests(playerId) → QuestState[]
  TryAcceptQuest(playerId, questId) → Result
  RegisterObjectiveProgress(playerId, type, targetId, amount) → void
  TryCompleteQuest(playerId, questId) → Result
  GetAvailableDailyQuests(playerId) → QuestDefinition[] (10 random từ pool)

Daily Quest Selection (server, 00:00 UTC):
  1. Filter pool by player level
  2. Filter by content unlocked (dungeon quests require dungeon access)
  3. Shuffle using XorShift64 (server-side, consistent per player per day)
  4. Take first 10, diverse objective types (max 2 same type)
  5. Store in Redis: "daily_quests:{playerId}:{date}" TTL 24h

Progress Events (server publishes to internal bus):
  MonsterKilled    → QuestService.RegisterProgress(playerId, "KILL", monsterId, 1)
  ItemCrafted      → QuestService.RegisterProgress(playerId, "CRAFT", itemId, 1)
  DungeonCompleted → QuestService.RegisterProgress(playerId, "DUNGEON_COMPLETE", dungeonId, 1)
  ItemGathered     → QuestService.RegisterProgress(playerId, "GATHER", skill, amount)
  AHTransaction    → QuestService.RegisterProgress(playerId, "AH_TRANSACTION", action, 1)
  ... (all existing services already publish events via EventBus)
```

---

## 7. Database Schema

```sql
CREATE TABLE quest_definitions (
    quest_id            VARCHAR(64) PRIMARY KEY,
    quest_type          VARCHAR(16) NOT NULL,   -- MAIN/SIDE/DAILY/WORLD
    chain_id            VARCHAR(64),
    chain_order         SMALLINT,
    data_json           JSONB NOT NULL,         -- full QuestDefinitionSO content
    is_active           BOOL NOT NULL DEFAULT TRUE,
    min_level           SMALLINT NOT NULL DEFAULT 1,
    max_level           SMALLINT NOT NULL DEFAULT 2000,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE player_quest_states (
    player_id           BIGINT NOT NULL REFERENCES players(player_id),
    quest_id            VARCHAR(64) NOT NULL REFERENCES quest_definitions(quest_id),
    status              VARCHAR(16) NOT NULL DEFAULT 'AVAILABLE',
                        -- LOCKED / AVAILABLE / ACTIVE / COMPLETED / FAILED
    objective_progress  JSONB NOT NULL DEFAULT '{}',
                        -- { "obj_1": 7, "obj_2": 1 }  (current progress per objective)
    started_at          TIMESTAMP,
    completed_at        TIMESTAMP,
    PRIMARY KEY (player_id, quest_id)
);

CREATE TABLE daily_quest_assignments (
    player_id           BIGINT NOT NULL,
    date                DATE NOT NULL DEFAULT CURRENT_DATE,
    quest_ids           VARCHAR(64)[] NOT NULL,   -- array of 10 quest_ids
    generated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, date)
);

CREATE TABLE quest_completion_log (
    id                  BIGSERIAL PRIMARY KEY,
    player_id           BIGINT NOT NULL,
    quest_id            VARCHAR(64) NOT NULL,
    quest_type          VARCHAR(16) NOT NULL,
    rewards_json        JSONB NOT NULL,
    completed_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    time_to_complete_min INT
) PARTITION BY RANGE (completed_at);

CREATE INDEX idx_quest_states_player ON player_quest_states(player_id, status);
CREATE INDEX idx_quest_states_active ON player_quest_states(player_id, status) 
    WHERE status = 'ACTIVE';
CREATE INDEX idx_quest_defs_type ON quest_definitions(quest_type, min_level, max_level)
    WHERE is_active = TRUE;
```

---

## 8. Save Data (V9 → V10 Extension)

```csharp
// PlayerSaveData.cs — V10 addition (extends V9):
public class QuestSaveData {
    // Compact representation for bandwidth efficiency
    public List<string> completedQuestIds;        // for permanent quests
    public List<ActiveQuestSave> activeQuests;    // currently in progress
    public int totalQuestsCompleted;              // achievement counter
    public int mainQuestsCompleted;               // chapter tracking
    public int dailyQuestsCompletedToday;         // daily activity link
    public string currentChapterId;              // "chapter_1", "chapter_2", ...
}

public class ActiveQuestSave {
    public string questId;
    public Dictionary<string, int> objectiveProgress;  // objectiveId → count
    public long startedAtMs;
}

// Save V9 → V10 migration:
// MigrationV9ToV10: Add QuestSaveData với defaults
//   completedQuestIds = []
//   activeQuests = []
//   currentChapterId = "chapter_1"
```

---

## 9. Network Packets

```
QuestListRequest        = 0x1300  // C2S: { quest_type, page }
QuestListResponse       = 0x1301  // S2C: { quests[], total }
QuestAcceptRequest      = 0x1302  // C2S: { quest_id }
QuestAcceptResult       = 0x1303  // S2C: { success, quest_state }
QuestProgressUpdate     = 0x1304  // S2C: server push { quest_id, obj_id, current, target }
QuestCompleteRequest    = 0x1305  // C2S: { quest_id } (manual turn-in)
QuestCompleteResult     = 0x1306  // S2C: { success, rewards, next_quest_id }
DailyQuestRefresh       = 0x1307  // S2C: at 00:00 UTC { new_daily_quests[] }
QuestChainAdvanced      = 0x1308  // S2C: { chain_id, new_quest_id }
QuestAbandonRequest     = 0x1309  // C2S: { quest_id } (side quests only)
QuestAbandonResult      = 0x130A  // S2C: { success }
```

---

## 10. Content Volume & Timeline

```
Content Plan:

Launch (Soft Launch):
  Main Quests:   80 (Chương 1-2 hoàn chỉnh)
  Side Quests:   150 (Biome 1-10)
  Daily Pool:    30 quests
  World Quests:  10 (launch event only)

Month 2:
  Main Quests:   +60 (Chương 3)
  Side Quests:   +100 (Biome 11-15)
  Daily Pool:    +10 (total 40)

Month 4:
  Main Quests:   +60 (Chương 4)
  Side Quests:   +150 (Biome 16-21)
  Daily Pool:    +10 (total 50)

Month 6+:
  Main Quests:   +40 (Chương 5, endgame)
  Side Quests:   +100 (endgame side content)
  World Quests:  Ongoing (LiveOps driven)

Design Velocity: 2 designer × 5 quests/day = 10 quests/day
  80 Main + 150 Side (launch) = 230 quests → 23 working days
```

---

## 11. Analytics

```
quest_accepted:         { quest_id, quest_type, player_level }
quest_objective_start:  { quest_id, objective_type }
quest_abandoned:        { quest_id, quest_type, completion_pct }
quest_completed:        { quest_id, quest_type, time_to_complete_min, player_level }
quest_reward_granted:   { quest_id, gold, gem, item_count }
daily_quest_assigned:   { date, quest_count, player_level }
daily_quest_completion_rate: { date, completed_count, total_count }

KPI Targets:
  Main Quest completion rate Chương 1:   > 80% of D7 players
  Daily Quest completion rate:           > 60%/ngày (active players)
  Quest abandon rate:                    < 20%
  Side Quest engagement:                 > 40% players try at least 10 side quests
```

---

*Document: QUEST_PIPELINE_ARCHITECTURE.md | Version: 1.0 | Date: 2026-06-14*
*Types: MAIN/SIDE/DAILY/WORLD | 15 objective types | Designer-friendly JSON pipeline*
*Extends: QuestStateMachine.cs | Hooks: DailyActivity + Achievement + Economy*
*Save: V9→V10 | Packets: 0x1300-0x130A | 230 quests at soft launch*
