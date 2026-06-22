# MAIL SYSTEM — Slime MMORPG Production Bible
> Game: Slime MMORPG | System: Mail System | Version: 1.0 | Date: 2026-06-14
> GAP: GAP-06 HIGH | Không có mail = không thể compensate players

---

## 1. Purpose & Design Goals

- **Reward Delivery**: Deliver rewards từ quests, events, gacha refunds, compensation
- **Guild Communication**: Guild broadcast, war results, territory notifications
- **System Compensation**: Server downtime, rollback, maintenance bonus delivery
- **Player-to-Player**: Không có P2P mail (too exploitable) — chỉ system-to-player

---

## 2. Mail Types

| Type | Sender | Trigger | Expiry |
|---|---|---|---|
| SYSTEM | Server | Scheduled/LiveOps | 30 ngày |
| COMPENSATION | Admin | Manual/Batch | 30 ngày |
| REWARD | Game Systems | Quest complete, event end, milestone | 14 ngày |
| GUILD | GuildManager | War result, boss loot overflow, promotion | 7 ngày |
| GACHA | BannerManager | Pull result overflow, refund | 7 ngày |
| SEASONAL | SeasonManager | Battle pass tier, season end | 7 ngày |

---

## 3. Mail Structure

```
Mail {
  mail_id:          UUID
  recipient_id:     UUID (player_id)
  sender_type:      ENUM(system, compensation, reward, guild, gacha, seasonal)
  subject:          string (max 128 chars)
  body:             string (max 2048 chars)
  attachments:      Attachment[]   // items, currency
  is_read:          bool
  is_claimed:       bool           // attachments claimed
  created_at:       timestamp
  expires_at:       timestamp
  priority:         int            // HIGH = đẩy lên đầu list
}

Attachment {
  attachment_type:  ENUM(gold, gem, premium_gem, season_token, guild_coin, event_token, item)
  item_id:          string | null
  quantity:         int
  enhance_level:    int            // nếu là equipment
}
```

---

## 4. Inbox Rules

| Rule | Giá trị |
|---|---|
| Inbox size per player | 100 mails |
| If inbox full (100) | New system mail → oldest unread non-claimed auto-deleted |
| If inbox full + new COMPENSATION | Player notified via push, forced deliver |
| Attachment expiry | Mail expired + unclaimed attachment → GM review queue |
| Bulk claim | Claim all attachments từ unread mails trong 1 action |

---

## 5. Compensation System

**Compensation Triggers:**
- Server downtime > 30 phút: compensation batch
- Rollback (item loss): individual manual mail
- Event bug (wrong rewards): batch compensation
- Maintenance: scheduled advance mail

**Compensation API (server-side only):**
```
CompensationService.SendToPlayer(playerId, subject, body, attachments[], expiryDays)
CompensationService.SendToAll(subject, body, attachments[], expiryDays)    // global
CompensationService.SendToSegment(segment, subject, body, attachments[])   // by level/server
```

**GM Tools:**
- Admin panel: batch send → up to 10,000 players/request
- View compensation history per player
- Revoke unclaimed compensation (within 24h of send)

---

## 6. Guild Mail Integration

**GuildManager triggers mail cho:**
- Guild War declared/accepted/result
- Guild Boss killed (participant list)
- Player promoted/demoted (notification to affected player)
- Treasury withdrawal approved/rejected
- Territory claimed/lost

**Guild broadcast:** Leader/Vice/Elder có thể gửi guild-wide announcement → tới inbox của tất cả members.

---

## 7. Gacha/BannerManager Integration

- Inventory full khi gacha pull → item gửi vào mail (GACHA type, 7 ngày expiry)
- Banner refund (event cancellation) → premium_gem attachment trong mail
- Pull history overflow (> 1000 records) → oldest records archived, summary mail

---

## 8. Notification Integration

**Push Notification triggers:**
- New COMPENSATION mail → immediate push notification
- New REWARD mail từ event → push notification
- Guild mail từ Leader/Vice → push notification
- Mail expiring trong 24h với unclaimed attachments → push reminder

**In-app indicator:**
- Red badge trên inbox icon = unread mail count
- Priority HIGH mails hiện ở top
- Expiring mails highlight màu vàng/đỏ khi < 24h

---

## 9. Database Structure

```sql
TABLE mail_inbox
  mail_id           UUID          PK
  recipient_id      BIGINT        FK → players
  sender_type       ENUM(system,compensation,reward,guild,gacha,seasonal)
  subject           VARCHAR(128)  NOT NULL
  body              TEXT
  attachments       JSONB         -- array of attachment objects
  is_read           BOOL          DEFAULT false
  is_claimed        BOOL          DEFAULT false
  priority          SMALLINT      DEFAULT 0
  created_at        TIMESTAMP     NOT NULL
  expires_at        TIMESTAMP     NOT NULL

  INDEX: (recipient_id, is_claimed, expires_at)  -- fast inbox query
  INDEX: (expires_at) WHERE is_claimed = false   -- cleanup job

TABLE mail_sent_log                              -- audit trail
  log_id            UUID          PK
  sender_type       ENUM(...)
  batch_id          UUID          NULL           -- for batch sends
  recipient_count   INT
  subject           VARCHAR(128)
  sent_at           TIMESTAMP
  sent_by_admin_id  BIGINT        NULL
```

---

## 10. Save Data

Không lưu mail trong client save data. Server là authoritative.
Client cache: mailUnreadCount (int) — synced on login via S2C_MailUnreadCount.

```
// Thêm vào PlayerSaveData V6 (display cache only):
mailCache: {
  unreadCount: int,
  hasExpiringAttachment: bool    // true nếu có attachment expiring trong 24h
}
```

---

## 11. Network Requirements

| Packet | Direction | Description |
|---|---|---|
| S2C_MailUnreadCount | S→C | Unread count on login / update |
| C2S_MailInboxList | C→S | Fetch inbox (page, filter) |
| S2C_MailInboxData | S→C | Inbox list response |
| C2S_MailRead | C→S | Mark as read (mail_id) |
| C2S_MailClaimAttachment | C→S | Claim single mail's attachments |
| S2C_MailClaimResult | S→C | Claim result + items delivered |
| C2S_MailBulkClaim | C→S | Claim all unclaimed attachments |
| S2C_MailBulkClaimResult | S→C | Bulk claim result |
| C2S_MailDelete | C→S | Delete mail (claimed or no attachment) |
| S2C_MailNewNotify | S→C | Push: new mail arrived |

---

## 12. Anti-Exploit Rules

| Rule | Protection |
|---|---|
| Claim validation | Server validate player owns mail before claim |
| Expiry bypass | Server-side expiry check, client timestamp không trust |
| Inbox spam | System-to-player only (no P2P mail) |
| Double claim | is_claimed flag set atomic trong single transaction |
| Attachment duplication | Claim transaction: lock mail_id → verify unclaimed → deliver → set claimed |

---

## 13. Edge Cases

| Scenario | Handling |
|---|---|
| Player banned với unclaimed attachments | Attachments held, không expire. Restored if ban lifted |
| Server rollback mid-claim | Transaction ensures atomic: either deliver+claimed or neither |
| Account deletion request | Export unclaimed currency to pending refund table |
| 100-mail inbox hit by urgent compensation | COMPENSATION type có bypass → 101st mail allowed, oldest non-compensation auto-archive |

---

*Document: 08_MAIL_SYSTEM.md | Version: 1.0 | Date: 2026-06-14*
*Dependencies: GuildManager, BannerManager, SeasonManager, LiveOpsService*
