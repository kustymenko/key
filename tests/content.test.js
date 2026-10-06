import { describe, it, expect } from 'vitest';
import { WORDS_UA } from '../src/content/words-ua.js';
import { WORDS_EN } from '../src/content/words-en.js';
import { SENTENCES_UA } from '../src/content/sentences-ua.js';
import { SENTENCES_EN } from '../src/content/sentences-en.js';

const ALPHABET = { ua: /^[а-щьюяєіїй]+$/, en: /^[a-z]+$/ };
const SENT_ALPHABET = { ua: /^[А-ЩЬЮЯЄІЇ][а-щьюяєіїй ,]*\.$/, en: /^[A-Z][A-Za-z ,]*\.$/ };
const BANKS = [
  { layout: 'ua', words: WORDS_UA, sentences: SENTENCES_UA, min: { w12: 300, w34: 300, s: 100 } },
  { layout: 'en', words: WORDS_EN, sentences: SENTENCES_EN, min: { w12: 200, w34: 200, s: 60 } },
];

for (const { layout, words, sentences, min } of BANKS) {
  describe(`банк слів: ${layout}`, () => {
    const w12 = words.filter((x) => x.level === '1-2');
    const w34 = words.filter((x) => x.level === '3-4');
    it('достатньо слів кожного рівня', () => {
      expect(w12.length).toBeGreaterThanOrEqual(min.w12);
      expect(w34.length).toBeGreaterThanOrEqual(min.w34);
      expect(sentences.length).toBeGreaterThanOrEqual(min.s);
    });
    it('кожне слово має рівень і тему; лише літери алфавіту, без апострофа й Ґ', () => {
      for (const x of words) {
        expect(['1-2', '3-4']).toContain(x.level);
        expect(x.theme, x.w).toBeTruthy();
        expect(x.w, x.w).toMatch(ALPHABET[layout]);
      }
    });
    it('довжина: 1–2 клас — 2–4 літери, 3–4 клас — 4–8 літер', () => {
      for (const x of w12) expect([...x.w].length, x.w).toBeGreaterThanOrEqual(2), expect([...x.w].length, x.w).toBeLessThanOrEqual(4);
      for (const x of w34) expect([...x.w].length, x.w).toBeGreaterThanOrEqual(4), expect([...x.w].length, x.w).toBeLessThanOrEqual(8);
    });
    it('без повторів у межах рівня', () => {
      for (const list of [w12, w34]) expect(new Set(list.map((x) => x.w)).size).toBe(list.length);
    });
  });

  describe(`речення: ${layout}`, () => {
    it('3–7 слів, з великої літери, з крапкою, лише літери, пробіли й коми', () => {
      for (const x of sentences) {
        expect(x.s, x.s).toMatch(SENT_ALPHABET[layout]);
        const n = x.s.split(' ').length;
        expect(n, x.s).toBeGreaterThanOrEqual(3);
        expect(n, x.s).toBeLessThanOrEqual(7);
        expect(x.s.length, x.s).toBeLessThanOrEqual(60);
        expect(x.level).toBe('3-4');
      }
    });
    it('є речення і з комою, і без неї (для уроків про коми)', () => {
      expect(sentences.filter((x) => x.s.includes(',')).length).toBeGreaterThanOrEqual(15);
      expect(sentences.filter((x) => !x.s.includes(',')).length).toBeGreaterThanOrEqual(30);
    });
    it('без повторів', () => {
      expect(new Set(sentences.map((x) => x.s)).size).toBe(sentences.length);
    });
  });
}
