/*! EO Studio Chatbot — lightweight intent & entity extraction (no ML, rule-based) */
(function (global) {
  "use strict";

  var T = global.EOText;

  function detectIntents(normalizedQuery, tokens) {
    var found = [];
    var groups = global.EOSynonyms.INTENT_KEYWORDS;
    Object.keys(groups).forEach(function (intent) {
      var keywords = groups[intent];
      for (var i = 0; i < keywords.length; i++) {
        var kw = keywords[i];
        if (kw.indexOf(" ") !== -1 ? normalizedQuery.indexOf(kw) !== -1 : tokens.indexOf(kw) !== -1) {
          found.push(intent);
          break;
        }
      }
    });
    return found;
  }

  // Matches "world 17", "map 17", "vung 17", "biome 17", or a bare number when a
  // map/world-ish intent is already present in the same question.
  function detectWorldNumber(normalizedQuery, intents) {
    var m = /\b(?:world|map|vung|khu vuc|biome|region)\D{0,3}(\d{1,3})\b/.exec(normalizedQuery);
    if (m) return parseInt(m[1], 10);
    if (intents.indexOf("map") !== -1) {
      var bare = /\b(\d{1,3})\b/.exec(normalizedQuery);
      if (bare) return parseInt(bare[1], 10);
    }
    return null;
  }

  function detectLevelNumber(normalizedQuery) {
    var m = /\blevel\D{0,3}(\d{1,5})\b|\bcap\D{0,3}(\d{1,5})\b|\blv\D{0,2}(\d{1,5})\b/.exec(normalizedQuery);
    if (!m) return null;
    return parseInt(m[1] || m[2] || m[3], 10);
  }

  function analyze(query) {
    var normalizedQuery = T.normalize(query);
    var tokens = T.tokenizeMeaningful(query);
    var intents = detectIntents(normalizedQuery, tokens);
    return {
      raw: query,
      normalizedQuery: normalizedQuery,
      tokens: tokens,
      intents: intents,
      worldNumber: detectWorldNumber(normalizedQuery, intents),
      levelNumber: detectLevelNumber(normalizedQuery)
    };
  }

  global.EONLU = { analyze: analyze };
})(window);
