/*! EO Studio Chatbot — admin tools: rebuild index / reload KB / clear cache / export report.
    NOTE (security): this is a static site with no backend, so there is no real server-side
    auth here — the passphrase below only hides the panel from casual visitors. If/when a
    backend is added, gate this panel with real authentication instead. */
(function (global) {
  "use strict";

  var ADMIN_PASSPHRASE = "eo-admin-2026";
  var unlocked = false;
  var searchLog = [];
  var MAX_LOG = 300;

  function logSearch(query, result, ms) {
    searchLog.push({
      query: query,
      resultCount: result.sources ? result.sources.length : 0,
      isFallback: !!result.isFallback,
      ms: Math.round(ms),
      ts: new Date().toISOString()
    });
    if (searchLog.length > MAX_LOG) searchLog.shift();
  }

  function appendLog(text) {
    var logEl = document.getElementById("eo-chat-admin-log");
    if (!logEl) return;
    logEl.textContent = (new Date().toLocaleTimeString() + " — " + text + "\n") + logEl.textContent;
  }

  function refreshStats() {
    var statsEl = document.getElementById("eo-chat-admin-stats");
    if (!statsEl) return;
    var stats = window.EOChatEngine.getStats();
    statsEl.textContent = "Tài liệu đã index: " + stats.totalDocs +
      " · Lần build gần nhất: " + stats.tookMs + "ms" +
      (stats.fromCache ? " (đang dùng cache)" : "") +
      " · Số câu hỏi đã ghi nhận: " + searchLog.length;
  }

  function togglePanel() {
    var panel = document.getElementById("eo-chat-admin-panel");
    if (!panel) return;
    if (panel.style.display !== "none") { panel.style.display = "none"; return; }
    if (!unlocked) {
      var input = window.prompt("Nhập mật khẩu admin:");
      if (input !== ADMIN_PASSPHRASE) {
        if (input !== null) window.alert("Sai mật khẩu.");
        return;
      }
      unlocked = true;
    }
    panel.style.display = "block";
    refreshStats();
  }

  function downloadJSON(filename, data) {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function attach(ui) {
    document.getElementById("eo-admin-rebuild").addEventListener("click", async function () {
      appendLog("Rebuilding index…");
      await window.EOChatEngine.rebuildIndex(function (loaded, total) {
        window.EOChatUI.setStatus("Đang rebuild (" + loaded + "/" + total + ")…");
      });
      appendLog("Rebuild index hoàn tất.");
      refreshStats();
    });

    document.getElementById("eo-admin-reload").addEventListener("click", async function () {
      appendLog("Reloading KnowledgeBase từ server…");
      await window.EOKBCache.clearCache();
      await window.EOChatEngine.rebuildIndex(function (loaded, total) {
        window.EOChatUI.setStatus("Đang tải lại (" + loaded + "/" + total + ")…");
      });
      appendLog("Reload KnowledgeBase hoàn tất.");
      refreshStats();
    });

    document.getElementById("eo-admin-clear-cache").addEventListener("click", async function () {
      await window.EOKBCache.clearCache();
      try { sessionStorage.clear(); } catch (e) {}
      appendLog("Đã xoá cache (IndexedDB + sessionStorage).");
    });

    document.getElementById("eo-admin-export").addEventListener("click", function () {
      downloadJSON("eo-chatbot-search-report-" + Date.now() + ".json", {
        exportedAt: new Date().toISOString(),
        stats: window.EOChatEngine.getStats(),
        searches: searchLog
      });
      appendLog("Đã export search report (" + searchLog.length + " câu hỏi).");
    });
  }

  global.EOChatAdmin = {
    attach: attach,
    togglePanel: togglePanel,
    logSearch: logSearch
  };
})(window);
