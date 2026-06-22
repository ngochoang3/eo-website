/*! EO Studio Chatbot — Phase 3: Knowledge Retrieval + Phase 4: Reasoning.
    Turns (intent, entities) into a STRUCTURED result — never a raw document
    dump. The response generator is the only thing allowed to turn this into
    prose, and the user never sees doc IDs, scores, or JSON. */
(function (global) {
  "use strict";

  var CONFIDENCE_THRESHOLD = 0.35;

  function docsInCategoryFile(ctx, category, sourceFile) {
    var out = [];
    ctx.docs.forEach(function (d) {
      if (d.category === category && (!sourceFile || d.sourceFile === sourceFile)) out.push(d);
    });
    return out;
  }

  function byIdx(ctx, indices) {
    return (indices || []).map(function (i) { return ctx.docs[i]; }).filter(Boolean);
  }

  function numeric(val) {
    if (typeof val === "number") return val;
    if (typeof val === "string") { var n = parseFloat(val); if (!isNaN(n)) return n; }
    return null;
  }

  function topByField(docs, field, direction, limit) {
    var withVal = docs.filter(function (d) { return numeric(d.data[field]) !== null; });
    withVal.sort(function (a, b) {
      var diff = numeric(a.data[field]) - numeric(b.data[field]);
      return direction === "asc" ? diff : -diff;
    });
    return withVal.slice(0, limit || 5);
  }

  function countCategory(ctx, catKeyword) {
    var catalogs = ctx.index.catalogs || {};
    switch (catKeyword) {
      case "class": return { label: "class", names: catalogs.classes || [] };
      case "equipment": return { label: "trang bị", names: docsInCategoryFile(ctx, "items", "equipment_db.json").map(function (d) { return d.title; }) };
      case "item": return { label: "vật phẩm", names: docsInCategoryFile(ctx, "items", "item_db.json").map(function (d) { return d.title; }) };
      case "boss": return { label: "boss", names: docsInCategoryFile(ctx, "monsters", "boss_db.json").map(function (d) { return d.title; }) };
      case "monster": return { label: "quái vật", names: docsInCategoryFile(ctx, "monsters", "monster_db.json").map(function (d) { return d.title; }) };
      case "npc": return { label: "NPC", names: docsInCategoryFile(ctx, "npc", "npc_db.json").map(function (d) { return d.title; }) };
      case "skill": return { label: "skill", names: docsInCategoryFile(ctx, "skills", "skill_db.json").map(function (d) { return d.title; }) };
      case "quest": return { label: "quest", names: [] , count: docsInCategoryFile(ctx, "quests", "quest_db.json").length };
      case "map": return { label: "world/vùng", names: docsInCategoryFile(ctx, "worlds", "biome_remap.json").map(function (d) { return d.title; }) };
      case "dungeon": return { label: "dungeon", names: [], count: docsInCategoryFile(ctx, "maps", "dungeon_db.json").length };
      case "shop": return { label: "shop", names: docsInCategoryFile(ctx, "shops", "shop_db.json").map(function (d) { return d.title; }) };
      default: return null;
    }
  }

  // equipment_db has no raw power-budget number (deliberately stripped from the
  // player-facing KB) — rank by the numeric value printed in main_stat instead
  // (e.g. "ATK +2" -> 2), which is the same number the player sees in-game.
  function mainStatValue(d) {
    var m = /([+-]?\d+(\.\d+)?)/.exec(d.data.main_stat || "");
    return m ? parseFloat(m[1]) : null;
  }

  function withRankValue(pool) {
    return pool.map(function (d) {
      return Object.assign({}, d, { data: Object.assign({}, d.data, { _rankValue: mainStatValue(d) }) });
    });
  }

  function bestCandidatePool(ctx, intentResult, entities) {
    var cats = intentResult.categories;
    if (cats.indexOf("item") !== -1 || cats.indexOf("equipment") !== -1) {
      var pool = docsInCategoryFile(ctx, "items", "equipment_db.json");
      if (entities.className) pool = pool.filter(function (d) { return d.data.class === entities.className || d.data.class === "All"; });
      if (entities.slot) pool = pool.filter(function (d) { return d.data.slot === entities.slot; });
      return { pool: withRankValue(pool), rankField: "_rankValue" };
    }
    if (cats.indexOf("boss") !== -1) {
      var bosses = docsInCategoryFile(ctx, "monsters", "boss_db.json");
      if (entities.worldNumber !== null) bosses = bosses.filter(function (d) { return String(d.data.biome) === String(entities.worldNumber); });
      return { pool: bosses, rankField: intentResult.rankField || "hp" };
    }
    if (cats.indexOf("monster") !== -1) {
      var mons = docsInCategoryFile(ctx, "monsters", "monster_db.json");
      if (entities.worldNumber !== null) mons = mons.filter(function (d) { return String(d.data.biome) === String(entities.worldNumber); });
      return { pool: mons, rankField: intentResult.rankField || "hp" };
    }
    return { pool: docsInCategoryFile(ctx, "quests", "quest_db.json"), rankField: intentResult.rankField || "reward_exp" };
  }

  function run(intentResult, entities, ctx) {
    switch (intentResult.intent) {
      case "greeting":
        return { type: "greeting" };

      case "count_entities": {
        var counts = intentResult.categories.map(function (c) { return countCategory(ctx, c); }).filter(Boolean);
        if (!counts.length) return { type: "none" };
        return { type: "count", counts: counts };
      }

      case "compare_best":
      case "quest_reward_lookup": {
        var poolInfo = bestCandidatePool(ctx, intentResult, entities);
        if (!poolInfo.pool.length) return { type: "none" };
        var ranked = topByField(poolInfo.pool, poolInfo.rankField, intentResult.direction || "desc", 4);
        if (!ranked.length) return { type: "none" };
        return {
          type: "best", best: ranked[0], runnerups: ranked.slice(1),
          rankField: poolInfo.rankField, className: entities.className, slot: entities.slot
        };
      }

      case "world_boss_lookup": {
        if (entities.worldNumber === null) return { type: "none" };
        var bossDocs = byIdx(ctx, ctx.index.crossRef.bossesByBiome[String(entities.worldNumber)]);
        if (!bossDocs.length) return { type: "none" };
        return { type: "list", label: "boss", docs: bossDocs, world: entities.worldNumber };
      }

      case "npc_shop_lookup": {
        if (entities.itemEntity) {
          var itemId = entities.itemEntity.data.id;
          var allShops = docsInCategoryFile(ctx, "shops", "shop_db.json").filter(function (shop) {
            return (shop.data.items || []).some(function (it) { return it.item_id === itemId; });
          });
          if (!allShops.length) return { type: "none" };
          var sellerNpcs = allShops.map(function (shop) {
            var idx = ctx.index.crossRef.npcById[shop.data.npc_id];
            return idx !== undefined ? ctx.docs[idx] : null;
          }).filter(Boolean);
          return { type: "shop_list", npcs: sellerNpcs, shops: allShops };
        }

        var npcDocs;
        if (entities.worldNumber !== null) {
          npcDocs = byIdx(ctx, ctx.index.crossRef.npcsByBiome[String(entities.worldNumber)])
            .filter(function (d) { return d.data.npc_type === "vendor"; });
        } else if (entities.namedEntity && entities.namedEntity.category === "npc") {
          npcDocs = [entities.namedEntity];
        } else {
          return { type: "none" };
        }
        if (!npcDocs.length) return { type: "none" };
        var shopDocs = npcDocs.map(function (npc) {
          var idx = ctx.index.crossRef.shopsByNpc[npc.data.npc_id];
          return idx !== undefined ? ctx.docs[idx] : null;
        }).filter(Boolean);
        return { type: "shop_list", npcs: npcDocs, shops: shopDocs };
      }

      case "drop_lookup": {
        if (!entities.namedEntity) return { type: "none" };
        return { type: "drop", doc: entities.namedEntity };
      }

      case "boss_lookup": case "monster_lookup": case "npc_lookup": case "item_lookup":
      case "skill_lookup": case "quest_lookup": case "map_lookup": case "dungeon_lookup":
      case "shop_lookup": case "craft_lookup": case "tutorial_lookup": case "patchnote_lookup": case "faq_lookup": {
        if (entities.namedEntity) return { type: "single", doc: entities.namedEntity };
        return { type: "none" };
      }

      default: {
        if (entities.namedEntity) return { type: "single", doc: entities.namedEntity, lowConfidence: intentResult.confidence < CONFIDENCE_THRESHOLD };
        return { type: "none" };
      }
    }
  }

  global.EOReasoning = { run: run, CONFIDENCE_THRESHOLD: CONFIDENCE_THRESHOLD };
})(window);
