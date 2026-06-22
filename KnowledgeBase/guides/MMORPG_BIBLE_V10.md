# 🟢 SLIME MMORPG — MASTER REBUILD BIBLE V10
> Thiết kế lại toàn bộ thành sản phẩm thương mại vận hành 5–10 năm.
> Nguyên tắc tối thượng: **Không P2W · Không Power Creep · Damage có trần · Mọi hệ thống có mục đích & tương tác.**

**Quyết định kiến trúc nền tảng (đọc trước tiên):**
1. **Max Level = 2000** (cố định). 21 biome trong tài liệu gốc trải Lv 1–5000 đã được **nén về Lv 1–2000** (xem `data/biome_remap.csv`). Cảm giác "vượt 2000" được chuyển sang **Ascension** (25 rank) thay vì level vô hạn.
2. **Diệt power creep từ gốc:** thay vì các hệ số **nhân chồng tự do** (bản cũ: Rarity ×5 × Enhance ×3.4 × Star ×4.2 × Gem ×8 ≈ **×571**), mọi nguồn sức mạnh chuyển thành **% cộng dồn trong một Power Budget có trần 100%**, không hệ nào > 35%.
3. **Damage có trần cứng theo level.** Đòn cơ bản = sàn band; ultimate+crit+element+boss = trần band; **tích các hệ số tình huống bị chặn = cap/floor**. Đã verify toàn bộ trong `data/damage_verification.csv` — **không level nào vượt cap**.

---

# PHẦN 1 — AUDIT REPORT (CHẤM ĐIỂM HỆ THỐNG HIỆN TẠI)

Thang điểm: **S** = giữ nguyên, trụ cột · **A** = tốt, tinh chỉnh nhẹ · **B** = cần sửa · **C** = lỗi nặng, thiết kế lại · **F** = nguồn power creep/P2W, đại tu hoặc bỏ.

| # | Hệ thống (tài liệu gốc) | Điểm | Vấn đề chính | Hành động |
|---|---|---|---|---|
| 1 | 3 Class (W/A/M) + scale/level | **A** | Vai trò rõ, nhưng stat/level tuyến tính → không đạt được band damage Lv2000 | Giữ vai trò, thay đường cong base bằng `progression_1_2000.csv` |
| 2 | Skill 5/class + Evolution | **A** | Tốt; multiplier ultimate 500–1200% sẽ phá cap nếu nhân chồng | Giữ skill, **chặn SkillMult ≤ 3.0** (ult), gộp vào trần tình huống |
| 3 | Chuyển sinh (9 mốc) | **B** | Trùng khái niệm với Ascension; chỉ là "đổi tên class" | Gộp: Chuyển sinh = nhánh kỹ năng tới Lv2000; Ascension = endgame |
| 4 | Trang bị 6 rarity + 7 slot | **A** | Tốt; rarity multiplier ×1→×5 quá dốc | Mở rộng 11 slot + rarity **Genesis**, multiplier cap ×2.8 |
| 5 | **Cường hóa +20 (×3.4)** | **C** | Nhân chồng với sao/ngọc → creep | Chuyển sang **% cộng** trong budget Enhancement 10% |
| 6 | **Tăng sao ★10 (×4.2)** | **C** | Như trên, nhân chồng | Gộp Enhancement+Star thành 1 trục %, trần chung |
| 7 | Kế thừa chỉ số | **A** | Cơ chế hay, sink tài nguyên tốt | Giữ, đưa vào kinh tế |
| 8 | **Khảm ngọc (Gem ×8)** | **C** | ×8 nhân chồng = creep lớn nhất | Gem value cap **×1.18^lv** (không ×8); budget gem nằm trong Equipment |
| 9 | Cánh (×200% + sao) | **C** | +200% nhân chồng | Wing budget **cap 4%** total power |
| 10 | Pet (Transcendence +500%) | **C** | +500% phá balance | Pet budget **cap 6%** |
| 11 | Soul/Triệu hồi quái | **A** | Cơ chế farm + sink Soul tốt | Giữ, là currency loop lõi |
| 12 | Quái/Map scale (World ×1000 HP) | **B** | ×1000 HP ok nhưng cộng dồn evolution → vô hạn | Cap boss HP theo `boss_db.csv` (≤ vài tỷ) |
| 13 | Guild Soul Research (+30% mỗi stat) | **B** | +30% vượt budget Guild 2% | Hạ về **+2% total power**, bonus còn lại đổi sang tiện ích |
| 14 | PvP (giảm hidden 50%) | **A** | Có tách PvP modifier — tốt | Giữ, thêm bracket theo CR |
| 15 | Bestiary/Collection (+20% mỗi stat) | **C** | +20%×nhiều = creep ẩn | Cap Collection **3%**, Achievement **2%** total |
| 16 | Tiền tệ (4 loại) | **B** | Thiếu sink mạnh & currency endgame/season | Bổ sung sink + Season/Territory currency |
| 17 | Housing/Life/Social | **A** | Nội dung giữ chân tốt | Giữ, gắn buff nhẹ (≤1%) |
| 18 | Excellent/Lucky/Hidden stat | **B** | Random stat tốt nhưng không có trần tổng | Đưa vào budget "Other 2%" |

**Tổng kết audit:** Khung nội dung **rất tốt (A)**; **lỗi chí mạng nằm ở tầng power-math**: 6 hệ thống nâng cấp (Enhance, Star, Gem, Wing, Pet, Collection) đều **nhân chồng** → đó là 100% nguyên nhân của "damage tỷ tỷ" và "boss HP triệu tỷ". Bible này **không xóa nội dung nào**, chỉ **thay tầng toán** bên dưới.

---

# PHẦN 2 — MISSING SYSTEMS (HỆ THỐNG CÒN THIẾU)

| Hệ thống thiếu | Vì sao cần cho vòng đời 5–10 năm |
|---|---|
| **Power Budget tổng** | Không có → không thể chống creep. Đây là xương sống mới (Phần dưới). |
| **Catch-Up / Returning Loop** | Người chơi cũ quay lại bị bỏ xa → phải có scaling catch-up. |
| **Season Architecture đầy đủ** | Có "season" nhưng thiếu currency/reset/reward track. |
| **Territory War kinh tế** | Có tên, thiếu currency & vòng lặp tranh chấp. |
| **Cross-Server matchmaking** | Cần cho PvP/Raid khi server thưa người. |
| **Infinite Endgame có cap** | Abyss/Mythic+ cần scaling vô hạn nhưng **reward có trần** (tránh creep). |
| **Anti-Bot / Anti-RMT kinh tế** | Bắt buộc để bảo vệ AH 5+ năm. |
| **Battle Pass / Cosmetic pipeline** | Nguồn doanh thu duy nhất hợp lệ (không P2W). |
| **Build Preset / Loadout** | Cần để hệ thống sâu không gây "ma sát" mỗi lần đổi build. |
| **Mentor/Apprentice reward loop** | Có ý tưởng, thiếu vòng thưởng giữ chân 2 phía. |

---

# PHẦN 3 — REDUNDANT SYSTEMS (HỆ THỐNG TRÙNG/THỪA)

| Trùng lặp | Xử lý |
|---|---|
| **Chuyển Sinh ⟷ Ascension** | Gộp: Chuyển sinh = mốc kỹ năng (Lv1–2000), Ascension = vòng endgame (sau 2000). |
| **Cường hóa ⟷ Tăng sao** | Gộp thành **1 trục "Gear Upgrade"** (% cộng), 2 nhánh chỉ khác nguyên liệu & VFX. |
| **Bestiary ⟷ Collection ⟷ Pet Index** | Gộp dưới **Collection Hall** chung, mỗi tab cap riêng để tổng ≤ 5%. |
| **Nhiều loại "Lucky stat" rời rạc** | Gộp vào **Hidden Stat pool** (budget Other 2%). |
| **Guild Research 9 nhánh +30%** | Rút còn 4 nhánh tiện ích + 1 nhánh combat (cap 2%). |
| **Soul Shop ⟷ Dungeon Coin ⟷ Event Coin** | Giữ riêng currency nhưng **chung 1 UI Shop Hub** để giảm phình. |

> **Nguyên tắc:** không bỏ trải nghiệm, chỉ bỏ **trùng lặp toán học** gây creep và **gộp UI** để dễ vận hành nhiều năm.

---

# PHẦN 4 — MMORPG ARCHITECTURE (CÁC VÒNG LẶP)

**Mục đích:** mỗi cấp thời gian có lý do để online; không có nội dung "chơi 1 lần rồi bỏ".

### A. New Player Loop (D0–D3)
Chọn class → tutorial chiến đấu → Biome 1 (Lv1–56) → mở Skill 1 → mở Pet đầu → mở Enhance cơ bản → boss Vua Slime. **Mục tiêu:** chạm 5 hệ thống lõi trong 60 phút đầu.

### B. Daily Loop
| Hoạt động | Reward | Sink |
|---|---|---|
| 3 Daily Dungeon | Gold, Enhance Stone | Stamina |
| Daily Boss (Soul) | Soul currency | Soul triệu hồi |
| 1 Daily Quest chain | EXP, Season Coin | — |
| Life Skill (gather/craft) | Material, Buff Food | Stamina nghề |
| Auction check | Gold flow | AH tax 5% |

### C. Weekly Loop
Guild Raid (1 lần/tuần) · Mythic+ key clear · Weekly Modifier mới · PvP placement · Territory skirmish · Weekly Quest (thưởng Mythic Stone giới hạn).

### D. Monthly Loop
Rank reset (PvP/Arena) · Monthly event · Battle Pass tier mới · Collection milestone · Mentor graduation cycle.

### E. Seasonal Loop (90 ngày)
Season currency mở → Season track → Season Boss (affix xoay) → Season Ranking → reset mềm (giữ tiến độ vĩnh viễn, reset ranking) → cosmetic độc quyền season.

### F. Endgame Loop (sau Lv2000)
Ascension AR1→AR25 · Abyss Rift (vô hạn, reward có trần) · Endless Tower · Cross-Server Ranking · World Boss damage leaderboard · Server First.

### G. Returning Player Loop
"Welcome Back" scaling: nhận **Catch-Up Token** = (CR_top_server − CR_bạn) → đổi nhanh gear ngang **80% meta** (không 100% → vẫn tôn trọng người chơi liên tục). Quest tóm tắt cốt truyện đã bỏ lỡ.

### H. Catch-Up Loop
Người mới vào server cũ: EXP curve **nén theo tuổi server** (server 2 năm tuổi → EXP ×0.4 tới Lv của biome trước biome mới nhất). Gear tier cũ **drop rate ×3**. **Không bán catch-up bằng tiền** (chống P2W).

---

# PHẦN 5 — COMBAT ARCHITECTURE

**Mục đích:** công thức cho ra đúng band damage V10 và **không bao giờ vượt cap**.

### 5.1 Công thức đòn cuối (chuẩn V10)
```
FinalDamage = ATK_total
            × SkillMult            // basic 1.0 · core ≤1.6 · ultimate ≤3.0
            × CritMult             // 1.0 hoặc (1 + CritDmg), CritDmg cap +100% → ≤2.0
            × ElementMult          // 1.0 .. ≤1.4 (khắc hệ)
            × ContextMult          // PvE boss ≤1.3 · PvP = 0.5 (riêng PvP-dmg không giảm)
            × (1 − DefMitigation)  // theo công thức 5.4
RÀNG BUỘC CỨNG: SkillMult×CritMult×ElementMult×ContextMult ≤ SituationalCap(level)
SituationalCap(level) = DamageCap(level) / DamageFloor(level)   // 4.0 → 10.0
```
`ATK_total(level)` lấy từ `progression_1_2000.csv` (đã hiệu chỉnh để **basic = sàn band**).

### 5.2 Chỉ số & cách tính
| Stat | Vai trò | Công thức/Trần |
|---|---|---|
| Attack / MATK | nguồn damage | base(level)×(1+Σ%budget) |
| Defense | giảm damage | DefMit = DEF/(DEF + K·Level) |
| HP | TTK | base×18 (xem progression) |
| Crit Rate | xác suất crit | cap **75%** |
| Crit Damage | hệ số crit | cap **+100% (×2.0)** |
| Accuracy/Evasion | hit/miss | Evasion cap **60%** |
| Block | chặn % damage | cap **40%** |
| Penetration | bỏ qua DEF | cap **60%** |
| Skill Damage | +% skill | nằm trong budget, cap góp **+20%** |
| Boss/PvP/Element Dmg | context | Boss ≤1.3 · Element ≤1.4 · PvP riêng |

### 5.3 Công thức giảm DEF (chống "vô hạn HP/DEF")
```
DefMitigation = DEF / (DEF + 50 × Level)     // tiệm cận, max ~75%
EffectiveDmg  = RawDmg × (1 − DefMitigation) × (1 + Penetration_bypass)
```
→ DEF cao **giảm dần hiệu quả** (đường cong bão hòa) ⇒ không ai bất tử, không cần HP triệu tỷ.

### 5.4 Damage Verification (trích `damage_verification.csv`)
| Level | basic (sàn) | ult+crit | ULT+crit+elem+boss (MAX) | Cap | Kết quả |
|---|---|---|---|---|---|
| 1 | 5 | — | 20 | 20 | ✅ |
| 100 | 100 | ~300 | 500 | 500 | ✅ |
| 500 | 1.000 | ~3.000 | 5.000 | 5.000 | ✅ |
| 1000 | 10.000 | ~30.000 | 50.000 | 50.000 | ✅ |
| 1500 | 50.000 | ~120.000 | 200.000 | 200.000 | ✅ |
| 2000 | 500.000 | ~2.700.000 | 5.000.000 | 5.000.000 | ✅ |

**Không level nào vượt cap** — vì tích hệ số tình huống bị chặn bằng `SituationalCap`.

### 5.5 Tác động
- **PvE:** số damage "đọc được", boss HP ở mức triệu→tỷ (TTK 30–120s), không màn hình toàn số.
- **PvP:** ContextMult 0.5 + cap crit/pen → TTK 8–20s, kỹ năng > chỉ số; không one-shot.
- **Kinh tế:** vì sức mạnh = % budget, "mua thêm damage" bất khả → bảo vệ no-P2W.
- **Tuổi thọ:** band cố định theo level ⇒ mọi bản mở rộng (biome/season) **không thể** đẩy damage ra ngoài khung → meta ổn định nhiều năm.

---

# PHẦN 6 — PROGRESSION ARCHITECTURE

**Mục đích:** đường cong Lv1–2000 mượt, có soft/hard cap, kèm Ascension endgame.

### 6.1 Bảng tiến trình (trích `progression_1_2000.csv` — đầy đủ 2000 dòng)
| Lv | EXP/next | EXP cộng dồn | ATK_total | HP base | Combat Rating | Cap |
|---|---|---|---|---|---|---|
| 1 | 50 | 50 | 5 | 36 | 5 | — |
| 100 | 62.950 | 2.5M | 100 | 720 | 100 | SOFT(250) |
| 500 | 762.730 | 150M | 1.000 | 7.200 | 1.000 | SOFT |
| 1000 | 2.23M | 877M | 10.000 | 72.000 | 10.000 | SOFT |
| 1500 | 6.70M | 2.99B | 50.000 | 360.000 | 50.000 | SOFT |
| 2000 | 19.6M | 8.53B | 500.000 | 3.6M | 500.000 | **HARD** |

- **EXP curve:** `50 × Lv^1.55 × band`; band dày thêm sau Lv1000 (×0.6) và Lv1500 (×2.0) → endgame chậm có chủ đích.
- **Soft cap** mỗi 250 level (ngưỡng EXP tăng) · **Hard cap** Lv2000.
- **Catch-Up curve:** xem Phần 4-H (EXP ×0.4 cho biome cũ theo tuổi server).

### 6.2 Ascension (thay "level vô hạn") — `ascension_ranks.csv`
| Rank | Mở khóa | +% power (mỗi) | Cộng dồn | Skill point | Essence cost |
|---|---|---|---|---|---|
| AR1 | Đạt Lv2000 | 0.6% | 0.6% | 2 | 500 |
| AR10 | AR9 + Trial 10 | 0.6% | 6.0% | 2 | ~3.700 |
| AR25 | AR24 + Trial 25 | 0.6% | **15.0%** | 2 | ~132.000 |

- **25 rank** (> yêu cầu 20). Tổng chỉ **+15% power** → nằm gọn trong budget, **không creep**.
- **Ascension Skill Tree:** mỗi rank +2 điểm → mở passive (chọn nhánh: PvE/PvP/Life/Economy). Build đa dạng, không cộng damage thô.
- **Ascension Currency:** *Ascension Essence* (từ Abyss/Raid endgame) — **không bán bằng tiền thật**.

### 6.3 Tác động
- **PvE:** Lv2000 là đích rõ ràng; Ascension cho mục tiêu "ngang" (horizontal) nhiều năm.
- **PvP:** AR cap 15% ⇒ người AR25 mạnh hơn nhưng **không áp đảo** người Lv2000 AR0 (khoảng cách kỹ năng vẫn quyết định).
- **Kinh tế:** Essence là sink endgame lớn (chống lạm phát Gold cuối game).
- **Tuổi thọ:** mở thêm AR rank theo năm = endgame "vô hạn có kiểm soát".

---

# PHẦN 7 — ECONOMY ARCHITECTURE

**Mục đích:** kinh tế tự cân bằng 5–10 năm; chống lạm phát, chống bot, chống thao túng AH.

### 7.1 Bản đồ Source ↔ Sink
| Tài nguyên | Source (phát sinh) | Sink (tiêu hao) | Cân bằng |
|---|---|---|---|
| **Gold** | Drop quái, quest, bán NPC | Enhance, craft, sửa đồ, AH tax, Star, Inherit | Sink phải ≥ 95% source (đo hàng tuần) |
| **Soul** | Quái theo loại | Triệu hồi quái, Soul Shop | Vòng kín, tự cân |
| **Material** | Gather, dungeon, drop | Craft, upgrade | Recipe điều tiết |
| **Gem (Kim Cương)** | **Chỉ nạp + event + battlepass** | Cosmetic, convenience, slot | KHÔNG mua power |
| **Season/Territory Coin** | Hoạt động mùa/lãnh thổ | Shop mùa (cosmetic/consumable) | Reset mỗi mùa |

### 7.2 Công thức sink chống lạm phát
```
RepairCost   = ItemPower × 0.02 × DurabilityLost
EnhanceGold  = BaseCost × 1.4^Level         (đường cong cũ — giữ, vì là sink tốt)
AH_Tax       = 5% giá bán (đốt khỏi nền kinh tế)
GoldSinkRatio (mục tiêu) = TotalSink / TotalSource ≥ 0.95 mỗi tuần
```
LiveOps theo dõi `GoldSinkRatio`; nếu < 0.9 → kích hoạt **Gold Sink Event** (skin giá Gold, craft đặc biệt).

### 7.3 Chống thao túng AH
- **Giá sàn/giá trần động** theo median 7 ngày (chặn list 1 gold để rửa / list 10^9 để khóa thị trường).
- **Phí list + phí tax** → tăng chi phí thao túng.
- **Soulbound** cho item nâng cấp cao (không bán được sau khi enhance) → giảm RMT.

### 7.4 Chống Bot Farm
- Drop **diminishing returns** theo thời gian farm 1 spot (giảm 50% sau 2h liên tục cùng tọa độ).
- **Server-side combat validation** + rate-limit hành động.
- **Behavior fingerprint** (đường đi, timing) → flag bot.

### 7.5 Chống Whale Advantage
- Vì power = % budget có trần, **whale không thể vượt trần**. Tiền chỉ **rút ngắn thời gian** đạt trần, không vượt nó.
- Endgame gating bằng **thời gian + kỹ năng** (Ascension Essence không bán).

---

# PHẦN 8 — ITEM ARCHITECTURE

**Mục đích:** 3000+ item, mỗi item có nguồn & vai trò; không item "rác".
**Database thật:** `data/item_db.csv` — **3.561 item** đã sinh.

### 8.1 Schema
`id · name · type · stack · source · description`

### 8.2 Phân loại (đã sinh đầy đủ)
| Type | Số lượng | Vai trò vòng đời |
|---|---|---|
| Material (21 biome) | 252 | Craft/upgrade theo vùng |
| Gem (108 loại×10 cấp rút gọn → 37×10) | 370 | Khảm — **value cap ×1.18^lv** |
| Enhance/Star/Inherit Stone | ~20 | Sink nâng cấp |
| Consumable/Buff | ~90 | Daily loop |
| Currency | 17 | Mỗi loop một currency |
| Life Skill output | ~480 | Nghề + kinh tế |
| Gathering Resource | ~525 | Nguyên liệu nghề |
| Quest Item | 315 | 21 biome quest |
| Housing Item | 75 | Social/giữ chân |
| Cosmetic/Skin/Fragment | ~565+ | **Nguồn doanh thu** |
| Collection/Achievement | ~330 | Endgame ngang |

### 8.3 Tác động
PvE: mọi drop có đích đến (craft/upgrade/collection). Kinh tế: material = xương sống AH. Tuổi thọ: thêm biome = thêm material tier mà **không phá** item cũ (vẫn dùng cho catch-up/craft).

---

# PHẦN 9 — EQUIPMENT ARCHITECTURE

**Mục đích:** 1000+ trang bị + set, mọi món nằm trong budget Equipment **35%**.
**Database thật:** `data/equipment_db.csv` — **1.521 item** (11 slot × 6 rarity × 40 band level).

### 9.1 Slot & % đóng góp (tổng = budget Equipment 35%)
| Slot | %trong gear pool | Stat ưu tiên |
|---|---|---|
| Weapon | 35% | ATK/Crit |
| Armor | 20% | HP/DEF |
| Helmet | 10% | HP/DEF |
| Gloves | 10% | ATK speed |
| Boots | 10% | Move/DEF |
| Belt | 5% | HP |
| Ring×, Necklace | 7.5% mỗi | special |
| Artifact/Relic/Charm | 3/2/1% | endgame substat |

### 9.2 Rarity ANTI-CREEP (thay ×1→×5 cũ)
| Rarity | Multiplier mới | Affix | Gate Level |
|---|---|---|---|
| Common | ×1.00 | 1 | 1 |
| Rare | ×1.25 | 2 | 150 |
| Epic | ×1.55 | 3 | 300 |
| Legendary | ×1.90 | 4 | 600 |
| Mythic | ×2.30 | 5 | 1000 |
| **Genesis** | ×2.80 | 6 | 1400 |
→ chênh Common→Genesis chỉ **×2.8** (không ×5). Khoảng cách thu hẹp ⇒ no creep, gear cũ vẫn dùng được.

### 9.3 Gear Upgrade (gộp Enhance + Star, budget Enhancement 10%)
```
GearBonus% = Σ(enhance_levels) trong đó tổng %Enhancement ≤ 10% total power
```
Enhance & Star giờ là **2 nhánh VFX** của cùng 1 trục %, **không nhân chồng nhau**.
Tỉ lệ thành công/pity/đá nâng: **giữ nguyên bảng cũ** (là sink & cảm xúc tốt) — chỉ đổi *kết quả* từ "nhân hệ số" sang "+% trong trần".

### 9.4 Set Bonus
100+ set (`set_id` trong db). Bonus 2/4/8 món = **tiện ích & %nhỏ** (không cộng damage thô vượt budget). Ví dụ: "Slime Genesis 8/8: +1 nảy đòn AoE, +5% Boss Dmg (trong cap 1.3)".

### 9.5 Tác động
PvP: vì rarity cap ×2.8, người đồ Legendary vẫn đấu được người Mythic. Tuổi thọ: mỗi biome mới thêm 1 band gear, **không vượt band damage**.

---

# PHẦN 10 — SOCIAL ARCHITECTURE

| Hệ thống | Mục đích | Vòng lặp | Phần thưởng (no power thô) |
|---|---|---|---|
| **Party Progression** | thưởng chơi nhóm | EXP/drop +% khi party | Party level → cosmetic + tiện ích |
| **Friend** | giữ chân xã hội | quà hằng ngày, co-op | Social point → shop tiện ích |
| **Mentor/Apprentice** | giữ chân 2 phía | đệ tử lên cấp → cả 2 nhận Mentor Point | Mentor Shop: skin, mount, title |
| **Housing** | sáng tạo + nghỉ | farm/decorate/trophy | Housing buff ≤1% (budget Housing) |
| **Collection Hall** | sưu tầm dài hạn | bestiary/pet/lore | cap **3%** total (gộp 3 tab) |
| **Server First/Hall of Fame** | danh vọng | đua mốc đầu tiên | Title + cosmetic vĩnh viễn (không power) |
| **Cross-Server** | dân số PvP/Raid | matchmaking theo CR | ranking + cosmetic |

**Tác động tuổi thọ:** xã hội là "chất keo" giữ người chơi khi đã max gear — họ ở lại vì *cộng đồng*, không vì *số damage*.

---

# PHẦN 11 — GUILD ARCHITECTURE

**Mục đích:** guild là đơn vị endgame, nhưng bonus **≤ 2% total power** (budget Guild).

### 11.1 Tính năng
Guild Shop · Guild Quest · Guild Boss/Raid · Guild Base (farm/mine thụ động) · Guild Research (rút còn 5 nhánh).

### 11.2 Guild Research (sửa từ +30% → cap 2%)
| Nhánh | Bonus | Loại |
|---|---|---|
| Combat | +2% total power (cap) | power (trong budget) |
| Economy | +20% Gold drop guild | tiện ích (không power) |
| Soul Mastery | +20% Soul drop | tiện ích |
| Logistics | giảm 10% craft cost | sink-helper |
| Multiverse | mở Guild Raid tier mới | nội dung |

### 11.3 Contribution & sink
Soul/Material đóng góp → Guild Point (sink cá nhân → buff guild). Guild Coin chỉ mua **tiện ích/cosmetic**.

**Tác động:** PvP guild (Territory) tạo xung đột dài hạn; kinh tế guild là **sink material lớn**.

---

# PHẦN 12 — TERRITORY ARCHITECTURE

**Mục đích:** xung đột PvP/kinh tế tái diễn vô hạn (nội dung không "1 lần").

### 12.1 Cơ chế
Bản đồ lãnh thổ cross-server, mỗi vùng có **buff tiện ích** (giảm tax AH, +Gold drop vùng) — **không buff power thô**. Guild tranh chấp theo lịch tuần (Territory War).

### 12.2 Territory Currency
Thắng/giữ vùng → *Territory Coin* → mua cosmetic, consumable, decay-resource. Coin **decay** nếu mất vùng ⇒ phải giữ liên tục ⇒ nội dung tái diễn.

### 12.3 Tác động
PvP: mục tiêu tập thể dài hạn. Kinh tế: vùng kiểm soát tài nguyên ⇒ AH liên server biến động. Tuổi thọ: bản đồ mở rộng theo năm; xung đột không bao giờ "xong".

---

# PHẦN 13 — ENDGAME ARCHITECTURE

**Mục đích:** người chơi sau 2 năm vẫn còn mục tiêu; nội dung vô hạn **nhưng reward có trần**.

| Nội dung | Cơ chế | Scaling | Reward (có trần) |
|---|---|---|---|
| **Abyss Rift** | tầng vô hạn, độ khó +x% mỗi tầng | vô hạn | Ascension Essence (decay rank weekly) |
| **Infinite Dungeon** | random affix mỗi run | vô hạn | Material + cosmetic, **không gear vượt band** |
| **Mythic+** | key tier, affix tuần | tới M+30 | Mythic Stone giới hạn/tuần |
| **Endless Tower** | leo tầng, mini-boss/10 | vô hạn | Title, cosmetic theo mốc |
| **World Boss** | server-wide, evolution chậm | HP cap (boss_db) | damage leaderboard → cosmetic |
| **Season Ranking** | reset 90 ngày | — | cosmetic mùa độc quyền |
| **Cross-Server Ranking** | đua liên server | — | frame/aura/title |
| **Territory War** | tranh vùng tuần | — | Territory Coin |

**Nguyên tắc chống creep endgame:** scaling khó **vô hạn**, nhưng phần thưởng power **bão hòa** — sau khi đạt trần budget, reward chuyển 100% sang **cosmetic/prestige**. Đây là chìa khóa giữ game sống mà không vỡ balance.

**Tác động tuổi thọ:** "đường chân trời" luôn lùi xa (rank, leaderboard, prestige) trong khi "trần sức mạnh" đứng yên → cạnh tranh mãi mãi, balance mãi mãi.

---

# PHẦN 14 — LIVEOPS ARCHITECTURE

**Mục đích:** lịch nội dung 12/24/36 tháng, mỗi nhịp có lý do quay lại.

### 14.1 Khung event
| Chu kỳ | Event | Reward |
|---|---|---|
| Weekly | Modifier xoay, Gold Sink event | consumable, coin |
| Monthly | Theme event + Battle Pass mới | cosmetic track |
| Festival/Holiday | Halloween/Noel/Tết/Hè | skin mùa lễ |
| Seasonal | Season Boss + track 90 ngày | cosmetic độc quyền |
| Server First | mở biome/boss mới | Hall of Fame |
| Cross-Server | giải đấu liên server | prestige |

### 14.2 Lịch 36 tháng (tóm tắt)
| Mốc | Nội dung lớn | Mục tiêu |
|---|---|---|
| **M0–3** | Launch: Biome 1–11, Lv1–900, PvP Arena, Guild | onboarding, D30 retention |
| **M4–6** | Biome 12–17, Mythic+, Territory War | mid-game depth |
| **M7–12** | Biome 18–21, Lv2000, Ascension AR1–10, Cross-Server | endgame mở |
| **M13–18** | Season 1–2, Abyss Rift, Housing 2.0, AR11–15 | giữ chân năm 1 |
| **M19–24** | Expansion 1: +biome cosmetic-tier, AR16–20, raid mới | tái kích hoạt |
| **M25–36** | Expansion 2: cross-server territory, AR21–25, prestige system | vòng đời năm 3 |

**Nguyên tắc:** mọi expansion **thêm nội dung ngang & cosmetic**, không đẩy band damage/level cap (giữ 2000). Meta cũ không chết — chỉ thêm lựa chọn.

---

# PHẦN 15 — MONETIZATION ARCHITECTURE (NO P2W)

**Chỉ được bán:** Cosmetic · Battle Pass · Convenience. **Cấm:** power, gear, mythic, ascension, PvP/boss advantage.

| Sản phẩm | Loại | Vì sao không P2W |
|---|---|---|
| Skin (weapon/armor/wing/mount/pet/aura) | Cosmetic | 0 stat |
| Skill Effect Skin | Cosmetic | chỉ VFX (doanh thu lớn cho game 2D) |
| Dye / Frame / Title | Cosmetic | 0 stat |
| **Battle Pass** | track | thưởng cosmetic + currency **kiếm được free**, không gear vượt band |
| Stamina refill, bag slot, AH slot, auto-path | Convenience | tiết kiệm thời gian, **không vượt trần power** |
| Cosmetic gacha (Mảnh Skin) | Cosmetic | pity, chỉ ngoại hình |

**Ranh giới đỏ:** Gem (nạp) **không bao giờ** đổi được Enhance/Star/Gem-combat/Ascension Essence/Mythic Stone gắn power. Mọi power **chỉ** từ chơi.

**Tác động:** doanh thu ổn định từ thẩm mỹ + tiện ích; cộng đồng PvP/PvE công bằng ⇒ giữ chân & danh tiếng ⇒ doanh thu bền 5–10 năm (mô hình Path of Exile / Warframe).

---

# PHẦN 16 — ANTI POWER CREEP RULES (BỘ QUY TẮC BẤT BIẾN)

> 12 luật này là **hiến pháp**. Mọi nội dung tương lai phải tuân thủ.

1. **Power Budget 100% bất biến** — không hệ nào > 35%; thêm hệ mới phải **rút từ "Other 2%"**, không cộng thêm tổng.
2. **Cấm nhân hệ số tự do** — mọi nâng cấp là **% cộng trong trần**, không nhân chồng (Enhance/Star/Gem/Wing/Pet/Collection).
3. **Damage cap theo level bất biến** — `SkillMult×Crit×Element×Context ≤ Cap/Floor`.
4. **Level cap = 2000 vĩnh viễn** — mở rộng đi ngang (Ascension/biome cosmetic), không nâng cap.
5. **Rarity multiplier trần ×2.8** — không thêm rarity "mạnh hơn Genesis" về stat (chỉ về thẩm mỹ/affix).
6. **Reward endgame bão hòa** — sau trần budget, mọi reward power → cosmetic/prestige.
7. **Stat hard cap bất biến** (Crit 75%, CritDmg +100%, Pen 60%, Evasion 60%, DR 70%...).
8. **Boss HP = char_dmg × TTK target** — cấm HP "đặt tay" kiểu triệu tỷ; tính từ công thức.
9. **Mọi % power phải có Source = gameplay** — không source = cash.
10. **Catch-up = 80% meta, không 100%** — tôn trọng người chơi liên tục, vẫn cứu người mới.
11. **Expansion không invalidate gear cũ** — chỉ thêm lựa chọn ngang + nâng cấp catch-up.
12. **Inflation guard tự động** — `GoldSinkRatio ≥ 0.95/tuần`; vi phạm → Gold Sink Event.

**Ngăn Expansion phá Meta:** mỗi expansion qua "Balance Gate" — mô phỏng band damage + budget; nếu vượt bất kỳ luật nào → **không ship**.

---

# PHẦN 17 — TECHNICAL ARCHITECTURE

**Mục tiêu:** 10.000 CCU, an toàn kinh tế, chống cheat.

### 17.1 Server
- **Authoritative server** (Lua + VPS + MySQL theo doc gốc; khuyến nghị tách **game-logic service** khỏi **auth service**).
- **Sharding theo region/biome**; world boss & cross-server qua **dedicated match service**.
- **10k CCU:** mỗi shard ~1.5–2k CCU, load balancer + horizontal scaling; Redis cache cho hot data (inventory, AH).

### 17.2 Database
- MySQL chính (account, character, inventory, AH) + **Redis** (session, leaderboard, rate-limit) + **cold storage** (logs, replay).
- Index theo `character_id`, `item_id`, `auction_id`; partition bảng log theo tháng.
- **Item/Equip/Monster/Boss/Item DB** xuất sẵn từ generator (CSV/JSON) → import trực tiếp.

### 17.3 Network
- TCP cho state quan trọng (giao dịch, AH), UDP/WebSocket cho combat realtime; **server-side combat validation** (chống speed/damage hack).
- Rate-limit hành động/giây; reconcile client-server mỗi tick.

### 17.4 Economy Security & Anti-Cheat
- Mọi enhance/craft/trade **tính trên server**, client chỉ gửi intent.
- Anti-bot: behavior fingerprint + diminishing drop + captcha định kỳ vùng farm.
- Anti-RMT: soulbound item nâng cấp, AH giá sàn/trần động, audit log giao dịch bất thường.
- Anti-cheat: checksum client, encrypted packet, anomaly detection (damage > cap → auto-ban-flag).

### 17.5 Memory/Scalability
- Object pooling (quái/VFX), LOD theo URP; server gửi delta-state (không full snapshot).
- Bài kiểm tải: mô phỏng 10k bot CCU trước launch; mục tiêu p99 latency < 150ms.

---

# PHẦN 18 — DEVELOPMENT ROADMAP

| Phase | Thời gian | Hạng mục | Định nghĩa "Done" |
|---|---|---|---|
| **0. Foundation** | tháng 1–3 | Power Budget, Combat formula, Progression 1–2000, DB schema | Damage verification pass toàn bộ |
| **1. Core Vertical Slice** | 4–6 | Biome 1–3, 3 class, skill, enhance(gộp), pet cơ bản, AH | Chơi mượt Lv1–200 |
| **2. Mid Game** | 7–10 | Biome 4–11, dungeon/raid, guild, PvP Arena, Life Skill | D30 retention test |
| **3. Endgame Alpha** | 11–14 | Biome 12–17, Lv2000, Ascension AR1–10, Mythic+, Territory | endgame loop khép kín |
| **4. Economy & Anti-Cheat** | 13–15 | Sink/source balance, anti-bot/RMT, server validation | GoldSinkRatio ổn định |
| **5. LiveOps & Monetization** | 15–17 | Battle Pass, cosmetic pipeline, season system | doanh thu test, no-P2W audit |
| **6. Scale & Launch** | 17–18 | 10k CCU load test, cross-server, polish | p99<150ms, soft launch |
| **7. Year 1 Ops** | 19–30 | Season 1–4, Abyss, Expansion 1, AR11–20 | retention D180/D365 |
| **8. Year 2–3** | 31–36+ | Expansion 2, prestige, cross-server territory, AR21–25 | vòng đời 5–10 năm |

---

## PHỤ LỤC — FILE DỮ LIỆU KÈM THEO (sinh bằng code, đã cap & cân bằng)
| File | Nội dung | Dòng |
|---|---|---|
| `progression_1_2000.csv` | EXP/ATK/HP/CR/GearScore/cap — đủ 2000 level | 2000 |
| `damage_verification.csv` | Chứng minh không level nào vượt cap | 24 |
| `biome_remap.csv` | 21 biome nén về Lv1–2000 | 21 |
| `ascension_ranks.csv` | 25 Ascension rank | 25 |
| `equipment_db.csv` | 1.521 trang bị (11 slot×6 rarity×40 band) | 1521 |
| `item_db.csv` | 3.561 item (material/gem/consumable/currency/cosmetic...) | 3561 |
| `monster_db.csv` | 294 quái (21 biome × 6 loại) | 294 |
| `boss_db.csv` | 59 boss (dungeon/raid/world/season/secret/final) | 59 |

> **Trạng thái:** Vol.1 hoàn tất khung kiến trúc + toán nền + database lõi.
> **Còn lại để khoét sâu ở Vol.2** (mình làm tiếp nếu bạn muốn): Skill tree chi tiết 3 class × Ascension · 3000 quest theo template biome · Crafting recipe đầy đủ 6 nghề (material/rate/cost) · Boss mechanic/phase/AI từng con · Set bonus 100 set chi tiết · Retention analysis số liệu (D1–D365).
