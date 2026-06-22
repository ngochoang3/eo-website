/*! EO Studio Chatbot — conversation memory (per-tab sessionStorage).
    Remembers the last resolved entity/entities so follow-up questions like
    "nó rơi gì?" can resolve "nó" without re-searching from scratch. */
(function (global) {
  "use strict";

  var STORAGE_KEY = "eo-chat-memory";
  var MAX_TURNS = 12;

  // Vietnamese-only pronoun set. Bare English words like "it"/"this"/"that"
  // are deliberately excluded — once diacritics are stripped they collide
  // with real Vietnamese words ("thật" -> "that", "đi" -> "di", etc.) and
  // would wrongly trigger pronoun resolution on unrelated questions.
  var PRONOUNS = ["no", "nó", "chung", "chúng", "cai do", "cai nay", "ấy", "boss do", "quest do", "item do", "con do"].map(function (p) {
    return window.EOText.normalize(p);
  });

  function load() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { turns: [], lastEntities: [], lastTopic: null };
    } catch (e) {
      return { turns: [], lastEntities: [], lastTopic: null };
    }
  }

  function save(state) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  // entityDocs: array of the doc(s) the answer was actually about (for "list"
  // results, all of them — so "chúng" can refer to the whole group).
  function remember(state, userText, answerText, entityDocs, topic) {
    state.turns.push({ user: userText, answer: answerText, ts: Date.now() });
    if (state.turns.length > MAX_TURNS) state.turns.shift();
    if (entityDocs && entityDocs.length) {
      state.lastEntities = entityDocs.map(function (d) {
        return { category: d.category, sourceFile: d.sourceFile, title: d.title, kind: d.kind, data: d.data };
      });
      state.lastTopic = topic || state.lastTopic;
    }
    save(state);
    return state;
  }

  function containsPronoun(text) {
    var tokens = window.EOText.tokenize(text);
    var norm = window.EOText.normalize(text);
    return tokens.some(function (t) { return PRONOUNS.indexOf(t) !== -1; }) ||
      PRONOUNS.some(function (p) { return p.indexOf(" ") !== -1 && norm.indexOf(p) !== -1; });
  }

  function clear() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  global.EOMemory = {
    load: load,
    save: save,
    remember: remember,
    containsPronoun: containsPronoun,
    clear: clear
  };
})(window);
