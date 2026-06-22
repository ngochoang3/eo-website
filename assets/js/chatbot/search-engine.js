/*! EO Studio Chatbot — search engine: exact + keyword + fuzzy + full-text + synonym */
(function (global) {
  "use strict";

  var T = global.EOText;

  function idf(index, term) {
    var df = index.docFreq[term] || 0;
    return Math.log((index.totalDocs + 1) / (df + 1)) + 1;
  }

  function findFuzzyTerm(index, token, maxCandidates) {
    var best = null, bestScore = 0, checked = 0;
    for (var term in index.invertedIndex) {
      if (Math.abs(term.length - token.length) > 2) continue;
      checked++;
      if (checked > maxCandidates) break;
      var sim = T.similarity(term, token);
      if (sim > bestScore) { bestScore = sim; best = term; }
    }
    return bestScore >= 0.72 ? { term: best, score: bestScore } : null;
  }

  function exactSearch(index, query) {
    var norm = T.normalize(query);
    var aliasNorm = global.EOSynonyms ? (global.EOSynonyms.buildAliasLookup()[norm] || norm) : norm;
    var hits = index.exactTitleIndex[norm] || index.exactTitleIndex[aliasNorm] || [];
    return hits.map(function (idx) { return { docIdx: idx, score: 100, matchType: "exact" }; });
  }

  // Keyword + full-text + synonym + fuzzy, combined with simple TF-IDF style scoring
  function rankedSearch(index, query, opts) {
    opts = opts || {};
    var limit = opts.limit || 10;
    var aliasLookup = global.EOSynonyms ? global.EOSynonyms.buildAliasLookup() : {};
    var rawTokens = T.tokenizeMeaningful(query);
    if (!rawTokens.length) rawTokens = T.tokenize(query);

    var scores = {};       // docIdx -> accumulated score
    var matchTypes = {};
    var matchedTokens = {}; // docIdx -> Set of distinct query tokens that matched it

    rawTokens.forEach(function (token) {
      var candidates = [token];
      if (aliasLookup[token]) candidates.push(aliasLookup[token]);

      candidates.forEach(function (term) {
        var docs = index.invertedIndex[term];
        if (docs) {
          // weight by how common the MATCHED term is in the corpus — rare
          // real terms score high, but an unmatched query token must never
          // inflate its own weight just because it doesn't exist anywhere.
          var weight = idf(index, term);
          docs.forEach(function (docIdx) {
            scores[docIdx] = (scores[docIdx] || 0) + weight;
            matchTypes[docIdx] = matchTypes[docIdx] || (term === token ? "keyword" : "synonym");
            (matchedTokens[docIdx] = matchedTokens[docIdx] || {})[token] = true;
          });
        } else {
          var fuzzy = findFuzzyTerm(index, term, 4000);
          if (fuzzy) {
            var fuzzyWeight = idf(index, fuzzy.term);
            var fuzzyDocs = index.invertedIndex[fuzzy.term] || [];
            fuzzyDocs.forEach(function (docIdx) {
              scores[docIdx] = (scores[docIdx] || 0) + fuzzyWeight * fuzzy.score * 0.6;
              matchTypes[docIdx] = matchTypes[docIdx] || "fuzzy";
              (matchedTokens[docIdx] = matchedTokens[docIdx] || {})[token] = true;
            });
          }
        }
      });
    });

    var ranked = Object.keys(scores).map(function (k) {
      var idx = parseInt(k, 10);
      var coverage = rawTokens.length ? Object.keys(matchedTokens[k] || {}).length / rawTokens.length : 0;
      return { docIdx: idx, score: scores[k], matchType: matchTypes[k], tokenCoverage: coverage };
    });
    ranked.sort(function (a, b) { return b.score - a.score; });
    return ranked.slice(0, limit);
  }

  function search(index, query, opts) {
    var exact = exactSearch(index, query);
    if (exact.length) return exact.concat(rankedSearch(index, query, opts)).slice(0, (opts && opts.limit) || 10);
    return rankedSearch(index, query, opts);
  }

  global.EOSearch = {
    search: search,
    exactSearch: exactSearch,
    rankedSearch: rankedSearch
  };
})(window);
