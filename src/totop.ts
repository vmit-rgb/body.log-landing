import { EASE, MS, moving, play, whenDone } from './motion';

/*
 * «вгору», as in the app (body.log src/screens/bar.ts, Figma button/to-top
 * 288:10620): a round button bottom right that floats once the page is
 * scrolled down, and takes you back to the top. The landing has no bar,
 * so only the scroll decides.
 */

/** Scrolled this far down, the button shows (the app's threshold). */
export const TO_TOP_FROM = 500;

export function toTopShown(y: number): boolean {
  return y > TO_TOP_FROM;
}

/** Comes in with a fade and a small scale (240 ms), goes faster (120 ms), as the app's fadeShown. */
function fade(el: HTMLElement, shown: boolean, state: { shown: boolean }): void {
  if (shown === state.shown) return;
  state.shown = shown;
  el.getAnimations?.().forEach((run) => run.cancel());
  if (shown) {
    el.hidden = false;
    play(el, [{ opacity: 0, transform: 'scale(.86)' }, { opacity: 1, transform: 'none' }], { duration: MS.s, easing: EASE.out });
    return;
  }
  const out = play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: MS.xs, easing: EASE.in, fill: 'forwards' });
  whenDone(out, () => {
    if (state.shown) return;
    el.hidden = true;
    out?.cancel();
  });
}

export function wireToTop(doc: Document): void {
  const button = doc.querySelector<HTMLButtonElement>('.to-top');
  const win = doc.defaultView;
  if (!button || !win) return;
  const state = { shown: !button.hidden };
  const update = () => fade(button, toTopShown(win.scrollY), state);
  win.addEventListener('scroll', update, { passive: true });
  update();
  button.addEventListener('click', () => {
    win.scrollTo({ top: 0, behavior: moving() ? 'smooth' : 'auto' });
  });
}
