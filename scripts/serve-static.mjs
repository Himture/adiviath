// Serves dist/client like Vercel does for this site: clean URLs plus the vercel.json headers, so the CSP can be
// exercised locally. Usage: node scripts/serve-static.mjs [port]  (default 4330)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = new URL('../dist/client/', import.meta.url).pathname;
const port = Number(process.argv[2] ?? 4330);
// ponytail: every header rule in vercel.json is "/(.*)", so all of them apply to every response
const headers = Object.fromEntries(JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8')).headers.flatMap((r) => r.headers.map((h) => [h.key, h.value])));
// Local http has no TLS: WebKit honours upgrade-insecure-requests on localhost and would fetch every asset over https.
headers['Content-Security-Policy'] = headers['Content-Security-Policy'].replace(/; upgrade-insecure-requests/, '');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.ico': 'image/x-icon', '.json': 'application/json' };

const find = async (path) => {
  for (const p of [path, join(path, 'index.html'), `${path}.html`]) {
    try { if ((await stat(p)).isFile()) return p; } catch { /* try the next */ }
  }
};

createServer(async (req, res) => {
  let path;
  try { path = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname))); }
  catch { res.writeHead(400, headers).end('Bad request'); return; } // malformed percent-encoding
  const file = path.startsWith(root) && (await find(path));
  if (!file) { res.writeHead(404, { ...headers, 'content-type': types['.html'] }).end(await readFile(join(root, '404.html'))); return; } // as Vercel does
  res.writeHead(200, { ...headers, 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(await readFile(file));
}).listen(port, () => console.log(`serving dist/client on http://localhost:${port}`));
