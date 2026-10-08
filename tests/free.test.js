import { describe, it, expect } from 'vitest';
import { buildFree, freeSentences, freeReady, topLesson, learnedLetters, FREE_UNLOCK } from '../src/lessons/generator.js';
import { learnedKeys, COURSE } from '../src/lessons/course.js';
import { createActivity } from '../src/session.js';
import { createStore } from '../src/storage/store.js';
import { freeDonePhrase, BREAK_PHRASES, BREAK_TIPS } from '../src/content/phrases.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

describe('вільне друкування: лише вивчені клавіші', () => {
  for (const layout of ['ua', 'en']) {
    for (const level of ['1-2', '3-4']) {
      it(`${layout}, ${level}: на кожному уроці немає невивчених символів`, () => {
        for (const l of COURSE[layout]) {
          if (l.id < FREE_UNLOCK[layout]) continue;
          const known = learnedKeys(layout, l.id);
          const shiftOk = l.id >= (layout === 'ua' ? 20 : 17);
          for (let k = 0; k < 5; k++) {
            const { steps } = buildFree({ layout, id: l.id, level });
            expect(steps.length).toBe(level === '3-4' ? 3 : 5);
            for (const { text } of steps) {
              expect(text.length).toBeGreaterThan(0);
              for (const c of text) {
                const ok = known.has(c) || (shiftOk && c !== c.toLowerCase() && known.has(c.toLowerCase()));
                expect(ok, `${layout} урок ${l.id}: «${text}» містить «${c}»`).toBe(true);
              }
            }
          }
        }
      });
    }
  }

  it('довжина: 1–2 клас 5–10 знаків, 3–4 клас до 60', () => {
    for (let i = 0; i < 40; i++) {
      for (const { text } of buildFree({ layout: 'ua', id: 10, level: '1-2' }).steps) expect(text.length).toBeGreaterThanOrEqual(5);
      for (const { text } of buildFree({ layout: 'ua', id: 10, level: '1-2' }).steps) expect(text.length).toBeLessThanOrEqual(10);
      for (const { text } of buildFree({ layout: 'ua', id: 21, level: '3-4' }).steps) expect(text.length).toBeLessThanOrEqual(60);
    }
  });

  it('речення з’являються лише коли вивчено Shift і крапку', () => {
    expect(freeSentences('ua', 10).length).toBe(0);
    expect(freeSentences('ua', 19).length).toBe(0);
    expect(freeSentences('ua', 21).length).toBeGreaterThan(50);
    expect(freeSentences('en', 18).length).toBeGreaterThan(30);
  });

  it('відкривається, коли слів уже досить', () => {
    expect(freeReady('ua', { ua: { 1: 3, 2: 3 } })).toBe(false);
    expect(freeReady('ua', { ua: { 1: 3, 2: 3, 3: 1 } })).toBe(true);
    expect(freeReady('en', { en: { 1: 3, 2: 3, 3: 1 } })).toBe(false);
    expect(freeReady('en', { en: { 7: 1 } })).toBe(true);
    expect(freeReady('ua', {}, true)).toBe(true);
    expect(topLesson('ua', { ua: { 2: 1, 5: 2 } })).toBe(5);
    expect(learnedLetters('ua', 3).length).toBeGreaterThan(4);
  });

  it('фраза про результат називає кількість', () => {
    expect(freeDonePhrase('1-2', 21)).toMatch(/21 знак/);
    for (const lv of ['1-2', '3-4']) for (let i = 0; i < 20; i++) expect(freeDonePhrase(lv, 5)).not.toMatch(/\{/);
  });

  it('вільне друкування не стирає збережене місце в уроці, але додає статистику', () => {
    const store = createStore(memory());
    const p = store.create({ name: 'Оля', avatar: 'fox' });
    store.saveStep(p.id, { typed: 3, errors: 0, ms: 0, chars: 0, missed: {}, resume: { layout: 'ua', id: 2, steps: [{}], i: 1 } });
    store.saveStep(p.id, { typed: 10, errors: 2, ms: 5000, chars: 10, missed: { а: 2 }, keepResume: true });
    expect(store.get(p.id).resume).not.toBeNull();
    expect(store.get(p.id).stats.typed).toBe(13);
    expect(store.get(p.id).stats.missed.а).toBe(2);
  });
});

describe('пропозиція перерви', () => {
  it('після 15 хвилин безперервної роботи', () => {
    let t = 0;
    const a = createActivity({ now: () => t });
    a.tick();
    for (let i = 0; i < 14; i++) { t += 60000; a.tick(); }
    expect(a.due()).toBe(false);
    t += 60000; a.tick();
    expect(a.due()).toBe(true);
    a.reset();
    expect(a.due()).toBe(false);
  });
  it('довга пауза вважається перервою', () => {
    let t = 0;
    const a = createActivity({ now: () => t });
    a.tick();
    for (let i = 0; i < 12; i++) { t += 60000; a.tick(); }
    t += 10 * 60000; a.tick(); // дитина відійшла
    expect(a.activeMs).toBe(0);
    expect(a.due()).toBe(false);
  });
  it('без дій нічого не пропонує', () => {
    expect(createActivity().due()).toBe(false);
  });
  it('фрази: достатньо варіантів, без докору', () => {
    expect(BREAK_PHRASES.length).toBeGreaterThanOrEqual(5);
    expect(BREAK_TIPS.length).toBeGreaterThanOrEqual(5);
    for (const p of [...BREAK_PHRASES, ...BREAK_TIPS]) expect(p.split(/\s+/).length).toBeLessThanOrEqual(5);
  });
});
