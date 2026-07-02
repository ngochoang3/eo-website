// EO Technology — Build site-index.json (v2 — entry-level extraction)
// node scripts/build-site-index.js
// Output: site-index.json at repo root

const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'site-index.json');

const PAGES = [
  { file: 'index.html',                  url: 'https://eo.io.vn/',                     tags: ['trang chủ', 'eo technology', 'giới thiệu', 'dịch vụ', 'web cloud ai game'] },
  { file: 'services/hosting.html',       url: 'https://eo.io.vn/services/hosting',     tags: ['hosting', 'cloud hosting', 'shared hosting', 'nvme', 'ssl', 'ovh', 'giá hosting', '3.99', '5.99', '9.99', 'anti-ddos', 'aapanel', '27.5'] },
  { file: 'services/vps.html',           url: 'https://eo.io.vn/services/vps',         tags: ['vps', 'server riêng', 'root access', 'linux', 'ram', 'nvme', 'ovh', 'giá vps', '7.99', '14.99', '20.99', '38.99', 'ovh 2027'] },
  { file: 'services/web-development.html', url: 'https://eo.io.vn/services/web-development', tags: ['web', 'landing page', 'ecommerce', 'wordpress', 'nextjs', 'thiết kế web', 'react'] },
  { file: 'services/mobile-app.html',    url: 'https://eo.io.vn/services/mobile-app', tags: ['mobile', 'mobile app', 'ios', 'android', 'react native', 'flutter'] },
  { file: 'services/game-development.html', url: 'https://eo.io.vn/services/game-development', tags: ['game', 'game dev', 'unity', 'liveops', 'cloud ball', 'game mobile'] },
  { file: 'services/ai-solutions.html',  url: 'https://eo.io.vn/services/ai-solutions', tags: ['ai solutions', 'chatbot', 'rag', 'automation', 'llm', 'machine learning', 'trí tuệ nhân tạo', 'tính năng chatbot', 'tính năng ai', 'chatbot tính năng'] },
  { file: 'services/saas.html',          url: 'https://eo.io.vn/services/saas',        tags: ['saas', 'platform', 'b2b', 'subscription', 'phần mềm', 'mrr'] },
  { file: 'pricing.html',                url: 'https://eo.io.vn/pricing',              tags: ['giá', 'bảng giá', 'pricing', 'usd', 'hosting price', 'vps price', 'thanh toán', 'paypal', 'chuyển khoản'] },
  { file: 'about.html',                  url: 'https://eo.io.vn/about',                tags: ['về chúng tôi', 'đội ngũ', 'kinh nghiệm', 'about', 'eo technology'] },
  { file: 'contact.html',               url: 'https://eo.io.vn/contact',              tags: ['liên hệ', 'contact', 'telegram', 'email', 'tư vấn miễn phí', 'zalo'] },
  { file: 'portfolio.html',             url: 'https://eo.io.vn/portfolio',            tags: ['portfolio', 'dự án', 'cloud ball', 'eo sales chat', 'sản phẩm đã làm'] },
  { file: 'faq.html',                   url: 'https://eo.io.vn/faq',                  tags: ['faq', 'câu hỏi thường gặp', 'frequently asked'] },
];

// ── Strip HTML tags + decode common entities ───────────────────────────────
function stripTags(s) {
  return (s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ').trim();
}

// ── Remove common emoji so they don't pollute entry text ──────────────────
function removeEmoji(s) {
  return (s || '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')   // misc symbols & pictographs
    .replace(/️/g, '')              // variation selector-16 (left-over after emoji strip)
    .replace(/[☀-➿]|✔|✓|✘|✗|✅|❌|❎|☑/g, '')
    .replace(/✅|✗|❌|→|←|↑|↓|•/g, '')
    .replace(/\s+/g, ' ').trim();
}

// ── Convert HTML to newline-separated plain text ───────────────────────────
function htmlToLines(html) {
  return html
    // Block-level elements → produce newline breaks (include closing > so no stray > remains)
    .replace(/<\/?(div|section|article|main|p|li|ul|ol|br|h[1-6]|tr|td|th|dt|dd|details|summary|blockquote|pre|table|thead|tbody|tfoot)[^>]*>/gi, '\n')
    // Strip remaining tags (inline: span, b, strong, a, em, i …)
    .replace(/<[^>]+>/g, '')
    // Entities
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#\d+;/g, '')
    // Normalise lines
    .split('\n')
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(l => l.length > 0)
    .join('\n');
}

// ── Remove noise regions and accessibility-only elements ──────────────────
function cleanHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Accessibility-only: sr-only, skip-link, visually-hidden
    .replace(/<[^>]+class="[^"]*(?:sr-only|skip-link|skip-to|visually-hidden|screen-reader-text)[^"]*"[^>]*>[\s\S]*?<\/(?:a|span|div|p|button|li)>/gi, '')
    // Skip-to-content anchor links
    .replace(/<a[^>]+href="#(?:main|content|maincontent|skip|top)"[^>]*>[\s\S]*?<\/a>/gi, '');
}

// ── Strategy 1: extract FAQ Q&A from <details><summary>…</summary>…</details> ─
function extractFaqEntries(cleanedHtml) {
  const entries = [];
  const re = /<details[^>]*>[\s\S]*?<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;
  let m;
  while ((m = re.exec(cleanedHtml)) !== null) {
    const question = stripTags(m[1]).slice(0, 120);
    const answer   = stripTags(m[2]).slice(0, 400);
    if (question.length > 5 && answer.length > 5) {
      entries.push({ heading: question, text: `${question}: ${answer}` });
    }
  }
  return entries;
}

// ── Strategy 2: extract pricing cards (detect $X.XX/tháng in text) ────────
function extractPricingEntries(cleanedHtml) {
  const entries = [];
  const textLines = htmlToLines(cleanedHtml).split('\n');
  const priceRe = /\$(\d+\.\d+)\s*\/\s*tháng/;
  const seenPrices = new Set();

  for (let i = 0; i < textLines.length; i++) {
    const line = textLines[i];
    const pm = line.match(priceRe);
    if (!pm) continue;
    if (seenPrices.has(pm[1])) continue; // deduplicate same price on same page
    seenPrices.add(pm[1]);

    const price = `$${pm[1]}/tháng`;
    const cleanLine = removeEmoji(line).replace(/\s+/g, ' ').trim();

    // Case A: long line — all plan info on one line (e.g. enterprise VPS paragraph)
    if (cleanLine.length > 50) {
      const beforePrice = cleanLine.split('$')[0];
      const parts = beforePrice.split(/[—→•|]/).map(s => s.trim()).filter(s => s.length > 2);
      const rawHeading = (parts[0] || price)
        .replace(/^[^?]*\?\s*/, '') // strip everything before and including "? " (e.g. "Cần VPS cao cấp? ")
        .trim().slice(0, 70);
      const h = `Giá ${rawHeading || price}`.slice(0, 80);
      entries.push({ heading: h, text: cleanLine.slice(0, 450) });
      continue;
    }

    // Case B: price on its own line — find plan name above and specs below
    let planName = '';
    for (let j = i - 1; j >= Math.max(0, i - 6); j--) {
      const l = removeEmoji(textLines[j]).trim();
      if (l.length > 0 && l.length < 70 && !/^\$|\d+\s*%|OVH\s+\d|\/tháng/.test(l)) {
        planName = l;
        break;
      }
    }

    const specs = [];
    for (let j = i + 1; j < Math.min(textLines.length, i + 12); j++) {
      if (priceRe.test(textLines[j])) break;            // next card starts
      const l = removeEmoji(textLines[j]).trim();
      if (l.length === 0) continue;
      if (/^Chọn|^Bắt đầu|^Tư vấn|^Liên hệ|^Xem|^OVH\s+2027.*tháng/i.test(l)) continue;
      if (l.length < 80) {
        specs.push(l);
        if (specs.length >= 6) break;
      }
    }

    // "Giá " prefix in heading → +5 score boost when user queries "giá VPS", "bảng giá"
    const h = `Giá ${planName || price}`.slice(0, 80);
    const textParts = [price, ...specs].filter(Boolean);
    entries.push({
      heading: h,
      text: `${h} — ${textParts.join(' — ')}`.slice(0, 450),
    });
  }
  return entries;
}

// ── Strategy 3: section-level entries from <h2>/<h3> + following text ─────
function extractSectionEntries(cleanedHtml, existingEntries) {
  const entries = [];
  const re = /<h([23])[^>]*>([\s\S]*?)<\/h\1>([\s\S]*?)(?=<h[1-6]|<\/section|<\/main|<\/article|$)/gi;
  let m;
  while ((m = re.exec(cleanedHtml)) !== null) {
    const heading = stripTags(m[2]).replace(/\s+/g, ' ').trim().slice(0, 100);
    const body    = stripTags(m[3]).replace(/\s+/g, ' ').trim().slice(0, 350);
    if (heading.length < 3 || body.length < 15) continue;
    // Deduplicate: skip if an existing entry already covers this heading
    const lh = heading.toLowerCase();
    const isDup = existingEntries.some(e => e.heading.toLowerCase() === lh || e.text.toLowerCase().startsWith(lh));
    if (!isDup) {
      entries.push({ heading, text: `${heading}: ${body}` });
    }
  }
  return entries;
}

// ── Extract page title ─────────────────────────────────────────────────────
function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!m) return 'EO Technology';
  return m[1]
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\s*[—–-]\s*EO Technology\s*$/i, '')
    .replace(/EO Technology\s*[—–-]\s*/i, '')
    .trim();
}

// ── Build page summary from first meaningful entry ─────────────────────────
function buildSummary(entries, fallbackText, maxLen = 250) {
  const src = (entries[0]?.text || fallbackText || '').slice(0, maxLen * 2).replace(/\s+/g, ' ');
  if (src.length <= maxLen) return src;
  const cut = src.lastIndexOf(' ', maxLen);
  return src.slice(0, cut > 0 ? cut : maxLen) + '…';
}

// ── Main ──────────────────────────────────────────────────────────────────
const index = [];

for (const page of PAGES) {
  const fp = path.join(ROOT, page.file);
  if (!fs.existsSync(fp)) { console.warn(`  SKIP: ${page.file}`); continue; }

  const raw = fs.readFileSync(fp, 'utf8');
  const ch  = cleanHtml(raw);

  const faqEntries      = extractFaqEntries(ch);
  const pricingEntries  = extractPricingEntries(ch);
  const combined        = [...faqEntries, ...pricingEntries];
  const sectionEntries  = extractSectionEntries(ch, combined);
  const entries         = [...combined, ...sectionEntries];

  const title   = extractTitle(raw);
  const summary = buildSummary(entries, htmlToLines(ch).slice(0, 500));

  index.push({ title, url: page.url, summary, tags: page.tags, entries });
  console.log(`  ✓  ${page.file}  →  "${title}"  (${entries.length} entries)`);
}

// Write without BOM — use pure UTF-8
const json = JSON.stringify(index, null, 2);
fs.writeFileSync(OUTPUT, json, { encoding: 'utf8', flag: 'w' });

// Verify no BOM
const buf = fs.readFileSync(OUTPUT);
if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
  console.error('ERROR: BOM detected — stripping');
  fs.writeFileSync(OUTPUT, buf.slice(3));
}

console.log(`\n✓ site-index.json — ${index.length} pages, total entries: ${index.reduce((s, p) => s + p.entries.length, 0)}\n`);
