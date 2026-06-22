# Source Manifest

Mỗi mục dưới đây tương ứng 1 file trong `KnowledgeBase/`. Cột "Nguồn gốc" là đường dẫn tuyệt đối gốc trước khi copy.

Quy ước **Runtime**: YES = xác nhận có code `.cs` gọi `Resources.Load`/đọc trực tiếp file này lúc chạy game; NO = chỉ là tài liệu thiết kế, không có code load; N/A = không áp dụng (text thuần/ảnh).

---

## items/

| File trong KB | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| equipment_db.json | Assets/Resources/GameData/equipment_db.json | JSON | YES | Resources.Load<TextAsset> | YES |
| item_db.json | Assets/Resources/GameData/item_db.json | JSON | YES | Resources.Load<TextAsset> | YES |
| affix_db.json | Assets/StreamingAssets/Data/affix_db.json | JSON | YES | File.ReadAllText (StreamingAssets) | YES |
| artifact_db.json | Assets/StreamingAssets/Data/artifact_db.json | JSON | YES | StreamingAssets | YES |
| relic_db.json | Assets/StreamingAssets/Data/relic_db.json | JSON | YES | StreamingAssets | YES |
| rune_db.json | Assets/StreamingAssets/Data/rune_db.json | JSON | YES | StreamingAssets | YES |
| gem_db.json | Assets/StreamingAssets/Data/gem_db.json | JSON | YES | StreamingAssets | YES |
| trait_db.json | Assets/StreamingAssets/Data/trait_db.json | JSON | YES | StreamingAssets | YES |
| pet_equipment_db.json | Assets/StreamingAssets/Data/pet_equipment_db.json | JSON | YES | StreamingAssets | YES |
| set_bonus_db.json | Assets/Resources/GameData/set_bonus_db.json | JSON | YES | Resources.Load | YES |
| furniture_db.json | Assets/StreamingAssets/Data/furniture_db.json | JSON | YES | StreamingAssets | YES (housing) |
| trangbi-reference.txt | Assets/script/Item/TypesOfEquipment/trangbi-reference.txt | TXT | NO | tài liệu tham chiếu thủ công | YES (giải thích độ hiếm/luân hồi) |
| MOUNT_SYSTEM.md | MMORPG Bible/_design/MOUNT_SYSTEM.md | MD | NO | design doc | YES |
| SOULBOND_SYSTEM.md | MMORPG Bible/_design/SOULBOND_SYSTEM.md | MD | NO | design doc | YES |
| WING_SYSTEM.md | MMORPG Bible/_design/WING_SYSTEM.md | MD | NO | design doc | YES |
| 02_RELIC_SYSTEM.md | MMORPG Bible/_design/systems/02_RELIC_SYSTEM.md | MD | NO | design doc | YES |
| 03_ARTIFACT_SYSTEM.md | MMORPG Bible/_design/systems/03_ARTIFACT_SYSTEM.md | MD | NO | design doc | YES |
| 04_TRAIT_SYSTEM.md | MMORPG Bible/_design/systems/04_TRAIT_SYSTEM.md | MD | NO | design doc | YES |
| 05_RUNE_SYSTEM.md | MMORPG Bible/_design/systems/05_RUNE_SYSTEM.md | MD | NO | design doc | YES |
| 08_PET_EQUIPMENT.md | MMORPG Bible/_design/systems/08_PET_EQUIPMENT.md | MD | NO | design doc | YES |
| quest-item-charts/*.png (21 file) | nhiem vu/vatphamnhiemvu/*.png | PNG | N/A | ảnh bảng vật phẩm theo vùng | **CẦN OCR** trước khi dùng — chưa phải text |

## monsters/

| File | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| monster_db.json | Assets/Resources/GameData/monster_db.json | JSON | YES | Resources.Load | YES (294 monster) |
| boss_db.json | Assets/Resources/GameData/boss_db.json | JSON | YES | Resources.Load | YES (59 boss) |
| boss_mechanics_db.json | Assets/Resources/GameData/boss_mechanics_db.json | JSON | YES | Resources.Load | YES |
| creature_db.json | Assets/StreamingAssets/Data/creature_db.json | JSON | YES | StreamingAssets | YES (pet/creature) |
| monster_family.json | Assets/StreamingAssets/Data/monster_family.json | JSON | YES | StreamingAssets | YES |
| PET_BEHAVIOR_ARCHITECTURE.md | MMORPG Bible/_design/PET_BEHAVIOR_ARCHITECTURE.md | MD | NO | design doc | YES |
| 07_CREATURE_SYSTEM.md | MMORPG Bible/_design/systems/07_CREATURE_SYSTEM.md | MD | NO | design doc | YES |
| 16_MONSTER_FAMILY_ARCHITECTURE.md | MMORPG Bible/_design/systems/16_MONSTER_FAMILY_ARCHITECTURE.md | MD | NO | design doc | YES |

## quests/

| File | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| quest_db.json | Assets/Resources/GameData/quest_db.json | JSON | YES | Resources.Load | YES (334 quest, có prereq/reward) |
| QUEST_PIPELINE_ARCHITECTURE.md | MMORPG Bible/_design/QUEST_PIPELINE_ARCHITECTURE.md | MD | NO | design doc | YES |

## npc/

| File | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| npc_db.json | Assets/StreamingAssets/Data/npc_db.json | JSON | YES | StreamingAssets | YES (49 NPC: vendor/quest-giver, shop_id, dialog_root) |
| 13_NPC_ARCHITECTURE.md | MMORPG Bible/_design/systems/13_NPC_ARCHITECTURE.md | MD | NO | design doc | YES |

## maps/

| File | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| dungeon_db.json | Assets/StreamingAssets/Data/dungeon_db.json | JSON | YES | StreamingAssets | YES (127 dungeon) |
| territory_zones.json | Assets/Resources/GameData/territory_zones.json | JSON | YES | Resources.Load | YES (PvP zone) |
| MainGameMapConfig.asset | Assets/MainGameMapConfig.asset | YAML/asset | YES | ScriptableObject load tại GameInit | YES (chunk 200×120, 1050 chunk) |
| WorldRegionConfig.asset | Assets/WorldRegionConfig.asset | YAML/asset | YES | ScriptableObject | YES (region 0 = Tutorial Plains, spawn point) |
| RegionTownRegistry.asset | Assets/RegionTownRegistry.asset | YAML/asset | YES | ScriptableObject | YES |
| RespawnConfig.asset | Assets/RespawnConfig.asset | YAML/asset | YES | ScriptableObject | YES (respawn delay 1.5s, fade 0.5s, hồi 100% HP/Mana) |
| WorldRegionDatabase.asset | Assets/_Project/World/ScriptableObjects/WorldRegionDatabase.asset | YAML/asset | YES | ScriptableObject (đăng ký GUID toàn bộ 21 region) | YES |
| BiomeTemplate.asset | Assets/_Project/World/ScriptableObjects/BiomeTemplate.asset | YAML/asset | YES | ScriptableObject | YES |
| ChunkRegistry.asset | Assets/_Project/World/ScriptableObjects/ChunkRegistry.asset | YAML/asset | YES | ScriptableObject | YES |
| RegionChunkConfig.asset | Assets/_Project/World/ScriptableObjects/RegionChunkConfig.asset | YAML/asset | YES | ScriptableObject | YES |
| TownChunkProfile.asset | Assets/_Project/World/ScriptableObjects/TownChunkProfile.asset | YAML/asset | YES | ScriptableObject | YES |
| SeasonalTileDatabase.asset | Assets/_Project/World/ScriptableObjects/SeasonalTileDatabase.asset | YAML/asset | UNKNOWN | ScriptableObject | YES |
| regions/RegionGridConfig_R00*.asset (21 file) | Assets/RegionGridConfig_R00*.asset | YAML/asset | YES | ScriptableObject, mỗi file = 1 vùng (regionId/regionName/biomeId/level requirement/spawn point/thời tiết/mùa mặc định) | YES — quan trọng nhất để trả lời "map X yêu cầu level mấy" |
| WORLD_MAP_SYSTEM.md | MMORPG Bible/_design/WORLD_MAP_SYSTEM.md | MD | NO | design doc | YES |
| 14_DUNGEON_ARCHITECTURE.md | MMORPG Bible/_design/systems/14_DUNGEON_ARCHITECTURE.md | MD | NO | design doc | YES |

> Ghi chú: bản `WorldRegionConfig.asset` và `RespawnConfig.asset` trong `_Project/World/ScriptableObjects/` là template rỗng/trùng — đã ưu tiên copy bản ở root Assets (có dữ liệu thật, ví dụ `RegionName: Tutorial Plains`).

## skills/

| File | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| skill_db.json | Assets/Resources/GameData/skill_db.json | JSON | YES | Resources.Load | YES (18 skill) |
| ascension_tree.json | Assets/Resources/GameData/ascension_tree.json | JSON | UNKNOWN | Resources.Load (suy đoán) | YES |
| ascension_ranks.json | Assets/Resources/GameData/ascension_ranks.json | JSON | UNKNOWN | Resources.Load (suy đoán) | YES |
| element_chart.json | Assets/StreamingAssets/Data/element_chart.json | JSON | YES | StreamingAssets | YES (bảng khắc chế nguyên tố) |
| damage_type_config.json | Assets/StreamingAssets/Data/damage_type_config.json | JSON | UNKNOWN | StreamingAssets | YES |
| class-skills-reference.txt | Assets/script/Skill/SystemSkill/class-skills-reference.txt | TXT | NO | tài liệu tham chiếu thủ công | YES (map 3 class → 5 slot skill, level mở khóa, cooldown, mana) |
| SKILL_SYSTEM_DETAILED.md | MMORPG Bible/_design/SKILL_SYSTEM_DETAILED.md | MD | NO | design doc | YES |
| 06_MASTERY_SYSTEM.md | MMORPG Bible/_design/systems/06_MASTERY_SYSTEM.md | MD | NO | design doc | YES |
| 09_ELEMENT_CHART.md | MMORPG Bible/_design/systems/09_ELEMENT_CHART.md | MD | NO | design doc | YES |
| 15_DAMAGE_TYPE_ARCHITECTURE.md | MMORPG Bible/_design/systems/15_DAMAGE_TYPE_ARCHITECTURE.md | MD | NO | design doc | YES |

## shops/

| File | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| shop_db.json | Assets/StreamingAssets/Data/shop_db.json | JSON | YES | StreamingAssets | YES (23 shop, link tới npc_db) |
| 09_SHOP_ARCHITECTURE.md | MMORPG Bible/_design/09_SHOP_ARCHITECTURE.md | MD | NO | design doc | YES |
| 10_GACHA_ARCHITECTURE.md | MMORPG Bible/_design/10_GACHA_ARCHITECTURE.md | MD | NO | design doc | YES |
| AUCTION_HOUSE_DETAILED.md | MMORPG Bible/_design/AUCTION_HOUSE_DETAILED.md | MD | NO | design doc | YES |
| MONETIZATION_PASS.md | MMORPG Bible/_design/MONETIZATION_PASS.md | MD | NO | design doc | YES (battle pass) |
| MONETIZATION_VIP_COSMETICS.md | MMORPG Bible/_design/MONETIZATION_VIP_COSMETICS.md | MD | NO | design doc | YES (VIP/cosmetic) |

## crafting/

| File | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| crafting_db.json | Assets/Resources/GameData/crafting_db.json | JSON | YES | Resources.Load | YES (219 recipe) |
| CRAFTING_SYSTEM_DETAILED.md | MMORPG Bible/_design/CRAFTING_SYSTEM_DETAILED.md | MD | NO | design doc | YES |
| GATHERING_SYSTEM_DETAILED.md | MMORPG Bible/_design/GATHERING_SYSTEM_DETAILED.md | MD | NO | design doc | YES |

## drops/

| File | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| pity_config.json | Assets/StreamingAssets/Data/pity_config.json | JSON | UNKNOWN | StreamingAssets | YES (hệ thống pity/bảo đảm) |
| 10_LOOT_ALGORITHM.md | MMORPG Bible/_design/systems/10_LOOT_ALGORITHM.md | MD | NO | design doc | YES |
| 11_PITY_FAILSTACK.md | MMORPG Bible/_design/systems/11_PITY_FAILSTACK.md | MD | NO | design doc | YES |

> Ghi chú: bảng rơi đồ thực tế (drop_table) nằm **trong** `monster_db.json` và `boss_db.json` (đã có ở monsters/), không tách file riêng.

## worlds/

| File | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| biome_remap.json | Assets/Resources/GameData/biome_remap.json | JSON | UNKNOWN | Resources.Load (suy đoán) | YES (phân bố level theo biome) |
| season_db.json | Assets/Resources/GameData/season_db.json | JSON | UNKNOWN | Resources.Load (suy đoán) | YES |
| biome_element_weakness.json | Assets/StreamingAssets/Data/biome_element_weakness.json | JSON | UNKNOWN | StreamingAssets | YES |
| DAY_NIGHT_SYSTEM.md | MMORPG Bible/_design/DAY_NIGHT_SYSTEM.md | MD | NO | design doc | YES |
| HOUSING_EXPANSION.md | MMORPG Bible/_design/HOUSING_EXPANSION.md | MD | NO | design doc | YES |
| WEATHER_SYSTEM.md | MMORPG Bible/_design/WEATHER_SYSTEM.md | MD | NO | design doc | YES |
| WORLD_SIMULATION_ARCHITECTURE.md | MMORPG Bible/_design/WORLD_SIMULATION_ARCHITECTURE.md | MD | NO | design doc | YES |
| 03_WORLD_EVENT_SYSTEM.md (bản expansion, đầy đủ hơn) | MMORPG Bible/_design/expansion/03_WORLD_EVENT_SYSTEM.md | MD | NO | design doc | YES |
| HOUSING_SYSTEM_systems.md | MMORPG Bible/_design/systems/12_HOUSING_SYSTEM.md | MD | NO | design doc | YES |

## achievements/

| File | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| battle_pass_db.json | Assets/Resources/GameData/battle_pass_db.json | JSON | UNKNOWN | Resources.Load (suy đoán) | YES |
| 04_ACHIEVEMENT_SYSTEM.md | MMORPG Bible/_design/04_ACHIEVEMENT_SYSTEM.md | MD | NO | design doc | YES |
| 05_TITLE_SYSTEM.md | MMORPG Bible/_design/05_TITLE_SYSTEM.md | MD | NO | design doc | YES |
| LEADERBOARD_ARCHITECTURE.md | MMORPG Bible/_design/LEADERBOARD_ARCHITECTURE.md | MD | NO | design doc | YES |
| 06_COLLECTION_CODEX_SYSTEM.md (bản expansion, đầy đủ hơn) | MMORPG Bible/_design/expansion/06_COLLECTION_CODEX_SYSTEM.md | MD | NO | design doc | YES |

## dialogs/

| File | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| reputation_factions.json | Assets/Resources/GameData/reputation_factions.json | JSON | UNKNOWN | Resources.Load (suy đoán) | YES |
| REPUTATION_SYSTEM.md | MMORPG Bible/_design/REPUTATION_SYSTEM.md | MD | NO | design doc | YES |

> Ghi chú: hội thoại NPC chi tiết (dialog tree) KHÔNG có file riêng — chỉ có `dialog_root` (ID) trong `npc_db.json`, nội dung lời thoại thật chưa được viết/chưa tìm thấy. Xem mục "file thiếu dữ liệu" trong báo cáo.

## tutorials/

| File | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| TUTORIAL_ONBOARDING.md | MMORPG Bible/_design/TUTORIAL_ONBOARDING.md | MD | NO | design doc | YES |

## guides/

| File | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| 01_GUILD_ARCHITECTURE.md | MMORPG Bible/_design/01_GUILD_ARCHITECTURE.md | MD | NO | design doc | YES |
| 02_PARTY_MATCHMAKING_ARCHITECTURE.md | MMORPG Bible/_design/02_PARTY_MATCHMAKING_ARCHITECTURE.md | MD | NO | design doc | YES |
| 07_DAILY_WEEKLY_ACTIVITY_SYSTEM.md | MMORPG Bible/_design/07_DAILY_WEEKLY_ACTIVITY_SYSTEM.md | MD | NO | design doc | YES |
| 08_MAIL_SYSTEM.md | MMORPG Bible/_design/08_MAIL_SYSTEM.md | MD | NO | design doc | YES |
| 11_LIVEOPS_ARCHITECTURE.md | MMORPG Bible/_design/11_LIVEOPS_ARCHITECTURE.md | MD | NO | design doc | YES |
| 15_OFFLINE_PROGRESS_SYSTEM.md | MMORPG Bible/_design/15_OFFLINE_PROGRESS_SYSTEM.md | MD | NO | design doc | YES |
| 16_CATCHUP_SYSTEM.md | MMORPG Bible/_design/16_CATCHUP_SYSTEM.md | MD | NO | design doc | YES |
| FRIEND_SYSTEM.md | MMORPG Bible/_design/FRIEND_SYSTEM.md | MD | NO | design doc | YES |
| PVP_ARCHITECTURE.md | MMORPG Bible/_design/PVP_ARCHITECTURE.md | MD | NO | design doc | YES |
| UI_UX_ARCHITECTURE.md | MMORPG Bible/_design/UI_UX_ARCHITECTURE.md | MD | NO | design doc | YES (giải thích tính năng UI) |
| MMORPG_BIBLE_V10.md | MMORPG Bible/_design/MMORPG_BIBLE_V10.md | MD | NO | design doc tổng quan | YES |
| MMORPG_BIBLE_V10_VOL2.md | MMORPG Bible/_design/MMORPG_BIBLE_V10_VOL2.md | MD | NO | design doc tổng quan | YES |
| README.md | MMORPG Bible/_design/README.md | MD | NO | design doc | YES |
| INDEX.md | MMORPG Bible/_design/systems/INDEX.md | MD | NO | mục lục hệ thống | YES |

## lore/

| File | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| chuong 1 dong co.txt … chuong 21 than gioi giang the.txt (21 file) | nhiem vu/chuong N ....txt | TXT | N/A | nội dung lore/quest viết tay tiếng Việt theo vùng | YES — nguồn duy nhất có narrative quest tiếng Việt đầy đủ theo vùng (tên NPC, tên quái, boss, vật phẩm cốt truyện) |
| chuong mo rong.txt | nhiem vu/chuong mo rong.txt | TXT | N/A | roadmap mở rộng hậu launch (Lv5000-10000) | YES |

## patchnotes/

| File | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| MMORPG_EXPANSION_ROADMAP.md | MMORPG Bible/_design/MMORPG_EXPANSION_ROADMAP.md | MD | NO | design doc roadmap | YES (gần nhất với "patch notes", nhưng là roadmap tương lai, KHÔNG phải patch note đã phát hành) |

## faq/

Không có file nào — xem báo cáo phần "file thiếu dữ liệu".

## raw/

| File | Nguồn gốc | Loại | Runtime | Cách load | Dùng cho chatbot |
|---|---|---|---|---|---|
| progression_1_2000.json | Assets/Resources/GameData/progression_1_2000.json | JSON | YES | Resources.Load | Một phần — bảng exp/stat theo level 1-2000, hữu ích cho câu hỏi "level X cần bao nhiêu exp" nhưng quá lớn/thô để trả lời trực tiếp dạng chat |
| growth_systems_db.json | Assets/Resources/GameData/growth_systems_db.json | JSON | UNKNOWN | Resources.Load (suy đoán) | Một phần (kỹ thuật) |
| party_progression.json | Assets/Resources/GameData/party_progression.json | JSON | UNKNOWN | Resources.Load (suy đoán) | YES |
| mentor_milestones.json | Assets/Resources/GameData/mentor_milestones.json | JSON | UNKNOWN | Resources.Load (suy đoán) | YES |
| power_budget.json | Assets/StreamingAssets/Data/power_budget.json | JSON | UNKNOWN | StreamingAssets | Một phần (triết lý balance nội bộ, ít giá trị hỏi-đáp trực tiếp) |
| SlimeMMO_HoatDong_NhiemVu.docx | nhiem vu/SlimeMMO_HoatDong_NhiemVu.docx | DOCX | N/A | **không đọc được trực tiếp** | **CẦN xuất sang .txt/.md thủ công trước khi dùng** |
