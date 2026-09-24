export const INTERESTS = ['Pharmulo', 'Freight billing system', 'Something custom'] as const;
export type Lead = { name: string; business: string; contact: string; interest: (typeof INTERESTS)[number]; message: string };
const LIMITS = { name: 100, business: 150, contact: 150, message: 2000 } as const;
// Conservative on purpose: no quotes, commas, angle brackets or colons, so the value is safe as a reply-to header.
const EMAIL = /^[\w.%+'-]+@[a-z\d-]+(?:\.[a-z\d-]+)*\.[a-z]{2,}$/i;
// Indian mobile or landline with STD code, checked after stripping spaces, hyphens, dots and parentheses.
const PHONE = /^(?:\+91|0091|91|0)?[2-9]\d{9}$/;
const isPhone = (v: string) => PHONE.test(v.replace(/[\s.()-]/g, ''));
const clean = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function validateLead(input: unknown): { ok: true; lead: Lead } | { ok: false; errors: Record<string, string> } {
  if (!input || typeof input !== 'object') return { ok: false, errors: { form: 'Invalid submission.' } };
  const o = input as Record<string, unknown>;
  const lead = { name: clean(o.name), business: clean(o.business), contact: clean(o.contact), interest: clean(o.interest), message: typeof o.message === 'string' ? o.message.trim() : '' };
  const errors: Record<string, string> = {};
  if (!lead.name) errors.name = 'Please enter your name.'; else if (lead.name.length > LIMITS.name) errors.name = 'Please keep this under 100 characters.';
  if (!lead.business) errors.business = 'Please enter your business name.'; else if (lead.business.length > LIMITS.business) errors.business = 'Please keep this under 150 characters.';
  if (!lead.contact) errors.contact = 'Please enter an email or phone number.';
  else if (lead.contact.length > LIMITS.contact || !(EMAIL.test(lead.contact) || isPhone(lead.contact))) errors.contact = 'Please enter a valid email or a 10-digit phone number.';
  if (!INTERESTS.includes(lead.interest as Lead['interest'])) errors.interest = 'Please choose one.';
  if (!lead.message) errors.message = 'Please tell us a little about what is slow.'; else if (lead.message.length > LIMITS.message) errors.message = 'Please keep this under 2000 characters.';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, lead: lead as Lead };
}

export function renderLeadEmail(lead: Lead) {
  const subject = `Website enquiry: ${lead.business} (${lead.interest})`.replace(/[\r\n]+/g, ' ').slice(0, 200);
  const rows: [string, string][] = [['Name', lead.name], ['Business', lead.business], ['Email or phone', lead.contact], ['Interested in', lead.interest], ['Message', lead.message]];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  const html = `<table cellpadding="6">${rows.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>`;
  return { subject, text, html, replyTo: EMAIL.test(lead.contact) ? lead.contact : undefined };
}
