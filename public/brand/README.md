# Adiviath final logo pack

The approved master shape is shared by every asset, regardless of colour. The
symbol SVGs are true vector paths traced from the approved reference; they do
not embed a raster image. The website component imports the same path data from
`src/data/logo-paths.json`, so the live mark and exported files cannot drift.

## Master colours

- Charcoal: `#181818`
- Violet: `#5D3FF0` (gradient centre)
- Orange: `#EB8752` (gradient end)
- White: `#FFFFFF`

## SVG exports

- `symbol-gradient.svg` — primary transparent mark.
- `symbol-flat.svg` — flat violet/orange mark.
- `symbol-gradient-dark.svg` / `symbol-gradient-light.svg` — primary mark on fixed backgrounds.
- `symbol-purple.svg`, `symbol-black.svg`, `symbol-white.svg` — one-colour marks.
- `wordmark-gradient.svg` — primary horizontal lockup on transparent background.
- `wordmark-gradient-dark.svg`, `wordmark-black.svg`, `wordmark-white.svg` — lockup alternatives.
- `profile-dark.svg` / `profile-light.svg` — square profile artwork with safe padding.
- `social-card-dark.svg` / `social-card-light.svg` — 1200 × 630 social cards.
- `favicon.svg` — rounded-square browser/app icon.

## Bitmap exports

- `png/` contains production PNGs, including transparent symbols from 32 to 1024 px.
- `icons/` contains favicon, Apple touch, and PWA icon sizes.
- `source/approved-reference.png` is the user-approved source image.
- `source/paths.json` stores the traced master paths used by every export.
- `manifest.json` is the machine-readable inventory and colour reference.

For print, motion, and large-format work, use `symbol-gradient.svg` or the
appropriate monochrome SVG. For uploads that reject SVG, use the matching PNG.

Regenerate the full pack from the project root:

```sh
python3 scripts/finalize-logo.py /path/to/approved-reference.png
```
