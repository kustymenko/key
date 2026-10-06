import { describe, it, expect } from 'vitest';
import { COURSE, lessonsFor, learnedKeys, nextLesson, learnedCount, getLesson } from '../src/lessons/course.js';
import { buildLesson, poolSize, wordPool, learnedLetters } from '../src/lessons/generator.js';
import { codeOfChar, needsShift, lettersOf } from '../src/keyboard/layouts.js';
import { fingerOf, shiftCodeFor } from '../src/keyboard/fingers.js';
import { mapNodes } from '../src/screens/map.js';

// Невеликий генератор випадкових чисел, щоб перевірки були повторюваними
const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const ORDER = {
  ua: 'ао вл ід фж пр є ке нг ми ть уш сб цщ чю йз хї я. ,',
  en: 'fj dk sl a; gh ei ru ty wo qp vm bn c, x. z/',
};
const flat = (layout) => COURSE[layout].flatMap((l) => l.letters).join('');

describe('курс: порядок уроків (typing-pedagogy)', () => {
  it('українська: 21 урок, клавіші в потрібному порядку', () => {
    expect(COURSE.ua).toHaveLength(21);
    expect(flat('ua')).toBe(ORDER.ua.replace(/ /g, ''));
  });
  it('англійська: 18 уроків, клавіші в потрібному порядку', () => {
    expect(COURSE.en).toHaveLength(18);
    expect(flat('en')).toBe(ORDER.en.replace(/ /g, ''));
  });
  it('номери уроків за порядком, 5-й — повторення', () => {
    for (const layout of ['ua', 'en']) {
      COURSE[layout].forEach((l, i) => expect(l.id).toBe(i + 1));
      expect(COURSE[layout][4].kind).toBe('review');
    }
  });
  it('кожна літера розкладки вивчається рівно в одному уроці (крім Ґ)', () => {
    for (const layout of ['ua', 'en']) {
      const all = lettersOf(layout).map((k) => k[layout].toLowerCase());
      const learned = flat(layout).split('');
      for (const ch of all) expect(learned.filter((c) => c === ch), `${layout} ${ch}`).toHaveLength(1);
    }
  });
  it('кожна клавіша курсу має рівно один палець', () => {
    for (const layout of ['ua', 'en'])
      for (const ch of flat(layout)) expect(fingerOf(codeOfChar(ch, layout)), `${layout} ${ch}`).toBeTruthy();
  });
  it('1–2 клас: Shift і розділові знаки приховані', () => {
    expect(lessonsFor('ua', '1-2').map((l) => l.id)).toEqual(Array.from({ length: 19 }, (_, i) => i + 1));
    expect(lessonsFor('en', '1-2')).toHaveLength(16);
    expect(lessonsFor('ua', '3-4')).toHaveLength(21);
    expect(lessonsFor('en', '3-4')).toHaveLength(18);
    expect(nextLesson('ua', '1-2', 19)).toBeNull();
    expect(nextLesson('ua', '3-4', 19).id).toBe(20);
  });
  it('пробіл вивчений з уроку 2', () => {
    expect(learnedKeys('ua', 1).has(' ')).toBe(false);
    expect(learnedKeys('ua', 2).has(' ')).toBe(true);
  });
  it('лічильник вивчених літер', () => {
    expect(learnedCount('ua', 1)).toBe(2);
    expect(learnedCount('ua', 5)).toBe(8);
    expect(learnedCount('ua', 19)).toBe(32);
    expect(learnedCount('en', 16)).toBe(26);
  });
});

describe('Shift і знаки', () => {
  it('пробіл і кома в українській мають свої клавіші', () => {
    expect(codeOfChar(' ', 'ua')).toBe('Space');
    expect(fingerOf('Space')).toBe('th');
    expect(codeOfChar(',', 'ua')).toBe('Slash');
    expect(codeOfChar('.', 'ua')).toBe('Slash');
    expect(codeOfChar(',', 'en')).toBe('Comma');
  });
  it('Shift: велика літера і кома в українській; протилежною рукою', () => {
    expect(needsShift('К', 'ua')).toBe(true);
    expect(needsShift('к', 'ua')).toBe(false);
    expect(needsShift(',', 'ua')).toBe(true);
    expect(needsShift(',', 'en')).toBe(false);
    expect(needsShift('.', 'ua')).toBe(false);
    expect(shiftCodeFor(codeOfChar('К', 'ua'))).toBe('ShiftRight'); // К — лівий вказівний
    expect(shiftCodeFor(codeOfChar('Н', 'ua'))).toBe('ShiftLeft'); // Н — правий вказівний
  });
});

// Усі вправи кожного уроку: лише вивчені клавіші, правильна довжина
describe('генератор вправ', () => {
  const REPEAT = 25;
  for (const layout of ['ua', 'en']) {
    for (const level of ['1-2', '3-4']) {
      for (const lesson of lessonsFor(layout, level)) {
        it(`${layout}, ${level}, урок ${lesson.id}: лише вивчені клавіші, довжина, знайомство`, () => {
          const learned = new Set(learnedKeys(layout, lesson.id));
          const caps = ['shift', 'punct', 'sentences'].includes(lesson.kind);
          for (let n = 0; n < REPEAT; n++) {
            const built = buildLesson({ layout, id: lesson.id, level, rng: seeded(n * 97 + lesson.id) });
            const drills = built.steps.filter((s) => s.kind === 'drill');
            expect(drills).toHaveLength(level === '3-4' ? 3 : 4);
            for (const { text } of drills) {
              expect(text, 'вправа не порожня').toBeTruthy();
              if (level === '1-2') {
                expect(text.length, text).toBeGreaterThanOrEqual(5);
                expect(text.length, text).toBeLessThanOrEqual(10);
              } else {
                expect(text.length, text).toBeGreaterThanOrEqual(20);
                expect(text.length, text).toBeLessThanOrEqual(60);
              }
              expect(text, 'без подвійних і крайніх пробілів').not.toMatch(/^ | $| {2}/);
              for (const ch of text) {
                const low = ch.toLowerCase();
                if (ch !== low) expect(caps, `велика ${ch} лише в уроках про Shift: ${text}`).toBe(true);
                expect(learned.has(low), `«${ch}» ще не вивчена в уроці ${lesson.id}: ${text}`).toBe(true);
              }
            }
            // знайомство — з усіма новими клавішами уроку, до вправ
            const intros = built.steps.filter((s) => s.kind === 'intro').map((s) => s.ch);
            expect(intros.map((c) => c.toLowerCase())).toEqual((lesson.intro ?? lesson.letters).map((c) => c.toLowerCase()));
            expect(built.steps.slice(0, intros.length).every((s) => s.kind === 'intro')).toBe(true);
          }
        });
      }
    }
  }

  it('до уроку 2 пробілу у вправах немає', () => {
    for (const layout of ['ua', 'en'])
      for (const level of ['1-2', '3-4'])
        for (let n = 0; n < 20; n++)
          for (const s of buildLesson({ layout, id: 1, level, rng: seeded(n) }).steps) expect(s.text ?? '').not.toContain(' ');
  });
  it('у вправах є нова літера уроку (крім повторення і Shift)', () => {
    for (const layout of ['ua', 'en'])
      for (const lesson of COURSE[layout].filter((l) => l.kind === 'letters'))
        for (const level of ['1-2', '3-4']) {
          const text = buildLesson({ layout, id: lesson.id, level, rng: seeded(5) }).steps.filter((s) => s.kind === 'drill').map((s) => s.text).join(' ');
          expect(lesson.letters.some((c) => text.includes(c)), `${layout} ${lesson.id}`).toBe(true);
        }
  });
  it('на кожному уроці є з чого складати вправи (слова + склади ≥ 10), а справжніх слів — щонайменше 10, де мова це дозволяє', () => {
    for (const layout of ['ua', 'en']) {
      const firstWithWords = layout === 'ua' ? 3 : 7; // в англійській до 7-го уроку мало вивчених літер для слів
      for (const lesson of COURSE[layout]) {
        if (lesson.id >= 2) expect(poolSize(layout, lesson.id), `${layout} ${lesson.id}`).toBeGreaterThanOrEqual(10);
        if (lesson.id >= firstWithWords) expect(wordPool(layout, lesson.id).length, `${layout} ${lesson.id}`).toBeGreaterThanOrEqual(10);
      }
    }
  });
  it('слова в пулі лише з вивчених літер', () => {
    for (const layout of ['ua', 'en'])
      for (const lesson of COURSE[layout]) {
        const known = new Set(learnedLetters(layout, lesson.id));
        for (const x of wordPool(layout, lesson.id)) expect([...x.w].every((c) => known.has(c))).toBe(true);
      }
  });
  it('уроки про Shift і коми: великі літери, коми й крапки в 3–4 класі', () => {
    const shift = buildLesson({ layout: 'ua', id: 20, level: '3-4', rng: seeded(1) }).steps;
    expect(shift.slice(0, 2).map((s) => s.ch)).toEqual(['К', 'Н']);
    expect(shift.filter((s) => s.kind === 'drill').every((s) => /[А-ЩЬЮЯЄІЇ]/.test(s.text))).toBe(true);
    const commas = buildLesson({ layout: 'ua', id: 21, level: '3-4', rng: seeded(1) }).steps;
    expect(commas[0]).toEqual({ kind: 'intro', ch: ',' });
    expect(commas.filter((s) => s.kind === 'drill').every((s) => s.text.includes(','))).toBe(true);
  });
  it('рівні відчутно різні: довжина вправ у 3–4 класі в кілька разів більша', () => {
    const len = (level) => buildLesson({ layout: 'ua', id: 10, level, rng: seeded(3) }).steps.filter((s) => s.kind === 'drill').reduce((a, s) => a + s.text.length, 0);
    expect(len('3-4')).toBeGreaterThan(len('1-2') * 3);
  });
});

describe('карта пригод', () => {
  const base = { layout: 'ua', level: '1-2', progress: { ua: {}, en: {} }, openAll: false };
  it('на початку відкритий лише перший урок, решта закриті', () => {
    const nodes = mapNodes(base);
    expect(nodes[0].state).toBe('current');
    expect(nodes.slice(1).every((n) => n.state === 'locked')).toBe(true);
  });
  it('після будь-якого завершення (мінімум 1 зірочка) відкривається наступний', () => {
    const nodes = mapNodes({ ...base, progress: { ua: { 1: 1, 2: 3 }, en: {} } });
    expect(nodes.map((n) => n.state).slice(0, 4)).toEqual(['done', 'done', 'current', 'locked']);
    expect(nodes[1].stars).toBe(3);
  });
  it('«усі відкриті» (для перевірки): поточний лишається першим непройденим', () => {
    const nodes = mapNodes({ ...base, openAll: true });
    expect(nodes[0].state).toBe('current');
    expect(nodes.slice(1).every((n) => n.state === 'open')).toBe(true);
  });
  it('рівень 1–2 ховає 20–21 уроки, 3–4 показує', () => {
    expect(mapNodes(base)).toHaveLength(19);
    expect(mapNodes({ ...base, level: '3-4' })).toHaveLength(21);
    expect(mapNodes({ ...base, layout: 'en', level: '3-4' })).toHaveLength(18);
  });
  it('усі вузли в межах сцени 1366×768 і не накладаються', () => {
    for (const layout of ['ua', 'en'])
      for (const level of ['1-2', '3-4']) {
        const nodes = mapNodes({ ...base, layout, level });
        for (const n of nodes) {
          expect(n.x).toBeGreaterThan(70);
          expect(n.x).toBeLessThan(1296);
          expect(n.y).toBeLessThan(700);
        }
        for (let i = 0; i < nodes.length; i++)
          for (let j = i + 1; j < nodes.length; j++) expect(Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y)).toBeGreaterThan(140);
      }
  });
});
