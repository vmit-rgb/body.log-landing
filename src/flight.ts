/*
 * «Політ символів», the ASCII background (Олеся + Нитка / AI). The big
 * version, for the landing only (workspace background-animations/
 * flight-big-landing.html, 2026-11-18; the app has the small one, body.log
 * src/ui/flight.ts). Glyphs fly left → right on three planes: far = small,
 * slow, the accent's quiet shade; mid = its mid shade; near = big, faster,
 * muted text. About one run in five is lit in the accent, its tail fading to
 * mid and quiet. Colours come from tokens.css, so the light theme reaches it.
 *
 * Stands still (one frame) with the phone's «reduce motion»; pauses while
 * the page is hidden. Decor only: hidden from screen readers.
 */

/** Glyphs picked by shape: horizontal and light ones read as motion and fill tails. */
const TAIL = ['-', '-', '·', '.', '_', '~', '=', ':', '‐'];
const BODY = ['-', '=', '~', '+', '*', ':', '/', '\\', '<', '>', '0', '1', 'x', 'o', '·', '"', "'", '^'];
/** The denser ones are kept for heads on the nearer planes. */
const HEAD = ['>', '»', '*', '+', '#', '%', '@', '&', '0', 'o', 'x', '=', '≡', '›'];

type Tone = 'quiet' | 'mid' | 'muted';

export interface Plane {
  /** font size, px */
  readonly size: number;
  /** px per second */
  readonly speed: number;
  /** runs per 10 000 px² of screen */
  readonly dens: number;
  /** shortest and longest run, glyphs */
  readonly len: readonly [number, number];
  readonly tone: Tone;
  readonly litChance: number;
}

/** The big version: sizes 11 / 15 / 22, rows 1.5 em. */
export const PLANES: readonly Plane[] = [
  { size: 11, speed: 16, dens: 1.1, len: [1, 5], tone: 'quiet', litChance: 0.12 },
  { size: 15, speed: 34, dens: 0.55, len: [2, 7], tone: 'mid', litChance: 0.2 },
  { size: 22, speed: 70, dens: 0.17, len: [3, 10], tone: 'muted', litChance: 0.25 },
];

/** Noto Sans Mono's advance is about 0.6 em. */
const ADVANCE = 0.6;
const lineOf = (plane: Plane) => Math.round(plane.size * 1.5);

export interface Run {
  readonly p: number;
  /** index 0 is the head (rightmost, flies first); the rest trail to the left */
  readonly chars: readonly string[];
  readonly lit: boolean;
  /** one glyph's width, px */
  readonly cw: number;
  readonly lh: number;
  readonly row: number;
  readonly y: number;
  x: number;
  readonly v: number;
  readonly alpha: number;
}

export interface Colours {
  readonly bg: string;
  readonly primary: string;
  readonly mid: string;
  readonly quiet: string;
  readonly muted: string;
}

type Random = () => number;

/** A new run on plane `p`: anywhere on the screen (`anywhere`), or waiting off its left edge. */
export function makeRun(p: number, anywhere: boolean, w: number, h: number, others: readonly Run[], random: Random = Math.random): Run {
  const plane = PLANES[p]!;
  const rand = (a: number, b: number) => a + random() * (b - a);
  const pick = (from: readonly string[]) => from[Math.floor(random() * from.length)]!;
  const cw = plane.size * ADVANCE;
  const lh = lineOf(plane);
  const rows = Math.max(1, Math.floor(h / lh));
  const n = Math.max(1, Math.round(rand(plane.len[0], plane.len[1] + 1) - 0.5));
  const lit = random() < plane.litChance;
  const chars: string[] = [];
  for (let i = 0; i < n; i++) chars.push(i === 0 ? pick(p === 0 ? BODY : HEAD) : i > n * 0.35 ? pick(TAIL) : pick(BODY));
  const width = n * cw;
  // one speed per row, so runs on a row never overtake each other and pile up
  let row = 0;
  let x = 0;
  for (let tries = 0; tries < 12; tries++) {
    row = Math.floor(random() * rows);
    x = anywhere ? rand(-width, w + width) : rand(-w * 0.35, 0) - width;
    const free = others.every((o) => o.p !== p || o.row !== row
      || x + cw * 2 < o.x - o.chars.length * o.cw || x - width > o.x + cw * 2);
    if (free) break;
  }
  const rowHash = (((Math.sin(row * 12.9898 + p * 78.233) * 43758.5453) % 1) + 1) % 1;
  return { p, chars, lit, cw, lh, row, y: (row + 0.8) * lh, x, v: plane.speed * (0.8 + 0.45 * rowHash), alpha: rand(0.55, 1) };
}

/** Fills a screen of `w` × `h` px with runs on every plane. */
export function populate(w: number, h: number, random: Random = Math.random): Run[] {
  const runs: Run[] = [];
  PLANES.forEach((plane, p) => {
    const count = Math.round(((w * h) / 10000) * plane.dens);
    for (let i = 0; i < count; i++) runs.push(makeRun(p, true, w, h, runs, random));
  });
  return runs;
}

/** Moves every run by `dt` seconds; a run gone past the right edge comes back from the left. */
export function advance(runs: Run[], dt: number, w: number, h: number, random: Random = Math.random): void {
  for (let k = 0; k < runs.length; k++) {
    const run = runs[k]!;
    run.x += run.v * dt;
    if (run.x - run.chars.length * run.cw > w) runs[k] = makeRun(run.p, false, w, h, runs, random);
  }
}

/** The landing's tokens as colours a canvas takes. */
export function readColours(root: Element): Colours {
  const style = getComputedStyle(root);
  const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    bg: token('--bg', '#161616'),
    primary: token('--accent', '#f573bb'),
    mid: token('--accent-mid', '#bb7e9d'),
    quiet: token('--accent-quiet', '#5b4851'),
    muted: token('--muted', '#c4b1ba'),
  };
}

export function drawFlight(ctx: CanvasRenderingContext2D, runs: readonly Run[], c: Colours, w: number, h: number, font: string): void {
  ctx.globalAlpha = 1;
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.textBaseline = 'alphabetic';
  PLANES.forEach((plane, p) => {
    ctx.font = `400 ${plane.size}px ${font}`;
    const base = c[plane.tone];
    for (const run of runs) {
      if (run.p !== p) continue;
      const n = run.chars.length;
      for (let i = 0; i < n; i++) {
        const x = run.x - i * run.cw;
        if (x < -run.cw || x > w) continue;
        const t = n > 1 ? i / (n - 1) : 0; // 0 head → 1 tail end
        let colour = base;
        let alpha = run.alpha * (1 - t * 0.75);
        if (run.lit) {
          // accent run: bright head, the tail fades through mid to quiet
          colour = t < 0.25 ? c.primary : t < 0.6 ? c.mid : c.quiet;
          alpha = Math.min(1, run.alpha + 0.3) * (1 - t * 0.5);
        }
        if (p > 0) {
          // nearer planes cut a cell out of what is behind them, so overlap reads as depth
          ctx.globalAlpha = 1;
          ctx.fillStyle = c.bg;
          ctx.fillRect(x, run.y - run.lh * 0.8, run.cw, run.lh);
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = colour;
        ctx.fillText(run.chars[i]!, x, run.y);
      }
    }
  });
  ctx.globalAlpha = 1;
}

/** Whether a resize must lay the runs out anew: a new width, or a height change bigger than a phone's address bar. */
export function needsNewRuns(was: { w: number; h: number }, now: { w: number; h: number }): boolean {
  return was.w !== now.w || Math.abs(was.h - now.h) > 160;
}

export interface FlightHost {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  /** the phone's «reduce motion» */
  readonly reducedMotion: { matches: boolean; addEventListener(type: 'change', listener: () => void): void };
  /** the light / dark theme of the system */
  readonly scheme: { addEventListener(type: 'change', listener: () => void): void };
}

/** Starts the background on `canvas`; it follows the system theme and «reduce motion». */
export function startFlight({ root, canvas, reducedMotion, scheme }: FlightHost): void {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;
  const font = getComputedStyle(root).getPropertyValue('--font').trim() || 'monospace';
  let w = 0;
  let h = 0;
  let runs: Run[] = [];
  let colours = readColours(root);
  let frame = 0;
  let last = 0;

  const draw = () => drawFlight(ctx, runs, colours, w, h, font);
  const moves = () => !reducedMotion.matches && document.visibilityState !== 'hidden';
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    advance(runs, dt, w, h);
    draw();
    frame = requestAnimationFrame(tick);
  };
  const run = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    draw();
    if (moves()) {
      frame = requestAnimationFrame((now) => {
        last = now;
        frame = requestAnimationFrame(tick);
      });
    }
  };
  // the canvas is as tall as the largest viewport (CSS 100lvh), so a phone's address bar doesn't reshuffle it
  const resize = () => {
    const now = { w: canvas.clientWidth, h: canvas.clientHeight };
    if (now.w === w && now.h === h) return;
    const fresh = needsNewRuns({ w, h }, now);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ({ w, h } = now);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (fresh) runs = populate(w, h);
    draw();
  };

  reducedMotion.addEventListener('change', run);
  scheme.addEventListener('change', () => {
    colours = readColours(root);
    run();
  });
  document.addEventListener('visibilitychange', run);
  addEventListener('resize', resize);

  const begin = () => {
    resize();
    run();
  };
  const fonts = document.fonts;
  if (fonts) void fonts.load(`22px ${font}`).catch(() => undefined).finally(begin);
  else begin();
}

/** Puts the canvas behind the page and starts it. */
export function mountFlight(doc: Document): void {
  const canvas = doc.createElement('canvas');
  canvas.className = 'flight';
  canvas.setAttribute('aria-hidden', 'true');
  doc.body.prepend(canvas);
  startFlight({
    root: doc.documentElement,
    canvas,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)'),
    scheme: matchMedia('(prefers-color-scheme: dark)'),
  });
}
