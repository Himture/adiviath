# Adiviath brand exports

- `symbol-cocoa`: cocoa/apricot a, transparent background.
- `symbol-light`: cream/apricot a for dark backgrounds.
- `symbol-black` and `symbol-white`: single-color versions.
- `wordmark-*`: joined a + diviath with technologies at bottom right.
- `profile-cream` and `profile-cocoa`: 1024px square images with safe padding for social profile crops.

Every version has a PNG and a self-contained SVG. Use PNG for LinkedIn and other uploads; PNG also preserves the lettering exactly. SVG wordmarks use Arial text and embed the original raster silhouette, so these are not fully vector print masters. The original source remains at `/adiviath-mark.png`.

Regenerate from the project root with `node scripts/export-brand.mjs`.
