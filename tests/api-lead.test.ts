import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleLead } from '../src/pages/api/lead.ts';

const env = { RESEND_API_KEY: 'k', TURNSTILE_SECRET_KEY: 's', ALLOWED_ORIGINS: ['https://www.adiviath.com'] };
const body = { name: 'Ravi', business: 'Balaji Pharma', contact: 'ravi@balaji.in', interest: 'Pharmulo', message: 'Hi', company_site: '', token: 't' };
let n = 0;
const nextIp = () => `10.0.${Math.floor(++n / 250)}.${n % 250}`; // unique per request so the throttle never interferes
const req = (b: unknown, h: Record<string, string> = {}) => new Request('https://www.adiviath.com/api/lead', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://www.adiviath.com', 'x-forwarded-for': nextIp(), ...h }, body: typeof b === 'string' ? b : JSON.stringify(b) });
const ok = (calls: string[]) => (async (url: string) => { calls.push(String(url)); return new Response(JSON.stringify(String(url).includes('turnstile') ? { success: true, hostname: 'www.adiviath.com', action: 'lead' } : { id: '1' }), { status: 200 }); }) as typeof fetch;

test('happy path sends one email', async () => { const c: string[] = []; const r = await handleLead(req(body), env, ok(c)); assert.equal(r.status, 200); assert.equal(c.filter((u) => u.includes('resend')).length, 1); });
test('bad origin rejected', async () => { const c: string[] = []; const r = await handleLead(req(body, { origin: 'https://evil.example' }), env, ok(c)); assert.equal(r.status, 403); assert.equal(c.length, 0); });
test('honeypot silently dropped', async () => { const c: string[] = []; const r = await handleLead(req({ ...body, company_site: 'x' }), env, ok(c)); assert.equal(r.status, 200); assert.equal(c.length, 0); });
test('big body rejected', async () => { const c: string[] = []; const r = await handleLead(req({ ...body, message: 'x'.repeat(50000) }), env, ok(c)); assert.equal(r.status, 413); assert.equal(c.length, 0); });
test('missing token rejected', async () => { const c: string[] = []; const r = await handleLead(req({ ...body, token: '' }), env, ok(c)); assert.equal(r.status, 400); assert.equal(c.length, 0); });
test('turnstile wrong hostname rejected', async () => {
  const f = (async (u: string) => new Response(JSON.stringify(String(u).includes('turnstile') ? { success: true, hostname: 'evil.example', action: 'lead' } : { id: 1 }))) as typeof fetch;
  const r = await handleLead(req(body), env, f); assert.equal(r.status, 400);
});
test('resend down gives the email fallback message', async () => {
  const f = (async (u: string) => String(u).includes('turnstile') ? new Response(JSON.stringify({ success: true, hostname: 'www.adiviath.com', action: 'lead' })) : new Response('x', { status: 500 })) as typeof fetch;
  const r = await handleLead(req(body), env, f); assert.equal(r.status, 502); assert.match((await r.json()).message, /contact@adiviath\.com/);
});
test('missing secrets gives the email fallback message', async () => { const r = await handleLead(req(body), { ALLOWED_ORIGINS: env.ALLOWED_ORIGINS }, ok([])); assert.equal(r.status, 503); });
test('validation errors are returned per field', async () => { const r = await handleLead(req({ ...body, contact: 'nope' }), env, ok([])); assert.equal(r.status, 422); assert.ok((await r.json()).errors.contact); });

const passTs = { success: true, hostname: 'www.adiviath.com', action: 'lead' };
test('non-POST rejected', async () => {
  const c: string[] = []; const r = await handleLead(new Request('https://www.adiviath.com/api/lead', { method: 'GET', headers: { origin: 'https://www.adiviath.com' } }), env, ok(c));
  assert.equal(r.status, 405); assert.equal(c.length, 0);
});
test('missing origin rejected', async () => {
  const c: string[] = []; const h = req(body); const r = await handleLead(new Request(h.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }), env, ok(c));
  assert.equal(r.status, 403); assert.equal(c.length, 0);
});
test('wrong content-type rejected without calling fetch', async () => {
  const c: string[] = []; const r = await handleLead(req(new URLSearchParams(body).toString(), { 'content-type': 'application/x-www-form-urlencoded' }), env, ok(c));
  assert.equal(r.status, 415); assert.equal(c.length, 0);
});
test('declared content-length over the cap rejected', async () => {
  const c: string[] = []; const r = await handleLead(req(body, { 'content-length': '999999' }), env, ok(c));
  assert.equal(r.status, 413); assert.equal(c.length, 0);
});
test('multibyte body over 8 KB in bytes rejected', async () => {
  const c: string[] = []; const r = await handleLead(req({ ...body, message: '\u0939'.repeat(3000) }), env, ok(c));
  assert.equal(r.status, 413); assert.equal(c.length, 0);
});
for (const bad of ['null', '[]', '"hi"', '42', '{bad']) {
  test(`non-object JSON ${bad} rejected cleanly`, async () => {
    const c: string[] = []; const r = await handleLead(req(bad), env, ok(c));
    assert.equal(r.status, 400); assert.equal(c.length, 0);
  });
}
test('6th submission from one IP within 10 minutes is throttled', async () => {
  const c: string[] = []; const h = { 'x-forwarded-for': '203.0.113.9, 10.1.1.1' };
  for (let i = 0; i < 5; i++) assert.equal((await handleLead(req(body, h), env, ok(c))).status, 200);
  const r = await handleLead(req(body, h), env, ok(c));
  assert.equal(r.status, 429); assert.match((await r.json()).message, /contact@adiviath\.com/);
  assert.equal(c.filter((u) => u.includes('resend')).length, 5);
});
test('upstream calls carry a timeout signal', async () => {
  const signals: unknown[] = [];
  const f = (async (u: string, init: RequestInit) => { signals.push(init.signal); return new Response(JSON.stringify(String(u).includes('turnstile') ? passTs : { id: '1' })); }) as typeof fetch;
  assert.equal((await handleLead(req(body), env, f)).status, 200);
  assert.equal(signals.length, 2); assert.ok(signals.every((s) => s instanceof AbortSignal));
});
test('turnstile timeout gives the email fallback and sends nothing', async () => {
  const c: string[] = [];
  const f = (async (u: string) => { c.push(String(u)); throw new DOMException('timed out', 'TimeoutError'); }) as typeof fetch;
  const r = await handleLead(req(body), env, f);
  assert.equal(r.status, 502); assert.match((await r.json()).message, /contact@adiviath\.com/); assert.equal(c.filter((u) => u.includes('resend')).length, 0);
});
test('resend throwing gives the email fallback', async () => {
  const f = (async (u: string) => { if (String(u).includes('turnstile')) return new Response(JSON.stringify(passTs)); throw new TypeError('fetch failed'); }) as typeof fetch;
  const r = await handleLead(req(body), env, f);
  assert.equal(r.status, 502); assert.match((await r.json()).message, /contact@adiviath\.com/);
});
test('turnstile server error gives the email fallback, not a retry prompt', async () => {
  const c: string[] = [];
  const f = (async (u: string) => { c.push(String(u)); return new Response('{"success":false}', { status: 500 }); }) as typeof fetch;
  const r = await handleLead(req(body), env, f);
  assert.equal(r.status, 502); assert.equal(c.filter((u) => u.includes('resend')).length, 0);
});
test('turnstile failure or wrong action sends nothing', async () => {
  for (const ts of [{ success: false }, { ...passTs, action: 'login' }]) {
    const c: string[] = [];
    const f = (async (u: string) => { c.push(String(u)); return new Response(JSON.stringify(String(u).includes('turnstile') ? ts : { id: 1 })); }) as typeof fetch;
    assert.equal((await handleLead(req(body), env, f)).status, 400); assert.equal(c.filter((u) => u.includes('resend')).length, 0);
  }
});
test('localhost token rejected when localhost is not an allowed origin', async () => {
  const f = (async (u: string) => new Response(JSON.stringify(String(u).includes('turnstile') ? { ...passTs, hostname: 'localhost' } : { id: 1 }))) as typeof fetch;
  assert.equal((await handleLead(req(body), env, f)).status, 400);
});
test('preview origin token accepted when that origin is allowed', async () => {
  const preview = 'https://adiviath-git-x.vercel.app';
  const f = (async (u: string) => new Response(JSON.stringify(String(u).includes('turnstile') ? { ...passTs, hostname: 'adiviath-git-x.vercel.app' } : { id: 1 }))) as typeof fetch;
  assert.equal((await handleLead(req(body, { origin: preview }), { ...env, ALLOWED_ORIGINS: [...env.ALLOWED_ORIGINS, preview] }, f)).status, 200);
});
test('email payload: fixed recipient, escaped html, reply-to, idempotency key', async () => {
  const sent: { headers: Headers; body: Record<string, unknown> }[] = [];
  const f = (async (u: string, init: RequestInit) => {
    if (String(u).includes('turnstile')) return new Response(JSON.stringify(passTs));
    sent.push({ headers: new Headers(init.headers), body: JSON.parse(String(init.body)) }); return new Response('{"id":"1"}');
  }) as typeof fetch;
  assert.equal((await handleLead(req({ ...body, message: '<b>hi</b>', to: 'x@evil.com' }), env, f)).status, 200);
  const [m] = sent;
  assert.deepEqual(m.body.to, ['contact@adiviath.com']); assert.equal(m.body.reply_to, 'ravi@balaji.in');
  assert.ok(!String(m.body.html).includes('<b>hi')); assert.match(m.headers.get('idempotency-key') ?? '', /^[0-9a-f]{32}$/);
});
test('logs never include field values', async (t) => {
  const logged: string[] = []; t.mock.method(console, 'error', (...a: unknown[]) => logged.push(a.join(' ')));
  const f = (async (u: string) => String(u).includes('turnstile') ? new Response(JSON.stringify(passTs)) : new Response('x', { status: 500 })) as typeof fetch;
  await handleLead(req(body), env, f);
  const g = (async () => { throw new Error('ravi@balaji.in leaked'); }) as typeof fetch;
  await handleLead(req(body), env, g);
  assert.ok(logged.length >= 2);
  for (const v of ['Ravi', 'Balaji', 'ravi@balaji.in', 'Hi']) assert.ok(!logged.some((l) => l.includes(v)), v);
});
