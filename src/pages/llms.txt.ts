import type { APIRoute } from 'astro';
import pages from '../data/pages.json';
import company from '../data/company.json';
import products from '../data/products.json';

const productNames = products.map((p) => ('inSentence' in p ? p.inSentence : p.name)).join(' and ');
const summary = `${company.legalName} is a software company in ${company.address.locality}, India. We build and run ${productNames} for Indian businesses, and take on custom software work. Contact ${company.email}. CIN ${company.cin}.`;

const list = pages.map(({ title, path, description }) => `- [${title}](https://www.adiviath.com${path}): ${description}`).join('\n');

export const GET: APIRoute = () => new Response(
  `# Adiviath Technologies\n\n> ${summary}\n\n## Pages\n\n${list}\n\n## Optional\n\n- [Full site text](https://www.adiviath.com/llms-full.txt)\n`,
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
