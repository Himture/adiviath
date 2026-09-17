import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../dist/', import.meta.url).pathname;
const pages = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    // Search Console verification files are not pages.
    else if (name.endsWith('.html') && !/^google[0-9a-f]+\.html$/i.test(name)) pages.push(p);
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
