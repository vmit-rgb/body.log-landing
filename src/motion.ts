/*
 * Motion of the landing, the same as in the app (body.log src/ui/motion.ts,
 * MICROINTERACTIONS.md in the workspace). No library: the Web Animations API
 * and CSS. Durations only from the scale 120 / 240 / 360 / 420 / 720 / 1200;
 * the stagger step and glyph frames are steps, not durations.
 * With the phone's «reduce motion» nothing moves.
 */

export const MS = { xs: 120, s: 240, m: 360, l: 420, xl: 720, xxl: 1200 } as const;
/** Between the items that come in one by one. */
export const STAGGER_MS = 40;
/** One glyph frame of + → −. */
export const FRAME_MS = 80;

export const EASE = {
  out: 'cubic-bezier(.2,.8,.2,1)',
  in: 'cubic-bezier(.4,0,1,1)',
  spring: 'cubic-bezier(.34,1.56,.64,1)',
} as const;

/** Motion is allowed: the phone doesn't ask to reduce it. */
export function moving(): boolean {
  return !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Whether `el` can animate right now (motion allowed and the browser has the Web Animations API). */
export function canAnimate(el: Element | null | undefined): boolean {
  return !!el && typeof el.animate === 'function' && moving();
}

/** Plays the keyframes when motion is allowed and the browser can; null otherwise. */
export function play(el: Element | null | undefined, keyframes: Keyframe[], options: KeyframeAnimationOptions): Animation | null {
  if (!el || !canAnimate(el)) return null;
  return el.animate(keyframes, options);
}

/** Runs `done` once, when the animation ends or is cancelled; at once when nothing plays. */
export function whenDone(run: Animation | null, done: () => void): void {
  if (!run) {
    done();
    return;
  }
  let ran = false;
  run.onfinish = run.oncancel = () => {
    if (ran) return;
    ran = true;
    done();
  };
}

/** Runs `done` once every animation has ended. */
export function whenAllDone(runs: readonly (Animation | null)[], done: () => void): void {
  let left = runs.length;
  if (left === 0) return done();
  for (const run of runs) {
    whenDone(run, () => {
      left -= 1;
      if (left === 0) done();
    });
  }
}

/** The small spring after a tap (no decode on ordinary buttons). */
export function pop(el: Element | null | undefined, scale = 1.06): void {
  play(el, [{ transform: 'scale(1)' }, { transform: `scale(${scale})`, offset: 0.45 }, { transform: 'scale(1)' }], { duration: MS.s, easing: EASE.spring });
}

/** The interface assembles before the eyes: items one by one, 40 ms apart, from `rise` px below. */
export function stagger(items: readonly Element[], rise = 8, duration: number = MS.s): Animation[] {
  return items.slice(0, 12).flatMap((item, i) => {
    const run = play(item, [{ opacity: 0, transform: `translateY(${rise}px)` }, { opacity: 1, transform: 'none' }], {
      duration, delay: i * STAGGER_MS, easing: EASE.out, fill: 'backwards',
    });
    return run ? [run] : [];
  });
}

const glyphTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

/**
 * Shows text frames in `data-g` (the CSS draws them instead of the usual look),
 * 80 ms each with a fade, then the drawn state comes back. A new run replaces one still going.
 */
export function glyphs(el: HTMLElement, frames: readonly string[]): void {
  clearTimeout(glyphTimers.get(el));
  if (!moving()) {
    delete el.dataset.g;
    return;
  }
  const step = (i: number) => {
    const frame = frames[i];
    if (frame === undefined) {
      delete el.dataset.g;
      return;
    }
    el.dataset.g = frame;
    play(el, [{ opacity: 0.35 }, { opacity: 1 }], { duration: FRAME_MS, easing: EASE.out });
    glyphTimers.set(el, setTimeout(() => step(i + 1), FRAME_MS));
  };
  step(0);
}

/** Letter by letter within 360 ms; an element inside comes in whole, as one letter. */
export function typeIn(el: HTMLElement): void {
  if (!canAnimate(el)) return;
  const parts: Element[] = [];
  for (const node of [...el.childNodes]) {
    if (node instanceof Element) {
      parts.push(node);
      continue;
    }
    const letters = [...(node.textContent ?? '')].map((letter) => {
      const span = document.createElement('span');
      span.className = 'fx-ch';
      span.textContent = letter;
      return span;
    });
    node.replaceWith(...letters);
    parts.push(...letters);
  }
  const step = parts.length > 1 ? Math.min(MS.m, parts.length * 14) / (parts.length - 1) : 0;
  parts.forEach((part, i) => {
    play(part, [{ opacity: 0 }, { opacity: 1 }], { duration: MS.xs, delay: Math.round(step * i), easing: EASE.out, fill: 'backwards' });
  });
}
