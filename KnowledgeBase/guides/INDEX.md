# SYSTEMS INDEX — Slime MMORPG Production Bible
> Cập nhật: 2026-06-13 | 17 systems + 30 sections mỗi system

---

## LEGEND

| Icon | Ý nghĩa |
|---|---|
| 🔴 BLOCKER | Chặn production — phải làm trước launch |
| 🟡 PARTIAL | Có thiết kế, thiếu implementation |
| 🟢 READY | Design + implementation đầy đủ |
| ⚪ MISSING | Thiết kế xong, chưa implement |

---

## BLOCKER SYSTEMS (Priority: CRITICAL)

| # | File | System | Status | Power Budget | Sprint |
|---|---|---|---|---|---|
| 00 | [00_SAVE_DATA_SYSTEM.md](00_SAVE_DATA_SYSTEM.md) | PlayerSaveData + SaveManager + PityManager | 🔴 BLOCKER | 0% | Sprint 1 |
| 01 | [01_POWER_BUDGET.md](01_POWER_BUDGET.md) | Power Budget (fix 112% → 100%) | 🔴 BLOCKER | 100% total | Sprint 1 |
| 09 | [09_ELEMENT_CHART.md](09_ELEMENT_CHART.md) | Element Chart & Resistance | 🔴 BLOCKER | Inside formula | Sprint 1 |
| 02 | [02_RELIC_SYSTEM.md](02_RELIC_SYSTEM.md) | Relic System | 🔴 BLOCKER | 5% | Sprint 2 |
| 03 | [03_ARTIFACT_SYSTEM.md](03_ARTIFACT_SYSTEM.md) | Artifact System | 🔴 BLOCKER | 5% | Sprint 2 |
| 04 | [04_TRAIT_SYSTEM.md](04_TRAIT_SYSTEM.md) | Trait System | 🔴 BLOCKER | 3% | Sprint 2 |
| 05 | [05_RUNE_SYSTEM.md](05_RUNE_SYSTEM.md) | Rune System | 🔴 BLOCKER | 3% | Sprint 2 |
| 06 | [06_MASTERY_SYSTEM.md](06_MASTERY_SYSTEM.md) | Mastery System | 🔴 BLOCKER | 3% | Sprint 2 |
| 11 | [11_PITY_FAILSTACK.md](11_PITY_FAILSTACK.md) | Pity & Fail Stack Architecture | 🔴 BLOCKER | 0% | Sprint 1 |

---

## PARTIAL / MISSING SYSTEMS (Priority: HIGH)

| # | File | System | Status | Power Budget | Sprint |
|---|---|---|---|---|---|
| 07 | [07_CREATURE_SYSTEM.md](07_CREATURE_SYSTEM.md) | Creature Capture | 🟡 PARTIAL | 0% (utility) | Sprint 3 |
| 08 | [08_PET_EQUIPMENT.md](08_PET_EQUIPMENT.md) | Pet Equipment Sub-system | 🟡 PARTIAL | In Pet 4% | Sprint 3 |
| 10 | [10_LOOT_ALGORITHM.md](10_LOOT_ALGORITHM.md) | Loot Algorithm | 🟡 PARTIAL | 0% | Sprint 2 |
| 12 | [12_HOUSING_SYSTEM.md](12_HOUSING_SYSTEM.md) | Housing System | ⚪ MISSING | 0% | Sprint 4 |
| 13 | [13_NPC_ARCHITECTURE.md](13_NPC_ARCHITECTURE.md) | NPC Architecture | ⚪ MISSING | 0% | Sprint 3 |
| 14 | [14_DUNGEON_ARCHITECTURE.md](14_DUNGEON_ARCHITECTURE.md) | Dungeon Architecture | ⚪ MISSING | 0% | Sprint 3 |
| 15 | [15_DAMAGE_TYPE_ARCHITECTURE.md](15_DAMAGE_TYPE_ARCHITECTURE.md) | Damage Type Architecture | ⚪ MISSING | 0% | Sprint 2 |
| 16 | [16_MONSTER_FAMILY_ARCHITECTURE.md](16_MONSTER_FAMILY_ARCHITECTURE.md) | Monster Family Architecture | ⚪ MISSING | 0% | Sprint 3 |

---

## SPRINT ROADMAP

### Sprint 1 — Infrastructure (2 tuần)
> Không được build feature nào trước khi Sprint 1 xong

- [ ] `PlayerSaveData.cs` + tất cả sub-classes
- [ ] `SaveManager.cs` (delta + snapshot)
- [ ] `PityManager.cs` + `PityConfigSO.cs`
- [ ] `AntiCheat.cs` (SHA-256 checksum)
- [ ] `MigrationManager.cs` (V1)
- [ ] `ElementChartSO.cs` + `BiomeElementWeaknessSO.cs`
- [ ] Fix `DamageCalculator.cs`: ElementMult 1.0 → real lookup
- [ ] Update `power_budget.json` từ 112% → 100%
- [ ] `PowerBudgetManager.AssertBudgetSumsTo100()` passes

**Gate:** Không vào Sprint 2 nếu Sprint 1 chưa pass CI.

---

### Sprint 2 — New Systems (3 tuần)

- [ ] Relic: SO + Manager + gen_relic_db.py + DataImporter
- [ ] Artifact: SO + Manager + Fragment system + gen_artifact_db.py
- [ ] Trait: SO + Manager + UnlockChecker + gen_trait_db.py
- [ ] Rune: SO + Manager + CraftManager + gen_rune_db.py
- [ ] Mastery: SO + Manager + EventBus
- [ ] DamageTypeConfigSO + StatusEffectManager
- [ ] LootManager formalized + DropWeightTableSO
- [ ] gen_drop_tables.py

**Gate:** PowerBudget.AssertBudgetSumsTo100() phải pass sau Sprint 2.

---

### Sprint 3 — Content & Gameplay (3 tuần)

- [ ] Creature Capture: SO + Manager + AI + gen_creature_db.py
- [ ] Pet Equipment: SO + Manager update + gen_pet_equipment_db.py
- [ ] NPC Architecture: SO + Dialog + Shop + gen_npc_db.py
- [ ] Dungeon Architecture: SO + Rooms + Instance + gen_dungeon_db.py
- [ ] Monster Family: SO + Bestiary + gen_monster_family.py
- [ ] Update monster_db.json với family_id

**Gate:** Alpha playtest với biomes 1-3.

---

### Sprint 4 — Polish & Social (2 tuần)

- [ ] Housing System: Plot + Furniture + Passive
- [ ] Guild Hall (simplified)
- [ ] Territory War integration (Manager đã có)
- [ ] Season/Battle Pass UI nối Manager
- [ ] Mentor/Party UI nối Manager

**Gate:** Beta test với toàn bộ feature.

---

## POWER BUDGET SUMMARY (V2 — 100%)

| System | Budget | Status |
|---|---|---|
| Equipment Base | 25% | 🟢 Ready |
| Skill Multiplier | 15% | 🟢 Ready |
| Ascension | 15% | 🟢 Ready |
| Enhancement | 10% | 🟢 Ready |
| Set Bonus | 4% | 🟡 JSON ready, importer needed |
| Relic | 5% | 🔴 Missing |
| Artifact | 5% | 🔴 Missing |
| Trait + Rune | 6% | 🔴 Missing |
| Mastery | 3% | 🔴 Missing |
| Pet | 4% | 🟡 Partial |
| Mount | 1% | ⚪ Lore only |
| Wing | 2% | ⚪ Lore only |
| Soul Bond | 4% | ⚪ Missing |
| Reputation Combat | 1% | 🟢 Ready (4×0.25%) |
| Creature | 0% | ⚪ Utility only |
| **TOTAL** | **100%** | Fix từ 112% |

---

## FILE CHECKLIST

### C# Scripts cần viết (Sprint 1-2)

| File | Assembly | Status |
|---|---|---|
| PlayerSaveData.cs | SlimeMMO.Save | ❌ |
| SaveManager.cs | SlimeMMO.Save | ❌ |
| PityManager.cs | SlimeMMO.Save | ❌ |
| PityConfigSO.cs | SlimeMMO.Save | ❌ |
| AntiCheat.cs | SlimeMMO.Save | ❌ |
| MigrationManager.cs | SlimeMMO.Save | ❌ |
| ElementChartSO.cs | SlimeMMO.Core | ❌ |
| BiomeElementWeaknessSO.cs | SlimeMMO.Core | ❌ |
| RelicDataSO.cs | SlimeMMO.Relic | ❌ |
| RelicManager.cs | SlimeMMO.Relic | ❌ |
| ArtifactDataSO.cs | SlimeMMO.Artifact | ❌ |
| ArtifactManager.cs | SlimeMMO.Artifact | ❌ |
| TraitDataSO.cs | SlimeMMO.Trait | ❌ |
| TraitManager.cs | SlimeMMO.Trait | ❌ |
| RuneDataSO.cs | SlimeMMO.Rune | ❌ |
| RuneManager.cs | SlimeMMO.Rune | ❌ |
| MasteryConfigSO.cs | SlimeMMO.Mastery | ❌ |
| MasteryManager.cs | SlimeMMO.Mastery | ❌ |
| DamageTypeConfigSO.cs | SlimeMMO.Combat | ❌ |
| StatusEffectManager.cs | SlimeMMO.Combat | ❌ |

### Python Generators cần viết

| File | Output | Status |
|---|---|---|
| gen_relic_db.py | relic_db.json (120) | ❌ |
| gen_artifact_db.py | artifact_db.json (45) | ❌ |
| gen_trait_db.py | trait_db.json (60) | ❌ |
| gen_rune_db.py | rune_db.json (150) | ❌ |
| gen_creature_db.py | creature_db.json (84) | ❌ |
| gen_pet_equipment_db.py | pet_equipment_db.json (90) | ❌ |
| gen_element_chart.py | element_chart.json | ❌ |
| gen_drop_tables.py | drop_tables.json | ❌ |
| gen_npc_db.py | npc_db.json | ❌ |
| gen_dungeon_db.py | dungeon_db.json (147) | ❌ |
| gen_furniture_db.py | furniture_db.json (200+) | ❌ |
| gen_monster_family.py | monster_family.json (6) | ❌ |
| gen_pity_config.py | pity_config.json (16) | ❌ |
| gen_power_budget.py | power_budget.json | ❌ |
| gen_damage_types.py | damage_type_config.json | ❌ |

---

## INVARIANTS (KHÔNG ĐƯỢC VI PHẠM)

```
1. ∑ PowerBudget = 100% ± 0.01%
2. Không system nào > 35% budget
3. Mọi stat là ADDITIVE (không multiplicative)
4. SkillMult: Ultimate ≤ ×3.0, Normal ≤ ×1.5
5. CritDmg bonus ≤ +100%
6. ElementMult ∈ [0.7, 1.4]
7. BossContext ≤ ×1.3
8. PvP = ×0.5 áp dụng sau mọi calculation
9. is_power = false trong mọi premium currency shop item
10. Pity state server-side only — client không trust
```

---

## CONTACTS (Designer Ownership)

| System | Owner Team |
|---|---|
| Power Budget | balance_team |
| Save Data | backend_team |
| Element Chart | combat_team |
| Relic/Artifact | content_team |
| Trait/Rune | skill_team |
| Mastery | skill_team |
| Dungeon | level_design_team |
| NPC/Housing | social_team |
| Pity/Loot | economy_team |
