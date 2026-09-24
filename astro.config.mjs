// @ts-check
import { defineConfig } from 'astro/config';
import { readFile, writeFile } from 'node:fs/promises';

const pages = [['Home', '/'], ['Work', '/products'], ['About', '/about'], ['Contact', '/contact']];

// llms-full.txt: every page's main copy as plain text, read from the built HTML so it never drifts
const llmsFull = {
  name: 'llms-full',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const text = (html) => html
        .replace(/^[\s\S]*?<main[^>]*>|<\/main>[\s\S]*$/g, '')
        .replace(/<(script|style|svg)[\s\S]*?<\/\1>/g, '')
        .replace(/<(\w+)[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/\1>/g, '')
        .replace(/<h([1-3])[^>]*>/g, (_, n) => `\n\n${'#'.repeat(Number(n) + 2)} `)
        .replace(/<\/(p|li|dt|dd|h[1-3]|summary|figure)>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      let out = '# Adiviath Technologies: full site text\n';
      for (const [name, path] of pages) {
        const file = new URL(path === '/' ? 'index.html' : `${path.slice(1)}/index.html`, dir);
        out += `\n\n## ${name} (https://www.adiviath.com${path})\n\n${text(await readFile(file, 'utf8'))}`;
      }
      await writeFile(new URL('llms-full.txt', dir), out.trim() + '\n');
    },
  },
};

export default defineConfig({
  site: 'https://www.adiviath.com',
  trailingSlash: 'never',
  integrations: [llmsFull],
});
