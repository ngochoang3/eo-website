/*! EO Studio Chatbot — conversation memory (per-tab sessionStorage) */
(function (global) {
  "use strict";

  var STORAGE_KEY = "eo-chat-memory";
  var MAX_TURNS = 12;

  var PRONOUNS = ["no", "nó", "it", "this", "that", "cai do", "cai nay", "ấy", "do"].map(function (p) {
    return window.EOText.normalize(p);
  });

  function load() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { turns: [], lastEntity: null, lastCategory: null };
    } catch (e) {
      return { turns: [], lastEntity: null, lastCategory: null };
    }
  }

  function save(state) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function remember(state, userText, answerText, entity, category) {
    state.turns.push({ user: userText, answer: answerText, ts: Date.now() });
    if (state.turns.length > MAX_TURNS) state.turns.shift();
    if (entity) { state.lastEntity = entity; state.lastCategory = category || state.lastCategory; }
    save(state);
    return state;
  }

  function containsPronoun(text) {
    var tokens = window.EOText.tokenize(text);
    return tokens.some(function (t) { return PRONOUNS.indexOf(t) !== -1; });
  }

  // If the question uses a pronoun and we have a last topic, splice the entity's
  // name into the question so downstream search/NLU can resolve it normally.
  function resolvePronoun(state, text) {
    if (!state.lastEntity || !containsPronoun(text)) return text;
    return text + " " + state.lastEntity;
  }

  function clear() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  global.EOMemory = {
    load: load,
    save: save,
    remember: remember,
    resolvePronoun: resolvePronoun,
    containsPronoun: containsPronoun,
    clear: clear
  };
})(window);
