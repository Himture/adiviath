# adiviath.com redesign: The Dot

Date: 2026-09-17.
Status: approved for implementation.
Prototype: `public/mockups/the-dot.html` (throwaway, approved as the direction).
Codex review that shaped this revision: `brand-scratch/redesign/codex-review-3.md`.

## 1. Story and voice

Adiviath is the founder's spelling of Sanskrit Advaita, a word for oneness.
The idea behind the company: a business and its software should not be two separate things.
The mark says it: the dot at the centre is the need, and the form is shaped around it.

The site never uses the phrase "not two" as a headline or tagline; it confused the founder himself.
Advaita appears once, on About, in one plain sentence.

Copy hierarchy on the first screen, in order:

- Eyebrow: "Custom software for Indian businesses".
- Headline (h1): "Software built around the way your business works."
- Supporting line: "Adiviath builds and runs systems for operations where forms, spreadsheets and WhatsApp no longer keep up."
- Brand line: "Your work. Your way. Your software." It signs the proposition, it does not replace it. It appears once on Home (scene 1, beneath the mark) and once on About.

Voice: plain English, short sentences, no em dashes, no "empower", "seamless", "cutting-edge", no emoji.
Newsreader italic is used only for the Advaita line on About and for a customer quotation if one is supplied.
Every product claim, status, caption and label is set in Familjen Grotesk, left-aligned.

The founder appears as "the founder", with no name and no photo, until he decides otherwise.
No placeholder avatar anywhere; absence is better than a visible placeholder.

## 2. Goals

- A prospective customer wants to talk to the founder within the first screen.
- Win custom-software clients like Naveen Logistics.
- Read as an umbrella product studio, with Pharmulo and Naveen as proof and room for more.
- Give banks, partners and hires who search the name a credible registered company.

Non-goals: blog, careers, multi-language, CMS, analytics dashboards, forms with a backend.

## 3. Visual system

Palette, as CSS custom properties in `:root`:

| Token | Value | Use |
|---|---|---|
| `--brand` | `#125b63` petrol | mark, buttons, the petrol scene |
| `--accent` | `#f27c64` coral | the dot only, plus one underline per page |
| `--paper` | `#ffffff` | page background |
| `--ink` | `#202b30` charcoal | text |
| `--muted` | `#4e6266` | secondary text (6.5:1 on white) |
| `--surface` | `#eaf1f1` pale mineral | recessed surfaces, diagram nodes |
| `--line` | `#d3e3e5` | hairlines |

Coral is never used as text colour; it fails contrast on both white and petrol.

Type: Familjen Grotesk (display, UI, captions, labels; 500 and 600) and Newsreader (the Advaita line and quotations only; 400 italic).
Both come from the `@fontsource-variable/familjen-grotesk` and `@fontsource-variable/newsreader` packages, imported in the global stylesheet, so the woff2 files are self-hosted by the build.
No Google Fonts request in production.
Headline scale `clamp(40px, 6vw, 80px)`; body 18px on desktop, 17px on mobile; line-height 1.5.

The mark comes only from `src/data/logo-paths.json` through `src/components/Logo.astro`.
No other copy of the shape may exist in the site source.

Motion: CSS scroll-driven animations only, no JavaScript.
Everything animated sits inside `@supports (animation-timeline: scroll())` and `@media (prefers-reduced-motion: no-preference)`.
Without support, or with reduced motion, every page is a static stacked layout that reads completely.

## 4. Conversion path

Primary action everywhere: a solid petrol button "Talk to the founder" with an arrow that shifts 3px on hover and focus.
On the petrol scene the button is white with petrol text.
The button opens WhatsApp (`https://wa.me/<number>?text=...`) with the prefilled message:

> Hi, I'm looking at software for our business. We currently manage [process] using [paper / Excel / WhatsApp / existing software], and the slow part is [problem].

The WhatsApp number is supplied by the founder and stored in `src/data/contact.json`; the repository ships with the field empty and the build fails if it is empty.
Secondary action: "Prefer email? Write to hello@adiviath.com" as a quiet link with the subject "Software for our business".

Trust line under the primary button: "Replies within one business day. You speak with the founder who scopes and builds the work."

Conversion block, used on Home scene 4, at the end of Work and About, and as the whole of Contact:

- Heading: "Show us the work that is slowing you down."
- Body: "Bring the forms, spreadsheets, registers or WhatsApp threads. You do not need a technical brief. Tell us what happens today and where it gets stuck."
- Primary button, secondary email link, trust line.
- "What happens next": "Send two lines or a voice note about the work that is slow. The founder replies within one business day. If it looks like a fit, you have a 30-minute call to map the current workflow. Then you receive a short written scope, an indicative timeline and a clear next step. No sales hand-off and no obligation."
- Minimum reassurance beside it: "One live product. One custom system in production. One founder from first call to launch."

Proof row on the first screen: "Pharmulo, live, built and operated by Adiviath" and "Naveen Logistics, custom system in production".
Outbound links to pharmulo.com and naveenlogistics.com are secondary proof links, open in a new tab, never the primary path.
No invented metrics, no unattributed testimonials.

## 5. Shared layout

Header, fixed: wordmark lockup left; on desktop then Work, About, Contact as text links and the solid button; on mobile only the wordmark and the button.
No hamburger menu; Work, About and Contact live in the closing section and footer on mobile.
The old `<details>` mobile menu and its script are removed.

Footer: the wordmark, "Adiviath Technologies Private Limited", "Registered in India", the email, and the three page links.
The CIN line and registered office city are added once the founder supplies them.

The dot is the brand device.
On Home it is a fixed element that never leaves the viewport.
On inner pages it is static: one coral dot anchors the top of each page and the content arranges around it.

## 6. Pages

### Home (`/`)

Scene lengths: Arrival 160svh, Pharmulo 180svh, Naveen 180svh, Your business 160svh, Closing 100svh.
Each scene is a tall scroll section with a fixed stage whose elements are positioned relative to the dot, in units of the dot size `clamp(18px, 2.4vmin, 30px)`.

1. Arrival. At scroll 0 the visitor sees, left-aligned beside the dot: eyebrow, h1, supporting line, the button and the email link, the proof row, and a quiet "Scroll" cue with a 1px petrol line that grows on a 2s loop. The dot sits centred in the right column beside the text. On the first scroll the text eases left and the canonical mark draws itself around the dot: an SVG mask of a wide stroked centerline of the mark, animated with `stroke-dashoffset` on the scroll timeline, reveals the filled shape progressively from the top hook round to the tip of the bowl; the brand line fades in beneath. No circular or fade reveal. The cue fades within the first 10% and never returns.
2. Pharmulo. Five real crops of the storefront arrive as fragments, hold, then align into one legible storefront composition with the whole screenshot as a shared background across clipped elements. At alignment a three-step label appears: "Find stock, add quantity, send order." Caption: "Pharmulo. Built and operated by Adiviath. Live." with a secondary "See the work" link. Hover or focus on the composition dims the rest of the stage to 35% and lifts the evidence 4px, using `:has()` and `:focus-within`.
3. Naveen Logistics. Presented as a workflow map, not faux documents: four plain diagram nodes labelled Lorry receipt, Freight bill, Payment, Settled account, joined by one thin petrol route that travels through them on the scroll timeline; each node sharpens as the route reaches it and the previous one softens to 55%. Heading: "How the Naveen Logistics system connects the paperwork." Caption: "Custom software for Naveen Logistics. In production." Secondary link. A real screenshot replaces the map when permission arrives.
4. Your business. A petrol circle expands from behind the dot until it fills the viewport, then the conversion block from section 4 appears, left-aligned. On exit the circle collapses back into the dot.
5. Closing, 100svh. The mark draws itself once more around the dot with the same stroke reveal, then a compact block: "Talk to the founder" button, the legal line, and Work, About, Contact links. No second bloom sequence.

A thin petrol progress line at the top of the viewport tracks the whole page on the scroll timeline.
The scrollbar stays visible; nothing is `overflow: hidden` on the body.
Keyboard scrolling and screen readers work because the scenes are ordinary sections in document order.

Fallback: the five scenes stack at `100svh` each, the mark fully drawn, a static dot in each, and the Pharmulo scene shows the full screenshot.

Screen-size matrix, all of which must pass section 8:

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
On widths under 480px scene 2 uses three crops.
Heights use `svh`.

### Work (`/products`, nav label "Work")

The URL stays `/products` because it is indexed and in the sitemap.
Two case studies, each a static version of the Home arrangement: a dot, the need in one sentence beside it, the evidence around it.

Pharmulo, built and operated by Adiviath:

- The need: wholesalers wanted retailers to order without phone calls and price lists.
- What we built: an online storefront that sits on the wholesale system they already run.
- What changed: retailers browse live stock and order from any phone; the order flows back as a bill.
- Evidence: the full storefront screenshot plus two crops, with labels tied to visible parts of the screen.
- Status "Live", secondary link to pharmulo.com.

Naveen Logistics, custom software:

- The need: lorry receipts, freight bills and payments never lined up.
- What we built: one system from receipt to settled bill, with a customer portal.
- What changed: documents connect, payments allocate to bills, customers see their own statement.
- Evidence: the workflow map until a screenshot is supplied; one attributed quotation from the owner if he approves one.
- Status "In production", secondary link to naveenlogistics.com.

The page ends with the conversion block.

### About (`/about`)

1. What Adiviath is: two sentences a bank or partner can quote. "Adiviath Technologies Private Limited is a software company registered in India. It builds and runs its own products and builds custom systems for specific businesses."
2. The name: "Adiviath is the founder's spelling of Advaita, a Sanskrit word for oneness. We build software that is one with the work, not a tool on the side." The mark large beside it, with "The dot is the need. The form is shaped around it."
3. How we work: understand the workflow, agree the scope, build and launch; one line each on what the client gives and gets.
4. The founder: "Adiviath is founder-led. The person you brief is the person who scopes and builds the work, and who answers within one business day."
5. Company facts: legal name, "Registered with MCA, India", CIN and city once supplied, email.
6. FAQ, three questions with FAQPage schema: what does Adiviath mean, what does Adiviath build, where is Adiviath registered.
7. The conversion block.

### Contact (`/contact`)

The conversion block from section 4, full page, with the dot and dashed slots around it as the static version of Home scene 4 on white.
A second quiet link for Pharmulo enquiries points to pharmulo.com.

## 7. Technical plan

- Astro 5 static build, unchanged host (Vercel).
- Remove Tailwind (`tailwindcss`, `@tailwindcss/vite`, the Vite plugin, and the `@import`): no utility class is used anywhere, and its reset was being fought in the CSS.
- Add `@fontsource-variable/familjen-grotesk` and `@fontsource-variable/newsreader`.
- Rewrite `src/styles/global.css` from scratch; the cocoa palette and the tree CSS are deleted, not layered over.
- Home scenes in `src/pages/index.astro` with a dedicated `src/styles/home.css`; shared layout in `BaseLayout.astro`; the conversion block in `src/components/Talk.astro`; contact data in `src/data/contact.json`.
- Images: `pharmulo-home.webp` stays; a 640px `naveen-logistics-logo.webp` replaces the 131KB PNG; every `<img>` has width and height.
- `theme-color` becomes `#ffffff`; JSON-LD and Open Graph stay, with the Organization logo pointing at the canonical symbol export and a regenerated social card in the new palette.
- `public/colors.html`, `public/palette-options.html` and `public/mockups/` are deleted before the redesign merges.

## 8. Verification before calling it done

- `npm run build` passes and the output has no client JavaScript.
- A check script over `dist/` asserts: no `<script>` except JSON-LD, exactly one h1 per page, JSON-LD parses, every `<img>` has width and height, no "not two" and no em dash in page text.
- Each page screenshotted at every viewport in the matrix with a clean console.
- Home: the dot never moves; the mark's counter lands on the dot; each scene forms and dissolves without overlap; the petrol circle covers the viewport before its content appears.
- Fallback: with `@supports` disabled, every page reads top to bottom.
- Contrast: every text and background pair meets 4.5:1.
- No horizontal scroll at 390px.
- The WhatsApp link opens with the prefilled message on a phone.

## 9. SEO and GEO

- Every page has one h1, a unique title under 60 characters, a meta description under 155 characters, a canonical URL, and the existing sitemap and robots entries.
- All copy is real HTML text in document order; scroll-driven scenes only change opacity, clip and position.
- JSON-LD: Organization (legal name, URL, logo, sameAs for pharmulo.com and LinkedIn when supplied, address locality when supplied), WebSite, SoftwareApplication for Pharmulo on Work, FAQPage on About.
- Images have descriptive alt text; the workflow map is described by its heading and caption.
- Performance: no client JavaScript, self-hosted fonts, no layout shift, LCP is the h1 text.
- Open Graph and Twitter cards stay.
- `robots.txt` explicitly allows GPTBot, ClaudeBot, PerplexityBot and Google-Extended, and a short `/llms.txt` lists the company and the four pages in plain text.

## 10. Open items from the founder

- The WhatsApp number (kept out of git until he says it can be published on the site).
- A real screenshot of the Naveen Logistics system, with permission, and optionally one quotation from the owner.
- CIN and registered office city.
- Confirmation that hello@adiviath.com is live.
