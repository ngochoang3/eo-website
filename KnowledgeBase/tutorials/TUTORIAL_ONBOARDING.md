# TUTORIAL & FTUE SYSTEM ARCHITECTURE
> Game: Slime MMORPG | Date: 2026-06-14 | Version: 1.0
> Target: D1 > 40% | D7 > 20% | Conversion > 5% in first 30 days

---

## 1. Design Philosophy

Tutorial phải:
1. **Show, don't tell**: Dạy qua hành động, không qua text wall
2. **Respect player time**: First 5 min = fun immediately
3. **Hook before gate**: Cảm giác mạnh TRƯỚC khi gặp progression gate
4. **Soft sell**: Monetization hint tự nhiên, không aggressive
5. **Optional depth**: Người chơi cứng có thể skip, người mới có guide đầy đủ

---

## 2. FTUE Architecture Overview

```
[Tutorial FSM — TutorialManager.cs]

State 0: SKIP_CHECK
  → returning player (save data exists) → SKIP_TUTORIAL
  → new player → NEW_PLAYER_INTRO

State 1: NEW_PLAYER_INTRO (Day 0 — first 5 minutes)
  → character creation → first combat → first reward

State 2: CORE_SYSTEMS_INTRO (Day 0 — first 30 minutes)
  → equipment → skill → pet → housing intro

State 3: FIRST_DAY_LOOP (Day 1 — hours 1-2)
  → daily quests → dungeon → guild invite → monetization hook 1

State 4: FIRST_WEEK_LOOP (Day 2-7)
  → systems deepening → social → boss → monetization hook 2

State 5: TUTORIAL_COMPLETE
  → mark tutorial_completed = true in save
  → analytics: TutorialCompleted event
```

---

## 3. First 5 Minutes — "The Awakening"

### 3.1 Opening Sequence (Minute 0:00-2:00)

```
[Scene: Bright forest clearing — Biome 1 "Verdant Plains"]

[Cinematic Skip button: top right, visible after 5s]

Narrator (text only, localized):
  "Long ago, the Ancient Spirits sealed away chaos...
   Today, a new hero rises."
  [Duration: 30 seconds max]

[Character appears — no character creation at cold start]
  Immediate control: player can move on first frame after cinematic
  Mobile UX: left joystick appears on first touch

[Tutorial Prompt 1 — floating arrow]
  "MOVE with the left stick"
  → Player moves 5 steps
  → Prompt disappears, ✅ check animation

[First Enemy appears: Baby Slime, HP bar visible]
  Tutorial Prompt 2: "TAP ATTACK to fight!"
  → Player kills slime (2-3 hits, damage numbers visible)
  → BIG drop: Iron Sword (glowing)
  
[Minute 1:30]
  Tutorial Prompt 3: "Pick up your FIRST WEAPON"
  → Player taps dropped item
  → Auto-equip animation
  → Stat panel flashes briefly (ATK increased)
  
[Minute 2:00]
  Player attacks another slime with new weapon
  CRIT hit triggers for first time (big number, screen shake)
  "CRITICAL HIT!" text appears
  → First blood feels GREAT
```

### 3.2 First Reward (Minute 2:00-3:00)

```
[Quest Complete popup: "Defeat 3 Slimes"]
  Reward: 500 Gold + Common Enhancement Stone × 1 + 10 Gems

[Enhancement Introduction]
  Prompt: "Make your weapon STRONGER!"
  → Player opens Equipment panel (auto-highlighted)
  → Enhance sword to +1 (uses stone from reward)
  → Sword glows, "+1" badge appears
  → ATK increases visibly (+5 ATK)
  
[First "power feel" moment — enemy takes more damage]
  Player kills next enemy in fewer hits
  Visual feedback: damage number is higher
```

### 3.3 First Spirit Discovery (Minute 3:00-5:00)

```
[A glowing orb floats near player]
  Spirit "Verdant Seedling" approaches
  Tutorial: "A SPIRIT wants to BOND with you!"
  → Player taps spirit → Bond animation (visual spectacle)
  → Spirit Seedling equipped (first SoulBond slot)
  → Small buff icon appears (HP +50)

[Minute 4:30: First safe zone (village)]
  Player arrives at Village of Origin
  NPC Mira greets player:
    "Welcome, Adventurer! Your journey begins here."
  [3 NPCs visible with quest markers]
  
[Tutorial complete stamp: "First Steps ✅"]
  Popup: "You've learned the basics! Your adventure awaits."
  Reward: Beginner's Backpack (extra inventory +5 slots)
  
Analytics event: FTUE_FIRST_5_COMPLETE (timestamp, actions_taken)
```

---

## 4. First 30 Minutes — "The World Opens"

### 4.1 Equipment Deep Dive (Minute 5-10)

```
Quest: "The Blacksmith's Lesson" (auto-trigger)
  → Visit Blacksmith NPC
  → Tutorial: Equipment slots (head/chest/hands/legs/boots/weapon/offhand/accessory)
  → Player equips 3 items from tutorial chest
  → "COMPARE ITEMS" tooltip shows stat difference
  → Enhancement: enhance 2 items to +1
  → Reward: Iron Set (full common gear for starting zone)
  
Teach: Rarity colors (White/Green/Blue/Purple/Gold/Red)
       "Purple items are RARE — look for them in dungeons!"
```

### 4.2 Skill Introduction (Minute 10-15)

```
Quest: "First Strike"
  → Open Skill Panel (auto-open, first time)
  → Tutorial: Skill Points (SP explanation)
  → Player has 2 SP (from first 2 levels)
  → Prompt: "Put SP into Quick Slash"
  → Player invests 2 SP → Quick Slash Lv2
  → Equip Quick Slash to Skill Slot 1
  → Test: "Use Quick Slash in combat"
  → Player kills Training Dummy using skill
  → Skill effect (particle, sound) feels satisfying
  → Reward: +3 SP bonus (tutorial gift)
```

### 4.3 Pet Introduction (Minute 15-20)

```
Quest: "A Companion for Life"
  → Capture tutorial: weaken Baby Blue Slime (HP < 30%)
  → Prompt: "Capture it!" → throw Capture Stone
  → Pet Capture success animation (star burst)
  → First Pet: "Slimeling" added to Pet Roster
  → Pet follows player (waddling animation, immediate joy)
  → Feed pet: Pet Treat × 1 (from inventory)
  → Loyalty +10 visible
  → Reward: Pet Treat ×5 + Pet Equipment (Tiny Ribbon)
```

### 4.4 Housing Introduction (Minute 20-25)

```
Quest: "Home Sweet Home"
  → Player teleported to Housing District
  → Housing plot assigned (Level 1, 5×5, FREE)
  → Tutorial: Place 1 furniture (Simple Wooden Chair — pre-placed)
  → "Your home generates income while you're away!"
  → Show passive income preview: 1,200 gold/day at L1
  → Collect first income (instant 100g tutorial reward)
  → Reward: Housing Coin × 50 + 3 Common Furniture items
  
Analytics event: HOUSING_INTRO_COMPLETE
```

### 4.5 First Dungeon (Minute 25-30)

```
Quest: "Dungeon Delve" (solo dungeon, tutorial difficulty)
  → Enter "Verdant Cave" (shortest dungeon, 2 rooms)
  → Room 1: Normal monsters (auto-guided)
  → Room 2: Mini-boss "Cave Guardian"
  → Boss mechanics tutorial: "Dodge the RED circle!"
  → Boss defeated → LOOT SHOWER (multiple items drop)
  → Item rarity explanation popup: Blue item drops
  → Dungeon complete → "DUNGEON CLEARED" full screen
  → Reward: Dungeon Ticket ×2 + Uncommon Bracelet
  
[Minute 29:30 — First Monetization Hook]
  After dungeon clear:
  "Running low on dungeon tickets? Get more with Daily Card!"
  [Small non-intrusive banner — can dismiss instantly]
  NOT a pop-up blocker. Just a banner at bottom.
  
Analytics event: FIRST_DUNGEON_COMPLETE, time_to_complete, deaths
```

---

## 5. First Day — "Finding Your Rhythm"

### 5.1 Day 1 Checklist (automatic, unlocked at 30-minute mark)

```
[Day 1 Achievement Panel — auto-appears after tutorial complete]

□ Complete 3 Daily Quests                    → 300 Gold + 30 Gems
□ Kill 50 monsters in any biome              → 500 Gold + Dungeon Ticket ×1
□ Enhance any item to +3                     → Common Enhancement Stone ×2
□ Visit Guild Hall (trigger: nearby)         → Guild Coin ×50
□ Feed your pet 3 times                      → Pet Treat ×3 (from AFK drop)
□ Login for consecutive 2nd day (tomorrow)   → Preview: "Return tomorrow!"

Day 1 Completion Reward: 200 Gems + "Day One" Avatar Frame (exclusive)
```

### 5.2 Guild Hook (Day 1, Hour 2)

```
[Guild Invite popup — after completing 3 daily quests]
  "A guild has invited you to join!"
  [Recommend: "Beginners Alliance" (server auto-guild for new players)]
  
Tutorial: Guild Hall tour
  → Guild check-in: 100 Guild Coin (immediate)
  → Guild Boss (weekly): preview teaser
  → Chat tutorial: type one message in Guild Chat
  → Reward: Guild Coin ×200

[Social hook activated: real players visible in guild chat]
  This creates social bonding → D7 retention driver
```

### 5.3 First Purchase Moment (Day 1, End)

```
[Trigger: After player completes Day 1 checklist, or runs out of dungeon tickets]

Pop-up: "Your First Adventure Pack"
  [Starter Pack — $0.99]
  Contains: 60 Diamond + 7-Day Login Pass + 5 Dungeon Tickets
  
  Design principle: Appear AFTER value is demonstrated (30 min of fun)
  NOT on launch screen (too early)
  CAN dismiss with X — not mandatory
  
Timer: "Offer valid for 7 days" (creates future urgency but not panic)

Analytics: FIRST_PURCHASE_SHOWN, source=day1_hook
```

### 5.4 Offline Progress Introduction

```
[Night time: player about to close app]
[Session end detected: app goes to background]

Popup: "Your adventure continues while you sleep!"
  → Housing income will accumulate
  → Pet will gather materials (small amount)
  → AFK grinding: set zone → collect tomorrow
  
"Set AFK Zone" tutorial:
  Player selects current zone as AFK zone
  Shows expected yield in 8 hours
  → CLOSES APP with satisfaction (not frustration)

Analytics: AFK_SET event → D1→D2 retention signal
```

---

## 6. First Week — "Deepening Roots"

### 6.1 Day 2 — Retention Hook (Push Notification)

```
Push Notification (sent 20 hours after Day 1 session end):
  Title: "Your AFK rewards are ready!"
  Body: "You earned [X gold] while offline. Claim now!"
  Deep link: Open game → AFK collect screen
  
  If no push permission: show in-game banner on next login
  
Analytics: PUSH_OPEN_D2, GOLD_COLLECTED_FROM_AFK
```

### 6.2 Day 2-3 — System Deepening

| Day | New System Introduced | Tutorial |
|---|---|---|
| Day 2 | Auction House | "Sell your first item" quest |
| Day 2 | Relic System | First Relic drops from dungeon |
| Day 3 | Element System | "Exploit weaknesses" quest vs element-specific boss |
| Day 3 | Affix System | First Blue item with affix drops |
| Day 4 | Gem System | First Gem Socket tutorial |
| Day 4 | Crafting | Craft first Potion |
| Day 5 | World Boss | "Join the World Boss!" server event |
| Day 6 | Spirit Bond | Second spirit discovered in new zone |
| Day 7 | Ascension Preview | "Your first ascension awaits at Level 80" |

### 6.3 Day 7 — "One Week Milestone"

```
[Day 7 Login — Special screen]
  "You've been adventuring for 7 days!"
  
  D7 Reward:
    Diamond × 100
    "7-Day Survivor" Avatar Frame (exclusive, NEVER returns)
    Enhancement Stone ×5
    Rare Housing Decor ×1
    Telegram to guild: "[Player] has survived their first week!"
    
  This reward ONLY available for players who login on Day 7.
  Missed: gone forever (gentle FOMO without panic)

[Weekly Recap screen]
  "This week you..."
  - Killed X monsters
  - Reached Level Y
  - Enhanced gear Z times
  - Bond Level with [Spirit]: N

[Monetization Hook 2 — gentle]
  "Unlock double progress with Battle Pass!"
  [View Battle Pass] button → NOT a blocker popup
```

---

## 7. Tutorial Skip System

### 7.1 Skip Options

```
Skip Trigger: "Skip Tutorial" button always visible after 60 seconds
  
Skip Options:
  □ Skip to Combat (skip intro cinematic only)
  □ Skip All Tutorials (veteran player)
    → Confirm: "You'll miss some rewards. Are you sure?"
    → If yes: teleport to Village, receive "Veteran's Bundle" reward
  
Veteran Bundle (skip reward):
  → 3 of every tutorial reward combined
  → Same Avatar Frame as tutorial completion
  → Saves time, doesn't punish veterans
```

### 7.2 Tutorial Re-Play

```
From Settings → Tutorial → "Replay [SystemName] Tutorial"
  
Available replays:
  - Combat Tutorial
  - Enhancement Tutorial
  - Pet Tutorial
  - Housing Tutorial
  - Dungeon Tutorial
  - Skill Tutorial
  
Replay rewards: NOT re-granted (only first time)
Purpose: Help players who want to re-learn
```

---

## 8. Analytics Tracking

```csharp
// Key FTUE analytics events:
TutorialManager.OnPhaseComplete(phase, durationSeconds, attemptsCount):
    AnalyticsService.Track("tutorial_phase_complete", new {
        phase_name, duration_s, attempts, level, deaths
    });

// D1 Retention predictor:
if (session.durationMinutes >= 30 && dungeonCompleted):
    AnalyticsService.Track("d1_retention_high_confidence");
    // Correlation: players who hit 30min + dungeon have 65%+ D1 retention

// Funnel:
tutorial_start → combat_intro → first_pet → first_dungeon → first_purchase_shown → purchase
```

### FTUE Analytics Funnel Table

| Step | Expected % Complete | Drop Risk |
|---|---|---|
| Game launches | 100% | — |
| Cinematic skip | 85% | Cinematic too long |
| First combat complete | 92% | Controls confusing |
| First reward claimed | 95% | — |
| Equipment equip | 88% | UI confusing |
| First skill used | 82% | SP system unclear |
| Pet captured | 78% | Capture mechanic unclear |
| Housing visited | 70% | Teleport confusion |
| First dungeon complete | 60% | Dungeon too hard |
| Day 1 checklist 3+ | 45% | D1 target |
| Guild joined | 35% | — |
| Day 7 return | 22% | D7 target |

---

## 9. Technical Implementation

### 9.1 TutorialManager.cs Structure

```csharp
public class TutorialManager : MonoBehaviour {
    public static TutorialManager Instance { get; private set; }
    
    [SerializeField] private TutorialConfig config;    // ScriptableObject
    
    private TutorialState currentState;
    private int currentStepIndex;
    
    public void Initialize() {
        if (SaveManager.Instance.CurrentSave.tutorialCompleted) {
            currentState = TutorialState.COMPLETE;
            return;
        }
        StartState(TutorialState.NEW_PLAYER_INTRO);
    }
    
    private void StartState(TutorialState state) {
        currentState = state;
        var steps = config.GetStepsForState(state);
        RunSteps(steps);
    }
    
    private void RunSteps(TutorialStep[] steps) {
        foreach (var step in steps) {
            // Highlight UI element, show tooltip, wait for player action
            UIHighlighter.Instance.Highlight(step.targetElement);
            TooltipManager.Instance.Show(step.message, step.position);
            yield return new WaitUntil(() => step.completionCondition.IsComplete());
            step.onComplete?.Invoke();
        }
    }
    
    public void SkipTutorial() {
        currentState = TutorialState.COMPLETE;
        SaveManager.Instance.CurrentSave.tutorialCompleted = true;
        GrantVeteranBundle();
        AnalyticsService.Track("tutorial_skipped");
    }
}
```

### 9.2 TutorialConfig (ScriptableObject)

```csharp
[CreateAssetMenu(menuName = "Config/Tutorial")]
public class TutorialConfig : ScriptableObject {
    public TutorialStateConfig[] states;
    public TutorialReward[] completionRewards;
    public TutorialReward veteranSkipBundle;
}

[System.Serializable]
public class TutorialStep {
    public string stepId;
    public string messageKey;                   // localization key
    public string targetElement;               // UI element name to highlight
    public TutorialPosition tooltipPosition;
    public TutorialCondition completionCondition;
    public UnityEvent onComplete;
    public TutorialReward reward;
}
```

---

## 10. Save Data

```csharp
// Addition to PlayerSaveData:
public class TutorialSaveData {
    public bool tutorialCompleted;
    public string currentPhase;                // "FIRST_30_MIN", "FIRST_DAY", etc.
    public HashSet<string> completedStepIds;
    public HashSet<string> claimedTutorialRewards;
    public bool skippedTutorial;
    public long tutorialStartAt;
    public long tutorialCompleteAt;
}
```

---

*Document: TUTORIAL_ONBOARDING.md | Version: 1.0 | Date: 2026-06-14*
*FTUE Target: D1 > 40% | D7 > 20% | First Purchase Conversion: Day 1 end*
*Tutorial states: 5 phases | Total duration: 7 days | Skip option: always available*
