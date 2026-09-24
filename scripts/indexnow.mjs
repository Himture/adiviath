// Post-deploy IndexNow ping: tells search engines that support it (Bing, Yandex, and others) which
// URLs changed, so they can crawl without waiting for their own schedule. Run after a deploy, not in CI.
import { readFileSync, readdirSync } from 'node:fs';

const HOST = 'www.adiviath.com';

// The key file's name is the key itself (public/<key>.txt); read it from there so it exists in one place.
const publicDir = new URL('../public/', import.meta.url);
const keyFile = readdirSync(publicDir).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error('no IndexNow key file found in public/ (expected <32-hex-key>.txt)');
const KEY = keyFile.replace(/\.txt$/, '');

const pages = JSON.parse(readFileSync(new URL('../src/data/pages.json', import.meta.url), 'utf8'));
const urlList = pages.map(({ path }) => `https://${HOST}${path}`);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});

console.log(`indexnow: ${res.status} ${res.statusText}`);
if (res.status !== 200 && res.status !== 202) process.exitCode = 1;
