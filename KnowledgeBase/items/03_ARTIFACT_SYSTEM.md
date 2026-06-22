# SYSTEM 03 — Artifact System
> Status: BLOCKER → thiếu hoàn toàn
> Power Budget: 5% | Ngày: 2026-06-13

---

# 1. Purpose

Artifact là **1 vật phẩm quyền năng nhất** của player — chỉ 1 slot, 5 rank, 5 awakening level. Cung cấp passive effect mạnh và cho phép player express "build identity". Thiết kế để farming lâu dài nhưng không P2W.

---

# 2. Design Philosophy

- **1 slot duy nhất** — lựa chọn quan trọng nhất của player
- **5 Rank × 5 Awaken** = 25 tổ hợp tiến trình
- **Passive unique effect** per artifact — không chỉ stat khô
- **Stat đóng góp = 5%** — nhưng passive effect không tính vào budget (utility)

---

# 3. Core Loop

```
[Raid Boss / World Boss kill]
        │
        ▼
[Artifact Fragment drop (pity 50 kills)]
        │
        ▼
[Collect 30 fragments → Craft Artifact]
        │
        ▼
[Equip Artifact → passive activates]
        │
        ▼
[Feed fragments → Rank EXP → Rank Up]
        │
        ▼
[Awaken (5 levels, requires rare material)]
        │
        ▼
[Awakening unlocks bonus passive]
```

---

# 4. Progression Loop

| Stage | Rank | Awaken | Stat | Passive Effect |
|---|---|---|---|---|
| New | 1 | 0 | 1.0% | Basic passive active |
| Growing | 2 | 0-2 | 2.0% | +1 passive modifier |
| Strong | 3 | 2-4 | 3.0% | Passive upgraded |
| Elite | 4 | 4-5 | 4.0% | +2nd passive modifier |
| BiS | 5 | 5 | 5.0% | Full passive + cosmetic effect |

---

# 5. Data Architecture

## 5.1 Entity

```
ArtifactInstance
├── artifact_id: string      (ref ArtifactDataSO)
├── rank: 1-5
├── rank_exp: int
├── awaken_lv: 0-5
├── awaken_exp: int
└── acquired_at: datetime

ArtifactDataSO
├── id: string               ("art_titan_02")
├── name: string             ("Titan's Heart")
├── category: string         ("ATK","DEF","HP","Hybrid","Utility")
├── element: string          ("Fire","Water",...)
├── rarity: string           ("Epic","Legendary")
├── biome_source: int        (primary drop biome)
├── stat_type: string        ("atk_pct")
├── base_pct_rank1: float    (0.01)
├── pct_per_rank: float      (0.01)
├── passive_name: string     ("Titan's Wrath")
├── passive_desc: string     ("Khi HP < 30%, ATK +15% trong 8s, CD 60s")
├── awaken_bonus: string[]   (5 strings — bonus mở theo awaken_lv)
├── fragment_id: string      ("frag_titan_02")
├── fragments_to_craft: int  (30)
├── lore: string
└── visual_idle: string
```

## 5.2 Database Tables

```sql
CREATE TABLE artifact_data (
    id                  VARCHAR(32) PRIMARY KEY,
    name                VARCHAR(64) NOT NULL,
    category            VARCHAR(16) NOT NULL,
    element             VARCHAR(16) NOT NULL,
    rarity              VARCHAR(16) NOT NULL,
    biome_source        TINYINT NOT NULL,
    stat_type           VARCHAR(32) NOT NULL,
    base_pct_rank1      FLOAT NOT NULL,
    pct_per_rank        FLOAT NOT NULL,
    passive_name        VARCHAR(64) NOT NULL,
    passive_desc        TEXT NOT NULL,
    awaken_bonus_json   TEXT NOT NULL,     -- JSON array 5 strings
    fragment_id         VARCHAR(32) NOT NULL,
    fragments_to_craft  TINYINT NOT NULL DEFAULT 30,
    lore                TEXT,
    visual_idle         VARCHAR(64)
);

CREATE TABLE artifact_rank_config (
    rank                TINYINT PRIMARY KEY,
    rank_exp_required   INT NOT NULL,
    stat_bonus_pct      FLOAT NOT NULL,
    title_unlock        VARCHAR(64)
);

CREATE TABLE artifact_awaken_config (
    awaken_lv           TINYINT PRIMARY KEY,
    awaken_exp_required INT NOT NULL,
    material_id         VARCHAR(32) NOT NULL,
    material_qty        TINYINT NOT NULL,
    gold_cost           BIGINT NOT NULL
);

CREATE TABLE player_artifact (
    player_id           BIGINT PRIMARY KEY,
    artifact_id         VARCHAR(32) REFERENCES artifact_data(id),
    rank                TINYINT NOT NULL DEFAULT 1,
    rank_exp            INT NOT NULL DEFAULT 0,
    awaken_lv           TINYINT NOT NULL DEFAULT 0,
    awaken_exp          INT NOT NULL DEFAULT 0,
    acquired_at         DATETIME NOT NULL
);

CREATE TABLE player_artifact_fragments (
    player_id           BIGINT NOT NULL,
    fragment_id         VARCHAR(32) NOT NULL,
    quantity            INT NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, fragment_id)
);
```

## 5.3 ID Rules

Format: `art_{category_prefix}_{biome:02d}_{variant:02d}`
- `art_atk_03_01` — ATK artifact, biome 3, variant 1
- `art_def_12_02` — DEF artifact, biome 12, variant 2
- `art_hyb_21_01` — Hybrid artifact, Void Realm

Fragments: `frag_{artifact_id}` → `frag_atk_03_01`

## 5.4 CSV Schema

`artifact_db.csv`:
```
id,name,category,element,rarity,biome_source,stat_type,base_pct_rank1,pct_per_rank,passive_name,passive_desc,fragment_id,fragments_to_craft,lore
art_atk_03_01,Titan's Heart,ATK,Fire,Legendary,3,atk_pct,0.01,0.01,Titan's Wrath,"HP<30%→ATK+15% 8s CD60s",frag_atk_03_01,30,Trái tim của Titan đã ngủ ngàn năm
art_def_04_01,Frozen Shield,DEF,Water,Epic,4,def_pct,0.01,0.01,Frost Ward,"Khi bị hit: 20% chance block+10% dmg 5s",frag_def_04_01,30,Lá chắn băng từ Frozen Tundra
art_hp_09_01,Swamp Heart,HP,Dark,Epic,9,hp_pct,0.01,0.01,Life Drain,"Hit: drain 2% của dealt dmg về HP",frag_hp_09_01,30,Trái tim đầm lầy không bao giờ ngừng đập
art_hyb_21_01,Void Crown,Hybrid,Void,Legendary,21,all_stats,0.006,0.006,Void Resonance,"Crit hit: reset 1 random skill CD (CD30s)",frag_hyb_21_01,50,Vương miện từ Void Realm — ngoài mọi phân loại
```

## 5.5 JSON Schema

```json
{
  "name": "artifact_db",
  "count": 45,
  "rows": [
    {
      "id": "art_atk_03_01",
      "name": "Titan's Heart",
      "category": "ATK",
      "element": "Fire",
      "rarity": "Legendary",
      "biome_source": 3,
      "stat_type": "atk_pct",
      "base_pct_rank1": 0.01,
      "pct_per_rank": 0.01,
      "max_rank": 5,
      "max_awaken": 5,
      "passive_name": "Titan's Wrath",
      "passive_desc": "Khi HP < 30%, ATK +15% trong 8 giây, CD 60 giây.",
      "awaken_bonus": [
        "Passive CD giảm 10s",
        "ATK bonus tăng lên +18%",
        "HP threshold tăng lên 35%",
        "CD giảm thêm 5s",
        "Artifact phát hào quang lửa"
      ],
      "fragment_id": "frag_atk_03_01",
      "fragments_to_craft": 30,
      "lore": "Trái tim của Titan đã ngủ ngàn năm trong lòng Volcanic Ridge.",
      "visual_idle": "vfx_art_titan_idle"
    }
  ]
}
```

---

# 6. Formula Architecture

## 6.1 Stat Contribution

```
ArtifactStatPct(rank) = base_pct_rank1 + (rank - 1) × pct_per_rank
  Rank 1: 0.01 = 1%
  Rank 2: 0.02 = 2%
  Rank 3: 0.03 = 3%
  Rank 4: 0.04 = 4%
  Rank 5: 0.05 = 5%
  → Hard cap 5% ✅
  → Hybrid type dùng all_stats: base 0.006, per_rank 0.006 → max 3% (budget trong 5%)
```

## 6.2 Rank EXP

```
RankExpRequired(rank → rank+1) = 1000 × rank²
  Rank 1→2: 1,000
  Rank 2→3: 4,000
  Rank 3→4: 9,000
  Rank 4→5: 16,000
  Total: 30,000 EXP

EXP per fragment sacrifice: 50 EXP
  → Need 600 fragments total (not counting 30 for craft) for Rank 5
```

## 6.3 Awaken Cost

| Awaken | EXP | Material | Qty | Gold |
|---|---|---|---|---|
| 0→1 | 500 | biome_essence | 5 | 200,000 |
| 1→2 | 1,500 | biome_essence | 10 | 500,000 |
| 2→3 | 4,000 | artifact_core | 3 | 1,200,000 |
| 3→4 | 10,000 | artifact_core | 5 | 3,000,000 |
| 4→5 | 25,000 | void_crystal | 1 | 8,000,000 |

## 6.4 Passive Trigger Formula

```
PassiveProcRate = base_rate (per artifact, e.g. 20%)
PassiveCooldown = base_cd (e.g. 60s) - awaken_bonus_cd_reduction
PassiveDuration = base_dur (e.g. 8s) + awaken_duration_bonus

Titan's Wrath:
  Trigger: HP < 30%
  ATK bonus: 15% + awaken × 1% (Awaken 1→+1% → 16%, etc.)
  CD: 60s - 10s (Awaken1) - 5s (Awaken4) = 45s at max
```

## 6.5 Fragment Drop Rate

```
FragmentDropRate(content) =
  Raid Boss:   1-3 frags per kill (avg 2)
  World Boss:  3-5 frags per kill (avg 4)
  Pity:        guaranteed 2 frags at 20 raid kills without frag
  Event:       sell in event shop for event tokens
```

---

# 7. Power Budget

**Allocated: 5.0%**
- Rank 5 stat contribution = 5%
- Passive effects không tính vào budget (conditional, utility)
- `PowerBudgetManager.ValidateSystemMax(artifactPct, "artifact", 0.05f)`

---

# 8. Economy Impact

| Tài nguyên | Source | Sink |
|---|---|---|
| Artifact Fragment | Raid boss, World boss | Craft (30) + Rank EXP (600+) |
| Biome Essence | Biome farming | Awaken 0→3 |
| Artifact Core | Raid boss drop | Awaken 3→5 |
| Void Crystal | Void Realm only | Awaken max |
| Gold | Gameplay | Awaken gold cost |

**Anti-inflation:**
- Fragments bind-on-pickup — không trade
- 1 artifact slot → phải chọn 1, excess fragments bị sacrifice
- Awaken materials có supply cap (dungeon daily limit)

---

# 9. Anti Power Creep

- Stat scale cố định: rank 1=1%, rank 5=5%
- Passive effects có cooldown → không spam
- Passive bonus là conditional (HP <30%, crit hit) → không luôn active
- Server validates: ArtifactPct ≤ 5%

---

# 10. Progression Table

| Rank | Awaken | Total Stat | Notable Unlock |
|---|---|---|---|
| 1 | 0 | 1% | Passive basic |
| 2 | 1 | 2% | Passive modifier 1 |
| 3 | 2 | 3% | Passive upgraded |
| 3 | 3 | 3% | 2nd passive threshold |
| 4 | 4 | 4% | Passive modifier 2 |
| 5 | 5 | 5% | Full passive + visual |

**Time estimate to Rank 5 Awaken 5:**
- Raid 3x/day × 365 days = 1095 raids
- ~2000 fragments → Rank 5 + Awaken 5 ~6 months consistent play

---

# 11. Reward Structure

| Mốc | Reward |
|---|---|
| First Artifact crafted | Achievement + title "Artifact Holder" |
| Rank 3 | Artifact glow effect |
| Rank 5 | Title "Artifact Master" + full visual |
| Awaken 5 | Unique particle effect |
| Max artifact (all families collected) | "Artifact Lore Keeper" achievement |

---

# 12. RNG Design

```
FragmentDrop = uniform RNG (1-3 for Raid, 3-5 for World Boss)
No additional RNG for type — fragments are type-specific to boss
Passive proc = uniform RNG if procRate-based, or deterministic if threshold-based
```

---

# 13. Anti Bad Luck System

| Pity | Base | Hard Pity | Bonus |
|---|---|---|---|
| Fragment drop | 100% (guaranteed qty) | N/A | N/A |
| Awaken material (boss) | 10% | 10 kills | +10%/kill |
| Void Crystal (Void Realm) | 5% | 20 clears | +5%/clear |

---

# 14. Collection Integration

"Artifact Bestiary" trong Collection Hall — 45 artifacts, track discovered/rank achieved.

---

# 15. Achievement Integration

| Achievement | Condition |
|---|---|
| Artifact Awakened | Awaken lv 1 |
| Dual Nature | Awaken Hybrid artifact |
| Void Chosen | Obtain Void Crown |
| Perfect Artifact | Rank 5 Awaken 5 |

---

# 16. Season Integration

Season shop: artifact fragments × 50 cho 200 event tokens (1 per season, no P2W shortcut beyond reasonable farming).

---

# 17. PvE Integration

| Content | Fragment | Awaken Mat |
|---|---|---|
| Raid Boss | ✅ 1-3 | ✅ 10% |
| World Boss | ✅ 3-5 | ✅ 20% |
| Tower Floor 50+ | ✅ 1 | — |
| Season Boss | ✅ 2 | — |

---

# 18. PvP Integration

Artifact stat (5%) áp dụng. Passive effects áp dụng theo cooldown. PvP damage cap × 0.5 áp dụng sau khi artifact bonus tính.

---

# 19. Social Integration

Guild Raid: guild boss drop artifact fragments cho toàn guild (1 per member, shared pool). Guild cần coordinate để tất cả thành viên nhận fragment.

---

# 20. Technical Architecture

## Class Diagram

```
ArtifactDataSO : ScriptableObject
├── string id, name, category, element, rarity
├── int biomeSouce
├── string statType
├── float basePctRank1, pctPerRank
├── string passiveName, passiveDesc
├── string[] awakenBonus (5 entries)
├── string fragmentId
├── int fragmentsToCraft
├── string lore, visualIdle

ArtifactRankConfigSO : ScriptableObject
└── RankEntry[] ranks

ArtifactAwakenConfigSO : ScriptableObject
└── AwakenEntry[] levels

ArtifactManager : MonoBehaviour
├── ArtifactSave _save
├── CraftArtifact(artifactId) : bool
├── EquipArtifact(artifactId) : bool
├── RankUp() : bool
├── Awaken() : bool
├── GetStatPct() : float
├── GetPassiveState() : PassiveState
└── ValidateBudget() : bool

ArtifactPassiveSystem : MonoBehaviour
├── Subscribe(ArtifactManager)
├── OnHPChanged(float hp, float maxHp)
├── OnCriticalHit()
├── TriggerPassive()
└── PassiveCooldownTimer
```

---

# 21. Save Data Architecture

```json
"artifact": {
  "artifact_id": "art_atk_03_01",
  "rank": 4,
  "rank_exp": 12500,
  "awaken_lv": 3,
  "awaken_exp": 8000,
  "acquired_at": "2026-01-15T10:00:00Z"
}
```

Dirty field: `"artifact"` (object replaced on any change)

---

# 22. Network Architecture

Craft/RankUp/Awaken: POST /api/v1/artifact/{action}
Server validates: fragments consumed, materials consumed, gold deducted — atomic transaction.

---

# 23. Security

| Threat | Prevention |
|---|---|
| Fake rank/awaken | Server recalcs từ exp values |
| Phantom fragments | Fragment count in DB, server validates before craft |
| Passive exploit | Passive triggers validated server-side in PvP |

---

# 24. LiveOps Hooks

```
event.artifact_fragment_multiplier = 1.5  (seasonal)
event.awaken_cost_discount = 0.7           (anniversary)
flag.artifact_new_type_available = false
remote_config.max_artifact_rank = 5
```

---

# 25. Content Pipeline

```
Google Sheet "Artifact DB"
  → artifact_db.csv (45 rows: 21 biomes × 2 variants + 3 Void)
  → gen_artifact_db.py
  → artifact_db.json
  → ArtifactDataSO[] (Editor import)

Google Sheet "Artifact Config"
  → artifact_rank_config.csv
  → artifact_awaken_config.csv
  → ArtifactRankConfigSO, ArtifactAwakenConfigSO
```

---

# 26. Future Expansion

- Rank 6 (Year 2): +1% more budget lấy từ Mastery reduction
- "Artifact Fusion": 2 artifacts → 1 stronger (same total stat, different passive)
- New artifact families khi thêm biome mới

---

# 27. Production Risks

| Rủi ro | Mức |
|---|---|
| Passive effects gây exploit trong PvP | HIGH |
| Fragment farming quá chậm → player bỏ game | HIGH |
| 45 passive effects khó balance | MEDIUM |

---

# 28. Mitigation Plan

| Rủi ro | Giải pháp |
|---|---|
| Passive exploit PvP | Passive triggers server-validated; PvP passive list whitelisted |
| Farming quá chậm | Pity 20 raids = guaranteed; event shop shortcut |
| 45 passives balance | Group passives vào 5 categories, balance per category |

---

# 29. Unity Implementation Plan

```
Assets/script/SlimeMMO/Artifact/
├── ArtifactDataSO.cs
├── ArtifactRankConfigSO.cs
├── ArtifactAwakenConfigSO.cs
├── ArtifactManager.cs
├── ArtifactPassiveSystem.cs
└── SlimeMMO.Artifact.asmdef

generators/
└── gen_artifact_db.py
```

---

# 30. Final Verdict

**Status: BLOCKER**

5% power budget thiếu hoàn toàn. Hệ thống passive artifact là core "build identity" — cần trước closed beta. Implementation sau Save Data và Power Budget fix.
