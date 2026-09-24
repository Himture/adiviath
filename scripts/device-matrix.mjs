// Every page in three browser engines at eight viewports: no horizontal overflow, nothing in main past the viewport edge,
// 44 px touch targets (inline links in running text excepted), one visible h1, no console errors, and a full-page
// screenshot of each to /tmp/adiviath-matrix/. On a build with a Turnstile key it also checks, at 360x640 with the
// on-screen keyboard open, that the Home form's Send button can still be reached.
// Usage: node scripts/device-matrix.mjs [chromium,webkit,firefox]   (BASE defaults to http://localhost:4330)
import { chromium, webkit, firefox } from 'playwright';
import { mkdir } from 'node:fs/promises';
import pagesData from '../src/data/pages.json' with { type: 'json' };

// Every listed page, plus an unknown path that must get the 404 page with status 404.
const pages = [...pagesData, { path: '/no-such-page', status: 404 }];

const BASE = process.env.BASE ?? 'http://localhost:4330';
const OUT = process.env.OUT ?? '/tmp/adiviath-matrix';
const engines = { chromium, webkit, firefox };
const names = (process.argv[2] ?? 'chromium,webkit,firefox').split(',');
const viewports = ['360x640', '390x844', '412x915', '768x1024', '1024x768', '1280x800', '1440x900', '1920x1080'];
const slug = (path) => (path === '/' ? 'home' : path.slice(1).replaceAll('/', '-'));
const failures = [];
const fail = (where, what) => failures.push(`${where}: ${what}`);

// Runs in the page. Returns a list of problems.
function audit() {
  const out = [];
  const vw = document.documentElement.clientWidth;
  const doc = document.scrollingElement;
  if (doc.scrollWidth > vw) out.push(`horizontal overflow: scrollWidth ${doc.scrollWidth} > ${vw}`);
  const visible = (el) => {
    if (el.closest('[aria-hidden="true"], .sr-only, [hidden]')) return false;
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const name = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''} "${(el.textContent || el.getAttribute('name') || '').trim().slice(0, 40)}"`;
  for (const el of document.querySelectorAll('main *')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.left < -1 || r.right > vw + 1) { out.push(`off-viewport: ${name(el)} spans ${Math.round(r.left)} to ${Math.round(r.right)} of ${vw}`); break; }
  }
  for (const el of document.querySelectorAll('a, button, summary, input, select, textarea')) {
    if (!visible(el)) continue;
    const s = getComputedStyle(el);
    if (el.tagName === 'A' && s.display === 'inline' && el.parentElement.closest('p, li, dd, figcaption')) continue; // inline link in running text
    const r = el.getBoundingClientRect();
    if (Math.max(r.width, r.height) < 44 - 0.5) out.push(`small target ${Math.round(r.width)}x${Math.round(r.height)}: ${name(el)}`);
  }
  const h1s = [...document.querySelectorAll('h1')].filter(visible).length;
  if (h1s !== 1) out.push(`${h1s} visible h1`);
  return out;
}

// The on-screen keyboard shrinks the visible area to roughly 360x340 on a 360x640 phone. Focus the message box, shrink
// the viewport, then scroll to Send: it must be inside the document and land in view, not under the header or a bar.
async function keyboardCheck(browser, where) {
  const page = await browser.newPage({ viewport: { width: 360, height: 640 }, reducedMotion: 'reduce' });
  await page.goto(BASE + '/');
  const box = page.locator('form[data-lead] textarea[name=message]');
  if (!(await box.count())) { console.log(`${where}: keyboard check skipped, this build has no form (no PUBLIC_TURNSTILE_SITE_KEY)`); await page.close(); return; }
  await box.focus();
  await page.setViewportSize({ width: 360, height: 340 });
  const send = page.locator('form[data-lead] button[type=submit]');
  await send.scrollIntoViewIfNeeded();
  const r = await send.evaluate((b) => {
    const rect = b.getBoundingClientRect(); const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return { bottom: rect.bottom + scrollY, scrollHeight: document.scrollingElement.scrollHeight, inView: rect.top >= 0 && rect.bottom <= innerHeight, onTop: b === top || b.contains(top) };
  });
  if (r.bottom > r.scrollHeight) fail(where, `Send button ends at ${r.bottom}, below scrollHeight ${r.scrollHeight}`);
  if (!r.inView || !r.onTop) fail(where, `Send button not reachable with the keyboard open (inView ${r.inView}, uncovered ${r.onTop})`);
  await page.close();
}

async function runEngine(engineName) {
  const browser = await engines[engineName].launch();
  let checked = 0;
  for (const vp of viewports) {
    const [width, height] = vp.split('x').map(Number);
    const phone = width < 768 && engineName !== 'firefox'; // Firefox has no mobile emulation in Playwright
    const context = await browser.newContext({ viewport: { width, height }, isMobile: phone, hasTouch: phone, reducedMotion: 'reduce' });
    for (const { path, status = 200 } of pages) {
      const where = `${engineName} ${vp} ${path}`;
      const page = await context.newPage();
      const errors = [];
      page.on('console', (m) => {
        if (m.type() !== 'error') return;
        if (status !== 200 && m.location().url === BASE + path) return; // the browser's own note about the expected 404 status
        errors.push(m.text());
      });
      page.on('pageerror', (e) => errors.push(e.message));
      const res = await page.goto(BASE + path, { waitUntil: 'load' });
      if (!res || res.status() !== status) fail(where, `HTTP ${res?.status()}`);
      await page.evaluate(() => document.fonts.ready);
      for (const p of await page.evaluate(audit)) fail(where, p);
      for (const e of errors) fail(where, `console error: ${e}`);
      await page.screenshot({ path: `${OUT}/${engineName}-${vp}-${slug(path)}.png`, fullPage: true });
      await page.close();
      checked++;
    }
    await context.close();
  }
  await keyboardCheck(browser, `${engineName} 360x640 keyboard`);
  await browser.close();
  return checked;
}

await mkdir(OUT, { recursive: true });
const counts = await Promise.all(names.map(runEngine));
const total = counts.reduce((a, b) => a + b, 0);
if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`device-matrix: ${failures.length} failures across ${total} page loads`);
  process.exit(1);
}
console.log(`device-matrix: ${names.length} engines x ${viewports.length} viewports x ${pages.length} pages = ${total} page loads OK; screenshots in ${OUT}`);
