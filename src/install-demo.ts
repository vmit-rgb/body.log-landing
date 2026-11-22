/*
 * Beta 1.0.1 (FIXES-1.0.1.md, B4; Olesia, 2026-11-22): a drawn phone under the
 * install steps of each tab, showing the same steps. Moved from the workspace's
 * INSTALL-ANIMATIONS.src.html. The steps are said once, in the text above
 * (Olesia: the animation has no captions of its own); the phone is aria-hidden.
 * Known and allowed (Olesia): the system menus' item names may differ from a
 * real phone, iOS 26's ⋯ is drawn on the right.
 * No pause / next / restart buttons (Olesia, 2026-11-22): «перейти в застосунок»
 * comes right under the phone. «reduce motion»: no phones, the text is enough.
 */

export type DemoLang = 'uk' | 'en';
type Words = Readonly<Record<DemoLang, string>>;
type Variant = 'android' | 'ios26' | 'old';

interface Step {
  /** The layers shown, bottom first. */
  readonly layers: readonly string[];
  /** What the finger taps (`data-t`); none: the screen holds for a while. */
  readonly tap?: string;
  readonly hold?: number;
  /** The share sheet scrolls down to «на початковий екран». */
  readonly scroll?: boolean;
  /** «> лиши увімкненим» under the switch. */
  readonly hint?: boolean;
  /** The icon lands on the home screen. */
  readonly land?: boolean;
}

/** The landing's and the app's durations (MICROINTERACTIONS.md). */
const T = { t1: 120, t2: 240, t3: 360, t4: 420, t5: 720, t6: 1200 } as const;

const FLOWS: Record<Variant, readonly Step[]> = {
  android: [
    { layers: ['page'], hold: T.t6 },
    { layers: ['page'], tap: 'a-dots' },
    { layers: ['page', 'scrim', 'menu'], tap: 'a-install' },
    { layers: ['page', 'scrim', 'dialog'], tap: 'a-ok' },
    { layers: ['home'], tap: 'a-icon', land: true },
  ],
  ios26: [
    { layers: ['page'], hold: T.t6 },
    { layers: ['page'], tap: 'i-dots' },
    { layers: ['page', 'scrim', 'menu'], tap: 'i-share' },
    { layers: ['page', 'scrim', 'sheet'], scroll: true, tap: 'i-a2hs' },
    { layers: ['page', 'scrim', 'add'], hint: true, tap: 'i-ok' },
    { layers: ['home'], tap: 'i-icon', land: true },
  ],
  old: [
    { layers: ['page'], hold: T.t6 },
    { layers: ['page'], tap: 'i-share-old' },
    { layers: ['page', 'scrim', 'sheet'], scroll: true, tap: 'i-a2hs' },
    { layers: ['page', 'scrim', 'add'], tap: 'i-ok' },
    { layers: ['home'], tap: 'i-icon', land: true },
  ],
};

const W = {
  pageTitle: { uk: 'спершу встанови застосунок', en: 'install the app first' },
  pageText: { uk: 'зараз він відкритий у браузері. налаштовуй уже у встановленому.', en: "right now it's open in the browser. set it up in the installed app." },
  pageButton: { uk: 'як встановити', en: 'how to install' },
  newTab: { uk: 'нова вкладка', en: 'new tab' },
  history: { uk: 'історія', en: 'history' },
  downloads: { uk: 'завантаження', en: 'downloads' },
  bookmarks: { uk: 'закладки', en: 'bookmarks' },
  shareDots: { uk: 'поділитися…', en: 'share…' },
  installApp: { uk: 'встановити застосунок', en: 'install app' },
  desktop: { uk: 'версія для компʼютера', en: 'desktop site' },
  installAsk: { uk: 'встановити застосунок?', en: 'install app?' },
  cancel: { uk: 'скасувати', en: 'cancel' },
  install: { uk: 'встановити', en: 'install' },
  share: { uk: 'поділитися', en: 'share' },
  addBookmark: { uk: 'додати закладку', en: 'add bookmark' },
  allTabs: { uk: 'усі вкладки', en: 'all tabs' },
  copy: { uk: 'скопіювати', en: 'copy' },
  readingList: { uk: 'додати до списку читання', en: 'add to reading list' },
  favourites: { uk: 'додати у вибране', en: 'add to favourites' },
  find: { uk: 'знайти на сторінці', en: 'find on page' },
  homeScreen: { uk: 'на початковий екран', en: 'add to home screen' },
  markup: { uk: 'розмітка', en: 'markup' },
  add: { uk: 'додати', en: 'add' },
  webApp: { uk: 'відкрити як вебзастосунок', en: 'open as web app' },
  leaveOn: { uk: '> лиши увімкненим', en: '> leave it on' },
  loading: { uk: 'завантажую…', en: 'loading…' },
  older: { uk: 'старіша', en: 'older' },
  pause: { uk: 'пауза анімації', en: 'pause the animation' },
  version: { uk: 'версія iOS', en: 'iOS version' },
} satisfies Record<string, Words>;

/** The app's own loading spinner: nine cells of | / - \ (body.log index.html #loading). */
const SPINNER = `<div class="ld">${'<span><b>|\n/\n-\n\\</b></span>'.repeat(9)}</div>`;

/** The browser page with body.log in it; `top` and `bottom` are the browser's own bars. */
function page(say: (w: Words) => string, top: string, bottom = ''): string {
  return `
    <div class="layer on" data-l="page">
      ${top}
      <div class="pagebody">
        <div class="pb-brand">body.log</div>
        <div class="pb-h">${say(W.pageTitle)}</div>
        <div class="pb-p">${say(W.pageText)}</div>
        <div class="bar-sk bar-sk--80"></div><div class="bar-sk bar-sk--60"></div>
        <div class="pb-btn">${say(W.pageButton)}</div>
        <div class="pb-shot"></div>
      </div>
      ${bottom}
    </div>`;
}

function home(icon: string, tap: string): string {
  const blank = '<div class="app"><span></span></div>';
  return `
    <div class="layer home" data-l="home">
      <div class="status"><span>9:42</span><i>▴ ▮</i></div>
      <div class="grid">
        ${blank.repeat(6)}<div class="app bl" data-t="${tap}"><img src="${icon}" alt=""><b>body.log</b></div>${blank}
      </div>
    </div>`;
}

function splash(say: (w: Words) => string): string {
  return `<div class="layer splash" data-l="splash">${SPINNER}<span class="ld-t">${say(W.loading)}</span></div>`;
}

function androidPhone(say: (w: Words) => string, icon: string): string {
  const item = (w: Words, tap = '') => `<div class="it"${tap ? ` data-t="${tap}"` : ''}>${say(w)}</div>`;
  return `
    <div class="phone" data-variant="android" aria-hidden="true"><div class="screen">
      ${page(say, `<div class="status status--sys"><span>9:41</span><i>▴ ▮</i></div>
      <div class="chrome"><span class="ico">⌂</span><span class="url">vmit-rgb.github.io/body.log</span><span class="ico" data-t="a-dots">⋮</span></div>`)}
      <div class="layer scrim" data-l="scrim"></div>
      <div class="layer menu a-menu" data-l="menu"><div class="box">
        ${item(W.newTab)}${item(W.history)}${item(W.downloads)}${item(W.bookmarks)}${item(W.shareDots)}${item(W.installApp, 'a-install')}${item(W.desktop)}
      </div></div>
      <div class="layer dialog" data-l="dialog"><div class="box">
        <div class="d-title">${say(W.installAsk)}</div>
        <div class="d-app"><img src="${icon}" alt=""><div>body.log<small>vmit-rgb.github.io</small></div></div>
        <div class="d-btns"><span>${say(W.cancel)}</span><span class="d-ok" data-t="a-ok">${say(W.install)}</span></div>
      </div></div>
      ${home(icon, 'a-icon')}
      ${splash(say)}
      <div class="finger"></div>
    </div></div>`;
}

function iphonePhone(say: (w: Words) => string, icon: string): string {
  const row = (w: Words, mark: string, tap = '') => `<div class="it"${tap ? ` data-t="${tap}"` : ''}><span>${say(w)}</span><span>${mark}</span></div>`;
  return `
    <div class="phone" data-variant="ios26" aria-hidden="true"><div class="screen">
      ${page(say, '<div class="status"><span>9:41</span><i>▴ ▮</i></div>', `
      <div class="ios26"><span class="circ">‹</span><span class="pill">body.log</span><span class="circ" data-t="i-dots">⋯</span></div>
      <div class="iosOld"><div class="addr">vmit-rgb.github.io</div><div class="tools"><span>‹</span><span class="tools__off">›</span><span data-t="i-share-old">⍐</span><span>◫</span><span>⧉</span></div></div>`)}
      <div class="layer scrim" data-l="scrim"></div>
      <div class="layer menu i-menu" data-l="menu"><div class="box">
        ${row(W.share, '⍐', 'i-share')}${row(W.addBookmark, '◫')}${row(W.allTabs, '⧉')}${row(W.newTab, '+')}
      </div></div>
      <div class="layer sheet" data-l="sheet"><div class="panel">
        <div class="grab"></div>
        <div class="sh-head"><img src="${icon}" alt=""><div><b>body.log</b><small>vmit-rgb.github.io</small></div></div>
        <div class="sh-apps"><span></span><span></span><span></span><span></span><span></span></div>
        <div class="sh-viewport"><div class="sh-list">
          ${row(W.copy, '⎘')}${row(W.readingList, '◌')}${row(W.addBookmark, '◫')}${row(W.favourites, '☆')}${row(W.find, '⌕')}${row(W.homeScreen, '⊞', 'i-a2hs')}${row(W.markup, '✎')}
        </div></div>
      </div></div>
      <div class="layer add" data-l="add"><div class="panel">
        <div class="a-top"><span>${say(W.cancel)}</span><b>${say(W.homeScreen)}</b><span class="a-ok" data-t="i-ok">${say(W.add)}</span></div>
        <div class="a-row"><img src="${icon}" alt=""><div>body.log<small>vmit-rgb.github.io</small></div></div>
        <div class="a-toggle v26"><span>${say(W.webApp)}</span><span class="sw"></span></div>
        <div class="hint v26">${say(W.leaveOn)}</div>
      </div></div>
      ${home(icon, 'i-icon')}
      ${splash(say)}
      <div class="finger"></div>
    </div></div>`;
}

/**
 * The iPhone's iOS 26 / older switch. No pause / next / restart (Olesia, 2026-11-22:
 * «перейти в застосунок» comes right under the phone instead).
 */
function controls(say: (w: Words) => string, withVariants: boolean): string {
  return withVariants
    ? `<div class="demo-seg" role="group" aria-label="${say(W.version)}"><button type="button" data-variant="ios26" aria-pressed="true">iOS 26</button><button type="button" data-variant="old" aria-pressed="false">${say(W.older)}</button></div>`
    : '';
}

/*
 * The iPhone switch changes in stripes like the android / iphone tabs (stripes.ts
 * tabFlow; MICROINTERACTIONS.md «таби експорту»; Olesia, 2026-11-22): the accent fill
 * breaks into uneven stripes of the light neutral, they thin out and gather under the
 * other button; the labels change colour halfway. 360 ms: each stripe 270 and up to
 * 90 later by its place. Side by side the stripes stand upright, one above the other they lie across.
 */
const STRIPE_LAG = 90;
const STRIPE_RUN = 270;

/** Uneven sizes, wide and narrow bars mixed, as in the tabs. */
function stripeCuts(n: number): { start: number; size: number }[] {
  const sizes = Array.from({ length: n }, () => 0.55 + Math.random() * 1.1);
  const sum = sizes.reduce((a, b) => a + b, 0);
  let at = 0;
  return sizes.map((size) => {
    const cut = { start: at / sum, size: size / sum };
    at += size;
    return cut;
  });
}

/** The light neutral of the tabs' stripes: ink and page, 72 : 28. */
function stripeTone(css: CSSStyleDeclaration): string {
  const hex = (value: string) => (/^#[0-9a-f]{6}$/i.test(value) ? [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)) : null);
  const ink = hex(css.getPropertyValue('--ink').trim());
  const bg = hex(css.getPropertyValue('--bg').trim());
  if (!ink || !bg) return 'rgb(185 179 189)';
  return `rgb(${ink.map((v, i) => Math.round(v * 0.72 + bg[i]! * 0.28)).join(' ')})`;
}

/** `from` was chosen, `to` is now (call after aria-pressed changed): the fill flows from one to the other. */
function switchStripes(group: HTMLElement, from: HTMLElement, to: HTMLElement): void {
  if (typeof group.animate !== 'function') return;
  group.querySelector(':scope > .demo-stripes')?.remove();
  const across = from.offsetTop !== to.offsetTop;
  const startOf = (el: HTMLElement) => (across ? el.offsetTop : el.offsetLeft);
  const sizeOf = (el: HTMLElement) => (across ? el.offsetHeight : el.offsetWidth);
  const length = (across ? group.offsetHeight : group.offsetWidth) || 1;
  const scale = across ? 'scaleY' : 'scaleX';
  const over = (el: HTMLElement) => (p: number) => p * length >= startOf(el) && p * length <= startOf(el) + sizeOf(el);
  const [was, will] = [over(from), over(to)];
  const accent = getComputedStyle(group).getPropertyValue('--accent').trim();
  const tone = stripeTone(getComputedStyle(document.documentElement));
  const down = startOf(to) > startOf(from);
  const box = document.createElement('span');
  box.className = 'demo-stripes';
  box.setAttribute('aria-hidden', 'true');
  group.append(box);
  group.classList.add('demo-run');
  const n = Math.max(6, Math.round(length / 12));
  const runs = stripeCuts(n).map(({ start, size }) => {
    const stripe = document.createElement('i');
    stripe.style[across ? 'top' : 'left'] = `${start * 100}%`;
    stripe.style[across ? 'height' : 'width'] = `${size * 100 + 0.3}%`;
    stripe.style[across ? 'left' : 'top'] = '0';
    stripe.style[across ? 'right' : 'bottom'] = '0';
    box.append(stripe);
    const mid = start + size / 2;
    const thin = (least: number, spread: number) => `${scale}(${(least + Math.random() * spread).toFixed(2)})`;
    return stripe.animate([
      { backgroundColor: accent, opacity: was(mid) ? 1 : 0, transform: `${scale}(1)` },
      { backgroundColor: tone, opacity: 1, transform: thin(0.5, 0.35), offset: 0.35 },
      { backgroundColor: tone, opacity: 1, transform: thin(0.25, 0.35), offset: 0.7 },
      { backgroundColor: accent, opacity: will(mid) ? 1 : 0, transform: `${scale}(1)` },
    ], { duration: STRIPE_RUN, delay: Math.round((down ? mid : 1 - mid) * STRIPE_LAG), easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'both' });
  });
  void Promise.all(runs.map((run) => run.finished.catch(() => undefined))).then(() => {
    if (!box.isConnected) return;
    box.remove();
    group.classList.remove('demo-run');
  });
  const [off, on] = [getComputedStyle(from).color, getComputedStyle(to).color];
  const swap = (el: HTMLElement, a: string, b: string) => el.animate([{ color: a }, { color: a, offset: 0.5 }, { color: b, offset: 0.51 }, { color: b }], { duration: STRIPE_LAG + STRIPE_RUN });
  swap(to, off, on);
  swap(from, on, off);
}

export interface DemoPlayer {
  /** Plays from the start while its tab is shown; stops when it is hidden. */
  show(on: boolean): void;
}

function makePlayer(card: HTMLElement, first: Variant): DemoPlayer {
  const q = <T extends Element>(selector: string) => card.querySelector<T>(selector)!;
  const phone = q<HTMLElement>('.phone');
  const screen = q<HTMLElement>('.screen');
  const finger = q<HTMLElement>('.finger');
  const homeLayer = q<HTMLElement>('[data-l="home"]');
  const list = card.querySelector<HTMLElement>('.sh-list');
  const hint = card.querySelector<HTMLElement>('.hint');
  const splashLayer = q<HTMLElement>('.splash');
  let variant: Variant = first;
  /** Each play gets a number; an older one stops at its next wait. */
  let run = 0;
  let shown = false;
  /** The step on screen, and whether a tap on the phone paused it (Olesia, 2026-11-22). */
  let at = 0;
  let paused = false;

  const steps = () => FLOWS[variant];
  const wait = (ms: number, mine: number) => new Promise<boolean>((done) => setTimeout(() => done(mine === run && shown && !paused), ms));
  const setLayers = (names: readonly string[]) => {
    card.querySelectorAll<HTMLElement>('.layer').forEach((layer) => layer.classList.toggle('on', names.includes(layer.dataset.l!)));
  };
  const clearHits = () => card.querySelectorAll('.hit').forEach((hit) => hit.classList.remove('hit'));
  // the iOS 26 and older bars share one layer: the one drawn now
  const target = (id: string) => [...card.querySelectorAll<HTMLElement>(`[data-t="${id}"]`)].find((el) => el.offsetParent !== null || el.getClientRects().length > 0)
    ?? card.querySelector<HTMLElement>(`[data-t="${id}"]`);
  const moveFinger = (el: HTMLElement) => {
    const s = screen.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    // narrow screens draw the phone smaller (zoom): measured pixels back to the phone's own
    const scale = screen.offsetWidth ? s.width / screen.offsetWidth : 1;
    finger.style.left = `${(r.left - s.left + r.width / 2) / scale}px`;
    finger.style.top = `${(r.top - s.top + r.height / 2) / scale}px`;
  };

  async function play(k: number): Promise<void> {
    const mine = ++run;
    at = k;
    clearHits();
    splashLayer.classList.remove('melt');
    const step = steps()[k]!;
    if (list) list.style.transform = 'translateY(0)';
    hint?.classList.remove('on');
    if (!step.land) homeLayer.classList.remove('landed');
    finger.classList.remove('press');
    setLayers(step.layers);
    if (step.land) {
      if (!await wait(T.t3, mine)) return;
      homeLayer.classList.add('landed');
    }
    if (step.scroll && list) {
      if (!await wait(T.t5, mine)) return;
      list.style.transform = 'translateY(-96px)';
    }
    if (step.hint && hint) {
      if (!await wait(T.t3, mine)) return;
      hint.classList.add('on');
    }
    if (!step.tap) {
      finger.classList.remove('show');
      if (!await wait(step.hold ?? T.t6, mine)) return;
    } else {
      if (!await wait(T.t5, mine)) return;
      const el = target(step.tap);
      if (el) {
        moveFinger(el);
        finger.classList.add('show');
      }
      if (!await wait(T.t4, mine)) return;
      finger.classList.add('press');
      el?.classList.add('hit');
      if (!await wait(T.t2, mine)) return;
      finger.classList.remove('press');
      if (!await wait(T.t6, mine)) return;
    }
    if (k < steps().length - 1) return play(k + 1);
    // the app opens on its real loading screen, the spinner melts (body.log ui/boot.ts), and it starts over
    finger.classList.remove('show');
    clearHits();
    setLayers(['splash']);
    if (!await wait(T.t6 * 2, mine)) return;
    splashLayer.classList.add('melt');
    if (!await wait(T.t3 + T.t5, mine)) return;
    splashLayer.classList.remove('melt');
    void play(0);
  }

  // a tap on the phone (or Enter / Space on it) pauses and goes on from the same step: WCAG 2.2.2
  const stage = q<HTMLElement>('.stage');
  const setPaused = (next: boolean) => {
    paused = next;
    stage.setAttribute('aria-pressed', String(next));
    if (next) run++;
    else void play(at);
  };
  stage.addEventListener('click', () => setPaused(!paused));
  stage.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setPaused(!paused);
  });

  card.querySelectorAll<HTMLButtonElement>('button[data-variant]').forEach((button) => button.addEventListener('click', () => {
    const was = card.querySelector<HTMLElement>('button[data-variant][aria-pressed="true"]');
    variant = button.dataset.variant as Variant;
    phone.dataset.variant = variant;
    card.querySelectorAll('button[data-variant]').forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
    if (was && was !== button) switchStripes(button.parentElement!, was, button);
    void play(0);
  }));

  return {
    show(on) {
      if (on === shown) return;
      shown = on;
      if (on) void play(0);
      else run++;
    },
  };
}

export interface DemoEnv {
  lang: DemoLang;
  reducedMotion: boolean;
  /** The app's icon, drawn on the phone. */
  icon: string;
}

/**
 * Fills every `[data-install-demo="android|iphone"]` with its phone; returns a player per tab.
 * With «reduce motion» there are no phones at all: without «далі →» a still phone would
 * show only the first step, and the text above says every step (Нитка's choice, 2026-11-22).
 */
export function mountInstallDemos(doc: Document, { lang, reducedMotion, icon }: DemoEnv): Partial<Record<'android' | 'iphone', DemoPlayer>> {
  const say = (w: Words) => w[lang];
  const players: Partial<Record<'android' | 'iphone', DemoPlayer>> = {};
  for (const host of doc.querySelectorAll<HTMLElement>('[data-install-demo]')) {
    if (reducedMotion) {
      host.remove();
      continue;
    }
    const which = host.dataset.installDemo === 'iphone' ? 'iphone' : 'android';
    host.classList.add('install-demo');
    host.innerHTML = `${controls(say, which === 'iphone')}<div class="stage" role="button" tabindex="0" aria-pressed="false" aria-label="${say(W.pause)}">${which === 'iphone' ? iphonePhone(say, icon) : androidPhone(say, icon)}</div>`;
    players[which] = makePlayer(host, which === 'iphone' ? 'ios26' : 'android');
  }
  return players;
}
