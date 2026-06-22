/*! EO Studio Chatbot — Phase 1: Intent Detection (rule-based, no AI API).
    Classifies a question into one named intent so the reasoning engine knows
    WHAT the player wants, instead of just dumping search hits. */
(function (global) {
  "use strict";

  var T = global.EOText;

  var COUNT_PAT = /\b(co bao nhieu|bao nhieu|co may|co tat ca bao nhieu)\b/;
  var SUPERLATIVE_PAT = /\b(manh nhat|tot nhat|cao nhat|thap nhat|nhanh nhat|nhieu nhat|it nhat|gioi nhat|kho nhat|de nhat|dat nhat)\b/;
  var DROP_PAT = /\b(roi|roi ra|roi gi|drop|loot)\b/;
  var SHOP_PAT = /\b(ban gi|mua gi|gia bao nhieu|shop|cua hang|tiem|ban|mua)\b/;
  var REWARD_PAT = /\b(thuong|reward|exp|kinh nghiem|vang|gold)\b/;
  var CRAFT_PAT = /\b(che tao|ren|nau|craft|lam ra|cong thuc)\b/;
  var GREETING_PAT = /^(hi|hello|xin chao|chao|alo)\b/;

  // category keyword -> single-entity lookup intent name
  var CATEGORY_INTENT = {
    boss: "boss_lookup",
    monster: "monster_lookup",
    npc: "npc_lookup",
    item: "item_lookup",
    equipment: "item_lookup",
    skill: "skill_lookup",
    quest: "quest_lookup",
    map: "map_lookup",
    dungeon: "dungeon_lookup",
    shop: "shop_lookup",
    craft: "craft_lookup",
    tutorial: "tutorial_lookup",
    patchnote: "patchnote_lookup",
    faq: "faq_lookup"
  };

  function categoriesPresent(tokens, normalizedQuery) {
    var found = [];
    var groups = global.EOSynonyms.INTENT_KEYWORDS;
    Object.keys(groups).forEach(function (cat) {
      var keywords = groups[cat];
      for (var i = 0; i < keywords.length; i++) {
        var kw = keywords[i];
        var hit = kw.indexOf(" ") !== -1 ? normalizedQuery.indexOf(kw) !== -1 : tokens.indexOf(kw) !== -1;
        if (hit) { found.push(cat); break; }
      }
    });
    return found;
  }

  function guessRankField(normalizedQuery) {
    if (/\bhp\b|mau|sinh luc/.test(normalizedQuery)) return "hp";
    if (/\batk\b|cong|sat thuong/.test(normalizedQuery)) return "atk";
    if (/\bdef\b|thu|phong ngu/.test(normalizedQuery)) return "def";
    if (/exp|kinh nghiem/.test(normalizedQuery)) return "reward_exp";
    if (/vang|gold|gia/.test(normalizedQuery)) return "reward_gold";
    if (/level|cap do/.test(normalizedQuery)) return "level";
    return "power_share_pct";
  }

  function detect(query) {
    var normalizedQuery = T.normalize(query);
    var tokens = T.tokenizeMeaningful(query);
    var cats = categoriesPresent(tokens, normalizedQuery);

    if (GREETING_PAT.test(normalizedQuery) && tokens.length <= 3) {
      return { intent: "greeting", confidence: 0.95, normalizedQuery: normalizedQuery, tokens: tokens, categories: cats };
    }

    if (COUNT_PAT.test(normalizedQuery) && cats.length) {
      return { intent: "count_entities", confidence: 0.9, normalizedQuery: normalizedQuery, tokens: tokens, categories: cats };
    }

    if (SUPERLATIVE_PAT.test(normalizedQuery) && cats.length) {
      return {
        intent: "compare_best", confidence: 0.85, normalizedQuery: normalizedQuery, tokens: tokens,
        categories: cats, rankField: guessRankField(normalizedQuery),
        direction: /thap nhat|it nhat|de nhat/.test(normalizedQuery) ? "asc" : "desc"
      };
    }

    if (cats.indexOf("quest") !== -1 && (REWARD_PAT.test(normalizedQuery) || SUPERLATIVE_PAT.test(normalizedQuery))) {
      return {
        intent: "quest_reward_lookup", confidence: 0.85, normalizedQuery: normalizedQuery, tokens: tokens,
        categories: cats, rankField: /vang|gold/.test(normalizedQuery) ? "reward_gold" : "reward_exp"
      };
    }

    if (cats.indexOf("boss") !== -1 && cats.indexOf("map") !== -1) {
      return { intent: "world_boss_lookup", confidence: 0.9, normalizedQuery: normalizedQuery, tokens: tokens, categories: cats };
    }

    if (cats.indexOf("npc") !== -1 && (SHOP_PAT.test(normalizedQuery) || cats.indexOf("shop") !== -1)) {
      return { intent: "npc_shop_lookup", confidence: 0.85, normalizedQuery: normalizedQuery, tokens: tokens, categories: cats };
    }

    if (DROP_PAT.test(normalizedQuery)) {
      return { intent: "drop_lookup", confidence: 0.75, normalizedQuery: normalizedQuery, tokens: tokens, categories: cats };
    }

    if (CRAFT_PAT.test(normalizedQuery) || cats.indexOf("craft") !== -1) {
      return { intent: "craft_lookup", confidence: 0.75, normalizedQuery: normalizedQuery, tokens: tokens, categories: cats };
    }

    for (var i = 0; i < cats.length; i++) {
      if (CATEGORY_INTENT[cats[i]]) {
        return { intent: CATEGORY_INTENT[cats[i]], confidence: 0.6, normalizedQuery: normalizedQuery, tokens: tokens, categories: cats };
      }
    }

    return { intent: "fallback_search", confidence: 0.3, normalizedQuery: normalizedQuery, tokens: tokens, categories: cats };
  }

  global.EOIntent = { detect: detect };
})(window);
