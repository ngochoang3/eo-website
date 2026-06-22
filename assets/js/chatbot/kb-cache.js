/*! EO Studio Chatbot — IndexedDB cache for the built docs+index so repeat page
    loads skip re-fetching/re-indexing the whole KnowledgeBase. */
(function (global) {
  "use strict";

  var DB_NAME = "eo-chatbot";
  var STORE = "kb-cache";
  var KEY = "built-index";

  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!("indexedDB" in window)) { reject(new Error("no-indexeddb")); return; }
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        req.result.createObjectStore(STORE);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  async function getCached(versionTag) {
    try {
      var db = await openDb();
      return await new Promise(function (resolve) {
        var tx = db.transaction(STORE, "readonly");
        var req = tx.objectStore(STORE).get(KEY);
        req.onsuccess = function () {
          var record = req.result;
          if (record && record.versionTag === versionTag) resolve(record.payload);
          else resolve(null);
        };
        req.onerror = function () { resolve(null); };
      });
    } catch (e) {
      return null;
    }
  }

  async function setCached(versionTag, payload) {
    try {
      var db = await openDb();
      await new Promise(function (resolve) {
        var tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put({ versionTag: versionTag, payload: payload, savedAt: Date.now() }, KEY);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { resolve(); };
      });
    } catch (e) { /* best-effort cache, ignore failures */ }
  }

  async function clearCache() {
    try {
      var db = await openDb();
      await new Promise(function (resolve) {
        var tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(KEY);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { resolve(); };
      });
    } catch (e) { /* nothing to clear */ }
  }

  global.EOKBCache = { getCached: getCached, setCached: setCached, clearCache: clearCache };
})(window);
