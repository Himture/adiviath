// GA loads only after an explicit Accept. No Google request is made before that, and a Decline or a withdrawal clears _ga cookies.
const VERSION = 1; // bump when the privacy policy changes to ask again
const KEY = 'adv-consent';
const bar = document.querySelector<HTMLElement>('[data-consent]');
type Choice = { v: number; c: 'granted' | 'denied' };
type Gtag = { dataLayer: unknown[]; gtag: (...a: unknown[]) => void };
const w = window as unknown as Gtag;
const read = (): Choice | null => { try { const x = JSON.parse(localStorage.getItem(KEY) ?? 'null'); return x?.v === VERSION ? x : null; } catch { return null; } };
const write = (c: Choice['c']) => { try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, c })); } catch { /* storage blocked: ask again next visit */ } };
const clearGa = () => document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => n.startsWith('_ga')).forEach((n) => {
  for (const d of ['', location.hostname, location.hostname.replace(/^www\./, '.')]) document.cookie = `${n}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`;
});
function loadGa(id: string) {
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () { w.dataLayer.push(arguments); };
  w.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
  w.gtag('js', new Date()); w.gtag('config', id, { anonymize_ip: true });
  const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`; document.head.append(s);
}
if (bar) {
  const id = bar.dataset.ga!;
  const choice = read();
  if (choice?.c === 'granted') loadGa(id); else if (!choice) bar.hidden = false;
  bar.addEventListener('click', (e) => {
    const c = (e.target as HTMLElement).closest<HTMLElement>('[data-choice]')?.dataset.choice as Choice['c'] | undefined;
    if (!c) return;
    const was = read()?.c;
    write(c); bar.hidden = true;
    if (c === 'granted' && was !== 'granted') loadGa(id);
    if (c === 'denied') {
      if (w.gtag) w.gtag('consent', 'update', { analytics_storage: 'denied' });
      clearGa();
      if (was === 'granted') location.reload(); // the only way to unload a running gtag
    }
  });
  const open = document.querySelector<HTMLButtonElement>('[data-consent-open]');
  if (open) { open.hidden = false; open.addEventListener('click', () => { bar.hidden = false; bar.focus(); }); }
}
export {};
