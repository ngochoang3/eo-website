// EO Technology — Cloudflare Worker (Workers with Assets model)
// Handles: POST /api/search  +  all static assets via env.ASSETS
// KV binding:  EO_STATS       (Workers & Pages → eo-website → Bindings → KV)
// Secret:      CLAUDE_API_KEY (Workers & Pages → eo-website → Settings → Variables and secrets)

// ─── KV BATCHING ────────────────────────────────────────────────────────────
// Module-level: sống suốt vòng đời isolate, reset khi cold start.
// Sai số cold-start ≈ (isolates - 1) × BATCH_SIZE. Traffic thấp (<500/ngày): <5%.
let batchCount = 0;
const BATCH_SIZE = 20;
let cachedIndex = null;

// ─── SITE KEYWORDS ──────────────────────────────────────────────────────────
const SITE_KEYWORDS = [
  'eo technology', 'eo.io.vn', 'eo studio',
  'hosting', 'cloud hosting', 'shared hosting',
  'vps', 'server', 'root access',
  'web', 'website', 'landing page', 'ecommerce', 'wordpress', 'nextjs', 'react',
  'mobile app', 'ios', 'android', 'react native', 'flutter',
  'game dev', 'unity', 'liveops', 'cloud ball',
  'ai solutions', 'chatbot', 'rag', 'automation', 'llm',
  'saas', 'platform', 'b2b', 'subscription',
  'giá', 'bảng giá', 'pricing', 'usd', 'tháng',
  'ssl', 'nvme', 'bandwidth', 'ovh', 'anti-ddos',
  'thanh toán', 'payment', 'paypal', 'hóa đơn', 'invoice',
  'tư vấn', 'liên hệ', 'contact', 'telegram',
  'portfolio', 'blog', 'faq', 'bảo hành', 'hỗ trợ kỹ thuật',
  'dịch vụ', 'service', 'thiết kế', 'phát triển',
];

// ─── MODERATION ─────────────────────────────────────────────────────────────
const ALLOW_PATTERNS = [
  /phòng chống|bảo vệ|ngăn chặn|phát hiện|cách phát hiện/i,
  /anti[\s-]?(phishing|malware|virus|ddos|spam|ransomware)/i,
  /bảo mật (doanh nghiệp|tổ chức|hệ thống|cho công ty|website)/i,
  /security (consulting|audit|assessment|for business|awareness|training)/i,
  /kiểm thử bảo mật|pentest|penetration test|vulnerability assessment/i,
  /tư vấn bảo mật|đào tạo bảo mật|security awareness/i,
  /cách (phòng|chống|ngăn|detect|nhận biết)/i,
];

const BLOCK_PATTERNS = [
  /\b(tạo|viết|code|build|make|create)\b.{0,40}\b(malware|virus|trojan|ransomware|keylogger|spyware|worm|rootkit)\b/i,
  /\b(how to hack|cách hack|hướng dẫn hack|dạy hack)\b/i,
  /\bhack\s+(website|server|account|database|hệ thống|ngân hàng|email)\b/i,
  /\b(sql injection|xss|csrf)\b.{0,40}\b(tutorial|how to|hướng dẫn thực hiện|cách tấn công|exploit)\b/i,
  /\b(tạo|làm|dựng|build|create)\b.{0,30}\b(trang giả|fake (login|website|page)|phishing (page|site|email|kit))\b/i,
  /\b(ddos|dos attack|botnet)\b.{0,30}\b(attack|tấn công|hit|flood|target)\b/i,
  /\b(crack|bypass|exploit)\b.{0,20}\b(license|authentication|firewall|security system|IDS|WAF|captcha)\b/i,
  /\b(child|trẻ em|minor|thiếu niên)\b.{0,20}\b(porn|nude|khiêu dâm|sexual|sex)\b/i,
  /\b(porn|pornography|phim sex|clip sex|ảnh sex|nude (photo|pic|leak|free))\b/i,
  /\b(onlyfans|adult (content|site|video))\b.{0,20}\b(free|crack|leak|share|download)\b/i,
  /\b(mua|bán|sell|buy|order|đặt)\b.{0,20}\b(ma túy|cần sa|heroin|cocaine|methamphetamine|thuốc lắc|drugs)\b/i,
  /\b(mua|bán|làm|tự chế|in 3d|tìm|get|acquire)\b.{0,30}\b(súng|vũ khí|gun|firearm|weapon|explosive|bomb|thuốc nổ|grenade)\b/i,
  /\b(unregistered (gun|firearm)|illegal weapon|ghost gun)\b/i,
  /\b(lật đổ|phản động|kêu gọi (biểu tình|bạo loạn|khởi nghĩa)|overthrow (government|regime))\b/i,
  /\b(tuyên truyền chống (nhà nước|chính phủ|đảng)|anti-government propaganda)\b/i,
  /\b(tất cả (người|dân tộc|nhóm).{0,20}(nên bị|phải bị|should be) (giết|trục xuất|eliminated|killed|removed))\b/i,
  /\b(racial slur|hate speech|kỳ thị (chủng tộc|người|dân tộc))\b/i,
  /\b(white supremac|ethnic cleansing|genocide)\b/i,
  /\b(cách tự (tử|kết liễu|làm hại bản thân)|how to (commit suicide|self.?harm|end (my|one.?s) life))\b/i,
  /\b(tự tử|suicide)\b.{0,30}\b(phương pháp|cách thực hiện|how to|hướng dẫn|liều lượng)\b/i,
  /\b(thuốc nào.{0,20}(để chết|gây chết|overdose))\b/i,
  /\b(chữa (ung thư|cancer|hiv|aids|covid)\b.{0,40}\b(bằng|với|using|dùng)\b.{0,40}(tỏi|gừng|vitamin c|bicarbonate|thuốc nam không rõ|homeopathy|prayer))\b/i,
  /\b(vaccine (gây|causes?)\s+(autism|tự kỷ|chết|ung thư))\b/i,
  /\b(kiếm\s+\$?\d{3,}.{0,15}(ngày|ngay|tuần|week) (mà )?không (cần|phải) (làm việc|work|effort))\b/i,
  /\b(ponzi|pyramid scheme|đa cấp lừa đảo|scam (investment|crypto))\b/i,
  /\b(guaranteed (profit|return|income)|lợi nhuận đảm bảo \d+%)\b/i,
];

function isModerationBlocked(text) {
  for (const allow of ALLOW_PATTERNS) { if (allow.test(text)) return false; }
  for (const block of BLOCK_PATTERNS) { if (block.test(text)) return true; }
  return false;
}

// ─── SEARCH ─────────────────────────────────────────────────────────────────
// Common Vietnamese stopwords — filter from queries to avoid false boosts in long body text
const VI_STOPWORDS = new Set([
  'của','và','cho','với','trong','tại','các','này','đó','có','không','là','một','được',
  'từ','khi','hay','cũng','đây','như','rất','sẽ','đã','bạn','chúng','mọi','theo','hơn',
  'nhất','mình','vào','lên','xuống','trên','dưới','sau','trước','gồm','thêm','đến','về',
  'qua','nào','bao','làm','đang','những','họ','tôi','mỗi','nếu','cần','phải','luôn','đều',
  'bởi','vì','nên','thì','mà','còn','nhưng','hoặc','vẫn','muốn','biết','tìm','hỏi',
]);

function tokenize(text) {
  return text.toLowerCase().replace(/[^\wÀ-ỹ\s]/gu, ' ').split(/\s+/)
    .filter(t => t.length > 2 && !VI_STOPWORDS.has(t));
}

function searchIndex(index, query, limit = 6) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const hits = [];

  for (const doc of index) {
    const tagHaystack = [(doc.tags || []).join(' '), doc.title].join(' ').toLowerCase();
    let tagBoost = 0;
    for (const tok of tokens) { if (tagHaystack.includes(tok)) tagBoost += 2; }

    // Pricing-intent: "giá", "bảng", "phí", "price" in query → boost entries with actual prices
    const hasPricingIntent = tokens.some(t => ['giá','bảng','phí','price','pricing'].includes(t));

    if (doc.entries && doc.entries.length > 0) {
      for (const entry of doc.entries) {
        const haystack = [entry.heading, entry.text].join(' ').toLowerCase();
        let score = tagBoost;
        for (const tok of tokens) {
          score += (haystack.match(new RegExp(tok, 'gi')) || []).length;
          if (entry.heading.toLowerCase().includes(tok)) score += 5;
        }
        // Strong boost: entry has real price pattern AND query is price-intent
        if (hasPricingIntent && /\$\d+\.\d+\s*\/?\s*tháng/.test(entry.text)) score += 10;
        // Extra boost for clean customer plan entries (short heading = plan name, not infra context)
        if (hasPricingIntent && /\$\d+\.\d+\s*\/?\s*tháng/.test(entry.text) && entry.heading.length < 25) score += 10;
        if (score > tagBoost) hits.push({ doc, entry, score });
      }
    } else {
      // Legacy schema without entries — fall back to page-level scoring
      const haystack = [doc.title, doc.summary || '', doc.content || '', (doc.tags || []).join(' ')].join(' ').toLowerCase();
      let score = 0;
      for (const tok of tokens) {
        score += (haystack.match(new RegExp(tok, 'gi')) || []).length;
        if (doc.title.toLowerCase().includes(tok)) score += 4;
        if ((doc.tags || []).some(t => t.includes(tok))) score += 2;
      }
      if (score > 0) hits.push({ doc, entry: { heading: doc.title, text: doc.summary || '' }, score });
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

function escHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatSiteAnswer(results) {
  if (!results.length) return '';
  const topPageUrl   = results[0].doc.url;
  const topPageTitle = results[0].doc.title.replace(/\s*[|—–-]\s*EO Technology\s*$/i, '').trim();
  const samePageHits = results.filter(r => r.doc.url === topPageUrl);
  const otherHits    = results.filter(r => r.doc.url !== topPageUrl).slice(0, 2);

  // Sort same-page hits: price entries with short headings (customer plans) first,
  // then price entries with long headings (context/infra), then non-price entries
  const PRICE_DISPLAY_RE = /\$\d+\.\d+/;
  const sortedHits = [...samePageHits].sort((a, b) => {
    const aHasPrice = PRICE_DISPLAY_RE.test(a.entry.text) ? 1 : 0;
    const bHasPrice = PRICE_DISPLAY_RE.test(b.entry.text) ? 1 : 0;
    if (aHasPrice !== bHasPrice) return bHasPrice - aHasPrice; // price entries first
    if (aHasPrice && bHasPrice) return a.entry.heading.length - b.entry.heading.length; // shorter heading first
    return 0; // preserve score order otherwise
  });

  let html = '';
  if (sortedHits.length >= 2) {
    html += `<strong>${escHtml(topPageTitle)}</strong><br><br>`;
    for (const r of sortedHits.slice(0, 5)) {
      const body = escHtml(
        r.entry.text
          .replace(new RegExp('^' + r.entry.heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[—:–\\s]*'), '')
          .slice(0, 220)
      );
      html += `• <strong>${escHtml(r.entry.heading)}</strong>: ${body}<br>`;
    }
    html += `<br><a href="${topPageUrl}" target="_blank">Xem chi tiết →</a>`;
  } else {
    const top = results[0];
    html = `<strong>${escHtml(top.entry.heading)}</strong><br>${escHtml(top.entry.text.slice(0, 400))}`;
    html += `<br><br><a href="${topPageUrl}" target="_blank">${escHtml(topPageTitle)} →</a>`;
  }

  if (otherHits.length > 0) {
    html += '<br><br><strong>Có thể bạn cần:</strong><br>';
    for (const r of otherHits) html += `• <a href="${r.doc.url}" target="_blank">${escHtml(r.entry.heading)}</a><br>`;
  }
  return html;
}

async function loadSiteIndex(env) {
  if (cachedIndex !== null) return cachedIndex;
  try {
    // Use env.ASSETS.fetch() to read directly from asset bundle — bypasses
    // Cloudflare CDN cache (no stale BOM-version risk from cf.cacheTtl).
    const res = await env.ASSETS.fetch(new Request('https://eo.io.vn/site-index.json'));
    if (res.ok) {
      const text = await res.text();
      // Defensive: strip UTF-8 BOM (0xEF 0xBB 0xBF) if still present
      cachedIndex = JSON.parse(text.replace(/^﻿/, ''));
    } else {
      cachedIndex = [];
    }
  } catch (e) {
    console.error('[EO Worker] loadSiteIndex failed:', e?.message);
    cachedIndex = [];
  }
  return cachedIndex;
}

// ─── RATE LIMITING ──────────────────────────────────────────────────────────
const RL_GLOBAL_DAILY = 50;
const RL_IP_HOURLY    = 5;

async function checkAndIncrementRateLimit(env, ctx, clientIP) {
  if (!env.EO_STATS) return true;
  const now     = new Date();
  const dayKey  = `rl:g:${now.toISOString().slice(0, 10)}`;
  const ipHash  = btoa(clientIP || 'unknown').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
  const hourKey = `rl:ip:${ipHash}:${now.toISOString().slice(0, 13)}`;
  const [globalVal, ipVal] = await Promise.all([
    env.EO_STATS.get(dayKey),
    env.EO_STATS.get(hourKey),
  ]);
  const globalCount = parseInt(globalVal ?? '0', 10);
  const ipCount     = parseInt(ipVal ?? '0', 10);
  if (globalCount >= RL_GLOBAL_DAILY || ipCount >= RL_IP_HOURLY) return false;
  ctx.waitUntil(Promise.all([
    env.EO_STATS.put(dayKey,  String(globalCount + 1), { expirationTtl: 86400 }),
    env.EO_STATS.put(hourKey, String(ipCount + 1),     { expirationTtl: 3600  }),
  ]));
  return true;
}

// ─── CLAUDE API ─────────────────────────────────────────────────────────────
async function callClaude(question, apiKey) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: [
        'Bạn là trợ lý AI của EO Technology (eo.io.vn).',
        'Công ty cung cấp: Cloud Hosting (OVH/NVMe), VPS riêng, Web Development,',
        'Mobile App, Game Development (Unity), AI Solutions, SaaS Platform.',
        'Trả lời ngắn gọn, chính xác, bằng tiếng Việt.',
        'Nếu câu hỏi không liên quan đến công nghệ hoặc dịch vụ EO,',
        'trả lời lịch sự rằng bạn chỉ hỗ trợ tư vấn công nghệ.',
      ].join(' '),
      messages: [{ role: 'user', content: question }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}`);
  const data = await res.json();
  return data?.content?.[0]?.text ?? 'Không có dữ liệu';
}

// ─── KV USAGE TRACKING ──────────────────────────────────────────────────────
function maybeFlushKV(env, ctx) {
  if (!env.EO_STATS || batchCount < BATCH_SIZE) return;
  const toFlush = batchCount;
  batchCount = 0;
  ctx.waitUntil((async () => {
    const key = `usage:${new Date().toISOString().slice(0, 10)}`;
    try {
      const cur = parseInt(await env.EO_STATS.get(key) ?? '0', 10);
      await env.EO_STATS.put(key, String(cur + toFlush), { expirationTtl: 604800 });
    } catch { batchCount += toFlush; }
  })());
}

// ─── CORS ───────────────────────────────────────────────────────────────────
const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://eo.io.vn',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

// ─── MAIN WORKER EXPORT ─────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route: /api/search
    if (url.pathname === '/api/search') {
      // CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS });
      }

      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
      }

      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'Invalid JSON' }, 400); }

      const question = String(body?.question ?? '').trim().slice(0, 500);
      if (!question) return json({ error: 'Missing question' }, 400);

      batchCount++;
      maybeFlushKV(env, ctx);

      // Branch 3: Moderation
      if (isModerationBlocked(question)) {
        return json({ branch: 'moderation', answer: 'Không có dữ liệu', sources: [] });
      }

      // Branch 1: Site search
      const lc = question.toLowerCase();
      if (SITE_KEYWORDS.some(kw => lc.includes(kw))) {
        const index = await loadSiteIndex(env);
        const hits  = searchIndex(index, question, 8);
        if (hits.length > 0) {
          // Deduplicate sources by page URL
          const sources = [...new Map(
            hits.map(r => [r.doc.url, { title: r.doc.title.split('|')[0].trim(), url: r.doc.url }])
          ).values()].slice(0, 3);
          return json({
            branch:  'site',
            answer:  formatSiteAnswer(hits),
            sources,
          });
        }
      }

      // Branch 2: Claude AI (rate-limited)
      if (env.CLAUDE_API_KEY) {
        const clientIP = request.headers.get('CF-Connecting-IP') ?? '';
        const allowed  = await checkAndIncrementRateLimit(env, ctx, clientIP);
        if (!allowed) {
          return json({
            branch: 'fallback',
            answer: 'Vui lòng liên hệ trực tiếp qua Telegram <a href="https://t.me/eoiovn">@eoiovn</a> hoặc email eotechnologys@gmail.com.',
            sources: [],
          });
        }
        try {
          const aiAnswer = await callClaude(question, env.CLAUDE_API_KEY);
          return json({ branch: 'ai', answer: aiAnswer, sources: [] });
        } catch { /* fall through */ }
      }

      return json({
        branch: 'fallback',
        answer: 'Vui lòng liên hệ trực tiếp qua Telegram <a href="https://t.me/eoiovn">@eoiovn</a> hoặc email eotechnologys@gmail.com.',
        sources: [],
      });
    }

    // All other requests → serve static assets
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not Found', { status: 404 });
  },
};
