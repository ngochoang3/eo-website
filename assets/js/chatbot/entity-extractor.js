/*! EO Studio Chatbot — Phase 2: Entity Extraction.
    Pulls typed entities (class, slot, world number, named thing, pronoun
    reference) out of the question so the reasoning engine has concrete
    values to look up instead of just keywords. */
(function (global) {
  "use strict";

  var T = global.EOText;

  var SLOT_KEYWORDS = {
    "Weapon": ["vu khi", "kiem", "sung", "vukhi", "weapon"],
    "Armor": ["ao giap", "giap than", "armor"],
    "Helmet": ["mu", "non", "helmet"],
    "Boots": ["giay", "boots", "ung"],
    "Gloves": ["gang tay", "gloves"],
    "Ring": ["nhan", "ring"],
    "Necklace": ["day chuyen", "vong co", "necklace"],
    "Belt": ["day nit", "dai", "belt"],
    "Relic": ["relic", "di vat"],
    "Artifact": ["artifact", "vat pham co"],
    "Charm": ["charm", "bua"]
  };

  function findWorldNumber(normalizedQuery, intents) {
    var m = /\b(?:world|map|vung|khu vuc|biome|region)\D{0,3}(\d{1,3})\b/.exec(normalizedQuery);
    if (m) return parseInt(m[1], 10);
    if (intents.indexOf("map") !== -1) {
      var bare = /\b(\d{1,3})\b/.exec(normalizedQuery);
      if (bare) return parseInt(bare[1], 10);
    }
    return null;
  }

  function findClass(normalizedQuery, tokens, catalogClasses) {
    if (!catalogClasses) return null;
    for (var i = 0; i < catalogClasses.length; i++) {
      var norm = T.normalize(catalogClasses[i]);
      if (normalizedQuery.indexOf(norm) !== -1) return catalogClasses[i];
    }
    return null;
  }

  function findSlot(normalizedQuery) {
    var keys = Object.keys(SLOT_KEYWORDS);
    for (var i = 0; i < keys.length; i++) {
      var kws = SLOT_KEYWORDS[keys[i]];
      for (var j = 0; j < kws.length; j++) {
        if (normalizedQuery.indexOf(kws[j]) !== -1) return keys[i];
      }
    }
    return null;
  }

  // Minimum search score to accept a match as "the thing the player meant" —
  // below this it's almost always pure fuzzy noise on an unrelated/garbage
  // query, and the confidence system must say "I don't know" instead.
  var MIN_NAMED_ENTITY_SCORE = 1.3;

  // Tries to find a specific NAMED thing mentioned in the question (a boss,
  // item, NPC... by name) via the search engine, optionally restricted to a
  // category implied by the detected intent.
  var MIN_TOKEN_COVERAGE = 0.5;

  function isConfident(r) {
    return r && r.score >= MIN_NAMED_ENTITY_SCORE && (r.tokenCoverage === undefined || r.tokenCoverage > MIN_TOKEN_COVERAGE);
  }

  function findNamedEntity(query, index, docs, preferredCategory, strict) {
    var results = global.EOSearch.search(index, query, { limit: 8 });
    if (!results.length || !isConfident(results[0])) return null;
    if (preferredCategory) {
      var match = results.find(function (r) { return docs[r.docIdx].category === preferredCategory && isConfident(r); });
      return match ? docs[match.docIdx] : (strict ? null : docs[results[0].docIdx]);
    }
    return docs[results[0].docIdx];
  }

  function extract(intentResult, query, ctx, memory) {
    var normalizedQuery = intentResult.normalizedQuery;
    var tokens = intentResult.tokens;
    var catalogs = ctx.index.catalogs || {};

    var entities = {
      worldNumber: findWorldNumber(normalizedQuery, intentResult.categories),
      className: findClass(normalizedQuery, tokens, catalogs.classes),
      slot: findSlot(normalizedQuery),
      pronounResolved: false,
      namedEntity: null
    };

    if (global.EOMemory.containsPronoun(query) && memory.lastEntities && memory.lastEntities.length) {
      entities.namedEntity = memory.lastEntities[0];
      entities.contextEntities = memory.lastEntities;
      entities.pronounResolved = true;
      return entities;
    }

    var preferredCategory = null;
    var catMap = { boss: "monsters", monster: "monsters", npc: "npc", item: "items", skill: "skills", quest: "quests", map: "worlds" };
    intentResult.categories.forEach(function (c) { if (catMap[c]) preferredCategory = catMap[c]; });

    entities.namedEntity = findNamedEntity(query, ctx.index, ctx.docs, preferredCategory);

    if (intentResult.intent === "npc_shop_lookup") {
      entities.itemEntity = findNamedEntity(query, ctx.index, ctx.docs, "items", true);
    }
    return entities;
  }

  global.EOEntities = { extract: extract };
})(window);
