# The Dot Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild adiviath.com as a four-page static Astro site around the approved "The Dot" concept, with a sales-first opening, WhatsApp-first conversion, and zero client JavaScript.

**Architecture:** One fixed coral dot on Home with five scroll-driven CSS scenes positioned relative to it; inner pages reuse the same tokens, header, footer and a shared `Talk` conversion block. All motion is CSS scroll-driven animation inside `@supports` and `prefers-reduced-motion` guards with a static stacked fallback. The mark comes only from `src/data/logo-paths.json`.

**Tech Stack:** Astro 5 (static), plain CSS with custom properties, `@fontsource-variable` fonts, Node 20 for scripts, sharp (already a transitive dependency of Astro) for image conversion. No Tailwind, no client JS.

**Spec:** `docs/superpowers/specs/2026-09-17-the-dot-redesign-design.md`

## Global Constraints

- Palette tokens exactly: `--brand #125b63`, `--accent #f27c64`, `--paper #ffffff`, `--ink #202b30`, `--muted #4e6266`, `--surface #eaf1f1`, `--line #d3e3e5`. Coral is never a text colour.
- Fonts: Familjen Grotesk (display, UI, captions, labels) and Newsreader (only the Advaita line on About and quotations). Self-hosted via fontsource. No Google Fonts request.
- The mark is rendered only through `src/components/Logo.astro`, which reads `src/data/logo-paths.json`. Never paste path data elsewhere.
- Zero client JavaScript in `dist/`. The only `<script>` tags are `type="application/ld+json"`.
- All motion inside `@supports (animation-timeline: scroll())` and `@media (prefers-reduced-motion: no-preference)`; every page reads fully without it.
- Copy rules: plain English, no em dashes, no "empower", "seamless", "cutting-edge", no emoji, never the phrase "not two" on the site, never "Advaith".
- Primary CTA text everywhere: "Talk to the founder". Trust line: "Replies within one business day. You speak with the founder who scopes and builds the work."
- The WhatsApp number lives only in `src/data/contact.json`; the build fails while it is empty unless `ADIVIATH_ALLOW_EMPTY_WHATSAPP=1` is set (used only for local preview before the founder supplies it).
- Every `<img>` has `width`, `height` and `alt`. Every page has exactly one `h1`.
- Work in a git worktree on branch `redesign/the-dot`. Commit after every task with the messages given. No co-author trailers.
- Verification uses the built-in browser (`mcp__Claude_Browser__*`) against the dev server started with `preview_start {name: "adiviath"}`; each agent creates its own tab and closes it.

---

## File structure

| File | Responsibility |
|---|---|
| `package.json`, `astro.config.mjs` | drop Tailwind, add fontsource packages, add `check` script |
| `scripts/check-site.mjs` | post-build assertions over `dist/` (no JS, one h1, JSON-LD parses, img sizes, banned copy) |
| `src/data/contact.json` | WhatsApp number, email, prefilled messages, reply promise |
| `src/data/logo-paths.json` | canonical mark paths (exists, untouched) |
| `src/components/Logo.astro` | the mark (exists, untouched) |
| `src/components/Wordmark.astro` | lockup (exists, minor CSS only) |
| `src/components/Talk.astro` | the conversion block (button, email link, trust line, what happens next) |
| `src/components/DotStage.astro` | static dot with slots for inner pages |
| `src/layouts/BaseLayout.astro` | head, header, footer, JSON-LD |
| `src/styles/global.css` | tokens, fonts, base, header, footer, buttons, Talk, inner-page layout |
| `src/styles/home.css` | Home scenes and scroll-driven animation |
| `src/pages/index.astro` | Home |
| `src/pages/products.astro` | Work |
| `src/pages/about.astro` | About with FAQ schema |
| `src/pages/contact.astro` | Contact |
| `public/robots.txt`, `public/llms.txt` | crawl rules and plain-text summary |
| `public/naveen-logistics-logo.webp` | 640px logo replacing the PNG |

---

### Task 1: Foundation: dependencies, check script, tokens, layout shell

**Files:**
- Modify: `package.json`, `astro.config.mjs`
- Create: `scripts/check-site.mjs`, `src/data/contact.json`
- Rewrite: `src/styles/global.css`, `src/layouts/BaseLayout.astro`
- Modify: `src/components/Wordmark.astro` (no change to markup; CSS lives in global.css)

**Interfaces:**
- Produces: CSS custom properties listed in Global Constraints; classes `.btn`, `.btn-quiet`, `.wrap`, `.dot-static`, `.eyebrow`, `.lead`, `.section`; `BaseLayout` props `{ title: string; description: string; jsonLd?: object[] }` where `jsonLd` entries are appended to the `@graph` array; `contact.json` shape `{ whatsapp: string, email: string, whatsappMessage: string, emailSubject: string, replyPromise: string }`.

- [ ] **Step 1: Create the worktree and branch**

```bash
cd /Users/himture/Developer/Personal/adiviath
git worktree add ../adiviath-the-dot -b redesign/the-dot
cd ../adiviath-the-dot
npm install
```

- [ ] **Step 2: Replace Tailwind with fontsource**

```bash
npm uninstall tailwindcss @tailwindcss/vite
npm install @fontsource-variable/familjen-grotesk @fontsource-variable/newsreader
```

Write `astro.config.mjs`:

```js
// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.adiviath.com',
  trailingSlash: 'never',
});
```

Add to `package.json` scripts: `"check": "node scripts/check-site.mjs"` and `"verify": "astro build && node scripts/check-site.mjs"`.

- [ ] **Step 3: Write the check script (this is the test suite for every task)**

`scripts/check-site.mjs`:

```js
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../dist/', import.meta.url).pathname;
const pages = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.html')) pages.push(p);
  }
})(root);

const failures = [];
const fail = (page, msg) => failures.push(`${page.replace(root, '/')}: ${msg}`);

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const scripts = [...html.matchAll(/<script\b([^>]*)>/g)];
  for (const [, attrs] of scripts) {
    if (!/type="application\/ld\+json"/.test(attrs)) fail(page, `client script found: <script${attrs}>`);
  }
  const h1s = (html.match(/<h1\b/g) || []).length;
  if (h1s !== 1) fail(page, `expected 1 h1, found ${h1s}`);
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(json); } catch (e) { fail(page, `JSON-LD does not parse: ${e.message}`); }
  }
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\bwidth=/.test(tag) || !/\bheight=/.test(tag)) fail(page, `img without width/height: ${tag.slice(0, 80)}`);
    if (!/\balt=/.test(tag)) fail(page, `img without alt: ${tag.slice(0, 80)}`);
  }
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  if (/not two/i.test(text)) fail(page, 'banned phrase "not two"');
  if (/—/.test(text)) fail(page, 'em dash in page text');
  if (/Advaith\b/.test(text)) fail(page, 'banned spelling "Advaith"');
  if (/fonts\.googleapis\.com/.test(html)) fail(page, 'Google Fonts request');
  if (!/<link rel="canonical"/.test(html)) fail(page, 'missing canonical');
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  if (title.length === 0 || title.length > 60) fail(page, `title length ${title.length}`);
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  if (desc.length === 0 || desc.length > 155) fail(page, `description length ${desc.length}`);
}

if (pages.length < 4) failures.push(`expected at least 4 pages, found ${pages.length}`);
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`check-site: ${pages.length} pages OK`);
```

- [ ] **Step 4: Run the check against the current build to see it fail**

Run: `npm run verify`
Expected: FAIL. The old site has the mobile-menu `<script>` and `dist` still contains `mockups/*.html` and `colors.html` with client scripts and multiple h1 counts. This proves the script catches what it must.

- [ ] **Step 5: Delete the throwaway pages**

```bash
git rm -r public/mockups public/colors.html public/palette-options.html
```

- [ ] **Step 6: Create `src/data/contact.json`**

```json
{
  "whatsapp": "",
  "email": "hello@adiviath.com",
  "whatsappMessage": "Hi, I'm looking at software for our business. We currently manage [process] using [paper / Excel / WhatsApp / existing software], and the slow part is [problem].",
  "emailSubject": "Software for our business",
  "replyPromise": "Replies within one business day. You speak with the founder who scopes and builds the work."
}
```

- [ ] **Step 7: Rewrite `src/styles/global.css`**

```css
@import '@fontsource-variable/familjen-grotesk';
@import '@fontsource-variable/newsreader/wght-italic.css';

:root {
  --brand: #125b63;
  --accent: #f27c64;
  --paper: #ffffff;
  --ink: #202b30;
  --muted: #4e6266;
  --surface: #eaf1f1;
  --line: #d3e3e5;
  --dot: clamp(18px, 2.4vmin, 30px);
  --sans: 'Familjen Grotesk Variable', system-ui, sans-serif;
  --serif: 'Newsreader Variable', Georgia, serif;
  --wrap: 1180px;
  --gutter: clamp(20px, 4vw, 48px);
  --section: clamp(72px, 12vh, 140px);
}

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--paper); color: var(--ink); font: 400 17px/1.5 var(--sans); }
@media (min-width: 768px) { body { font-size: 18px; } }
img, svg { display: block; max-width: 100%; height: auto; }
h1, h2, h3, p, ul { margin: 0; }
a { color: inherit; }
:focus-visible { outline: 3px solid var(--brand); outline-offset: 4px; }
.skip-link { position: fixed; top: 12px; left: 12px; z-index: 100; padding: 12px 18px; background: var(--brand); color: var(--paper); transform: translateY(-160%); }
.skip-link:focus { transform: translateY(0); }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }

.wrap { width: min(var(--wrap), calc(100% - 2 * var(--gutter))); margin-inline: auto; }
.section { padding-block: var(--section); }
h1 { font-weight: 600; font-size: clamp(40px, 6vw, 80px); letter-spacing: -0.03em; line-height: 1.02; }
h2 { font-weight: 600; font-size: clamp(28px, 3.6vw, 44px); letter-spacing: -0.02em; line-height: 1.1; }
h3 { font-weight: 600; font-size: 1.15rem; letter-spacing: -0.01em; }
.eyebrow { font-weight: 500; font-size: 0.9rem; color: var(--brand); }
.lead { font-size: clamp(1.1rem, 1.6vw, 1.35rem); color: var(--muted); max-width: 40ch; }
.muted { color: var(--muted); }
.advaita { font-family: var(--serif); font-style: italic; font-weight: 400; font-size: 1.15em; }

.btn { display: inline-flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 20px; border-radius: 8px; background: var(--brand); color: var(--paper); font-weight: 600; text-decoration: none; white-space: nowrap; }
.btn::after { content: '\2192'; transition: translate 160ms ease; }
.btn:hover::after, .btn:focus-visible::after { translate: 3px 0; }
.btn.on-brand { background: var(--paper); color: var(--brand); }
.btn-quiet { font-weight: 500; color: var(--muted); text-underline-offset: 5px; }
.dot-static { width: var(--dot); height: var(--dot); border-radius: 50%; background: var(--accent); }

/* header */
.site-header { position: fixed; inset: 0 0 auto 0; z-index: 20; display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 64px; padding: 0 var(--gutter); background: color-mix(in srgb, var(--paper) 88%, transparent); backdrop-filter: blur(8px); }
.site-header nav { display: none; align-items: center; gap: clamp(16px, 2.5vw, 32px); }
.site-header nav a:not(.btn) { font-weight: 500; text-decoration: none; color: var(--muted); min-height: 44px; display: inline-flex; align-items: center; }
.site-header nav a[aria-current="page"] { color: var(--brand); text-decoration: underline; text-decoration-color: var(--accent); text-decoration-thickness: 2px; text-underline-offset: 6px; }
.site-header .btn { min-height: 44px; }
@media (min-width: 768px) { .site-header nav { display: flex; } .site-header > .btn { display: none; } }
main { padding-top: 64px; }

/* wordmark */
.brand { text-decoration: none; color: var(--brand); }
.wordmark { display: inline-flex; flex-direction: column; color: var(--brand); }
.wordmark-name { display: flex; align-items: baseline; font-weight: 600; font-size: 28px; letter-spacing: -0.03em; line-height: 1; }
.wordmark-name .company-mark { width: 32px; height: 32px; align-self: flex-end; margin: 0 -3px -4px -3px; color: var(--brand); }
.wordmark-caption { font-size: 9px; font-weight: 600; letter-spacing: 0.02em; text-align: right; line-height: 1; }

/* footer */
.site-footer { border-top: 1px solid var(--line); padding-block: 40px; color: var(--muted); font-size: 0.92rem; }
.site-footer .wrap { display: grid; gap: 20px; }
.site-footer nav { display: flex; gap: 20px; }
.site-footer nav a { text-decoration: none; font-weight: 500; }
@media (min-width: 768px) { .site-footer .wrap { grid-template-columns: 1fr auto; align-items: end; } }
```

- [ ] **Step 8: Rewrite `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import Wordmark from '../components/Wordmark.astro';
import contact from '../data/contact.json';

interface Props { title: string; description: string; jsonLd?: object[] }
const { title, description, jsonLd = [] } = Astro.props;

if (!contact.whatsapp && !import.meta.env.ADIVIATH_ALLOW_EMPTY_WHATSAPP) {
  throw new Error('src/data/contact.json: whatsapp is empty. Add the number, or set ADIVIATH_ALLOW_EMPTY_WHATSAPP=1 for a local preview.');
}

const path = Astro.url.pathname;
const canonical = new URL(path === '/' ? '/' : path.replace(/\/$/, ''), Astro.site).href;
const socialImage = new URL('/brand/social-card.png', Astro.site).href;
const organizationId = new URL('/#organization', Astro.site).href;
const graph = [
  { '@type': 'Organization', '@id': organizationId, name: 'Adiviath Technologies Private Limited', alternateName: 'Adiviath', url: Astro.site?.href, logo: new URL('/brand/symbol-flat.svg', Astro.site).href, email: contact.email, sameAs: ['https://pharmulo.com'], description: 'Software company registered in India. Builds and runs its own products and builds custom systems for specific businesses.' },
  { '@type': 'WebSite', '@id': new URL('/#website', Astro.site).href, url: Astro.site?.href, name: 'Adiviath Technologies', publisher: { '@id': organizationId } },
  { '@type': path === '/about' ? 'AboutPage' : path === '/contact' ? 'ContactPage' : 'WebPage', '@id': canonical, url: canonical, name: title, description, isPartOf: { '@id': new URL('/#website', Astro.site).href } },
  ...jsonLd,
];
const links = [
  { href: '/products', label: 'Work' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];
const wa = contact.whatsapp ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(contact.whatsappMessage)}` : `mailto:${contact.email}?subject=${encodeURIComponent(contact.emailSubject)}`;
const year = new Date().getFullYear();
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <meta name="theme-color" content="#ffffff" />
    <link rel="canonical" href={canonical} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Adiviath Technologies" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={socialImage} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Adiviath Technologies. Software built around the way your business works." />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={socialImage} />
    <script type="application/ld+json" set:html={JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header class="site-header">
      <a class="brand" href="/" aria-label="Adiviath Technologies home"><Wordmark /></a>
      <nav aria-label="Main navigation">
        {links.map(({ href, label }) => <a href={href} aria-current={path === href ? 'page' : undefined}>{label}</a>)}
        <a class="btn" href={wa}>Talk to the founder</a>
      </nav>
      <a class="btn" href={wa}>Talk to the founder</a>
    </header>
    <main id="main-content" tabindex="-1"><slot /></main>
    <footer class="site-footer">
      <div class="wrap">
        <div>
          <Wordmark />
          <p>Adiviath Technologies Private Limited. Registered in India.</p>
          <p><a href={`mailto:${contact.email}`}>{contact.email}</a></p>
        </div>
        <nav aria-label="Footer navigation">
          {links.map(({ href, label }) => <a href={href}>{label}</a>)}
        </nav>
        <p>© {year} Adiviath Technologies Private Limited</p>
      </div>
    </footer>
  </body>
</html>
```

- [ ] **Step 9: Stub the four pages so the build passes**

Replace the body of each page in `src/pages/` with a minimal `BaseLayout` and a single `<section class="section wrap"><h1>…</h1></section>` using these titles: Home "Software built around the way your business works.", Work "Work", About "About Adiviath", Contact "Show us the work that is slowing you down.". Keep each page's `title` under 60 characters and `description` under 155. The real content comes in Tasks 2 to 6.

- [ ] **Step 10: Build and run the check**

Run: `ADIVIATH_ALLOW_EMPTY_WHATSAPP=1 npm run verify`
Expected: build succeeds; `check-site: 4 pages OK`.

- [ ] **Step 11: Verify the shell in the browser**

Start the dev server with `preview_start {name: "adiviath"}` (set `ADIVIATH_ALLOW_EMPTY_WHATSAPP=1` in `.claude/launch.json` env for the dev config). In your own tab, screenshot `/` at 1280x800 and 390x844. Expected: fixed header with wordmark, three links and a petrol button on desktop; wordmark and button only on mobile; footer with legal line and links; console clean; fonts render as Familjen Grotesk (check `getComputedStyle(document.body).fontFamily`).

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "Foundation for The Dot redesign: tokens, fonts, layout shell, check script"
```

---

### Task 2: Talk component and Contact page

**Files:**
- Create: `src/components/Talk.astro`, `src/components/DotStage.astro`
- Rewrite: `src/pages/contact.astro`
- Modify: `src/styles/global.css` (append Talk and DotStage styles)

**Interfaces:**
- Consumes: `contact.json`, `.btn`, `.btn-quiet`, tokens.
- Produces: `<Talk />` with optional prop `variant?: 'light' | 'brand'` (default light); `<DotStage>` with named slots `n`, `e`, `s`, `w` placed around a static dot.

- [ ] **Step 1: Write `src/components/Talk.astro`**

```astro
---
import contact from '../data/contact.json';
interface Props { variant?: 'light' | 'brand' }
const { variant = 'light' } = Astro.props;
const wa = contact.whatsapp ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(contact.whatsappMessage)}` : null;
const mail = `mailto:${contact.email}?subject=${encodeURIComponent(contact.emailSubject)}`;
---

<section class:list={['talk', variant]} aria-labelledby="talk-heading">
  <div class="talk-main">
    <h2 id="talk-heading">Show us the work that is slowing you down.</h2>
    <p>Bring the forms, spreadsheets, registers or WhatsApp threads. You do not need a technical brief. Tell us what happens today and where it gets stuck.</p>
    <div class="talk-actions">
      <a class:list={['btn', { 'on-brand': variant === 'brand' }]} href={wa ?? mail}>Talk to the founder</a>
      <a class="btn-quiet" href={mail}>Prefer email? Write to {contact.email}</a>
    </div>
    <p class="talk-trust">{contact.replyPromise}</p>
  </div>
  <aside class="talk-next">
    <h3>What happens next</h3>
    <p>Send two lines or a voice note about the work that is slow. The founder replies within one business day. If it looks like a fit, you have a 30-minute call to map the current workflow. Then you receive a short written scope, an indicative timeline and a clear next step. No sales hand-off and no obligation.</p>
    <p class="talk-proof">One live product. One custom system in production. One founder from first call to launch.</p>
  </aside>
</section>
```

- [ ] **Step 2: Write `src/components/DotStage.astro`**

```astro
---
interface Props { label?: string }
const { label } = Astro.props;
---

<div class="dot-stage" role="group" aria-label={label}>
  <span class="dot-static" aria-hidden="true"></span>
  <div class="dot-n"><slot name="n" /></div>
  <div class="dot-e"><slot name="e" /></div>
  <div class="dot-s"><slot name="s" /></div>
  <div class="dot-w"><slot name="w" /></div>
</div>
```

- [ ] **Step 3: Append styles to `src/styles/global.css`**

```css
/* Talk block */
.talk { display: grid; gap: 40px; padding: var(--section) var(--gutter); }
.talk.light { background: var(--surface); border-radius: 20px; }
.talk.brand { background: var(--brand); color: var(--paper); }
.talk.brand .btn-quiet, .talk.brand .talk-trust, .talk.brand .talk-next { color: color-mix(in srgb, var(--paper) 82%, transparent); }
.talk-main { display: grid; gap: 20px; align-content: start; }
.talk-main p { max-width: 46ch; }
.talk-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 24px; margin-top: 8px; }
.talk-trust { font-size: 0.95rem; color: var(--muted); }
.talk-next { display: grid; gap: 12px; align-content: start; font-size: 0.98rem; }
.talk-next h3 { font-size: 0.9rem; letter-spacing: 0.04em; text-transform: uppercase; }
.talk-proof { font-weight: 500; }
@media (min-width: 900px) { .talk { grid-template-columns: 1.2fr 0.8fr; gap: 64px; } }

/* Dot stage for inner pages */
.dot-stage { position: relative; display: grid; grid-template-columns: 1fr auto 1fr; grid-template-rows: auto auto auto; gap: 24px; align-items: center; justify-items: center; }
.dot-stage .dot-static { grid-area: 2 / 2; }
.dot-n { grid-area: 1 / 1 / 2 / 4; }
.dot-s { grid-area: 3 / 1 / 4 / 4; }
.dot-w { grid-area: 2 / 1; justify-self: end; }
.dot-e { grid-area: 2 / 3; justify-self: start; }
.dot-slot { width: min(100%, 220px); min-height: 120px; border: 1px dashed var(--line); border-radius: 12px; display: grid; place-items: end start; padding: 12px; font-size: 0.9rem; color: var(--muted); }
.dot-slot.you { border-color: var(--brand); color: var(--ink); font-weight: 600; }
@media (max-width: 640px) { .dot-stage { grid-template-columns: 1fr; } .dot-n, .dot-s, .dot-w, .dot-e { grid-column: 1; grid-row: auto; justify-self: center; } .dot-stage .dot-static { grid-area: auto; } }
```

- [ ] **Step 4: Write `src/pages/contact.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Talk from '../components/Talk.astro';
import DotStage from '../components/DotStage.astro';
---

<BaseLayout title="Contact Adiviath Technologies" description="Tell the founder what is slow in your business. Replies within one business day on WhatsApp or email.">
  <section class="section wrap contact-hero">
    <h1>Show us the work that is slowing you down.</h1>
    <DotStage label="What your work might need">
      <div slot="n" class="dot-slot">a form someone fills twice</div>
      <div slot="e" class="dot-slot">a register kept by hand</div>
      <div slot="s" class="dot-slot">a report nobody can pull</div>
      <div slot="w" class="dot-slot you">your work</div>
    </DotStage>
  </section>
  <section class="wrap" style="padding-bottom: var(--section)">
    <Talk />
    <p class="muted" style="margin-top: 24px">Pharmulo enquiries: <a href="https://pharmulo.com" target="_blank" rel="noreferrer">pharmulo.com</a></p>
  </section>
</BaseLayout>
```

Note: the `Talk` component renders its own `h2`; the page `h1` is the one above. The check script enforces one h1.

- [ ] **Step 5: Build, check, verify**

Run: `ADIVIATH_ALLOW_EMPTY_WHATSAPP=1 npm run verify`. Expected: `check-site: 4 pages OK`.
Browser: `/contact` at 1280x800 and 390x844. Expected: h1, the four dashed slots around a coral dot (single column on mobile), the Talk block with button, email link, trust line and "What happens next"; with the number empty the button falls back to the mailto link; console clean; no horizontal scroll (`document.documentElement.scrollWidth === innerWidth`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add Talk conversion block, DotStage, and Contact page"
```

---

### Task 3: Home scenes

**Files:**
- Create: `src/styles/home.css`
- Rewrite: `src/pages/index.astro`

**Interfaces:**
- Consumes: `Logo.astro` (with a prop-less mark; scenes 1 and 5 hide its dot path via CSS `.mark-only .company-mark path:last-child { display: none }`), `Talk.astro` variant `brand`, tokens.
- Produces: the five-scene structure with class names `.act.act-1` … `.act-5`, `.stage`, `.item`, `.fixed-dot`, `.progress`, `.cue`.

The source of truth for the scene mechanics is the approved prototype, committed as `docs/superpowers/specs/2026-09-17-the-dot-prototype.html`. Port it; do not redesign it.

- [ ] **Step 1: Extract the prototype CSS into `src/styles/home.css`**

Open `docs/superpowers/specs/2026-09-17-the-dot-prototype.html`. Copy everything between `<style>` and `</style>` into `src/styles/home.css`, then apply these edits:

1. Delete the `@import url('https://fonts.googleapis.com/…')` line and any `font-family` declarations; fonts come from global.css.
2. Delete the header, footer and wordmark rules (the layout provides them).
3. Change the act heights to: `.act-1 { height: 160svh } .act-2, .act-3 { height: 180svh } .act-4 { height: 160svh } .act-5 { height: 100svh }`. Re-tune every `--ra`/`--rb` so that each scene still forms in the first 30% of its range, holds, and dissolves in the last 20%.
4. Replace the dot size rule with `--dot: clamp(18px, 2.4vmin, 30px)` (already in `:root`); keep `--mark-h: calc(var(--dot) * 5.4286)` and `--mark-w: calc(var(--mark-h) * 1.026316)` and the `-44.62% / -55.53%` offset.
5. Add the progress line and the scroll cue:

```css
.progress { position: fixed; top: 0; left: 0; height: 2px; width: 100%; background: var(--brand); transform-origin: left; scale: 0 1; z-index: 30; }
.cue { position: fixed; left: 50%; bottom: 24px; translate: -50% 0; display: grid; justify-items: center; gap: 8px; font-size: 0.85rem; color: var(--muted); }
.cue i { display: block; width: 1px; height: 36px; background: var(--brand); transform-origin: top; animation: cue-grow 2s ease-in-out infinite; }
@keyframes cue-grow { 0% { scale: 1 0 } 60% { scale: 1 1 } 100% { scale: 1 1; opacity: 0 } }
@supports (animation-timeline: scroll()) {
  @media (prefers-reduced-motion: no-preference) {
    .progress { animation: grow linear both; animation-timeline: scroll(root); }
    @keyframes grow { to { scale: 1 1 } }
    .cue { animation: cue-out linear both; animation-timeline: scroll(root); animation-range: 0 10vh; }
    @keyframes cue-out { to { opacity: 0; visibility: hidden } }
  }
}
@media (prefers-reduced-motion: reduce) { .cue i { animation: none; } }
```

6. Scene 1 layout changes to the sales-first opening: the stage is a two-column grid on desktop (`.opening` text left, the dot centred in the right column, so the fixed dot at the viewport centre sits at the column boundary; offset `.opening` with `padding-right: calc(50vw - var(--gutter))` on desktop) and a single column with the dot above the text on mobile. Keep the mark bloom exactly as ported (clip-path circle at 44.62% 55.53%). The h1 must not be animated in from opacity 0: it is visible at scroll 0 and eases 24px left while the mark blooms.

- [ ] **Step 2: Write `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Logo from '../components/Logo.astro';
import Talk from '../components/Talk.astro';
import contact from '../data/contact.json';
import '../styles/home.css';
const wa = contact.whatsapp ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(contact.whatsappMessage)}` : `mailto:${contact.email}?subject=${encodeURIComponent(contact.emailSubject)}`;
---

<BaseLayout title="Adiviath Technologies | Software built around your work" description="Adiviath builds and runs software for Indian businesses: Pharmulo for pharma wholesalers and custom systems like freight billing for Naveen Logistics.">
  <div class="progress" aria-hidden="true"></div>
  <span class="fixed-dot" aria-hidden="true"></span>

  <section class="act act-1" aria-label="Introduction">
    <div class="stage">
      <div class="opening">
        <p class="eyebrow">Custom software for Indian businesses</p>
        <h1>Software built around the way your business works.</h1>
        <p class="lead">Adiviath builds and runs systems for operations where forms, spreadsheets and WhatsApp no longer keep up.</p>
        <div class="talk-actions">
          <a class="btn" href={wa}>Talk to the founder</a>
          <a class="btn-quiet" href={`mailto:${contact.email}?subject=${encodeURIComponent(contact.emailSubject)}`}>Prefer email? Write to {contact.email}</a>
        </div>
        <ul class="proof" aria-label="Proof">
          <li><strong>Pharmulo</strong>, live, built and operated by Adiviath</li>
          <li><strong>Naveen Logistics</strong>, custom system in production</li>
        </ul>
      </div>
      <div class="mark-only item" style="--ra:10%; --rb:60%"><Logo /></div>
      <p class="brandline item" style="--ra:30%; --rb:70%">Your work. Your way. Your software.</p>
    </div>
    <p class="cue" aria-hidden="true">Scroll<i></i></p>
  </section>

  <section class="act act-2" aria-labelledby="pharmulo-h">
    <div class="stage">
      <!-- five crops of /pharmulo-home.webp as in the prototype, each: -->
      <div class="frame item" style="--x:-9; --y:-6; --ra:8%; --rb:80%"><span class="crop" style="background-position: 0% 0%"></span></div>
      <!-- …repeat for the other four crops with the prototype's --x/--y values… -->
      <div class="caption item" style="--ra:20%; --rb:80%">
        <h2 id="pharmulo-h">Pharmulo. Built and operated by Adiviath. Live.</h2>
        <p>Wholesalers put their catalogue online; retailers order from any phone. Find stock, add quantity, send order.</p>
        <a class="btn-quiet" href="https://pharmulo.com" target="_blank" rel="noreferrer">See the work</a>
      </div>
    </div>
  </section>

  <section class="act act-3" aria-labelledby="naveen-h">
    <div class="stage">
      <h2 id="naveen-h" class="item" style="--y:-9; --ra:8%; --rb:80%">How the Naveen Logistics system connects the paperwork.</h2>
      <ol class="route" aria-label="Workflow">
        <li class="node item" style="--x:-8; --y:-3; --ra:12%; --rb:80%">Lorry receipt</li>
        <li class="node item" style="--x:8; --y:-3; --ra:18%; --rb:80%">Freight bill</li>
        <li class="node item" style="--x:-8; --y:4; --ra:24%; --rb:80%">Payment</li>
        <li class="node item" style="--x:8; --y:4; --ra:30%; --rb:80%">Settled account</li>
      </ol>
      <svg class="wire item" viewBox="0 0 800 400" aria-hidden="true" style="--ra:12%; --rb:80%"><path d="M120 150 H400 V150 H680 M680 150 V250 H400 V250 H120" pathLength="100" /></svg>
      <div class="caption item" style="--y:9; --ra:34%; --rb:80%">
        <p>Custom software for Naveen Logistics. In production.</p>
        <a class="btn-quiet" href="https://www.naveenlogistics.com/" target="_blank" rel="noreferrer">See the work</a>
      </div>
    </div>
  </section>

  <section class="act act-4" aria-label="Talk to the founder">
    <div class="stage"><div class="item talk-wrap" style="--ra:20%; --rb:85%"><Talk variant="brand" /></div></div>
  </section>

  <section class="act act-5" aria-label="Closing">
    <div class="stage">
      <div class="mark-only item" style="--ra:8%; --rb:40%"><Logo /></div>
      <div class="closing item" style="--ra:20%; --rb:50%">
        <a class="btn" href={wa}>Talk to the founder</a>
        <p>Adiviath Technologies Private Limited. Registered in India.</p>
        <nav aria-label="Pages"><a href="/products">Work</a><a href="/about">About</a><a href="/contact">Contact</a></nav>
      </div>
    </div>
  </section>
</BaseLayout>
```

Fill the "repeat for the other four crops" comment with the four remaining `.frame` elements copied from the prototype with their exact `--x`, `--y` and `background-position` values. The brand line "Your work. Your way. Your software." is final (spec section 1).

Note: `Talk` renders an `h2` inside scene 4, so this page has exactly one `h1` (scene 1) and several `h2`. Scene 4's `Talk` is the only Talk on Home.

- [ ] **Step 3: Scene 4 petrol circle**

In `home.css`, give `.act-4 .stage` a pseudo-element that expands from the dot:

```css
.act-4 .stage::before { content: ''; position: absolute; left: 50%; top: 50%; width: 1px; height: 1px; border-radius: 50%; background: var(--brand); translate: -50% -50%; scale: 0; }
@supports (animation-timeline: scroll()) { @media (prefers-reduced-motion: no-preference) {
  .act-4 .stage::before { animation: circle linear both; animation-timeline: --s; animation-range: cover 5% cover 95%; }
  @keyframes circle { 0% { scale: 0 } 18% { scale: 3000 } 82% { scale: 3000 } 100% { scale: 0 } }
  .act-4 .talk-wrap { --ra: 20%; --rb: 82%; }
} }
.act-4 .stage { background: transparent; }
@supports not (animation-timeline: scroll()) { .act-4 .stage { background: var(--brand); } }
```

The content's `--ra` (20%) is after the circle reaches full size (18%), so text never sits on a half-covered background. Under reduced motion the fallback paints the scene petrol.

- [ ] **Step 4: Build, check, verify the matrix subset**

Run: `ADIVIATH_ALLOW_EMPTY_WHATSAPP=1 npm run verify`. Expected: 4 pages OK.
Browser, own tab, at 1280x800 then 390x844 then 1280x600:
- scroll 0: eyebrow, h1, lead, button, proof row, cue visible; only the dot, no mark.
- scroll to 40% of act 1: mark bloomed with its counter on the dot (measure: `mark.x + width*0.4462` equals the dot centre within 1px).
- act 2 held: five crops arranged, caption readable.
- act 3 held: four nodes, wire, caption.
- act 4 held: full petrol, Talk block readable, white button.
- end: mark, button, legal line, links.
- console clean; `scrollWidth === innerWidth` at 390.
- Fallback: run `document.querySelector('style, link[rel=stylesheet]')` and delete the `@supports` rule via `for (const s of document.styleSheets) for (let i = s.cssRules.length - 1; i >= 0; i--) if (s.cssRules[i].cssText.startsWith('@supports (animation-timeline')) s.deleteRule(i)`; expected: five stacked scenes, all content visible, petrol scene painted.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Home: The Dot scenes with sales-first opening, cue and progress line"
```

---

### Task 4: Home craft upgrades: Pharmulo assembly, Naveen route, proof hover

**Files:**
- Modify: `src/styles/home.css`, `src/pages/index.astro`

**Interfaces:**
- Consumes: `.frame`, `.crop`, `.node`, `.wire`, `.route` from Task 3.
- Produces: the finished Home motion.

- [ ] **Step 1: Pharmulo assembly**

Each `.frame` gets a second keyframe stage. In `home.css`:

```css
.act-2 .frame { --fx: 0; --fy: 0; }
@supports (animation-timeline: scroll()) { @media (prefers-reduced-motion: no-preference) {
  .act-2 .frame { animation-name: form, assemble; animation-timeline: --s, --s; animation-range: cover var(--ra) cover var(--rb), cover 38% cover 52%; animation-fill-mode: both, both; }
  @keyframes assemble { to { translate: calc(var(--fx) * var(--dot)) calc(var(--fy) * var(--dot)); } }
  .act-2 .steps { animation: form linear both; animation-timeline: --s; animation-range: cover 52% cover 80%; }
} }
```

In `index.astro` give each frame `--fx`/`--fy` values that move it from its scattered position to a 2x3 grid around the dot so the five crops read as one storefront (top row: logo, headline; middle: buttons; bottom: two cards), and add after the frames:

```astro
<ol class="steps item" aria-label="How ordering works"><li>Find stock</li><li>Add quantity</li><li>Send order</li></ol>
```

Style `.steps` as a horizontal list under the composition with petrol numerals.

- [ ] **Step 2: Naveen route**

Replace the two crossing hairlines with the one route drawn through the nodes, in reading order, and sharpen nodes as the route reaches them:

```css
.act-3 .wire path { fill: none; stroke: var(--brand); stroke-width: 2; stroke-dasharray: 100 120; stroke-dashoffset: 110; }
.act-3 .node { opacity: 0.55; transition: opacity 200ms; }
@supports (animation-timeline: scroll()) { @media (prefers-reduced-motion: no-preference) {
  .act-3 .wire path { animation: draw linear both; animation-timeline: --s; animation-range: cover 14% cover 60%; }
  @keyframes draw { to { stroke-dashoffset: 0 } }
  .act-3 .node:nth-child(1) { animation: form, sharpen; animation-range: cover 12% cover 80%, cover 16% cover 24%; }
  .act-3 .node:nth-child(2) { animation: form, sharpen; animation-range: cover 18% cover 80%, cover 28% cover 36%; }
  .act-3 .node:nth-child(3) { animation: form, sharpen; animation-range: cover 24% cover 80%, cover 40% cover 48%; }
  .act-3 .node:nth-child(4) { animation: form, sharpen; animation-range: cover 30% cover 80%, cover 52% cover 60%; }
  .act-3 .node { animation-timeline: --s, --s; animation-fill-mode: both, both; }
  @keyframes sharpen { to { opacity: 1 } }
} }
@supports not (animation-timeline: scroll()) { .act-3 .wire path { stroke-dashoffset: 0 } .act-3 .node { opacity: 1 } }
```

The `path` `d` must pass through the four node centres in order (receipt, bill, payment, settled); compute the centres from the `--x/--y` offsets times the dot size at 1280x800 and set the viewBox so the wire scales with the stage.

- [ ] **Step 3: Proof hover**

```css
.act-2 .stage:has(.caption a:hover, .caption a:focus-visible) .frame,
.act-3 .stage:has(.caption a:hover, .caption a:focus-visible) .node { opacity: 0.35; }
.act-2 .stage:has(.caption a:hover, .caption a:focus-visible) .caption,
.act-3 .stage:has(.caption a:hover, .caption a:focus-visible) .caption { translate: 0 -4px; }
.caption, .frame, .node { transition: opacity 200ms ease, translate 200ms ease; }
```

- [ ] **Step 4: Build, check, verify**

Run `ADIVIATH_ALLOW_EMPTY_WHATSAPP=1 npm run verify`. Browser at 1280x800: scroll act 2 slowly and screenshot at 30%, 45%, 60% of the act: scattered, assembling, assembled with the three steps visible. Act 3 at 20%, 40%, 60%: route reaching node 1, node 3, all four. Hover the "See the work" link in act 2: frames dim. Repeat the 390 check for overflow. For the static fallback, run the `@supports` deletion from Task 3 Step 4 and confirm all four nodes are fully opaque and the wire is fully drawn.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Home: Pharmulo assembly, Naveen route, proof hover"
```

---

### Task 5: Work page

**Files:**
- Rewrite: `src/pages/products.astro`
- Create: `public/naveen-logistics-logo.webp` (via a one-off Node command using sharp)
- Modify: `src/styles/global.css` (append `.case` styles)

**Interfaces:**
- Consumes: `DotStage`, `Talk`, tokens.
- Produces: JSON-LD `SoftwareApplication` passed through `BaseLayout`'s `jsonLd` prop.

- [ ] **Step 1: Make the webp**

```bash
node -e "require('sharp')('public/naveen-logistics-logo.png').resize(640).webp({quality:82}).toFile('public/naveen-logistics-logo.webp').then(i=>console.log(i.size))"
git rm public/naveen-logistics-logo.png
```

Expected output size under 25000 bytes.

- [ ] **Step 2: Write `src/pages/products.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import DotStage from '../components/DotStage.astro';
import Talk from '../components/Talk.astro';
const pharmulo = { '@type': 'SoftwareApplication', '@id': 'https://pharmulo.com/#software', name: 'Pharmulo', url: 'https://pharmulo.com', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', description: 'Online ordering storefront for pharmaceutical wholesalers and their retailers.', publisher: { '@id': new URL('/#organization', Astro.site).href } };
---

<BaseLayout title="Work | Adiviath Technologies" description="Pharmulo, our live ordering product for pharma wholesalers, and the custom freight billing system we built for Naveen Logistics." jsonLd={[pharmulo]}>
  <section class="section wrap">
    <p class="eyebrow">Work</p>
    <h1>Two kinds of work. One way of building.</h1>
    <p class="lead">Products we run ourselves, and systems we build for one business at a time. Each starts at a specific need.</p>
  </section>

  <article class="case wrap" id="pharmulo" aria-labelledby="case-pharmulo">
    <DotStage label="Pharmulo">
      <div slot="w" class="case-need"><p class="eyebrow">The need</p><p>Wholesalers wanted retailers to order without phone calls and price lists.</p></div>
      <figure slot="e" class="case-shot"><img src="/pharmulo-home.webp" alt="Pharmulo storefront home page showing the catalogue and ordering steps" width="1600" height="1000" loading="lazy" /></figure>
      <div slot="s" class="case-body">
        <h2 id="case-pharmulo">Pharmulo. Built and operated by Adiviath. Live.</h2>
        <dl>
          <dt>What we built</dt><dd>An online storefront that sits on the wholesale system they already run.</dd>
          <dt>What changed</dt><dd>Retailers browse live stock and order from any phone; the order flows back as a bill.</dd>
        </dl>
        <a class="btn-quiet" href="https://pharmulo.com" target="_blank" rel="noreferrer">See pharmulo.com</a>
      </div>
    </DotStage>
  </article>

  <article class="case wrap" id="naveen-logistics" aria-labelledby="case-naveen">
    <DotStage label="Naveen Logistics">
      <div slot="w" class="case-need"><p class="eyebrow">The need</p><p>Lorry receipts, freight bills and payments never lined up.</p></div>
      <figure slot="e" class="case-map" aria-label="How the system connects the paperwork">
        <ol class="route-static"><li>Lorry receipt</li><li>Freight bill</li><li>Payment</li><li>Settled account</li></ol>
        <img src="/naveen-logistics-logo.webp" alt="Naveen Logistics logo" width="640" height="640" loading="lazy" />
      </figure>
      <div slot="s" class="case-body">
        <h2 id="case-naveen">Custom software for Naveen Logistics. In production.</h2>
        <dl>
          <dt>What we built</dt><dd>One system from receipt to settled bill, with a customer portal.</dd>
          <dt>What changed</dt><dd>Documents connect, payments allocate to bills, customers see their own statement.</dd>
        </dl>
        <a class="btn-quiet" href="https://www.naveenlogistics.com/" target="_blank" rel="noreferrer">See naveenlogistics.com</a>
      </div>
    </DotStage>
  </article>

  <section class="wrap" style="padding-bottom: var(--section)"><Talk /></section>
</BaseLayout>
```

- [ ] **Step 3: Append `.case` styles**

```css
.case { padding-block: var(--section); border-top: 1px solid var(--line); }
.case-need p:last-child { max-width: 24ch; font-size: 1.15rem; font-weight: 500; }
.case-shot { margin: 0; width: min(100%, 520px); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.case-map { margin: 0; display: grid; gap: 16px; width: min(100%, 420px); padding: 20px; background: var(--surface); border-radius: 12px; }
.case-map img { width: 64px; height: 64px; }
.route-static { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; counter-reset: step; }
.route-static li { position: relative; padding: 10px 12px 10px 40px; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; font-weight: 500; }
.route-static li::before { counter-increment: step; content: counter(step); position: absolute; left: 12px; top: 10px; width: 20px; height: 20px; border-radius: 50%; background: var(--brand); color: var(--paper); font-size: 0.75rem; display: grid; place-items: center; }
.case-body { display: grid; gap: 16px; max-width: 60ch; }
.case-body dl { display: grid; gap: 4px 16px; grid-template-columns: max-content 1fr; }
.case-body dt { font-weight: 600; }
.case-body dd { margin: 0; color: var(--muted); }
@media (max-width: 640px) { .case-body dl { grid-template-columns: 1fr; } }
```

- [ ] **Step 4: Build, check, verify**

Run `ADIVIATH_ALLOW_EMPTY_WHATSAPP=1 npm run verify`. Browser `/products` at 1280x800 and 390x844: two case studies each with a dot, need on the left, evidence on the right, body below; single column on mobile; the JSON-LD contains `SoftwareApplication` (check `JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph'].some(n => n['@type'] === 'SoftwareApplication')`); console clean.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Work page: two case studies around the dot"
```

---

### Task 6: About page with FAQ

**Files:**
- Rewrite: `src/pages/about.astro`
- Modify: `src/styles/global.css` (append `.about-*` and `.faq` styles)

**Interfaces:**
- Consumes: `Logo`, `Talk`, `.advaita`.
- Produces: JSON-LD `FAQPage` via `jsonLd` prop.

- [ ] **Step 1: Write `src/pages/about.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Logo from '../components/Logo.astro';
import Talk from '../components/Talk.astro';
const faqs = [
  ['What does Adiviath mean?', 'Adiviath is the founder\'s spelling of Advaita, a Sanskrit word for oneness. It stands for software that is one with the work it serves.'],
  ['What does Adiviath build?', 'Adiviath builds and runs its own products, such as Pharmulo for pharmaceutical wholesalers, and builds custom systems for specific businesses, such as freight billing for Naveen Logistics.'],
  ['Where is Adiviath registered?', 'Adiviath Technologies Private Limited is registered with the Ministry of Corporate Affairs, India.'],
];
const faqLd = { '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
---

<BaseLayout title="About Adiviath Technologies" description="Adiviath Technologies Private Limited is a founder-led software company registered in India. It builds and runs products and custom business systems." jsonLd={[faqLd]}>
  <section class="section wrap about-intro">
    <p class="eyebrow">About</p>
    <h1>A software company built around specific needs.</h1>
    <p class="lead">Adiviath Technologies Private Limited is a software company registered in India. It builds and runs its own products and builds custom systems for specific businesses.</p>
  </section>

  <section class="wrap about-name">
    <div class="about-mark"><Logo /></div>
    <div>
      <p class="advaita">Adiviath is the founder's spelling of Advaita, a Sanskrit word for oneness.</p>
      <p>Your work. Your way. Your software. The dot in our mark is the need. The form is shaped around it.</p>
    </div>
  </section>

  <section class="section wrap about-how">
    <h2>How we work</h2>
    <ol class="steps-list">
      <li><h3>Understand the workflow</h3><p>You show us the forms, registers and threads as they are. We map what happens today.</p></li>
      <li><h3>Agree the scope</h3><p>You get a short written scope, an indicative timeline and a price. Nothing starts until it is clear.</p></li>
      <li><h3>Build and launch</h3><p>We build in the open, launch with your team, and stay on for what comes after.</p></li>
    </ol>
  </section>

  <section class="wrap about-founder">
    <h2>Founder-led</h2>
    <p>The person you brief is the person who scopes and builds the work, and who answers within one business day.</p>
  </section>

  <section class="section wrap about-facts">
    <h2>Company</h2>
    <dl>
      <dt>Legal name</dt><dd>Adiviath Technologies Private Limited</dd>
      <dt>Registration</dt><dd>Registered with the Ministry of Corporate Affairs, India</dd>
      <dt>Email</dt><dd><a href="mailto:hello@adiviath.com">hello@adiviath.com</a></dd>
    </dl>
  </section>

  <section class="wrap faq">
    <h2>Questions</h2>
    {faqs.map(([q, a]) => <details><summary>{q}</summary><p>{a}</p></details>)}
  </section>

  <section class="wrap" style="padding-block: var(--section)"><Talk /></section>
</BaseLayout>
```

Add CIN and city to the facts list when supplied (spec section 10).

- [ ] **Step 2: Append styles**

```css
.about-name { display: grid; gap: 32px; align-items: center; padding-block: var(--section); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.about-mark .company-mark { width: min(60vw, 240px); color: var(--brand); }
.about-name p + p { margin-top: 16px; max-width: 48ch; }
@media (min-width: 768px) { .about-name { grid-template-columns: auto 1fr; gap: 64px; } }
.steps-list { margin: 24px 0 0; padding: 0; list-style: none; display: grid; gap: 24px; counter-reset: s; }
.steps-list li { display: grid; gap: 8px; padding-top: 16px; border-top: 1px solid var(--line); }
.steps-list h3::before { counter-increment: s; content: counter(s, decimal-leading-zero) '  '; color: var(--brand); }
@media (min-width: 768px) { .steps-list { grid-template-columns: repeat(3, 1fr); } }
.about-founder p { max-width: 48ch; }
.about-facts dl { display: grid; gap: 8px 24px; grid-template-columns: max-content 1fr; margin-top: 16px; }
.about-facts dd { margin: 0; }
.faq details { border-top: 1px solid var(--line); padding: 16px 0; }
.faq summary { cursor: pointer; font-weight: 600; min-height: 44px; display: flex; align-items: center; }
.faq p { margin-top: 8px; max-width: 60ch; color: var(--muted); }
```

- [ ] **Step 3: Build, check, verify**

Run `ADIVIATH_ALLOW_EMPTY_WHATSAPP=1 npm run verify`. Browser `/about` at 1280x800 and 390x844: sections in order, the mark large in petrol with a coral dot, the FAQ opens and closes with the keyboard, JSON-LD contains `FAQPage`; console clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "About page: company facts, how we work, FAQ with schema"
```

---

### Task 7: SEO and GEO files, social card

**Files:**
- Modify: `public/robots.txt`
- Create: `public/llms.txt`
- Regenerate: `public/brand/social-card.png` via `scripts/finalize-logo.py` if it supports the palette, otherwise a one-off sharp render of a 1200x630 SVG with the mark, the wordmark and the headline on white.

- [ ] **Step 1: `public/robots.txt`**

```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://www.adiviath.com/sitemap.xml
```

- [ ] **Step 2: `public/llms.txt`**

```
# Adiviath Technologies

Adiviath Technologies Private Limited is a founder-led software company registered in India.
It builds and runs its own products and builds custom systems for specific businesses.
Products: Pharmulo (https://pharmulo.com), an online ordering storefront for pharmaceutical wholesalers, live.
Client work: a custom freight billing system for Naveen Logistics (https://www.naveenlogistics.com/), in production.
Contact: hello@adiviath.com. Replies within one business day.

- Home: https://www.adiviath.com/
- Work: https://www.adiviath.com/products
- About: https://www.adiviath.com/about
- Contact: https://www.adiviath.com/contact
```

- [ ] **Step 3: Social card**

Write `scripts/social-card.mjs`:

```js
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
const logo = JSON.parse(readFileSync('src/data/logo-paths.json', 'utf8'));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#ffffff"/>
<g transform="translate(90 150) scale(0.85)"><path d="${logo.mark}" fill="#125b63"/><path d="${logo.dot}" fill="#f27c64"/></g>
<text x="480" y="270" font-family="Helvetica, Arial, sans-serif" font-size="64" font-weight="700" fill="#202b30">Software built around</text>
<text x="480" y="345" font-family="Helvetica, Arial, sans-serif" font-size="64" font-weight="700" fill="#202b30">the way your business works.</text>
<text x="480" y="420" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#4e6266">Adiviath Technologies Private Limited</text>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile('public/brand/social-card.png');
console.log('social-card.png written');
```

Run: `node scripts/social-card.mjs`. Open `public/brand/social-card.png` and confirm the text fits inside the canvas; shorten the font size if it clips.

- [ ] **Step 4: Build, check, commit**

Run `ADIVIATH_ALLOW_EMPTY_WHATSAPP=1 npm run verify`. Confirm `dist/robots.txt` and `dist/llms.txt` exist. Commit:

```bash
git add -A
git commit -m "SEO and GEO: crawler rules, llms.txt, social card in the new palette"
```

---

### Task 8: Full verification and handoff

**Files:** none new.

- [ ] **Step 1: Matrix run**

For each of 390x844, 390x660, 768x1024, 1024x768, 1280x800, 1440x900, 1920x1080, 1280x600 and each of the four pages: screenshot, console clean, `scrollWidth === innerWidth`. On Home also check at each size that the dot stays centred (`getBoundingClientRect()` of `.fixed-dot` is the viewport centre at three scroll positions) and the mark's counter lands on it.

- [ ] **Step 2: Contrast**

For every text node colour and its background in the four pages, compute the contrast ratio (WCAG formula) with a short JS snippet in the console and assert every pair is at least 4.5:1. Fix any failure in `global.css`.

- [ ] **Step 3: Fallback and reduced motion**

Delete the `@supports` rule at runtime as in Task 3 and walk each page. Then reload with the OS reduced-motion setting on (or emulate in the browser's rendering settings if available) and confirm no scene relies on motion to be readable.

- [ ] **Step 4: WhatsApp**

With the real number in `contact.json` (only when the founder says it can be published), build without the env override, open the site on a phone, tap "Talk to the founder", confirm WhatsApp opens with the prefilled message.

- [ ] **Step 5: Final commit and handoff**

```bash
git add -A
git commit -m "Verification pass for The Dot redesign"
```

Report to the founder: the branch name, the list of pages verified with viewport counts, the outstanding open items from spec section 10, and the command to preview: `npm run dev` in the worktree.
