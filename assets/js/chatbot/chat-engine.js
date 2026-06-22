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
      state.ctx = { docs: state.docs, crossRef: state.index.crossRef };
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

  function docsFromIndices(indices) {
    return (indices || []).map(function (i) { return state.docs[i]; }).filter(Boolean);
  }

  function resolveByCrossRef(nlu) {
    var ref = state.index.crossRef;
    var w = nlu.worldNumber;
    if (w === null || w === undefined) return null;

    if (nlu.intents.indexOf("boss") !== -1) return docsFromIndices(ref.bossesByBiome[String(w)]);
    if (nlu.intents.indexOf("monster") !== -1) return docsFromIndices(ref.monstersByBiome[String(w)]);
    if (nlu.intents.indexOf("npc") !== -1) return docsFromIndices(ref.npcsByBiome[String(w)]);
    if (nlu.intents.indexOf("quest") !== -1) return docsFromIndices(ref.questsByBiome[String(w)]);
    if (nlu.intents.indexOf("dungeon") !== -1) return docsFromIndices(ref.dungeonsByBiome[String(w)]);
    if (nlu.intents.indexOf("map") !== -1 || nlu.intents.indexOf("levelRequirement") !== -1) {
      var biomeIdx = ref.biomeById[String(w)];
      return biomeIdx !== undefined ? [state.docs[biomeIdx]] : null;
    }
    return null;
  }

  function composeAnswer(docs) {
    if (!docs || !docs.length) return null;
    var unique = [];
    var seenTitles = {};
    docs.forEach(function (d) {
      var key = d.category + ":" + d.title;
      if (!seenTitles[key]) { seenTitles[key] = true; unique.push(d); }
    });
    var sentences = unique.slice(0, NO_RESULT_LIMIT).map(function (d) {
      return window.EOAnswers.generateAnswer(d, state.ctx);
    });
    var prefix = unique.length > 1 ? "Có " + unique.length + " kết quả phù hợp:\n\n" : "";
    return prefix + sentences.join("\n\n");
  }

  async function ask(userText) {
    await init();
    var memory = window.EOMemory.load();
    var resolvedText = window.EOMemory.resolvePronoun(memory, userText);
    var nlu = window.EONLU.analyze(resolvedText);

    var docs = resolveByCrossRef(nlu);

    if (!docs || !docs.length) {
      var results = window.EOSearch.search(state.index, resolvedText, { limit: NO_RESULT_LIMIT });
      docs = docsFromIndices(results.map(function (r) { return r.docIdx; }));
    }

    var answerText = composeAnswer(docs) || FALLBACK_TEXT;
    var topDoc = docs && docs[0];

    window.EOMemory.remember(memory, userText, answerText, topDoc ? topDoc.title : null, topDoc ? topDoc.category : null);

    return {
      text: answerText,
      sources: (docs || []).slice(0, NO_RESULT_LIMIT).map(function (d) {
        return { category: d.category, sourceFile: d.sourceFile, title: d.title };
      }),
      isFallback: !docs || !docs.length
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
