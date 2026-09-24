# Catalogue Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild adiviath.com as the approved Catalogue direction: verification-first, two live products plus custom software, compliant disclosures, a safe lead form, consented analytics, and full search and AI-agent readiness.

**Architecture:** Astro 5 static output. All content lives in three data files (`company.json`, `products.json`, `pages.json`) that drive pages, footer, schema, sitemap, `llms.txt`, `llms-full.txt` and the check script. One server route, `/api/lead`, runs on Vercel through `@astrojs/vercel@^9` with `prerender = false`. Client JavaScript is limited to three bundled module scripts: logo draw trigger, lead form, consent.

**Tech Stack:** Astro 5.17, `@astrojs/vercel@^9`, Familjen Grotesk Variable, Node 24 built-in test runner (`node --test`, native TypeScript type stripping), Playwright (dev only, for the device matrix), Resend REST API, Cloudflare Turnstile, Google Analytics 4 with Consent Mode v2.

**Spec:** `docs/superpowers/specs/2026-09-24-catalogue-rebuild-design.md` (section 16 overrides earlier sections).

## Global Constraints

- Palette: petrol `#125b63`, coral `#f27c64`, charcoal `#202b30`, muted `#4e6266`, pale mineral `#eaf1f1`, white.
- Font: Familjen Grotesk Variable only. Remove Newsreader.
- Logo shape only from `src/data/logo-paths.json`.
- Headline: "Software built around the way your business works."
- The only contact CTA label anywhere: "Talk to us".
- No em dash or en dash in any visible string, attribute, or alt text.
- No placeholder content ships (no fake quotes, no dashed slots, no "coming soon").
- Light theme only. English only.
- Every page: exactly one h1, canonical, title 1 to 60 characters, description 1 to 155 characters, the full disclosure footer.
- Disclosures: Adiviath Technologies Private Limited; registered office "WorkFlo Ranka Junction, Property No. 224, 3rd Floor, #80/3, Vijinapur Village, Old Madras Road, K R Puram Hobli, Bengaluru, Karnataka 560016"; CIN U62099KA2026PTC228442; contact@adiviath.com; queries and grievances: Himanshu Agarwal, Director.
- Touch targets at least 44 px; WCAG AA contrast; visible focus; no horizontal overflow from 360 px to 1920 px.
- Environment variables: `PUBLIC_TURNSTILE_SITE_KEY`, `PUBLIC_GA_ID` (build time, optional), `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `LEAD_TO` (default `contact@adiviath.com`), `LEAD_FROM` (default `Adiviath website <website@adiviath.com>`) (runtime).
- Copy rules: plain, specific, "we" voice; banned words: seamless, empower, cutting-edge, elevate, unleash, next-gen, passionate.

## Review Focus

1. A lead submitted with Turnstile or Resend down: the visitor sees "Could not send. Email contact@adiviath.com" and nothing is half-sent. Tested in Task 6.
2. A 360 px phone with the on-screen keyboard open: the form fields and send button stay reachable and nothing overflows. Tested in Task 10.
3. A visitor who declines analytics, then reloads: no request to googletagmanager.com is ever made. Tested in Task 8.
4. A spam bot posting directly to `/api/lead` without a token, with a filled honeypot, or with a 50 KB body: rejected without sending mail. Tested in Task 6.
5. A new page added to `pages.json` but missing from the sitemap or `llms-full.txt`: the check script fails the build. Tested in Task 1 and Task 9.

---

## File map

| File | Responsibility |
|---|---|
| `src/data/company.json` | Legal disclosures, founder line, email, optional phone |
| `src/data/products.json` | Product catalogue (optional `screenshot`, `testimonial`) |
| `src/data/pages.json` | Every route with title, description, nav label, sitemap source file |
| `src/data/solutions.ts` | Copy and FAQs for the three solution pages |
| `src/lib/lead.ts` | Pure lead validation and email rendering |
| `src/lib/throttle.ts` | Best-effort per-IP throttle |
| `src/pages/api/lead.ts` | The form endpoint |
| `src/layouts/BaseLayout.astro` | Head, schema graph, header, footer, consent |
| `src/components/Header.astro` | Nav with phone menu |
| `src/components/Footer.astro` | Disclosures |
| `src/components/LogoDraw.astro` | Trace-and-fill mark |
| `src/components/ProductCard.astro` | One catalogue card |
| `src/components/LeadForm.astro` | Form markup and client script |
| `src/components/ConsentBar.astro` | GA consent |
| `src/components/Faq.astro` | FAQ list plus FAQPage schema data |
| `src/styles/global.css` | All styles (rewritten) |
| `scripts/check-site.mjs` | Build output checks (rewritten, exports its checks) |
| `scripts/device-matrix.mjs` | Playwright engines x viewports audit |
| `scripts/indexnow.mjs` | Post-deploy IndexNow ping |
| `tests/*.test.ts`, `tests/*.test.mjs` | Unit tests, run with `node --test tests/` |

Deleted: `src/components/DotStage.astro`, `src/components/Talk.astro`, `src/styles/home.css`, `src/data/contact.json`, `public/llms.txt` (becomes generated), `public/naveen-logistics-logo.webp` (unused until permission and design need it).

---

### Task 1: Foundation: data, layout, header, footer, check script

**Files:**
- Create: `src/data/company.json`, `src/data/products.json`, `src/data/pages.json`, `src/components/Header.astro`, `src/components/Footer.astro`, `tests/check-site.test.mjs`
- Rewrite: `src/layouts/BaseLayout.astro`, `src/styles/global.css`, `scripts/check-site.mjs`
- Modify: `package.json` (scripts, remove Newsreader), all four existing pages reduced to a stub using the new layout
- Delete: files listed above

**Interfaces:**
- Produces: `company.json` shape `{ legalName, shortName, cin, address, email, phone|null, director, grievance, since }`; `products.json` array of `{ slug, name, audience, oneLiner, detail, status: "live", url|null, cta: "external"|"form", screenshot: {src,alt,width,height}|null, testimonial: {quote,name,role,business}|null, schema: {applicationCategory} }`; `pages.json` array of `{ path, title, description, nav?: string, source: string }`; `BaseLayout` props `{ path: string, jsonLd?: object[], drawLogo?: boolean }` (title and description are looked up from `pages.json` by `path`); `scripts/check-site.mjs` exports `checkHtml(path, html) -> string[]` and `checkSite(distDir) -> string[]`.

- [ ] **Step 1: Write `src/data/company.json`**

```json
{
  "legalName": "Adiviath Technologies Private Limited",
  "shortName": "Adiviath",
  "cin": "U62099KA2026PTC228442",
  "address": {
    "lines": ["WorkFlo Ranka Junction, Property No. 224, 3rd Floor", "#80/3, Vijinapur Village, Old Madras Road", "K R Puram Hobli, Bengaluru, Karnataka 560016"],
    "locality": "Bengaluru",
    "region": "Karnataka",
    "postalCode": "560016",
    "country": "IN",
    "street": "WorkFlo Ranka Junction, Property No. 224, 3rd Floor, #80/3, Vijinapur Village, Old Madras Road, K R Puram Hobli"
  },
  "email": "contact@adiviath.com",
  "phone": null,
  "director": "Himanshu Agarwal",
  "grievance": "Himanshu Agarwal, Director",
  "since": 2020
}
```

- [ ] **Step 2: Write `src/data/products.json`**

```json
[
  {
    "slug": "pharmulo",
    "name": "Pharmulo",
    "audience": "For pharma wholesalers",
    "oneLiner": "Retailers order from their phone. The order reaches you as a ready bill.",
    "detail": "Pharmulo gives a pharma wholesaler an ordering app under their own name. Retailers see live stock and order from their phone, and each order opens as a GST bill with no retyping. Stock, collections and supplier payments run in the same place.",
    "status": "live",
    "url": "https://pharmulo.com",
    "cta": "external",
    "screenshot": { "src": "/img/pharmulo-home.webp", "alt": "Pharmulo home page with its ordering app for pharma wholesalers", "width": 1600, "height": 1000 },
    "testimonial": null,
    "schema": { "applicationCategory": "BusinessApplication" }
  },
  {
    "slug": "freight-billing",
    "name": "Freight billing system",
    "audience": "For transport companies",
    "oneLiner": "Lorry receipts, freight bills and payments in one place.",
    "detail": "One system from lorry receipt to settled bill. Every LR links to its freight bill, payments are allocated against bills, and customers can see their own statement. Built first for Naveen Logistics, a family-run transport business in Bengaluru, and running their operations daily.",
    "status": "live",
    "url": null,
    "cta": "form",
    "screenshot": null,
    "testimonial": null,
    "schema": { "applicationCategory": "BusinessApplication" }
  }
]
```

Note for the executor: move `public/pharmulo-home.webp` to `public/img/pharmulo-home.webp` and replace it with a fresh 1600 px wide WebP rendered from `/Users/himture/Developer/Personal/adiviath/.superpowers/mockups/img/pharmulo-d.png` (2880x1800) with sharp: `node -e "require('sharp')('<png>').resize(1600).webp({quality:80}).toFile('public/img/pharmulo-home.webp')"`; record the real output height in `products.json`.

- [ ] **Step 3: Write `src/data/pages.json`**

```json
[
  { "path": "/", "title": "Adiviath Technologies | Software built around your business", "description": "Adiviath builds and runs software for Indian businesses: Pharmulo for pharma wholesalers, freight billing for transporters, and custom systems.", "source": "src/pages/index.astro" },
  { "path": "/products", "nav": "Products", "title": "Products | Adiviath Technologies", "description": "Software products built and run by Adiviath: Pharmulo for pharma wholesalers and a freight billing system for transport companies.", "source": "src/pages/products/index.astro" },
  { "path": "/products/pharmulo", "title": "Pharmulo: ordering for pharma wholesalers | Adiviath", "description": "Pharmulo lets retailers order from their phone and turns each order into a GST bill for the wholesaler, with no retyping. Built and run by Adiviath.", "source": "src/data/products.json" },
  { "path": "/products/freight-billing", "title": "Freight billing system for transporters | Adiviath", "description": "LR, freight bill and payment software for transport companies. Built and run by Adiviath, live at Naveen Logistics in Bengaluru.", "source": "src/data/products.json" },
  { "path": "/custom-software", "nav": "Custom software", "title": "Custom business software | Adiviath Technologies", "description": "Ordering, billing, inventory, portals, apps and Tally, Busy or Marg integrations, built around how your business already works.", "source": "src/pages/custom-software.astro" },
  { "path": "/solutions/pharma-distributor-ordering", "title": "Online ordering app for pharma distributors | Adiviath", "description": "Stop typing retailer orders from WhatsApp and calls. An ordering app under your name that turns each order into a GST bill.", "source": "src/data/solutions.ts" },
  { "path": "/solutions/freight-billing-software", "title": "LR and freight billing software for transporters | Adiviath", "description": "Link every lorry receipt to its freight bill, allocate payments against bills and give customers their own statement.", "source": "src/data/solutions.ts" },
  { "path": "/solutions/distributor-software", "title": "Custom software for distributors | Adiviath", "description": "Custom ordering, billing and stock systems for distributors and wholesalers, connected to Tally, Busy or Marg.", "source": "src/data/solutions.ts" },
  { "path": "/about", "nav": "About", "title": "About Adiviath Technologies | Bengaluru software company", "description": "Adiviath Technologies Private Limited is a founder-led software company in Bengaluru. Company facts, the founder and how we work.", "source": "src/pages/about.astro" },
  { "path": "/contact", "title": "Contact Adiviath Technologies", "description": "Tell us what is slow in your business. We reply within one business day. Email contact@adiviath.com or use the form.", "source": "src/pages/contact.astro" },
  { "path": "/privacy", "title": "Privacy policy | Adiviath Technologies", "description": "How Adiviath Technologies collects, uses, stores and protects personal information from this website, and how to reach our grievance contact.", "source": "src/pages/privacy.astro" },
  { "path": "/terms", "title": "Terms of use | Adiviath Technologies", "description": "Terms for using the Adiviath Technologies website.", "source": "src/pages/terms.astro" }
]
```

- [ ] **Step 4: Write the failing check-script tests `tests/check-site.test.mjs`**

```js
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
```

- [ ] **Step 5: Run to confirm failure**

Run: `node --test tests/`
Expected: FAIL, `checkHtml` is not exported.

- [ ] **Step 6: Rewrite `scripts/check-site.mjs`**

```js
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pagesData = JSON.parse(readFileSync(new URL('../src/data/pages.json', import.meta.url), 'utf8'));
const DISCLOSURES = [['Adiviath Technologies Private Limited', 'legal name'], ['U62099KA2026PTC228442', 'CIN'], ['WorkFlo Ranka Junction', 'registered office'], ['contact@adiviath.com', 'email'], ['Himanshu Agarwal, Director', 'grievance contact']];
const OTHER_CTA = /\b(Get in touch|Contact us|Let's talk|Talk to the founder|Reach out|Start a project)\b/i;
const BANNED = ['seamless', 'empower', 'cutting-edge', 'elevate', 'unleash', 'next-gen', 'passionate'];

export function checkHtml(path, html) {
  const f = [];
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/type="application\/ld\+json"/.test(attrs)) {
      try { JSON.parse(body); } catch (e) { f.push(`JSON-LD does not parse: ${e.message}`); }
    } else if (!/type="module"/.test(attrs) || !/\bsrc="\/_astro\//.test(attrs) || body.trim()) {
      f.push(`script not allowed: <script${attrs}>`);
    }
  }
  const h1 = (html.match(/<h1\b/g) || []).length;
  if (h1 !== 1) f.push(`expected 1 h1, found ${h1}`);
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=/.test(tag)) f.push(`img without alt: ${tag.slice(0, 80)}`);
    if (!/\bwidth=/.test(tag) || !/\bheight=/.test(tag)) f.push(`img without width/height: ${tag.slice(0, 80)}`);
  }
  const text = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
  const attrText = [...html.matchAll(/\b(?:content|alt|aria-label|title|placeholder)="([^"]*)"/g)].map(([, v]) => v).join(' ');
  const all = `${text} ${attrText}`;
  if (/[\u2013\u2014]/.test(all)) f.push('em or en dash in visible text');
  for (const w of BANNED) if (new RegExp(`\\b${w}\\b`, 'i').test(all)) f.push(`banned word "${w}"`);
  if (OTHER_CTA.test(all)) f.push(`other contact label: "${all.match(OTHER_CTA)[0]}"`);
  if (!text.includes('Talk to us')) f.push('missing CTA "Talk to us"');
  for (const [needle, name] of DISCLOSURES) if (!text.includes(needle)) f.push(`missing disclosure: ${name}`);
  if (/fonts\.(googleapis|gstatic)\.com/.test(html)) f.push('Google Fonts request');
  if (!/<link rel="canonical"/.test(html)) f.push('missing canonical');
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  if (!title || title.length > 60) f.push(`title length ${title.length}`);
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  if (!desc || desc.length > 155) f.push(`description length ${desc.length}`);
  return f.map((m) => `${path}: ${m}`);
}

export function checkSite(dist) {
  const failures = [];
  for (const { path } of pagesData) {
    const file = join(dist, path === '/' ? 'index.html' : `${path.slice(1)}/index.html`);
    if (!existsSync(file)) { failures.push(`${path}: page missing from build`); continue; }
    failures.push(...checkHtml(path, readFileSync(file, 'utf8')));
  }
  const sitemap = existsSync(join(dist, 'sitemap.xml')) ? readFileSync(join(dist, 'sitemap.xml'), 'utf8') : '';
  const full = existsSync(join(dist, 'llms-full.txt')) ? readFileSync(join(dist, 'llms-full.txt'), 'utf8') : '';
  const llms = existsSync(join(dist, 'llms.txt')) ? readFileSync(join(dist, 'llms.txt'), 'utf8') : '';
  for (const { path } of pagesData) {
    const url = `https://www.adiviath.com${path === '/' ? '/' : path}`;
    if (!sitemap.includes(`<loc>${url}</loc>`)) failures.push(`${path}: not in sitemap.xml`);
    if (!full.includes(`(${url})`)) failures.push(`${path}: not in llms-full.txt`);
    if (!llms.includes(url)) failures.push(`${path}: not in llms.txt`);
  }
  return failures;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const failures = checkSite(fileURLToPath(new URL('../dist/', import.meta.url)));
  if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
  console.log(`check-site: ${pagesData.length} pages OK`);
}
```

- [ ] **Step 7: Run tests**

Run: `node --test tests/`
Expected: 7 PASS.

- [ ] **Step 8: Rewrite `src/styles/global.css`, header, footer, layout**

`global.css` carries the tokens and every shared rule; later tasks append page sections under clearly commented headings. Start with:

```css
@import '@fontsource-variable/familjen-grotesk';

@font-face { font-family: 'FG Fallback'; src: local('Arial'); size-adjust: 97%; ascent-override: 96%; descent-override: 26%; line-gap-override: 0%; }

:root {
  --petrol: #125b63; --petrol-d: #0d474d; --coral: #f27c64; --ink: #202b30; --muted: #4e6266;
  --mineral: #eaf1f1; --line: #d5e1e1; --paper: #fff; --field: #7f9696;
  --sans: 'Familjen Grotesk Variable', 'FG Fallback', system-ui, sans-serif;
  --wrap: 1200px; --gutter: clamp(20px, 4vw, 48px); --section: clamp(64px, 10vw, 112px); --r: 10px; --r-lg: 18px;
}
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--paper); color: var(--ink); font: 400 17px/1.55 var(--sans); }
@media (min-width: 768px) { body { font-size: 18px; } }
img, svg { display: block; max-width: 100%; height: auto; }
h1, h2, h3, p, ul, ol, dl, figure { margin: 0; }
a { color: inherit; }
:focus-visible { outline: 3px solid var(--petrol); outline-offset: 3px; border-radius: 4px; }
.skip-link { position: absolute; left: 12px; top: -80px; padding: 12px 18px; background: var(--petrol); color: #fff; z-index: 50; }
.skip-link:focus { top: 12px; }
.wrap { width: min(var(--wrap), 100% - 2 * var(--gutter)); margin-inline: auto; }
.wrap > *, .grid > * { min-width: 0; }
h1 { font-weight: 650; font-size: clamp(38px, 5.2vw, 68px); letter-spacing: -0.03em; line-height: 1.05; text-wrap: balance; }
h2 { font-weight: 650; font-size: clamp(28px, 3.4vw, 42px); letter-spacing: -0.02em; line-height: 1.12; text-wrap: balance; }
h3 { font-weight: 600; font-size: 22px; letter-spacing: -0.01em; line-height: 1.25; }
.sub { font-size: clamp(19px, 1.8vw, 21px); color: var(--muted); max-width: 40ch; }
.muted { color: var(--muted); }
.prose { max-width: 68ch; } .prose > * + * { margin-top: 1em; } .prose h2 { margin-top: 1.6em; font-size: clamp(24px, 2.6vw, 30px); }
.btn { display: inline-flex; align-items: center; justify-content: center; min-height: 52px; padding: 0 24px; border: 0; border-radius: var(--r); background: var(--petrol); color: #fff; font: inherit; font-weight: 600; text-decoration: none; white-space: nowrap; cursor: pointer; transition: background .15s, transform .1s; }
.btn:hover { background: var(--petrol-d); } .btn:active { transform: translateY(1px); }
.btn.light { background: #fff; color: var(--petrol); }
.link { font-weight: 600; color: var(--petrol); text-underline-offset: 5px; }
.section { padding-block: var(--section); }
.section.tint { background: var(--mineral); }
```

`Header.astro` (phone menu uses `<details>` so it works without JavaScript and is keyboard accessible):

```astro
---
import Wordmark from './Wordmark.astro';
import pages from '../data/pages.json';
const { path } = Astro.props as { path: string };
const nav = pages.filter((p) => p.nav);
const current = (href: string) => (path === href || path.startsWith(href + '/') ? 'page' : undefined);
---
<header class="site-header">
  <div class="wrap bar">
    <a class="brand" href="/" aria-label="Adiviath Technologies home"><Wordmark /></a>
    <nav class="nav-wide" aria-label="Main">
      {nav.map((p) => <a href={p.path} aria-current={current(p.path)}>{p.nav}</a>)}
      <a class="btn" href="/contact">Talk to us</a>
    </nav>
    <div class="nav-narrow">
      <a class="btn" href="/contact">Talk to us</a>
      <details class="menu">
        <summary>Menu</summary>
        <nav aria-label="Main"><a href="/">Home</a>{nav.map((p) => <a href={p.path} aria-current={current(p.path)}>{p.nav}</a>)}<a href="/contact">Contact</a></nav>
      </details>
    </div>
  </div>
</header>
```

Header CSS (append):

```css
.site-header { position: sticky; top: 0; z-index: 20; background: rgb(255 255 255 / .94); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
.site-header .bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 68px; }
.brand { color: var(--petrol); text-decoration: none; display: inline-flex; min-height: 44px; align-items: center; }
.nav-wide { display: none; align-items: center; gap: 28px; font-weight: 500; }
.nav-wide a:not(.btn), .menu nav a { color: var(--muted); text-decoration: none; }
.nav-wide a[aria-current], .menu nav a[aria-current] { color: var(--petrol); text-decoration: underline; text-decoration-color: var(--coral); text-decoration-thickness: 2px; text-underline-offset: 8px; }
.site-header .btn { min-height: 44px; padding: 0 18px; }
.nav-narrow { display: flex; align-items: center; gap: 8px; }
.menu summary { list-style: none; min-height: 44px; min-width: 64px; display: grid; place-items: center; padding: 0 12px; border: 1.5px solid var(--line); border-radius: var(--r); font-weight: 600; cursor: pointer; }
.menu summary::-webkit-details-marker { display: none; }
.menu[open] nav { position: absolute; left: 0; right: 0; top: 100%; display: grid; background: #fff; border-bottom: 1px solid var(--line); padding: 8px var(--gutter) 16px; }
.menu nav a { min-height: 48px; display: flex; align-items: center; font-size: 19px; border-bottom: 1px solid var(--line); }
@media (min-width: 900px) { .nav-wide { display: flex; } .nav-narrow { display: none; } }
```

`Footer.astro`:

```astro
---
import Wordmark from './Wordmark.astro';
import company from '../data/company.json';
import pages from '../data/pages.json';
const links = ['/products', '/custom-software', '/about', '/contact', '/privacy', '/terms'].map((p) => ({ href: p, label: pages.find((x) => x.path === p)?.nav ?? ({ '/contact': 'Contact', '/privacy': 'Privacy policy', '/terms': 'Terms of use' } as Record<string, string>)[p] }));
const year = new Date().getFullYear();
---
<footer class="site-footer">
  <div class="wrap cols">
    <div><a class="brand light" href="/" aria-label="Adiviath Technologies home"><Wordmark /></a><p class="since">Building software for Indian businesses since {company.since}.</p></div>
    <div><h2 class="fh">Registered office</h2><p>{company.legalName}</p>{company.address.lines.map((l) => <p>{l}</p>)}<p>CIN {company.cin}</p></div>
    <div><h2 class="fh">Contact</h2><p><a href={`mailto:${company.email}`}>{company.email}</a></p>{company.phone && <p><a href={`tel:${company.phone}`}>{company.phone}</a></p>}<p>Queries and grievances: {company.grievance}</p></div>
    <nav aria-label="Footer"><h2 class="fh">Company</h2>{links.map((l) => <p><a href={l.href}>{l.label}</a></p>)}<p><button type="button" class="linkish" data-consent-open hidden>Cookie settings</button></p></nav>
    <p class="base">© {year} {company.legalName}</p>
  </div>
</footer>
```

Footer CSS (append):

```css
.site-footer { background: var(--ink); color: #dce6e6; padding: 56px 0 32px; font-size: 15px; }
.site-footer .cols { display: grid; gap: 32px; grid-template-columns: 1fr; }
@media (min-width: 900px) { .site-footer .cols { grid-template-columns: 1.1fr 1.3fr 1.1fr .8fr; } }
.site-footer p { margin: 0 0 6px; } .site-footer a, .linkish { color: #fff; }
.site-footer nav a, .linkish { display: inline-flex; min-height: 32px; align-items: center; }
.fh { font-size: 13px; letter-spacing: .06em; text-transform: uppercase; color: #a9c2c2; font-weight: 600; margin-bottom: 12px; }
.brand.light { color: #fff; } .since { margin-top: 14px; color: #a9c2c2; }
.base { grid-column: 1 / -1; border-top: 1px solid #3a484d; padding-top: 18px; color: #a9c2c2; }
.linkish { background: none; border: 0; padding: 0; font: inherit; text-decoration: underline; cursor: pointer; }
```

`BaseLayout.astro`: keep the existing head block (meta, OG, twitter, icons, canonical, `og:locale en_IN`), but read `title` and `description` from `pages.json` by `path` (throw at build if the path is missing), render `<Header path={path} />`, `<main id="main">`, `<Footer />`, then `<ConsentBar />` (added in Task 8; leave a comment-free insertion point by adding it in Task 8). The schema graph:

```ts
const org = {
  '@type': 'Organization', '@id': `${site}#organization`, name: company.legalName, alternateName: company.shortName, url: site,
  logo: `${site}brand/symbol-flat.svg`, email: company.email, foundingDate: '2026',
  identifier: { '@type': 'PropertyValue', propertyID: 'CIN', value: company.cin },
  address: { '@type': 'PostalAddress', streetAddress: company.address.street, addressLocality: company.address.locality, addressRegion: company.address.region, postalCode: company.address.postalCode, addressCountry: company.address.country },
  founder: { '@type': 'Person', name: company.director, jobTitle: 'Director' },
  contactPoint: { '@type': 'ContactPoint', email: company.email, contactType: 'sales', areaServed: 'IN', availableLanguage: ['en'] },
  areaServed: 'IN', knowsAbout: ['custom business software', 'pharmaceutical wholesale ordering', 'freight billing', 'Tally integration'],
  sameAs: ['https://pharmulo.com'],
};
```

plus `WebSite`, and `WebPage` (or `AboutPage`, `ContactPage`) with `@id` = canonical, then `...jsonLd`.

- [ ] **Step 9: Stub every page in `pages.json` so the build passes**

Each stub: `<BaseLayout path="..."><section class="section"><div class="wrap"><h1>…page name…</h1></div></section></BaseLayout>`. Product and solution routes are created in Tasks 3 and 4, so until then the check lists them as missing; that is expected. Update `package.json` scripts:

```json
"test": "node --test tests/",
"verify": "astro build && node scripts/check-site.mjs"
```

Remove `@fontsource-variable/newsreader` from dependencies (`npm uninstall @fontsource-variable/newsreader`).

- [ ] **Step 10: Build and check**

Run: `npm test && npx astro build && node scripts/check-site.mjs`
Expected: tests PASS; build succeeds; check-site fails only with "page missing from build", "not in sitemap/llms" lines for routes created in later tasks.

- [ ] **Step 11: Commit**

```bash
git add -A && git commit -m "Foundation: company, product and page data, header with phone menu, disclosure footer, check script"
```

---

### Task 2: Home page with the logo trace-and-fill

**Files:**
- Create: `src/components/LogoDraw.astro`, `src/components/ProductCard.astro`, `src/scripts/draw.ts`
- Rewrite: `src/pages/index.astro`
- Modify: `src/styles/global.css` (append Home and card sections)

**Interfaces:**
- Consumes: `BaseLayout` `{ path, jsonLd?, drawLogo? }`, `products.json`.
- Produces: `<ProductCard product={p} size="large"|"small" tone="mineral"|"ink" />` and `<ProductCard custom />` (the petrol "Something built for you" card); `<LogoDraw />`.

- [ ] **Step 1: `LogoDraw.astro`**

```astro
---
import logo from '../data/logo-paths.json';
---
<svg class="logo-draw" viewBox={logo.viewBox} role="img" aria-label="Adiviath logo">
  <path class="ld-fill" d={logo.mark} fill="currentColor" />
  <path class="ld-outline" pathLength="1" d={logo.mark} />
  <path class="ld-dot" d={logo.dot} fill="var(--coral)" />
</svg>
<script src="../scripts/draw.ts"></script>
```

`src/scripts/draw.ts` (adds the play class after first paint so the animation runs once per load and never on scroll):

```ts
const svg = document.querySelector<SVGElement>('.logo-draw');
if (svg && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  svg.classList.add('ready');
  requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.add('play')));
}
```

CSS (append). Without `.ready` (no JavaScript, or reduced motion) the finished mark shows:

```css
.logo-draw { width: 96px; color: var(--petrol); overflow: visible; }
.logo-draw .ld-outline { fill: none; stroke: none; }
.logo-draw.ready .ld-fill { opacity: 0; }
.logo-draw.ready .ld-outline { stroke: currentColor; stroke-width: 3; stroke-dasharray: 1; stroke-dashoffset: 1; }
.logo-draw.ready .ld-dot { transform-box: fill-box; transform-origin: center; scale: 0; }
.logo-draw.play .ld-outline { animation: ld-trace 1.3s cubic-bezier(.45,0,.3,1) .15s forwards; }
.logo-draw.play .ld-fill { animation: ld-fill .45s ease 1.35s forwards; }
.logo-draw.play .ld-dot { animation: ld-land .45s cubic-bezier(.3,1.6,.5,1) 1.7s forwards; }
@keyframes ld-trace { to { stroke-dashoffset: 0; } }
@keyframes ld-fill { to { opacity: 1; } }
@keyframes ld-land { to { scale: 1; } }
```

- [ ] **Step 2: `ProductCard.astro`**

```astro
---
interface Product { slug: string; name: string; audience: string; oneLiner: string; screenshot: { src: string; alt: string; width: number; height: number } | null; }
const { product, tone = 'mineral', custom = false } = Astro.props as { product?: Product; tone?: 'mineral' | 'ink'; custom?: boolean };
---
{custom ? (
  <a class="card card-custom" href="/custom-software">
    <p class="card-tag">Custom software</p>
    <h3>Something built for you</h3>
    <p>Ordering, billing, portals, apps and integrations, shaped around how you already work.</p>
    <span class="card-go">See how we build</span>
  </a>
) : product && (
  <a class={`card card-${tone}`} href={`/products/${product.slug}`}>
    <p class="card-tag">Live · {product.audience}</p>
    <h3>{product.name}</h3>
    <p>{product.oneLiner}</p>
    <span class="card-go">About {product.name}</span>
    {product.screenshot && <img src={product.screenshot.src} alt={product.screenshot.alt} width={product.screenshot.width} height={product.screenshot.height} loading="lazy" decoding="async" />}
  </a>
)}
```

Card CSS (append):

```css
.catalogue { display: grid; gap: 20px; grid-template-columns: 1fr; }
@media (min-width: 900px) { .catalogue { grid-template-columns: 1.4fr 1fr; } .catalogue > .card:first-child { grid-row: span 2; } }
.card { display: flex; flex-direction: column; gap: 12px; padding: clamp(22px, 3vw, 34px); border-radius: var(--r-lg); text-decoration: none; transition: transform .15s, box-shadow .15s; }
.card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgb(18 91 99 / .12); }
.card h3 { font-size: clamp(24px, 2.4vw, 30px); }
.card-tag { font-size: 14px; font-weight: 600; }
.card-go { font-weight: 600; margin-top: 4px; text-decoration: underline; text-underline-offset: 5px; }
.card img { margin-top: auto; border-radius: var(--r); border: 1px solid var(--line); }
.card-mineral { background: var(--mineral); } .card-mineral .card-tag, .card-mineral .card-go { color: var(--petrol); } .card-mineral p { color: var(--muted); }
.card-ink { background: var(--ink); color: #fff; } .card-ink .card-tag { color: #ffb3a3; } .card-ink p { color: #c9d6d6; }
.card-custom { background: var(--petrol); color: #fff; } .card-custom .card-tag { color: #ffd3c9; } .card-custom p { color: #d4e6e6; }
```

- [ ] **Step 3: `src/pages/index.astro`**

Sections in order, with this exact copy:

1. Hero (`.hero`, left aligned, `padding-block: clamp(40px, 7vw, 88px) 40px`): `<LogoDraw />`, h1 "Software built around the way your business works.", `.sub` "Pick a product that's already running, or have one built for you.", `<a class="btn" href="/contact">Talk to us</a>`.
2. Catalogue (`<section class="section" aria-labelledby="cat-h">`, visually hidden h2 "Products and custom software" with `id="cat-h"`): `.catalogue` grid containing Pharmulo (`tone="mineral"`), Freight billing (`tone="ink"`), and the custom card.
3. "Sound familiar?" (`.section.tint`): h2 "Sound familiar?", then a two-column list of links (`.problems`), each row a link with the problem and a right-aligned destination:
   - "Orders arrive on WhatsApp and calls, then get typed in again" → `/solutions/pharma-distributor-ordering`, label "Pharmulo"
   - "LRs, freight bills and payments never line up" → `/solutions/freight-billing-software`, label "Freight billing"
   - "Bills and stock live in Excel or Tally, updated by hand" → `/solutions/distributor-software`, label "Custom software"
   - "Customers keep calling to ask for their statement" → `/custom-software`, label "Custom software"
4. Testimonials: render a `<section>` only if any product has a `testimonial`; each as `<figure><blockquote>“quote”</blockquote><figcaption>name, role, business</figcaption></figure>`.
5. Build and contact (`.section`, two columns at 900 px+): left h2 "How a custom build goes", an ordered list "A call about how the work happens today", "A fixed written scope and price before anything starts", "Weekly progress you can click through", "Support and changes after launch", then the founder note `<p class="note">I read every message myself and reply within one business day.<br><strong>Himanshu Agarwal, Director</strong></p>`; right column `<LeadForm />` (Task 7; until then a `<p>` with the email link).

Problems CSS:

```css
.problems { margin-top: 32px; display: grid; gap: 0 48px; grid-template-columns: 1fr; }
@media (min-width: 900px) { .problems { grid-template-columns: 1fr 1fr; } }
.problems a { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 20px 0; border-bottom: 1px solid var(--line); text-decoration: none; font-size: 19px; font-weight: 500; min-height: 44px; }
.problems a span { color: var(--petrol); font-size: 15px; font-weight: 600; white-space: nowrap; }
.problems a:hover { color: var(--petrol); }
.note { margin-top: 28px; padding: 20px 22px; border-left: 4px solid var(--coral); background: var(--mineral); border-radius: 0 var(--r) var(--r) 0; }
.steps-list { margin-top: 24px; padding-left: 22px; display: grid; gap: 12px; font-size: 19px; }
.steps-list li::marker { color: var(--coral); font-weight: 700; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
```

- [ ] **Step 4: Verify the hero fits and the draw plays**

Run `npx astro build && npx astro preview --port 4330` in the background, then with Playwright at 390x844 and 1280x800: assert the "Talk to us" hero button's bounding box bottom is under the viewport height; take screenshots at 0.2 s, 1.0 s and 2.5 s after load; confirm the outline is visible at 1.0 s and the fill plus dot at 2.5 s. With `reducedMotion: 'reduce'` the mark is fully filled at 0.2 s.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Home: catalogue, problems, build steps, logo trace and fill"
```

---

### Task 3: Products catalogue and product pages

**Files:**
- Create: `src/pages/products/index.astro`, `src/pages/products/[slug].astro`
- Delete: `src/pages/products.astro`
- Modify: `src/styles/global.css` (append product page section)

**Interfaces:**
- Consumes: `ProductCard`, `products.json`, `BaseLayout`.
- Produces: `/products/pharmulo`, `/products/freight-billing`.

- [ ] **Step 1: `/products`**: h1 "Products", `.sub` "Software we build and run ourselves, used by businesses every day.", then the same `.catalogue` grid as Home (two product cards plus the custom card).

- [ ] **Step 2: `[slug].astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import products from '../../data/products.json';
import company from '../../data/company.json';
export function getStaticPaths() { return products.map((p) => ({ params: { slug: p.slug }, props: { p } })); }
const { p } = Astro.props;
const site = new URL('/', Astro.site).href;
const app = { '@type': 'SoftwareApplication', name: p.name, applicationCategory: p.schema.applicationCategory, operatingSystem: 'Web, Android', description: p.detail, ...(p.url ? { url: p.url } : {}), publisher: { '@id': `${site}#organization` } };
---
<BaseLayout path={`/products/${p.slug}`} jsonLd={[app]}>
  <section class="section product"><div class="wrap product-grid">
    <div>
      <p class="card-tag petrol">Live · {p.audience}</p>
      <h1>{p.name}</h1>
      <p class="sub">{p.oneLiner}</p>
      <p class="detail">{p.detail}</p>
      {p.cta === 'external' ? <a class="btn" href={p.url} rel="noopener">Visit {new URL(p.url).hostname}</a> : <a class="btn" href="/contact">Talk to us</a>}
      {p.cta === 'external' && <p class="also">Questions first? <a class="link" href="/contact">Talk to us</a></p>}
    </div>
    {p.screenshot && <img src={p.screenshot.src} alt={p.screenshot.alt} width={p.screenshot.width} height={p.screenshot.height} fetchpriority="high" />}
  </div></section>
  {p.testimonial && <section class="section tint"><div class="wrap"><figure class="quote"><blockquote>“{p.testimonial.quote}”</blockquote><figcaption>{p.testimonial.name}, {p.testimonial.role}, {p.testimonial.business}</figcaption></figure></div></section>}
</BaseLayout>
```

Note: the "Visit pharmulo.com" button and the "Talk to us" link coexist on the Pharmulo page by design; the check forbids other contact labels, not external links.

Product CSS (append):

```css
.product-grid { display: grid; gap: 40px; align-items: center; grid-template-columns: 1fr; }
@media (min-width: 900px) { .product-grid { grid-template-columns: 1fr 1.2fr; } }
.product .sub { margin-top: 18px; } .product .detail { margin: 18px 0 28px; max-width: 58ch; }
.product img { border-radius: var(--r-lg); border: 1px solid var(--line); }
.petrol { color: var(--petrol); } .also { margin-top: 16px; }
.quote blockquote { margin: 0; font-size: clamp(22px, 2.4vw, 28px); line-height: 1.4; max-width: 40ch; }
.quote figcaption { margin-top: 14px; color: var(--muted); }
```

- [ ] **Step 3: Build, check the two product URLs render with one h1 and SoftwareApplication in their JSON-LD.**

Run: `npx astro build && node -e "for (const s of ['pharmulo','freight-billing']) { const h=require('fs').readFileSync('dist/products/'+s+'/index.html','utf8'); if(!h.includes('SoftwareApplication')) throw s; } console.log('ok')"`
Expected: `ok`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "Products: catalogue page and one page per product"
```

---

### Task 4: Custom software and the three solution pages

**Files:**
- Create: `src/pages/custom-software.astro`, `src/data/solutions.ts`, `src/pages/solutions/[slug].astro`, `src/components/Faq.astro`

**Interfaces:**
- Produces: `Faq.astro` props `{ items: { q: string; a: string }[] }` renders `<details>` list; export helper `faqSchema(items)` from `src/data/solutions.ts` returning a FAQPage object.

- [ ] **Step 1: `/custom-software`**

Copy:
- h1 "Custom software, built around how you already work"
- `.sub` "When no product fits, we build one for your business and keep it running."
- h2 "What we build" and a two-column list: "Ordering and billing systems", "Inventory and stock tracking", "Customer and retailer portals", "Android and iOS apps", "Tally, Busy and Marg integrations", "WhatsApp and SMS notifications", "Dashboards and reports".
- h2 "How it works" and the four steps from Home, each with one sentence: "A call about how the work happens today. Bring the forms, registers or spreadsheets." / "A fixed written scope and price. Nothing starts until you agree to it." / "Weekly progress you can click through, so there are no surprises." / "Support and changes after launch. The people who built it keep it running."
- h2 "What we don't do" with "Standalone brochure websites. We build software your business runs on."
- Service schema: `{ '@type': 'Service', name: 'Custom business software', serviceType: 'Custom software development', provider: { '@id': org }, areaServed: 'IN' }`.
- The founder note and the form section as on Home.

- [ ] **Step 2: `src/data/solutions.ts`**

Export `solutions` as an array of `{ slug, h1, answer, sections: { h2: string; body: string[] }[], leadsTo: { label: string; href: string }, faqs: { q: string; a: string }[] }` and `faqSchema(items)`. Write the full copy below, each page about 450 to 650 words. `answer` is the 1 to 2 sentence direct answer placed under the h1 (the sentence AI answers tend to quote).

1. `pharma-distributor-ordering`
   - h1 "Online ordering for pharma distributors"
   - answer "A pharma distributor can stop retyping retailer orders by giving retailers an ordering app under the distributor's own name. Each order arrives as a GST bill in the distributor's system, ready to pack."
   - sections: "The problem with WhatsApp and phone orders" (orders arrive as messages, voice notes and calls; someone retypes them into Marg or similar software; errors in quantities and batches; orders lost after hours), "What an ordering app changes" (retailers see live stock and their own prices, order any time, the order opens as a bill, no retyping, fewer mistakes), "What to look for" (works on basic Android phones, your name not the vendor's, live stock and scheme pricing, fits the billing software you already use, support in your time zone), "How Pharmulo does it" (built and run by Adiviath; link to /products/pharmulo and pharmulo.com).
   - leadsTo `{ label: 'See Pharmulo', href: '/products/pharmulo' }`
   - faqs: "Do retailers need to install anything?" / "Can we keep using our existing billing software?" / "How long does it take to start?" with honest answers ("Retailers use an app or a web link on their phone.", "Yes. Orders arrive as bills in the system you use; tell us which one and we confirm on the first call.", "Usually a few weeks, depending on your catalogue and billing software. We give you a date in the written scope.").
2. `freight-billing-software`
   - h1 "LR and freight billing software for transporters"
   - answer "Freight billing software links every lorry receipt to its freight bill and every payment to the bills it settles, so a transporter always knows what is billed, paid and pending."
   - sections: "Where transport billing goes wrong" (LRs on paper or Excel, bills made separately, part payments and TDS deductions hard to match, statements take hours), "What the system does" (LR entry once, bill from LRs, payment allocation including part payments, customer statements on demand, a portal where customers see their own statement), "Built inside a working transport company" (Naveen Logistics, family-run, Bengaluru, running daily; say it plainly), "Getting it for your business" (talk to us; configured to your routes, rates and bill format).
   - leadsTo `{ label: 'See the freight billing system', href: '/products/freight-billing' }`
   - faqs: "Can it handle part payments and TDS?" / "Can customers see their own statement?" / "Do we need to change our bill format?" (answers: "Yes. Payments are allocated against one or more bills, including part payments and deductions.", "Yes. Each customer gets a login to see their bills, payments and balance.", "No. We set it up to match the format you already send.").
3. `distributor-software`
   - h1 "Custom software for distributors and wholesalers"
   - answer "When off-the-shelf software doesn't fit how a distribution business works, a custom system can handle ordering, billing and stock your way and still keep Tally, Busy or Marg as the books."
   - sections: "Signs you've outgrown spreadsheets" (the same data typed in two places, stock that never matches, reports that take a day, one person who knows how it all works), "What we build for distributors" (order capture, billing rules, stock across godowns, salesman and route tracking, retailer portals, dashboards), "Keeping Tally, Busy or Marg" (integrate instead of replace; your accountant keeps their books), "How a build goes" (the four steps, fixed written scope and price).
   - leadsTo `{ label: 'How custom builds work', href: '/custom-software' }`
   - faqs: "Will we have to stop using Tally?" / "Who owns the software?" / "What does it cost?" (answers: "No. We connect to it so your books stay where they are.", "Your data is always yours. Ownership of the code is agreed in the written scope before work starts.", "It depends on scope. After the first call you get a fixed written price before anything starts.").

- [ ] **Step 3: `solutions/[slug].astro`** renders h1, `.sub` answer, the sections as `.prose`, a `.btn` to `leadsTo.href` with its label, `<Faq items={faqs} />`, then the founder note plus form section; passes `jsonLd={[faqSchema(faqs)]}`.

- [ ] **Step 4: Build and check**

Run: `npm run verify`
Expected: check-site now lists only failures about sitemap and llms files (fixed in Task 9); no page-level failures.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Custom software page and three solution pages with FAQs"
```

---

### Task 5: About, Contact, Privacy, Terms

**Files:**
- Rewrite: `src/pages/about.astro`, `src/pages/contact.astro`
- Create: `src/pages/privacy.astro`, `src/pages/terms.astro`

- [ ] **Step 1: About**, with copy:
  - h1 "About Adiviath Technologies"
  - `.sub` "A founder-led software company in Bengaluru. We build and run our own products and build custom systems for specific businesses."
  - h2 "Company" and a `<dl>`: Legal name, CIN, Registered office (address lines), Director (Himanshu Agarwal), Email.
  - h2 "The founder": "Himanshu Agarwal, Director. Building software for businesses since 2020."
  - h2 "The name": "Adiviath is the founder's spelling of Advaita, a Sanskrit word for oneness: software that fits the work it serves." then the brand line "Your work. Your way. Your software." set large in petrol.
  - h2 "How we work": the four steps.
  - `AboutPage` is chosen automatically by path in `BaseLayout`.
- [ ] **Step 2: Contact**: h1 "Talk to us", `.sub` "Tell us what's slow or broken today. We reply within one business day.", the form, the email address, the founder note; the footer already carries the disclosures.
- [ ] **Step 3: Privacy policy** (`.prose`). Legal copy on this page and on Terms must not use the phrases the check script bans as contact labels ("contact us", "get in touch", "reach out"); write "email our grievance contact" instead. Sections and content:
  1. "Who we are": legal name, CIN, registered office, grievance contact and email.
  2. "What we collect": what you type in the contact form (name, business name, email or phone, interest, message); emails you send us; with your consent only, analytics data about pages visited, device and approximate location through Google Analytics; basic server logs kept by our host (IP address, time, page) for security.
  3. "Why": to reply to your enquiry and discuss work with you; to understand which pages help visitors (analytics, only if you accept); to protect the site from abuse.
  4. "Who processes it": Vercel Inc. (hosting and server logs), Resend (delivering form messages to our inbox), Cloudflare (Turnstile bot checks on the form), Google (Analytics, only with consent), and our email provider for contact@adiviath.com. Some of these providers process data outside India.
  5. "How long we keep it": enquiries and email up to 24 months after our last contact with you, then deleted; analytics up to 14 months; server logs per our host's standard retention.
  6. "How we protect it": HTTPS everywhere, secrets kept out of the code, access limited to the founder, no sale or sharing of your data for marketing.
  7. "Your choices and rights": withdraw analytics consent at any time from "Cookie settings" in the footer; ask to see, correct or delete your information by emailing the grievance contact; we reply within 30 days.
  8. "Grievances": Himanshu Agarwal, Director, contact@adiviath.com, registered office address.
  9. "If something goes wrong": if a breach affects your information, we will tell you and the relevant authority as the law requires.
  10. "Changes": the date at the top ("Last updated: 24 September 2026") changes when this policy does.
- [ ] **Step 4: Terms of use** (`.prose`): who we are; the site is for information and describes our products and services; no warranty that the content is complete or current; content and marks belong to Adiviath or their owners; links to other sites such as pharmulo.com are governed by those sites' terms; limitation of liability to the extent the law allows; governing law India, courts at Bengaluru; contact.
- [ ] **Step 5: Build, verify, commit**

Run: `npm run verify` (same expected state as Task 4).

```bash
git add -A && git commit -m "About, Contact, Privacy policy and Terms of use"
```

---

### Task 6: Lead endpoint

**Files:**
- Create: `src/lib/lead.ts`, `src/lib/throttle.ts`, `src/pages/api/lead.ts`, `tests/lead.test.ts`, `tests/api-lead.test.ts`
- Modify: `astro.config.mjs` (add `adapter: vercel()`), `package.json` (`npm i @astrojs/vercel@^9`)

**Interfaces:**
- Produces: `validateLead(input: unknown): { ok: true; lead: Lead } | { ok: false; errors: Record<string, string> }`; `Lead = { name: string; business: string; contact: string; interest: 'Pharmulo' | 'Freight billing system' | 'Something custom'; message: string }`; `renderLeadEmail(lead: Lead): { subject: string; text: string; html: string; replyTo?: string }`; `allow(ip: string, now?: number): boolean`; `handleLead(req: Request, env: Env, fetchImpl?: typeof fetch): Promise<Response>` where `Env = { RESEND_API_KEY?: string; TURNSTILE_SECRET_KEY?: string; LEAD_TO?: string; LEAD_FROM?: string; ALLOWED_ORIGINS: string[] }`. Response JSON is `{ ok: true }` or `{ ok: false, errors?: Record<string,string>, message: string }`.

- [ ] **Step 1: Failing tests `tests/lead.test.ts`**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLead, renderLeadEmail } from '../src/lib/lead.ts';

const base = { name: 'Ravi Kumar', business: 'Sri Balaji Pharma', contact: 'ravi@balaji.in', interest: 'Pharmulo', message: 'Orders come on WhatsApp.', company_site: '' };

test('valid lead passes', () => assert.equal(validateLead(base).ok, true));
test('Indian phone passes', () => assert.equal(validateLead({ ...base, contact: '+91 98450 12345' }).ok, true));
test('missing name fails', () => { const r = validateLead({ ...base, name: '  ' }); assert.equal(r.ok, false); assert.ok(!r.ok && r.errors.name); });
test('garbage contact fails', () => { const r = validateLead({ ...base, contact: 'call me' }); assert.ok(!r.ok && r.errors.contact); });
test('unknown interest fails', () => assert.equal(validateLead({ ...base, interest: 'Crypto' }).ok, false));
test('overlong message fails', () => assert.equal(validateLead({ ...base, message: 'x'.repeat(2001) }).ok, false));
test('non-object fails', () => assert.equal(validateLead('hi').ok, false));
test('newlines never reach the subject', () => {
  const r = validateLead({ ...base, business: 'Evil\r\nBcc: x@y.z' }); assert.ok(r.ok);
  const e = renderLeadEmail(r.ok ? r.lead : (null as never)); assert.ok(!/[\r\n]/.test(e.subject));
});
test('html is escaped', () => {
  const r = validateLead({ ...base, message: '<img src=x onerror=alert(1)>' }); assert.ok(r.ok);
  assert.ok(!renderLeadEmail(r.ok ? r.lead : (null as never)).html.includes('<img'));
});
test('reply-to only for emails', () => {
  const p = validateLead({ ...base, contact: '9845012345' }); assert.ok(p.ok);
  assert.equal(renderLeadEmail(p.ok ? p.lead : (null as never)).replyTo, undefined);
});
```

- [ ] **Step 2: Run, expect failure** (`node --test tests/`: cannot find module).

- [ ] **Step 3: `src/lib/lead.ts`**

```ts
export const INTERESTS = ['Pharmulo', 'Freight billing system', 'Something custom'] as const;
export type Lead = { name: string; business: string; contact: string; interest: (typeof INTERESTS)[number]; message: string };
const LIMITS = { name: 100, business: 150, contact: 150, message: 2000 } as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^(?:\+?91[\s-]?)?0?[6-9]\d{4}[\s-]?\d{5}$/;
const clean = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function validateLead(input: unknown): { ok: true; lead: Lead } | { ok: false; errors: Record<string, string> } {
  if (!input || typeof input !== 'object') return { ok: false, errors: { form: 'Invalid submission.' } };
  const o = input as Record<string, unknown>;
  const lead = { name: clean(o.name), business: clean(o.business), contact: clean(o.contact), interest: clean(o.interest), message: typeof o.message === 'string' ? o.message.trim() : '' };
  const errors: Record<string, string> = {};
  if (!lead.name) errors.name = 'Please enter your name.'; else if (lead.name.length > LIMITS.name) errors.name = 'Please keep this under 100 characters.';
  if (!lead.business) errors.business = 'Please enter your business name.'; else if (lead.business.length > LIMITS.business) errors.business = 'Please keep this under 150 characters.';
  if (!lead.contact) errors.contact = 'Please enter an email or phone number.';
  else if (lead.contact.length > LIMITS.contact || !(EMAIL.test(lead.contact) || PHONE.test(lead.contact))) errors.contact = 'Please enter a valid email or a 10-digit mobile number.';
  if (!INTERESTS.includes(lead.interest as Lead['interest'])) errors.interest = 'Please choose one.';
  if (!lead.message) errors.message = 'Please tell us a little about what is slow.'; else if (lead.message.length > LIMITS.message) errors.message = 'Please keep this under 2000 characters.';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, lead: lead as Lead };
}

export function renderLeadEmail(lead: Lead) {
  const subject = `Website enquiry: ${lead.business} (${lead.interest})`.replace(/[\r\n]+/g, ' ').slice(0, 200);
  const rows: [string, string][] = [['Name', lead.name], ['Business', lead.business], ['Email or phone', lead.contact], ['Interested in', lead.interest], ['Message', lead.message]];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  const html = `<table cellpadding="6">${rows.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>`;
  return { subject, text, html, replyTo: EMAIL.test(lead.contact) ? lead.contact : undefined };
}
```

- [ ] **Step 4: Run tests, expect PASS.**

- [ ] **Step 5: Failing endpoint tests `tests/api-lead.test.ts`**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleLead } from '../src/pages/api/lead.ts';

const env = { RESEND_API_KEY: 'k', TURNSTILE_SECRET_KEY: 's', ALLOWED_ORIGINS: ['https://www.adiviath.com'] };
const body = { name: 'Ravi', business: 'Balaji Pharma', contact: 'ravi@balaji.in', interest: 'Pharmulo', message: 'Hi', company_site: '', token: 't' };
const req = (b: unknown, h: Record<string, string> = {}) => new Request('https://www.adiviath.com/api/lead', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://www.adiviath.com', 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}`, ...h }, body: typeof b === 'string' ? b : JSON.stringify(b) });
const ok = (calls: string[]) => (async (url: string) => { calls.push(String(url)); return new Response(JSON.stringify(String(url).includes('turnstile') ? { success: true, hostname: 'www.adiviath.com', action: 'lead' } : { id: '1' }), { status: 200 }); }) as typeof fetch;

test('happy path sends one email', async () => { const c: string[] = []; const r = await handleLead(req(body), env, ok(c)); assert.equal(r.status, 200); assert.equal(c.filter((u) => u.includes('resend')).length, 1); });
test('bad origin rejected', async () => { const c: string[] = []; const r = await handleLead(req(body, { origin: 'https://evil.example' }), env, ok(c)); assert.equal(r.status, 403); assert.equal(c.length, 0); });
test('honeypot silently dropped', async () => { const c: string[] = []; const r = await handleLead(req({ ...body, company_site: 'x' }), env, ok(c)); assert.equal(r.status, 200); assert.equal(c.length, 0); });
test('big body rejected', async () => { const c: string[] = []; const r = await handleLead(req({ ...body, message: 'x'.repeat(50000) }), env, ok(c)); assert.equal(r.status, 413); assert.equal(c.length, 0); });
test('missing token rejected', async () => { const c: string[] = []; const r = await handleLead(req({ ...body, token: '' }), env, ok(c)); assert.equal(r.status, 400); assert.equal(c.length, 0); });
test('turnstile wrong hostname rejected', async () => {
  const f = (async (u: string) => new Response(JSON.stringify(String(u).includes('turnstile') ? { success: true, hostname: 'evil.example', action: 'lead' } : { id: 1 }))) as typeof fetch;
  const r = await handleLead(req(body), env, f); assert.equal(r.status, 400);
});
test('resend down gives the email fallback message', async () => {
  const f = (async (u: string) => String(u).includes('turnstile') ? new Response(JSON.stringify({ success: true, hostname: 'www.adiviath.com', action: 'lead' })) : new Response('x', { status: 500 })) as typeof fetch;
  const r = await handleLead(req(body), env, f); assert.equal(r.status, 502); assert.match((await r.json()).message, /contact@adiviath\.com/);
});
test('missing secrets gives the email fallback message', async () => { const r = await handleLead(req(body), { ALLOWED_ORIGINS: env.ALLOWED_ORIGINS }, ok([])); assert.equal(r.status, 503); });
test('validation errors are returned per field', async () => { const r = await handleLead(req({ ...body, contact: 'nope' }), env, ok([])); assert.equal(r.status, 422); assert.ok((await r.json()).errors.contact); });
```

- [ ] **Step 6: `src/lib/throttle.ts`**

```ts
// Best-effort only: each serverless instance has its own memory. The Vercel Firewall rule is the real limit.
const hits = new Map<string, number[]>();
export function allow(ip: string, now = Date.now(), max = 5, windowMs = 600_000): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) { hits.set(ip, recent); return false; }
  recent.push(now); hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}
```

- [ ] **Step 7: `src/pages/api/lead.ts`**

```ts
import type { APIRoute } from 'astro';
import { validateLead, renderLeadEmail } from '../../lib/lead.ts';
import { allow } from '../../lib/throttle.ts';

export const prerender = false;
const FALLBACK = 'Could not send right now. Please email contact@adiviath.com.';
type Env = { RESEND_API_KEY?: string; TURNSTILE_SECRET_KEY?: string; LEAD_TO?: string; LEAD_FROM?: string; ALLOWED_ORIGINS: string[] };
const json = (status: number, data: object) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const timed = (f: typeof fetch, url: string, init: RequestInit) => f(url, { ...init, signal: AbortSignal.timeout(8000) });

export async function handleLead(req: Request, env: Env, f: typeof fetch = fetch): Promise<Response> {
  if (req.method !== 'POST') return json(405, { ok: false, message: 'Method not allowed.' });
  if (!env.ALLOWED_ORIGINS.includes(req.headers.get('origin') ?? '')) return json(403, { ok: false, message: 'Forbidden.' });
  if (!(req.headers.get('content-type') ?? '').startsWith('application/json')) return json(415, { ok: false, message: 'Unsupported.' });
  const raw = await req.text();
  if (raw.length > 8192) return json(413, { ok: false, message: 'Too large.' });
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return json(400, { ok: false, message: 'Invalid submission.' }); }
  if (typeof body.company_site === 'string' && body.company_site.trim()) return json(200, { ok: true });
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (!allow(ip)) return json(429, { ok: false, message: 'Too many messages. Please email contact@adiviath.com.' });
  const v = validateLead(body);
  if (!v.ok) return json(422, { ok: false, errors: v.errors, message: 'Please check the highlighted fields.' });
  const token = typeof body.token === 'string' ? body.token : '';
  if (!token) return json(400, { ok: false, message: 'Please complete the check and try again.' });
  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET_KEY) return json(503, { ok: false, message: FALLBACK });
  try {
    const ts = await timed(f, 'https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip, idempotency_key: crypto.randomUUID() }) });
    const t = (await ts.json()) as { success?: boolean; hostname?: string; action?: string };
    const host = new URL(env.ALLOWED_ORIGINS[0]).hostname;
    if (!t.success || t.action !== 'lead' || (t.hostname !== host && t.hostname !== 'localhost')) return json(400, { ok: false, message: 'Please complete the check and try again.' });
    const mail = renderLeadEmail(v.lead);
    const idem = (await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))).slice(0, 16);
    const rs = await timed(f, 'https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', 'idempotency-key': Buffer.from(idem).toString('hex') }, body: JSON.stringify({ from: env.LEAD_FROM ?? 'Adiviath website <website@adiviath.com>', to: [env.LEAD_TO ?? 'contact@adiviath.com'], subject: mail.subject, text: mail.text, html: mail.html, ...(mail.replyTo ? { reply_to: mail.replyTo } : {}) }) });
    if (!rs.ok) { console.error('lead: resend status', rs.status); return json(502, { ok: false, message: FALLBACK }); }
    return json(200, { ok: true });
  } catch (e) {
    console.error('lead: upstream failure', (e as Error).name);
    return json(502, { ok: false, message: FALLBACK });
  }
}

const origins = () => ['https://www.adiviath.com', ...(import.meta.env.VERCEL_ENV !== 'production' && import.meta.env.VERCEL_URL ? [`https://${import.meta.env.VERCEL_URL}`] : []), ...(import.meta.env.DEV ? ['http://localhost:4321'] : [])];
export const POST: APIRoute = ({ request }) => handleLead(request, { RESEND_API_KEY: import.meta.env.RESEND_API_KEY, TURNSTILE_SECRET_KEY: import.meta.env.TURNSTILE_SECRET_KEY, LEAD_TO: import.meta.env.LEAD_TO, LEAD_FROM: import.meta.env.LEAD_FROM, ALLOWED_ORIGINS: origins() });
export const ALL: APIRoute = () => json(405, { ok: false, message: 'Method not allowed.' });
```

Note: the test file imports `handleLead` from an Astro route that references `import.meta.env` only inside functions, so it loads under plain Node. If Node rejects the `astro` type import, keep it `import type` (erased by type stripping).

- [ ] **Step 8: `astro.config.mjs`**: `import vercel from '@astrojs/vercel';` and `adapter: vercel()` alongside the existing config; output stays static.

- [ ] **Step 9: Run all tests and build**

Run: `npm test && npx astro build`
Expected: all tests PASS; build output shows `/api/lead` as a server function and every page prerendered.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "Lead endpoint: validation, Turnstile, throttle, Resend, safe failures"
```

---

### Task 7: Lead form component

**Files:**
- Create: `src/components/LeadForm.astro`, `src/scripts/lead-form.ts`
- Modify: every page that shows the form (Home, Contact, Custom software, product pages with `cta: "form"`, solution pages), `src/styles/global.css`

**Interfaces:**
- Consumes: `POST /api/lead` contract from Task 6; `PUBLIC_TURNSTILE_SITE_KEY`.
- Produces: `<LeadForm interest?="Pharmulo"|"Freight billing system"|"Something custom" />`.

- [ ] **Step 1: Markup.** If `import.meta.env.PUBLIC_TURNSTILE_SITE_KEY` is empty, render only the fallback: `<p class="form-fallback">Email us at <a class="link" href="mailto:contact@adiviath.com">contact@adiviath.com</a>. We reply within one business day.</p>`. Otherwise:

```astro
<form class="lead" data-lead novalidate data-sitekey={key}>
  <div class="row">
    <label>Your name<input name="name" autocomplete="name" required maxlength="100"><span class="err" data-err="name"></span></label>
    <label>Business name<input name="business" autocomplete="organization" required maxlength="150"><span class="err" data-err="business"></span></label>
  </div>
  <label>Email or phone<span class="hint">Whichever you check more.</span><input name="contact" inputmode="email" autocomplete="email" required maxlength="150"><span class="err" data-err="contact"></span></label>
  <label>You're interested in<select name="interest" required>{INTERESTS.map((i) => <option selected={i === interest}>{i}</option>)}</select><span class="err" data-err="interest"></span></label>
  <label>What's slow or broken today?<textarea name="message" required maxlength="2000" placeholder="Example: orders come on WhatsApp and we type them into Marg by hand"></textarea><span class="err" data-err="message"></span></label>
  <div class="hp" aria-hidden="true"><label>Leave this empty<input name="company_site" tabindex="-1" autocomplete="off"></label></div>
  <div class="ts" data-ts></div>
  <p class="notice">We use these details only to reply to you. See our <a class="link" href="/privacy">privacy policy</a>.</p>
  <button class="btn" type="submit">Send</button>
  <p class="status" role="status" aria-live="polite"></p>
  <p class="alt">Prefer email? <a class="link" href="mailto:contact@adiviath.com">contact@adiviath.com</a></p>
</form>
<script src="../scripts/lead-form.ts"></script>
```

Note: the submit label is "Send", not a contact phrase, so the one-contact-label rule holds.

- [ ] **Step 2: `src/scripts/lead-form.ts`**

```ts
declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: object) => string; reset: (id?: string) => void }; onTsLoad?: () => void } }
const form = document.querySelector<HTMLFormElement>('form[data-lead]');
if (form) {
  const status = form.querySelector<HTMLElement>('.status')!;
  const btn = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  let token = '';
  let widget: string | undefined;
  window.onTsLoad = () => {
    widget = window.turnstile!.render(form.querySelector('[data-ts]')!, {
      sitekey: form.dataset.sitekey, action: 'lead', appearance: 'interaction-only',
      callback: (t: string) => { token = t; }, 'expired-callback': () => { token = ''; window.turnstile!.reset(widget); }, 'error-callback': () => { token = ''; },
    });
  };
  const s = document.createElement('script');
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTsLoad&render=explicit'; s.async = true; s.defer = true;
  document.head.append(s);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    form.querySelectorAll<HTMLElement>('[data-err]').forEach((el) => (el.textContent = ''));
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    btn.disabled = true; status.textContent = 'Sending…';
    try {
      const res = await fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...data, token }) });
      const out = await res.json();
      if (out.ok) { form.replaceChildren(Object.assign(document.createElement('p'), { className: 'sent', textContent: 'Thank you. Your message reached us. Himanshu will reply within one business day.' })); return; }
      if (out.errors) for (const [k, m] of Object.entries(out.errors as Record<string, string>)) {
        const el = form.querySelector<HTMLElement>(`[data-err="${k}"]`); if (el) el.textContent = m;
        form.querySelector(`[name="${k}"]`)?.setAttribute('aria-invalid', 'true');
      }
      status.textContent = out.message;
      form.querySelector<HTMLElement>('[aria-invalid]')?.focus();
    } catch { status.textContent = 'Could not send right now. Please email contact@adiviath.com.'; }
    finally { btn.disabled = false; token = ''; window.turnstile?.reset(widget); }
  });
}
export {};
```

- [ ] **Step 3: Form CSS (append)**

```css
form.lead { display: grid; gap: 18px; background: #fff; padding: clamp(20px, 3vw, 32px); border-radius: var(--r-lg); border: 1px solid var(--line); }
form.lead .row { display: grid; gap: 18px; grid-template-columns: 1fr; } @media (min-width: 640px) { form.lead .row { grid-template-columns: 1fr 1fr; } }
form.lead label { display: grid; gap: 8px; font-weight: 600; font-size: 16px; }
form.lead input, form.lead select, form.lead textarea { width: 100%; font: inherit; font-size: 17px; min-height: 50px; padding: 12px 14px; border: 1.5px solid var(--field); border-radius: var(--r); background: #fff; color: var(--ink); }
form.lead textarea { min-height: 120px; resize: vertical; }
form.lead [aria-invalid] { border-color: #b3261e; }
.hint { font-weight: 400; font-size: 14px; color: var(--muted); }
.err { font-weight: 500; font-size: 14px; color: #b3261e; } .err:empty { display: none; }
.hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.notice, .alt { font-size: 15px; color: var(--muted); } .status:empty { display: none; } .status { font-weight: 600; }
.sent { font-size: 20px; font-weight: 600; color: var(--petrol); padding: 12px 0; }
form.lead .btn { justify-self: start; min-width: 160px; }
```

- [ ] **Step 4: Place `<LeadForm />`** on Home, Contact, Custom software, the freight product page (`interest="Freight billing system"`), and each solution page with its matching interest.

- [ ] **Step 5: Verify locally** with Turnstile's public test keys (site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`) and no Resend key: submitting shows "Could not send right now. Please email contact@adiviath.com." (503 path), empty submit shows per-field errors and focuses the first, and the form fits at 360 px with no overflow.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Lead form: inline errors, Turnstile, honeypot, safe fallback"
```

---

### Task 8: Consent bar and Google Analytics

**Files:**
- Create: `src/components/ConsentBar.astro`, `src/scripts/consent.ts`
- Modify: `src/layouts/BaseLayout.astro` (render `<ConsentBar />` only when `PUBLIC_GA_ID` is set; unhide the footer "Cookie settings" button in that case), `global.css`

- [ ] **Step 1: Markup**

```astro
---
const id = import.meta.env.PUBLIC_GA_ID;
---
{id && (
  <div class="consent" data-consent data-ga={id} hidden role="region" aria-label="Cookie choice">
    <p>We'd like to use Google Analytics cookies to see which pages help visitors. Nothing loads unless you accept. <a class="link" href="/privacy">Privacy policy</a></p>
    <div class="consent-actions"><button class="btn" data-choice="granted">Accept</button><button class="btn" data-choice="denied">Decline</button></div>
  </div>
)}
{id && <script src="../scripts/consent.ts"></script>}
```

Both buttons use the same `.btn` style, so they have equal weight.

- [ ] **Step 2: `src/scripts/consent.ts`**

```ts
const VERSION = 1;
const KEY = 'adv-consent';
const bar = document.querySelector<HTMLElement>('[data-consent]');
type Choice = { v: number; c: 'granted' | 'denied' };
const read = (): Choice | null => { try { const x = JSON.parse(localStorage.getItem(KEY) ?? 'null'); return x?.v === VERSION ? x : null; } catch { return null; } };
const write = (c: Choice['c']) => { try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, c })); } catch { /* storage blocked: ask again next visit */ } };
const clearGa = () => document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => n.startsWith('_ga')).forEach((n) => {
  for (const d of ['', '.adiviath.com', 'www.adiviath.com']) document.cookie = `${n}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`;
});
function loadGa(id: string) {
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () { w.dataLayer.push(arguments); };
  w.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
  w.gtag('js', new Date()); w.gtag('config', id, { anonymize_ip: true });
  const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`; document.head.append(s);
}
if (bar) {
  const id = bar.dataset.ga!;
  const choice = read();
  if (choice?.c === 'granted') loadGa(id); else if (!choice) bar.hidden = false;
  bar.addEventListener('click', (e) => {
    const c = (e.target as HTMLElement).closest<HTMLElement>('[data-choice]')?.dataset.choice as Choice['c'] | undefined;
    if (!c) return;
    const was = read()?.c;
    write(c); bar.hidden = true;
    if (c === 'granted' && was !== 'granted') loadGa(id);
    if (c === 'denied') { clearGa(); if (was === 'granted') location.reload(); }
  });
  const open = document.querySelector<HTMLButtonElement>('[data-consent-open]');
  if (open) { open.hidden = false; open.addEventListener('click', () => { bar.hidden = false; bar.querySelector<HTMLElement>('[data-choice]')?.focus(); }); }
}
export {};
```

- [ ] **Step 3: CSS**

```css
.consent { position: fixed; left: 12px; right: 12px; bottom: 12px; z-index: 40; max-width: 720px; margin-inline: auto; background: #fff; border: 1px solid var(--line); border-radius: var(--r-lg); box-shadow: 0 12px 40px rgb(32 43 48 / .18); padding: 18px 20px; display: grid; gap: 14px; font-size: 16px; }
.consent[hidden] { display: none; }
.consent-actions { display: flex; gap: 10px; flex-wrap: wrap; } .consent .btn { min-height: 44px; flex: 1 1 120px; }
```

- [ ] **Step 4: Verify with Playwright** using `PUBLIC_GA_ID=G-TEST123` build: (a) fresh load, record requests: none to `googletagmanager.com`; bar visible. (b) click Decline, reload: no GA request, bar hidden. (c) Cookie settings, Accept: one request to `googletagmanager.com`. (d) Cookie settings, Decline: page reloads, no GA request after reload, no `_ga` cookie remains.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Consent bar and Google Analytics loaded only after accept"
```

---

### Task 9: Sitemap, llms files, robots, IndexNow

**Files:**
- Rewrite: `src/pages/sitemap.xml.ts`, `astro.config.mjs` llms-full integration
- Create: `src/pages/llms.txt.ts`, `scripts/indexnow.mjs`, `public/<key>.txt`
- Delete: `public/llms.txt`

- [ ] **Step 1: Sitemap from `pages.json`**: map every entry to `<url><loc>…</loc><lastmod>…</lastmod></url>`, lastmod from `git log -1 --format=%cI -- <source>` with the build-time fallback (keep the existing helper).
- [ ] **Step 2: `llms.txt.ts`**: header "# Adiviath Technologies", a blockquote summary (legal name, Bengaluru, products, custom work, contact email, CIN), then "## Pages" listing every `pages.json` entry as `- [title](url): description`, then "## Optional" with the llms-full link.
- [ ] **Step 3: `llms-full` integration** reads `src/data/pages.json` instead of the hard-coded list and writes each page under `## title (url)`, with the existing HTML-to-text conversion.
- [ ] **Step 4: IndexNow**: generate a 32-hex key once (`node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`), write it as the sole content of `public/<key>.txt`; `scripts/indexnow.mjs` POSTs `{ host: 'www.adiviath.com', key, keyLocation: 'https://www.adiviath.com/<key>.txt', urlList: pages.map(url) }` to `https://api.indexnow.org/indexnow` and prints the status. Add `"indexnow": "node scripts/indexnow.mjs"` to scripts.
- [ ] **Step 5: robots.txt**: keep the AI crawler allow-list; add `Disallow: /api/`.
- [ ] **Step 6: Verify**

Run: `npm test && npm run verify`
Expected: `check-site: 12 pages OK`.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "Sitemap, llms.txt and llms-full.txt from page data, IndexNow, robots"
```

---

### Task 10: Security headers, device matrix, performance, visual review

**Files:**
- Modify: `vercel.json`
- Create: `scripts/device-matrix.mjs`
- Modify: `package.json` (`npm i -D playwright@1`)

- [ ] **Step 1: `vercel.json`**

```json
{
  "trailingSlash": false,
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' https://challenges.cloudflare.com https://www.googletagmanager.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; img-src 'self' data: https://*.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; font-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
    ] }
  ]
}
```

Verify on a Vercel preview deployment (Task 11) that the browser console shows no CSP violations with consent accepted and the form open.

- [ ] **Step 2: `scripts/device-matrix.mjs`**: for each engine in `chromium`, `webkit`, `firefox` and each viewport in `360x640, 390x844, 412x915, 768x1024, 1024x768, 1280x800, 1440x900, 1920x1080`, open every `pages.json` path on `BASE` (default `http://localhost:4330`), then assert: `scrollWidth <= innerWidth`; no element in `main` extends past the viewport; every visible `a, button, summary, input, select, textarea` is at least 44 px in one dimension (inline links inside paragraphs excepted); exactly one visible `h1`; no console errors. Save a full-page screenshot per engine, viewport and page to `/tmp/adiviath-matrix/`. Exit non-zero with a list of failures. Also, at 360x640 on Home, focus the message textarea and assert the Send button is reachable by scrolling (bounding box within `document.scrollingElement.scrollHeight`).

- [ ] **Step 3: Run it** against `npx astro preview --port 4330`; fix every failure; re-run until clean.

- [ ] **Step 4: Lighthouse** with a mobile profile on Home, one product page, one solution page and Contact: `npx -y lighthouse http://localhost:4330/ --preset=perf --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo --output=json --quiet`. Each category must be at least 95. Fix and re-run.

- [ ] **Step 5: Visual review.** Build a contact sheet of the 390 px and 1440 px Chromium screenshots for all 12 pages and review it against the `design-taste-frontend` pre-flight list; fix anything that looks off.

- [ ] **Step 6: Copy audit.** Run the `unslop` skill in audit mode on every page's visible text (use `dist/llms-full.txt`); fix findings without changing the approved headline, brand line, founder note or legal text.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "Security headers, device matrix across three engines, performance and copy fixes"
```

---

### Task 11: Preview deploy, final review, launch

- [ ] **Step 1: Push the branch** (`git push -u origin rebuild/catalogue`); Vercel builds a preview. Run the device matrix with `BASE=<preview url>` and check the response headers with `curl -sI`.
- [ ] **Step 2: Whole-branch review** in a fresh context (`/code-review` or a fresh reviewer agent) against the spec; fix confirmed findings.
- [ ] **Step 3: Founder sign-off** on screenshots of every page (phone and desktop) and on the Naveen Logistics permission.
- [ ] **Step 4: Founder setup** (steps given in chat): Resend domain and key, Turnstile keys, GA4 ID, Vercel env vars, Vercel Firewall rate-limit rule for `/api/lead` (5 requests per 10 minutes per IP). Redeploy the preview and send one real test lead end to end.
- [ ] **Step 5: Merge to `main`**, confirm production, run `npm run indexnow`, and resubmit the sitemap in Search Console.
