# UI/UX ARCHITECTURE
> Game: Slime MMORPG | Document: UI Architecture & UX Design | Date: 2026-06-14
> Scope: All UI screens, navigation flow, accessibility, mobile UX patterns

---

## 1. Purpose

Tài liệu này định nghĩa kiến trúc UI/UX toàn diện:
- Danh sách đầy đủ tất cả màn hình
- Navigation flow giữa màn hình
- Mobile UX patterns (touch, gestures)
- Accessibility standards
- Performance guidelines cho UI

---

## 2. UI Architecture Overview

### 2.1 UI Layer Stack (Canvas order, back to front)

```
Layer 0 — World (3D)
Layer 1 — World UI    (damage numbers, health bars, name tags)
Layer 2 — HUD         (persistent: minimap, HP/MP, hotbar, buffs)
Layer 3 — Panels      (inventory, skills, pet, quest — slide in)
Layer 4 — Modals      (dialogs, confirmations, rewards)
Layer 5 — Notifications (toast messages, achievement pop-ups)
Layer 6 — System      (loading screen, maintenance, ban notice)
```

### 2.2 UI Framework

- Unity UI Toolkit (UIElements) — preferred for panels
- Unity UGUI — for World UI (damage numbers, nameplates)
- All UI prefabs loaded via Addressables (Icons group)
- UINavigationService manages screen stack (CLIENT_ARCHITECTURE.md)

---

## 3. Screen List — Complete

### 3.1 Main Menu Screens

| Screen | Purpose | Navigation |
|---|---|---|
| SplashScreen | Studio logo + loading | Auto → MainMenu |
| MainMenuScreen | Login, settings access | → LoginScreen, SettingsScreen |
| LoginScreen | Google/Apple/Guest login | → CharacterSelect |
| CharacterSelectScreen | Choose character slot | → CharacterCreate, GameWorld |
| CharacterCreateScreen | Name + appearance | → CharacterSelect |

### 3.2 HUD (Persistent In-Game)

| Component | Description | Position |
|---|---|---|
| HPBar | HP + MP + EXP bars | Bottom-left |
| Hotbar | 8 skill slots | Bottom-center |
| BuffBar | Active buffs/debuffs | Top-left |
| MinimapWidget | Mini-map + biome name | Top-right |
| CurrencyWidget | Gold + Gem display | Top-right below minimap |
| WeatherWidget | Weather icon + time of day | Top-right |
| NotificationArea | Toast messages | Top-center |
| QuestTracker | Active quest progress | Right side |
| PartyCast | Party member HP | Left side (if in party) |

### 3.3 Inventory & Equipment Screens

| Screen | Purpose | Open Via |
|---|---|---|
| InventoryScreen | Item grid, sort, filter | HUD button or [B] key |
| EquipmentScreen | Equipment slots visualization | [E] key / inventory |
| ItemDetailModal | Item stats, compare | Tap item |
| EnhancementScreen | +0 to +15 enhancement | Item detail → Enhance |
| AffixScreen | Affix reroll, lock | Item detail → Affixes |
| GemSocketScreen | Socket gems | Item detail → Gems |
| SetBonusScreen | View active set bonuses | Equipment screen |

### 3.4 Skill Screens

| Screen | Purpose | Open Via |
|---|---|---|
| SkillScreen | View all skills, assign hotbar | [S] key |
| SkillDetailModal | Skill stats, upgrade | Tap skill |
| AscensionScreen | Ascension rank progress | [A] key |
| AscensionNodeModal | Choose ascension nodes | Tap node |
| MasteryScreen | Mastery progress, bonuses | Tab in SkillScreen |

### 3.5 Pet & Creature Screens

| Screen | Purpose | Open Via |
|---|---|---|
| PetScreen | Active pet, stats, equipment | [P] key |
| PetEquipmentScreen | Equip pet gear | PetScreen → Equipment |
| CreatureScreen | All captured creatures | [C] key |
| CreatureDetailModal | Creature stats, loyalty, breed | Tap creature |
| BestiaryScreen | Kill counts, drop bonuses | CollectionScreen tab |

### 3.6 Social Screens

| Screen | Purpose | Open Via |
|---|---|---|
| GuildScreen | Guild info, members, quests | [G] key |
| GuildManagementScreen | Admin tools (leader only) | GuildScreen → Manage |
| GuildTreasuryScreen | Donate, view balance | GuildScreen tab |
| GuildBossScreen | Guild boss status, enter | GuildScreen tab |
| GuildShopScreen | Guild coin shop | GuildScreen tab |
| GuildWarScreen | War status, declare | GuildScreen tab |
| PartyScreen | Current party, role select | [F] key |
| PartyFinderScreen | Browse open parties | PartyScreen → Find |
| FriendsScreen | Friend list, invite | Social button |
| ChatScreen | Global, guild, party, whisper | Chat button |
| MailScreen | Inbox, claim attachments | Mailbox icon / notification |
| MentorScreen | Mentor/student management | Social → Mentor |

### 3.7 Quest & Progression Screens

| Screen | Purpose | Open Via |
|---|---|---|
| QuestScreen | All quests, active/complete | [Q] key |
| QuestDetailModal | Quest objectives, rewards | Tap quest |
| AchievementScreen | 8 categories, 1000 achievements | Achievement button |
| AchievementDetailModal | Achievement progress, claim | Tap achievement |
| TitleScreen | All titles, equip | Profile → Titles |
| CollectionCodexScreen | 2138 entries, milestones | [L] key |
| CollectionDetailModal | Entry details, lore | Tap entry |

### 3.8 Economy Screens

| Screen | Purpose | Open Via |
|---|---|---|
| ShopScreen | NPC shop browser | Talk to NPC |
| GachaScreen | Banner list, pull UI | Event banner button |
| BannerDetailScreen | Pull rates, pity, history | Tap banner |
| GachaPullAnimation | Pull result reveal | After pull |
| GachaHistoryScreen | Pull history per banner | BannerDetail → History |
| AuctionHouseScreen | List, buy, bid | [H] key |
| AHListingScreen | Create AH listing | AH → List item |

### 3.9 Housing Screens

| Screen | Purpose | Open Via |
|---|---|---|
| HousingScreen | Plot overview, furniture | [O] key |
| FurniturePlacementUI | Drag-drop furniture | HousingScreen → Edit |
| FurnitureShopScreen | Buy furniture | HousingScreen → Shop |
| CreatureRanchScreen | Manage ranch animals | HousingScreen → Ranch |
| VisitorLogScreen | Who visited | HousingScreen → Log |

### 3.10 World & Event Screens

| Screen | Purpose | Open Via |
|---|---|---|
| WorldMapScreen | Global map, teleport | [M] key |
| BiomeDetailModal | Biome info, territory | Tap biome on map |
| TerritoryWarScreen | Current territory status | Map → Territory |
| WorldEventScreen | Active events, join | Event button |
| EventDetailScreen | Event details, progress | Tap event |
| CalendarScreen | Upcoming events | Calendar button |

### 3.11 Character & Progression System Screens

| Screen | Purpose | Open Via |
|---|---|---|
| ProfileScreen | Player stats, title, playtime | [I] key |
| ReputationScreen | 5 factions, standings | [R] key |
| SeasonScreen | Battle Pass, season progress | [V] key |
| SeasonShopScreen | Season token shop | SeasonScreen → Shop |
| LeaderboardScreen | Server/cross-server rankings | Trophy button |
| RelicScreen | 135 relics, equip | [X] key |
| ArtifactScreen | 45 artifacts, slots | [X] key → Artifacts tab |
| TraitScreen | 60 traits, active | Profile → Traits |
| RuneScreen | 150 runes, slots | [X] key → Runes tab |

### 3.12 System Screens

| Screen | Purpose | When |
|---|---|---|
| SettingsScreen | Graphics, audio, controls | Settings button |
| AccessibilityScreen | Color blind, text size | Settings → Accessibility |
| LanguageScreen | VN / EN | Settings → Language |
| OfflineRewardScreen | AFK reward claim | Auto-show on login if pending |
| DailyLoginBonusScreen | Login streak reward | Auto-show daily |
| ActivityScreen | Daily/weekly activities | Activity button |
| LoadingScreen | Between scene loads | Auto during loading |
| MaintenanceScreen | Server down notice | Auto on connect fail |
| ErrorScreen | Connection errors | Auto on error |
| NewPlayerTutorialScreen | Onboarding flow | First login only |

---

## 4. Navigation Flow

### 4.1 Main Navigation

```
[HUD — Always Visible]
    │
    ├── [I] → ProfileScreen
    ├── [B] → InventoryScreen → EquipmentScreen
    ├── [S] → SkillScreen → AscensionScreen
    ├── [P] → PetScreen → CreatureScreen
    ├── [Q] → QuestScreen → AchievementScreen
    ├── [G] → GuildScreen (multi-tab)
    ├── [F] → PartyScreen → PartyFinderScreen
    ├── [H] → AuctionHouseScreen
    ├── [M] → WorldMapScreen
    ├── [O] → HousingScreen (if at plot)
    ├── [V] → SeasonScreen
    ├── [L] → CollectionCodexScreen
    └── [R] → ReputationScreen
```

### 4.2 Mobile Navigation (Touch)

- No keyboard shortcuts on mobile
- Bottom navigation bar: 6 icon tabs (Combat, Inventory, Social, Quest, Map, More)
- Swipe left/right to navigate between HUD tabs (quest tracker ↔ buff list)
- "More" tab → secondary screens (Housing, Collection, etc.)
- Back gesture (Android) / swipe-from-left (iOS) → close current panel

### 4.3 Screen Stack Rules

- Max stack depth: 5 screens
- Auto-close combat panels if entering combat (inventory closes)
- Cannot open GuildScreen if not in guild → redirect to Guild Search
- Shop screens blocked in dungeon (except Guild Shop tab)

---

## 5. Mobile UX Patterns

### 5.1 Touch Targets

- Minimum tap target: 44×44 points (Apple HIG standard)
- Hotbar skill buttons: 64×64 (larger for combat accuracy)
- Inventory grid cells: 80×80
- Confirm buttons: 120×48 (wide, easy thumb reach)
- Cancel/Back: top-left (reachable, less accidental press)

### 5.2 Gesture Design

| Gesture | Action | Context |
|---|---|---|
| Tap | Select / Confirm | Universal |
| Long press | Item context menu | Inventory cells |
| Swipe left | Previous tab | Multi-tab screens |
| Swipe right | Next tab | Multi-tab screens |
| Swipe up | Expand equipment details | Item detail |
| Pinch | Zoom minimap | Minimap only |
| Two-finger tap | Quick equip | Inventory |
| Hold drag | Move furniture | Housing edit mode |

### 5.3 One-Handed Play Support

- Critical controls within thumb zone (bottom 40% of screen)
- Hotbar: bottom-center (naturally reachable)
- Minimap: top-right (less critical, accessible but not required every tap)
- Monster tap-to-target: auto-selects nearest if tap area is ambiguous

### 5.4 Portrait vs Landscape

Game runs in **Landscape only** (fixed orientation):
- Better for combat (wider field of view)
- Lock device orientation in app manifest

### 5.5 Notification Design

| Type | Display | Duration | Dismiss |
|---|---|---|---|
| Item drop | Right-center toast | 3 seconds | Auto |
| Achievement | Top-center banner | 5 seconds | Tap |
| Mail received | Top-right icon badge | Persistent | Open mail |
| Level up | Full-screen flash | 2 seconds | Auto |
| Guild event | Guild tab badge | Until viewed | Open guild |
| Party invite | Modal dialog | 30 second timeout | Accept/Decline |
| World event | HUD banner | Event duration | Tap to open |

---

## 6. Accessibility

### 6.1 Visual Accessibility

| Feature | Implementation |
|---|---|
| Text size | 3 options: Small/Normal/Large (scale factor 0.8/1.0/1.3) |
| Color blind mode | 3 presets: Deuteranopia, Protanopia, Tritanopia |
| High contrast | Toggle: increase UI border contrast |
| Damage number size | Adjustable (small/normal/large) |
| Icon + text | All icons have text labels (no icon-only information) |
| Rarity color | Color + shape indicator (not color alone) |

### 6.2 Rarity Color + Shape System

| Rarity | Color | Shape Indicator |
|---|---|---|
| Common | Gray | Circle |
| Uncommon | Green | Square |
| Rare | Blue | Diamond |
| Epic | Purple | Pentagon |
| Legendary | Orange | Star |

### 6.3 Audio Accessibility

- Subtitle support for all dialog (NPCDialogManager output)
- Separate volume sliders: Master, Music, SFX, Voice
- Audio cues for: Level up, achievement, gacha pull (distinct sounds)

---

## 7. UI Performance Guidelines

### 7.1 Panel Render Budgets

| Panel | Max Draw Calls | Max Vertex | Notes |
|---|---|---|---|
| HUD | 50 | 10,000 | Always visible |
| Inventory | 100 | 20,000 | Show/hide fast |
| GachaScreen | 80 | 15,000 | Animate carefully |
| WorldMap | 60 | 12,000 | Atlas-based map |
| AuctionHouse | 120 | 25,000 | Many list items |

### 7.2 List Virtualization

- InventoryScreen: Virtual scroll (only render visible cells)
- AchievementScreen: Virtual scroll (1000 achievements)
- CollectionCodexScreen: Virtual scroll (2138 entries)
- AuctionHouseScreen: Paginated (20 items/page) + virtual scroll

### 7.3 Asset Loading

- All UI sprites: Addressables "Icons" group (preloaded on game start)
- Equipment icons: 64×64 ASTC/ETC2 compressed atlas
- Background panels: Shared atlas (1 atlas per theme)
- Avoid: Runtime Texture2D.ReadPixels, Runtime Sprite.Create

---

## 8. Onboarding & Tutorial Flow

### 8.1 New Player Tutorial (First Session)

```
Step 1: Basic movement tutorial (2 min)
Step 2: Attack your first monster (1 min)
Step 3: Pick up item, open inventory (1 min)
Step 4: Equip your first sword (1 min)
Step 5: First quest tutorial (2 min)
Step 6: Open skill screen, assign skill (1 min)
Step 7: First dungeon (starter dungeon, 5 min)
Step 8: Gacha tutorial (1 free pull, 2 min)
    → Unlock Daily Activity system
Step 9: Open housing (preview, 1 min)
Total: ~17 minutes onboarding
```

### 8.2 Tutorial Principles

- Skip button available after Step 3
- Tutorial NPCs guide player (NPCDialogManager special mode)
- Tooltips appear first time player sees new UI element
- Tooltip dismissed after 3 seconds or tap
- Progress saved (never repeat completed tutorial steps on reinstall)

---

## 9. Gacha UI (Special Requirements)

### 9.1 Rate Disclosure (App Store + Google Play Required)

BannerDetailScreen MUST show before purchase:
- Legendary drop rate: 0.6%
- Epic drop rate: 5.1%
- Pity mechanism explanation
- Rate disclosure text (per banner config)

### 9.2 Pull Animation

```
GachaPullAnimation:
    Single pull: 3-second reveal animation
    Multi pull (10): Sequential card flip, 8-second total
    Legendary: Extended animation (5 seconds, special effects)
    Rate disclosure: Shown before first pull (confirm required)
    History button: Always accessible from banner screen
```

### 9.3 Spending Confirmation

- Single pull: No confirmation (small amount)
- Multi pull (10): Confirmation modal showing total cost
- Balance shown before and after (previewing new balance)

---

## 10. Error & Empty States

| Screen | Empty State | Error State |
|---|---|---|
| Inventory | "Túi đồ trống" + tutorial hint | Network error + retry |
| Guild screen (not in guild) | "Tham gia hoặc tạo guild" + button | — |
| Mail (empty) | "Không có thư mới" + illustration | Network error + retry |
| AH (no results) | "Không tìm thấy vật phẩm" | Network error + retry |
| Leaderboard | Loading spinner → data | Network error → cached data |

---

## 11. Screen Transition Animations

| Transition | Duration | Type |
|---|---|---|
| Panel slide in | 200ms | Slide from right |
| Panel slide out | 150ms | Slide to right |
| Modal appear | 150ms | Scale + fade in |
| Modal dismiss | 100ms | Fade out |
| Scene transition | 300ms | Fade to black |
| Achievement pop | 400ms | Slide from top + bounce |
| Level up flash | 500ms | Screen flash + scale |

**Principle:** Snappy on dismiss (user waiting), can be slightly longer on appear (reward reveal).

---

## 12. Localization UI Considerations

- All text rendered via LocalizationService (no hardcoded strings)
- Vietnamese text is longer than English — all panels designed for +30% text length
- Numbers formatted: 1,234,567 (comma separated) in VN + EN
- Dates: DD/MM/YYYY (VN format)
- Currency display: Gold icon + number (no "G" suffix — icon is sufficient)

---

*Document: UI_UX_ARCHITECTURE.md | Version: 1.0 | Date: 2026-06-14*
*Platform: Android + iOS, Landscape only, Touch-first design*
*Accessibility: Color blind modes, text scaling, audio captions*
