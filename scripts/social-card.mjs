// Renders public/brand/social-card.png (1200x630) from the canonical mark. Run: node scripts/social-card.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const logo = JSON.parse(readFileSync('src/data/logo-paths.json', 'utf8'));
const text = (y, size, weight, fill, s) => `<text x="440" y="${y}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${size}" font-weight="${weight}" letter-spacing="-1" fill="${fill}">${s}</text>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#ffffff"/>
<g transform="translate(70 155) scale(0.85)"><path d="${logo.mark}" fill="#125b63"/><path d="${logo.dot}" fill="#f27c64"/></g>
${text(262, 54, 700, '#202b30', 'Software built around')}
${text(326, 54, 700, '#202b30', 'the way your business')}
${text(390, 54, 700, '#202b30', 'works.')}
${text(462, 28, 400, '#4e6266', 'Adiviath Technologies Private Limited')}
<rect x="0" y="618" width="1200" height="12" fill="#125b63"/>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile('public/brand/social-card.png');
console.log('social-card.png written');
