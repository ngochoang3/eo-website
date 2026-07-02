/*! EO Studio Chatbot — ChatGPT-style floating widget UI */
(function (global) {
  "use strict";

  var MSG_STORAGE_KEY = "eo-chat-messages";
  var THEME_STORAGE_KEY = "eo-chat-theme";

  function loadMessages() {
    try {
      var raw = sessionStorage.getItem(MSG_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveMessages(list) {
    try { sessionStorage.setItem(MSG_STORAGE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") node.className = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function buildWidget() {
    var root = el("div", { id: "eo-chat-widget", "data-theme": localStorage.getItem(THEME_STORAGE_KEY) || "dark" });

    var bubble = el("button", { id: "eo-chat-bubble", "aria-label": "Mở trợ lý EO Assistant — Tra cứu tự động", type: "button" }, [
      el("span", { class: "eo-chat-bubble-icon", html: "💬" }),
      el("span", { class: "eo-chat-bubble-label", html: "AI" })
    ]);

    var panel = el("section", { id: "eo-chat-panel", "aria-label": "EO Assistant", role: "dialog" });

    var header = el("header", { class: "eo-chat-header" }, [
      el("div", { class: "eo-chat-header-title" }, [
        el("span", { class: "eo-chat-avatar", html: "🟢" }),
        el("div", null, [
          el("strong", { html: "EO Assistant" }),
          el("span", { class: "eo-chat-subtitle", id: "eo-chat-status", html: "Đang khởi động…" })
        ])
      ]),
      el("div", { class: "eo-chat-header-actions" }, [
        el("button", { class: "eo-chat-icon-btn", id: "eo-chat-admin-btn", title: "Admin", type: "button", html: "⚙️" }),
        el("button", { class: "eo-chat-icon-btn", id: "eo-chat-theme-btn", title: "Đổi giao diện", type: "button", html: "🌙" }),
        el("button", { class: "eo-chat-icon-btn", id: "eo-chat-close-btn", title: "Đóng", type: "button", html: "✕" })
      ])
    ]);

    var messages = el("div", { class: "eo-chat-messages", id: "eo-chat-messages" });

    var typing = el("div", { class: "eo-chat-typing", id: "eo-chat-typing", style: "display:none" }, [
      el("span", null), el("span", null), el("span", null)
    ]);

    var form = el("form", { class: "eo-chat-input-row", id: "eo-chat-form" }, [
      el("input", {
        type: "text", id: "eo-chat-input", autocomplete: "off",
        placeholder: "Hỏi về item, boss, NPC, quest, map…", "aria-label": "Nhập câu hỏi"
      }),
      el("button", { type: "submit", class: "eo-chat-send-btn", "aria-label": "Gửi", html: "➤" })
    ]);

    var adminPanel = buildAdminPanel();

    panel.appendChild(header);
    panel.appendChild(messages);
    panel.appendChild(typing);
    panel.appendChild(form);
    panel.appendChild(adminPanel);

    root.appendChild(panel);
    root.appendChild(bubble);
    document.body.appendChild(root);

    // Mark body so CSS can apply 3-button positioning
    document.body.classList.add("has-eo-chatbot");

    // Tawk.to custom trigger — positioned middle of stack (bottom: 104px)
    var tawkTrigger = el("button", {
      id: "eo-tawk-trigger",
      "aria-label": "Tư vấn trực tiếp với nhân viên",
      title: "Live chat — nhân viên tư vấn",
      type: "button"
    }, [
      el("span", { class: "eo-tawk-icon", html: "👤" }),
      el("span", { class: "eo-tawk-label", html: "Live" })
    ]);
    document.body.appendChild(tawkTrigger);

    tawkTrigger.addEventListener("click", function() {
      if (window.Tawk_API && typeof window.Tawk_API.toggle === "function") {
        window.Tawk_API.toggle();
      } else if (window.Tawk_API && typeof window.Tawk_API.maximize === "function") {
        window.Tawk_API.maximize();
      }
    });

    // Hide native Tawk.to bubble so our custom button takes its place
    window.Tawk_API = window.Tawk_API || {};
    (function() {
      var _prev = window.Tawk_API.onLoad;
      window.Tawk_API.onLoad = function() {
        if (typeof window.Tawk_API.hideWidget === "function") window.Tawk_API.hideWidget();
        if (typeof _prev === "function") _prev();
      };
    })();

    return { root: root, bubble: bubble, panel: panel, messages: messages, typing: typing, form: form, tawkTrigger: tawkTrigger };
  }

  function buildAdminPanel() {
    return el("div", { class: "eo-chat-admin", id: "eo-chat-admin-panel", style: "display:none" }, [
      el("h4", { html: "Admin Tools" }),
      el("p", { class: "eo-chat-admin-stats", id: "eo-chat-admin-stats", html: "" }),
      el("div", { class: "eo-chat-admin-actions" }, [
        el("button", { type: "button", id: "eo-admin-rebuild", class: "btn btn-sm btn-outline", html: "Rebuild Index" }),
        el("button", { type: "button", id: "eo-admin-reload", class: "btn btn-sm btn-outline", html: "Reload KnowledgeBase" }),
        el("button", { type: "button", id: "eo-admin-clear-cache", class: "btn btn-sm btn-outline", html: "Clear Cache" }),
        el("button", { type: "button", id: "eo-admin-export", class: "btn btn-sm btn-outline", html: "Export Search Report" })
      ]),
      el("pre", { class: "eo-chat-admin-log", id: "eo-chat-admin-log" })
    ]);
  }

  function appendMessage(ui, role, text, opts) {
    opts = opts || {};
    var bubble = el("div", { class: "eo-chat-msg eo-chat-msg-" + role });
    var content = el("div", { class: "eo-chat-msg-bubble" });
    bubble.appendChild(content);
    ui.messages.appendChild(bubble);
    ui.messages.scrollTop = ui.messages.scrollHeight;

    if (role === "bot" && opts.stream) {
      streamText(content, text, function () { ui.messages.scrollTop = ui.messages.scrollHeight; });
    } else {
      content.textContent = text;
    }
    return content;
  }

  function streamText(node, text, onTick) {
    var i = 0;
    var speed = text.length > 400 ? 4 : 2;
    node.classList.add("eo-streaming");
    var interval = setInterval(function () {
      i += speed;
      node.textContent = text.slice(0, i);
      if (onTick) onTick();
      if (i >= text.length) {
        clearInterval(interval);
        node.classList.remove("eo-streaming");
      }
    }, 12);
  }

  function setStatus(text) {
    var statusEl = document.getElementById("eo-chat-status");
    if (statusEl) statusEl.textContent = text;
  }

  function init() {
    var ui = buildWidget();
    var messageLog = loadMessages();

    messageLog.forEach(function (m) { appendMessage(ui, m.role, m.text); });
    if (!messageLog.length) {
      appendMessage(ui, "bot", "Xin chào! Mình là EO Assistant — hỏi mình về item, boss, NPC, quest, map, skill, shop, crafting… trong game EO nhé.");
    }

    function openPanel() {
      ui.root.classList.add("eo-chat-open");
      document.getElementById("eo-chat-input").focus();
      if (!window.EOChatEngine.isReady()) {
        setStatus("Đang tải dữ liệu game…");
        window.EOChatEngine.init(function (loaded, total) {
          setStatus("Đang tải dữ liệu (" + loaded + "/" + total + ")…");
        }).then(function () {
          var stats = window.EOChatEngine.getStats();
          setStatus("Sẵn sàng · " + stats.totalDocs + " mục dữ liệu" + (stats.fromCache ? " (cache)" : ""));
        });
      } else {
        setStatus("Sẵn sàng");
      }
    }
    function closePanel() { ui.root.classList.remove("eo-chat-open"); }

    ui.bubble.addEventListener("click", function () {
      ui.root.classList.contains("eo-chat-open") ? closePanel() : openPanel();
    });
    document.getElementById("eo-chat-close-btn").addEventListener("click", closePanel);

    document.getElementById("eo-chat-theme-btn").addEventListener("click", function () {
      var next = ui.root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      ui.root.setAttribute("data-theme", next);
      try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch (e) {}
    });

    document.getElementById("eo-chat-admin-btn").addEventListener("click", function () {
      window.EOChatAdmin.togglePanel();
    });

    ui.form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var input = document.getElementById("eo-chat-input");
      var text = input.value.trim();
      if (!text) return;
      input.value = "";

      appendMessage(ui, "user", text);
      messageLog.push({ role: "user", text: text });
      saveMessages(messageLog);

      ui.typing.style.display = "flex";
      ui.messages.scrollTop = ui.messages.scrollHeight;
      var startedAt = performance.now();
      try {
        var result = await window.EOChatEngine.ask(text);
        ui.typing.style.display = "none";
        appendMessage(ui, "bot", result.text, { stream: true });
        messageLog.push({ role: "bot", text: result.text });
        saveMessages(messageLog);
        window.EOChatAdmin.logSearch(text, result, performance.now() - startedAt);
      } catch (err) {
        ui.typing.style.display = "none";
        var msg = "Xin lỗi, có lỗi khi xử lý câu hỏi. Vui lòng thử lại.";
        appendMessage(ui, "bot", msg);
        console.error("[EO Chatbot]", err);
      }
    });

    window.EOChatAdmin.attach(ui);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.EOChatUI = { appendMessage: appendMessage, setStatus: setStatus };
})(window);
