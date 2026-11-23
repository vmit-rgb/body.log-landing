import { describe, expect, it } from 'vitest';
import ukHtml from '../index.html?raw';
import enHtml from '../en/index.html?raw';

/* «їжа» on the landing (Olesia, 2026-11-23): one line in «під тебе, а не навпаки», one warning in «що варто знати». */

describe('food on the landing', () => {
  it('is named among the things to set up, in both languages, without «КБЖУ»', () => {
    expect(ukHtml).toContain('<p>їжа: що й коли їси, а за бажанням — білки, жири й вуглеводи. калорії рахуються самі.</p>');
    expect(enHtml).toContain('<p>food: what and when you eat, and if you want, protein, fat and carbs. calories are counted for you.</p>');
    expect(ukHtml).not.toMatch(/кбжу/i);
  });

  it('has its warning among the [!] lines, right after the two there were', () => {
    for (const [html, line] of [
      [ukHtml, 'підрахунок їжі комусь допомагає, а комусь шкодить. секція «їжа» вмикається тільки за бажанням, без норм і оцінок.'],
      [enHtml, 'counting food helps some people and harms others. the “food” section is on only if you want it, with no norms or grades.'],
    ] as const) {
      const warnings = [...html.matchAll(/marker--warn[^>]*>\[!\]<\/span><span class="t-body2">([^<]*)/g)].map((m) => m[1]);
      expect(warnings).toHaveLength(3);
      expect(warnings[2]).toBe(line);
    }
  });
});
