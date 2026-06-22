/*! EO Studio Chatbot — background indexer (runs in a Web Worker so indexing
    thousands/tens-of-thousands of records never blocks the page UI). */
importScripts("text-utils.js");

function addTerm(index, term, docIdx) {
  var list = index[term];
  if (!list) { list = index[term] = []; }
  if (list[list.length - 1] !== docIdx) list.push(docIdx);
}

function addRef(map, key, docIdx) {
  if (key === undefined || key === null || key === "") return;
  var k = String(key);
  if (!map[k]) map[k] = [];
  map[k].push(docIdx);
}

function buildIndex(docs) {
  var invertedIndex = {};   // term -> [docIdx,...]
  var exactTitleIndex = {}; // normalizedTitle -> [docIdx,...]
  var docFreq = {};         // term -> number of docs containing it (for simple IDF)

  var crossRef = {
    monstersByBiome: {},
    bossesByBiome: {},
    bossMechanicsByBiome: {},
    npcsByBiome: {},
    shopsByNpc: {},
    dungeonsByBiome: {},
    questsByBiome: {},
    itemsById: {},
    equipmentById: {},
    skillById: {},
    craftById: {},
    biomeById: {},
    npcById: {},
    docsByCategory: {}
  };

  for (var i = 0; i < docs.length; i++) {
    var doc = docs[i];
    var titleNorm = EOText.normalize(doc.title || "");
    if (titleNorm) {
      if (!exactTitleIndex[titleNorm]) exactTitleIndex[titleNorm] = [];
      exactTitleIndex[titleNorm].push(i);
    }

    var tokens = EOText.tokenizeMeaningful(doc.searchText || "");
    var seen = {};
    for (var t = 0; t < tokens.length; t++) {
      var term = tokens[t];
      addTerm(invertedIndex, term, i);
      if (!seen[term]) { seen[term] = true; docFreq[term] = (docFreq[term] || 0) + 1; }
    }

    addRef(crossRef.docsByCategory, doc.category, i);

    var d = doc.data;
    if (doc.kind === "record" && d && typeof d === "object") {
      if (doc.category === "monsters") {
        if (doc.sourceFile === "boss_db.json") {
          addRef(crossRef.bossesByBiome, d.biome, i);
        } else if (doc.sourceFile === "boss_mechanics_db.json") {
          addRef(crossRef.bossMechanicsByBiome, d.biome, i);
        } else if (doc.sourceFile === "monster_db.json") {
          addRef(crossRef.monstersByBiome, d.biome, i);
        }
      }
      if (doc.category === "npc") {
        addRef(crossRef.npcsByBiome, d.biome_id, i);
        if (d.npc_id) crossRef.npcById[d.npc_id] = i;
      }
      if (doc.category === "shops" && d.npc_id) {
        crossRef.shopsByNpc[d.npc_id] = i;
      }
      if (doc.category === "maps" && doc.sourceFile === "dungeon_db.json") {
        addRef(crossRef.dungeonsByBiome, d.biome_id, i);
      }
      if (doc.category === "quests") {
        addRef(crossRef.questsByBiome, d.biome, i);
      }
      if (doc.category === "items") {
        if (d.id) crossRef.itemsById[d.id] = i;
      }
      if (doc.category === "skills" && d.id) {
        crossRef.skillById[d.id] = i;
      }
      if (doc.category === "crafting" && d.id) {
        crossRef.craftById[d.id] = i;
      }
      if (doc.category === "worlds" && doc.sourceFile === "biome_remap.json" && d.id !== undefined) {
        crossRef.biomeById[d.id] = i;
      }
    }
  }

  return {
    invertedIndex: invertedIndex,
    exactTitleIndex: exactTitleIndex,
    docFreq: docFreq,
    crossRef: crossRef,
    totalDocs: docs.length
  };
}

self.onmessage = function (e) {
  var msg = e.data;
  if (msg.type === "build") {
    var startedAt = performance.now();
    var result = buildIndex(msg.docs);
    self.postMessage({
      type: "built",
      index: result,
      tookMs: Math.round(performance.now() - startedAt)
    });
  }
};
