# FRIEND SYSTEM ARCHITECTURE
> Game: Slime MMORPG | Date: 2026-06-14 | Version: 1.0
> Power Budget: 0% (social utility, no power contribution)
> Compatible: Mail System (08_MAIL_SYSTEM.md) | Analytics | Save Data V9

---

## MANDATORY COMPATIBILITY CHECK

```
[Source of Truth]
  08_MAIL_SYSTEM.md      → Friend Gifts sent via Mail System
  SERVER_ARCHITECTURE.md → No new service needed (extend CharacterService)
  MONETIZATION_VIP_COSMETICS.md → VIP perk: +50 friend slots (QoL)
  ECONOMY_AUDIT.md       → Friend gifts = consumable items (no gold injection)

Friend System DOES NOT:
  ✗ Create new currency (gifts = consumable items only, no gold)
  ✗ Create power bonus (friend interactions = social utility only)
  ✗ Create new microservice (extends CharacterService)
  ✓ Uses existing Mail System for gifts
  ✓ Uses existing player_id references
```

---

## 1. Design Philosophy

Friend System là **retention engine** — người chơi có bạn bè online thì D30+ retention tăng 2-3×:
1. **Visibility**: Biết bạn đang làm gì → tạo FOMO → login
2. **Gift Loop**: Daily gift → reason to login → social obligation
3. **Recommendation**: Smart friend suggestions → grow social graph
4. **Low Friction**: Add bằng Player ID hoặc QR Code (mobile-first)

---

## 2. Friend List

```
Friend List Capacity:
  Base: 100 friends
  VIP4+: 150 friends  (QoL perk, consistent with MONETIZATION_VIP_COSMETICS.md)
  VIP8+: 200 friends

Friend States:
  ONLINE:     Active trong 5 phút gần đây
  IDLE:       Online nhưng inactive 5-30 min
  AFK:        AFK Gathering/Dungeon mode
  OFFLINE:    Offline (show "X hours ago")
  DO_NOT_DISTURB: Player set manually (no gift/invite notifications)

Friend operations:
  Add friend:     by Player ID (8-char alphanumeric) / QR Code / Guild member
  Accept/Reject:  friend request expires after 7 days
  Remove friend:  no notification to removed player
  Block player:   prevents re-add, hides online status
```

---

## 3. Friend Activity Feed

```
[Friend Activity Panel] — updates every 60s (not real-time to save bandwidth)

Activity events shown:
  LEVEL_UP:        "[Friend] reached Level {X}!"
  DUNGEON_CLEAR:   "[Friend] cleared {DungeonName}!"
  BOSS_KILL:       "[Friend] defeated World Boss {BossName}!"
  ITEM_FOUND:      "[Friend] found [Epic] {ItemName}!"    (Rare+ only, no spam)
  ACHIEVEMENT:     "[Friend] earned Achievement: {Name}"
  PVP_RANK_UP:     "[Friend] reached {Rank} in PvP Arena!"
  HOUSING_VISIT:   "[Friend] decorated their house!" (Housing update)
  
Activity privacy settings:
  SHOW_ALL (default), SHOW_GUILD_ONLY, SHOW_NOTHING
  Players control what events they broadcast
  
Feed UI: max 50 events shown, infinite scroll history 7 days
Mobile optimization: Load 20 events initially, "Load More" lazy-load
```

---

## 4. Friend Gifts

```
Daily Gift System:
  Send 1 gift per friend per day (your choice of what to send)
  Receive gifts accumulate in "Gift Box" (not auto-collected, not mail inventory)
  Gift Box capacity: 30 pending gifts (oldest auto-expires after 7 days)
  
Gift Item List (send one per gift):
  Mount Feed (Common):     100% chance drop in Foraging → free to send
  HP Potion (Small) ×3:   Craftable at Alchemy Lv1 → free to send
  Enhancement Dust ×5:     Common drop in dungeons → send extras
  Spirit Meditation Bell:  Rare item (Spirit Bond XP +50) → valuable gift
  Event Token ×2:          Only during active events
  
Gift Economy Rules:
  CANNOT gift Gold (prevents proxy currency transfer exploit)
  CANNOT gift Diamond/premium_gem (no gifting premium currency)
  CANNOT gift gear (prevents power transfer)
  CAN gift: consumables + materials (max stack: 100 per gift)
  
VIP Bonus:
  VIP3+: Can send 2 gifts per friend per day
  VIP6+: Can receive unlimited gift box capacity
  
Daily Gift Reminder:
  Push notification: "You have {X} friends to gift today!"
  In-game badge: Friend button shows gift count pending
```

---

## 5. Friend Recommendations

```
Recommendation Algorithm (server-side, runs daily):
  
  Score per candidate player:
    mutual_friends × 30 points
    same_guild × 20 points
    same_biome_last_7d × 15 points
    same_level_range (± 200) × 10 points
    pvp_match_history × 5 points
    party_history × 10 points
    
  Filter out:
    Already friends
    Blocked players
    Players with privacy = NO_RECOMMENDATIONS
    
  Show: Top 10 recommendations (refresh daily)
  UI: "Players you might know" section in Friend Panel
  
Quick-add from:
  Dungeon party (after dungeon complete)
  PvP match opponent (after match end → "Add Friend?" prompt)
  Guild members (in-guild quick-add)
  World Boss encounter (proximity-based, fight same boss)
```

---

## 6. Friend Visit (Housing Integration)

```
Visit Friend's House:
  Friend list → click friend → "Visit House" button
  Teleports to friend's Housing plot (if friend's Housing allow_public = true)
  Or: "Friend" permission tier in HOUSING_EXPANSION.md → always allow
  
Visit Gift:
  First visit to a friend's house each day → auto-drop "Visitor's Token" ×1
  Visitor's Token: used in Housing economy (see HOUSING_EXPANSION.md)
  
Social presence:
  Friend can see "[You] is visiting!" in Housing notification
  Housing visitor counter includes friend visits
```

---

## 7. Database Schema

```sql
CREATE TABLE friendships (
    player_id_1     BIGINT NOT NULL REFERENCES players(player_id),
    player_id_2     BIGINT NOT NULL REFERENCES players(player_id),
    status          VARCHAR(16) NOT NULL DEFAULT 'PENDING',
                    -- PENDING, FRIENDS, BLOCKED
    initiator_id    BIGINT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id_1, player_id_2),
    CONSTRAINT ordered_pair CHECK (player_id_1 < player_id_2)
);

CREATE TABLE friend_gifts (
    id              BIGSERIAL PRIMARY KEY,
    sender_id       BIGINT NOT NULL,
    receiver_id     BIGINT NOT NULL,
    item_id         VARCHAR(64) NOT NULL,
    quantity        INT NOT NULL DEFAULT 1,
    sent_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    claimed_at      TIMESTAMP,
    expires_at      TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

CREATE TABLE friend_activity_log (
    id              BIGSERIAL PRIMARY KEY,
    player_id       BIGINT NOT NULL,
    event_type      VARCHAR(32) NOT NULL,
    event_data_json JSONB NOT NULL,
    occurred_at     TIMESTAMP NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (occurred_at);

CREATE TABLE player_social_settings (
    player_id           BIGINT PRIMARY KEY,
    activity_privacy    VARCHAR(16) NOT NULL DEFAULT 'SHOW_ALL',
    allow_friend_requests BOOL NOT NULL DEFAULT TRUE,
    allow_recommendations BOOL NOT NULL DEFAULT TRUE,
    do_not_disturb      BOOL NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_friendships_player1 ON friendships(player_id_1, status);
CREATE INDEX idx_friendships_player2 ON friendships(player_id_2, status);
CREATE INDEX idx_gifts_receiver ON friend_gifts(receiver_id, claimed_at);
```

---

## 8. Network Packets

```
FriendRequest       = 0x0D00  // C2S: { target_player_id }
FriendRequestResult = 0x0D01  // S2C: { success, error_code }
FriendRequestIncoming = 0x0D02 // S2C: push to target player
FriendAccept        = 0x0D03  // C2S: { requester_id }
FriendRemove        = 0x0D04  // C2S: { friend_id }
FriendBlock         = 0x0D05  // C2S: { target_id }
FriendListSync      = 0x0D06  // S2C: full friend list on login
FriendStatusUpdate  = 0x0D07  // S2C: friend online/offline (real-time)
FriendActivityFeed  = 0x0D08  // S2C: activity events batch (every 60s)
FriendGiftSend      = 0x0D09  // C2S: { friend_id, item_id, qty }
FriendGiftClaim     = 0x0D0A  // C2S: { gift_id }
FriendGiftResult    = 0x0D0B  // S2C: { items_received }
FriendVisitHouse    = 0x0D0C  // C2S: { friend_id } → redirect to housing
FriendRecommend     = 0x0D0D  // S2C: recommendation list (daily refresh)
```

---

## 9. Save Data (extends V9)

```csharp
public class FriendSaveData {
    public List<long> friendIds;           // friend player_id list
    public List<long> blockedIds;
    public int pendingGiftsCount;          // badge counter (not full gift data)
    public long lastGiftSentAt;            // prevent double-gift same day
    public SocialSettings settings;
}

public class SocialSettings {
    public string activityPrivacy;         // SHOW_ALL / SHOW_GUILD_ONLY / SHOW_NOTHING
    public bool allowFriendRequests;
    public bool doNotDisturb;
}
```

---

## 10. Analytics

```
friend_added:           { method (manual/party/pvp/guild/recommendation) }
friend_gift_sent:       { item_id, receiver_id }
friend_gift_claimed:    { gift_age_hours (how long before claim) }
friend_visit_housing:   { friend_id, duration_s }
friend_activity_viewed: { feed_events_count, scroll_depth }
friend_recommendation_accepted: { candidate_source }
```

---

*Document: FRIEND_SYSTEM.md | Version: 1.0 | Date: 2026-06-14*
*Capacity: 100-200 friends | Daily gifts: consumables only | Recommendations: daily ML score*
*Compatible: Mail System | Housing Visits | Analytics | Save V9*
