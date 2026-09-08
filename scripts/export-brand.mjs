import fs from 'node:fs/promises';
import sharp from 'sharp';

// Export the existing approved silhouette, rather than drawing a replacement.
const out = new URL('../public/brand/', import.meta.url);
await fs.mkdir(out, { recursive: true });
const source = await fs.readFile(new URL('../public/adiviath-mark.png', import.meta.url));
const data = source.toString('base64');
const palettes = {
  cocoa: ['#654332', '#edab78'],
  light: ['#fffaf3', '#edab78'],
  black: ['#000000', '#000000'],
  white: ['#ffffff', '#ffffff'],
};
function mark(color, accent) {
  return `<defs><mask id="mark" mask-type="alpha"><image href="data:image/png;base64,${data}" width="768" height="768"/></mask></defs><g mask="url(#mark)"><path fill="${color}" d="M0 0h768v768H0z"/><circle cx="384" cy="391.68" r="76.8" fill="${accent}"/></g>`;
}
async function save(name, body, width, height) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
  await fs.writeFile(new URL(`${name}.svg`, out), svg);
  await sharp(Buffer.from(svg)).png().toFile(new URL(`${name}.png`, out).pathname);
}
for (const [name, [color, accent]] of Object.entries(palettes)) {
  await save(`symbol-${name}`, mark(color, accent), 768, 768);
  // Match the website's joined a + diviath lockup and bottom-right descriptor.
  const symbol = `<g transform="translate(-12,-2) scale(.27)">${mark(color, accent)}</g>`;
  const letters = `<text x="151" y="157" fill="${color}" font-family="Arial,sans-serif" font-size="180" font-weight="700" letter-spacing="-7.5">diviath</text>`;
  await save(`wordmark-${name}`, symbol + letters + `<text x="695" y="202" text-anchor="end" fill="${color}" font-family="Arial,sans-serif" font-size="50" font-weight="700" letter-spacing="-1">technologies</text>`, 720, 220);
}
await save('profile-cream', '<path fill="#fffaf3" d="M0 0h1024v1024H0z"/>' + `<g transform="translate(128,128)">${mark('#654332', '#edab78')}</g>`, 1024, 1024);
await save('profile-cocoa', '<path fill="#654332" d="M0 0h1024v1024H0z"/>' + `<g transform="translate(128,128)">${mark('#fffaf3', '#edab78')}</g>`, 1024, 1024);
await save('social-card', '<path fill="#fffaf3" d="M0 0h1200v630H0z"/>' + `<g transform="translate(42,110) scale(.48)">${mark('#654332', '#edab78')}</g><text x="435" y="280" font-family="Arial,sans-serif" font-size="56" font-weight="700" fill="#654332">Adiviath Technologies</text><text x="435" y="350" font-family="Arial,sans-serif" font-size="32" fill="#75685f">Software made to fit.</text>`, 1200, 630);
