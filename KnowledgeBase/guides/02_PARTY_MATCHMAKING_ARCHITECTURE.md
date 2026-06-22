# PARTY & MATCHMAKING ARCHITECTURE DESIGN
> Game: Slime MMORPG | Version: 1.0 | Date: 2026-06-14

---

## 1. Purpose & Design Goals

- **Group Content Access**: Bất kỳ solo player nào cũng có thể tham gia group content dễ dàng
- **Role Balance**: Soft-role system khuyến khích balance mà không bắt buộc
- **Low Friction**: Queue join → match → enter dungeon trong < 5 phút
- **Fair Matchmaking**: Level tolerance ±100, role balance priority
- **Anti-Abuse**: Vote kick, AFK detection, queue-hop prevention
- **KHÔNG viết lại PartyProgressionManager.cs** — chỉ cover matchmaking layer

---

## 2. Party System

| Tham số | Giá trị |
|---|---|
| Party size (standard) | 1–5 players |
| Party size (raid) | 6–20 players |
| Party types | Open / Closed / Password |
| Leader controls | Kick, promote, change dungeon, ready check, loot rules |

---

## 3. Role System

| Role | Mô tả |
|---|---|
| Tank | Frontline, aggro management |
| Healer | Sustain và recovery |
| DPS Melee | Close-range damage dealer |
| DPS Ranged | Long-range damage dealer |
| Support | Buff/debuff, utility |

**Role Bonus (server-side apply trong dungeon):**

| Role | Bonus |
|---|---|
| Tank | +10% threat generation |
| Healer | +15% heal effectiveness |
| Support | +5% EXP cho cả party |

---

## 4. Matchmaking Algorithm

**Priority Order:**
1. **Role Balance**: 1 Tank + 1 Healer + 3 DPS (hoặc 1 Tank + 1 Healer + 2 DPS + 1 Support)
2. **Level Range**: ±100 tolerance. Timeout 5 phút → mở rộng ±200
3. **Geolocation**: Ưu tiên cùng server region

**Matching Timeout Escalation:**

| Thời gian chờ | Hành động |
|---|---|
| 0–2 phút | Criteria gốc (±100 level, role strict) |
| 2–5 phút | Mở rộng ±200 level, role flexible |
| 5+ phút | Notify player, option tiếp tục hoặc cancel |

**Matchmaking Service**: Stateless microservice riêng — KHÔNG chạy trên game server. Queue state trong Redis.

---

## 5. Party Finder (Manual Browse)

- Danh sách open parties với filter: dungeon, difficulty, level range, role cần
- Description tối đa 128 ký tự
- Player click "Apply" → leader nhận notification → approve/decline trong 60 giây

**Filter Options:** Dungeon | Difficulty (Normal/Raid/Mythic+/Abyss/Tower) | Level Range | Role Needed | Guild Only

---

## 6. Ready Check System

**Flow:**
1. Leader trigger → S2C_ReadyCheck broadcast
2. Each member: 60 giây countdown để confirm
3. Tất cả confirm → proceed
4. Ai không confirm → kicked khỏi queue (không kicked khỏi party)

---

## 7. Vote Kick System

| Rule | Giá trị |
|---|---|
| Vote threshold | >50% members (không tính target), tối thiểu 3 votes |
| Vote window | 60 giây |
| Cooldown vote kick (per voter) | 30 phút |
| Abuse protection | Bị kick 3 lần trong 24h → 1h lockout khỏi queue |
| Tie (2v2) | No kick — vote fails |

**Server validation**: Tất cả votes validated server-side.

---

## 8. Party Rewards

| Bonus | Điều kiện | Giá trị |
|---|---|---|
| Group EXP Bonus | Mỗi member thêm | +10% EXP/người, max +40% (5 người) |
| Personal Loot | Mặc định | Mỗi player loot riêng |
| Party Quest Milestone | PartyProgressionManager | +5% EXP tích lũy |
| Role Bonus | Tank/Healer/Support | Áp dụng trong dungeon instance |

---

## 9. Raid Party (6–20 Players)

**Formation:** 4 groups × 5 members.

**Loot Rules:**

| Rule | Mô tả |
|---|---|
| Roll | Tất cả roll dice, cao nhất thắng |
| Need | Ưu tiên player cần item cho character |
| Greed | Muốn item để bán/disenchant |
| Pass | Không lấy |

---

## 10. Anti-Exploit Rules

| Rule | Cơ chế |
|---|---|
| AFK detection | No input 3 phút → warning. Thêm 2 phút → auto-kick + 30 phút lockout |
| Queue hopping | Server chặn join 2 dungeon khác nhau cùng lúc |
| Disconnect | 5 phút reconnect window. Sau 5 phút → auto-kick |
| Vote kick abuse | 3 kicks trong 24h → 1h queue lockout |

---

## 11. Database Structure

```
party_sessions: session_id, dungeon_id, difficulty, leader_player_id, party_type, state
party_members: session_id, player_id, role, ready_status, joined_at
matchmaking_queue: queue_id, player_id, dungeon_id, difficulty, role_pref, min_level, max_level
raid_sessions: raid_id, dungeon_id, raid_leader_id, member_count, loot_rule, state
party_escrow: escrow_id, session_id, poster_id, amount, status
```

---

## 12. Network Requirements (0x0A00–0x0AFF)

**C2S:**
0x0A00 C2S_PartyCreate | 0x0A01 C2S_PartyInvite | 0x0A02 C2S_PartyLeave
0x0A03 C2S_PartyKick | 0x0A04 C2S_QueueJoin | 0x0A05 C2S_QueueLeave
0x0A06 C2S_ReadyConfirm | 0x0A07 C2S_VoteKick | 0x0A08 C2S_PartyFinderBrowse
0x0A09 C2S_PartyApply | 0x0A0A C2S_PartyApprove | 0x0A0B C2S_LootRuleChange

**S2C:**
0x0A50 S2C_PartyUpdate | 0x0A51 S2C_QueueStatus | 0x0A52 S2C_MatchFound
0x0A53 S2C_ReadyCheck | 0x0A54 S2C_ReadyCheckResult | 0x0A55 S2C_VoteKickResult
0x0A56 S2C_PartyDisband | 0x0A57 S2C_PartyFinderList | 0x0A58 S2C_PartyInviteReceived

---

## 13. Edge Cases

| Tình huống | Xử lý |
|---|---|
| Leader disconnect | Auto-promote member online có join time sớm nhất |
| Tất cả disconnect | Hold instance 5 phút. Sau 5 phút → instance end |
| 4/5 members, thiếu 1 | Sau 5 phút: tiếp tục chờ / Party Finder / vào với 4 người |
| Vote kick tie (2v2) | Vote fails. No kick. |

---

*Document: 02_PARTY_MATCHMAKING_ARCHITECTURE.md | Version: 1.0 | Date: 2026-06-14*
