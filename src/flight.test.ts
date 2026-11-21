import { describe, expect, it } from 'vitest';
import { PLANES, advance, makeRun, needsNewRuns, populate } from './flight';

/** A fixed sequence, so the runs are the same every time. */
function seeded(seed = 1): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('«Політ символів» on the landing', () => {
  it('uses the big glyphs: 11 / 15 / 22 px, slow far, fast near', () => {
    expect(PLANES.map((p) => p.size)).toEqual([11, 15, 22]);
    expect(PLANES.map((p) => p.speed)).toEqual([16, 34, 70]);
  });

  it('fills a phone screen by each plane’s density', () => {
    const runs = populate(390, 844, seeded());
    PLANES.forEach((plane, p) => {
      expect(runs.filter((r) => r.p === p)).toHaveLength(Math.round(((390 * 844) / 10000) * plane.dens));
    });
  });

  it('keeps every run on a row inside the screen, rows 1.5 em apart', () => {
    for (const run of populate(390, 844, seeded(7))) {
      expect(run.lh).toBe(Math.round(PLANES[run.p]!.size * 1.5));
      expect(run.y).toBeLessThan(844);
    }
  });

  it('flies left to right and brings a run gone past the right edge back from the left', () => {
    const random = seeded(3);
    const runs = [makeRun(2, true, 390, 844, [], random)];
    const start = runs[0]!.x;
    advance(runs, 0.05, 390, 844, random);
    expect(runs[0]!.x).toBeGreaterThan(start);
    runs[0]!.x = 390 + 1000;
    advance(runs, 0.01, 390, 844, random);
    expect(runs[0]!.x).toBeLessThanOrEqual(0);
  });

  it('lays the runs out anew for a new width, not for a phone’s address bar', () => {
    expect(needsNewRuns({ w: 390, h: 760 }, { w: 390, h: 844 })).toBe(false);
    expect(needsNewRuns({ w: 390, h: 844 }, { w: 844, h: 390 })).toBe(true);
    expect(needsNewRuns({ w: 0, h: 0 }, { w: 390, h: 844 })).toBe(true);
  });
});
