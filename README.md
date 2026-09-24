# adiviath.com

The website of Adiviath Technologies Private Limited.
Astro 5 static site on Vercel, with one serverless function for the contact form.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server at http://localhost:4321 |
| `npm run build` | Builds the site and injects the security headers into `.vercel/output` |
| `npm test` | Unit tests (Node 22.18 or later) |
| `npm run verify` | Build, then check every page for compliance, SEO and copy rules |
| `npm run serve` | Serves the built static pages locally |
| `npm run matrix` | Device matrix: every page in Chromium, WebKit and Firefox at 8 sizes |
| `npm run indexnow` | Tells Bing and partners the pages changed (run after a deploy) |

## Where things live

- `src/data/company.json`: legal name, CIN, registered office, contact and grievance details.
- `src/data/products.json`: the product catalogue. Add a product here; testimonials and screenshots are optional fields.
- `src/data/pages.json`: every route with its title and description. It drives the sitemap, `llms.txt`, `llms-full.txt` and the build checks.
- `src/data/solutions.ts`: copy and FAQs for the three solution pages.
- `src/data/logo-paths.json`: the canonical logo shape. Never retrace the logo from an image.
- `src/pages/api/lead.ts`: the contact form endpoint.
- `docs/superpowers/`: the spec and plan this site was built from.

## Email-only launch

`CONTACT_FORM_ENABLED` in `src/data/features.ts` is deliberately `false`. Pages show the email contact panel even if Turnstile keys exist, and `/api/lead` rejects submissions without contacting external services. Keep this disabled until form delivery is ready to test. To re-enable later, set the flag to `true`, configure the required keys, test delivery, and redeploy.

## Environment variables (Vercel)

| Name | Purpose |
|---|---|
| `RESEND_API_KEY` | Sends form enquiries by email |
| `TURNSTILE_SECRET_KEY` | Verifies the form's bot check |
| `PUBLIC_TURNSTILE_SITE_KEY` | Required for the form when `CONTACT_FORM_ENABLED` is enabled |
| `PUBLIC_GA_ID` | Google Analytics, loaded only after the visitor accepts |
| `LEAD_TO`, `LEAD_FROM` | Optional overrides for the enquiry email addresses |

`PUBLIC_` values are read at build time, so redeploy after changing them.
