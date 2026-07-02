// EO Technology — Build site-index.json
// Node.js script, không cần npm install (chỉ dùng built-in modules)
// Usage: node scripts/build-site-index.js
// Output: site-index.json (Cloudflare Pages tự serve như static asset)

const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'site-index.json');

const PAGES = [
  {
    file: 'index.html',
    url:  'https://eo.io.vn/',
    tags: ['trang chủ', 'eo technology', 'giới thiệu', 'dịch vụ', 'web cloud ai game'],
  },
  {
    file: 'services/hosting.html',
    url:  'https://eo.io.vn/services/hosting',
    tags: ['hosting', 'cloud hosting', 'shared hosting', 'nvme', 'ssl', 'ovh', 'giá hosting', '3.99', '5.99', '9.99', 'anti-ddos', 'aapanel', '27.5'],
  },
  {
    file: 'services/vps.html',
    url:  'https://eo.io.vn/services/vps',
    tags: ['vps', 'server riêng', 'root access', 'linux', 'ram', 'nvme', 'ovh', 'giá vps', '7.99', '14.99', '20.99', '38.99', 'ovh 2027'],
  },
  {
    file: 'services/web-development.html',
    url:  'https://eo.io.vn/services/web-development',
    tags: ['web', 'landing page', 'ecommerce', 'wordpress', 'nextjs', 'thiết kế web', 'react', 'template'],
  },
  {
    file: 'services/mobile-app.html',
    url:  'https://eo.io.vn/services/mobile-app',
    tags: ['mobile', 'mobile app', 'ios', 'android', 'react native', 'flutter'],
  },
  {
    file: 'services/game-development.html',
    url:  'https://eo.io.vn/services/game-development',
    tags: ['game', 'game dev', 'unity', 'liveops', 'cloud ball', 'game mobile'],
  },
  {
    file: 'services/ai-solutions.html',
    url:  'https://eo.io.vn/services/ai-solutions',
    tags: ['ai solutions', 'chatbot', 'rag', 'automation', 'llm', 'machine learning', 'trí tuệ nhân tạo'],
  },
  {
    file: 'services/saas.html',
    url:  'https://eo.io.vn/services/saas',
    tags: ['saas', 'platform', 'b2b', 'subscription', 'phần mềm', 'mrr'],
  },
  {
    file: 'pricing.html',
    url:  'https://eo.io.vn/pricing',
    tags: ['giá', 'bảng giá', 'pricing', 'usd', 'hosting price', 'vps price', 'thanh toán', 'paypal', 'chuyển khoản'],
  },
  {
    file: 'about.html',
    url:  'https://eo.io.vn/about',
    tags: ['về chúng tôi', 'đội ngũ', 'kinh nghiệm', 'about', 'eo technology'],
  },
  {
    file: 'contact.html',
    url:  'https://eo.io.vn/contact',
    tags: ['liên hệ', 'contact', 'telegram', 'email', 'tư vấn miễn phí', 'zalo'],
  },
  {
    file: 'portfolio.html',
    url:  'https://eo.io.vn/portfolio',
    tags: ['portfolio', 'dự án', 'cloud ball', 'eo sales chat', 'sản phẩm đã làm'],
  },
  {
    file: 'faq.html',
    url:  'https://eo.io.vn/faq',
    tags: ['faq', 'câu hỏi thường gặp', 'frequently asked'],
  },
];

// Simple HTML → text extractor (regex-based, no external deps)
function extractText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!m) return 'EO Technology';
  return m[1]
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\s*[—–-]\s*EO Technology\s*$/i, '')
    .replace(/EO Technology\s*[—–-]\s*/i, '')
    .trim();
}

function makeSummary(text, maxLen = 280) {
  const clean = text.slice(0, maxLen * 2)
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= maxLen) return clean;
  const cut = clean.lastIndexOf(' ', maxLen);
  return clean.slice(0, cut > 0 ? cut : maxLen) + '…';
}

const index = [];

for (const page of PAGES) {
  const fp = path.join(ROOT, page.file);
  if (!fs.existsSync(fp)) {
    console.warn(`  SKIP (not found): ${page.file}`);
    continue;
  }
  const html    = fs.readFileSync(fp, 'utf8');
  const content = extractText(html);
  const title   = extractTitle(html);
  const summary = makeSummary(content);

  index.push({
    title,
    url:     page.url,
    content: content.slice(0, 3000),
    summary,
    tags:    page.tags,
  });

  console.log(`  ✓  ${page.file}  →  "${title}"`);
}

fs.writeFileSync(OUTPUT, JSON.stringify(index, null, 2), 'utf8');
console.log(`\n✓ site-index.json — ${index.length} trang\n`);
