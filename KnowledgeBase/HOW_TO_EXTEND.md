# Hướng Dẫn Bổ Sung KnowledgeBase Cho Chatbot

Chatbot đọc dữ liệu **hoàn toàn từ `/KnowledgeBase/`** qua `manifest.json` — vì website là static site
(Cloudflare Pages/GitHub Pages) nên **không thể tự liệt kê thư mục**, mọi file phải được khai báo trong
`manifest.json` thì chatbot mới biết để tải.

## Quyết định đã chốt: bộ JSON level-2000 là chuẩn

Theo yêu cầu, dữ liệu **JSON** (`monster_db.json`, `boss_db.json`, `quest_db.json`, `biome_remap.json`,
`npc_db.json`, `dungeon_db.json`...) được dùng làm **nguồn sự thật duy nhất** cho số liệu (level, HP, giá,
yêu cầu...). Nội dung trong `lore/` (21 chương tiếng Việt) chỉ dùng cho **văn phong/lời kể**, KHÔNG dùng
để trả lời số liệu — vì bộ lore đó được viết cho một thiết kế world riêng tới level 5000+, không khớp số
với bộ JSON (tới level 2000). `answer-templates.js` đã tuân theo nguyên tắc này: mọi câu trả lời về
level/HP/giá/yêu cầu đều lấy từ JSON; `lore/*.txt` chỉ được dùng khi người chơi hỏi về cốt truyện/lời kể.

## Cách thêm 1 file dữ liệu mới (ví dụ thêm `loot_tables.json` vào `drops/`)

1. Copy file vào đúng thư mục category, ví dụ `KnowledgeBase/drops/loot_tables.json`.
2. Mở `KnowledgeBase/manifest.json`, thêm vào mảng của category đó:
   ```json
   { "file": "loot_tables.json", "type": "json" }
   ```
   (`type` là `"json"`, `"markdown"`, `"text"`, hoặc `"unity-yaml"` tuỳ đuôi file)
3. Đổi `generatedAt` ở đầu `manifest.json` thành ngày hiện tại — đây là "version tag" để chatbot biết
   cache cũ đã lỗi thời và tự tải lại dữ liệu mới (không cần code gì thêm).
4. Mở chatbot trên web → bấm icon ⚙️ (admin) → **Reload KnowledgeBase**. Xong.

Nếu muốn tự động hoá bước 2-3 sau này: viết 1 script nhỏ (Node/Python) quét thư mục và xuất lại
`manifest.json` — chính là cách `KnowledgeBase/manifest.json` hiện tại được tạo ra.

## Những phần còn THIẾU và cách bổ sung

| Thiếu gì | Vì sao thiếu | Cách thêm sau này |
|---|---|---|
| **Bảng rơi đồ (loot table) chi tiết** | `monster_db.json`/`boss_db.json` chỉ có field `drop_table`/`drop` là **ID tham chiếu** (ví dụ `"drop_01_normal"`), nhưng file ánh xạ ID → danh sách vật phẩm + tỉ lệ rơi **không tồn tại** trong project nguồn. | Tạo `KnowledgeBase/drops/loot_tables.json` dạng: `{ "drop_01_normal": [{"item_id":"item_0005","chance":0.15}, ...] }`. Thêm vào manifest theo hướng dẫn trên. `answer-templates.js` (hàm `sentMonster`/`sentBoss`) sau đó có thể được sửa để tra `loot_tables.json` thay vì chỉ nói tên bảng. |
| **FAQ** | Không tìm thấy file FAQ nào trong 3 nguồn gốc đã quét. | Tạo `KnowledgeBase/faq/faq.json`: `[{"question":"...", "answer":"..."}]`, hoặc file `.md` dạng Q&A. Thêm vào `manifest.json` mục `faq`. |
| **Patch Notes thật** | Chỉ có roadmap (`patchnotes/MMORPG_EXPANSION_ROADMAP.md`), không có changelog đã phát hành. | Mỗi khi ra bản cập nhật, thêm file `KnowledgeBase/patchnotes/patch_YYYY_MM_DD.md` (tiêu đề = ngày/số bản), thêm vào manifest. |
| **Hội thoại NPC đầy đủ** | `npc_db.json` chỉ có 1 câu `dialog_root` mỗi NPC, không có cây hội thoại nhiều lượt. | Nếu cần hội thoại sâu hơn, tạo `KnowledgeBase/dialogs/npc_dialogues.json` dạng `{ "npc_id": ["câu 1","câu 2",...] }` và nối thêm vào `sentNpc()` trong `answer-templates.js`. |
| **21 ảnh PNG bảng vật phẩm nhiệm vụ** (`F:\KnowledgeBase\items\quest-item-charts\`) | Là ảnh chụp, không phải text — đã **không** copy vào bản deploy này vì chatbot không đọc được ảnh, và 47MB ảnh sẽ làm nặng site. | OCR thủ công (hoặc nhập tay) từng ảnh thành JSON `{"item_name":..., "drop_chance":...}` rồi để vào `items/` hoặc `drops/`, thêm vào manifest. |
| **File `SlimeMMO_HoatDong_NhiemVu.docx`** | File Word nhị phân, không đọc trực tiếp được. | Mở file bằng Word/LibreOffice → Save As `.txt` hoặc `.md` → đặt vào `quests/` hoặc `lore/` → thêm vào manifest. |
| **Tên vùng không khớp giữa 2 hệ thống** | `worlds/biome_remap.json` (tên: Verdant Meadow, Crystal Cave, Volcanic Ridge...) và `maps/regions/RegionGridConfig_*.asset` (tên: Grassland, Forest, Swamp...) là **hai hệ thống đặt tên khác nhau cho cùng dải id 1-21**, không phải lỗi copy — dữ liệu gốc trong Unity vốn đã như vậy (RegionGridConfig là placeholder kỹ thuật cũ). Chatbot hiện ưu tiên tên trong `biome_remap.json` khi trả lời. | Nếu team xác nhận tên chính thức, sửa trực tiếp `_regionName` trong các file `.asset` ở Unity rồi export lại, hoặc đơn giản là chấp nhận `biome_remap.json` là tên hiển thị chính thức (khuyến nghị, không cần làm gì thêm). |
| **`_minLevelRequirement` luôn = 1 trong mọi RegionGridConfig** | Hệ thống world-streaming của Unity chưa gán level thật theo vùng (placeholder). Level thật đã có ở `biome_remap.json` (`level_min`/`level_max`). | Không cần sửa gì cho chatbot (đã ưu tiên `biome_remap.json`). Nếu muốn đồng bộ, cập nhật `_minLevelRequirement` trong Unity cho khớp `level_min`. |

## Cách hoạt động (tóm tắt cho người maintain sau này)

- `manifest.json` → danh sách file cần tải (bắt buộc vì static hosting không liệt kê thư mục được).
- `kb-loader.js` → tải toàn bộ file, chuẩn hoá mỗi JSON row / đoạn markdown / dòng text thành 1 "document".
- `indexer.worker.js` (chạy trong Web Worker, không chặn UI) → dựng inverted index + bảng tham chiếu
  chéo (boss theo biome, NPC theo biome, item theo id...).
- `kb-cache.js` → lưu kết quả index vào IndexedDB, lần mở chatbot sau không phải tải lại từ đầu (cho đến
  khi `manifest.json` đổi `generatedAt`/số file, hoặc bấm "Rebuild Index"/"Reload KnowledgeBase").
- `search-engine.js` → tìm kiếm exact / từ khoá / full-text / đồng nghĩa / fuzzy (chịu lỗi gõ sai, viết tắt).
- `nlu.js` → nhận diện ý định (boss/monster/npc/quest/...) + số world/level trong câu hỏi.
- `memory.js` → nhớ chủ đề câu hỏi trước (trong `sessionStorage`) để hiểu đại từ "nó".
- `answer-templates.js` → biến dữ liệu thô thành câu văn tiếng Việt tự nhiên — **không bao giờ in JSON thô**.
- `chat-engine.js` → ráp toàn bộ pipeline trên lại, có fallback "Xin lỗi, tôi chưa tìm thấy thông tin này
  trong cơ sở dữ liệu game." khi không tìm được gì — **không tự bịa câu trả lời**.
- `chat-ui.js` / `chatbot.css` → giao diện kiểu ChatGPT, dark mode theo theme MMORPG, fullscreen mobile.
- `chat-admin.js` → 4 nút admin (Rebuild Index, Reload KnowledgeBase, Clear Cache, Export Search Report),
  ẩn sau mật khẩu đơn giản (`eo-admin-2026` trong `chat-admin.js`) — **đây không phải bảo mật thật**, vì
  site không có backend/server. Nếu sau này có backend, nên thay bằng đăng nhập thật.
- Không có file nào trong hệ thống này gọi OpenAI/Claude/Gemini hay bất kỳ AI trả phí nào — toàn bộ tìm
  kiếm + sinh câu trả lời chạy bằng rule-based JavaScript thuần trong trình duyệt.
