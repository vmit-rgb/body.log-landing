import { EASE, MS, STAGGER_MS, canAnimate, glyphs, play, stagger, whenAllDone, whenDone } from './motion';

/*
 * The accordions open and close as in the app (body.log src/ui/accordion.ts,
 * MICROINTERACTIONS.md «акордеони»): the body grows, its rows come in one by
 * one (40 ms, from 8 px below) and a faint glint jumps from the title onto
 * the body and runs down. Closing: rows leave from the bottom up, the body
 * folds upwards, the glint goes back to the title. + turns into − through
 * ASCII frames. Native <details> stays underneath: without motion (or an old
 * browser) the click is left to it.
 */

const CLOSING = 'fx-closing';

/** The glint: a faint gradient jumps from the title onto the body and runs down with it; closing, back up. */
function glint(details: HTMLElement, summary: HTMLElement, open: boolean): void {
  const top = summary.offsetHeight;
  const bottom = Math.max(top, details.offsetHeight - 30);
  const light = document.createElement('span');
  light.className = 'fx-glint';
  light.setAttribute('aria-hidden', 'true');
  details.append(light);
  const run = open
    ? play(light, [{ transform: 'translateY(0)', opacity: 0.9 }, { transform: `translateY(${top}px)`, opacity: 1, offset: 0.12 }, { transform: `translateY(${bottom}px)`, opacity: 0 }], { duration: MS.m, easing: EASE.out })
    : play(light, [{ transform: `translateY(${bottom}px)`, opacity: 0 }, { transform: `translateY(${top}px)`, opacity: 0.9, offset: 0.8 }, { transform: 'translateY(0)', opacity: 0 }], { duration: MS.s, delay: MS.xs, easing: EASE.in });
  whenDone(run, () => light.remove());
}

/** The rows that come in one by one: a body's children, or the text's own paragraphs when it leads. */
function rowsOf(body: HTMLElement): HTMLElement[] {
  return [...body.children].flatMap((child) =>
    child.classList.contains('feature__text') ? [...child.children] : [child],
  ) as HTMLElement[];
}

function cancelAll(el: HTMLElement): void {
  el.getAnimations?.().forEach((run) => run.cancel());
}

function open(details: HTMLDetailsElement, summary: HTMLElement, body: HTMLElement): void {
  details.classList.remove(CLOSING);
  details.open = true;
  body.style.overflow = 'hidden';
  const grow = play(body, [{ height: '0px' }, { height: `${body.scrollHeight}px` }], { duration: MS.m, easing: EASE.out });
  whenDone(grow, () => body.style.removeProperty('overflow'));
  stagger(rowsOf(body));
  glint(details, summary, true);
}

/** Rows leave from the bottom up, the body folds upwards; <details> closes only at the end. */
function close(details: HTMLDetailsElement, summary: HTMLElement, body: HTMLElement): void {
  details.classList.add(CLOSING);
  const rows = rowsOf(body).slice(0, 12);
  const leaving = rows.map((row, i) => play(row, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], {
    duration: MS.xs, delay: (rows.length - 1 - i) * STAGGER_MS, easing: EASE.in, fill: 'forwards',
  }));
  body.style.overflow = 'hidden';
  const fold = play(body, [{ height: `${body.scrollHeight}px` }, { height: '0px' }], { duration: MS.m, delay: MS.xs, easing: EASE.in, fill: 'forwards' });
  glint(details, summary, false);
  whenAllDone([fold], () => {
    // tapped again while folding: open() has taken over
    if (!details.classList.contains(CLOSING)) return;
    details.classList.remove(CLOSING);
    details.open = false;
    body.style.removeProperty('overflow');
    fold?.cancel();
    leaving.forEach((run) => run?.cancel());
  });
}

/** Every <details data-accordion> in `doc` opens and closes with the app's motion. */
export function wireAccordionMotion(doc: Document): void {
  for (const details of doc.querySelectorAll<HTMLDetailsElement>('details[data-accordion]')) {
    const summary = details.querySelector<HTMLElement>(':scope > summary');
    const body = details.querySelector<HTMLElement>(':scope > :not(summary)');
    const icon = summary?.querySelector<HTMLElement>('.icon-pm');
    if (!summary || !body) continue;
    summary.addEventListener('click', (event) => {
      if (!canAnimate(body)) return;
      event.preventDefault();
      const opening = !details.open || details.classList.contains(CLOSING);
      // a fold still running must not close it once cancelled
      details.classList.remove(CLOSING);
      cancelAll(body);
      rowsOf(body).forEach(cancelAll);
      if (opening) open(details, summary, body);
      else close(details, summary, body);
      // + turns into − through ASCII frames
      if (icon) glyphs(icon, opening ? ['*', '=', '-'] : ['=', '*', '+']);
    });
  }
}
