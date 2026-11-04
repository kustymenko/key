import { describe, it, expect, beforeEach } from 'vitest';
import {
  GOALS, goalsOf, standardGoals, setGoalOverrides, goalOverrides, cleanGradeGoals, medalFor, applyChallenge, emptyChallenge, cleanChallenge, HIST_MAX,
} from '../src/teen/logic/challenge.js';
import { boardRows, boardNote, progressOf, BOARD_SIZE } from '../src/teen/logic/board.js';
import { createStore } from '../src/storage/store.js';
import { themeOf, THEMES } from '../src/teen/worlds/index.js';
import { boardScreen } from '../src/teen/screens/board.js';
import { getLaptopFlag, setLaptopFlag, BOARD_OFF_FLAG } from '../src/storage/laptop.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const prof = (id, name, level, topCpm, topAcc = 96, layout = 'ua') => ({
  id, name, level, challenge: { open: false, rec: { ua: { runs: 3, medal: 1, bestCpm: topCpm, bestAcc: topAcc, topCpm: layout === 'ua' ? topCpm : 0, topAcc: layout === 'ua' ? topAcc : 0, hist: [] }, en: { runs: 0, medal: 0, bestCpm: 0, bestAcc: 0, topCpm: layout === 'en' ? topCpm : 0, topAcc: layout === 'en' ? topAcc : 0, hist: [] } }, seen: [] },
});

beforeEach(() => setGoalOverrides({}));

describe('Т8: свої цілі медалей', () => {
  it('без змін діють стандартні цілі', () => {
    expect(goalsOf('5').map((g) => [g.cpm, g.acc])).toEqual([[70, 92], [100, 95], [130, 97]]);
    expect(goalOverrides()).toEqual({});
  });
  it('цілі 5 і 6 класу змінюються окремо, медаль рахується за новими цілями', () => {
    setGoalOverrides({ 5: { bronze: { cpm: 50, acc: 90 }, silver: { cpm: 80, acc: 94 }, gold: { cpm: 110, acc: 96 } } });
    expect(goalsOf('5').map((g) => g.cpm)).toEqual([50, 80, 110]);
    expect(goalsOf('6').map((g) => g.cpm)).toEqual([100, 140, 180]); // 6 клас не змінився
    expect(medalFor('5', 50, 90)).toBe(1);
    expect(medalFor('5', 49, 99)).toBe(0);
    expect(medalFor('5', 200, 89)).toBe(0); // і тут швидкість без точності не рахується
    expect(medalFor('5', 110, 96)).toBe(3);
  });
  it('«Повернути стандартні значення»: порожні свої цілі → стандартні', () => {
    setGoalOverrides({ 6: { bronze: { cpm: 60, acc: 90 } } });
    expect(goalsOf('6')[0].cpm).toBe(60);
    setGoalOverrides({});
    expect(goalsOf('6').map((g) => g.cpm)).toEqual([100, 140, 180]);
    expect(standardGoals('6').map((g) => g.cpm)).toEqual([100, 140, 180]);
  });
  it('зіпсовані значення виправляються: у межах і по зростанню', () => {
    const g = cleanGradeGoals({ bronze: { cpm: 9999, acc: 10 }, silver: { cpm: 'abc', acc: 200 }, gold: { cpm: -5, acc: 50 } }, '5');
    for (const m of Object.values(g)) { expect(m.cpm).toBeGreaterThanOrEqual(20); expect(m.cpm).toBeLessThanOrEqual(400); expect(m.acc).toBeGreaterThanOrEqual(80); expect(m.acc).toBeLessThanOrEqual(100); }
    expect(g.silver.cpm).toBeGreaterThan(g.bronze.cpm);
    expect(g.gold.cpm).toBeGreaterThanOrEqual(g.silver.cpm);
    expect(g.silver.acc).toBeGreaterThanOrEqual(g.bronze.acc);
    expect(g.gold.acc).toBeGreaterThanOrEqual(g.silver.acc);
    setGoalOverrides('сміття');
    expect(goalsOf('5').map((x) => x.cpm)).toEqual([70, 100, 130]);
  });
  it('стандартні цілі не змінюються самі (GOALS недоторканий)', () => {
    setGoalOverrides({ 5: { bronze: { cpm: 30, acc: 85 }, silver: { cpm: 60, acc: 90 }, gold: { cpm: 90, acc: 95 } } });
    expect(GOALS[5].bronze.cpm).toBe(70);
  });
  it('уже отримані медалі не зникають, коли цілі зроблено суворішими', () => {
    const ch = emptyChallenge();
    applyChallenge(ch, 'ua', '5', { cpm: 135, acc: 98, typed: 300 });
    expect(ch.rec.ua.medal).toBe(3);
    setGoalOverrides({ 5: { bronze: { cpm: 200, acc: 99 }, silver: { cpm: 250, acc: 99 }, gold: { cpm: 300, acc: 100 } } });
    applyChallenge(ch, 'ua', '5', { cpm: 90, acc: 96, typed: 300 });
    expect(ch.rec.ua.medal).toBe(3);
  });
});

describe('Т8: таблиця лідерів', () => {
  const many = [
    prof('a', 'Аня', '5', 120), prof('b', 'Богдан', '5', 100), prof('c', 'Віка', '5', 90), prof('d', 'Гліб', '5', 80),
    prof('e', 'Дана', '5', 70), prof('f', 'Едік', '5', 60), prof('g', 'Женя', '5', 50), prof('h', 'Шостий', '6', 150),
  ];
  it('показує не більше п’яти й ніколи не показує останні місця', () => {
    const rows = boardRows(many, '5', 'ua');
    expect(rows).toHaveLength(BOARD_SIZE);
    expect(rows.map((r) => r.name)).toEqual(['Аня', 'Богдан', 'Віка', 'Гліб', 'Дана']);
    expect(JSON.stringify(rows)).not.toMatch(/Едік|Женя/);
    expect(rows.map((r) => r.place)).toEqual([1, 2, 3, 4, 5]);
  });
  it('5 і 6 клас окремо; мови окремо', () => {
    expect(boardRows(many, '6', 'ua').map((r) => r.name)).toEqual(['Шостий']);
    expect(boardRows(many, '5', 'en')).toEqual([]);
    expect(boardRows([prof('x', 'Англ', '5', 88, 97, 'en')], '5', 'en')).toHaveLength(1);
  });
  it('неточні результати (нижче 95%) у таблицю не потрапляють', () => {
    const rows = boardRows([prof('a', 'Точний', '5', 70, 95), prof('b', 'Неточний', '5', 200, 94), prof('c', 'Без', '5', 0, 0)], '5', 'ua');
    expect(rows.map((r) => r.name)).toEqual(['Точний']);
  });
  it('швидкість при точності 94% не стає топовою у applyChallenge, а при 95% — стає', () => {
    const ch = emptyChallenge();
    applyChallenge(ch, 'ua', '5', { cpm: 150, acc: 94, typed: 300 });
    expect(ch.rec.ua.topCpm).toBe(0);
    expect(ch.rec.ua.bestCpm).toBe(150); // рекорд швидкості (від 92%) є, але в таблицю не йде
    applyChallenge(ch, 'ua', '5', { cpm: 100, acc: 95, typed: 300 });
    expect(ch.rec.ua.topCpm).toBe(100);
    applyChallenge(ch, 'ua', '5', { cpm: 90, acc: 99, typed: 300 }); // гірше за себе — не зменшує
    expect(ch.rec.ua.topCpm).toBe(100);
  });
  it('вимкнена таблиця не повертає нічого', () => {
    expect(boardRows(many, '5', 'ua', false)).toEqual([]);
  });
  it('рівні за швидкістю: нічия вирішується точністю, потім ім’ям; без дублів', () => {
    const rows = boardRows([prof('1', 'Яна', '5', 90, 96), prof('2', 'Ася', '5', 90, 96), prof('3', 'Олег', '5', 90, 99)], '5', 'ua');
    expect(rows.map((r) => r.name)).toEqual(['Олег', 'Ася', 'Яна']);
  });
  it('нота: поза п’ятіркою — власний результат і ціль, без місця', () => {
    const rows = boardRows(many, '5', 'ua');
    const me = many[5]; // Едік, 60
    const n = boardNote(me, rows, 'ua');
    expect(n.onBoard).toBe(false);
    expect(n.line).toContain('60');
    expect(n.line).toContain('ще 11'); // 70 − 60 + 1
    expect(n.line).not.toMatch(/\b6-й\b|із 7|місце/i);
    expect(boardNote(many[0], rows, 'ua').onBoard).toBe(true);
    const fresh = prof('z', 'Нов', '5', 0, 0); fresh.challenge.rec.ua.runs = 0;
    expect(boardNote(fresh, rows, 'ua').line).toMatch(/випробування/);
    const inacc = prof('y', 'Неточний', '5', 0, 0); inacc.challenge.rec.ua.runs = 2;
    expect(boardNote(inacc, rows, 'ua').line).toContain('95%');
  });
});

describe('Т8: прогрес порівняно з минулими спробами', () => {
  it('історія росте, обмежена, порівняння з минулою', () => {
    const ch = emptyChallenge();
    for (let i = 0; i < 15; i++) applyChallenge(ch, 'ua', '5', { cpm: 60 + i * 2, acc: 95, typed: 200 }, '2026-11-0' + (1 + (i % 9)));
    expect(ch.rec.ua.hist).toHaveLength(HIST_MAX);
    const p = progressOf(ch.rec.ua);
    expect(p.dCpm).toBe(2);
    expect(p.last.cpm).toBe(88);
    expect(p.sinceFirst).toBeGreaterThan(0);
  });
  it('перша спроба — лише точка відліку; замало знаків не записується', () => {
    const ch = emptyChallenge();
    applyChallenge(ch, 'ua', '5', { cpm: 80, acc: 95, typed: 10 });
    expect(ch.rec.ua.hist).toHaveLength(0);
    applyChallenge(ch, 'ua', '5', { cpm: 80, acc: 95, typed: 200 });
    const p = progressOf(ch.rec.ua);
    expect(p.prev).toBeNull();
    expect(p.line).toMatch(/відліку/);
  });
  it('гірша спроба не лякає і нічого не віднімає', () => {
    const ch = emptyChallenge();
    applyChallenge(ch, 'ua', '5', { cpm: 100, acc: 96, typed: 200 });
    applyChallenge(ch, 'ua', '5', { cpm: 80, acc: 93, typed: 200 });
    const p = progressOf(ch.rec.ua);
    expect(p.dCpm).toBe(-20);
    expect(p.bestCpm).toBe(100);
    expect(p.line).not.toMatch(/пога|гірш|невдач/i);
  });
  it('старий запис без історії читається', () => {
    const c = cleanChallenge({ open: false, rec: { ua: { runs: 4, medal: 1, bestCpm: 80, bestAcc: 97 } } });
    expect(c.rec.ua.hist).toEqual([]);
    expect(c.rec.ua.topCpm).toBe(0);
    expect(cleanChallenge({ rec: { ua: { hist: [{ cpm: 'x' }, { cpm: 50, acc: 96, d: '2026-01-01' }, null] } } }).rec.ua.hist).toHaveLength(1);
  });
  it('store зберігає історію й рекорд для таблиці', () => {
    const st = createStore(memory());
    const p = st.create({ name: 'Тест', avatar: 'fox', level: '5', world: 'sky' });
    st.finishTeenChallenge(p.id, { layout: 'ua', cpm: 90, acc: 96, typed: 200, errors: 8, words: 20, ids: [1] }, '2026-11-01');
    st.finishTeenChallenge(p.id, { layout: 'ua', cpm: 99, acc: 97, typed: 220, errors: 6, words: 22, ids: [2] }, '2026-11-02');
    const rec = st.get(p.id).challenge.rec.ua;
    expect(rec.hist.map((h) => h.cpm)).toEqual([90, 99]);
    expect(rec.topCpm).toBe(99);
    expect(boardRows(st.list(), '5', 'ua').map((r) => r.cpm)).toEqual([99]);
  });
});

describe('Т8: вимикач, розділ у всіх трьох світах, нуль мережі', () => {
  it('вимикач таблиці — прапорець ноутбука, за замовчуванням таблиця увімкнена', () => {
    expect(getLaptopFlag(BOARD_OFF_FLAG)).toBe(false);
  });
  it('екран відкривається в усіх трьох світах; вимкнено — немає ні п’ятірки, ні посилання', () => {
    const st = createStore(memory());
    for (const [i, world] of Object.keys(THEMES).entries()) {
      const p = st.create({ name: `Аня${i}`, avatar: 'fox', level: '5', world });
      st.finishTeenChallenge(p.id, { layout: 'ua', cpm: 100 + i, acc: 96, typed: 200, errors: 8, words: 20, ids: [1] }, '2026-11-01');
    }
    for (const world of Object.keys(THEMES)) {
      const me = st.list().find((x) => x.world === world);
      expect(themeOf(world)).toBeTruthy();
      let html = '';
      expect(() => { html = boardScreen(me, st.list()); }).not.toThrow();
      expect(html).toContain('Мій прогрес');
      expect(html).toContain('П’ятірка ноутбука');
      expect(html).toContain(me.name);
    }
  });
  it('вимкнена таблиця: екран без п’ятірки, лише «Мій прогрес»', () => {
    const st = createStore(memory());
    const p = st.create({ name: 'Оля', avatar: 'fox', level: '6', world: 'pixel' });
    setLaptopFlag(BOARD_OFF_FLAG, true);
    try {
      const html = boardScreen(st.get(p.id), st.list());
      expect(html).toContain('Мій прогрес');
      expect(html).not.toContain('П’ятірка');
      expect(html).not.toContain('bd-rows');
    } finally { setLaptopFlag(BOARD_OFF_FLAG, false); }
  });
  it('екран не містить жодних мережевих адрес', async () => {
    const st = createStore(memory());
    const me = st.create({ name: 'Аня', avatar: 'fox', level: '5', world: 'voxel' });
    expect(boardScreen(me, [me])).not.toMatch(/https?:|fetch\(|XMLHttp/);
    const fs = await import('node:fs');
    for (const f of ['src/teen/logic/board.js', 'src/teen/screens/board.js']) expect(fs.readFileSync(f, 'utf8')).not.toMatch(/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/);
  });
});
