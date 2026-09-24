// CSP smoke test: with the vercel.json headers applied (scripts/serve-static.mjs), accept analytics, open a form page,
// let Turnstile and GA run, and fail on any Content-Security-Policy violation. Needs a build with test keys:
//   PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA PUBLIC_GA_ID=G-TEST123 npx astro build
//   node scripts/serve-static.mjs 4331 & BASE=http://localhost:4331 node scripts/csp-check.mjs
import { chromium, webkit, firefox } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:4331';
let bad = 0;
for (const engine of [chromium, webkit, firefox]) {
  const browser = await engine.launch();
  const page = await browser.newPage();
  const violations = [];
  const hosts = new Set();
  await page.exposeFunction('reportViolation', (v) => violations.push(v));
  await page.addInitScript(() => document.addEventListener('securitypolicyviolation', (e) => window.reportViolation(`${e.violatedDirective} blocked ${e.blockedURI}`)));
  page.on('console', (m) => { if (/content security policy|refused to/i.test(m.text())) violations.push(m.text()); });
  page.on('request', (r) => hosts.add(new URL(r.url()).host));
  await page.goto(BASE + '/');
  if (!(await page.locator('[data-consent] [data-choice=granted]').isVisible())) throw new Error('No consent bar: build with PUBLIC_GA_ID');
  await page.click('[data-consent] [data-choice=granted]');
  await page.goto(BASE + '/contact');
  if (!(await page.locator('form[data-lead]').count())) throw new Error('No form: build with PUBLIC_TURNSTILE_SITE_KEY');
  await page.fill('form[data-lead] [name=name]', 'Test');
  await page.waitForTimeout(6000); // gtag collect and the Turnstile challenge
  const token = await page.evaluate(() => !!window.turnstile?.getResponse()); // the test key passes invisibly and issues a token
  const external = [...hosts].filter((h) => h && !h.startsWith('localhost'));
  console.log(`${engine.name()}: ${violations.length} CSP violations; Turnstile token ${token ? 'issued' : 'missing'}; third-party hosts: ${external.join(', ')}`);
  for (const v of violations) console.log(`  ${v}`);
  bad += violations.length + (token ? 0 : 1);
  await browser.close();
}
process.exit(bad ? 1 : 0);
