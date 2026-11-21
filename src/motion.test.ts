import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ukHtml from '../index.html?raw';
import enHtml from '../en/index.html?raw';
import { leaveLoading } from './boot';
import { initLanding } from './landing';
import { wireReveal } from './reveal';

/**
 * jsdom has no Web Animations API: a stand-in records each animation and
 * finishes it when the test says so.
 */
interface FakeRun {
  el: Element;
  keyframes: Keyframe[];
  onfinish: (() => void) | null;
  oncancel: (() => void) | null;
  cancel: () => void;
}
let runs: FakeRun[] = [];
let reduced = false;

function finishAll(): void {
  // finishing may start nothing new, but copy anyway
  for (const run of [...runs]) run.onfinish?.();
}

beforeEach(() => {
  runs = [];
  reduced = false;
  Element.prototype.animate = function animate(this: Element, keyframes: Keyframe[] | PropertyIndexedKeyframes | null) {
    const run: FakeRun = {
      el: this,
      keyframes: keyframes as Keyframe[],
      onfinish: null,
      oncancel: null,
      cancel: () => run.oncancel?.(),
    };
    runs.push(run);
    return run as unknown as Animation;
  };
  Element.prototype.getAnimations = function getAnimations(this: Element) {
    return runs.filter((run) => run.el === this) as unknown as Animation[];
  };
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduced && query.includes('reduce') }));
});

afterEach(() => {
  delete (Element.prototype as Partial<Element>).animate;
  delete (Element.prototype as Partial<Element>).getAnimations;
  vi.unstubAllGlobals();
});

function load(): void {
  document.documentElement.innerHTML = ukHtml.replace(/<script[\s\S]*?<\/script>/g, '');
  initLanding(document, 'android', false, {
    load: () => Promise.resolve({ version: '0.1', text: 'prompt' }),
    clipboard: { writeText: () => Promise.resolve() },
  });
}

const second = () => document.querySelectorAll<HTMLDetailsElement>('details[data-accordion]')[1]!;
const first = () => document.querySelector<HTMLDetailsElement>('details[data-accordion]')!;
const summaryOf = (d: HTMLDetailsElement) => d.querySelector<HTMLElement>(':scope > summary')!;
const bodyOf = (d: HTMLDetailsElement) => d.querySelector<HTMLElement>(':scope > :not(summary)')!;

describe('accordions with motion', () => {
  it('open at once and grow the body from 0, with a glint and + → − frames', () => {
    load();
    summaryOf(second()).click();
    expect(second().open).toBe(true);
    const grow = runs.find((run) => run.el === bodyOf(second()));
    expect(grow?.keyframes[0]).toEqual({ height: '0px' });
    expect(second().querySelector('.fx-glint')).not.toBeNull();
    expect(summaryOf(second()).querySelector<HTMLElement>('.icon-pm')!.dataset.g).toBe('*');
  });

  it('stay open while folding and close when the fold ends', () => {
    load();
    summaryOf(first()).click();
    expect(first().open).toBe(true);
    expect(first().classList.contains('fx-closing')).toBe(true);
    finishAll();
    expect(first().open).toBe(false);
    expect(first().classList.contains('fx-closing')).toBe(false);
  });

  it('stay open when tapped again while folding', () => {
    load();
    summaryOf(first()).click();
    summaryOf(first()).click();
    finishAll();
    expect(first().open).toBe(true);
    expect(first().classList.contains('fx-closing')).toBe(false);
  });

  it('leave the click to <details> itself with «reduce motion»', () => {
    reduced = true;
    load();
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    summaryOf(second()).dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
    expect(runs).toHaveLength(0);
  });
});

describe('install tabs with motion', () => {
  it('run the stripes under the tabs and take them away after', () => {
    load();
    document.querySelector<HTMLButtonElement>('[data-tab="iphone"]')!.click();
    const tabs = document.querySelector<HTMLElement>('.tabs')!;
    expect(tabs.classList.contains('fx-run')).toBe(true);
    expect(tabs.querySelectorAll('.fx-stripes > i').length).toBeGreaterThanOrEqual(6);
    finishAll();
    expect(tabs.querySelector('.fx-stripes')).toBeNull();
    expect(tabs.classList.contains('fx-run')).toBe(false);
  });

  it('do nothing when the tab already chosen is tapped', () => {
    load();
    document.querySelector<HTMLButtonElement>('[data-tab="android"]')!.click();
    expect(runs).toHaveLength(0);
  });
});

describe('toast with motion', () => {
  it('slides in, then hides only when the slide out ends', async () => {
    load();
    document.querySelector<HTMLButtonElement>('[data-copy-prompt]')!.click();
    const toast = document.querySelector<HTMLElement>('.toast')!;
    await vi.waitFor(() => expect(toast.hidden).toBe(false));
    expect(toast.textContent).toContain('промпт 0.1 скопійовано');
    document.querySelector<HTMLButtonElement>('.toast__close')!.click();
    expect(toast.hidden).toBe(false);
    finishAll();
    expect(toast.hidden).toBe(true);
  });
});

describe('sections coming into view', () => {
  it('hide nothing with «reduce motion»', () => {
    reduced = true;
    load();
    wireReveal(document);
    expect(document.querySelectorAll('.fx-waiting')).toHaveLength(0);
  });
});

describe('loading screen (as in the app)', () => {
  it('is in both pages, in their language, with the same two noise layers as the app', () => {
    for (const [html, text] of [[ukHtml, 'завантажую…'], [enHtml, 'loading…']] as const) {
      expect(html).toContain(`<span class="ld-t">${text}</span>`);
      expect(html.match(/<span><b>\|\n\/\n-\n\\<\/b><\/span>/g)).toHaveLength(9);
      expect(html).toContain('<div class="noise noise--dark" aria-hidden="true"></div>');
    }
  });

  it('stays at least 240 ms, then flies apart and melts; the page comes in after it', () => {
    load();
    const after = leaveLoading(document, 100);
    expect(after).toBe(140 + 240);
    const layer = document.getElementById('loading')!;
    expect(layer.style.pointerEvents).toBe('none');
    const spread = runs.find((run) => run.el === layer.querySelector('.ld'));
    expect(spread?.keyframes[1]).toMatchObject({ transform: 'scale(1.7)', opacity: 0 });
    finishAll();
    expect(document.getElementById('loading')).toBeNull();
  });

  it('is simply gone with «reduce motion»', () => {
    reduced = true;
    load();
    expect(leaveLoading(document, 0)).toBe(0);
    expect(document.getElementById('loading')).toBeNull();
  });
});
