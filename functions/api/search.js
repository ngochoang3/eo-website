// Cloudflare Pages Function — EO Technology chatbot backend
// Route: POST /api/search
// KV binding (Cloudflare Pages Settings → Functions → KV namespace bindings): EO_STATS
// Secret   (Cloudflare Pages Settings → Functions → Environment variables):   CLAUDE_API_KEY

// ─────────────────────────────────────────────────────────────────────────────
// KV BATCHING — tránh vượt 1.000 writes/ngày (free tier)
// Module-level var: tồn tại suốt vòng đời 1 isolate, reset khi cold start.
// Cold start caveat: undercount ≈ (số isolates đang chạy - 1) × BATCH_SIZE.
// Với traffic thấp (<500 chat/ngày): ~1–2 isolates → sai số <5%.
// Set alert cảnh báo ở 70% (thay vì 90%) để bù cho sai số cold-start.
// ─────────────────────────────────────────────────────────────────────────────
let batchCount = 0;
const BATCH_SIZE = 20;

// Site index cache (per isolate, tái sử dụng sau lần fetch đầu)
let cachedIndex = null;

// ─────────────────────────────────────────────────────────────────────────────
// SITE KEYWORDS — phát hiện câu hỏi liên quan dịch vụ EO
// Bỏ 'ai' 2 ký tự vì quá ngắn, gây false-positive ("tôi ai", "ai biết")
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// MODERATION
// Allow list kiểm tra TRƯỚC — nếu match → không bao giờ block.
// Đảm bảo tư vấn bảo mật hợp pháp ("phòng chống phishing cho doanh nghiệp")
// không bị chặn nhầm.
// ─────────────────────────────────────────────────────────────────────────────
const ALLOW_PATTERNS = [
  /phòng chống|bảo vệ|ngăn chặn|phát hiện|cách phát hiện/i,
  /anti[\s-]?(phishing|malware|virus|ddos|spam|ransomware)/i,
  /bảo mật (doanh nghiệp|tổ chức|hệ thống|cho công ty|website)/i,
  /security (consulting|audit|assessment|for business|awareness|training)/i,
  /kiểm thử bảo mật|pentest|penetration test|vulnerability assessment/i,
  /tư vấn bảo mật|đào tạo bảo mật|security awareness/i,
  /cách (phòng|chống|ngăn|detect|nhận biết)/i,
];

// Block list — chỉ block ý định tạo hoặc thực hiện nội dung có hại
const BLOCK_PATTERNS = [
  // 1. Malware / attack tools
  /\b(tạo|viết|code|build|make|create)\b.{0,40}\b(malware|virus|trojan|ransomware|keylogger|spyware|worm|rootkit)\b/i,

  // 2. Hacking tutorials (tấn công)
  /\b(how to hack|cách hack|hướng dẫn hack|dạy hack)\b/i,
  /\bhack\s+(website|server|account|database|hệ thống|ngân hàng|email)\b/i,

  // 3. SQL injection / XSS dạng tutorial tấn công
  /\b(sql injection|xss|csrf)\b.{0,40}\b(tutorial|how to|hướng dẫn thực hiện|cách tấn công|exploit)\b/i,

  // 4. Tạo trang / email phishing
  /\b(tạo|làm|dựng|build|create)\b.{0,30}\b(trang giả|fake (login|website|page)|phishing (page|site|email|kit))\b/i,

  // 5. DDoS / botnet tấn công
  /\b(ddos|dos attack|botnet)\b.{0,30}\b(attack|tấn công|hit|flood|target)\b/i,

  // 6. Crack / bypass bảo mật (ngữ cảnh tấn công)
  /\b(crack|bypass|exploit)\b.{0,20}\b(license|authentication|firewall|security system|IDS|WAF|captcha)\b/i,

  // 7. Nội dung tình dục trẻ em
  /\b(child|trẻ em|minor|thiếu niên)\b.{0,20}\b(porn|nude|khiêu dâm|sexual|sex)\b/i,

  // 8. Nội dung khiêu dâm nói chung (không phù hợp chatbot dịch vụ B2B)
  /\b(porn|pornography|phim sex|clip sex|ảnh sex|nude (photo|pic|leak|free))\b/i,
  /\b(onlyfans|adult (content|site|video))\b.{0,20}\b(free|crack|leak|share|download)\b/i,

  // 9. Mua bán ma tuý
  /\b(mua|bán|sell|buy|order|đặt)\b.{0,20}\b(ma túy|cần sa|heroin|cocaine|methamphetamine|thuốc lắc|drugs)\b/i,

  // 10. Vũ khí bất hợp pháp
  /\b(mua|bán|làm|tự chế|in 3d|tìm|get|acquire)\b.{0,30}\b(súng|vũ khí|gun|firearm|weapon|explosive|bomb|thuốc nổ|grenade)\b/i,
  /\b(unregistered (gun|firearm)|illegal weapon|ghost gun)\b/i,

  // 11. Chính trị nhạy cảm (lật đổ, bạo loạn, kêu gọi chống nhà nước)
  /\b(lật đổ|phản động|kêu gọi (biểu tình|bạo loạn|khởi nghĩa)|overthrow (government|regime))\b/i,
  /\b(tuyên truyền chống (nhà nước|chính phủ|đảng)|anti-government propaganda)\b/i,

  // 12. Phân biệt chủng tộc / kỳ thị / hate speech
  /\b(tất cả (người|dân tộc|nhóm).{0,20}(nên bị|phải bị|should be) (giết|trục xuất|eliminated|killed|removed))\b/i,
  /\b(racial slur|hate speech|kỳ thị (chủng tộc|người|dân tộc))\b/i,
  /\b(white supremac|ethnic cleansing|genocide)\b/i,

  // 13. Tự hại / tự tử (hướng dẫn phương pháp)
  /\b(cách tự (tử|kết liễu|làm hại bản thân)|how to (commit suicide|self.?harm|end (my|one.?s) life))\b/i,
  /\b(tự tử|suicide)\b.{0,30}\b(phương pháp|cách thực hiện|how to|hướng dẫn|liều lượng)\b/i,
  /\b(thuốc nào.{0,20}(để chết|gây chết|overdose))\b/i,

  // 14. Tin giả y tế (chữa bệnh nặng bằng phương pháp phi khoa học)
  /\b(chữa (ung thư|cancer|hiv|aids|covid)\b.{0,40}\b(bằng|với|using|dùng)\b.{0,40}(tỏi|gừng|vitamin c|bicarbonate|thuốc nam không rõ|homeopathy|prayer))\b/i,
  /\b(vaccine (gây|causes?)\s+(autism|tự kỷ|chết|ung thư))\b/i,

  // 15. Lừa đảo tài chính (guaranteed returns, đa cấp)
  /\b(kiếm\s+\$?\d{3,}.{0,15}(ngày|ngay|tuần|week) (mà )?không (cần|phải) (làm việc|work|effort))\b/i,
  /\b(ponzi|pyramid scheme|đa cấp lừa đảo|scam (investment|crypto))\b/i,
  /\b(guaranteed (profit|return|income)|lợi nhuận đảm bảo \d+%)\b/i,
];

function isModerationBlocked(text) {
  for (const allow of ALLOW_PATTERNS) {
    if (allow.test(text)) return false;  // allow list override
  }
  for (const block of BLOCK_PATTERNS) {
    if (block.test(text)) return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH — tìm kiếm trong site-index.json
// ─────────────────────────────────────────────────────────────────────────────
function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^\wÀ-ỹ\s]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

function searchIndex(index, query, limit = 3) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];

  const scored = index.map(doc => {
    const haystack = [doc.title, doc.content, ...(doc.tags || [])].join(' ').toLowerCase();
    let score = 0;
    for (const tok of tokens) {
      score += (haystack.match(new RegExp(tok, 'g')) || []).length;
      if (doc.title.toLowerCase().includes(tok)) score += 4;
      if ((doc.tags || []).some(t => t.includes(tok))) score += 2;
    }
    return { ...doc, score };
  });

  return scored.filter(d => d.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
}

function formatSiteAnswer(results) {
  const top = results[0];
  let answer = `**${top.title}**\n\n${top.summary}`;
  if (results.length > 1) {
    answer += '\n\n**Xem thêm:**';
    for (const r of results.slice(1)) answer += `\n- [${r.title}](${r.url})`;
  }
  return answer;
}

// ─────────────────────────────────────────────────────────────────────────────
// SITE INDEX LOADER
// ─────────────────────────────────────────────────────────────────────────────
async function loadSiteIndex() {
  if (cachedIndex !== null) return cachedIndex;
  try {
    const res = await fetch('https://eo.io.vn/site-index.json', {
      cf: { cacheTtl: 3600, cacheEverything: true },
    });
    cachedIndex = res.ok ? await res.json() : [];
  } catch {
    cachedIndex = [];
  }
  return cachedIndex;
}

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITING cho Claude API (Branch 2)
// Global: 50 calls/ngày  → max spend $0.09/ngày = $2.7/tháng
// Per-IP: 5 calls/giờ   → chống lạm dụng từ 1 IP
// Dùng EO_STATS KV. Nếu không có KV binding → bỏ qua rate limit.
// ─────────────────────────────────────────────────────────────────────────────
const RL_GLOBAL_DAILY  = 50;
const RL_IP_HOURLY     = 5;

async function checkAndIncrementRateLimit(env, ctx, clientIP) {
  if (!env.EO_STATS) return true; // no KV → allow (no limiting)

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

// ─────────────────────────────────────────────────────────────────────────────
// CLAUDE API — Branch 2 (out-of-scope nhưng hợp lệ)
// Cost estimate: ~$1.02–$1.82 per 1.000 calls (avg/max output at max_tokens=400)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// KV USAGE TRACKING (batched writes)
// ─────────────────────────────────────────────────────────────────────────────
function maybeFlushKV(env, ctx) {
  if (!env.EO_STATS || batchCount < BATCH_SIZE) return;
  const toFlush = batchCount;
  batchCount = 0;

  ctx.waitUntil((async () => {
    const key = `usage:${new Date().toISOString().slice(0, 10)}`;
    try {
      const cur = parseInt(await env.EO_STATS.get(key) ?? '0', 10);
      await env.EO_STATS.put(key, String(cur + toFlush), { expirationTtl: 604800 });
    } catch {
      batchCount += toFlush; // restore if write failed
    }
  })());
}

// ─────────────────────────────────────────────────────────────────────────────
// CORS HEADERS
// ─────────────────────────────────────────────────────────────────────────────
const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://eo.io.vn',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLERS
// ─────────────────────────────────────────────────────────────────────────────
export function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const question = String(body?.question ?? '').trim().slice(0, 500);
  if (!question) return json({ error: 'Missing question' }, 400);

  // Track usage (batched KV writes, no blocking)
  batchCount++;
  maybeFlushKV(env, context);

  // ── BRANCH 3: Moderation ──────────────────────────────────────────────────
  if (isModerationBlocked(question)) {
    return json({ branch: 'moderation', answer: 'Không có dữ liệu', sources: [] });
  }

  // ── BRANCH 1: Site-related question → search site-index.json ─────────────
  const lc = question.toLowerCase();
  if (SITE_KEYWORDS.some(kw => lc.includes(kw))) {
    const index = await loadSiteIndex();
    const hits  = searchIndex(index, question, 3);
    if (hits.length > 0) {
      return json({
        branch:  'site',
        answer:  formatSiteAnswer(hits),
        sources: hits.map(r => ({ title: r.title, url: r.url })),
      });
    }
  }

  // ── BRANCH 2: Out-of-scope → Claude (rate-limited) ───────────────────────
  if (env.CLAUDE_API_KEY) {
    const clientIP = request.headers.get('CF-Connecting-IP') ?? '';
    const allowed  = await checkAndIncrementRateLimit(env, context, clientIP);

    if (!allowed) {
      return json({
        branch: 'fallback',
        answer: 'Vui lòng liên hệ trực tiếp qua Telegram <a href="https://t.me/eoiovn">@eoiovn</a> hoặc email hello@eo.io.vn.',
        sources: [],
      });
    }

    try {
      const aiAnswer = await callClaude(question, env.CLAUDE_API_KEY);
      return json({ branch: 'ai', answer: aiAnswer, sources: [] });
    } catch {
      // fall through to fallback
    }
  }

  return json({
    branch: 'fallback',
    answer: 'Vui lòng liên hệ trực tiếp qua Telegram <a href="https://t.me/eoiovn">@eoiovn</a> hoặc email hello@eo.io.vn.',
    sources: [],
  });
}
