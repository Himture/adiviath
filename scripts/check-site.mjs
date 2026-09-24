import { readFileSync, existsSync } from 'node:fs';
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
  const read = (name) => (existsSync(join(dist, name)) ? readFileSync(join(dist, name), 'utf8') : '');
  const sitemap = read('sitemap.xml');
  const full = read('llms-full.txt');
  const llms = read('llms.txt');
  for (const { path } of pagesData) {
    const url = `https://www.adiviath.com${path}`;
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
