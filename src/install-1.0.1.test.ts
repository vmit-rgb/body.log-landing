import { afterEach, describe, expect, it, vi } from 'vitest';
import ukHtml from '../index.html?raw';
import enHtml from '../en/index.html?raw';
import { initLanding } from './landing';
import { mountInstallDemos, type DemoPlayer } from './install-demo';

/* Beta 1.0.1 (FIXES-1.0.1.md, section B; Olesia, 2026-11-22). */

const PAGES = {
  uk: { html: ukHtml, go: 'перейти в застосунок', older: 'старіша', install: 'встановити застосунок' },
  en: { html: enHtml, go: 'go to the app', older: 'older', install: 'install app' },
} as const;
type Lang = keyof typeof PAGES;

function load(lang: Lang): void {
  document.documentElement.innerHTML = PAGES[lang].html.replace(/<script[\s\S]*?<\/script>/g, '');
}

afterEach(() => vi.useRealTimers());

describe.each(['uk', 'en'] as const)('%s page: install step', (lang) => {
  const page = PAGES[lang];

  it('B2: says what this is in one line above the tabs, without «PWA»', () => {
    load(lang);
    const what = document.querySelector<HTMLElement>('.step__what')!;
    expect(what.nextElementSibling!.classList.contains('tabs')).toBe(true);
    expect(what.querySelector('.brand')!.textContent).toBe('body.log');
    expect(what.textContent).toContain('App Store');
    expect(what.textContent).toContain('Instagram');
    expect(what.textContent).not.toMatch(/PWA/i);
  });

  it('B1: each tab holds the steps, the drawn phone, then «перейти в застосунок» as the first-order button', () => {
    load(lang);
    for (const name of ['android', 'iphone']) {
      const panel = document.querySelector<HTMLElement>(`#steps-${name}`)!;
      expect(panel.getAttribute('role')).toBe('tabpanel');
      const [steps, demo, go] = [...panel.children];
      expect(steps!.tagName).toBe('OL');
      expect((demo as HTMLElement).dataset.installDemo).toBe(name);
      expect(go!.classList.contains('button-primary')).toBe(true);
      expect(go!.textContent).toBe(page.go);
      expect(go!.hasAttribute('data-app-link')).toBe(true);
      // the link inside the text stays (Olesia)
      expect(steps!.querySelector('[data-app-link]')).not.toBeNull();
    }
  });

  it('B1: the hero is left as it was', () => {
    load(lang);
    expect(document.querySelector('.section--hero .button-primary')!.getAttribute('href')).toBe('#start');
  });

  it('B3: Android names the app\'s «встановити» and the menu; the iPhone ⋯, the older ⍐ and the switch', () => {
    load(lang);
    const steps = (name: string) => document.querySelector(`#steps-${name} ol`)!.textContent!;
    expect(steps('android')).toContain('⋮');
    expect(steps('android')).toContain(lang === 'uk' ? '«встановити» в застосунку' : '“install” in the app');
    expect(steps('iphone')).toContain('⋯');
    expect(steps('iphone')).toContain('⍐');
    expect(steps('iphone')).toContain(lang === 'uk' ? '«відкрити як вебзастосунок»' : '“open as web app”');
    expect(document.querySelectorAll('#steps-iphone li')).toHaveLength(4);
  });

  it('shows beta 1.0.1 in the footer', () => {
    load(lang);
    expect(document.querySelector('.footer')!.textContent).toContain(lang === 'uk' ? 'бета 1.0.1' : 'beta 1.0.1');
  });
});

describe('the Ukrainian page keeps the letter apostrophe ʼ', () => {
  it('in the new line', () => {
    load('uk');
    expect(document.querySelector('.step__what')!.textContent).toContain('зʼявиться');
  });
});

describe.each(['uk', 'en'] as const)('B4: the install animation, %s', (lang) => {
  const page = PAGES[lang];
  const mount = (reducedMotion = false) => {
    load(lang);
    return mountInstallDemos(document, { lang, reducedMotion, icon: '/favicon.png' });
  };

  it('draws a phone in each tab, hidden from screen readers, with no captions of its own', () => {
    mount();
    for (const name of ['android', 'iphone']) {
      const demo = document.querySelector<HTMLElement>(`[data-install-demo="${name}"]`)!;
      expect(demo.classList.contains('install-demo')).toBe(true);
      expect(demo.querySelector('.phone')!.getAttribute('aria-hidden')).toBe('true');
      expect(demo.querySelector('ol, .caps')).toBeNull();
    }
  });

  it('speaks the page\'s language inside the phone and on the iPhone switch', () => {
    mount();
    const android = document.querySelector('[data-install-demo="android"]')!;
    expect(android.querySelector('[data-t="a-install"]')!.textContent).toBe(page.install);
    expect(document.querySelector('[data-install-demo="iphone"] [data-variant="old"]')!.textContent).toBe(page.older);
    expect(android.querySelector('button[data-variant]')).toBeNull();
  });

  it('has no pause / next / restart: «перейти в застосунок» comes right under the phone (Olesia, 2026-11-22)', () => {
    mount();
    for (const name of ['android', 'iphone']) {
      const demo = document.querySelector<HTMLElement>(`[data-install-demo="${name}"]`)!;
      expect(demo.querySelector('[data-act]')).toBeNull();
      expect(demo.nextElementSibling!.textContent).toBe(page.go);
      expect(demo.nextElementSibling!.classList.contains('button-primary')).toBe(true);
    }
  });

  // the layout (the phone in one place, the switch to its right, centred) is CSS, which jsdom
  // doesn't lay out: checked in headless Chrome at 375 px on 2026-11-22
  it('gives only the iPhone the iOS switch, next to the same phone', () => {
    mount();
    expect(document.querySelector('[data-install-demo="iphone"] .demo-seg')).not.toBeNull();
    expect(document.querySelector('[data-install-demo="android"] .demo-seg')).toBeNull();
    for (const name of ['android', 'iphone']) expect(document.querySelector(`[data-install-demo="${name}"] .stage`)).not.toBeNull();
  });

  it('pauses on a tap on the phone, or Enter, and goes on from the same step', async () => {
    vi.useFakeTimers();
    const demos = mount();
    const android = document.querySelector('[data-install-demo="android"]')!;
    const stage = android.querySelector<HTMLElement>('.stage')!;
    const on = () => [...android.querySelectorAll<HTMLElement>('.layer.on')].map((layer) => layer.dataset.l);
    expect(stage.getAttribute('role')).toBe('button');
    expect(stage.tabIndex).toBe(0);
    expect(stage.getAttribute('aria-label')).toBe(lang === 'uk' ? 'пауза анімації' : 'pause the animation');
    demos.android!.show(true);
    await vi.advanceTimersByTimeAsync(4300);
    expect(on()).toEqual(['page', 'scrim', 'menu']);
    stage.click();
    expect(stage.getAttribute('aria-pressed')).toBe('true');
    await vi.advanceTimersByTimeAsync(20_000);
    expect(on()).toEqual(['page', 'scrim', 'menu']);
    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(stage.getAttribute('aria-pressed')).toBe('false');
    expect(on()).toEqual(['page', 'scrim', 'menu']);
    await vi.advanceTimersByTimeAsync(4000);
    expect(on()).toEqual(['page', 'scrim', 'dialog']);
  });

  it('switches the iPhone between iOS 26 and older', () => {
    mount();
    const iphone = document.querySelector('[data-install-demo="iphone"]')!;
    const phone = iphone.querySelector<HTMLElement>('.phone')!;
    expect(phone.dataset.variant).toBe('ios26');
    iphone.querySelector<HTMLButtonElement>('button[data-variant="old"]')!.click();
    expect(phone.dataset.variant).toBe('old');
    expect(iphone.querySelector('button[data-variant="old"]')!.getAttribute('aria-pressed')).toBe('true');
    expect(iphone.querySelector('button[data-variant="ios26"]')!.getAttribute('aria-pressed')).toBe('false');
  });

  it('plays the shown tab by itself, step after step', async () => {
    vi.useFakeTimers();
    const demos = mount();
    const android = document.querySelector('[data-install-demo="android"]')!;
    const on = () => [...android.querySelectorAll<HTMLElement>('.layer.on')].map((layer) => layer.dataset.l);
    demos.android!.show(true);
    expect(on()).toEqual(['page']);
    await vi.advanceTimersByTimeAsync(1300);
    // step 2 taps ⋮ on the same page, step 3 opens the menu
    await vi.advanceTimersByTimeAsync(3000);
    expect(on()).toEqual(['page', 'scrim', 'menu']);
  });

  it('with «reduce motion» draws no phones: the text steps and the button stay', () => {
    const demos = mount(true);
    expect(document.querySelector('[data-install-demo]')).toBeNull();
    expect(demos).toEqual({});
    for (const name of ['android', 'iphone']) {
      const panel = document.querySelector(`#steps-${name}`)!;
      expect(panel.querySelector('ol')).not.toBeNull();
      expect(panel.querySelector('.button-primary')!.textContent).toBe(page.go);
    }
  });
});

describe('the tabs start and stop the phones', () => {
  it('only the shown tab plays', () => {
    load('uk');
    const shown: string[] = [];
    const player = (name: string): DemoPlayer => ({ show: (on) => { if (on) shown.push(name); else shown.push(`-${name}`); } });
    initLanding(document, 'android', false, undefined, { android: player('android'), iphone: player('iphone') });
    expect(shown).toEqual(['android', '-iphone']);
    shown.length = 0;
    document.querySelector<HTMLButtonElement>('[data-tab="iphone"]')!.click();
    expect(shown).toEqual(['-android', 'iphone']);
  });
});
