/*! EO Studio / eo.io.vn — Header, drawer, back-to-top, reveal, parallax, dynamic collections */
(function(){
  "use strict";

  /* ---------- PWA service worker ---------- */
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", function(){
      navigator.serviceWorker.register("sw.js").catch(function(){});
    });
  }

  /* ---------- Sticky header ---------- */
  var header = document.querySelector(".site-header");
  function onScroll(){
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile drawer ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var drawer = document.querySelector(".nav-drawer");
  var overlay = document.querySelector(".drawer-overlay");
  function closeDrawer(){
    if (!toggle || !drawer) return;
    toggle.setAttribute("aria-expanded", "false");
    drawer.classList.remove("is-open");
    if (overlay) overlay.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  function openDrawer(){
    toggle.setAttribute("aria-expanded", "true");
    drawer.classList.add("is-open");
    if (overlay) overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  if (toggle && drawer) {
    toggle.addEventListener("click", function(){
      var open = toggle.getAttribute("aria-expanded") === "true";
      open ? closeDrawer() : openDrawer();
    });
    drawer.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", closeDrawer); });
    if (overlay) overlay.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function(e){ if (e.key === "Escape") closeDrawer(); });
  }

  /* ---------- Back to top ---------- */
  var backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    document.addEventListener("scroll", function(){
      backToTop.classList.toggle("is-visible", window.scrollY > 480);
    }, { passive: true });
    backToTop.addEventListener("click", function(){
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealEls.forEach(function(el){ io.observe(el); });
    } else {
      revealEls.forEach(function(el){ el.classList.add("is-visible"); });
    }
  }

  /* ---------- Hero parallax (light, disabled on reduced motion) ---------- */
  var heroBg = document.querySelector(".hero-bg");
  var heroSlime = document.querySelector(".hero-slime");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ((heroBg || heroSlime) && !reduceMotion) {
    var ticking = false;
    document.addEventListener("scroll", function(){
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function(){
        var y = window.scrollY;
        if (heroBg) heroBg.style.transform = "translateY(" + (y * 0.25) + "px)";
        if (heroSlime) heroSlime.style.transform = "translateY(" + (y * 0.12) + "px)";
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Dynamic image-driven collections ---------- */
  /* Probes image/<prefix><n>.<ext> sequentially; stops after 2 consecutive
     misses past the known baseline count. New files dropped into image/
     (e.g. world-18.webp) are picked up automatically — no HTML edits needed. */
  function probeImage(src){
    return new Promise(function(resolve){
      var img = new Image();
      img.onload = function(){ resolve(src); };
      img.onerror = function(){ resolve(null); };
      img.src = src;
    });
  }

  function pad(n, len){
    var s = String(n);
    while (s.length < len) s = "0" + s;
    return s;
  }

  /* Used only while the production *-NN.webp assets haven't been dropped in
     yet, so sections render real artwork instead of staying blank. As soon as
     a matching file (e.g. image/world-01.webp) exists, the probe finds it and
     this fallback pool is bypassed automatically. */
  var FALLBACK_POOL = ["image/bgmenu.png","image/fantasy-world-map.png","image/Untitled-2.png","image/Untitled-3.png","image/Untitled-5.png","image/Untitled-6.png","image/Untitled-7.png","image/Untitled-8.png","image/Untitled-9.png","image/Untitled-13.png","image/banner.png"];

  async function discoverCollection(key){
    var cfg = window.APPALO && APPALO.COLLECTIONS && APPALO.COLLECTIONS[key];
    if (!cfg) return [];
    var found = [];
    var misses = 0;
    var i = 1;
    while (true) {
      var src = cfg.prefix + pad(i, cfg.pad) + "." + cfg.ext;
      var ok = await probeImage(src);
      if (ok) {
        found.push({ index: i, src: ok });
        misses = 0;
      } else {
        misses++;
        if (i > cfg.count && misses >= 2) break;
        if (i > cfg.count + 30) break;
      }
      i++;
    }
    if (!found.length) {
      for (var n = 1; n <= cfg.count; n++) {
        found.push({ index: n, src: FALLBACK_POOL[(n - 1) % FALLBACK_POOL.length] });
      }
    }
    return found;
  }

  function lang(){
    return (window.AppaloI18N && AppaloI18N.currentLang()) || "vi";
  }
  function t(key){
    var dict = (window.APPALO && APPALO.I18N && APPALO.I18N[lang()]) || {};
    return dict[key] || key;
  }

  async function renderWorlds(){
    var grid = document.querySelector("[data-collection='world']");
    if (!grid) return;
    var items = await discoverCollection("world");
    var data = (window.APPALO_DATA && APPALO_DATA.worlds) || [];
    grid.innerHTML = items.map(function(item){
      var meta = data.find(function(d){ return d.index === item.index; }) || {};
      var name = meta["name_" + lang()] || ("EO " + t("world.tag") + " " + item.index);
      var desc = meta["desc_" + lang()] || t("world.cardDesc");
      return (
        '<article class="world-card reveal">' +
          '<div class="media"><img src="' + item.src + '" alt="' + name + '" loading="lazy" width="480" height="360"></div>' +
          '<div class="body"><span class="tag">' + t("world.tag") + ' ' + item.index + '</span>' +
          '<h3>' + name + '</h3><p>' + desc + '</p></div>' +
        '</article>'
      );
    }).join("");
    grid.querySelectorAll(".reveal").forEach(function(el){ el.classList.add("is-visible"); });
  }

  async function renderNews(){
    var grid = document.querySelector("[data-collection='news']");
    if (!grid) return;
    var items = await discoverCollection("news");
    var data = (window.APPALO_DATA && APPALO_DATA.news) || [];
    grid.innerHTML = items.map(function(item){
      var meta = data.find(function(d){ return d.index === item.index; }) || {};
      var title = meta["title_" + lang()] || ("EO Update #" + item.index);
      var date = meta.date || "2026-06-01";
      var excerpt = meta["excerpt_" + lang()] || t("news.excerpt");
      return (
        '<article class="news-card reveal">' +
          '<div class="media"><img src="' + item.src + '" alt="' + title + '" loading="lazy" width="480" height="300"></div>' +
          '<div class="body"><time datetime="' + date + '">' + date + '</time>' +
          '<h3>' + title + '</h3><p>' + excerpt + '</p>' +
          '<a class="read-more" href="news.html">' + t("news.readmore") + ' →</a></div>' +
        '</article>'
      );
    }).join("");
    grid.querySelectorAll(".reveal").forEach(function(el){ el.classList.add("is-visible"); });
  }

  async function renderGallery(){
    var root = document.querySelector("[data-slider-dynamic]");
    if (!root) return;
    var items = await discoverCollection("gallery");
    var track = root.querySelector(".slider-track");
    var dots = root.querySelector(".slider-dots");
    if (!track) return;
    track.innerHTML = items.map(function(item, i){
      return '<div class="slider-slide"><img src="' + item.src + '" alt="EO gameplay screenshot ' + (i + 1) + '" loading="' + (i === 0 ? "eager" : "lazy") + '" width="1200" height="600"></div>';
    }).join("");
    if (dots) dots.innerHTML = "";
    if (items.length && window.AppaloSlider) window.AppaloSlider.init(root);
  }

  var dataCache = {};
  function loadJSON(path){
    if (dataCache[path]) return dataCache[path];
    dataCache[path] = fetch(path).then(function(r){ return r.ok ? r.json() : []; }).catch(function(){ return []; });
    return dataCache[path];
  }

  var CLASS_FALLBACK = { warrior: "image/Untitled-10.png", mage: "image/Untitled-11.png", archer: "image/Untitled-12.png", assassin: "image/Untitled-4.png" };
  var PET_FALLBACK = { blue: "image/Untitled-6.png", pink: "image/Untitled-7.png", green: "image/Untitled-5.png", purple: "image/Untitled-9.png" };

  async function renderClasses(){
    var grid = document.querySelector("[data-collection='classes']");
    if (!grid) return;
    var data = await loadJSON("assets/data/classes.json");
    if (!data.length) return;
    grid.innerHTML = data.map(function(c){
      var name = c["name_" + lang()];
      var desc = c["desc_" + lang()];
      var fallback = CLASS_FALLBACK[c.id] || "image/icon.png";
      return (
        '<article class="class-card reveal is-visible">' +
          '<div class="media"><img src="' + c.image + '" alt="' + name + '" loading="lazy" width="320" height="320" onerror="this.onerror=null;this.src=\'' + fallback + '\'"></div>' +
          '<h3>' + name + '</h3><p>' + desc + '</p>' +
        '</article>'
      );
    }).join("");
  }

  async function renderPets(){
    var grid = document.querySelector("[data-collection='pets']");
    if (!grid) return;
    var data = await loadJSON("assets/data/pets.json");
    if (!data.length) return;
    grid.innerHTML = data.map(function(p){
      var name = p["name_" + lang()];
      var rarity = t("pets.rarity." + p.rarity);
      var fallback = PET_FALLBACK[p.id] || "image/icon.png";
      return (
        '<article class="pet-card reveal is-visible">' +
          '<div class="media"><img src="' + p.image + '" alt="' + name + '" loading="lazy" width="200" height="200" onerror="this.onerror=null;this.src=\'' + fallback + '\'"></div>' +
          '<h3>' + name + '</h3><span class="rarity">' + rarity + '</span>' +
        '</article>'
      );
    }).join("");
  }

  function rerender(){
    renderWorlds();
    renderNews();
    renderGallery();
    renderClasses();
    renderPets();
  }

  document.addEventListener("eo:langchange", rerender);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", rerender);
  } else {
    rerender();
  }

  /* ---------- Tech tabs ---------- */
  document.querySelectorAll(".tech-tab").forEach(function(btn){
    btn.addEventListener("click", function(){
      var panel = btn.getAttribute("data-panel");
      document.querySelectorAll(".tech-tab").forEach(function(b){ b.classList.remove("active"); b.setAttribute("aria-selected","false"); });
      document.querySelectorAll(".tech-panel").forEach(function(p){ p.classList.remove("active"); });
      btn.classList.add("active");
      btn.setAttribute("aria-selected","true");
      var el = document.getElementById("tech-" + panel);
      if (el) el.classList.add("active");
    });
  });

  /* ---------- Mega menu keyboard (Escape to close) ---------- */
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape") {
      document.querySelectorAll(".nav-mega-trigger").forEach(function(t){ t.setAttribute("aria-expanded","false"); });
    }
  });

  /* ---------- Stats counter animation ---------- */
  var counters = document.querySelectorAll(".stat-card .num[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var counterIO = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute("data-count"), 10);
        var suffix = el.getAttribute("data-suffix") || "";
        var duration = 1500;
        var start = performance.now();
        function tick(now){
          var progress = Math.min((now - start) / duration, 1);
          var ease = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(ease * target) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        counterIO.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function(el){ counterIO.observe(el); });
  }
})();
