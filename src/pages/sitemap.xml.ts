import type { APIRoute } from 'astro';
import { execFileSync } from 'node:child_process';

const pages: [string, string][] = [['/', 'index'], ['/products', 'products/index'], ['/about', 'about'], ['/contact', 'contact']];

// last commit that touched the page, or the build date when git history is unavailable (shallow CI clones)
const lastmod = (file: string) => {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cI', '--', `src/pages/${file}.astro`], { encoding: 'utf8' }).trim() || new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
};

export const GET: APIRoute = ({ site }) => new Response(
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(([path, file]) => `<url><loc>${new URL(path, site).href}</loc><lastmod>${lastmod(file)}</lastmod></url>`).join('')}</urlset>`,
  { headers: { 'Content-Type': 'application/xml' } },
);
