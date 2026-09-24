// The @astrojs/vercel adapter writes .vercel/output (Build Output API), and Vercel may not merge vercel.json "headers"
// into it. This post-build step copies them from vercel.json (the single source) into a first route of
// .vercel/output/config.json, so every response carries them. Runs as part of `npm run build`.
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = '/(.*)';

// Returns a new config with one headers route first; an earlier copy of it is replaced, so running twice is safe.
function injectHeaders(config, headers) {
  const routes = (config.routes ?? []).filter((r) => !(r.src === SRC && r.continue && r.headers && !r.dest && !r.status));
  return { ...config, routes: [{ src: SRC, headers, continue: true }, ...routes] };
}

function headersFrom(vercelJson) {
  return Object.fromEntries(vercelJson.headers.filter((r) => r.source === '/(.*)').flatMap((r) => r.headers.map((h) => [h.key, h.value])));
}

// No main-module guard: a guard that misfires (symlinked paths) would silently ship without headers.
{
  const root = new URL('../', import.meta.url);
  const file = new URL('.vercel/output/config.json', root);
  const headers = headersFrom(JSON.parse(readFileSync(new URL('vercel.json', root), 'utf8')));
  writeFileSync(file, JSON.stringify(injectHeaders(JSON.parse(readFileSync(file, 'utf8')), headers), null, '\t'));
  console.log(`vercel-headers: ${Object.keys(headers).length} headers on every route`);
}
