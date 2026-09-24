import { CONTACT_FORM_ENABLED } from '../../data/features.ts';
import type { APIRoute } from 'astro';
import { validateLead, renderLeadEmail } from '../../lib/lead.ts';
import { allow } from '../../lib/throttle.ts';

export const prerender = false;
const MAX_BYTES = 16384; // 2000 non-Latin characters (3 bytes each) plus a Turnstile token fit
const TOO_BIG = 'Message too long. Please email contact@adiviath.com.';
const CHECK = 'Please try again in a moment, or email contact@adiviath.com.';
const FALLBACK = 'Could not send right now. Please email contact@adiviath.com.';
type Env = { RESEND_API_KEY?: string; TURNSTILE_SECRET_KEY?: string; LEAD_TO?: string; LEAD_FROM?: string; ALLOWED_ORIGINS: string[] };
const json = (status: number, data: object) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
export const UPSTREAM_TIMEOUT_MS = 4000; // two sequential calls stay well inside Vercel's default function duration
const timed = (f: typeof fetch, url: string, init: RequestInit) => f(url, { ...init, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });

export async function handleLead(req: Request, env: Env, f: typeof fetch = fetch): Promise<Response> {
  if (req.method !== 'POST') return json(405, { ok: false, message: 'Method not allowed.' });
  if (!env.ALLOWED_ORIGINS.includes(req.headers.get('origin') ?? '')) return json(403, { ok: false, message: 'Forbidden.' });
  if (!(req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return json(415, { ok: false, message: 'Unsupported.' });
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BYTES) return json(413, { ok: false, message: TOO_BIG });
  // ponytail: reads the whole body before the byte check; Vercel caps request bodies at 4.5 MB, stream with a cap if that ever matters.
  const raw = await req.text();
  if (Buffer.byteLength(raw) > MAX_BYTES) return json(413, { ok: false, message: TOO_BIG });
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return json(400, { ok: false, message: 'Invalid submission.' }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json(400, { ok: false, message: 'Invalid submission.' });
  if (typeof body.company_site === 'string' && body.company_site.trim()) return json(200, { ok: true });
  const v = validateLead(body);
  if (!v.ok) return json(422, { ok: false, errors: v.errors, message: 'Please check the highlighted fields.' });
  // After validation, so a visitor correcting typos is never locked out.
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (!allow(ip)) return json(429, { ok: false, message: 'Too many messages. Please email contact@adiviath.com.' });
  const token = typeof body.token === 'string' ? body.token : '';
  if (!token) return json(400, { ok: false, message: CHECK });
  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET_KEY) return json(503, { ok: false, message: FALLBACK });
  try {
    const ts = await timed(f, 'https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip }) });
    if (!ts.ok) { console.error('lead: turnstile status', ts.status); return json(502, { ok: false, message: FALLBACK }); }
    const t = (await ts.json()) as { success?: boolean; hostname?: string; action?: string };
    const hosts = env.ALLOWED_ORIGINS.map((o) => new URL(o).hostname);
    if (!t.success || t.action !== 'lead' || !hosts.includes(t.hostname ?? '')) return json(400, { ok: false, message: CHECK });
    const mail = renderLeadEmail(v.lead);
    const idem = (await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))).slice(0, 16);
    const rs = await timed(f, 'https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', 'idempotency-key': Buffer.from(idem).toString('hex') }, body: JSON.stringify({ from: env.LEAD_FROM ?? 'Adiviath website <website@adiviath.com>', to: [env.LEAD_TO ?? 'contact@adiviath.com'], subject: mail.subject, text: mail.text, html: mail.html, ...(mail.replyTo ? { reply_to: mail.replyTo } : {}) }) });
    if (!rs.ok) { console.error('lead: resend status', rs.status); return json(502, { ok: false, message: FALLBACK }); }
    return json(200, { ok: true });
  } catch (e) {
    console.error('lead: upstream failure', (e as Error).name);
    return json(502, { ok: false, message: FALLBACK });
  }
}

// Read at request time: Astro 5 inlines import.meta.env at build time, which would bake secrets into the bundle.
const origins = () => ['https://www.adiviath.com', ...(process.env.VERCEL_ENV !== 'production' ? [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].filter(Boolean).map((h) => `https://${h}`) : []), ...(import.meta.env.DEV ? ['http://localhost:4321'] : [])];
export const POST: APIRoute = ({ request }) => {
  if (!CONTACT_FORM_ENABLED) return json(503, { ok: false, message: 'Please email contact@adiviath.com to send an enquiry.' });
  const e = process.env; return handleLead(request, { RESEND_API_KEY: e.RESEND_API_KEY, TURNSTILE_SECRET_KEY: e.TURNSTILE_SECRET_KEY, LEAD_TO: e.LEAD_TO, LEAD_FROM: e.LEAD_FROM, ALLOWED_ORIGINS: origins() }); };
export const ALL: APIRoute = () => json(405, { ok: false, message: 'Method not allowed.' });
