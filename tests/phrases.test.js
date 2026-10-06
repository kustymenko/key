import { describe, it, expect } from 'vitest';
import { AGAIN_PHRASES, DRILL_PHRASES, STREAK_PHRASES, STEP_DONE_PHRASES, BACK_PHRASES, RESUME_PHRASES, pickPhrase } from '../src/content/phrases.js';

const words = (p) => p.trim().split(/\s+/).length;

describe('фрази Клавика у вправі', () => {
  const young = { AGAIN_PHRASES, STREAK_PHRASES, STEP_DONE_PHRASES, BACK_PHRASES, RESUME_PHRASES, 'DRILL 1-2': DRILL_PHRASES['1-2'] };
  for (const [name, list] of Object.entries(young)) {
    it(`${name}: щонайменше 4 варіанти, до 5 слів, без повторів`, () => {
      expect(list.length).toBeGreaterThanOrEqual(4);
      expect(new Set(list).size).toBe(list.length);
      for (const p of list) expect(words(p), p).toBeLessThanOrEqual(5);
    });
  }
  it('3–4 клас: до 12 слів, 5 варіантів', () => {
    expect(DRILL_PHRASES['3-4'].length).toBeGreaterThanOrEqual(5);
    for (const p of DRILL_PHRASES['3-4']) expect(words(p)).toBeLessThanOrEqual(12);
  });
  it('без докору і слова «помилка» в підказках', () => {
    for (const p of [...AGAIN_PHRASES, ...STREAK_PHRASES.filter((x) => !x.includes('Без жодної'))]) expect(p).not.toMatch(/помилк|не так|погано/i);
  });
  it('фраза не повторюється двічі поспіль', () => {
    let last = null;
    for (let i = 0; i < 200; i++) {
      const p = pickPhrase(STREAK_PHRASES, last);
      expect(p).not.toBe(last);
      last = p;
    }
  });
});
