# TITLE SYSTEM — Slime MMORPG Production Bible
> Game: Slime MMORPG | System: Title System | Version: 1.0 | Date: 2026-06-14
> Power Budget Allocation: 0% (Pure Cosmetic) | Linked Systems: Achievement, Ascension, Guild, Quest

---

## 1. Purpose & Design Goals

- **Visual status symbol**: title được earn qua effort thực sự, không mua được bằng premium gem
- **Progression signaling**: player nhìn title biết ngay level progression
- **Long-term goal**: một số title cực kỳ khó earn → mục tiêu dài hạn cho veteran player

**Design Principle:** Title KHÔNG có stat. No P2W vector. One title at a time.

---

## 2. Title Sources (7 Sources)

| # | Source | Rarity Range | Permanent? |
|---|---|---|---|
| 1 | Achievement | Rare → Legendary | YES |
| 2 | Quest | Common → Rare | YES |
| 3 | Seasonal | Legendary (time-limited earn) | YES once earned |
| 4 | Guild War | Epic | YES |
| 5 | Hidden | Legendary | YES |
| 6 | Prestige (Ascension) | Legendary | YES |
| 7 | Event | Epic (time-limited earn) | YES once earned |

---

## 3. Title Categories & Count

| Category | Count |
|---|---|
| Combat Titles | 60 |
| Exploration Titles | 40 |
| Social Titles | 35 |
| Prestige Titles | 25 |
| Hidden Titles | 20 |
| Seasonal Titles | 40 |
| Event Titles | 30 |
| **Total** | **~250 titles** |

---

## 4. Title Rarity

| Rarity | Count | Đặc Điểm |
|---|---|---|
| Common | 50 | Quest rewards, early game |
| Uncommon | 80 | Combat/exploration mid-tier |
| Rare | 60 | Achievement Gold tier |
| Epic | 40 | Guild War, Event boss |
| Legendary | 20 | Ascension max, Season #1, Hidden special |

---

## 5. Title Display Rules

| Rule | Chi Tiết |
|---|---|
| Position | Prefix hoặc Suffix — defined per title |
| Length Limit | Character name (16 chars) + Title (20 chars) |
| Font | Italic variant, color match rarity |
| Animation | Legendary titles: subtle shimmer (optional toggle) |
| PvP | Player có thể bật "cosmetic hide" trong PvP settings |

---

## 6. Achievement-Linked Titles

| Achievement Meta | Title | Rarity |
|---|---|---|
| Combat Initiate (25% Combat) | "Brawler" | Common |
| Combat Master (50% Combat) | "Battle-Hardened" | Uncommon |
| Combat Legend (100% Combat) | "Warbringer" | Rare |
| Grand Explorer (100% Exploration) | "Worldwalker" | Rare |
| Guild Patriarch (100% Social) | "Pillar of the Community" | Epic |
| Living Encyclopedia (100% Collection) | "The Chronicler" | Epic |
| Grand Champion (80% All) | "Grand Champion" | Legendary |

---

## 7. Quest-Linked Titles

| Quest Milestone | Title | Display |
|---|---|---|
| Main Quest Chapter 1 | "Savior of Verdant Plains" | Suffix |
| Main Quest Chapter 5 | "Champion of the Realm" | Prefix |
| Main Quest Final Boss Kill | "Slayer of Chaos" | Prefix |
| All 334 Quests Complete | "Completionist" | Legendary Prefix |

---

## 8. Prestige Titles (Ascension-Linked)

| Ascension Rank | Title | Rarity |
|---|---|---|
| Rank 5 | "Awakened" | Uncommon |
| Rank 10 | "Transcendent" | Rare |
| Rank 15 | "Exalted" | Epic |
| Rank 20 | "Celestial" | Epic |
| Rank 25 | "Void Transcendent" | Legendary |

Rank 25 dự kiến ~1-5% player đạt được. "Void Transcendent" có golden pulsing glow.

---

## 9. Seasonal Titles

| Rank Range | Title | Rarity |
|---|---|---|
| Server #1 | "[Season Name] Grand Champion" | Legendary |
| Top 10 | "[Season Name] Elite" | Epic |
| Top 100 | "[Season Name] Champion" | Rare |
| Season Participation | "[Season Name] Veteran" | Common |

**Rules:** Earning window đóng khi season kết thúc. Title đã earn = permanent, không bị lấy lại.

---

## 10. Hidden Titles (20 titles)

| Title Name | Source (Ẩn) | Rarity |
|---|---|---|
| "By The Skin of My Teeth" | Kill boss với HP < 10 còn lại | Epic |
| "Master of Trades" | Bán 10,000 items cho AH | Rare |
| "Persistent" | Die 100 lần với same monster | Uncommon |
| "Secret Keeper" | Tìm 7 Easter egg NPCs | Legendary |
| "Stranger Together" | Full-stranger party dungeon clear | Rare |
| "Sloth Supreme" | Idle 1 giờ liên tục | Common |
| "Ghost" | Clear dungeon without taking damage | Epic |
| "Pacifist" | Đạt level 100 không kill bất kỳ monster | Legendary |

**Community Rule:** Official channels không spoil hidden title conditions.

---

## 11. Guild War Titles

| Condition | Title | Rarity |
|---|---|---|
| Win first Guild War | "Guild Warrior" | Common |
| Win 5 Guild Wars | "Guild Champion" | Uncommon |
| Win 10 Guild Wars | "Warlord" | Epic |
| Win 50 Guild Wars | "Supreme Commander" | Legendary |

---

## 12. Economy Integration

| Aspect | Rule |
|---|---|
| Premium Shop | Titles KHÔNG bán (no P2W signal) |
| Title Effects (cosmetic) | Premium shop CÓ THỂ bán visual "title effect" style (glow variant) — không thay tên/rarity |
| Achievement Point Shop | KHÔNG spend points lấy title |

---

## 13. Database Structure

```sql
TABLE title_catalog
  title_id            VARCHAR(32)   PK
  name_vn             NVARCHAR(128)
  name_en             VARCHAR(128)
  category            ENUM(combat,exploration,social,prestige,hidden,seasonal,event)
  source_type         ENUM(achievement,quest,seasonal,guild_war,hidden,prestige,event)
  rarity              TINYINT
  display_position    ENUM(prefix, suffix)
  is_time_limited_earn BOOL
  earn_window_end     DATETIME      -- null = permanent earn
  has_animation       BOOL

TABLE player_titles
  player_id     BIGINT      FK
  title_id      VARCHAR(32) FK
  earned_at     DATETIME
  is_equipped   BOOL        DEFAULT FALSE
  PRIMARY KEY (player_id, title_id)
  INDEX: player_id WHERE is_equipped = TRUE
```

---

## 14. Save Data V6 Extension

```
titleData: {
  equippedTitleId:   string,
  earnedTitleIds:    string[],
  earnedCount:       int,
  lastEarnedTitleId: string
}
```

---

## 15. Network Requirements

| Packet | Direction | Trigger |
|---|---|---|
| S2C_TitleUnlocked | S→C | Grant |
| C2S_TitleEquip | C→S | Player equip |
| S2C_TitleEquipConfirm | S→C | Equip response |
| S2C_OtherPlayerTitleVisible | S→C | Zone enter (batch) |
| S2C_TitleCollectionSync | S→C | Login |

---

*Document: 05_TITLE_SYSTEM.md | Version: 1.0 | Date: 2026-06-14*
*Dependencies: AchievementSystem, AscensionSystem, QuestStateMachine, GuildWarSystem*
