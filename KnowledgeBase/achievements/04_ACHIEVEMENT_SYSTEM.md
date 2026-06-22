# ACHIEVEMENT SYSTEM — Slime MMORPG Production Bible
> Game: Slime MMORPG | System: Achievement System | Version: 1.0 | Date: 2026-06-14
> Power Budget Allocation: 1% | Save Data: achievementBits[16] (1024 slots)

---

## 1. Purpose & Design Goals

- **Long-term retention**: Mục tiêu dài hạn, đặc biệt giai đoạn endgame
- **Completionist loop**: Thúc đẩy khám phá cross-system (guild, bestiary, crafting, PvP)
- **Social prestige**: Điểm số và title gắn liền với achievement là dấu hiệu status
- **Cross-system bridge**: Mỗi hệ thống lớn đều có achievement mirror

**Power Contribution:** 1% tổng Power Budget — stat bonus rất nhỏ, không tạo P2W gap.
**Design Principle:** Achievement không bao giờ là blocker cho progression chính.

---

## 2. Achievement Categories (8 Categories, 1000 Total)

| # | Category | Tổng Số | Mô Tả |
|---|---|---|---|
| 1 | Combat | 200 | Kill counts, damage records, no-death runs, PvP wins, boss kills |
| 2 | Exploration | 150 | Biome discovery, treasure finds, dungeon completion, secret areas |
| 3 | Collection | 150 | Equipment sets, bestiary entries, relic collection |
| 4 | Social | 100 | Guild milestones, mentor system, party dungeons |
| 5 | Economy | 100 | Gold earned milestones, crafting counts, AH transactions |
| 6 | Progression | 100 | Level milestones, ascension ranks, mastery levels |
| 7 | Events | 100 | Seasonal events, world boss participation, invasion defense |
| 8 | Hidden | 100 | Ẩn — discover qua behavior đặc biệt |
| **Total** | | **1000** | Fits trong achievementBits[16] = 1024 slots |

---

## 3. Achievement Tiers

| Tier | Tên | Points | Rarity | Count |
|---|---|---|---|---|
| 1 | Bronze | 5 pts | Common | 400 |
| 2 | Silver | 15 pts | Uncommon | 300 |
| 3 | Gold | 50 pts | Rare | 150 |
| 4 | Platinum | 150 pts | Epic | 100 |
| 5 | Legendary | 500 pts | Legendary | 50 |

**Total Max Points:** 54,000 pts (Bronze 2K + Silver 4.5K + Gold 7.5K + Platinum 15K + Legendary 25K)

---

## 4. Achievement Points & Power Formula

```
achievementScore = floor(totalAchievementPoints / 100)
```

**Stat Bonus Distribution (1% Power Budget):**

| Stat | Formula | Max Bonus (54K pts) |
|---|---|---|
| ATK% | achievementScore × 0.00040% | +0.216% ATK |
| HP% | achievementScore × 0.00030% | +0.162% HP |
| Gold Find% | achievementScore × 0.00020% | +0.108% Gold |
| EXP Gain% | achievementScore × 0.00010% | +0.054% EXP |
| **Total** | | **~0.54% effective** |

Average player (~30K pts) đạt ~0.3% tổng Power Budget. Gom vào "Other Bonuses" trong stat tooltip.

---

## 5. Achievement Rewards

| Reward Type | Có Stat? |
|---|---|
| Achievement Points → stat conversion | Gián tiếp |
| Title | Không |
| Avatar Frame | Không |
| Chat Color | Không |
| Name Effect (particle) | Không |
| Portrait Background | Không |
| Dye (từ hidden ach.) | Không |
| Mount Skin (từ hidden ach.) | Không |
| Creature Variant (hidden ach.) | Không |

**Gold Rewards:** Bronze = 100g | Silver = 500g | Gold = 2,000g | Platinum = 5,000g | Legendary = 10,000g

---

## 6. Hidden Achievements (100 hidden)

- Không hiển thị trong list → hiện "??? - ???"
- Conditions stored server-side only
- Hint System: Sau 30 ngày account age → mỗi 7 ngày unlock 1 hint

**Examples:**

| Condition (Ẩn) | Reward |
|---|---|
| Kill boss với HP < 10 còn lại | Title: "By The Skin of My Teeth" |
| Craft 1,000 items total | Unique Forge Visual Effect |
| Die 100 lần với same monster | Title: "Persistent" |
| Tìm 7 Easter egg NPCs | Rare Creature Variant |
| Idle 1 giờ liên tục (server clock) | Mount Skin "Sleepy Slime" |
| Bán item Epic cho NPC thay vì AH | Dye "Vendor's Tears" |

---

## 7. Meta Achievements

| Meta Achievement | Condition | Reward |
|---|---|---|
| "Combat Initiate" | 25% Combat (50/200) | Title + 500 pts bonus |
| "Combat Master" | 50% Combat | Title + 1,500 pts |
| "Combat Legend" | 100% Combat | Legendary Title + Avatar Frame |
| "Grand Explorer" | 100% Exploration | Title + Frame |
| "Guild Patriarch" | 100% Social | Legendary Title |
| "Living Encyclopedia" | 100% Collection | Title + Name Effect |
| **"Grand Champion"** | 80% TẤT CẢ categories | Server Announce + Legendary Title |

---

## 8. Progression Integration (Event Bus Pattern)

| Integration Point | Event | Handler |
|---|---|---|
| Bestiary Kill | BestiaryManager.OnKillMilestone() | AchievementManager.CheckCombatKill() |
| Quest Complete | QuestStateMachine.OnQuestComplete() | AchievementManager.OnQuestComplete() |
| Collection Discover | CollectionManager.OnDiscovery() | AchievementManager.CheckCollection() |
| Level Up | LevelManager.OnLevelUp() | Check {10,50,100,500,1000,2000} |
| Ascension Rank | AscensionManager.OnRankUp() | Check ascension achievements |
| Dungeon Complete | DungeonManager.OnComplete() | Check exploration achievements |

**Pattern:** AchievementManager subscribe GameEventBus — không hardcode dependency.

---

## 9. Database Structure

```sql
TABLE achievements_catalog
  achievement_id    VARCHAR(32)   PK
  name_vn           NVARCHAR(128)
  category          ENUM(combat,exploration,collection,social,economy,progression,events,hidden)
  tier              TINYINT
  points            SMALLINT
  condition_type    VARCHAR(64)
  condition_value   JSON
  reward_json       JSON
  is_hidden         BOOL
  bit_index         SMALLINT    -- 0-1023

TABLE player_achievement_meta
  player_id             BIGINT    PK
  total_points          INT       DEFAULT 0
  combat_points         INT       DEFAULT 0
  exploration_points    INT       DEFAULT 0
  collection_points     INT       DEFAULT 0
  last_unlock_at        DATETIME
  hint_cooldown_expiry  BIGINT
  next_hint_index       INT       DEFAULT 0
```

*Completion tracked bằng achievementBits[16] trong PlayerSaveData — không cần per-row table.*

---

## 10. Save Data V6 Extension

```
achievementMeta: {
  totalPoints: int,
  categoryPoints: { combat, exploration, collection, social, economy, progression, events: int },
  hiddenUnlockedCount: int,
  lastUnlockedId: string,
  metaAchievementsUnlocked: string[],
  hintCooldownExpiry: long,
  nextHintIndex: int
}
```

---

## 11. Network Requirements

| Packet | Direction | Trigger |
|---|---|---|
| S2C_AchievementUnlocked | S→C | Unlock |
| S2C_MetaAchievementUnlocked | S→C | Meta complete |
| C2S_AchievementClaimReward | C→S | Manual claim |
| S2C_AchievementListSync | S→C | Login |
| S2C_AchievementHintUnlock | S→C | 7-day cycle |
| C2S_AchievementPageRequest | C→S | UI browse (max 10/min) |

---

## 12. Anti-Exploit Rules

| Exploit Vector | Protection |
|---|---|
| Kill count farming same zone | Rate limit: max 200 credited kills/hour per monster per zone |
| AFK kill farming | Combat session phải có damage dealt > 0 by player |
| Client inspect hidden ach. | Conditions obfuscated / server-only |
| Time manipulation (idle ach.) | Dùng server clock |

---

*Document: 04_ACHIEVEMENT_SYSTEM.md | Version: 1.0 | Date: 2026-06-14*
*Dependencies: BestiaryManager.cs, QuestStateMachine.cs, TitleSystem, MailSystem*
