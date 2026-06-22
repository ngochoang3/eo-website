# GUILD ARCHITECTURE DESIGN
> Game: Slime MMORPG | Version: 1.0 | Date: 2026-06-14

---

## 1. Purpose & Design Goals

- **Retention Driver**: Daily contribution + guild quests tạo social obligation
- **Gold Sink**: Tạo guild (50,000 gold), treasury tax, boss summon, skill upgrades
- **Progression Layer**: Guild EXP Tree bổ sung ~3% power (trong SoulBond 4% Power Budget V3)
- **Content Gateway**: Guild level mở khóa dungeon types cao hơn cho toàn member
- **Anti-Pay-to-Win**: Mọi guild shop item dùng premium_gem có is_power = false

---

## 2. Guild Creation & Setup

| Yêu cầu | Giá trị |
|---|---|
| Level tối thiểu | Level 30 |
| Gold cost | 50,000 gold (không hoàn lại) |
| Tên guild | 12–24 ký tự, unique server-wide |
| Tag | Đúng 4 ký tự, uppercase, unique |
| Emblem | Chọn từ pool 50 base emblems |

**Member Cap theo Guild Level:**

| Guild Level | Member Cap |
|---|---|
| 1–2 | 20 |
| 3–7 | 30–40 |
| 8–10 | 50 |
| 11–17 | 60–80 |
| 18–20 | 100 |

---

## 3. Guild Level & EXP System

**Nguồn Guild EXP:**

| Nguồn | Guild EXP | Giới hạn |
|---|---|---|
| Daily Guild Quest | 200 | 5/ngày |
| Weekly Guild Quest | 1,000 | 3/tuần |
| Guild Boss Kill | 2,000 | 1/tuần |
| Giữ Territory 1 ngày | 500/territory | max 3 |
| Epic Guild Quest | 10,000 | 1/tháng |

**EXP Requirements (Level 1→20):** 5K → 10K → 20K → 35K → 55K → 80K → 110K → 150K → 200K → 280K → 380K → 500K → 650K → 850K → 1.1M → 1.4M → 1.8M → 2.3M → 3M
Total tích lũy để Lv20: ~12.9M Guild EXP

---

## 4. Guild Roles & Permissions

| Role | Số lượng |
|---|---|
| Leader | 1 |
| Vice Leader | Tối đa 2 |
| Elder | Tối đa 5 |
| Member | Không giới hạn |

**Permission Matrix:**

| Quyền | Leader | Vice | Elder | Member |
|---|---|---|---|---|
| Invite | YES | YES | YES | NO |
| Kick | YES | YES | YES (Member only) | NO |
| Treasury Deposit | YES | YES | YES | YES |
| Treasury Withdraw | YES | YES | YES (queue 24h) | NO |
| Declare War | YES | YES | NO | NO |
| Summon Boss | YES | YES | YES | NO |
| Disband | YES | NO | NO | NO |
| View Logs | YES | YES | YES | NO |

---

## 5. Guild Contribution System

**Daily Contribution Points (CP):**

| Hành động | CP | Giới hạn/Ngày |
|---|---|---|
| Chiến đấu trong guild dungeon | 10 | 50 CP |
| Donate 1,000 gold | 5 | 30 CP |
| Donate item Common | 2 | 10 CP |
| Donate item Rare | 5 | 15 CP |
| Donate item Epic | 10 | 20 CP |
| Daily Guild Quest | 20 | 60 CP |
| Tham gia Guild Boss | 30 | 30 CP (1/tuần) |

**Daily Cap:** 165 CP/ngày. 1 CP = 1 guild_coin.

**Weekly Rank Bonus:** Top 5% = x1.5 | Top 10% = x1.3 | Top 25% = x1.15 | Others = x1.0

---

## 6. Guild EXP Tree

**Branch A – Combat (trong SoulBond 4%):**

| Node | R1 | R2 | R3 |
|---|---|---|---|
| A1 ATK Boost | +1% ATK | +2% ATK | +3% ATK |
| A2 DEF Boost | +1% DEF | +2% DEF | +3% DEF |
| A3 HP Boost | +1% HP | +2% HP | +4% HP |
| A4 Drop Rate | +3% Drop | +5% Drop | +8% Drop |
| A5 EXP Gain | +2% EXP | +4% EXP | +6% EXP |

**Branch B – Social:** Member Cap +5/10/20 | Housing Bonus +5/10/20% | AFK Timer +30/60/90s

**Branch C – Economy:** AH Tax -0.5/-1/-1.5% | Craft Discount -2/-4/-6% | Gold Gen +50/100/200/ngày

---

## 7. Guild Treasury System

- Tax rate: 2–5% từ dungeon gold reward
- Withdraw: Elder+ qua approval queue 24h, auto-expire nếu không ai duyệt

**Daily Donation Cap:** Lv1-5 = 5K gold | Lv6-10 = 10K | Lv11-15 = 20K | Lv16-20 = 50K

**Skill Node Cost:** R1 = 5K-15K gold | R2 = 10K-30K | R3 = 20K-60K
**Boss Summon:** T1 = 10K | T2 = 30K | T3 = 80K | T4 = 200K
**Declare War:** 25,000 gold

---

## 8. Guild Quest System

**Daily** (reset 00:00 UTC): Pool 20 quests → random 10 → guild chọn 5
Reward: 200 Guild EXP + 20 guild_coin/member

**Weekly** (reset Thứ Hai): 3 quests chung
Reward: 1,000 Guild EXP + 100 guild_coin/member đóng góp

**Epic** (hàng tháng): 1 quest lớn 4 tuần
Reward: 10,000 Guild EXP + exclusive cosmetic

---

## 9. Guild Boss System

| Guild Lv | Tier | Boss Name | HP |
|---|---|---|---|
| 5+ | T1 | Slime Colossus | 500,000 |
| 10+ | T2 | Ancient Slime Wyrm | 2,000,000 |
| 15+ | T3 | Void Slime Sovereign | 8,000,000 |
| 20+ | T4 | Primordial Slime God | 25,000,000 |

- Instance riêng, guild member only. 1 lần/tuần server-side cooldown.
- HP scale: x1 (10 người) → +x0.15 mỗi người thêm.
- Personal loot theo % damage dealt.

---

## 10. Guild Shop

| Item | Giá gc | is_power |
|---|---|---|
| Emblem Skin | 500 | false |
| Nameplate Frame | 300 | false |
| Chat Badge | 200 | false |
| EXP Potion (small) | 50 | false |
| Repair Kit | 80 | false |
| Guild Hall Teleport | 100 | false |

**INVARIANT:** Không item nào có is_power = true.

---

## 11. Guild Territory System

- 21 Biomes, mỗi biome 1 Territory Zone. Mỗi guild tối đa 3 territories.

**Territory Benefits:**
- Gold Gen: +50 gold/giờ → Treasury
- EXP Bonus: +5% cho members trong biome
- Drop Rate: +3% trong biome
- Guild EXP: +500/ngày

---

## 12. Guild War System

**Flow:** Declare (25K gold) → B accept/decline 24h → War 48h → Kill count win
**Rewards:** Win = 5K EXP + territory claim | Lose = 1K EXP | Tie = 2K EXP mỗi bên
**Cooldown:** 7 ngày sau mỗi war

---

## 13. Database Structure

```
guild_core: guild_id, name, tag, level, exp, gold_treasury, leader_id, tax_rate
guild_members: guild_id, player_id, role, contribution_points, weekly_contribution
guild_logs: log_id, guild_id, action_type, actor_id, target_id, detail(JSONB)
guild_territories: biome_id(PK), guild_id(nullable), claimed_at
guild_wars: war_id, attacker_guild_id, defender_guild_id, status, scores, resolved_at
```

---

## 14. Save Data V6 Extension

```
guildSave: {
  guildId: string | null,
  role: "leader"|"vice_leader"|"elder"|"member"|null,
  contributionPoints: int,
  weeklyContribution: int,
  lastContributionDate: string,
  guildCoinBalance: int    // display cache — server authoritative
}
```

---

## 15. Network Packets (0x0900–0x09FF)

C2S: 0x0900 GuildCreate | 0x0901 GuildJoin | 0x0902 GuildLeave | 0x0903 GuildKick
0x0904 GuildDonate | 0x0905 GuildQuestClaim | 0x0906 GuildBossEnter
0x0907 GuildWarDeclare | 0x0908 GuildShopBuy | 0x0909 GuildSkillUpgrade
0x090A TerritoryCapture | 0x090B GuildWarAccept | 0x090C GuildWarDecline

S2C: 0x0950 GuildUpdate | 0x0951 GuildMemberList | 0x0952 GuildQuestUpdate
0x0953 GuildBossSpawn | 0x0954 GuildWarResult | 0x0955 GuildExpUpdate
0x0956 GuildTreasuryUpdate | 0x0957 GuildWarInvitation | 0x0958 GuildShopRefresh

---

## 16. Edge Cases

| Tình huống | Xử lý |
|---|---|
| Leader offline >30 ngày | Auto-transfer → Vice Leader online gần nhất |
| War với guild đã dissolved | Auto-cancel, không refund nếu đã accept |
| Member join trong active war | Kill score không tính 24h đầu |
| Treasury insufficient mid-unlock | Transaction rejected |
| Withdrawal không ai approve 24h | Auto-expire |

---

*Document: 01_GUILD_ARCHITECTURE.md | Version: 1.0 | Date: 2026-06-14*
