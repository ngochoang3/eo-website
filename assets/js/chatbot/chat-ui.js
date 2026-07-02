/*! EO Technology Chatbot — gọi /api/search, không dùng KnowledgeBase game */
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

    var bubble = el("button", { id: "eo-chat-bubble", "aria-label": "Mở trợ lý EO Assistant", type: "button" }, [
      el("span", { class: "eo-chat-bubble-icon", html: "💬" }),
      el("span", { class: "eo-chat-bubble-label", html: "AI" })
    ]);

    var panel = el("section", { id: "eo-chat-panel", "aria-label": "EO Assistant", role: "dialog" });

    var header = el("header", { class: "eo-chat-header" }, [
      el("div", { class: "eo-chat-header-title" }, [
        el("span", { class: "eo-chat-avatar", html: "🟢" }),
        el("div", null, [
          el("strong", { html: "EO Assistant" }),
          el("span", { class: "eo-chat-subtitle", id: "eo-chat-status", html: "Sẵn sàng tư vấn" })
        ])
      ]),
      el("div", { class: "eo-chat-header-actions" }, [
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
        placeholder: "Hỏi về dịch vụ, giá, kỹ thuật…", "aria-label": "Nhập câu hỏi"
      }),
      el("button", { type: "submit", class: "eo-chat-send-btn", "aria-label": "Gửi", html: "➤" })
    ]);

    panel.appendChild(header);
    panel.appendChild(messages);
    panel.appendChild(typing);
    panel.appendChild(form);

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

    tawkTrigger.addEventListener("click", function () {
      if (window.Tawk_API && typeof window.Tawk_API.toggle === "function") {
        window.Tawk_API.toggle();
      } else if (window.Tawk_API && typeof window.Tawk_API.maximize === "function") {
        window.Tawk_API.maximize();
      }
    });

    // Hide native Tawk.to bubble so our custom button takes its place
    window.Tawk_API = window.Tawk_API || {};
    (function () {
      var _prev = window.Tawk_API.onLoad;
      window.Tawk_API.onLoad = function () {
        if (typeof window.Tawk_API.hideWidget === "function") window.Tawk_API.hideWidget();
        if (typeof _prev === "function") _prev();
      };
    })();

    return { root: root, bubble: bubble, panel: panel, messages: messages, typing: typing, form: form };
  }

  function renderAnswer(html) {
    // The backend may return HTML links — keep them; escape plain text from user
    return html;
  }

  function appendMessage(ui, role, html) {
    var wrapper = el("div", { class: "eo-chat-msg eo-chat-msg-" + role });
    var bubble = el("div", { class: "eo-chat-msg-bubble" });
    if (role === "bot") {
      bubble.innerHTML = renderAnswer(html);
    } else {
      bubble.textContent = html;
    }
    wrapper.appendChild(bubble);
    ui.messages.appendChild(wrapper);
    ui.messages.scrollTop = ui.messages.scrollHeight;
  }

  function setStatus(text) {
    var s = document.getElementById("eo-chat-status");
    if (s) s.textContent = text;
  }

  function init() {
    var ui = buildWidget();
    var messageLog = loadMessages();

    messageLog.forEach(function (m) { appendMessage(ui, m.role, m.text); });
    if (!messageLog.length) {
      var welcome = "Xin chào! Mình là trợ lý <strong>EO Technology</strong>. Hỏi mình về dịch vụ, bảng giá, hosting, VPS, lập trình web, app, game hoặc bất kỳ câu hỏi kỹ thuật nào nhé 👋";
      appendMessage(ui, "bot", welcome);
    }

    function openPanel() {
      ui.root.classList.add("eo-chat-open");
      document.getElementById("eo-chat-input").focus();
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

    ui.form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var input = document.getElementById("eo-chat-input");
      var text = input.value.trim();
      if (!text) return;
      input.value = "";
      input.disabled = true;

      appendMessage(ui, "user", text);
      messageLog.push({ role: "user", text: text });
      saveMessages(messageLog);

      ui.typing.style.display = "flex";
      ui.messages.scrollTop = ui.messages.scrollHeight;
      setStatus("Đang xử lý…");

      try {
        var resp = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text }),
        });
        var data = await resp.json();
        ui.typing.style.display = "none";
        setStatus("Sẵn sàng tư vấn");

        var answerHtml = (data.answer || "Không có dữ liệu").replace(/\n/g, "<br>");

        if (data.sources && data.sources.length > 0) {
          answerHtml += '<div class="eo-chat-sources">';
          answerHtml += data.sources.map(function (s) {
            return '<a href="' + s.url + '" target="_blank" rel="noopener">' + s.title + '</a>';
          }).join(" · ");
          answerHtml += '</div>';
        }

        appendMessage(ui, "bot", answerHtml);
        messageLog.push({ role: "bot", text: data.answer || "Không có dữ liệu" });
        saveMessages(messageLog);
      } catch (err) {
        ui.typing.style.display = "none";
        setStatus("Sẵn sàng tư vấn");
        appendMessage(ui, "bot", "Xin lỗi, không kết nối được server. Vui lòng liên hệ Telegram <a href='https://t.me/eoiovn' target='_blank'>@eoiovn</a>.");
        console.error("[EO Chatbot]", err);
      } finally {
        input.disabled = false;
        input.focus();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.EOChatUI = {};
})(window);
