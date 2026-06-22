# MMORPG Knowledge Base

Dữ liệu trong thư mục này được trích xuất và chuẩn hóa từ 3 nguồn:

1. `C:\Users\DELL 3443\Downloads\MMORPG Bible` — tài liệu thiết kế hệ thống (design bible), database generators, docs server (đã lọc bỏ phần server/internal).
2. `F:\unitygame\Ball Control\Assets` — **nguồn dữ liệu runtime chính thức** (các file JSON trong `Resources/GameData` và `StreamingAssets/Data` được game load trực tiếp qua `Resources.Load`/đọc file tại runtime), cùng các ScriptableObject world/region (.asset, định dạng YAML đọc được như text).
3. `F:\unitygame\chualam\HA\xoanen\hoanchinh\nhiem vu` — nội dung lore/quest tiếng Việt theo từng vùng (chương 1–21 + chương mở rộng) và bảng vật phẩm nhiệm vụ (ảnh PNG, chưa OCR).

Chatbot website **chỉ nên đọc dữ liệu trong thư mục này**, không truy cập trực tiếp source Unity hay MMORPG Bible gốc.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `items/` | equipment_db, item_db, affix/artifact/relic/rune/gem/trait/pet_equipment/set_bonus/furniture db, mount/soulbond/wing system docs, equipment rarity reference, quest-item PNG charts (cần OCR) |
| `monsters/` | monster_db, boss_db (+mechanics), creature_db, monster_family, pet behavior/creature/monster-family system docs |
| `quests/` | quest_db.json (334 quests), quest pipeline architecture |
| `npc/` | npc_db.json (49 NPC), NPC architecture doc |
| `maps/` | dungeon_db, territory_zones, world map system doc, dungeon architecture, toàn bộ 21 RegionGridConfig + world/chunk ScriptableObject (MainGameMapConfig, WorldRegionConfig, WorldRegionDatabase, ChunkRegistry, BiomeTemplate, RegionChunkConfig, TownChunkProfile, RegionTownRegistry, SeasonalTileDatabase, RespawnConfig) |
| `skills/` | skill_db, ascension_ranks/tree, element_chart, damage_type_config, skill/mastery/element/damage system docs, class-skills-reference.txt |
| `shops/` | shop_db, shop/gacha/auction architecture, battle pass & VIP cosmetics docs |
| `crafting/` | crafting_db, crafting & gathering system docs |
| `drops/` | pity_config, loot algorithm & pity/failstack docs |
| `worlds/` | biome_remap, season_db, biome_element_weakness, world event/housing/weather/day-night/simulation docs |
| `achievements/` | battle_pass_db, achievement/title/collection-codex/leaderboard system docs |
| `dialogs/` | reputation_factions.json, reputation system doc |
| `tutorials/` | tutorial onboarding doc |
| `guides/` | master bible docs, guild/party/daily-activity/mail/liveops/offline-progress/catchup/friend/PvP/UI-UX system docs, system index |
| `lore/` | 21 file lore/quest theo vùng (chương 1–21) + chương mở rộng (tiếng Việt) |
| `patchnotes/` | roadmap mở rộng (KHÔNG có patch notes thật — xem ghi chú trong báo cáo) |
| `faq/` | **rỗng** — không tìm thấy file FAQ nào trong 3 nguồn |
| `raw/` | dữ liệu kỹ thuật hỗ trợ (progression curve, power budget, growth systems, party progression, mentor milestones) + file .docx chưa đọc được |

Xem `SOURCE_MANIFEST.md` để biết nguồn gốc, cách load runtime, và lý do chọn/loại của từng file.
Xem `EXTRACTION_REPORT.md` để biết báo cáo tổng kết theo yêu cầu (số file quét, số file chọn, dung lượng, file bị bỏ qua, file thiếu dữ liệu, dữ liệu quan trọng nhất).
