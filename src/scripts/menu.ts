// The phone menu is a plain <details>, so it works without JavaScript. This adds the two things users expect from a
// menu: Escape closes it and returns focus to its button, and a click outside closes it.
const menu = document.querySelector<HTMLDetailsElement>('details.menu');
if (menu) {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !menu.open) return;
    menu.open = false;
    menu.querySelector('summary')!.focus();
  });
  menu.addEventListener('focusout', (event) => {
    if (event.relatedTarget instanceof Node && !menu.contains(event.relatedTarget)) menu.open = false;
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', (event) => { if (event.matches) menu.open = false; });
  document.addEventListener('click', (e) => { if (menu.open && !menu.contains(e.target as Node)) menu.open = false; });
}
