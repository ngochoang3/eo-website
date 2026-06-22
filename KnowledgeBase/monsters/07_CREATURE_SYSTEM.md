# SYSTEM 07 — Creature Capture System
> Status: BLOCKER (P1)
> Power Budget: 0% power, utility only
> Ngày: 2026-06-13

---

# 1. Purpose

Creature Capture là hệ thống bắt quái vật ngoài chiến trường, nuôi dưỡng chúng, và dùng làm **companion utility** (không combat power). Khuyến khích exploration và engagement với monster system.

---

# 2. Design Philosophy

- **Utility only** — Creature KHÔNG đóng góp bất kỳ combat stat nào vào Power Budget
- **1 active creature** — equip companion slot; chủ yếu là visual + utility effect
- **Loyalty system** — creature trung thành hơn khi dùng thường xuyên
- **Creature quest** — mỗi creature có mini quest chain riêng để unlock ability đặc biệt
- **No P2W** — premium creature chỉ có cosmetic, không có stat

---

# 3. Core Loop

```
[Encounter monster in field/dungeon]
        │
        ▼
[Capture condition: HP < 30% + use Capture Orb]
        │
        ▼
[RNG capture roll (pity-protected)]
        │
        ▼
[Creature enters Stable (max 30)]
        │
        ▼
[Name creature, assign as Active Companion]
        │
        ▼
[Fight together → Loyalty +1 per hour active]
        │
        ▼
[Loyalty Rank up → unlock creature ability]
```

---

# 4. Progression Loop

| Loyalty Rank | Threshold | Unlock |
|---|---|---|
| 0 Stranger | 0 | Basic follow AI |
| 1 Acquaint | 100 | Reaction animation |
| 2 Friend | 300 | "Find Item" ability (1/day) |
| 3 Companion | 700 | Emote response |
| 4 Bond | 1,500 | Creature mini-quest |
| 5 Soul Bond | 3,000 | Unique creature ability + visual |

**Creature ability examples (utility only):**
- Phoenix: Revive once per dungeon (uses player's revive, not extra)
- Dragon: Detect nearby rare spawns (minimap ping)
- Rabbit: +5% gather speed (not combat)
- Slime: +5% item identification speed

---

# 5. Data Architecture

## 5.1 Entity

```
CreatureDataSO
├── id: string               ("creature_phoenix_01")
├── name: string             ("Baby Phoenix")
├── monster_source_id: string (which monster_db entry can be captured)
├── rarity: string           ("Common","Rare","Epic","Legend")
├── element: string          ("Fire")
├── biome: int               (primary habitat biome)
├── capture_rate_base: float (0.10 for Common, 0.01 for Legend)
├── loyalty_ability: string[] (5 abilities, one per rank 1-5)
├── is_power_creature: bool  (always false)
├── visual_model: string
├── visual_scale: float
├── idle_animation: string
└── lore: string

CreatureSave (per player per creature)
├── uid: BIGINT
├── creature_id: string
├── nickname: string (max 20 chars)
├── level: int (1-50, by battles together)
├── exp: int
├── loyalty: int
├── slot_active: bool (only 1 true at a time)
└── acquired_at: datetime
```

## 5.2 Database Tables

```sql
CREATE TABLE creature_data (
    id                  VARCHAR(32) PRIMARY KEY,
    name                VARCHAR(64) NOT NULL,
    monster_source_id   VARCHAR(32) REFERENCES monster_data(id),
    rarity              VARCHAR(16) NOT NULL,
    element             VARCHAR(16) NOT NULL,
    biome               TINYINT NOT NULL,
    capture_rate_base   FLOAT NOT NULL,
    loyalty_ability_json TEXT NOT NULL,
    is_power_creature   TINYINT NOT NULL DEFAULT 0,
    visual_model        VARCHAR(64),
    lore                TEXT
);

CREATE TABLE player_creature (
    uid             BIGINT PRIMARY KEY AUTO_INCREMENT,
    player_id       BIGINT NOT NULL,
    creature_id     VARCHAR(32) REFERENCES creature_data(id),
    nickname        VARCHAR(20),
    level           SMALLINT NOT NULL DEFAULT 1,
    exp             INT NOT NULL DEFAULT 0,
    loyalty         INT NOT NULL DEFAULT 0,
    slot_active     TINYINT NOT NULL DEFAULT 0,
    acquired_at     DATETIME NOT NULL,
    INDEX idx_player (player_id)
);

CREATE TABLE creature_capture_item (
    item_id         VARCHAR(32) PRIMARY KEY,
    name            VARCHAR(64) NOT NULL,
    capture_bonus   FLOAT NOT NULL DEFAULT 0,
    element_bonus   VARCHAR(16),
    craft_cost_gold INT NOT NULL
);

CREATE TABLE creature_loyalty_config (
    loyalty_rank    TINYINT PRIMARY KEY,
    loyalty_min     INT NOT NULL,
    rank_name       VARCHAR(32) NOT NULL,
    ability_unlock  VARCHAR(128) NOT NULL
);
```

## 5.3 ID Rules

Format: `creature_{monster_type}_{biome:02d}_{variant:01d}`
- `creature_phoenix_03_1` — Phoenix from Volcanic Ridge
- `creature_rabbit_01_1` — Rabbit from Verdant Meadow

Capture items: `orb_{tier}_{element}`
- `orb_basic_neutral`, `orb_fire_t2`, `orb_legend_void`

## 5.4 CSV Schema

`creature_db.csv`:
```
id,name,monster_source_id,rarity,element,biome,capture_rate_base,ability_1,ability_2,ability_3,ability_4,ability_5,is_power_creature,visual_model,lore
creature_phoenix_03_1,Baby Phoenix,mon_0042,Legendary,Fire,3,0.01,"Follow AI","Reaction anim","Find rare item 1/day","Phoenix quest","1/dungeon revive",false,pfb_creature_phoenix,Con phượng hoàng nhỏ từ Volcanic Ridge
creature_rabbit_01_1,Field Rabbit,mon_0001,Common,Nature,1,0.25,"Follow AI","Hop dance","Gather+5% 1/day","Rabbit quest","Find mushroom 3/day",false,pfb_creature_rabbit,Thỏ đồng Verdant Meadow
creature_slime_01_1,Tamed Slime,mon_0003,Common,Neutral,1,0.30,"Follow AI","Wobble","ID item faster","Slime quest","+5% ID speed permanent",false,pfb_creature_slime,Slime đã thuần hóa
```

## 5.5 JSON Schema

```json
{
  "name": "creature_db",
  "count": 84,
  "rows": [
    {
      "id": "creature_phoenix_03_1",
      "name": "Baby Phoenix",
      "monster_source_id": "mon_0042",
      "rarity": "Legendary",
      "element": "Fire",
      "biome": 3,
      "capture_rate_base": 0.01,
      "loyalty_abilities": [
        "Follow AI + reaction animation",
        "Reaction to player actions",
        "Find rare item (1 per day, utility)",
        "Phoenix quest chain: 5 missions",
        "Once per dungeon: trigger player's built-in revive early"
      ],
      "is_power_creature": false,
      "visual_model": "pfb_creature_phoenix",
      "lore": "Con phượng hoàng nhỏ từ Volcanic Ridge — chưa học cách bay nhưng đã biết trung thành."
    }
  ]
}
```

---

# 6. Formula Architecture

## 6.1 Capture Rate

```
CaptureRate = capture_rate_base × OrbMultiplier × HPBonus × ElementBonus

HPBonus:
  HP 30-50%:  ×1.0
  HP 15-30%:  ×1.5
  HP 5-15%:   ×2.0
  HP < 5%:    ×3.0

OrbMultiplier:
  orb_basic:   ×1.0
  orb_enhanced:×1.5
  orb_master:  ×2.5
  orb_legend:  ×5.0

ElementBonus:
  Same element as creature: ×1.2
  Opposing element:         ×0.8

Final cap: CaptureRate ≤ 0.95 (never guaranteed except pity)
```

## 6.2 Loyalty Gain

```
LoyaltyGain(session) = floor(active_minutes / 60)  [+1 per hour active]
LoyaltyGain(combat_together) = +1 per 10 kills với creature active
LoyaltyGain(feed) = varies per food item (5-50 loyalty)
```

## 6.3 Creature Level EXP

```
CreatureLevelEXP(battle_together) = monster_exp / 10
CreatureMaxLevel = 50
ExpRequired(lv → lv+1) = lv × 100
```

## 6.4 Stable Capacity

```
BaseStable = 10 slots
Max stable = 30 slots (unlock via housing/achievement)
```

---

# 7. Power Budget

**0% combat power.** Creature ability là utility (non-combat or conditional trigger that uses player's own stats). `is_power_creature = false` enforced in all creature_data rows. Server validates combat stat contribution = 0.

---

# 8. Economy Impact

| Tài nguyên | Source | Sink |
|---|---|---|
| Capture Orbs | Craft, shop (gold only) | Used per capture attempt |
| Creature Food | Craft, farm | Feed for quick loyalty |
| Gold | Gameplay | Craft orbs + food |
| Stable slot | Default 10 free | — (no sale) |

**Anti-inflation:**
- Orbs cost gold (economy sink)
- Failed capture: orb consumed anyway
- No selling creatures for gold

---

# 9. Anti Power Creep

- Hard rule: `is_power_creature = false` — CI fails if any true value found
- Creature ability review required before ship
- Loyalty ability list reviewed by balance team per creature

---

# 10. Progression Table

| Milestone | Creature Loyalty | Unlocked |
|---|---|---|
| Capture | — | Creature in stable |
| Loyalty 100 | Rank 1 | Reactions |
| Loyalty 300 | Rank 2 | 1 utility ability |
| Loyalty 700 | Rank 3 | Emotes |
| Loyalty 1500 | Rank 4 | Mini quest |
| Loyalty 3000 | Rank 5 | Signature ability + visual |

---

# 11. Reward Structure

| Mốc | Reward |
|---|---|
| First capture | Achievement + title "Tamer" |
| Rare creature captured | Achievement |
| Legendary creature | Title "Legend Tamer" |
| 10 creatures stable | "Collector" |
| Loyalty 5 any creature | "Soul Bonded" + unique aura |

---

# 12. RNG Design

```
Capture roll: XorShift64 < CaptureRate → success
Pity: after 10 failed attempts → guaranteed capture
Rare spawn (creature Dragon): 1% per field exploration tick (server-side)
```

---

# 13. Anti Bad Luck System

| Pity Type | Base | Hard Pity | Bonus |
|---|---|---|---|
| creature_common | 25-30% | 4 attempts | — |
| creature_rare | 10% | 10 attempts | +10%/fail |
| creature_epic | 3% | 30 attempts | +3%/fail |
| creature_legend | 1% | 100 attempts | +1%/fail |

---

# 14. Collection Integration

"Creature Compendium" — 84 creatures, track discovered/captured. Bestiary entry cho mỗi creature.

---

# 15. Achievement Integration

| Achievement | Condition |
|---|---|
| First Tamed | Capture creature đầu |
| Rarity Hunter | Capture 1 của mỗi rarity |
| Loyal Friend | Loyalty 5 bất kỳ creature |
| Full Stable | 30 creatures in stable |
| Element Complete | Capture all 6 elements |

---

# 16. Season Integration

Season "Creature Festival": 2-3 seasonal exclusive creatures (cosmetic only). Capture events với bonus orb drops.

---

# 17. PvE Integration

Active creature gives:
- Visual companion in dungeon
- "Find Item" ability useful in exploration
- Unique dialogue với NPCs khi có creature tương ứng

---

# 18. PvP Integration

Creature không tham gia PvP combat. Cosmetic appearance only in PvP arena waiting room.

---

# 19. Social Integration

- Player can "show off" creature in Guild Hall
- Creature races: weekly social event, no stat reward
- Trade: creatures KHÔNG trade được (soulbound)

---

# 20. Technical Architecture

## Class Diagram

```
CreatureDataSO : ScriptableObject
├── string id, name, monsterSourceId
├── string rarity, element
├── int biome
├── float captureRateBase
├── string[] loyaltyAbilities
├── bool isPowerCreature  (must be false)
├── string visualModel, lore

CreatureManager : MonoBehaviour
├── List<CreatureSave> _stable
├── CreatureSave _activeCreature
├── AttemptCapture(monsterUid, orbType) : bool
├── SetActive(creatureUid) : bool
├── Feed(creatureUid, foodId) : void
├── GetLoyaltyRank(creatureUid) : int
├── GetActiveAbilities(creatureUid) : List<string>
└── ValidatePowerContribution() : bool  (assert 0%)

CaptureOrbDataSO : ScriptableObject
├── string id, name
├── float captureMultiplier
└── string elementBonus

CreatureAI : MonoBehaviour
├── FollowPlayer()
├── IdleAnimation()
└── TriggerAbility(loyaltyRank)
```

---

# 21. Save Data Architecture

```json
"creatures": [
  {
    "uid": 200001,
    "creature_id": "creature_phoenix_03_1",
    "nickname": "Blaze",
    "level": 45,
    "exp": 12000,
    "loyalty": 2800,
    "slot_active": true,
    "acquired_at": "2026-01-10T14:22:00Z"
  }
]
```

---

# 22. Network Architecture

Capture: server validates monster HP, orb inventory, rolls RNG server-side.
Loyalty update: delta batched hourly.
Active creature: delta on change.

---

# 23. Security

| Threat | Prevention |
|---|---|
| Fake capture | Server validates monster HP < threshold |
| Orb duplication | Transaction: consume orb → attempt → result |
| Power creature exploit | Server validates is_power = false; creature stat = 0 |

---

# 24. LiveOps Hooks

```
event.capture_rate_bonus = 1.5   (Festival event)
event.orb_craft_discount = 0.5
flag.creature_seasonal_active = true
remote_config.stable_max_slots = 30
```

---

# 25. Content Pipeline

```
Google Sheet "Creature DB"
  → creature_db.csv (84 rows: ~4 per biome)
  → gen_creature_db.py
  → creature_db.json
  → CreatureDataSO[] (Editor import)
```

---

# 26. Future Expansion

- Creature Breeding (Year 2): 2 creatures → 1 new variant (cosmetic, no power)
- Creature Racing mini-game
- Creature Realm: housing feature cho stable

---

# 27. Production Risks

| Rủi ro | Mức |
|---|---|
| Creature ability accidentally gives combat power | CRITICAL |
| 84 creature AI expensive on mobile | HIGH |
| Capture farming bots | MEDIUM |

---

# 28. Mitigation Plan

| Rủi ro | Giải pháp |
|---|---|
| Power creature | Automated CI test: scan creature_db for is_power = true |
| AI cost | Creature AI chỉ active khi on screen; LOD system |
| Capture bots | Server rate-limit capture attempts; CAPTCHA on Legend capture |

---

# 29. Unity Implementation Plan

```
Assets/script/SlimeMMO/Creature/
├── CreatureDataSO.cs
├── CaptureOrbDataSO.cs
├── CreatureLoyaltyConfigSO.cs
├── CreatureManager.cs
├── CreatureAI.cs
└── SlimeMMO.Creature.asmdef

generators/
└── gen_creature_db.py
```

---

# 30. Final Verdict

**Status: PARTIAL → BLOCKER (P1)**

Không có combat power contribution — nhưng thiếu này làm mất một hệ thống engagement quan trọng. Implement sau các BLOCKER stat systems (Relic, Artifact, Trait, Rune, Mastery).
