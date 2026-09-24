// Post-deploy IndexNow ping: tells search engines that support it (Bing, Yandex, and others) which
// URLs changed, so they can crawl without waiting for their own schedule. Run after a deploy, not in CI.
import { readFileSync } from 'node:fs';

const HOST = 'www.adiviath.com';
const KEY = 'e66c171bf6b855788e5c1315d89a42a1';

const pages = JSON.parse(readFileSync(new URL('../src/data/pages.json', import.meta.url), 'utf8'));
const urlList = pages.map(({ path }) => `https://${HOST}${path}`);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});

console.log(`indexnow: ${res.status} ${res.statusText}`);
