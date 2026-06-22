/*! EO Studio Chatbot — KnowledgeBase loader & normalizer
    Security: only ever fetches paths listed in KnowledgeBase/manifest.json under the
    KB_ROOT prefix below — no path is ever constructed from user input, so the chatbot
    cannot be made to fetch arbitrary site files or escape the KnowledgeBase folder. */
(function (global) {
  "use strict";

  var KB_ROOT = "KnowledgeBase/";
  var ARRAY_KEYS = ["rows", "npcs", "shops", "dungeons", "monsters", "items", "quests", "data", "bosses"];

  function findRecordArray(obj) {
    if (Array.isArray(obj)) return obj;
    if (!obj || typeof obj !== "object") return null;
    for (var i = 0; i < ARRAY_KEYS.length; i++) {
      if (Array.isArray(obj[ARRAY_KEYS[i]])) return obj[ARRAY_KEYS[i]];
    }
    var keys = Object.keys(obj);
    for (var k = 0; k < keys.length; k++) {
      if (Array.isArray(obj[keys[k]])) return obj[keys[k]];
    }
    return null;
  }

  function parseUnityYaml(text) {
    var obj = {};
    var lines = text.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var m = /^\s{0,4}_?([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.*)$/.exec(lines[i]);
      if (!m) continue;
      var key = m[1];
      var val = m[2].trim();
      if (key === "m_Script" || key === "m_PrefabInstance" || key === "m_PrefabAsset" ||
          key === "m_CorrespondingSourceObject" || key === "m_GameObject") continue;
      if (val === "" || obj[key] !== undefined) continue;
      obj[key] = val;
    }
    return obj;
  }

  function splitMarkdownSections(text, fileName) {
    var lines = text.split(/\r?\n/);
    var sections = [];
    var current = { heading: fileName, body: [] };
    for (var i = 0; i < lines.length; i++) {
      var headingMatch = /^#{1,3}\s+(.*)$/.exec(lines[i]);
      if (headingMatch) {
        if (current.body.length) sections.push(current);
        current = { heading: headingMatch[1].trim(), body: [] };
      } else {
        current.body.push(lines[i]);
      }
    }
    if (current.body.length) sections.push(current);
    if (!sections.length) sections.push({ heading: fileName, body: lines });
    return sections.map(function (s) { return { heading: s.heading, text: s.body.join("\n").trim() }; });
  }

  var docCounter = 0;
  function nextId(prefix) { return prefix + "_" + (docCounter++); }

  function recordToSearchText(row) {
    var parts = [];
    function walk(v) {
      if (v == null) return;
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        parts.push(String(v));
      } else if (Array.isArray(v)) {
        v.forEach(walk);
      } else if (typeof v === "object") {
        Object.keys(v).forEach(function (k) { walk(v[k]); });
      }
    }
    walk(row);
    return parts.join(" ");
  }

  function pickTitle(row) {
    return row.name || row.display_name || row.boss_name || row.id || row.boss_id || row.npc_id ||
      row.shop_id || row.dungeon_id || row.item_id || row.regionName || row._regionName || "Unnamed";
  }

  async function fetchManifest() {
    var res = await fetch(KB_ROOT + "manifest.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("Cannot load KnowledgeBase manifest (" + res.status + ")");
    return res.json();
  }

  async function fetchFile(category, relPath, type) {
    var url = KB_ROOT + category + "/" + relPath.split("/").map(encodeURIComponent).join("/");
    var res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error("Missing KB file: " + url);
    if (type === "json") return res.json();
    return res.text();
  }

  // Loads every manifest file and returns a flat array of normalized documents
  async function loadKnowledgeBase(onProgress) {
    var manifest = await fetchManifest();
    var categories = Object.keys(manifest.categories);
    var docs = [];
    var loaded = 0, total = manifest.totalFiles || 1;

    for (var c = 0; c < categories.length; c++) {
      var category = categories[c];
      var files = manifest.categories[category];
      for (var f = 0; f < files.length; f++) {
        var entry = files[f];
        try {
          var content = await fetchFile(category, entry.file, entry.type === "json" ? "json" : "text");
          if (entry.type === "json") {
            var arr = findRecordArray(content);
            if (arr) {
              arr.forEach(function (row) {
                docs.push({
                  docId: nextId(category),
                  category: category,
                  sourceFile: entry.file,
                  kind: "record",
                  title: pickTitle(row),
                  searchText: recordToSearchText(row),
                  data: row
                });
              });
            } else if (content && typeof content === "object") {
              docs.push({
                docId: nextId(category),
                category: category,
                sourceFile: entry.file,
                kind: "record",
                title: entry.file,
                searchText: recordToSearchText(content),
                data: content
              });
            }
          } else if (entry.type === "unity-yaml") {
            var flat = parseUnityYaml(content);
            docs.push({
              docId: nextId(category),
              category: category,
              sourceFile: entry.file,
              kind: "record",
              title: flat.regionName || flat.RegionName || entry.file,
              searchText: recordToSearchText(flat),
              data: flat
            });
          } else if (entry.type === "markdown") {
            splitMarkdownSections(content, entry.file).forEach(function (sec) {
              if (sec.text.length < 5) return;
              docs.push({
                docId: nextId(category),
                category: category,
                sourceFile: entry.file,
                kind: "text",
                title: sec.heading,
                searchText: sec.heading + " " + sec.text,
                data: sec.text
              });
            });
          } else {
            var chapterMatch = /(\d+)/.exec(entry.file);
            docs.push({
              docId: nextId(category),
              category: category,
              sourceFile: entry.file,
              kind: "text",
              title: entry.file.replace(/\.txt$/i, ""),
              chapterNumber: chapterMatch ? parseInt(chapterMatch[1], 10) : null,
              searchText: entry.file + " " + content,
              data: content
            });
          }
        } catch (e) {
          console.warn("[EO Chatbot] Skipped file due to load error:", category, entry.file, e.message);
        }
        loaded++;
        if (onProgress) onProgress(loaded, total);
      }
    }
    return docs;
  }

  global.EOKBLoader = {
    KB_ROOT: KB_ROOT,
    loadKnowledgeBase: loadKnowledgeBase,
    findRecordArray: findRecordArray
  };
})(window);
