# Báo Cáo Trích Xuất Knowledge Base

Ngày thực hiện: 2026-06-21

## 1. Tổng số file đã quét

| Nguồn | Tổng số file trong cây thư mục |
|---|---|
| `C:\Users\DELL 3443\Downloads\MMORPG Bible` | 664 |
| `F:\unitygame\Ball Control\Assets` | 7,656 |
| `F:\unitygame\chualam\HA\xoanen\hoanchinh\nhiem vu` | 45 |
| **Tổng** | **8,365** |

(Phần lớn trong 7,656 file của Ball Control/Assets là texture, prefab, tilemap binary, NavMesh, audio, .meta — không phải dữ liệu tri thức.)

## 2. Tổng số file được chọn (đã copy vào KnowledgeBase/)

**172 file** (170 file dữ liệu tri thức + 2 file tài liệu mô tả KB: `README.md`, `SOURCE_MANIFEST.md`)

Phân bổ theo thư mục:

| Thư mục | Số file |
|---|---|
| items | 41 (gồm 21 ảnh PNG quest-item-charts chưa OCR) |
| monsters | 8 |
| quests | 2 |
| npc | 2 |
| maps | 35 (gồm 21 RegionGridConfig) |
| skills | 10 |
| shops | 6 |
| crafting | 3 |
| drops | 3 |
| worlds | 9 |
| achievements | 5 |
| dialogs | 2 |
| tutorials | 1 |
| guides | 14 |
| lore | 22 |
| patchnotes | 1 |
| faq | 0 |
| raw | 6 (gồm 1 file .docx chưa đọc được) |

## 3. Dung lượng dữ liệu

**~52 MB** tổng cộng — trong đó **~47 MB** là 21 ảnh PNG bảng vật phẩm nhiệm vụ (`items/quest-item-charts/`) chưa được OCR thành text. Phần dữ liệu text/JSON/MD thực sự là **~5 MB**.

## 4. Danh sách file/loại dữ liệu bị bỏ qua (không copy)

Lý do bỏ qua: thuộc nhóm "KHÔNG COPY" theo yêu cầu (source code, networking, auth, server logic, admin tools, internal config, build/editor tooling) hoặc là tài liệu audit/process nội bộ không có giá trị trả lời cho người chơi.

**Từ MMORPG Bible/_design/ (loại bỏ ~50 file):**
- Toàn bộ báo cáo audit/QA: `AUDIT_HISTORY.md`, `AUDIT_REPORT.md`, `MASTER_AUDIT_V2.md`, `FINAL_BIBLE_AUDIT.md`, `FINAL_PRODUCTION_AUDIT.md`, `FINAL_PROJECT_AUDIT.md`, `MMORPG_CONSISTENCY_AUDIT.md`, `MMORPG_GAP_ANALYSIS.md`, `ENHANCEMENT_VALIDATION_REPORT.md`, `ECONOMY_RECONCILIATION_REPORT.md`, `ECONOMY_AUDIT.md`, `PHASE1_AUDIT.md`, `PHASE2_AUDIT.md`, `PHASE3_FINAL_REPORT.md`, `PHASE4_FINAL_AUDIT.md`, `PRODUCTION_READINESS_REPORT.md`, `SERVER_ARCHITECTURE_AUDIT.md`, `WORLD_SYSTEM_AUDIT.md`, `WORLD_SYSTEM_AUDIT_UNITY.md`, `FULL_PROJECT_VALIDATION.md`
- Server/backend/internal: `CLIENT_ARCHITECTURE.md`, `SERVER_ARCHITECTURE.md`, `SECURITY_ARCHITECTURE.md`, `DEVOPS_ARCHITECTURE.md`, `DISASTER_RECOVERY_ARCHITECTURE.md`, `DATABASE_REGISTRY.md`, `DATABASE_EXPANSION_REPORT.md`, `DATABASE_IMPLEMENTATION_PLAN.md`, `NETWORK_PACKET_EXPANSION.md`, `PACKET_REGISTRY.md`, `PACKET_REGISTRY_V10.md`, `GM_TOOLS_ARCHITECTURE.md`, `MONITORING_ARCHITECTURE.md`, `PUSH_NOTIFICATION_ARCHITECTURE.md`, `LOCALIZATION_ARCHITECTURE.md` (tooling, không phải bản dịch thật), `SAVE_DATA_EXPANSION_REPORT.md`, `SAVE_MIGRATION_V10.md`, `SAVE_VERSION_REGISTRY.md`, `SYSTEM_REGISTRY.md`, `ECONOMY_REGISTRY.md`, `13_SERVER_MERGE_SYSTEM.md`, `14_CROSS_SERVER_ARCHITECTURE.md`, `17_ADDRESSABLES_ARCHITECTURE.md`, `12_ANALYTICS_ARCHITECTURE.md`, `00_SAVE_DATA_SYSTEM.md`, `SAVE_DATA_SCHEMA.md`, `01_POWER_BUDGET.md` (triết lý balance nội bộ), `schema_v10.sql`
- Quy trình dev/build: `COPY_TO_UNITY.md`, `HANDOFF_VSCODE.md`, `SETUP_UNITY.md`, `IMPLEMENTATION_MASTER_PLAN.md`, `SPRINT1_IMPLEMENTATION_PLAN.md`, `PHASE2_TODO.md`, `PROGRESS.md`, `ORPHAN_RESOLUTION.md`, `DESIGN_FREEZE_V1.md`, `DESIGN_FREEZE_V1_CERTIFICATE.md`, `BalanceSandbox.html`
- Chiến lược kinh doanh nội bộ: `MONETIZATION_ECONOMY.md`, `MONETIZATION_MASTER.md`, `MONETIZATION_RECHARGE.md`, `MONETIZATION_TECHNICAL.md`, `MONETIZATION_LIVEOPS.md`
- Bản trùng ngắn hơn (đã dùng bản `expansion/` đầy đủ hơn thay thế): `03_WORLD_EVENT_SYSTEM.md`, `04_ACHIEVEMENT_SYSTEM.md`, `06_COLLECTION_CODEX_SYSTEM.md` (bản root, 233 dòng so với bản expansion 1264 dòng)

**Từ MMORPG/Server/Configs/ (loại bỏ toàn bộ 4 file):** `database.json`, `gameplay.json`, `network.json`, `server.json` — cấu hình server/network, không phải tri thức game.

**Từ MMORPG/Docs/ (loại bỏ toàn bộ 6 file):** `BOOTSTRAP_IMPLEMENTATION_REPORT.md`, `CHUNK_SETUP_GUIDE.md`, `PHASE2_CHUNK_MIGRATION_PLAN.md`, `PHASE2_COMPLETION_REPORT.md`, `SPRINT1_WEEK2_COMPLETION_REPORT.md`, `WORLD_SETUP_TOOL_GUIDE.md` — tài liệu kỹ thuật cho dev dựng world, không trả lời câu hỏi người chơi.

**Từ generators/ (loại bỏ toàn bộ 33 file .py):** Source code sinh dữ liệu — output của chúng (các file .json) đã được copy, không copy code.

**Từ database/ (loại bỏ):** `database_schema.sql` — schema PostgreSQL server, thuộc "Server Logic".

**Từ Ball Control/Assets (loại bỏ phần lớn):** mọi file `.cs` (script nguồn), `.meta`, texture/sprite/tilemap binary (798 file tile sa mạc), NavMesh binary, AddressableAssetsData build config, audio binary, TextMesh Pro/Google Mobile Ads/External Dependency Manager (thư viện thứ 3), Editor tooling, Scenes (`.unity`), file ScriptableObject trùng rỗng (`_Project/World/ScriptableObjects/WorldRegionConfig.asset` và `RespawnConfig.asset` bản template — đã dùng bản root có dữ liệu thật thay thế). Các file định nghĩa item/skill/enemy riêng lẻ dạng `.asset` trong `script/Item/Data/`, `script/Skill/Data/`, `script/AI/Data/` (≈70 file) **không copy** vì dữ liệu đã có đầy đủ và có cấu trúc tốt hơn trong `item_db.json`, `skill_db.json`, `monster_db.json`/boss tương ứng — copy thêm sẽ trùng lặp và có ID không khớp schema JSON.

**Từ nhiem vu/:** `link chat.txt` (chỉ là link chia sẻ ChatGPT, không phải dữ liệu game) — đã loại.

## 5. Danh sách file thiếu dữ liệu / cần xử lý thêm

| File | Vấn đề |
|---|---|
| `raw/SlimeMMO_HoatDong_NhiemVu.docx` | Không đọc được trực tiếp (binary .docx). **Cần mở bằng Word/LibreOffice và export sang .txt hoặc .md** rồi đưa vào `quests/` hoặc `lore/`. |
| `items/quest-item-charts/*.png` (21 file, 47MB) | Ảnh chụp bảng vật phẩm nhiệm vụ theo từng vùng — **chưa OCR**, chatbot text-only không đọc được nội dung. Cần OCR hoặc nhập tay thành JSON/bảng text. |
| Hội thoại NPC (dialogue text) | `npc_db.json` chỉ có field `dialog_root` (ID tham chiếu), **không có nội dung lời thoại thật**. Không tìm thấy file dialogue tree nào trong cả 3 nguồn. Chatbot sẽ KHÔNG trả lời được "NPC X nói gì" — chỉ trả lời được NPC bán gì/ở đâu. |
| FAQ | Không tìm thấy file FAQ nào trong cả 3 nguồn → thư mục `faq/` đang rỗng. Cần soạn thủ công hoặc tự sinh từ các câu hỏi thường gặp dựa trên dữ liệu hiện có. |
| Patch Notes thật | Không tìm thấy patch note đã phát hành (changelog theo version). Chỉ có `MMORPG_EXPANSION_ROADMAP.md` (roadmap tương lai, Lv5000+, không phải patch đã ra). |
| **Mâu thuẫn cấp độ (level cap)** | Bộ JSON (Bible/Resources/GameData) thiết kế giới hạn **level 2000** (`progression_1_2000.json`, `gameplay.json: max_level=2000`), nhưng nội dung lore tiếng Việt ở `nhiem vu/` thiết kế **21 vùng tới level 5000**, mở rộng hậu launch tới **level 10000**. Đây là 2 phiên bản thiết kế khác nhau (có thể JSON là bản cũ hơn hoặc một hướng thiết kế khác). **Cần xác nhận với team thiết kế bản nào là canonical** trước khi chatbot trả lời câu hỏi về level cap — hiện KB giữ cả 2, đã ghi chú rõ trong `SOURCE_MANIFEST.md`. |
| `damage_type_config.json`, `ascension_tree.json`, `ascension_ranks.json`, `battle_pass_db.json`, `biome_remap.json`, `season_db.json`, `reputation_factions.json`, `party_progression.json`, `mentor_milestones.json`, `power_budget.json`, `pity_config.json`, `biome_element_weakness.json` | Chưa xác nhận chắc chắn được gọi runtime qua code (`grep` không thấy rõ điểm gọi `Resources.Load`/`StreamingAssets` cho từng file này) — đánh dấu `Runtime: UNKNOWN` trong manifest. Khả năng cao vẫn đang dùng (cùng cơ chế load với các file đã xác nhận trong cùng thư mục) nhưng nên double-check với lập trình viên trước khi coi là 100% chính xác với game đang chạy. |
| Tên vùng tiếng Việt (`nhiem vu/chuong*.txt`) vs `RegionGridConfig` (tiếng Anh, ví dụ "Grassland") | Hai bộ dữ liệu vùng/map **không cùng hệ thống đặt tên** — RegionGridConfig dùng tên ngắn tiếng Anh (Grassland, ...), lore dùng tên dài tiếng Việt (Đồng Cỏ, Rừng Cổ Đại...). Chatbot cần một bảng mapping vùng ↔ region id để trả lời chính xác "vùng X yêu cầu level mấy" bằng cả 2 ngôn ngữ — **bảng mapping này hiện chưa tồn tại**, cần tạo thủ công. |

## 6. Danh sách dữ liệu quan trọng nhất cho chatbot

Ưu tiên cao nhất (trả lời trực tiếp các câu hỏi cốt lõi trong yêu cầu):

1. **`monsters/monster_db.json` + `boss_db.json` + `boss_mechanics_db.json`** — "Boss ở đâu / rơi gì / cơ chế gì"
2. **`npc/npc_db.json` + `shops/shop_db.json`** — "NPC ở đâu / bán gì"
3. **`quests/quest_db.json`** — "Quest làm thế nào / nhiệm vụ tiếp theo là gì"
4. **`maps/regions/RegionGridConfig_R00*.asset` + `maps/WorldRegionConfig.asset` + `maps/MainGameMapConfig.asset`** — "Map có gì / level bao nhiêu mở map"
5. **`skills/skill_db.json` + `skills/class-skills-reference.txt`** — "Skill học ở đâu / lúc nào"
6. **`crafting/crafting_db.json`** — "Craft như thế nào"
7. **`items/item_db.json` + `items/equipment_db.json`** — "Item là gì / item rơi từ đâu" (kết hợp drop_table trong monster_db/boss_db)
8. **`lore/chuong 1..21 *.txt`** — nguồn DUY NHẤT có narrative/lore tiếng Việt đầy đủ theo từng vùng, rất quan trọng để chatbot trả lời tự nhiên bằng tiếng Việt về "world có gì / câu chuyện vùng X là gì"
9. **`guides/MMORPG_BIBLE_V10.md` + `guides/MMORPG_BIBLE_V10_VOL2.md`** — tổng quan toàn bộ tính năng game, dùng để trả lời "tính năng game là gì"
10. **`patchnotes/MMORPG_EXPANSION_ROADMAP.md`** — duy nhất trả lời được phần "có gì mới/sắp tới", dù không phải patch note thật

## Kết luận

`KnowledgeBase/` tại `F:\KnowledgeBase` hiện đã có đủ dữ liệu để chatbot trả lời về **Items, Monsters, NPCs, Maps, Worlds, Quests, Skills, Drops (qua monster/boss db), Shops, Crafting, Tutorials** mà không cần đọc source Unity gốc.

**Patch Notes thật và FAQ chưa có** (xem mục 5) — cần bổ sung thủ công. Dialogue NPC chi tiết và bảng vật phẩm nhiệm vụ (ảnh PNG) cũng cần xử lý thêm trước khi hữu dụng 100% cho chatbot.
