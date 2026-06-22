# MMORPG EXPANSION ROADMAP — Phase 8
> Game: Slime MMORPG | Document: Production Roadmap to Android + iOS Global Launch
> Date: 2026-06-14 | Starting Readiness: 88% | Target: 99%+

---

## 1. Executive Summary

Slime MMORPG cần fill 17 gaps (4 CRITICAL, 8 HIGH, 5 MEDIUM/LOW) trước khi có thể launch trên Google Play và App Store. Roadmap này chia thành 6 sprints + 2 post-launch phases.

**Milestone Timeline:**
- Soft Launch: Sprint 1-3 complete (6 tuần)
- Hard Launch: Sprint 1-5 complete (10 tuần)
- Post-Launch Live Service: Sprint 6 + ongoing

---

## 2. Sprint 1: Foundation Blockers (2 tuần)
**Target Readiness:** 88% → 91%

### GAP-13: Addressables Architecture
**Owner:** Build Team
**Duration:** 6-8 days

Tasks:
- [ ] Audit tất cả Resources.Load() calls trong codebase
- [ ] Setup 5 Addressables groups (Core, Per-Biome, Icons, Seasonal, Premium)
- [ ] Configure CDN (Cloudflare/Fastly)
- [ ] Implement LoadingManager (biome transition + download progress)
- [ ] Migrate Biome 1-5 assets
- [ ] Test download flow (wifi + cellular)
- [ ] Verify initial build < 100MB

**Gate:** App installs and loads Biome 1 from Addressables (not Resources)

---

### GAP-07: Gacha Banner Management
**Owner:** Economy Team
**Duration:** 7-9 days (parallel với Addressables)

Tasks:
- [ ] Create BannerManager.cs (wire PityManager)
- [ ] Create banners table + banner_pity_state table + banner_history table
- [ ] Implement BannerConfig JSON schema + validation
- [ ] Implement 10-pull batch with guaranteed 4-star
- [ ] Implement idempotency (UUID RequestId per pull)
- [ ] Add 6 banner network packets (0x1300–0x1355)
- [ ] Rate disclosure UI (required for App Store)
- [ ] Extend PacketRateLimiter for banner packets
- [ ] Add gachaData to PlayerSaveData V6

**Gate:** Player can spend premium_gem on banner. PityManager called correctly. Pull history visible.

---

### GAP-17: Cross-System Economy Links
**Owner:** Economy Team
**Duration:** 3-4 days (parallel)

Tasks:
- [ ] Map all currency flows (gold, gem, premium_gem, season_token, guild_coin, event_token)
- [ ] Validate EconomySinkManager covers all new systems
- [ ] Ensure guild_coin has source (GAP-01 donation) + sink (GAP-09 guild shop)
- [ ] Ensure event_token has source (GAP-03 events) + sink (GAP-09 event shop)
- [ ] Add economy health monitoring metrics to analytics
- [ ] Document currency flow diagram (final)

**Gate:** Currency flow diagram complete. No currency with source but no sink (or vice versa).

---

## 3. Sprint 2: Retention Core (2 tuần)
**Target Readiness:** 91% → 93%

### GAP-05: Daily/Weekly Activity System
**Owner:** Live Service Team
**Duration:** 6-8 days

Tasks:
- [ ] Create DailyActivityManager.cs
- [ ] Create daily_activity_log + weekly_activity_log tables (partitioned)
- [ ] Implement activity pool generation (server-side, player context-aware)
- [ ] Implement activity progress tracking (server-side validation)
- [ ] Implement tier rewards claim
- [ ] Implement login streak system
- [ ] Add activityData to PlayerSaveData V6
- [ ] Add 7 activity network packets (0x1400–0x1454)
- [ ] Link to Battle Pass (SeasonManager tick)
- [ ] Link to Reputation (activity completion → faction rep)

**Gate:** Player logs in, sees 10 daily activities, can complete and claim T4 rewards. Reset at midnight UTC.

---

### GAP-06: Mail System
**Owner:** Backend Team
**Duration:** 4-5 days (parallel)

Tasks:
- [ ] Create MailManager.cs (server-side)
- [ ] Create mail_inbox + mail_sent_log tables
- [ ] Implement inbox, read, claim, bulk_claim, delete API
- [ ] Implement compensation batch send (SendToAll, SendToSegment)
- [ ] Implement mail expiry cleanup job
- [ ] Add 10 mail network packets (0x1200–0x1254)
- [ ] Add mailCache to PlayerSaveData V6
- [ ] Test: Compensation mail delivered during maintenance

**Gate:** Server can send compensation mail. Player receives and claims attachment. Mail expires correctly.

---

### GAP-12: Offline/AFK Progress System
**Owner:** Backend Team
**Duration:** 5-6 days (parallel)

Tasks:
- [ ] Expand CatchUpManager.cs with OfflineProgressManager methods
- [ ] Implement time-based gold accumulation (8h cap, diminishing returns)
- [ ] Implement offline EXP (Level < 500 only)
- [ ] Implement offline dungeon drop simulation (XorShift64 server-side)
- [ ] Implement claim screen flow
- [ ] Add offlineData to PlayerSaveData V6
- [ ] Add 3 offline network packets (0x1500–0x1551)
- [ ] Integration test with Housing generator

**Gate:** Player logs out, waits 1h, logs back in, claim screen shows correct gold. 8h cap verified.

---

## 4. Sprint 3: Social & Guild (2 tuần)
**Target Readiness:** 93% → 95% → SOFT LAUNCH GO**

### GAP-01: Guild System
**Owner:** Social Team
**Duration:** 10-14 days

Tasks:
- [ ] Create GuildManager.cs (full guild lifecycle)
- [ ] Create guild_core + guild_members + guild_logs tables
- [ ] Implement guild creation (gold cost, name/tag validation)
- [ ] Implement member management (invite, kick, promote, demote)
- [ ] Implement Guild EXP Tree (3 branches, 5 nodes each, 3 ranks)
- [ ] Implement treasury (deposit, withdraw queue, tax)
- [ ] Implement guild quests (daily/weekly/epic)
- [ ] Implement guild boss (4 tiers, spawn, contribution, loot)
- [ ] Implement guild shop (rotation, is_power=false validation)
- [ ] Implement guild war (declare, accept, 48h, result)
- [ ] Implement territory link (TerritoryWarManager integration)
- [ ] Add 25 guild network packets (0x0900–0x0959)
- [ ] Add guildSave to PlayerSaveData V6

**Gate:** Guild can be created, members join, guild quest completed, boss killed, war declared.

---

### GAP-14: Party Matchmaking & Roles
**Owner:** Social Team
**Duration:** 7-9 days (parallel)

Tasks:
- [ ] Create MatchmakingManager.cs (stateless microservice)
- [ ] Create PartyRoleSystem.cs (role selection, bonus)
- [ ] Create party_sessions + matchmaking_queue tables
- [ ] Implement queue join/leave, match algorithm
- [ ] Implement role bonus (Tank/Healer/Support buffs)
- [ ] Implement ready check
- [ ] Implement vote kick
- [ ] Implement party finder (browse + apply)
- [ ] Add dungeon role requirement enforcement (DungeonManager link)
- [ ] Add 20 party packets (0x1900–0x1955 + existing 0x0A00)

**Gate:** Player queues, gets matched, enters dungeon as Tank with role bonus active.

---

## 5. Sprint 4: Progression Completeness (1.5 tuần)
**Target Readiness:** 95% → 97%

### GAP-02: Achievement System
**Owner:** Content Team
**Duration:** 5-7 days

Tasks:
- [ ] Create AchievementManager.cs
- [ ] Create player_achievement_meta table
- [ ] Implement 8 categories (1000 total achievements catalog)
- [ ] Implement achievement progress tracking (event bus)
- [ ] Implement meta achievements
- [ ] Implement Power Budget 1% caller (AchievementManager → PowerBudgetManager)
- [ ] Implement hidden achievement hint system
- [ ] Add achievementMeta to PlayerSaveData V6
- [ ] Add 6 achievement packets

**Gate:** Player completes kill, achievement unlocks, points update, stat bonus applied correctly.

---

### GAP-04: Collection Codex (Full)
**Owner:** Content Team
**Duration:** 4-5 days (parallel)

Tasks:
- [ ] Create CollectionCodexManager.cs
- [ ] Expand CollectionData V6 (artifact/creature bits, milestone flags)
- [ ] Implement unlock triggers (BestiaryManager → CollectionCodex bridge)
- [ ] Implement milestone rewards per category
- [ ] Implement Power Budget 2% caller
- [ ] Migrate bestiaryBits[5] → bestiaryBits[6]
- [ ] Add 7 collection packets

**Gate:** Monster kill → CollectionCodex entry discovered → 10% milestone reward granted → ATK bonus visible.

---

### GAP-03: Title System
**Owner:** Content Team
**Duration:** 3-4 days (parallel)

Tasks:
- [ ] Create TitleManager.cs
- [ ] Create title_catalog static data
- [ ] Create player_titles table
- [ ] Implement grant (from achievement, quest, ascension)
- [ ] Implement equip/unequip
- [ ] Zone broadcast (title visible to other players)
- [ ] Add 5 title packets

**Gate:** Achievement grants title. Player equips title. Other players see title in world.

---

## 6. Sprint 5: Live Service Infrastructure (1.5 tuần)
**Target Readiness:** 97% → 98.5% → HARD LAUNCH GO**

### GAP-08: LiveOps Remote Config
**Owner:** Platform Team
**Duration:** 4-5 days

Tasks:
- [ ] Create LiveOpsConfigManager.cs
- [ ] Create liveops_configs + player_ab_segments tables
- [ ] Implement config fetch (version-based, gzip)
- [ ] Implement A/B segment assignment
- [ ] Implement emergency kill switches
- [ ] Implement event scheduling from config
- [ ] Add 3 config packets
- [ ] Admin panel basic UI (publish/rollback)

**Gate:** Admin publishes config with double_exp_active=true. Players refresh and get x2 EXP within 30s.

---

### GAP-09: Analytics Pipeline
**Owner:** Data Team
**Duration:** 5-6 days (parallel)

Tasks:
- [ ] Create AnalyticsService.cs (client-side batching)
- [ ] Create analytics_events table (daily partitioned)
- [ ] Instrument P0 events: session, level_up, banner_pull, currency
- [ ] Create analytics_daily_summary aggregation job
- [ ] Setup dashboard for KPIs (DAU, D1/D7/D30, ARPU)
- [ ] Implement GDPR pseudonymization
- [ ] Setup 90-day partition cleanup

**Gate:** Session events flowing. Dashboard shows DAU. banner_pull events appear within 5 minutes.

---

### GAP-16: Rotation/Event Shop Logic
**Owner:** Economy Team
**Duration:** 4-5 days (parallel)

Tasks:
- [ ] Create ShopRotationManager.cs
- [ ] Create shop_rotation_state table
- [ ] Implement daily/weekly rotation for 6 NPC rotating shops
- [ ] Implement guild shop (rotation + is_power validation)
- [ ] Implement event shop (linked to GAP-15 world events)
- [ ] Add 6 shop packets
- [ ] Verify all premium shop items: is_power=false

**Gate:** Daily reset → shop rotates → new items visible. Guild shop only accessible to guild members.

---

## 7. Sprint 6: Post-Launch Systems (2 tuần)
**Target Readiness:** 98.5% → 99%+**

### GAP-15: World Event System
**Owner:** Live Service Team
**Duration:** 6-8 days

Tasks:
- [ ] Create WorldEventManager.cs
- [ ] Create world_events + event_participation tables
- [ ] Implement 5 event types (Dynamic, Scheduled, World Boss, Invasion, Treasure Hunt)
- [ ] Implement player scaling
- [ ] Implement HP broadcast rate-limiting
- [ ] Implement invasion meter
- [ ] Add 14 world event packets

---

### GAP-10: Server Merge System
**Owner:** Infrastructure Team
**Duration:** 8-10 days (parallel)

Tasks:
- [ ] Create server_merge_log + server_player_id_map tables
- [ ] Implement conflict resolution scripts
- [ ] Implement data migration scripts (phased)
- [ ] Implement player notification system (7d + 24h)
- [ ] Implement merge gift compensation mail
- [ ] Test dry-run on staging environment

---

## 8. Post-Launch Phase 2: Cross-Server (Month 3-6)

### GAP-11: Cross-Server Architecture
- Cross-Server Leaderboard (Month 3)
- Cross-Server Arena (Month 3)
- Cross-Server World Boss (Month 5)
- Cross-Server Guild War (Month 6)

---

## 9. Parallel Ongoing Work (All Sprints)

| Task | Owner | Notes |
|---|---|---|
| Addressables migration (Biome 6-21) | Build Team | After Biome 1-5 validated |
| Analytics P1 + P2 instrumentation | Data Team | Expand as sprints complete |
| Seasonal content creation | Content Team | First season starts at Hard Launch |
| QA regression testing | QA Team | Per sprint |
| Performance optimization (mobile) | Build Team | CPU/GPU profiling |
| Localization | Content Team | VN first, EN second |
| Store assets (screenshots, descriptions) | Marketing | 4 weeks before launch |

---

## 10. Launch Readiness Checklist

### Technical
- [ ] Build size < 100MB (Addressables)
- [ ] D1 retention simulation > 35% (daily system ready)
- [ ] Gacha revenue flow verified (banner → premium_gem → pity → result)
- [ ] Server load test: 600 CCU stable
- [ ] Anti-cheat: SHA-256 checksums passing
- [ ] is_power invariant: automated test suite passing
- [ ] Save migration V5→V6 tested on 1000+ accounts

### Business
- [ ] App Store metadata complete (screenshots, description, age rating)
- [ ] Google Play store listing complete
- [ ] Privacy policy + Terms of Service published
- [ ] Gacha rate disclosure compliant (App Store + Play Store)
- [ ] Customer support system ready (mail-based compensation)
- [ ] Analytics dashboard live (KPIs visible)

### Live Service
- [ ] First event scheduled (Summer Solstice 2026)
- [ ] Compensation system tested
- [ ] LiveOps team trained on admin panel
- [ ] On-call rotation established

---

## 11. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Addressables CDN slow in target markets | Medium | HIGH | Multi-region CDN, pre-warm cache |
| Guild system delay (most complex system) | High | HIGH | Soft launch without guild if needed, add Week 2 |
| Gacha regulation changes | Medium | MEDIUM | Monitor each market, have rate disclosure ready |
| D1 < 25% at soft launch | Medium | CRITICAL | A/B test onboarding before hard launch |
| Server capacity at launch peak | Medium | HIGH | Auto-scaling enabled, load test weekly |
| Economy inflation post-launch | Low | HIGH | Analytics monitoring + LiveOps kill switch |
| App Store review rejection | Low | CRITICAL | Review guidelines, test submission 3 weeks early |

---

## 12. Final Production Readiness Projection

| Milestone | When | Readiness | Gate |
|---|---|---|---|
| Sprint 1 Complete | Week 2 | 91% | Gacha revenue possible |
| Sprint 2 Complete | Week 4 | 93% | Retention loop functional |
| Sprint 3 Complete | Week 6 | 95% | **SOFT LAUNCH GO** |
| Sprint 4 Complete | Week 7.5 | 97% | Progression loop complete |
| Sprint 5 Complete | Week 9 | 98.5% | **HARD LAUNCH GO** |
| Sprint 6 Complete | Week 11 | 99% | Live Service stable |
| Phase 2 Complete | Month 6 | 99.5% | Cross-server endgame |

---

*Document: MMORPG_EXPANSION_ROADMAP.md | Version: 1.0 | Date: 2026-06-14*
*Total: 17 design documents + 4 reports created. Production-ready MMORPG Bible: COMPLETE*
