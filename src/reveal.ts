import { MS, canAnimate, stagger } from './motion';

/*
 * The page assembles before the eyes, as the app's home after loading
 * (MICROINTERACTIONS.md «завантаження → home», «stagger»): the header and the
 * hero come in one by one on load; every other section does the same the
 * first time it scrolls into view (fade and a rise of 12 px, 40 ms apart).
 * Only what is waiting is hidden, and only by script: without JS or motion
 * everything simply stands there.
 */

const WAITING = 'fx-waiting';

function partsOf(section: Element): Element[] {
  return [...section.children];
}

function show(section: Element): void {
  const parts = partsOf(section);
  parts.forEach((part) => part.classList.remove(WAITING));
  stagger(parts, 12, MS.m);
}

export function wireReveal(doc: Document): void {
  const main = doc.querySelector('.main');
  if (!main || !canAnimate(main)) return;
  const [hero, ...rest] = [...main.querySelectorAll(':scope > .section')];
  const top = doc.querySelector('.top');
  stagger([...(top ? [top] : []), ...(hero ? partsOf(hero) : [])], 12, MS.m);
  const side = doc.querySelector('.phone-card');
  if (side) stagger([side], 12, MS.m);

  if (typeof IntersectionObserver !== 'function') return;
  const seen = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      seen.unobserve(entry.target);
      show(entry.target);
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  const view = doc.defaultView?.innerHeight ?? 0;
  for (const section of rest) {
    // already on screen (a link to #start, a reload further down): no waiting
    if (section.getBoundingClientRect().top < view) continue;
    partsOf(section).forEach((part) => part.classList.add(WAITING));
    seen.observe(section);
  }
}
