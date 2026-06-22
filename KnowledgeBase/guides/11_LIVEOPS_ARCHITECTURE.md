# LIVEOPS ARCHITECTURE DESIGN — Slime MMORPG Production Bible
> Game: Slime MMORPG | System: LiveOps Remote Config | Version: 1.0 | Date: 2026-06-14
> GAP: GAP-08 HIGH | liveopsFlags{} exists in save data but no config delivery system

---

## 1. Purpose & Design Goals

- **Hot Tune Without Deploy**: Adjust drop rates, economy, event parameters post-launch
- **A/B Testing**: Test different configurations on player segments
- **Event Scheduling**: Schedule events remotely, no code deploy needed
- **Emergency Override**: Kill switch for broken mechanics without downtime
- **Already Have:** liveopsFlags{} trong PlayerSaveData V5 — just need delivery system

---

## 2. Config Categories

| Category | Examples | Update Frequency |
|---|---|---|
| Economy | Drop rates, gold amounts, craft costs | Per event/patch |
| Event | Event start/end times, event rewards | Per event |
| Banner | Active banner list, rates hot-fix | Per rotation |
| Progression | EXP multipliers (event bonus), level cap | Rarely |
| Feature Flags | Enable/disable features (kill switch) | Emergency |
| A/B Test | Onboarding flow variants, UI tests | Per experiment |
| Balance | Skill multipliers ±5%, boss HP | Per patch |

---

## 3. Config Delivery Architecture

```
LiveOps Config Service (separate microservice):
  - Config Store: PostgreSQL + Redis cache (30s TTL)
  - Version: incrementing config version number
  - Format: JSON, validated against schema before publish

Client Fetch Flow:
  1. On login: C2S_ConfigFetch {currentConfigVersion}
  2. Server: if (serverVersion > clientVersion): S2C_ConfigUpdate {fullConfig}
  3. Client apply config → cache locally
  4. Background refresh: every 5 minutes via C2S_ConfigFetch
  5. Emergency push: S2C_ConfigForceRefresh (server-initiated)
```

**Config Size:** Gzip compressed target < 50KB per full config payload.

---

## 4. Feature Flags System

**liveopsFlags{} in PlayerSaveData maps to:**

| Flag Key | Type | Effect |
|---|---|---|
| double_exp_active | bool | x2 EXP từ mọi source |
| double_drop_active | bool | x2 drop rate |
| guild_bonus_week | bool | +50% Guild EXP |
| event_shop_open | bool | Event Shop visible |
| banner_X_active | bool | Show banner X |
| new_player_guide | bool | Onboarding flow variant |
| maintenance_mode | bool | Kick all players gracefully |
| pvp_disabled | bool | Emergency disable PvP |

**Flag Evaluation Order:**
1. Server config (overrides all)
2. Player segment flags (A/B group)
3. Account-level flags (special cases)
4. Defaults (hardcoded fallback)

---

## 5. A/B Testing Framework

**Segments:** Player assigned to segment on account creation (hash of account_id % N groups).

| Test | Variants | Metric |
|---|---|---|
| Onboarding Tutorial | A: Long, B: Short | D1 completion % |
| Daily Activity Rewards | A: Gold-heavy, B: Gem-heavy | D7 retention |
| First Banner Rate | A: 0.6%, B: 1.0% | First purchase conversion |
| Progression Speed | A: Normal, B: +20% EXP Week 1 | D30 retention |

**A/B Rules:**
- Player không biết họ trong variant nào
- Analytics track per-segment separately
- Winning variant deployed as default after 2 weeks
- Cannot run conflicting tests simultaneously

---

## 6. Event Scheduling via LiveOps

**Event Config Example:**
```json
{
  "events": [
    {
      "event_id": "summer_solstice_2026",
      "type": "seasonal",
      "start_at": "2026-06-21T00:00:00Z",
      "end_at": "2026-08-15T23:59:59Z",
      "config": {
        "double_drop": false,
        "event_shop_open": true,
        "banner_id": "summer_banner_01",
        "world_boss_schedule": ["2026-06-25T20:00:00Z"],
        "special_quests_enabled": true
      }
    }
  ]
}
```

**Server EventScheduler:** Cron job mỗi phút check events → apply flags → broadcast S2C_EventStart.

---

## 7. Emergency Controls

**Kill Switch Procedures:**

| Emergency | Action |
|---|---|
| Exploit discovered (gold dupe) | Set `economy_transactions_frozen = true` → pause all gold transactions |
| Gacha bug (wrong rates) | Set `banner_X_active = false` → banner disappears client-side |
| Server overload | Set `matchmaking_disabled = true` → queue stops accepting |
| Crash loop | Set `maintenance_mode = true` → graceful player disconnect |
| PvP exploit | Set `pvp_disabled = true` → all PvP gated |

**Kill switch takes effect:** Within 30 seconds (config refresh cycle).

---

## 8. Database Structure

```sql
TABLE liveops_configs
  config_id         UUID          PK
  version           BIGINT        NOT NULL    -- auto-increment
  config_json       JSONB         NOT NULL
  published_at      TIMESTAMP
  published_by      VARCHAR(64)   -- admin username
  rollback_of       UUID          NULL        -- FK to config being rolled back from
  is_active         BOOL          DEFAULT false
  notes             TEXT

TABLE player_ab_segments
  player_id         BIGINT        PK
  segment_id        SMALLINT      NOT NULL    -- 0-99 (100 segments)
  assigned_at       TIMESTAMP

TABLE liveops_event_log
  log_id            UUID          PK
  event_type        VARCHAR(64)
  config_change     JSONB
  affected_players  INT
  applied_at        TIMESTAMP
  applied_by        VARCHAR(64)
```

---

## 9. Network Requirements

| Packet | Direction | Description |
|---|---|---|
| C2S_ConfigFetch | C→S | Client version check |
| S2C_ConfigUpdate | S→C | Full config if version outdated |
| S2C_ConfigForceRefresh | S→C | Emergency push refresh |
| C2S_ABSegmentQuery | C→S | Client check which segment (for UI) |

---

## 10. Security

| Rule | Implementation |
|---|---|
| Config write | Admin only, requires 2FA |
| Config publish | Peer review required (2-admin approval) |
| Rollback | Any admin can rollback, logged |
| Client trust | Client NEVER modifies config — fetch only |
| Config signing | SHA-256 signature on config payload |

---

*Document: 11_LIVEOPS_ARCHITECTURE.md | Version: 1.0 | Date: 2026-06-14*
*Dependencies: liveopsFlags{} in PlayerSaveData V5, EventScheduler, AnalyticsService*
