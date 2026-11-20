import { beforeEach, describe, expect, it } from 'vitest';
import html from '../index.html?raw';
import { initLanding } from './landing';

function load(platform: 'android' | 'iphone' | 'unknown', isWide = false) {
  document.documentElement.innerHTML = html.replace(/<script[\s\S]*?<\/script>/g, '');
  initLanding(document, platform, isWide);
}

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
  beforeEach(() => load('android'));

  it('says the prompt is still being written, and stays until closed', () => {
    document.querySelector<HTMLButtonElement>('[data-copy-prompt]')!.click();
    expect(toast().hidden).toBe(false);
    expect(toast().textContent).toContain('промпт ще пишемо');
    document.querySelector<HTMLButtonElement>('.toast__close')!.click();
    expect(toast().hidden).toBe(true);
  });
});

describe('links', () => {
  beforeEach(() => load('android'));

  it('sends every install link to the app', () => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-app-link]')];
    // Both install tabs; the hero button leads to «як почати» instead.
    expect(links.length).toBe(2);
    for (const link of links) expect(link.getAttribute('href')).toBe('%VITE_APP_URL%');
  });

  it('opens the author profiles in a new tab without sending the referrer', () => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-author-link]')];
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['linkedin', 'https://www.linkedin.com/in/kishtanovao/'],
      ['behance', 'https://www.behance.net/7c29d01a'],
      ['код на github', 'https://github.com/vmit-rgb/body.log'],
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

  it('leads the hero button to «як почати»', () => {
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

  it('keeps buttons that lead nowhere yet inert', () => {
    const inert = [...document.querySelectorAll<HTMLButtonElement>('[aria-disabled="true"]')];
    expect(inert.map((b) => b.textContent)).toEqual(['eng']);
    for (const button of inert) {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      button.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
    expect(toast().hidden).toBe(true);
  });
});

describe('accordions', () => {
  const openTitles = () =>
    [...document.querySelectorAll<HTMLDetailsElement>('[data-accordion]')]
      .filter((d) => d.open)
      .map((d) => d.querySelector('summary')!.textContent!.trim());

  it('on a phone opens only the first feature and the first question', () => {
    load('android');
    expect(openTitles()).toEqual([
      expect.stringContaining('під тебе, а не навпаки'),
      'хто бачить мої записи?',
    ]);
  });

  it('on a wide screen opens all of them', () => {
    load('unknown', true);
    const all = document.querySelectorAll('[data-accordion]');
    expect(all.length).toBe(19);
    expect(openTitles()).toHaveLength(all.length);
  });
});

describe('screenshots', () => {
  beforeEach(() => load('android'));

  it('describe every screen for screen readers and reserve its size', () => {
    const shots = [...document.querySelectorAll<HTMLImageElement>('img')];
    expect(shots.length).toBe(11);
    for (const img of shots) {
      expect(img.alt.length).toBeGreaterThan(10);
      expect(img.getAttribute('width')).toMatch(/^\d+$/);
      expect(img.getAttribute('height')).toMatch(/^\d+$/);
      expect(img.getAttribute('src')).toMatch(/^\/screens\/[\w-]+\.webp$/);
    }
  });

  it('lets the keyboard reach the scrolling settings frame', () => {
    const frame = document.querySelector<HTMLElement>('.settings-scroll__frame')!;
    expect(frame.tabIndex).toBe(0);
    expect(frame.getAttribute('aria-labelledby')).toBe('settings-scroll-caption');
  });
});
