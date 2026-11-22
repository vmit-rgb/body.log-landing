import { describe, expect, it } from 'vitest';
import ukHtml from '../index.html?raw';
import enHtml from '../en/index.html?raw';

/* Beta 1.1.1 (HEALTH-IMPORT.md, section B): a few lines about «Здоровʼя» under the iPhone's animation. */

const PAGES = {
  uk: { html: ukHtml, words: ['«Здоровʼя»', '«підключити Здоровʼя»', '«синхронізувати»', 'лишаються на телефоні'] },
  en: { html: enHtml, words: ['Health', '“connect Health”', '“sync”', 'stays on the phone'] },
} as const;

describe.each(['uk', 'en'] as const)('%s page: «Здоровʼя» on the iPhone', (lang) => {
  const page = PAGES[lang];

  it('stands under the drawn iPhone and its «перейти в застосунок» (the button stays right under the phone), only in the iPhone tab', () => {
    document.documentElement.innerHTML = page.html.replace(/<script[\s\S]*?<\/script>/g, '');
    const line = document.querySelector<HTMLElement>('#steps-iphone .tab-panel__health')!;
    expect(line.previousElementSibling!.classList.contains('tab-panel__go')).toBe(true);
    expect(line.previousElementSibling!.previousElementSibling!.getAttribute('data-install-demo')).toBe('iphone');
    expect(line.nextElementSibling).toBeNull();
    for (const word of page.words) expect(line.textContent).toContain(word);
    expect(document.querySelector('#steps-android .tab-panel__health')).toBeNull();
  });
});
