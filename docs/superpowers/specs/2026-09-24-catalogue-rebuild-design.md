# Adiviath site rebuild: Catalogue direction

Date: 2026-09-24.
Status: approved in conversation, awaiting written-spec review.
Supersedes: `2026-09-17-the-dot-redesign-design.md` (The Dot scroll-scene design, retired as not production-ready).

## 1. Purpose and success

The site's first job is verification: a visitor must believe within seconds that Adiviath Technologies is a real, capable company.
Its second job is enquiries: a visitor with a matching problem sends the contact form or an email.

Success means, on a phone:

- A cold visitor can tell what Adiviath sells (two live products and custom software) from the first screen.
- Every page shows the legal disclosures in the footer.
- Sending an enquiry takes one short form, with email as the alternative.
- No placeholder content ships: no fake quotes, no dashed image slots, no "coming soon" products.

## 2. Audience

Anyone who would want Adiviath's products or custom software, reached through the problem they have.
In practice: owners and operators of Indian businesses such as distributors, wholesalers and transport companies, mostly on phones, often not technical.
Both cold search traffic and warm referrals matter.

## 3. Fixed inputs

- Palette: petrol `#125b63`, coral `#f27c64`, charcoal `#202b30`, muted `#4e6266`, pale mineral `#eaf1f1`, white.
- Headline: "Software built around the way your business works."
- Brand line: "Your work. Your way. Your software." (About page only.)
- Logo shape: only from `src/data/logo-paths.json`. Never retrace the PNG.
- Type: Familjen Grotesk Variable (already a dependency). Newsreader is dropped from the rebuild.
- Theme: light only.
- Language: English only.
- No em dashes or en dashes anywhere in visible copy.

## 4. Offer and proof

### Products (equal weight with custom work)

1. **Pharmulo.** For pharma wholesalers. Retailers order from their phone, and the order reaches the wholesaler as a ready bill. Live. Links out to https://pharmulo.com.
2. **Freight billing system.** For transport companies. Lorry receipts, freight bills and payments in one place. Built first for Naveen Logistics, a family-run transport business, and running their operations daily. Live. Shown under this descriptive name until it has a product name.

### Custom software

Offered: web apps and internal tools (ordering, billing, inventory, dashboards), customer and retailer portals, Android and iOS apps, Tally, Busy and Marg integrations, WhatsApp and SMS notifications and automations.
Not offered: standalone brochure websites.
No pricing is shown anywhere.
The engagement is described as: a call about how the work happens today, a fixed written scope and price before anything starts, weekly progress, support and changes after launch.

### Proof

- Testimonials for both products will arrive later. Until then, no testimonial sections render.
- Freight system screenshots will arrive later. Until then, the freight card and page render without an image.
- Testimonials and screenshots are data-driven (see section 9), so adding them is a data change, not a layout change.

## 5. Voice

- "We" for the company throughout.
- One signed note from the founder, on Home next to the form and on Contact: "I read every message myself and reply within one business day." signed "Himanshu Agarwal, Director".
- Founder line on About: "Himanshu Agarwal, Director. Building software for businesses since 2020."
- Plain, specific language. No adjectives like "seamless", "passionate", "next-gen".
- Every visible string gets an `unslop` audit before ship.

## 6. Compliance

Sources: Companies Act 2013 s.12(3)(c) with Companies (Incorporation) Rules 2014 rule 26; IT (Reasonable Security Practices) Rules 2011 rule 4; DPDP Act 2023 (core duties expected around May 2027).
The founder should confirm final wording with a CA.

### Footer disclosures (every page)

- Legal name: Adiviath Technologies Private Limited.
- Registered office: WorkFlo Ranka Junction, Property No. 224, 3rd Floor, #80/3, Vijinapur Village, Old Madras Road, K R Puram Hobli, Bengaluru, Karnataka 560016.
- CIN: U62099KA2026PTC228442.
- Email: contact@adiviath.com.
- Queries and grievances: Himanshu Agarwal, Director, contact@adiviath.com.
- No telephone number is published, by the founder's decision. Email is the contact channel.
- Layout: a "Registered office" column, in the style of Razorpay's footer.

### Privacy policy (`/privacy`)

Written to satisfy IT Rules 2011 rule 4 now and the DPDP Act notice requirements ahead of commencement.
It must cover: what is collected (form fields, email correspondence, analytics data after consent), why, where it is processed (Vercel, Resend, Cloudflare Turnstile, Google Analytics), retention, security practices, the visitor's rights (access, correction, erasure, withdrawing consent), and the grievance contact.

### Terms of use (`/terms`)

Short: site content is informational, no warranty, intellectual property, links to third-party sites (pharmulo.com), governing law India, courts at Bengaluru.

### Cookies and analytics consent

Google Analytics 4 loads only after the visitor clicks "Accept" on a consent bar.
"Accept" and "Decline" have equal visual weight.
The choice is stored in `localStorage` and can be changed from a "Cookie settings" link in the footer.
Before consent, no Google script is requested.

## 7. Information architecture

| URL | Page | Primary job |
|---|---|---|
| `/` | Home | Verify, route to a product or to custom work |
| `/products` | Products | Catalogue of live products |
| `/products/pharmulo` | Pharmulo | What it is, who it is for, link to pharmulo.com |
| `/products/freight-billing` | Freight billing system | What it is, who it is for, enquiry |
| `/custom-software` | Custom software | What we build, how an engagement works, enquiry |
| `/solutions/pharma-distributor-ordering` | Search page | Problem page leading to Pharmulo |
| `/solutions/freight-billing-software` | Search page | Problem page leading to the freight system |
| `/solutions/distributor-software` | Search page | Problem page leading to custom work (Tally, Busy, Marg integration) |
| `/about` | About | Company facts, founder line, the name, how we work |
| `/contact` | Contact | Form, email, founder note, disclosures |
| `/privacy` | Privacy policy | Compliance |
| `/terms` | Terms of use | Compliance |

Existing URLs `/`, `/products`, `/about`, `/contact` are kept so indexed pages keep working.
Primary navigation: Products, Custom software, About, and one CTA "Talk to us".
The CTA label "Talk to us" is the only contact label across the site.

## 8. Page designs

Reference mockup: `.superpowers/mockups/b-catalogue.html` (local, not committed).

### Home

1. **Hero.** The logo mark (about 96 px) above the headline, where the trace-and-fill moment plays, the headline, one sentence of subtext ("Pick a product that's already running, or have one built for you."), and one "Talk to us" button. Fits the first viewport on a 390x844 phone and a 1280x800 laptop.
2. **Catalogue.** Asymmetric grid: Pharmulo as the large mineral card with its real screenshot; the freight system as a charcoal card; "Something built for you" as a petrol card. Each card is one link. Scales to 3 or 4 products without redesign.
3. **Sound familiar?** Four problem rows, each linking to the matching solution page, labelled with where it leads.
4. **Testimonials.** Renders only when testimonial data exists.
5. **How a custom build goes, with the form.** The four engagement steps and the founder note beside the contact form.
6. **Footer.**

### Products and product pages

`/products` repeats the catalogue grid with one more sentence per product.
Each product page: what it is, who it is for, what changes for them, screenshot when available, testimonial when available, and the right next step (pharmulo.com for Pharmulo, the form for the freight system).
The freight page states the Naveen Logistics origin plainly, as in section 4.

### Custom software

What we build (the list in section 4), how an engagement works (the four steps), what we do not do (brochure websites), and the form.

### Solution pages

Each: the problem in the visitor's words, what the fix looks like, the product or service that provides it, and the form.
Roughly 400 to 700 words of real, specific copy each, so they can rank.
Each has its own title, description and FAQ schema where natural.

### About

Company facts (legal name, CIN, registered office, director), the founder line, the meaning of the name (Adiviath, the founder's spelling of Advaita, oneness; mentioned once), the brand line, and how we work.

### Contact

The form, the email address, the founder note, and the full disclosures.

## 9. Components and data

- `BaseLayout`: head, meta, schema graph, header, footer, consent bar.
- `Footer`: disclosures from a single `src/data/company.json` (legal name, CIN, address, email, grievance contact, founder line).
- `ProductCard` and product pages read from `src/data/products.json`: slug, name, audience, one-liner, status, external URL, screenshot (optional), testimonial (optional).
- `LeadForm`: the 5 fields, posting to the form function.
- `LogoDraw`: the trace-and-fill mark, used on Home only.
- `ConsentBar`: GA consent.
- Testimonials and screenshots are optional fields; components render nothing for a missing field.

## 10. Signature motion

The only animation beyond hover and focus states: on Home load, the mark's outline is traced (about 1.3 s), the shape fills with petrol, then the coral dot lands with a small overshoot.
Total about 2 s, plays once, never on scroll.
Under `prefers-reduced-motion: reduce`, the finished mark shows immediately.
Prototype: `.superpowers/mockups/draw.mjs`, option "trace".

## 11. Contact form

### Fields

1. Your name (required, max 100 characters).
2. Business name (required, max 150).
3. Email or phone (required, max 150; must look like an email or an Indian phone number).
4. You're interested in (required select: Pharmulo, Freight billing system, Something custom).
5. What's slow or broken today? (required, max 2000).

Labels sit above inputs. Errors appear inline below each field. Placeholders are examples, never labels.

### Delivery and safety

- A Vercel serverless function (`/api/lead`) validates and sends the lead to contact@adiviath.com through Resend, with the visitor's email as reply-to when given.
- Cloudflare Turnstile token verified server-side.
- A hidden honeypot field; any value means the submission is silently dropped.
- Server-side validation mirrors the client rules; anything over the limits is rejected.
- All values are escaped before they go into the email body.
- Only POST with the expected content type is accepted.
- Secrets (`RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`) live only in Vercel environment variables.
- Nothing about a lead is stored by the site.
- States: sending, sent (a clear confirmation with what happens next), and failed (a message that points to the email address).
- The form needs JavaScript for Turnstile. The email address is always shown beside it as the path for visitors without JavaScript.

### Hosting change

The site stays static: Astro's default static output with the `@astrojs/vercel` adapter, and only `/api/lead` opts out of prerendering (`export const prerender = false`).

## 12. SEO and GEO

- Per-page title and description, canonical, Open Graph, one h1.
- Schema graph: Organization (with address, CIN identifier, contact point, founder), WebSite, WebPage per page, SoftwareApplication per product, Service for custom software, FAQPage where a page has FAQs.
- Sitemap with lastmod, robots.txt with AI crawler allow-list, `llms.txt`, build-generated `llms-full.txt` (all carried over from the current site).
- The Vercel trailing-slash redirect stays.

## 13. Quality bar

- WCAG AA contrast on every text pair, visible focus rings, keyboard-operable everything, 44 px touch targets.
- No horizontal overflow at 360, 390, 768, 1024, 1280, 1440 and 1920 px widths.
- Lighthouse on a phone profile: Performance, Accessibility, Best Practices and SEO all at 95 or above.
- Every page screenshotted at phone and desktop sizes and reviewed before launch.
- The `design-taste-frontend` pre-flight checklist passes.

## 14. One-time setup by the founder

Step-by-step instructions will be provided when needed.

1. Resend: create an account, add the domain `adiviath.com`, add the DNS records it shows, create an API key.
2. Cloudflare Turnstile: create a site key and secret key for `adiviath.com`.
3. Google Analytics 4: create a property, share the measurement ID.
4. Vercel: add the three secrets as environment variables.

Until these exist, the form falls back to showing the email address, and analytics stays off.

## 15. Out of scope

Blog or guides, pricing, dark mode, Hindi or other languages, a named freight product, WhatsApp as a public channel, a published phone number.
