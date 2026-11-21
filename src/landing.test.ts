import { beforeEach, describe, expect, it, vi } from 'vitest';
import ukHtml from '../index.html?raw';
import enHtml from '../en/index.html?raw';
import { initLanding, type PromptEnv } from './landing';

const PAGES = {
  uk: {
    html: ukHtml,
    screens: /^\/screens\/[\w-]+\.webp$/,
    copied: 'промпт 0.1 скопійовано',
    failed: 'не вдалося скопіювати',
    codeLink: 'код на github',
    firstFeature: 'під тебе, а не навпаки',
    firstQuestion: 'хто бачить мої записи?',
  },
  en: {
    html: enHtml,
    screens: /^\/screens\/en\/[\w-]+\.webp$/,
    copied: 'prompt 0.1 copied',
    failed: "couldn't copy",
    codeLink: 'code on github',
    firstFeature: 'built around you, not the other way round',
    firstQuestion: 'who sees my entries?',
  },
} as const;
type Lang = keyof typeof PAGES;

const PROMPT_URL = 'https://vmit-rgb.github.io/body.log/prompt.json';
let writeText = vi.fn((_text: string) => Promise.resolve());
let loadPrompt = vi.fn((_url: string) => Promise.resolve({ version: '0.1', text: 'You are helping…' }));
const env = (): PromptEnv => ({ load: loadPrompt, clipboard: { writeText } });

function load(platform: 'android' | 'iphone' | 'unknown', isWide = false, lang: Lang = 'uk', prompt: PromptEnv = env()) {
  document.documentElement.innerHTML = PAGES[lang].html.replace(/<script[\s\S]*?<\/script>/g, '');
  initLanding(document, platform, isWide, prompt);
}

beforeEach(() => {
  writeText = vi.fn((_text: string) => Promise.resolve());
  loadPrompt = vi.fn((_url: string) => Promise.resolve({ version: '0.1', text: 'You are helping…' }));
});

const tab = (name: string) => document.querySelector<HTMLButtonElement>(`[data-tab="${name}"]`)!;
const panel = (name: string) => document.querySelector<HTMLElement>(`#steps-${name}`)!;
const toast = () => document.querySelector<HTMLElement>('.toast')!;

describe('install tabs', () => {
  it('opens the steps for the detected iPhone', () => {
    load('iphone');
    expect(tab('iphone').getAttribute('aria-selected')).toBe('true');
    expect(panel('iphone').hidden).toBe(false);
    expect(panel('android').hidden).toBe(true);
  });

  it('opens the Android steps on a computer', () => {
    load('unknown');
    expect(tab('android').getAttribute('aria-selected')).toBe('true');
    expect(panel('android').hidden).toBe(false);
  });

  it('switches steps when the other tab is tapped', () => {
    load('android');
    tab('iphone').click();
    expect(panel('iphone').hidden).toBe(false);
    expect(panel('android').hidden).toBe(true);
    expect(tab('android').getAttribute('aria-selected')).toBe('false');
    expect(tab('iphone').tabIndex).toBe(0);
    expect(tab('android').tabIndex).toBe(-1);
  });

  it('moves between tabs with the arrow keys', () => {
    load('android');
    tab('android').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(panel('iphone').hidden).toBe(false);
    expect(document.activeElement).toBe(tab('iphone'));
  });

  it('moves back with the left arrow', () => {
    load('iphone');
    tab('iphone').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(panel('android').hidden).toBe(false);
    expect(document.activeElement).toBe(tab('android'));
  });

  it('ignores other keys', () => {
    load('android');
    tab('android').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(panel('android').hidden).toBe(false);
  });

  it('refuses to start on markup without the install tabs', () => {
    document.body.innerHTML = '<main></main>';
    expect(() => initLanding(document, 'android')).toThrow('[data-tab="android"]');
  });
});

describe('copy prompt', () => {
  it.each([
    ['toastCopied', 'data-toast-copied'],
    ['toastFailed', 'data-toast-failed'],
    ['promptSrc', 'data-prompt-src'],
  ])('refuses to start when the button has no %s', (key, attribute) => {
    load('android');
    const button = document.querySelector<HTMLElement>('[data-copy-prompt]')!;
    delete button.dataset[key];
    expect(() => initLanding(document, 'android', false, env())).toThrow(attribute);
  });

  it('fetches the app prompt as the page opens, once', async () => {
    load('android');
    expect(loadPrompt).toHaveBeenCalledWith(PROMPT_URL);
    document.querySelector<HTMLButtonElement>('[data-copy-prompt]')!.click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('You are helping…'));
    expect(loadPrompt).toHaveBeenCalledTimes(1);
  });

  it('says it could not copy when the page has no clipboard', async () => {
    load('android', false, 'uk', { load: loadPrompt, clipboard: undefined });
    document.querySelector<HTMLButtonElement>('[data-copy-prompt]')!.click();
    await vi.waitFor(() => expect(toast().textContent).toContain('не вдалося скопіювати >_<'));
  });
});

describe.each(['uk', 'en'] as const)('%s page', (lang) => {
  const page = PAGES[lang];

  describe('copy prompt', () => {
    beforeEach(() => load('android', false, lang));

    it('copies the prompt and says its version, and the toast stays until closed', async () => {
      document.querySelector<HTMLButtonElement>('[data-copy-prompt]')!.click();
      await vi.waitFor(() => expect(toast().textContent).toContain(`${page.copied} :)`));
      expect(writeText).toHaveBeenCalledWith('You are helping…');
      document.querySelector<HTMLButtonElement>('.toast__close')!.click();
      expect(toast().hidden).toBe(true);
    });

    it('says it could not copy when the prompt does not come', async () => {
      loadPrompt.mockRejectedValue(new Error('offline'));
      load('android', false, lang);
      document.querySelector<HTMLButtonElement>('[data-copy-prompt]')!.click();
      await vi.waitFor(() => expect(toast().textContent).toContain(`${page.failed} >_<`));
      expect(writeText).not.toHaveBeenCalled();
    });
  });

  describe('links', () => {
    beforeEach(() => load('android', false, lang));

    it('switches language with plain links and marks the current one', () => {
      const uk = document.querySelector<HTMLAnchorElement>('[data-lang="uk"]')!;
      const en = document.querySelector<HTMLAnchorElement>('[data-lang="en"]')!;
      expect([uk.getAttribute('href'), en.getAttribute('href')]).toEqual(
        lang === 'uk' ? ['./', 'en/'] : ['../', './'],
      );
      expect(document.querySelector('[aria-current="page"]')).toBe(lang === 'uk' ? uk : en);
      expect(page.html).toContain(`<html lang="${lang}">`);
    });

    it('sends every install link to the app', () => {
      const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-app-link]')];
      // Both install tabs; the hero button leads to the start block instead.
      expect(links.length).toBe(2);
      for (const link of links) expect(link.getAttribute('href')).toBe('%VITE_APP_URL%');
    });

    it('opens the author profiles in a new tab without sending the referrer', () => {
      const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-author-link]')];
      expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
        ['linkedin', 'https://www.linkedin.com/in/kishtanovao/'],
        ['behance', 'https://www.behance.net/7c29d01a'],
        [page.codeLink, 'https://github.com/vmit-rgb/body.log'],
      ]);
      for (const link of links) {
        expect(link.target).toBe('_blank');
        expect(link.rel).toBe('noopener noreferrer');
      }
    });

    it('opens every other outside link in a new tab without sending the referrer', () => {
      const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-external]')];
      expect(links.map((a) => a.getAttribute('href'))).toEqual([
        'https://github.com/vmit-rgb/body.log',
        'https://github.com/neethanwu/ascii-art',
        'https://github.com/unclebob/ub-mode',
      ]);
      for (const link of links) {
        expect(link.target).toBe('_blank');
        expect(link.rel).toBe('noopener noreferrer');
      }
    });

    it('leads the hero button to the start block', () => {
      const button = document.querySelector<HTMLAnchorElement>('.section--hero .button-primary')!;
      expect(button.getAttribute('href')).toBe('#start');
      expect(document.getElementById('start')).not.toBeNull();
    });

    it('opens the feedback form in a new tab', () => {
      const link = document.querySelector<HTMLAnchorElement>('[data-feedback-link]')!;
      expect(link.getAttribute('href')).toMatch(/^https:\/\/docs\.google\.com\/forms\/d\/e\/[\w-]+\/viewform$/);
      expect(link.target).toBe('_blank');
      expect(link.rel).toBe('noopener noreferrer');
    });
  });

  describe('accordions', () => {
    const openTitles = () =>
      [...document.querySelectorAll<HTMLDetailsElement>('[data-accordion]')]
        .filter((d) => d.open)
        .map((d) => d.querySelector('summary')!.textContent!.trim());

    it('on a phone opens only the first feature and the first question', () => {
      load('android', false, lang);
      expect(openTitles()).toEqual([expect.stringContaining(page.firstFeature), page.firstQuestion]);
    });

    it('on a wide screen opens all of them', () => {
      load('unknown', true, lang);
      const all = document.querySelectorAll('[data-accordion]');
      expect(all.length).toBe(19);
      expect(openTitles()).toHaveLength(all.length);
    });
  });

  describe('screenshots', () => {
    beforeEach(() => load('android', false, lang));

    it('describe every screen for screen readers and reserve its size', () => {
      const shots = [...document.querySelectorAll<HTMLImageElement>('img')];
      expect(shots.length).toBe(10);
      for (const img of shots) {
        expect(img.alt.length).toBeGreaterThan(10);
        expect(img.getAttribute('width')).toMatch(/^\d+$/);
        expect(img.getAttribute('height')).toMatch(/^\d+$/);
        expect(img.getAttribute('src')).toMatch(page.screens);
      }
    });

    it('lets the keyboard reach the screen that scrolls inside the still frame', () => {
      const screen = document.querySelector<HTMLElement>('.settings-scroll__frame > .settings-scroll__screen')!;
      expect(screen.tabIndex).toBe(0);
      expect(screen.getAttribute('aria-labelledby')).toBe('settings-scroll-caption');
      expect(document.querySelector<HTMLElement>('.settings-scroll__frame')!.hasAttribute('tabindex')).toBe(false);
    });
  });
});

describe('the English page mirrors the Ukrainian one', () => {
  /**
   * Tag names, classes and data attributes in document order: the page without its words.
   * Bold inside a sentence is part of the copy, so <b> without a class is left out.
   */
  function skeleton(html: string): string[] {
    document.documentElement.innerHTML = html.replace(/<script[\s\S]*?<\/script>/g, '');
    const elements = [...document.body.querySelectorAll('*')].filter((el) => !(el.tagName === 'B' && !el.className));
    return elements.map((el) => {
      const data = Object.keys((el as HTMLElement).dataset).sort().join(',');
      return `${el.tagName}.${el.className}[${data}]`;
    });
  }

  it('has the same blocks, controls and screenshots in the same order', () => {
    const uk = skeleton(ukHtml);
    // The English long settings screenshot is taller, so its crop has its own offsets.
    const en = skeleton(enHtml).map((s) => s.replace(' crop--accessibility-en', ''));
    expect(en).toEqual(uk);
  });
});
