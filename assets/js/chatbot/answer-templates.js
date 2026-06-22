/*! EO Studio Chatbot — natural-language answer generator (no raw JSON ever shown) */
(function (global) {
  "use strict";

  function biomeName(ctx, biomeId) {
    if (biomeId === undefined || biomeId === null || biomeId === "") return null;
    var idx = ctx.index.crossRef.biomeById[String(biomeId)];
    if (idx !== undefined) return ctx.docs[idx].data.name;
    return "Biome " + biomeId;
  }

  function itemName(ctx, itemId) {
    var idx = ctx.index.crossRef.itemsById[itemId];
    return idx !== undefined ? ctx.docs[idx].data.name : itemId;
  }

  function fmtNum(n) {
    if (typeof n !== "number") return n;
    return n.toLocaleString("vi-VN");
  }

  function sentMonster(ctx, d) {
    var biome = biomeName(ctx, d.biome);
    var s = d.name + " là quái vật" + (d.is_elite ? " elite" : "") +
      (d.rarity ? " độ hiếm " + d.rarity : "") + ", xuất hiện ở " + (biome || "khu vực chưa rõ") +
      ", yêu cầu khoảng level " + d.level + ".";
    s += " Chỉ số: " + fmtNum(d.hp) + " HP, " + fmtNum(d.atk) + " ATK, " + fmtNum(d.def) + " DEF" +
      (d.element ? ", nguyên tố " + d.element : "") + ".";
    s += " Tiêu diệt sẽ thưởng " + fmtNum(d.exp_reward) + " EXP và " + fmtNum(d.gold_reward) + " vàng.";
    if (d.drop_table) {
      s += " Quái vật rơi vật phẩm theo bảng rơi đồ \"" + d.drop_table + "\"" +
        " (chi tiết vật phẩm trong bảng này hiện chưa có trong cơ sở dữ liệu).";
    }
    return s;
  }

  function sentBoss(ctx, d) {
    var biome = biomeName(ctx, d.biome);
    var s = d.name + " là " + (d.type || "boss") + (biome ? " tại " + biome : "") +
      ", yêu cầu khoảng level " + d.level + ".";
    s += " Boss có " + fmtNum(d.hp) + " HP, " + fmtNum(d.atk) + " ATK, " + fmtNum(d.def) + " DEF" +
      (d.phases ? ", chiến đấu qua " + d.phases + " giai đoạn" : "") + ".";
    if (d.mechanic) s += " Cơ chế: " + d.mechanic + ".";
    if (d.drop) {
      s += " Boss rơi vật phẩm theo bảng \"" + d.drop + "\"" +
        " (chi tiết vật phẩm trong bảng này hiện chưa có trong cơ sở dữ liệu).";
    }
    if (d.lore) s += " " + d.lore;
    return s;
  }

  function sentBossMechanic(ctx, d) {
    var biome = biomeName(ctx, d.biome);
    var s = "Ở giai đoạn " + d.phase + " (HP " + d.hp_threshold + ") của " + d.boss_name +
      (biome ? " tại " + biome : "") + ", cơ chế là: " + d.mechanic + ".";
    if (d.ai_behavior) s += " Hành vi AI: " + d.ai_behavior + ".";
    if (d.counter) s += " Cách né/khắc chế: " + d.counter + ".";
    if (d.enrage) s += " Giai đoạn này có thể enrage (cuồng nộ).";
    return s;
  }

  function sentNpc(ctx, d) {
    var biome = biomeName(ctx, d.biome_id);
    var s = d.display_name + " là NPC" + (d.npc_type ? " loại " + d.npc_type : "") +
      (biome ? ", có mặt tại " + biome : "") + ".";
    if (d.npc_type === "vendor" && d.shop_id) {
      var shopIdx = ctx.index.crossRef.shopsByNpc[d.npc_id];
      if (shopIdx !== undefined) {
        var items = ctx.docs[shopIdx].data.items || [];
        var names = items.slice(0, 6).map(function (it) {
          return itemName(ctx, it.item_id) + " (" + fmtNum(it.price) + " " + it.price_currency + ")";
        });
        s += " NPC này bán: " + names.join(", ") + (items.length > 6 ? "…" : "") + ".";
      }
    }
    if (d.quest_ids && d.quest_ids.length) {
      s += " NPC giao " + d.quest_ids.length + " nhiệm vụ.";
    }
    if (d.dialog_root) s += " Lời thoại: \"" + d.dialog_root + "\"";
    return s;
  }

  function sentShop(ctx, d) {
    var npcIdx = ctx.index.crossRef.npcById[d.npc_id];
    var npcName = npcIdx !== undefined ? ctx.docs[npcIdx].data.display_name : d.npc_id;
    var items = d.items || [];
    var lines = items.map(function (it) {
      return "- " + itemName(ctx, it.item_id) + ": " + fmtNum(it.price) + " " + it.price_currency +
        (it.daily_limit ? " (giới hạn " + it.daily_limit + "/ngày)" : "");
    });
    return "Cửa hàng của " + npcName + " (làm mới " + (d.refresh_type || "không rõ") + ") bán:\n" + lines.join("\n");
  }

  function sentQuest(ctx, d) {
    var biome = biomeName(ctx, d.biome);
    var s = "Nhiệm vụ \"" + d.name + "\"" + (d.type ? " (loại " + d.type + ")" : "") +
      (biome ? " tại " + biome : "") + " yêu cầu level " + d.level_req + ".";
    if (d.prereq_quest_id) s += " Cần hoàn thành nhiệm vụ trước đó (" + d.prereq_quest_id + ") để nhận.";
    s += " Hoàn thành thưởng " + fmtNum(d.reward_exp) + " EXP, " + fmtNum(d.reward_gold) + " vàng" +
      (d.reward_item ? ", và vật phẩm " + itemName(ctx, d.reward_item) : "") + ".";
    if (d.is_repeatable) s += " Đây là nhiệm vụ có thể lặp lại" + (d.cooldown_hours ? " (hồi sau " + d.cooldown_hours + " giờ)" : "") + ".";
    return s;
  }

  function sentItem(ctx, d) {
    var s = d.name + " là " + (d.type || "vật phẩm") + " độ hiếm " + (d.rarity || "không rõ") +
      ", yêu cầu level " + d.level_req + ".";
    if (d.desc) s += " " + d.desc;
    s += " Giá bán: " + fmtNum(d.sell_price) + " vàng, có thể xếp chồng tối đa " + d.stack_max + ".";
    return s;
  }

  function sentEquipment(ctx, d) {
    var s = d.name + " là trang bị vị trí " + d.slot + (d.class ? " dành cho class " + d.class : "") +
      ", độ hiếm " + d.rarity + ", yêu cầu level " + d.level_req + ".";
    if (d.main_stat) s += " Chỉ số chính: " + d.main_stat + ".";
    if (d.affix_slots) s += " Có " + d.affix_slots + " ô affix.";
    if (d.source) s += " Có thể lấy qua: " + d.source + ".";
    if (d.lore) s += " " + d.lore;
    return s;
  }

  function sentSkill(ctx, d) {
    var s = d.name + " là kỹ năng" + (d.type ? " " + d.type : "") + " của class " + d.class +
      ", mở khóa ở level " + d.unlock_lv + (d.is_ultimate ? " (kỹ năng tối thượng)" : "") + ".";
    if (d.desc) s += " " + d.desc;
    s += " Tiêu hao " + d.mp_cost + " MP, hồi chiêu " + d.cooldown + "s" +
      (d.element ? ", nguyên tố " + d.element : "") + (d.is_aoe ? ", gây sát thương diện rộng" : "") + ".";
    return s;
  }

  function sentCraft(ctx, d) {
    var resultName = itemName(ctx, d.result_item);
    var ingredients = (d.ingredients || []).map(function (ing) {
      return itemName(ctx, ing.item_id) + " x" + ing.qty;
    });
    return "Để chế tạo " + resultName + " (x" + d.result_qty + ") tại " + (d.station || "trạm chế tạo") +
      ", bạn cần: " + ingredients.join(", ") + ". Chi phí " + fmtNum(d.gold_cost) + " vàng, " +
      "thời gian chế tạo " + d.craft_time_sec + "s, yêu cầu level " + d.level_req + ".";
  }

  function sentDungeon(ctx, d) {
    var biome = biomeName(ctx, d.biome_id);
    var s = d.display_name + " là dungeon loại " + d.dungeon_type + (biome ? " tại " + biome : "") +
      ", độ khó " + d.difficulty + ", khuyến nghị level " + d.recommended_level +
      " (tối thiểu " + d.min_level + "), tối đa " + d.max_party_size + " người.";
    if (d.has_boss) s += " Dungeon có boss.";
    if (d.time_limit_min) s += " Giới hạn thời gian " + d.time_limit_min + " phút.";
    return s;
  }

  function sentBiome(ctx, d) {
    var s = d.name + " là vùng/world yêu cầu level " + d.level_min + " đến " + d.level_max +
      (d.element ? ", nguyên tố chủ đạo " + d.element : "") + (d.season ? ", mùa " + d.season : "") + ".";
    s += " Vùng này có " + d.boss_count + " boss và " + d.dungeon_count + " dungeon.";
    var bossesIdx = ctx.index.crossRef.bossesByBiome[String(d.id)] || [];
    if (bossesIdx.length) {
      var names = bossesIdx.map(function (i) { return ctx.docs[i].data.name; });
      s += " Boss tại đây: " + names.join(", ") + ".";
    }
    return s;
  }

  function sentRegionAsset(ctx, d) {
    var parts = [];
    if (d.regionName) parts.push("Vùng kỹ thuật (world-streaming) \"" + d.regionName + "\"");
    if (d.minLevelRequirement !== undefined) parts.push("yêu cầu level tối thiểu " + d.minLevelRequirement +
      " (lưu ý: hệ thống world-streaming hiện để mặc định 1 cho mọi vùng — level thật theo từng vùng xem ở mục World)");
    if (d.defaultWeatherKey) parts.push("thời tiết mặc định: " + d.defaultWeatherKey);
    if (d.defaultSeasonKey) parts.push("mùa mặc định: " + d.defaultSeasonKey);
    return parts.length ? parts.join(", ") + "." : "Không có dữ liệu chi tiết cho vùng kỹ thuật này.";
  }

  function sentLore(doc) {
    var preview = doc.data.length > 600 ? doc.data.slice(0, 600) + "…" : doc.data;
    return preview;
  }

  function sentGenericText(doc) {
    var body = typeof doc.data === "string" ? doc.data : "";
    var preview = body.length > 500 ? body.slice(0, 500) + "…" : body;
    return doc.title + ": " + preview;
  }

  var GENERIC_SKIP_KEYS = { id: 1, name: 1, display_name: 1, boss_name: 1, icon: 1, schemaVersion: 1 };
  var GENERIC_NOTE_KEYS = ["lore", "desc", "description", "mechanic"];

  // Honest fallback for any structured record whose exact schema we have not
  // hand-modeled yet (e.g. relic_db/artifact_db/rune_db/gem_db/trait_db…).
  // Only ever prints fields that actually exist — never "undefined".
  function sentGenericRecord(doc, d) {
    var pairs = [];
    Object.keys(d).forEach(function (key) {
      if (GENERIC_SKIP_KEYS[key] || GENERIC_NOTE_KEYS.indexOf(key) !== -1) return;
      var val = d[key];
      if (val === null || val === undefined || val === "") return;
      if (typeof val === "object") return; // skip nested arrays/objects in the summary line
      pairs.push(key.replace(/_/g, " ") + ": " + val);
    });
    var s = doc.title + " (" + doc.category + (doc.sourceFile ? ", " + doc.sourceFile : "") + ")";
    if (pairs.length) s += " — " + pairs.join(", ") + ".";
    GENERIC_NOTE_KEYS.forEach(function (key) {
      if (d[key]) s += " " + d[key];
    });
    return s;
  }

  function generateAnswer(doc, ctx) {
    if (doc.kind === "text") {
      if (doc.category === "lore") return sentLore(doc);
      return sentGenericText(doc);
    }
    var d = doc.data;
    switch (doc.category + ":" + doc.sourceFile) {
      case "monsters:boss_db.json": return sentBoss(ctx, d);
      case "monsters:boss_mechanics_db.json": return sentBossMechanic(ctx, d);
      case "monsters:monster_db.json": return sentMonster(ctx, d);
      case "npc:npc_db.json": return sentNpc(ctx, d);
      case "shops:shop_db.json": return sentShop(ctx, d);
      case "quests:quest_db.json": return sentQuest(ctx, d);
      case "items:item_db.json": return sentItem(ctx, d);
      case "items:equipment_db.json": return sentEquipment(ctx, d);
      case "skills:skill_db.json": return sentSkill(ctx, d);
      case "crafting:crafting_db.json": return sentCraft(ctx, d);
      case "maps:dungeon_db.json": return sentDungeon(ctx, d);
      case "worlds:biome_remap.json": return sentBiome(ctx, d);
      default:
        if (doc.category === "maps" && doc.sourceFile && doc.sourceFile.indexOf("regions/") === 0) {
          return sentRegionAsset(ctx, d);
        }
        return sentGenericRecord(doc, d);
    }
  }

  var RANK_FIELD_LABELS = {
    hp: "HP", atk: "ATK", def: "DEF", reward_exp: "EXP thưởng", reward_gold: "vàng thưởng",
    level: "level", _rankValue: "chỉ số chính"
  };

  function bulletList(names, max) {
    max = max || 15;
    var shown = names.slice(0, max);
    var s = shown.map(function (n) { return "• " + n; }).join("\n");
    if (names.length > max) s += "\n• …và " + (names.length - max) + " mục khác";
    return s;
  }

  function sentGreeting() {
    return "Xin chào! Mình là EO Assistant — hỏi mình về item, boss, NPC, quest, map, skill, shop, crafting… trong game EO nhé.";
  }

  function sentCount(result) {
    return result.counts.map(function (c) {
      var n = c.names && c.names.length ? c.names.length : (c.count || 0);
      var head = "Hiện tại game có " + n + " " + c.label + (c.names && c.names.length ? ":" : ".");
      if (c.names && c.names.length) return head + "\n" + bulletList(c.names);
      return head;
    }).join("\n\n");
  }

  function sentList(ctx, result) {
    var head = "Có " + result.docs.length + " " + result.label +
      (result.world !== undefined ? " tại world " + result.world : "") + ":\n" +
      bulletList(result.docs.map(function (d) { return d.title; }));
    if (result.docs.length <= 3) {
      var details = result.docs.map(function (d) { return generateAnswer(d, ctx); }).join("\n\n");
      return head + "\n\n" + details;
    }
    return head;
  }

  function sentShopList(ctx, result) {
    return result.shops.map(function (shop) { return generateAnswer(shop, ctx); }).join("\n\n");
  }

  function sentDrop(doc) {
    var d = doc.data;
    var dropKey = d.drop || d.drop_table;
    if (!dropKey) return (d.name || doc.title) + " hiện không có dữ liệu rơi đồ.";
    return (d.name || doc.title) + " rơi vật phẩm theo bảng \"" + dropKey + "\"" +
      " — tiếc là chi tiết vật phẩm cụ thể trong bảng này chưa có trong cơ sở dữ liệu game, " +
      "nên mình chưa thể liệt kê chính xác item nào.";
  }

  function sentBest(ctx, result) {
    var label = RANK_FIELD_LABELS[result.rankField] || result.rankField;
    var name = result.best.title;
    var value = result.best.data[result.rankField];
    var qualifier = [];
    if (result.className) qualifier.push("cho class " + result.className);
    if (result.slot) qualifier.push("vị trí " + result.slot);
    var head = (qualifier.length ? "Trong số các lựa chọn " + qualifier.join(" ") + ", " : "") +
      name + " đang dẫn đầu về " + label + " (" + fmtNum(value) + ").";
    var tail = generateAnswer(result.best, ctx);
    var runner = result.runnerups.length
      ? "\n\nXếp sau: " + result.runnerups.map(function (d) { return d.title; }).join(", ") + "."
      : "";
    return head + "\n\n" + tail + runner;
  }

  function generateStructuredAnswer(result, ctx) {
    switch (result.type) {
      case "greeting": return sentGreeting();
      case "count": return sentCount(result);
      case "list": return sentList(ctx, result);
      case "shop_list": return sentShopList(ctx, result);
      case "drop": return sentDrop(result.doc);
      case "best": return sentBest(ctx, result);
      case "single": return generateAnswer(result.doc, ctx);
      case "none":
      default:
        return "Xin lỗi, tôi chưa tìm thấy đủ dữ liệu để trả lời chính xác.";
    }
  }

  global.EOAnswers = {
    generateAnswer: generateAnswer,
    generateStructuredAnswer: generateStructuredAnswer,
    biomeName: biomeName,
    itemName: itemName
  };
})(window);
