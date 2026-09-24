import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLead, renderLeadEmail } from '../src/lib/lead.ts';

const base = { name: 'Ravi Kumar', business: 'Sri Balaji Pharma', contact: 'ravi@balaji.in', interest: 'Pharmulo', message: 'Orders come on WhatsApp.', company_site: '' };

test('valid lead passes', () => assert.equal(validateLead(base).ok, true));
test('Indian phone passes', () => assert.equal(validateLead({ ...base, contact: '+91 98450 12345' }).ok, true));
test('Indian mobile and landline formats pass', () => {
  for (const contact of ['+91 98450 12345', '+91-98450-12345', '098450 12345', '(080) 2345 6789', '08023456789', '9845012345', '0091 9845012345']) assert.equal(validateLead({ ...base, contact }).ok, true, contact);
});
test('short or foreign numbers fail', () => {
  for (const contact of ['12345', '+1 415 555 0100', '98450']) assert.equal(validateLead({ ...base, contact }).ok, false, contact);
});
test('missing name fails', () => { const r = validateLead({ ...base, name: '  ' }); assert.equal(r.ok, false); assert.ok(!r.ok && r.errors.name); });
test('garbage contact fails', () => { const r = validateLead({ ...base, contact: 'call me' }); assert.ok(!r.ok && r.errors.contact); });
test('unknown interest fails', () => assert.equal(validateLead({ ...base, interest: 'Crypto' }).ok, false));
test('overlong message fails', () => assert.equal(validateLead({ ...base, message: 'x'.repeat(2001) }).ok, false));
test('non-object fails', () => assert.equal(validateLead('hi').ok, false));
test('newlines never reach the subject', () => {
  const r = validateLead({ ...base, business: 'Evil\r\nBcc: x@y.z' }); assert.ok(r.ok);
  const e = renderLeadEmail(r.ok ? r.lead : (null as never)); assert.ok(!/[\r\n]/.test(e.subject));
});
test('html is escaped', () => {
  const r = validateLead({ ...base, message: '<img src=x onerror=alert(1)>' }); assert.ok(r.ok);
  assert.ok(!renderLeadEmail(r.ok ? r.lead : (null as never)).html.includes('<img'));
});
test('reply-to only for emails', () => {
  const p = validateLead({ ...base, contact: '9845012345' }); assert.ok(p.ok);
  assert.equal(renderLeadEmail(p.ok ? p.lead : (null as never)).replyTo, undefined);
});
test('email with list or header characters fails', () => {
  for (const contact of ['a,b@evil.com', 'x<y@z.com', 'a"b@c.com']) assert.equal(validateLead({ ...base, contact }).ok, false, contact);
});
