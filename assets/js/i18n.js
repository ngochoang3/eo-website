/*! Appalo / e.io.vn — Language detection & switching (VI / EN) */
(function(){
  "use strict";
  var STORAGE_KEY = "appalo-lang";

  function detectBrowserLang(){
    var nav = navigator.language || navigator.userLanguage || "en";
    return nav.toLowerCase().indexOf("vi") === 0 ? "vi" : "en";
  }

  function getStoredLang(){
    try { return localStorage.getItem(STORAGE_KEY); } catch(e){ return null; }
  }

  function storeLang(lang){
    try { localStorage.setItem(STORAGE_KEY, lang); } catch(e){}
  }

  function currentLang(){
    return getStoredLang() || detectBrowserLang();
  }

  function translate(lang){
    var dict = (window.APPALO && APPALO.I18N && APPALO.I18N[lang]) || {};
    document.documentElement.setAttribute("lang", lang === "vi" ? "vi" : "en");

    document.querySelectorAll("[data-i18n]").forEach(function(el){
      var key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function(el){
      var key = el.getAttribute("data-i18n-html");
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(function(el){
      var spec = el.getAttribute("data-i18n-attr").split(":");
      var attr = spec[0], key = spec[1];
      if (dict[key] !== undefined) el.setAttribute(attr, dict[key]);
    });

    document.querySelectorAll(".lang-switch button").forEach(function(btn){
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
      btn.setAttribute("aria-pressed", btn.getAttribute("data-lang") === lang ? "true" : "false");
    });

    var alt = document.getElementById("og-locale");
    if (alt) alt.setAttribute("content", lang === "vi" ? "vi_VN" : "en_US");

    document.dispatchEvent(new CustomEvent("appalo:langchange", { detail: { lang: lang } }));
  }

  function setLang(lang){
    storeLang(lang);
    translate(lang);
  }

  function init(){
    translate(currentLang());
    document.querySelectorAll(".lang-switch button").forEach(function(btn){
      btn.addEventListener("click", function(){
        setLang(btn.getAttribute("data-lang"));
      });
    });
  }

  window.AppaloI18N = {
    detectBrowserLang: detectBrowserLang,
    currentLang: currentLang,
    setLang: setLang
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
