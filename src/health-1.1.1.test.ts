import { describe, expect, it } from 'vitest';
import ukHtml from '../index.html?raw';
import enHtml from '../en/index.html?raw';

/* Beta 1.1.1 (HEALTH-IMPORT.md, section B): a few lines about «Здоровʼя» under the iPhone's animation. */

const PAGES = {
  // Olesia, 2026-11-22: only that steps and km can be connected, nothing more
  uk: { html: ukHtml, line: 'на айфоні можна підключити кроки й км зі «Здоровʼя».' },
  en: { html: enHtml, line: 'on an iphone you can connect steps and km from Health.' },
} as const;

describe.each(['uk', 'en'] as const)('%s page: «Здоровʼя» on the iPhone', (lang) => {
  const page = PAGES[lang];

  it('stands under the drawn iPhone and its «перейти в застосунок» (the button stays right under the phone), only in the iPhone tab', () => {
    document.documentElement.innerHTML = page.html.replace(/<script[\s\S]*?<\/script>/g, '');
    const line = document.querySelector<HTMLElement>('#steps-iphone .tab-panel__health')!;
    expect(line.previousElementSibling!.classList.contains('tab-panel__go')).toBe(true);
    expect(line.previousElementSibling!.previousElementSibling!.getAttribute('data-install-demo')).toBe('iphone');
    expect(line.nextElementSibling).toBeNull();
    expect(line.textContent).toBe(page.line);
    expect(document.querySelector('#steps-android .tab-panel__health')).toBeNull();
  });
});
