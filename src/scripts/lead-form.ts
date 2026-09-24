import { validateLead } from '../lib/lead.ts';

declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: object) => string; reset: (id?: string) => void }; onTsLoad?: () => void } }
const FALLBACK = 'Could not send right now. Please email contact@adiviath.com.';
const form = document.querySelector<HTMLFormElement>('form[data-lead]');
if (form) {
  form.hidden = false;
  const status = form.querySelector<HTMLElement>('.status')!;
  const btn = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  let token = '';
  let busy = false;
  const ts = form.querySelector<HTMLElement>('[data-ts]')!;
  let widget: string | undefined;
  window.onTsLoad = () => {
    widget = window.turnstile!.render(ts, {
      sitekey: form.dataset.sitekey, action: 'lead', appearance: 'interaction-only', 'response-field': false,
      callback: (t: string) => { token = t; },
      'expired-callback': () => { token = ''; window.turnstile!.reset(widget); },
      'error-callback': () => { token = ''; },
      'before-interactive-callback': () => ts.classList.add('shown'),
      'after-interactive-callback': () => ts.classList.remove('shown'),
    });
  };
  const s = document.createElement('script');
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTsLoad&render=explicit'; s.async = true; s.defer = true;
  document.head.append(s);

  const clear = (name: string) => {
    const err = form.querySelector<HTMLElement>(`[data-err="${name}"]`); if (err) err.textContent = '';
    form.querySelector(`[name="${name}"]`)?.removeAttribute('aria-invalid');
  };
  // Once a visitor edits a flagged field, stop shouting at them about it.
  form.addEventListener('input', (e) => { const t = e.target as HTMLInputElement; if (t.name && t.hasAttribute('aria-invalid')) clear(t.name); });
  const showErrors = (errors: Record<string, string>, message: string) => {
    for (const [k, m] of Object.entries(errors)) {
      const el = form.querySelector<HTMLElement>(`[data-err="${k}"]`); if (el) el.textContent = m;
      form.querySelector(`[name="${k}"]`)?.setAttribute('aria-invalid', 'true');
    }
    status.textContent = message;
    form.querySelector<HTMLElement>('[aria-invalid]')?.focus();
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    form.querySelectorAll<HTMLElement>('[data-err]').forEach((el) => clear(el.dataset.err!));
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    // Same rules as the server, so an empty or mistyped form never costs a round trip.
    const v = validateLead(data);
    if (!v.ok) return showErrors(v.errors, 'Please check the highlighted fields.');
    // aria-disabled, not disabled: a disabled button drops keyboard focus to <body>.
    busy = true; btn.setAttribute('aria-disabled', 'true'); status.textContent = 'Sending…';
    try {
      const res = await fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...data, token }) });
      const out = (await res.json()) as { ok: boolean; errors?: Record<string, string>; message?: string };
      if (out.ok) {
        const sent = Object.assign(document.createElement('p'), { className: 'sent', tabIndex: -1, textContent: 'Thank you. Your message reached us. Himanshu will reply within one business day.' });
        form.replaceChildren(sent); sent.focus();
        return;
      }
      showErrors(out.errors ?? {}, out.message || FALLBACK);
    } catch { status.textContent = FALLBACK; }
    finally { busy = false; btn.removeAttribute('aria-disabled'); token = ''; window.turnstile?.reset(widget); }
  });
}
export {};
