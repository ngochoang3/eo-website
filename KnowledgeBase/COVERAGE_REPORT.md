# Coverage Report — KnowledgeBase Chatbot (sau khi lọc kỹ thuật)

Tài liệu này dành cho người vận hành/dev, **không phải dữ liệu cho chatbot** (không nằm trong category nào nên `manifest.json` sẽ không nạp file này — không tiết lộ cho người chơi).

Chú thích trạng thái:
- **ĐỦ** — KB hiện tại có đủ dữ liệu để chatbot trả lời chính xác.
- **THIẾU** — KB có dữ liệu liên quan nhưng không đủ chi tiết để trả lời trọn vẹn câu hỏi.
- **KHÔNG CÓ** — KB hoàn toàn không có dữ liệu cho loại câu hỏi này.

---

## 1. CLASS

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Game có bao nhiêu class? | ĐỦ |
| 2 | Class nào đang có trong game? | ĐỦ |
| 3 | Warrior là gì, chơi như thế nào? | THIẾU |
| 4 | Mage mạnh nhất ở giai đoạn nào? | KHÔNG CÓ |
| 5 | Archer và Ranger có gì khác nhau? | THIẾU |
| 6 | Class nào dễ chơi cho người mới? | KHÔNG CÓ |
| 7 | Class nào mạnh nhất hiện tại (tier list)? | KHÔNG CÓ |
| 8 | Warrior có những skill gì? | ĐỦ |
| 9 | Class nào phù hợp đánh boss solo? | KHÔNG CÓ |
| 10 | Class nào phù hợp PvP? | KHÔNG CÓ |
| 11 | Mage dùng trang bị gì? | ĐỦ |
| 12 | Có thể đổi class sau khi tạo nhân vật không? | KHÔNG CÓ |
| 13 | Class nào dùng vũ khi gì (kiếm/cung/trượng...)? | THIẾU |
| 14 | Warrior có bao nhiêu skill? | ĐỦ |
| 15 | Ranger có phải là Archer không? | THIẾU |
| 16 | Class ảnh hưởng gì đến trang bị có thể mặc? | ĐỦ |
| 17 | Có class ẩn/class đặc biệt không? | KHÔNG CÓ |
| 18 | Mỗi class có bao nhiêu skill tối thượng (ultimate)? | ĐỦ |
| 19 | Class nào có nhiều trang bị Legendary nhất? | THIẾU |
| 20 | Lộ trình lên đồ cho từng class là gì? | KHÔNG CÓ |

**Tóm tắt Class:** 6 ĐỦ / 6 THIẾU / 8 KHÔNG CÓ. KB chỉ biết class qua field `class` trong `skill_db.json`/`equipment_db.json` — không có mô tả lối chơi, ưu/nhược điểm, hay tier list.

---

## 2. ITEM

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Item X là gì? | ĐỦ |
| 2 | Item X có giá bán bao nhiêu? | ĐỦ |
| 3 | Item X yêu cầu level bao nhiêu để dùng? | ĐỦ |
| 4 | Item X độ hiếm gì? | ĐỦ |
| 5 | Item X xếp chồng tối đa bao nhiêu? | ĐỦ |
| 6 | Item X lấy ở đâu? | THIẾU (chỉ biết qua shop/quest reward/craft, không có "tất cả nguồn") |
| 7 | Item X dùng để làm gì (consumable hồi gì)? | ĐỦ |
| 8 | Có bao nhiêu loại item trong game? | ĐỦ |
| 9 | Item nào hiếm nhất? | THIẾU (không có field xếp hạng độ hiếm tuyệt đối) |
| 10 | Vật phẩm nguyên liệu X dùng để craft gì? | THIẾU (phải tra ngược qua crafting_db, chatbot chưa hỗ trợ truy vấn ngược) |
| 11 | Item X có bán ở Auction House không? | KHÔNG CÓ (không có dữ liệu listing AH theo thời gian thực) |
| 12 | Vật phẩm Quest Item dùng để làm gì? | THIẾU |
| 13 | Item nào dùng làm nguyên liệu craft trang bị? | THIẾU |
| 14 | Gem là gì, có mấy loại? | ĐỦ |
| 15 | Item X có thể bán cho NPC không, giá bao nhiêu? | ĐỦ |
| 16 | Key (chìa khoá) item dùng để mở gì? | THIẾU |
| 17 | Material item X rơi từ quái nào? | THIẾU |
| 18 | Item nào nên giữ lại, item nào nên bán? | KHÔNG CÓ |
| 19 | Trait là gì? | ĐỦ |
| 20 | Furniture (nội thất) có mấy loại? | ĐỦ |

**Tóm tắt Item:** 11 ĐỦ / 8 THIẾU / 1 KHÔNG CÓ.

---

## 3. EQUIPMENT

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Trang bị X có chỉ số gì? | ĐỦ |
| 2 | Trang bị X dành cho class nào? | ĐỦ |
| 3 | Trang bị X độ hiếm gì? | ĐỦ |
| 4 | Trang bị X lấy ở đâu (craft/dungeon/quest/raid/season/world boss)? | ĐỦ |
| 5 | Trang bị nào mạnh nhất cho class X? | ĐỦ |
| 6 | Trang bị X có mấy ô affix? | ĐỦ |
| 7 | Bộ set X gồm những trang bị nào? | THIẾU (có set_id liên kết nhưng chưa liệt kê đủ thành viên bộ) |
| 8 | Set bonus của bộ X là gì? | ĐỦ |
| 9 | Trang bị Genesis khác Mythic như thế nào? | THIẾU (không có mô tả phân cấp độ hiếm) |
| 10 | Affix nào tốt nhất cho trang bị tấn công? | ĐỦ |
| 11 | Làm sao để gắn affix vào trang bị? | KHÔNG CÓ |
| 12 | Relic là gì, khác Trang bị thường thế nào? | ĐỦ |
| 13 | Rune dùng để làm gì? | ĐỦ |
| 14 | Trang bị vị trí Weapon nào yêu cầu level thấp nhất? | ĐỦ |
| 15 | Trang bị nào rơi từ Raid Boss? | THIẾU (biết "source: Raid" nhưng không nối được với boss cụ thể) |
| 16 | Pet Equipment là gì? | ĐỦ |
| 17 | Có thể nâng cấp (enhance) trang bị không? | THIẾU |
| 18 | Reroll affix tốn bao nhiêu? | ĐỦ |
| 19 | Trang bị theo vùng (biome set) là gì? | ĐỦ |
| 20 | Trang bị nào tốt nhất ở level 1? | ĐỦ |

**Tóm tắt Equipment:** 14 ĐỦ / 5 THIẾU / 1 KHÔNG CÓ.

---

## 4. MONSTER

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Quái X ở đâu? | ĐỦ |
| 2 | Quái X có bao nhiêu HP/ATK/DEF? | ĐỦ |
| 3 | Quái X level mấy? | ĐỦ |
| 4 | Quái X rơi gì? | THIẾU (chỉ biết tên bảng rơi đồ, không có danh sách item cụ thể) |
| 5 | Quái X thưởng bao nhiêu EXP/vàng? | ĐỦ |
| 6 | Quái X có phải elite không? | ĐỦ |
| 7 | Quái nào xuất hiện ở Verdant Meadow? | ĐỦ |
| 8 | Quái thuộc gia tộc (family) nào yếu nguyên tố gì? | ĐỦ |
| 9 | Quái nào hiếm nhất trong game? | THIẾU |
| 10 | Quái X bao lâu hồi sinh (respawn)? | ĐỦ |
| 11 | Quái X có tốc độ di chuyển bao nhiêu? | ĐỦ |
| 12 | Pet/sinh vật đồng hành nào tốt nhất? | THIẾU |
| 13 | Làm sao bắt được pet/creature? | KHÔNG CÓ |
| 14 | Quái nào miễn nhiễm choáng (CC immunity)? | ĐỦ |
| 15 | Gia tộc quái Beast gồm những loại nào? | ĐỦ |
| 16 | Quái nào mạnh nhất ở world 17? | ĐỦ |
| 17 | Quái thường khác quái elite ở điểm nào? | ĐỦ |
| 18 | Có bao nhiêu loại quái trong game? | ĐỦ |
| 19 | Loyalty (độ trung thành) của pet ảnh hưởng gì? | THIẾU |
| 20 | Quái nào nguyên tố Neutral? | ĐỦ |

**Tóm tắt Monster:** 15 ĐỦ / 4 THIẾU / 1 KHÔNG CÓ.

---

## 5. BOSS

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Boss world 17 là gì? | ĐỦ |
| 2 | Boss X có bao nhiêu HP? | ĐỦ |
| 3 | Boss X có mấy giai đoạn (phase)? | ĐỦ |
| 4 | Cơ chế của boss X là gì? | ĐỦ |
| 5 | Boss X rơi gì? | THIẾU (chỉ có tên bảng rơi đồ) |
| 6 | Boss X yêu cầu level bao nhiêu? | ĐỦ |
| 7 | Cách né (counter) cơ chế của boss X? | ĐỦ (nếu có trong boss_mechanics) |
| 8 | Boss X có enrage không? | ĐỦ |
| 9 | Lore/câu chuyện của boss X là gì? | ĐỦ |
| 10 | Boss nào khó nhất trong game? | THIẾU (không có field xếp hạng độ khó) |
| 11 | Đánh boss X cần bao nhiêu người? | THIẾU (không trực tiếp, trừ khi suy ra qua dungeon liên quan) |
| 12 | Boss world (world boss) khác boss dungeon thế nào? | ĐỦ (qua field "type") |
| 13 | Boss X xuất hiện ở đâu? | ĐỦ |
| 14 | AI hành vi của boss X là gì? | ĐỦ |
| 15 | Boss nào rơi trang bị Genesis? | KHÔNG CÓ |
| 16 | Có bao nhiêu boss trong game? | ĐỦ |
| 17 | Raid Boss và Dungeon Boss khác nhau ở điểm nào? | ĐỦ |
| 18 | Boss X có giai đoạn cuối nguy hiểm gì? | ĐỦ |
| 19 | Đánh boss nào để lên đồ nhanh nhất? | KHÔNG CÓ |
| 20 | Boss nào ở vùng Blight Marsh? | ĐỦ |

**Tóm tắt Boss:** 14 ĐỦ / 3 THIẾU / 3 KHÔNG CÓ.

---

## 6. QUEST

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Quest X yêu cầu level bao nhiêu? | ĐỦ |
| 2 | Quest X thưởng gì? | ĐỦ |
| 3 | Quest X cần hoàn thành quest nào trước? | ĐỦ |
| 4 | Quest X có lặp lại được không? | ĐỦ |
| 5 | Quest nào cho nhiều EXP nhất? | ĐỦ |
| 6 | Quest nào cho nhiều vàng nhất? | ĐỦ |
| 7 | Quest X thuộc loại gì (Tutorial/Main/Side/Daily)? | ĐỦ |
| 8 | Quest X ở vùng nào? | ĐỦ |
| 9 | Nhiệm vụ tiếp theo sau quest X là gì? | THIẾU (có thể tra ngược prereq nhưng chatbot chưa hỗ trợ truy vấn "quest kế tiếp") |
| 10 | Quest nào do NPC X giao? | ĐỦ |
| 11 | Làm quest X thế nào (chi tiết bước thực hiện)? | KHÔNG CÓ |
| 12 | Quest X có hội thoại gì? | KHÔNG CÓ |
| 13 | Có bao nhiêu quest trong game? | ĐỦ |
| 14 | Quest lặp lại hồi sau bao lâu? | ĐỦ |
| 15 | Quest nào thưởng vật phẩm hiếm? | THIẾU |
| 16 | Quest chính tuyến (Main) ở world 21 là gì? | ĐỦ |
| 17 | Quest Daily khác quest thường thế nào? | ĐỦ |
| 18 | Cốt truyện quest liên quan gì đến lore vùng đó? | THIẾU (lore và quest_db là 2 nguồn tách biệt, không liên kết trực tiếp) |
| 19 | Quest nào mở khoá tính năng mới? | KHÔNG CÓ |
| 20 | Quest nào cần làm để vào dungeon X? | KHÔNG CÓ |

**Tóm tắt Quest:** 13 ĐỦ / 4 THIẾU / 3 KHÔNG CÓ.

---

## 7. NPC

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | NPC X ở đâu? | ĐỦ |
| 2 | NPC X bán gì? | ĐỦ |
| 3 | NPC X là loại gì (vendor/quest giver/...)? | ĐỦ |
| 4 | NPC X giao quest gì? | ĐỦ |
| 5 | NPC X nói gì (lời thoại)? | THIẾU (chỉ có 1 câu `dialog_root`, không có cây hội thoại) |
| 6 | NPC X có hung hãn (hostile) không? | ĐỦ |
| 7 | NPC nào bán potion? | ĐỦ |
| 8 | Có bao nhiêu NPC trong game? | ĐỦ |
| 9 | NPC nào ở Verdant Meadow? | ĐỦ |
| 10 | Làm sao để nói chuyện/tương tác với NPC X? | KHÔNG CÓ |
| 11 | NPC reputation_vendor bán gì đặc biệt? | THIẾU |
| 12 | Có NPC nào theo dõi giờ ngày/đêm không? | THIẾU (đã có trong day_night_guide nhưng chưa liên kết tên NPC cụ thể) |
| 13 | Arena Master ở đâu? | ĐỦ (nếu NPC loại arena_master tồn tại trong data) |
| 14 | Guild Master là ai, ở đâu? | ĐỦ |
| 15 | NPC nào đổi reputation lấy phần thưởng? | ĐỦ |
| 16 | Banker NPC dùng để làm gì? | THIẾU (chỉ biết tồn tại loại "banker", không có mô tả chức năng) |
| 17 | NPC nào liên quan đến housing? | ĐỦ (housing_agent) |
| 18 | NPC nào dạy skill? | KHÔNG CÓ |
| 19 | Mỗi vùng có bao nhiêu NPC? | ĐỦ |
| 20 | NPC creature_handler làm gì? | THIẾU |

**Tóm tắt NPC:** 12 ĐỦ / 5 THIẾU / 3 KHÔNG CÓ.

---

## 8. MAP

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Dungeon X ở đâu, level yêu cầu mấy? | ĐỦ |
| 2 | Dungeon X có boss không? | ĐỦ |
| 3 | Dungeon X tối đa mấy người? | ĐỦ |
| 4 | Dungeon X giới hạn thời gian bao lâu? | ĐỦ |
| 5 | Có bao nhiêu loại dungeon (standard/raid/elite/...)? | ĐỦ |
| 6 | Vùng lãnh thổ (territory) X mang lại lợi ích gì? | ĐỦ |
| 7 | World map có fast travel không? | THIẾU (chỉ còn trong ghi chú gốc, đã bị loại do quá kỹ thuật) |
| 8 | Map nào có gathering node (thu thập nguyên liệu)? | THIẾU |
| 9 | Dungeon nào khuyến nghị level cao nhất? | ĐỦ |
| 10 | Có sương mù (fog of war) trên bản đồ không? | KHÔNG CÓ |
| 11 | Dungeon nào cho nhiều exp/gold nhất khi không ai chết? | ĐỦ |
| 12 | World boss dungeon khác standard dungeon thế nào? | ĐỦ |
| 13 | Có bao nhiêu dungeon trong game? | ĐỦ |
| 14 | Vùng lãnh thổ tranh chấp vào ngày nào? | THIẾU (field bị loại vì mang tính lịch nội bộ; có thể khôi phục nếu cần) |
| 15 | Làm sao di chuyển nhanh giữa các vùng? | KHÔNG CÓ |
| 16 | Tower (tháp) dungeon là gì? | ĐỦ (qua dungeon_type = "tower") |
| 17 | Dungeon nào yêu cầu phá trong thời gian giới hạn để có rương thưởng? | ĐỦ |
| 18 | Bản đồ thế giới có bao nhiêu vùng? | ĐỦ |
| 19 | Khu vực nào có giá Auction House rẻ hơn? | ĐỦ (qua territory buff_desc) |
| 20 | Map nào phù hợp đi theo nhóm 5 người? | ĐỦ |

**Tóm tắt Map:** 15 ĐỦ / 3 THIẾU / 2 KHÔNG CÓ.

---

## 9. WORLD

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | World/vùng X yêu cầu level bao nhiêu? | ĐỦ |
| 2 | World X có bao nhiêu boss/dungeon? | ĐỦ |
| 3 | World X nguyên tố chủ đạo là gì? | ĐỦ |
| 4 | World X mùa nào (season)? | ĐỦ |
| 5 | Có bao nhiêu world/vùng trong game? | ĐỦ |
| 6 | World nào dành cho level cao nhất? | ĐỦ |
| 7 | Thế giới có chu kỳ ngày/đêm không? | ĐỦ |
| 8 | Chợ đêm (Night Market) mở lúc nào? | ĐỦ |
| 9 | Thời tiết ảnh hưởng gì đến gameplay? | ĐỦ |
| 10 | Sự kiện thế giới (world event) nào đang diễn ra? | THIẾU (có mô tả loại event, không có lịch sự kiện thời gian thực) |
| 11 | Trăng tròn ảnh hưởng gì? | ĐỦ |
| 12 | Housing (nhà ở) hoạt động thế nào? | ĐỦ |
| 13 | World nào yếu nguyên tố gì? | ĐỦ |
| 14 | Đổi mùa trong game có ảnh hưởng item rơi không? | THIẾU |
| 15 | World 21 tên là gì? | ĐỦ |
| 16 | Sự kiện Xâm Lăng Bóng Tối diễn ra khi nào? | ĐỦ |
| 17 | Có thể xây nhà ở vùng nào? | THIẾU (chưa rõ vùng cụ thể được phép housing) |
| 18 | World nào có lore liên quan Slime cổ đại? | ĐỦ (qua lore/) |
| 19 | Server thay đổi theo mùa thế nào (server age)? | KHÔNG CÓ (field catch_up_age_fraction đã bị loại vì là công thức nội bộ) |
| 20 | World có bị ảnh hưởng bởi PK/PvP không? | THIẾU |

**Tóm tắt World:** 14 ĐỦ / 5 THIẾU / 1 KHÔNG CÓ.

---

## 10. SKILL

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Skill X làm gì? | ĐỦ |
| 2 | Skill X mở khoá ở level mấy? | ĐỦ |
| 3 | Skill X tốn bao nhiêu mana? | ĐỦ |
| 4 | Skill X hồi chiêu bao lâu? | ĐỦ |
| 5 | Skill X có phải skill tối thượng không? | ĐỦ |
| 6 | Skill X gây sát thương diện rộng không? | ĐỦ |
| 7 | Skill X thuộc nguyên tố gì? | ĐỦ |
| 8 | Warrior có skill nào? | ĐỦ |
| 9 | Mỗi class có bao nhiêu skill? | ĐỦ |
| 10 | Skill học ở đâu (NPC nào dạy)? | KHÔNG CÓ |
| 11 | Ascension rank nào mở ở level 500? | ĐỦ |
| 12 | Cây ascension nhánh PvE có node gì? | ĐỦ |
| 13 | Nâng ascension rank tốn bao nhiêu điểm? | ĐỦ |
| 14 | Skill nào mạnh nhất cho class X? | THIẾU (có skill_mult nhưng chưa có reasoning xếp hạng skill) |
| 15 | Có thể đổi/reset skill đã học không? | KHÔNG CÓ |
| 16 | Slot skill tối đa cho mỗi class là mấy? | ĐỦ (qua class-skills-reference.txt) |
| 17 | Skill tiến hoá (evolution) hoạt động thế nào? | ĐỦ (qua class-skills-reference.txt) |
| 18 | Ascension visual effect của rank 1 là gì? | ĐỦ |
| 19 | Mage có skill AOE nào? | ĐỦ |
| 20 | Skill nào dùng để giải CC (crowd control)? | KHÔNG CÓ |

**Tóm tắt Skill:** 15 ĐỦ / 2 THIẾU / 3 KHÔNG CÓ.

---

## 11. CRAFTING

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Craft item X cần nguyên liệu gì? | ĐỦ |
| 2 | Craft item X tốn bao nhiêu vàng? | ĐỦ |
| 3 | Craft item X ở trạm nào (station)? | ĐỦ |
| 4 | Craft item X mất bao lâu? | ĐỦ |
| 5 | Craft item X yêu cầu level mấy? | ĐỦ |
| 6 | Có bao nhiêu công thức chế tạo? | ĐỦ |
| 7 | Gathering (thu thập nguyên liệu) hoạt động thế nào? | ĐỦ |
| 8 | Thu thập nguyên liệu ở đâu? | THIẾU (gathering_guide có mô tả chung, không map theo từng vùng cụ thể) |
| 9 | Có thể chế tạo trang bị Legendary không? | THIẾU (cần tra cứu equipment có source="Craft" + rarity, chatbot chưa hỗ trợ lọc kết hợp) |
| 10 | Trạm chế tạo (Forge...) có mấy loại? | THIẾU (cần liệt kê toàn bộ "station" distinct, hiện chưa có catalog riêng) |
| 11 | Công thức nào tạo ra trang bị set X? | THIẾU |
| 12 | Nguyên liệu hiếm nào cần để craft đồ cao cấp? | THIẾU |
| 13 | Gathering có level giới hạn không? | ĐỦ (qua gathering_guide) |
| 14 | Có thể craft pet equipment không? | KHÔNG CÓ (pet_equipment_db không có liên kết tới crafting_db) |
| 15 | Craft thất bại có mất nguyên liệu không? | KHÔNG CÓ |
| 16 | Số lượng tối đa item ra khi craft 1 lần? | ĐỦ |
| 17 | Crafting có thuế/phí giảm khi vào guild không? | THIẾU (đề cập trong guild_guide nhưng không liên kết số liệu) |
| 18 | Làm sao học thêm công thức chế tạo mới? | KHÔNG CÓ |
| 19 | Chế tạo đồ ăn/potion có khác chế tạo trang bị không? | THIẾU |
| 20 | Crafting có cấp độ thợ chế tạo riêng không? | KHÔNG CÓ |

**Tóm tắt Crafting:** 9 ĐỦ / 8 THIẾU / 3 KHÔNG CÓ.

---

## 12. ECONOMY

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Auction House hoạt động thế nào? | ĐỦ |
| 2 | Auction House tính thuế bao nhiêu? | ĐỦ |
| 3 | Battle Pass có những phần thưởng gì? | ĐỦ |
| 4 | Battle Pass free và premium khác gì? | ĐỦ |
| 5 | VIP có những quyền lợi gì? | ĐỦ |
| 6 | Mua VIP tốn bao nhiêu? | THIẾU (mô tả quyền lợi có, giá cụ thể đã bị lọc nếu mang tính kỹ thuật/monetization) |
| 7 | Có thể giảm thuế Auction House bằng cách nào? | ĐỦ (qua territory buff) |
| 8 | Đổi vàng lấy gì trong shop? | ĐỦ |
| 9 | NPC nào bán bằng tiền premium? | THIẾU |
| 10 | Giá vật phẩm X trên Auction House hiện tại là bao nhiêu? | KHÔNG CÓ (dữ liệu thị trường thời gian thực không có trong KB tĩnh) |
| 11 | Season Coin dùng để làm gì? | ĐỦ (qua battle_pass reward) |
| 12 | Có gacha/quay thưởng không? | KHÔNG CÓ (tài liệu gacha đã bị loại vì là thuật toán nội bộ) |
| 13 | Shop refresh hàng mới khi nào? | ĐỦ |
| 14 | Shop có giới hạn mua mỗi ngày không? | ĐỦ |
| 15 | Làm sao kiếm vàng nhanh? | KHÔNG CÓ |
| 16 | Cosmetic VIP có ảnh hưởng sức mạnh không? | ĐỦ |
| 17 | Lãnh thổ bang hội tạo ra bao nhiêu vàng/giờ? | ĐỦ |
| 18 | Có thể bán vật phẩm cho người chơi khác không? | ĐỦ (qua Auction House) |
| 19 | Trao đổi (trade) trực tiếp giữa người chơi có không? | KHÔNG CÓ |
| 20 | Nguồn thu vàng chính trong game là gì? | THIẾU |

**Tóm tắt Economy:** 11 ĐỦ / 4 THIẾU / 5 KHÔNG CÓ.

---

## 13. EVENT

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Sự kiện thế giới có những loại gì? | ĐỦ |
| 2 | Chợ đêm là sự kiện gì? | ĐỦ |
| 3 | Xâm Lăng Bóng Tối diễn ra khi nào? | ĐỦ |
| 4 | AURORA là sự kiện gì, xuất hiện ở đâu? | ĐỦ |
| 5 | Sự kiện theo mùa (season event) có gì? | ĐỦ |
| 6 | Daily activity có những nhiệm vụ gì? | ĐỦ |
| 7 | Weekly activity thưởng gì? | ĐỦ |
| 8 | Epic guild quest là sự kiện gì? | ĐỦ |
| 9 | Sự kiện hiện tại đang diễn ra là gì? | KHÔNG CÓ (không có lịch sự kiện thời gian thực) |
| 10 | Đánh Cá Lúc Bình Minh là gì? | ĐỦ |
| 11 | Sự kiện nào chỉ diễn ra ban đêm? | ĐỦ |
| 12 | Event nào liên quan housing? | THIẾU |
| 13 | Event theo mùa có ảnh hưởng tới drop rate không? | THIẾU (field gốc đã bị loại vì mang tính công thức) |
| 14 | Lễ hội đặc biệt nào sắp tới? | KHÔNG CÓ |
| 15 | Sự kiện nào cho trang bị giới hạn? | KHÔNG CÓ |
| 16 | Sự kiện trăng non có gì đặc biệt? | ĐỦ |
| 17 | Có sự kiện PvP đặc biệt không? | THIẾU |
| 18 | Sự kiện liên server có không? | KHÔNG CÓ |
| 19 | Sự kiện chào mừng người chơi mới có gì? | KHÔNG CÓ |
| 20 | Event theo thời tiết hoạt động ra sao? | ĐỦ |

**Tóm tắt Event:** 10 ĐỦ / 4 THIẾU / 6 KHÔNG CÓ.

---

## 14. GUILD

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Tạo bang hội cần điều kiện gì? | ĐỦ |
| 2 | Bang hội tối đa bao nhiêu thành viên? | ĐỦ |
| 3 | Các chức vụ trong bang hội là gì? | ĐỦ |
| 4 | Đóng góp bang hội (contribution) qua cách nào? | ĐỦ |
| 5 | Guild coin dùng để làm gì? | ĐỦ |
| 6 | Boss bang hội đánh khi nào? | ĐỦ |
| 7 | Lãnh thổ bang hội mang lại lợi ích gì? | ĐỦ |
| 8 | Chiến tranh bang hội (Guild War) hoạt động thế nào? | ĐỦ |
| 9 | Nhiệm vụ bang hội có mấy loại? | ĐỦ |
| 10 | Quỹ bang hội (Treasury) dùng để làm gì? | ĐỦ |
| 11 | Làm sao gia nhập bang hội? | THIẾU (mô tả tạo bang có, gia nhập bang người khác chưa rõ) |
| 12 | Bang hội có thể bị giải tán không? | KHÔNG CÓ |
| 13 | Cây kỹ năng bang hội (Guild EXP Tree) cho lợi ích gì? | ĐỦ |
| 14 | Một người chơi có thể ở nhiều bang hội không? | KHÔNG CÓ |
| 15 | Elder có quyền gì khác Member? | ĐỦ |
| 16 | Bang hội cấp cao nhất là cấp mấy? | THIẾU (biết khoảng cấp 18-20 nhưng không rõ cấp tối đa chính xác) |
| 17 | Lãnh thổ bang hội tối đa chiếm được bao nhiêu vùng? | ĐỦ |
| 18 | Guild Shop bán gì? | ĐỦ |
| 19 | Tuyên chiến bang hội tốn gì? | ĐỦ |
| 20 | Thắng Guild War được thưởng gì? | ĐỦ |

**Tóm tắt Guild:** 16 ĐỦ / 2 THIẾU / 2 KHÔNG CÓ.

---

## 15. PVP

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | PvP hoạt động ở đâu? | THIẾU |
| 2 | Có đấu trường (arena) không? | THIẾU (NPC arena_master gợi ý có, chưa có mô tả luật chơi) |
| 3 | PvP có xếp hạng (ranking) không? | THIẾU |
| 4 | Thắng PvP được thưởng gì? | THIẾU |
| 5 | Lãnh thổ tranh chấp PvP hoạt động thế nào? | ĐỦ (qua territory_zones) |
| 6 | Guild War tính là PvP không? | ĐỦ |
| 7 | PvP có giới hạn level không? | KHÔNG CÓ |
| 8 | Có thể bị giết ngoài PvP (PK) không? | KHÔNG CÓ |
| 9 | Mùa PvP (season) kéo dài bao lâu? | KHÔNG CÓ |
| 10 | Trang bị PvP riêng có không? | KHÔNG CÓ |
| 11 | PvP 1vs1 có không? | KHÔNG CÓ |
| 12 | Làm sao thách đấu người chơi khác? | KHÔNG CÓ |
| 13 | Vùng nào tranh chấp PvP nhiều nhất? | THIẾU |
| 14 | Có hình phạt khi thua PvP không? | KHÔNG CÓ |
| 15 | PvP có giảm sát thương đặc biệt không? | KHÔNG CÓ |
| 16 | Class nào mạnh trong PvP? | KHÔNG CÓ |
| 17 | Lãnh thổ chiếm được giữ bao lâu trước khi bị tranh lại? | THIẾU |
| 18 | Có leaderboard PvP không? | KHÔNG CÓ |
| 19 | PvP theo nhóm (group PvP) có không? | KHÔNG CÓ |
| 20 | Phần thưởng theo mùa PvP là gì? | KHÔNG CÓ |

**Tóm tắt PvP:** 0 ĐỦ / 5 THIẾU / 15 KHÔNG CÓ. **Đây là nhóm yếu nhất trong toàn bộ KB.**

---

## 16. PVE

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Dungeon nào nên đi ở level X? | ĐỦ |
| 2 | Đánh quái thường để farm exp ở đâu? | ĐỦ |
| 3 | Boss world nào nên đánh trước? | ĐỦ |
| 4 | Raid cần bao nhiêu người? | ĐỦ |
| 5 | Dungeon Elite khác Standard thế nào? | ĐỦ |
| 6 | World Boss đánh theo cơ chế nào (HP theo số người)? | KHÔNG CÓ (formula HP theo player count đã bị loại) |
| 7 | Phần thưởng không chết (no-death bonus) trong dungeon là gì? | ĐỦ |
| 8 | Loot trong dungeon chia thế nào (cá nhân/nhóm)? | ĐỦ |
| 9 | Có bonus khi clear dungeon nhanh không? | ĐỦ |
| 10 | PvE farm vùng nào hiệu quả nhất ở level cao? | THIẾU |
| 11 | Dungeon Tower có gì đặc biệt? | THIẾU (chỉ biết tồn tại loại "tower") |
| 12 | Quái elite trong dungeon rơi gì khác quái thường? | THIẾU |
| 13 | Solo có đánh được World Boss không? | KHÔNG CÓ |
| 14 | Party (nhóm) tối đa bao nhiêu người trong dungeon? | ĐỦ |
| 15 | Đánh PvE có cooldown vào lại dungeon không? | KHÔNG CÓ |
| 16 | Boss PvE nào rơi trang bị set theo vùng? | THIẾU |
| 17 | Có chế độ khó (difficulty) nào trong PvE? | ĐỦ |
| 18 | Party progression (cấp độ nhóm) cho lợi ích gì? | ĐỦ |
| 19 | Mentor system giúp gì cho người chơi PvE mới? | ĐỦ |
| 20 | Offline progress hoạt động ra sao khi không PvE trực tiếp? | ĐỦ |

**Tóm tắt PvE:** 13 ĐỦ / 5 THIẾU / 2 KHÔNG CÓ.

---

## 17. PROGRESSION

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Level tối đa trong game là bao nhiêu? | THIẾU (suy ra ~2000 qua world cuối, không có field "max_level" rõ ràng) |
| 2 | Lên level X cần bao nhiêu EXP? | KHÔNG CÓ (bảng exp chi tiết đã bị loại vì quá kỹ thuật/thô) |
| 3 | Ascension là gì? | ĐỦ |
| 4 | Ascension rank cao nhất là rank mấy? | ĐỦ |
| 5 | Làm sao lên rank ascension nhanh? | THIẾU |
| 6 | Mentor system hoạt động thế nào? | ĐỦ |
| 7 | Làm mentor được thưởng gì? | ĐỦ |
| 8 | Làm đệ tử (apprentice) được lợi gì? | ĐỦ |
| 9 | Catch-up system giúp người chơi mới thế nào? | ĐỦ |
| 10 | Offline progress tính tiến độ ra sao khi không online? | ĐỦ |
| 11 | Party level lên cấp cho bonus gì? | ĐỦ |
| 12 | Có giới hạn EXP nhận mỗi ngày không? | KHÔNG CÓ |
| 13 | Cách lên level nhanh nhất là gì? | KHÔNG CÓ |
| 14 | Daily/Weekly activity giúp progression thế nào? | ĐỦ |
| 15 | Người chơi cũ và mới có cùng tốc độ lên cấp không? | THIẾU |
| 16 | Ascension node "Boss Slayer" cho hiệu ứng gì? | ĐỦ |
| 17 | Cần bao nhiêu điểm để mở 1 node ascension? | ĐỦ |
| 18 | Reset ascension có được không? | KHÔNG CÓ |
| 19 | Tổng cộng có bao nhiêu rank ascension? | ĐỦ |
| 20 | Progression có liên quan gì tới world/level cap theo vùng? | ĐỦ |

**Tóm tắt Progression:** 13 ĐỦ / 3 THIẾU / 4 KHÔNG CÓ.

---

## 18. ACHIEVEMENT

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Achievement có những loại gì? | ĐỦ |
| 2 | Hoàn thành achievement được thưởng gì? | ĐỦ |
| 3 | Title (danh hiệu) có những loại nào? | ĐỦ |
| 4 | Làm sao nhận title X? | ĐỦ |
| 5 | Collection Codex là gì? | ĐỦ |
| 6 | Sưu tập đủ bestiary được thưởng gì? | ĐỦ (qua monster_family bestiary_bonus) |
| 7 | Battle Pass tier cao nhất là tier mấy? | ĐỦ |
| 8 | Có bao nhiêu achievement trong game? | THIẾU (số lượng tổng chưa rõ, chỉ có mô tả nhóm) |
| 9 | Achievement nào khó nhất? | KHÔNG CÓ |
| 10 | Leaderboard mùa hiện tại ai đang dẫn đầu? | KHÔNG CÓ (dữ liệu thời gian thực) |
| 11 | Title có ảnh hưởng chỉ số không hay chỉ cosmetic? | THIẾU |
| 12 | Codex sưu tập theo monster family nào? | ĐỦ |
| 13 | Mua Battle Pass premium có gì hơn free? | ĐỦ |
| 14 | Season Coin đổi được gì? | ĐỦ |
| 15 | Achievement có chia theo độ khó không? | THIẾU |
| 16 | Đạt 100 quái trong bestiary được gì? | ĐỦ |
| 17 | Có achievement ẩn (hidden) không? | KHÔNG CÓ |
| 18 | Title theo season có hết hạn không? | KHÔNG CÓ |
| 19 | Cosmetic Frame trong battle pass nhận ở tier nào? | ĐỦ |
| 20 | Achievement nào liên quan tới Guild? | THIẾU |

**Tóm tắt Achievement:** 12 ĐỦ / 5 THIẾU / 3 KHÔNG CÓ.

---

## 19. LORE

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Cốt truyện vùng Đồng Cỏ (chương 1) là gì? | ĐỦ |
| 2 | The Void là gì trong lore game? | ĐỦ |
| 3 | World Core Fragment dùng để làm gì trong cốt truyện? | ĐỦ |
| 4 | NPC Flora trong lore là ai? | ĐỦ |
| 5 | Boss cuối game (final boss) trong lore là gì? | ĐỦ |
| 6 | Vùng Thần Giới Sáng Thế kể về điều gì? | ĐỦ |
| 7 | Multiverse Gate mở ra nội dung gì hậu game? | ĐỦ |
| 8 | Vương Quốc Kẹo Ngọt có gì đặc biệt trong lore? | ĐỦ |
| 9 | Vì sao thế giới bị Void đe doạ? | ĐỦ |
| 10 | Có bao nhiêu chương cốt truyện chính? | ĐỦ |
| 11 | Lore của vùng Hư Không Vĩnh Diệt là gì? | ĐỦ |
| 12 | Slime đầu tiên xuất hiện ở đâu theo lore? | ĐỦ |
| 13 | Tên các NPC quan trọng trong lore vùng 5 là gì? | ĐỦ |
| 14 | Cốt truyện có liên kết với hệ thống level/world trong game không? | THIẾU (lore dùng mốc level riêng, không khớp số liệu world_remap hiện tại — đã ghi rõ trong HOW_TO_EXTEND) |
| 15 | Vùng nào đối lập về chủ đề với vùng nào (ví dụ ác mộng vs kẹo ngọt)? | ĐỦ |
| 16 | Ai là phản diện chính trong lore? | ĐỦ |
| 17 | Lore có nhắc tới các vị thần không? | ĐỦ |
| 18 | Chương mở rộng (hậu game) nói về điều gì? | ĐỦ |
| 19 | Tên gọi khác của Void là gì? | THIẾU |
| 20 | Lore giải thích vì sao có 21 vùng đất không? | ĐỦ |

**Tóm tắt Lore:** 18 ĐỦ / 2 THIẾU / 0 KHÔNG CÓ. **Nhóm mạnh nhất trong toàn bộ KB.**

---

## 20. PATCH NOTES

| # | Câu hỏi mẫu | Trạng thái |
|---|---|---|
| 1 | Bản cập nhật gần nhất thay đổi gì? | KHÔNG CÓ |
| 2 | Phiên bản hiện tại là bản nào? | KHÔNG CÓ |
| 3 | Sắp tới có nội dung gì mới? | ĐỦ (qua roadmap) |
| 4 | Hệ thống Ascension sẽ mở rộng thế nào? | THIẾU (roadmap chỉ nói chung, không chi tiết) |
| 5 | Có vũ trụ thay thế (alternate universe) nào sắp ra mắt? | ĐỦ |
| 6 | Nội dung level 5000-10000 là gì? | ĐỦ |
| 7 | Bản cập nhật trước đã sửa lỗi gì? | KHÔNG CÓ |
| 8 | Có nerf/buff class nào trong patch gần đây không? | KHÔNG CÓ |
| 9 | Sự kiện mới trong patch tới là gì? | KHÔNG CÓ |
| 10 | Roadmap dài hạn của game là gì? | ĐỦ |
| 11 | Bao giờ ra mắt nội dung hậu game? | KHÔNG CÓ (roadmap không có ngày cụ thể) |
| 12 | Thế giới Dark Slime trong roadmap có gì? | ĐỦ |
| 13 | Có thêm raid/PvP mới trong roadmap không? | ĐỦ |
| 14 | World vô hạn (infinite procedural world) là gì? | ĐỦ |
| 15 | Có thay đổi giá shop trong bản mới nhất không? | KHÔNG CÓ |
| 16 | Trang bị mới ra mắt trong patch nào? | KHÔNG CÓ |
| 17 | Vì sao có bản cập nhật này (lý do thiết kế)? | KHÔNG CÓ |
| 18 | Lịch sử các phiên bản trước đây? | KHÔNG CÓ |
| 19 | Roadmap có nói về cân bằng (balance) không? | KHÔNG CÓ (đã loại nội dung mang tính balance) |
| 20 | Bản mở rộng tiếp theo dự kiến khi nào? | KHÔNG CÓ |

**Tóm tắt Patch Notes:** 7 ĐỦ / 1 THIẾU / 12 KHÔNG CÓ. **Không có patch note thật nào được phát hành — chỉ có roadmap.**

---

## FAQ (bổ sung — không có trong 20 nhóm chính nhưng được yêu cầu giữ lại)

Thư mục `faq/` hiện **trống hoàn toàn (0 file)**. KHÔNG CÓ cho mọi câu hỏi dạng FAQ chung (vd: "Game có miễn phí không?", "Chơi trên thiết bị nào?", "Làm sao liên hệ hỗ trợ?").

---

# BÁO CÁO COVERAGE TỔNG HỢP

| # | Nhóm | ĐỦ | THIẾU | KHÔNG CÓ | % ĐỦ |
|---|---|---|---|---|---|
| 1 | Class | 6 | 6 | 8 | 30% |
| 2 | Item | 11 | 8 | 1 | 55% |
| 3 | Equipment | 14 | 5 | 1 | 70% |
| 4 | Monster | 15 | 4 | 1 | 75% |
| 5 | Boss | 14 | 3 | 3 | 70% |
| 6 | Quest | 13 | 4 | 3 | 65% |
| 7 | NPC | 12 | 5 | 3 | 60% |
| 8 | Map | 15 | 3 | 2 | 75% |
| 9 | World | 14 | 5 | 1 | 70% |
| 10 | Skill | 15 | 2 | 3 | 75% |
| 11 | Crafting | 9 | 8 | 3 | 45% |
| 12 | Economy | 11 | 4 | 5 | 55% |
| 13 | Event | 10 | 4 | 6 | 50% |
| 14 | Guild | 16 | 2 | 2 | 80% |
| 15 | PvP | 0 | 5 | 15 | 0% |
| 16 | PvE | 13 | 5 | 2 | 65% |
| 17 | Progression | 13 | 3 | 4 | 65% |
| 18 | Achievement | 12 | 5 | 3 | 60% |
| 19 | Lore | 18 | 2 | 0 | 90% |
| 20 | Patch Notes | 7 | 1 | 12 | 35% |
| — | FAQ | 0 | 0 | (toàn bộ) | 0% |

**Tổng: 238 ĐỦ / 84 THIẾU / 78 KHÔNG CÓ trên 400 câu hỏi mẫu → ~59.5% trả lời đầy đủ ngay, ~21% trả lời được một phần, ~19.5% không trả lời được.**

**→ Hiện tại CHƯA đạt mục tiêu 90%.**

---

# ĐỀ XUẤT BỔ SUNG ĐỂ ĐẠT ≥90% — KHÔNG cần tiết lộ dữ liệu kỹ thuật

Tất cả đề xuất dưới đây chỉ yêu cầu thêm **dữ liệu mô tả/factual ở mức người chơi nhìn thấy trong game**, không cần công thức/thuật toán nội bộ.

| Ưu tiên | Nhóm | Cần bổ sung | Vì sao |
|---|---|---|---|
| 1 (cao) | PvP | Tạo `guides/pvp_arena_guide.md`: mô tả Arena là gì, có rank/season không, thắng được gì, giới hạn level nếu có. Đây là nhóm 0% ĐỦ. | Không có bất kỳ dữ liệu Arena/PvP ranking nào, chỉ có Territory War. |
| 2 (cao) | Patch Notes | Tạo `patchnotes/patch_YYYY_MM_DD.md` mỗi khi ra bản cập nhật thật (tên bản, ngày, nội dung thay đổi theo góc nhìn người chơi: class buff/nerf, sự kiện mới, lỗi đã sửa). | Hiện chỉ có roadmap tương lai, không có patch đã phát hành. |
| 3 (cao) | FAQ | Tạo `faq/faq.json`: 20-30 câu hỏi/đáp ngắn (miễn phí không, chơi trên thiết bị gì, làm sao liên hệ hỗ trợ, đổi mật khẩu, mất tài khoản liên hệ đâu...). | Thư mục hiện đang trống 100%. |
| 4 | Class | Tạo `guides/class_overview_guide.md`: với mỗi class (Warrior/Mage/Archer/Ranger) — 1 đoạn mô tả lối chơi, vai trò (tank/dps/support), vũ khí chính, gợi ý phù hợp PvE hay PvP. | Hiện chỉ suy luận được class qua field dữ liệu thô, không có mô tả lối chơi. |
| 5 | Crafting | Bổ sung field `"available_at"` (danh sách station) dạng catalog riêng `crafting/stations_guide.md`, và với mỗi station ghi loại đồ chế tạo được ở đó. | 8/20 câu THIẾU vì không có catalog trạm chế tạo riêng. |
| 6 | Economy | Bổ sung `shops/currency_guide.md`: liệt kê toàn bộ loại tiền trong game (Gold, Season Coin, Guild Coin, premium currency...) và cách kiếm/dùng mỗi loại — KHÔNG cần giá trị nạp tiền thật (tránh lộ thông tin monetization nhạy cảm), chỉ cần mô tả tính năng. | 5/20 KHÔNG CÓ vì thiếu tổng quan hệ thống tiền tệ. |
| 7 | Event | Bổ sung `worlds/event_calendar_guide.md`: lịch các sự kiện lặp lại theo tuần/mùa (không cần ngày chính xác máy chủ, chỉ cần "diễn ra vào cuối tuần", "diễn ra theo mùa X"). | 6/20 KHÔNG CÓ vì thiếu khung lịch sự kiện. |
| 8 | Quest | Bổ sung khả năng reasoning "quest tiếp theo" (suy ra từ `prereq_quest_id` đảo ngược) — đây là việc CODE chatbot, không cần thêm dữ liệu. | 1 câu hỏi rất phổ biến ("nhiệm vụ tiếp theo là gì") hiện chưa trả lời được dù dữ liệu đã đủ. |
| 9 | Item/Equipment/Boss | Bổ sung `drops/loot_tables.json` (ánh xạ `drop_table` ID → tên vật phẩm, KHÔNG cần tỉ lệ % rơi cụ thể nếu muốn giữ bí mật cân bằng). | Đây là lỗ hổng lớn nhất xuyên suốt nhiều nhóm (Item #6,#10,#16; Boss #5,#15; Monster #4). |
| 10 | Achievement | Bổ sung tổng số lượng achievement/title hiện có (chỉ cần 1 con số + danh sách tên, không cần điều kiện chi tiết nếu muốn giữ bí mật). | 3/20 KHÔNG CÓ vì thiếu con số tổng quan. |
| 11 | NPC | Với mỗi NPC, bổ sung 2-3 câu hội thoại mẫu (không cần full dialogue tree) để trả lời "NPC nói gì". | Hiện chỉ có 1 câu `dialog_root`. |
| 12 | Progression | Bổ sung 1 con số duy nhất: "Level tối đa hiện tại là X" (không cần bảng exp chi tiết). | Nhiều câu hỏi giả định biết level cap mà KB hiện không công bố rõ. |

**Nếu bổ sung đủ 12 mục trên (đặc biệt ưu tiên 1-4), coverage ước tính sẽ tăng từ ~59.5% lên khoảng 90-93%** — vì các mục ưu tiên cao giải quyết trọn vẹn nhóm PvP (0%→~70%) và Patch Notes (35%→~80%), đồng thời mục #9 (loot tables) sửa lỗi lặp lại ở 4 nhóm khác nhau cùng lúc.

## Việc KHÔNG cần làm (để giữ bí mật/cân bằng game)
- KHÔNG cần công khai tỉ lệ rơi đồ (%) cụ thể, chỉ cần TÊN vật phẩm trong bảng rơi đồ.
- KHÔNG cần công khai giá nạp tiền thật (VNĐ/USD) của VIP/Battle Pass, chỉ cần mô tả quyền lợi.
- KHÔNG cần công khai công thức sát thương, power budget, hay logic balance — những phần này đã được loại bỏ đúng theo yêu cầu và NÊN tiếp tục giữ vậy.
