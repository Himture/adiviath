import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkHtml } from '../scripts/check-site.mjs';

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
