// Етап Т2: вступний тест і розміщення — межі порогів, тексти тесту, перенесення з 3–4 класу, екрани в усіх світах
import { describe, it, expect } from 'vitest';
import {
  place, scoreFind, scoreTyping, median, makeLetters, makeWordsText, makeSentencesText, toLines, weakLetters, carryOver, carryPlacement,
  cleanPlacement, THRESHOLDS, MIN_SAMPLES, KIND_INFO, testLetters,
} from '../src/teen/logic/placement.js';
import { createStore } from '../src/storage/store.js';
import { teenScreen, teenRoute } from '../src/teen/screens/index.js';
import { WORLD_IDS } from '../src/teen/logic/profile.js';
import { lettersOf } from '../src/keyboard/layouts.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
// детермінований генератор для перевірок
const seeded = (seed = 7) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const find = (medianMs, count = 40) => ({ count, medianMs, errors: 0, accuracy: 100 });
const words = (accuracy, correct = 200) => ({ correct, errors: 0, accuracy, cpm: 150 });

describe('розміщення: межі порогів', () => {
  it('«З нуля»: повільно, неточно або замало даних', () => {
    expect(place({ find: find(1201), words: words(99) })).toBe('zero'); // медіана > 1,2 с
    expect(place({ find: find(500), words: words(84.9) })).toBe('zero'); // точність < 85%
    expect(place({ find: find(500, MIN_SAMPLES.letters - 1), words: words(99) })).toBe('zero'); // замало літер
    expect(place({ find: find(500), words: words(99, MIN_SAMPLES.wordChars - 1) })).toBe('zero'); // замало слів
    expect(place({ find: null, words: null })).toBe('zero');
  });
  it('«Середній»: 0,6–1,2 с і гідна точність; точність 85–94% при швидкій відповіді теж середній', () => {
    expect(place({ find: find(1200), words: words(90) })).toBe('mid'); // рівно 1,2 с ще середній
    expect(place({ find: find(600), words: words(99) })).toBe('mid'); // рівно 0,6 с — вже не «досвідчений»
    expect(place({ find: find(800), words: words(85) })).toBe('mid');
    expect(place({ find: find(500), words: words(93.9) })).toBe('mid');
    expect(place({ find: find(500), words: words(87) })).toBe('mid'); // швидко, але неточно — краще швидка перевірка, ніж з нуля
  });
  it('«Досвідчений»: < 0,6 с і точність ≥ 94%', () => {
    expect(place({ find: find(599), words: words(94) })).toBe('pro');
    expect(place({ find: find(300), words: words(100) })).toBe('pro');
    expect(THRESHOLDS).toMatchObject({ fastMs: 600, slowMs: 1200, proAcc: 94, zeroAcc: 85 });
  });
  it('відповідь «ні» лише опускає «досвідчений» до «середнього»; «так» нічого не піднімає', () => {
    expect(place({ find: find(300), words: words(99) }, 'no')).toBe('mid');
    expect(place({ find: find(300), words: words(99) }, 'yes')).toBe('pro');
    expect(place({ find: find(300), words: words(99) }, 'almost')).toBe('pro');
    expect(place({ find: find(900), words: words(95) }, 'no')).toBe('mid'); // середній не опускається до нуля
    expect(place({ find: find(900), words: words(95) }, 'yes')).toBe('mid'); // повільний не піднімається
    expect(place({ find: find(1500), words: words(95) }, 'yes')).toBe('zero');
  });
  it('усі види розміщення мають текст для учня', () => {
    for (const k of ['zero', 'mid', 'pro', 'carry']) { expect(KIND_INFO[k].title.length).toBeGreaterThan(5); expect(KIND_INFO[k].text.length).toBeGreaterThan(20); }
  });
});

describe('підрахунок результатів', () => {
  it('медіана, час відповіді й точність', () => {
    expect(median([])).toBeNull();
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    const f = scoreFind([{ ms: 400, errors: 0 }, { ms: 900, errors: 1 }, { ms: 500, errors: 0 }]);
    expect(f).toMatchObject({ count: 3, medianMs: 500, errors: 1 });
    expect(f.accuracy).toBeCloseTo(75);
    const t = scoreTyping({ correct: 150, errors: 10, ms: 30000 });
    expect(t.cpm).toBeCloseTo(300);
    expect(t.accuracy).toBeCloseTo(93.75);
    expect(scoreTyping({ correct: 0, errors: 0, ms: 30000 }).accuracy).toBeNull();
  });
  it('слабкі літери потрапляють у «Потренуй»: з помилками або дуже довго шукані', () => {
    const letters = ['а', 'щ', 'ж', 'ц', 'к'];
    const samples = [{ ms: 500, errors: 0 }, { ms: 600, errors: 2 }, { ms: 550, errors: 0 }, { ms: 4000, errors: 0 }, { ms: 520, errors: 0 }];
    expect(weakLetters(letters, samples)).toEqual({ щ: 2, ц: 1 });
    expect(weakLetters([], [])).toEqual({});
  });
});

describe('тексти тесту: лише власні банки й лише клавіші, які є на клавіатурі', () => {
  const ALPHA = new Set(lettersOf('ua').map((k) => k.ua.toLowerCase()));
  it('літери: усі з клавіатури, без повторів підряд', () => {
    const l = makeLetters(seeded(), 40);
    expect(l).toHaveLength(40);
    expect(l.every((c) => ALPHA.has(c))).toBe(true);
    expect(l.every((c, i) => i === 0 || c !== l[i - 1])).toBe(true);
    expect(new Set(testLetters()).size).toBe(ALPHA.size);
  });
  it('слова: достатньо довгі, лише потрібні літери', () => {
    for (let s = 1; s < 8; s++) {
      const t = makeWordsText(seeded(s));
      expect(t.length).toBeGreaterThanOrEqual(320);
      expect([...t].every((c) => c === ' ' || ALPHA.has(c))).toBe(true);
      expect(t.split(' ').every((w) => w.length >= 4 && w.length <= 8)).toBe(true);
    }
  });
  it('речення: з великої літери, мають кому й крапку, без апострофа і Ґ', () => {
    for (let s = 1; s < 8; s++) {
      const t = makeSentencesText(seeded(s));
      expect(t.length).toBeGreaterThanOrEqual(320);
      expect(t).toContain(',');
      expect(t).toContain('.');
      expect([...t].every((c) => ALPHA.has(c.toLowerCase()) || ' ,.'.includes(c))).toBe(true);
      expect(/^[А-ЩЬЮЯЄІЇ]/.test(t)).toBe(true);
    }
  });
  it('рядки не розривають слів і не гублять символів (разом із пробілами між рядками)', () => {
    const t = makeWordsText(seeded(3));
    const lines = toLines(t, 34);
    expect(lines.join('')).toBe(t);
    expect(lines.slice(0, -1).every((l) => l.endsWith(' '))).toBe(true);
    expect(lines.every((l) => l.trimEnd().length <= 34)).toBe(true);
  });
});

describe('перехід із 3–4 класу на 5: прогрес не губиться, вивчені літери враховуються', () => {
  it('що вже вивчено за прогресом', () => {
    expect(carryOver({ ua: {}, en: {} })).toMatchObject({ has: false, learned: { ua: [], en: [] } });
    const c = carryOver({ ua: { 1: 3, 2: 2, 3: 3 }, en: {} });
    expect(c.has).toBe(true);
    expect(c.top.ua).toBe(3);
    expect([...c.learned.ua].sort()).toEqual(['а', 'в', 'д', 'і', 'л', 'о'].sort());
    expect(c.learned.en).toEqual([]);
  });
  it('збереження: розміщення «carry» несе вивчені літери, зірочки з 3–4 лишаються', () => {
    const st = createStore(memory());
    const p = st.create({ name: 'Макс', avatar: 'bear', level: '3-4' });
    st.finishLesson(p.id, { layout: 'ua', lessonId: 1, stars: 3, errors: 0 });
    st.finishLesson(p.id, { layout: 'ua', lessonId: 2, stars: 2, errors: 4 });
    st.update(p.id, { level: '5', world: 'sky' });
    st.update(p.id, { placement: carryPlacement(st.get(p.id).progress, 1000) });
    const got = st.get(p.id);
    expect(got.placement).toMatchObject({ kind: 'carry', source: 'carry', at: 1000 });
    expect(got.placement.learned.ua.sort()).toEqual(['а', 'в', 'л', 'о']);
    expect(got.progress.ua).toEqual({ 1: 3, 2: 2 });
    st.update(p.id, { level: '3-4' }); // повернення на 3–4: нічого не зламалось
    expect(st.get(p.id).progress.ua).toEqual({ 1: 3, 2: 2 });
  });
});

describe('збереження розміщення', () => {
  it('переживає перезавантаження; зіпсований запис ігнорується; скидання прогресу стирає розміщення', () => {
    const storage = memory();
    const a = createStore(storage);
    const p = a.create({ name: 'Ліза', avatar: 'cat', level: '6', world: 'pixel' });
    expect(a.get(p.id).placement).toBeNull();
    a.update(p.id, { placement: { kind: 'mid', source: 'test', at: 5, medianMs: 812.34, wordsAcc: 91.5, wordsCpm: 140.2, sentencesAcc: 88, self: 'almost' } });
    const b = createStore(storage).get(p.id);
    expect(b.placement).toMatchObject({ kind: 'mid', source: 'test', self: 'almost', wordsAcc: 91.5 });
    expect(cleanPlacement({ kind: 'dragon' })).toBeNull();
    expect(cleanPlacement(null)).toBeNull();
    expect(cleanPlacement({ kind: 'zero', source: 'x', self: 'maybe', medianMs: -3 })).toMatchObject({ source: 'test', self: null, medianMs: null });
    a.update(p.id, { placement: { kind: 'nope' } }); // неправильний запис не стирає попереднє розміщення
    expect(a.get(p.id).placement.kind).toBe('mid');
    a.resetProgress(p.id);
    expect(a.get(p.id).placement).toBeNull();
    expect(a.get(p.id).world).toBe('pixel');
  });
});

describe('екрани вступного тесту відкриваються в усіх трьох світах', () => {
  it('start і test × три світи; є «Додому» й місце для вмісту', () => {
    for (const world of WORLD_IDS) for (const tab of ['start', 'test']) {
      const st = createStore(memory());
      const p = st.create({ name: 'Олекса', avatar: 'fox', level: '5', world });
      const html = teenScreen(teenRoute(`teen/${tab}`), st.get(p.id));
      expect(html, `${world}/${tab}`).toContain('data-pl');
      expect(html).toContain('data-home');
      expect(html).toContain('pl-panel');
      expect(html).not.toMatch(/undefined|NaN|\[object|https?:\/\/(?!www\.w3\.org)/);
    }
    expect(teenRoute('teen/start')).toEqual({ tab: 'start' });
    expect(teenRoute('teen/test')).toEqual({ tab: 'test' });
  });
});
