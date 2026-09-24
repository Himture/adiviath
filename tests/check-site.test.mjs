import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkHtml, checkSite } from '../scripts/check-site.mjs';
import pages from '../src/data/pages.json' with { type: 'json' };

const good = `<!doctype html><html lang="en"><head><title>Products | Adiviath Technologies</title>
<meta name="description" content="Software products built and run by Adiviath.">
<link rel="canonical" href="https://www.adiviath.com/products">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[]}</script>
<script type="module" src="/_astro/consent.abc.js"></script></head>
<body><a class="btn" href="/contact">Talk to us</a><h1>Products</h1>
<footer>Adiviath Technologies Private Limited CIN U62099KA2026PTC228442 WorkFlo Ranka Junction contact@adiviath.com Himanshu Agarwal, Director</footer></body></html>`;

test('a compliant page passes', () => assert.deepEqual(checkHtml('/products', good), []));
test('two h1s fail', () => assert.ok(checkHtml('/x', good.replace('<h1>Products</h1>', '<h1>a</h1><h1>b</h1>')).some(f => f.includes('h1'))));
test('inline executable script fails', () => assert.ok(checkHtml('/x', good.replace('</head>', '<script>alert(1)</script></head>')).some(f => f.includes('script'))));
test('missing CIN fails', () => assert.ok(checkHtml('/x', good.replace('U62099KA2026PTC228442', '')).some(f => f.includes('CIN'))));
test('em dash fails', () => assert.ok(checkHtml('/x', good.replace('Products</h1>', 'Products \u2014 all</h1>')).some(f => f.includes('dash'))));
test('other contact labels fail', () => assert.ok(checkHtml('/x', good.replace('Talk to us', 'Get in touch')).some(f => f.includes('label'))));
test('missing Talk to us fails', () => assert.ok(checkHtml('/x', good.replace('Talk to us', 'Hello')).some(f => f.includes('Talk to us'))));
test('entity-encoded contact label fails', () => assert.ok(checkHtml('/x', good.replace('Talk to us</a>', 'Talk to us</a><p>Let&#39;s talk</p>')).some(f => f.includes('label'))));
test('named dash entity fails', () => assert.ok(checkHtml('/x', good.replace('Products</h1>', 'Products &mdash; all</h1>')).some(f => f.includes('dash'))));
test('hex dash entity fails', () => assert.ok(checkHtml('/x', good.replace('Products</h1>', 'Products &#x2014; all</h1>')).some(f => f.includes('dash'))));
test('title length is measured decoded', () => {
  const title = `${'A'.repeat(55)} &amp; B`; // 63 raw, 59 decoded
  assert.ok(!checkHtml('/x', good.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)).some(f => f.includes('title')));
});

// checkSite(): build a minimal dist fixture (every page's HTML, plus a sitemap and llms files) and prove
// that a page missing from any of the three discovery files fails the build, not just a bad HTML page.
const urlOf = (path) => `https://www.adiviath.com${path}`;

const writeFixture = ({ skipFromSitemap, skipFromLlms, skipFromFull } = {}) => {
  const dist = mkdtempSync(join(tmpdir(), 'check-site-'));
  for (const { path } of pages) {
    const dir = path === '/' ? dist : join(dist, path.slice(1));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), good);
  }
  const sitemapPages = pages.filter((p) => p.path !== skipFromSitemap);
  writeFileSync(join(dist, 'sitemap.xml'), `<urlset>${sitemapPages.map((p) => `<url><loc>${urlOf(p.path)}</loc></url>`).join('')}</urlset>`);
  const llmsPages = pages.filter((p) => p.path !== skipFromLlms);
  writeFileSync(join(dist, 'llms.txt'), llmsPages.map((p) => `- [${p.title}](${urlOf(p.path)})`).join('\n'));
  const fullPages = pages.filter((p) => p.path !== skipFromFull);
  writeFileSync(join(dist, 'llms-full.txt'), fullPages.map((p) => `## ${p.title} (${urlOf(p.path)})`).join('\n\n'));
  return dist;
};

test('a complete fixture passes checkSite', () => {
  const dist = writeFixture();
  try { assert.deepEqual(checkSite(dist), []); } finally { rmSync(dist, { recursive: true, force: true }); }
});

test('a page missing from sitemap.xml fails checkSite', () => {
  const missing = pages[0].path;
  const dist = writeFixture({ skipFromSitemap: missing });
  try { assert.ok(checkSite(dist).some((f) => f === `${missing}: not in sitemap.xml`)); } finally { rmSync(dist, { recursive: true, force: true }); }
});

test('a page missing from llms.txt fails checkSite', () => {
  // "/about" (not "/", which is a URL prefix of every other page's URL and would still match by substring)
  const missing = '/about';
  const dist = writeFixture({ skipFromLlms: missing });
  try { assert.ok(checkSite(dist).some((f) => f === `${missing}: not in llms.txt`)); } finally { rmSync(dist, { recursive: true, force: true }); }
});

test('a page missing from llms-full.txt fails checkSite', () => {
  const missing = pages[0].path;
  const dist = writeFixture({ skipFromFull: missing });
  try { assert.ok(checkSite(dist).some((f) => f === `${missing}: not in llms-full.txt`)); } finally { rmSync(dist, { recursive: true, force: true }); }
});
