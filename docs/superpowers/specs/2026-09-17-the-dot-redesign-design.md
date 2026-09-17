# adiviath.com redesign: The Dot

Date: 2026-09-17.
Status: draft for founder review.
Prototype: `public/mockups/the-dot.html` (throwaway, approved as the direction).

## 1. Story

Adiviath is the founder's spelling of Sanskrit Advaita, "not two".
The brand line is: a business and its software are not two things.
The mark says it already: a dot at the centre is the need, and the form is shaped around it.
Tagline: **Start at the need. Build as one.**

Name breakdown used on the About page:

- Adi: beginning, origin, first.
- viath: the tail of Advaita, echoing vithi, a path or a market street.
- The -th ending is the South Indian transliteration of Advaita.

Never shorten the name to "Advaith" anywhere on the site.

## 2. Goals

- Win custom-software clients like Naveen Logistics.
- Read as an umbrella product studio, with Pharmulo and Naveen as proof and room for more.
- Give banks, partners and hires who search the name a credible registered company.

Non-goals: blog, careers, multi-language, CMS, analytics dashboards.

## 3. Visual system

Palette, as CSS custom properties in `:root`:

| Token | Value | Use |
|---|---|---|
| `--brand` | `#125b63` petrol | mark, buttons, headings on inverted scenes |
| `--accent` | `#f27c64` coral | the dot only, plus one underline per page |
| `--paper` | `#ffffff` | page background |
| `--ink` | `#202b30` charcoal | text |
| `--muted` | `#4e6266` | secondary text (6.5:1 on white) |
| `--surface` | `#eaf1f1` pale mineral | recessed surfaces, document cards |
| `--line` | `#d3e3e5` | hairlines |

Coral is never used as text colour; it fails contrast on both white and petrol.

Type: Familjen Grotesk (display and UI, 500 and 600) and Newsreader (body, captions and quiet lines, 400 and italic).
Both are self-hosted as subset woff2 files in `public/fonts/` with `@font-face` and `font-display: swap`.
No Google Fonts request in production.
Headline scale `clamp(40px, 6vw, 88px)`; body 18px on desktop, 17px on mobile; line-height 1.5.

The mark comes only from `src/data/logo-paths.json` through `src/components/Logo.astro`.
No other copy of the shape may exist in the site source.

Motion: CSS scroll-driven animations only, no JavaScript.
Everything animated sits inside `@supports (animation-timeline: scroll())` and `@media (prefers-reduced-motion: no-preference)`.
Without support, or with reduced motion, every page is a static stacked layout that reads completely.

## 4. Shared layout

Header, fixed: wordmark lockup left (mark plus "adiviath", small "technologies" caption), then Work, About, Contact as text links, then "Discuss your software" as a petrol link.
No hamburger menu; the four items fit at 390px at 44px touch height.
The old `<details>` mobile menu and its script are removed.

Footer: the wordmark, "Adiviath Technologies Private Limited", "Registered in India", the email `hello@adiviath.com`, and the three page links.
The CIN line is added once the founder supplies it.

The dot is the brand device.
On Home it is a fixed element that never leaves the viewport.
On inner pages it is static: one coral dot anchors the top of each page and the content arranges around it.

## 5. Pages

### Home (`/`)

Exactly the prototype, promoted to Astro.
Five scenes, each a tall scroll section with a fixed stage whose elements are positioned relative to the dot:

1. Arrival. At scroll 0: the dot, the h1 "Start at the need. Build as one.", the line "Adiviath, from Advaita: not two." and the scroll cue. On scroll, the mark blooms out of the dot with a `clip-path: circle()` reveal and one sentence fades in beneath.
2. Pharmulo. Five real crops of the Pharmulo storefront settle around the dot with parallax. Caption, status "Live", link to pharmulo.com.
3. Naveen Logistics. Four drawn documents (lorry receipt, freight bill, payment entry, customer statement) around the dot with hairlines through it. Labelled as illustrations until a real screenshot exists. Caption, status "In production", link.
4. Your business. Petrol background. Dashed slots around the dot, one labelled "your work". "What does your work need?" with the button "Discuss your software" and the email.
5. Landing. The mark blooms again, the wordmark forms, the dot ends inside the counter. Legal line and page links.

Fallback: the five scenes stack at `100svh` each with the mark fully drawn and a static dot in each.

Scroll affordance, so nobody stalls on scene 1:

- At scroll 0 the page shows the dot, the h1 "Start at the need. Build as one." and the line "Adiviath, from Advaita: not two." together, so the first screen already reads as a page and the h1 is visible to crawlers without scrolling.
- Under them a quiet cue: the word "Scroll" in Newsreader italic with a 1px petrol line that grows downward on a 2s loop, placed at the bottom centre.
- The cue fades out on the scroll timeline within the first 10% of scene 1 and never returns.
- Scene 1 is shorter than the prototype (about 260svh) so the mark starts blooming within the first wheel tick.
- The browser scrollbar stays visible; nothing is `overflow: hidden` on the body.
- A thin petrol progress line at the very top of the viewport tracks the whole page on the scroll timeline, so users see how much remains.
- Keyboard scrolling (space, page down, arrows) and screen readers work because the scenes are ordinary sections in document order.

Screen sizes. The dot size is `clamp(18px, 2.4vmin, 30px)` and every scene element is offset from it in units of the dot, so the arrangements scale as one thing.
The test matrix, all of which must pass the checks in section 7:

| Viewport | Represents |
|---|---|
| 390x844 | phones |
| 390x660 | phones with the browser bar open |
| 768x1024 | tablets, portrait |
| 1024x768 | tablets, landscape |
| 1280x800 | laptops |
| 1440x900 and 1920x1080 | desktops |
| 1280x600 | short laptop windows |

On viewports shorter than 640px the scene text sits below the dot and fragments shrink to 70%.
On widths under 480px scene 2 shows three crops instead of five.
Heights use `svh` so mobile browser bars do not cause jumps.

### Work (`/products`, nav label "Work")

The URL stays `/products` because it is indexed and in the sitemap.
Two case studies, each a static version of the Home arrangement: a dot in the middle, the need in one sentence beside it, and the evidence around it.

Pharmulo, our product:

- The need: wholesalers wanted retailers to order without phone calls and price lists.
- What we built: an online storefront that sits on the wholesale system they already run.
- What changed: retailers browse live stock and order from any phone; the order flows back as a bill.
- Evidence: the full storefront screenshot, plus two crops.
- Status "Live", link to pharmulo.com, label "Built and operated by Adiviath".

Naveen Logistics, custom software:

- The need: lorry receipts, freight bills and payments never lined up.
- What we built: one system from receipt to settled bill, with a customer portal.
- What changed: documents connect, payments allocate to bills, customers see their own statement.
- Evidence: the four drawn documents until a screenshot is supplied.
- Status "In production", link to naveenlogistics.com, label "Custom software for Naveen Logistics".

Closing band: "Have work like this?" with the button and email.

### About (`/about`)

1. "Not two." The name breakdown from section 1, in plain language, three short paragraphs.
2. The mark. The mark large, with "The dot is the need. The form is shaped around it."
3. How we work. Three steps: understand the workflow, agree the scope, build and launch. One line each on what the client gives and gets.
4. Who runs it. Founder name and photo (placeholder circle until supplied), two sentences.
5. Company facts. Legal name, "Registered with MCA, India", CIN (placeholder until supplied), based in India.

### Contact (`/contact`)

The static version of Home scene 4 on white: the dot with dashed slots, "What does your work need?", the email as a large link with `mailto:` and a prefilled subject "Software for my business", and three prompts: what you do, the tools you use, what is slow.
No form, since there is no backend.
A second small link for Pharmulo enquiries points to pharmulo.com.

## 6. Technical plan

- Astro 5 static build, unchanged host (Vercel).
- Remove Tailwind (`tailwindcss`, `@tailwindcss/vite`, the Vite plugin, and the `@import`): no utility class is used anywhere, and its reset was being fought in the CSS.
- Rewrite `src/styles/global.css` from scratch for the new system; the cocoa palette and the tree CSS are deleted, not layered over.
- One `Dot` scene structure on Home implemented in `src/pages/index.astro` with scene markup and scoped CSS; shared layout in `BaseLayout.astro`.
- Images: `pharmulo-home.webp` stays; add a 640px `naveen-logistics-logo.webp` and use it instead of the 131KB PNG; every `<img>` has width and height.
- `theme-color` becomes `#ffffff`; JSON-LD and Open Graph stay, with the Organization logo pointing at the canonical symbol export.
- Delete `public/adiviath-mark.png` usage from the site; the brand export scripts keep their own source.
- `public/colors.html`, `public/palette-options.html` and `public/mockups/` are deleted before the redesign is committed.

## 7. Verification before calling it done

- `npm run build` passes and the output has no client JavaScript.
- Each page screenshotted at 1280x800 and 390x844 with a clean console.
- Home: the dot never moves; the mark's counter lands on the dot in scenes 1 and 5; each scene forms and dissolves without overlap.
- Fallback: with `@supports` disabled, every page reads top to bottom.
- Contrast: every text and background pair meets 4.5:1.
- No horizontal scroll at 390px.

## 8. SEO and GEO

SEO:

- Every page has one h1, a unique title under 60 characters, a meta description under 155 characters, a canonical URL, and the existing sitemap and robots entries.
- All copy is real HTML text in document order; nothing is injected or hidden behind interaction. Scroll-driven scenes only change opacity and position, and the fallback stack proves the page reads without them.
- Structured data via JSON-LD: Organization (legal name, URL, logo, founder, address locality once supplied, sameAs for pharmulo.com and LinkedIn), WebSite, and SoftwareApplication for Pharmulo on Work, plus FAQPage on About for the name question.
- Images have descriptive alt text; the Naveen illustrations are marked decorative with the caption carrying the meaning.
- Performance: no client JavaScript, self-hosted subset fonts, `width` and `height` on every image, no layout shift, LCP is the h1 text.
- Open Graph and Twitter cards stay, with a regenerated social card in the new palette from the brand pipeline.

GEO, so AI answer engines describe the company correctly:

- About and Home carry short, quotable, factual sentences that an answer engine can lift verbatim: what Adiviath is, where it is registered, what it has built, what the name means, and how to contact it.
- A FAQ block on About answers "What does Adiviath mean?", "What does Adiviath build?" and "Where is Adiviath registered?" in one or two sentences each, with FAQPage schema.
- `robots.txt` explicitly allows the AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) rather than relying on the default.
- A short `/llms.txt` lists the company in plain text with links to the four pages.
- The Organization schema names the legal entity exactly as registered, so the MCA name and the site match.

## 9. Open items from the founder

- A real screenshot of the Naveen Logistics system, with permission.
- Founder photo and the two-sentence bio.
- CIN and registered office city.
- Confirmation that "hello@adiviath.com" is live.
