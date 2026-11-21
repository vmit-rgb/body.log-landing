import { EASE, MS, moving, play, whenDone } from './motion';

/*
 * Loading → page, the same as in the app (body.log src/ui/boot.ts,
 * MICROINTERACTIONS.md «завантаження → home», Olesia 2026-11-21): the ASCII
 * spinner of index.html runs while the page loads (shown at least 240 ms, so
 * it doesn't just blink); then its characters fly apart (scale 1.7, spreading)
 * and melt, and the page assembles (reveal.ts). Without motion the loading
 * screen is simply gone. If the script never runs, the CSS in index.html hides
 * it by itself after 6 s.
 */

/**
 * Takes the loading screen away. `sinceStart`: ms since the page began to load
 * (performance.now()). Returns after how many ms the page should come in.
 */
export function leaveLoading(doc: Document, sinceStart: number): number {
  const layer = doc.getElementById('loading');
  if (!layer) return 0;
  if (!moving() || typeof layer.animate !== 'function') {
    layer.remove();
    return 0;
  }
  // the page under it is ready: taps go through at once
  layer.style.pointerEvents = 'none';
  layer.removeAttribute('role');
  const wait = Math.max(0, Math.round(MS.s - sinceStart));
  const melt = { duration: MS.m, delay: wait, easing: EASE.in, fill: 'forwards' } as const;
  play(layer.querySelector('.ld'), [{ transform: 'none', gap: '2px', opacity: 1 }, { transform: 'scale(1.7)', gap: '14px', opacity: 0 }], melt);
  whenDone(play(layer, [{ opacity: 1 }, { opacity: 0 }], melt), () => layer.remove());
  return wait + MS.s;
}
