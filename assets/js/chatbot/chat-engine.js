/*! EO Studio Chatbot — orchestrator: load → index → search → understand → answer.
    100% offline / rule-based. No OpenAI/Claude/Gemini or any paid AI API is used anywhere. */
(function (global) {
  "use strict";

  var FALLBACK_TEXT = "Xin lỗi, tôi chưa tìm thấy thông tin này trong cơ sở dữ liệu game.";
  var NO_RESULT_LIMIT = 5;

  var state = {
    docs: [],
    index: null,
    ctx: null,
    ready: false,
    readyPromise: null,
    stats: { totalDocs: 0, tookMs: 0, fromCache: false }
  };

  function makeWorker() {
    return new Worker("assets/js/chatbot/indexer.worker.js");
  }

  function buildIndexInWorker(docs) {
    return new Promise(function (resolve, reject) {
      var worker = makeWorker();
      worker.onmessage = function (e) {
        if (e.data.type === "built") {
          resolve(e.data);
          worker.terminate();
        }
      };
      worker.onerror = function (err) { reject(err); worker.terminate(); };
      worker.postMessage({ type: "build", docs: docs });
    });
  }

  async function init(onProgress) {
    if (state.readyPromise) return state.readyPromise;
    state.readyPromise = (async function () {
      var manifest = await fetch(window.EOKBLoader.KB_ROOT + "manifest.json", { cache: "no-cache" }).then(function (r) { return r.json(); });
      var versionTag = manifest.generatedAt + ":" + manifest.totalFiles;

      var cached = await window.EOKBCache.getCached(versionTag);
      if (cached) {
        state.docs = cached.docs;
        state.index = cached.index;
        state.stats.fromCache = true;
      } else {
        state.docs = await window.EOKBLoader.loadKnowledgeBase(onProgress);
        var built = await buildIndexInWorker(state.docs);
        state.index = built.index;
        state.stats.tookMs = built.tookMs;
        window.EOKBCache.setCached(versionTag, { docs: state.docs, index: state.index });
      }
      state.stats.totalDocs = state.docs.length;
      state.ctx = { docs: state.docs, index: state.index };
      state.ready = true;
      return state;
    })();
    return state.readyPromise;
  }

  async function rebuildIndex(onProgress) {
    state.readyPromise = null;
    state.ready = false;
    window.EOKBCache.clearCache();
    return init(onProgress);
  }

  function resultDocs(result) {
    if (!result) return [];
    switch (result.type) {
      case "single": return [result.doc];
      case "drop": return [result.doc];
      case "best": return [result.best];
      case "list": return result.docs;
      case "shop_list": return result.npcs.concat(result.shops);
      default: return [];
    }
  }

  // Phase 1 → 6: Intent Detection → Entity Extraction → Knowledge Retrieval →
  // Reasoning → Natural Language Generation → Answer. Every step is rule-based
  // JavaScript running in the browser — no OpenAI/Claude/Gemini/paid AI calls.
  async function ask(userText) {
    await init();
    var memory = window.EOMemory.load();

    var intentResult = window.EOIntent.detect(userText);
    var entities = window.EOEntities.extract(intentResult, userText, state.ctx, memory);
    var result = window.EOReasoning.run(intentResult, entities, state.ctx);

    if (result.type === "none" && !entities.pronounResolved) {
      var fallbackHits = window.EOSearch.search(state.index, userText, { limit: 5 })
        .filter(function (r) { return r.score >= 1.3 && (r.tokenCoverage === undefined || r.tokenCoverage > 0.5); });
      if (fallbackHits.length) {
        result = { type: "list", label: "kết quả", docs: fallbackHits.map(function (r) { return state.docs[r.docIdx]; }) };
      }
    }

    var answerText = window.EOAnswers.generateStructuredAnswer(result, state.ctx);
    var entityDocs = resultDocs(result);

    window.EOMemory.remember(memory, userText, answerText, entityDocs, intentResult.intent);

    return {
      text: answerText,
      sources: entityDocs.slice(0, NO_RESULT_LIMIT).map(function (d) {
        return { category: d.category, sourceFile: d.sourceFile, title: d.title };
      }),
      intent: intentResult.intent,
      isFallback: result.type === "none"
    };
  }

  function getStats() { return state.stats; }
  function isReady() { return state.ready; }

  global.EOChatEngine = {
    init: init,
    ask: ask,
    rebuildIndex: rebuildIndex,
    getStats: getStats,
    isReady: isReady
  };
})(window);
