import { describe, it, expect } from 'vitest';
import {
  GOALS, CHALLENGE_MS, MIN_CHARS, medalFor, goalHint, goalsOf, cleanChallenge, emptyChallenge, applyChallenge, resultLines,
  buildChallengeText, challengePool, challengeOpen, medalsCount,
} from '../src/teen/logic/challenge.js';
import { worldsFromLessons, lessonStates } from '../src/teen/logic/progress.js';
import { TEEN_COURSE } from '../src/teen/logic/course.js';
import { TEEN_TEXTS } from '../src/content/teen/index.js';
import { createStore, cleanProfile } from '../src/storage/store.js';
import { themeOf } from '../src/teen/worlds/index.js';

const seeded = (seed = 1) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const allDone = (layout) => Object.fromEntries(TEEN_COURSE[layout].map((l) => [l.id, { stars: 2 }]));

describe('Т7: цілі й медалі', () => {
  it('цілі 5 і 6 класу — як погоджено', () => {
    expect(goalsOf('5').map((g) => [g.cpm, g.acc])).toEqual([[70, 92], [100, 95], [130, 97]]);
    expect(goalsOf('6').map((g) => [g.cpm, g.acc])).toEqual([[100, 92], [140, 95], [180, 97]]);
    expect(CHALLENGE_MS).toBe(120000);
  });
  it('медаль дається лише коли виконано ОБИДВІ умови (межі 5 класу)', () => {
    expect(medalFor('5', 70, 92)).toBe(1);
    expect(medalFor('5', 69, 99)).toBe(0); // швидкості бракує
    expect(medalFor('5', 200, 91)).toBe(0); // точності бракує: швидкість не рахується
    expect(medalFor('5', 100, 95)).toBe(2);
    expect(medalFor('5', 100, 94)).toBe(1); // срібна швидкість, бронзова точність
    expect(medalFor('5', 130, 97)).toBe(3);
    expect(medalFor('5', 130, 96)).toBe(2);
    expect(medalFor('5', 129, 100)).toBe(2);
  });
  it('межі 6 класу', () => {
    expect(medalFor('6', 99, 100)).toBe(0);
    expect(medalFor('6', 100, 92)).toBe(1);
    expect(medalFor('6', 140, 95)).toBe(2);
    expect(medalFor('6', 180, 97)).toBe(3);
    expect(medalFor('6', 180, 96)).toBe(2);
    // однакова швидкість дає різне в 5 і 6 класі
    expect(medalFor('5', 130, 97)).toBe(3);
    expect(medalFor('6', 130, 97)).toBe(1);
  });
  it('підказка до цілі називає точність першою і не лає за швидкість', () => {
    expect(goalHint('5', 150, 85, 0)).toMatch(/точність 92%/);
    expect(goalHint('5', 150, 85, 0)).toMatch(/Швидкості вистачає/);
    expect(goalHint('5', 50, 85, 0)).toMatch(/Спершу точність/);
    expect(goalHint('5', 60, 95, 0)).toBe('До бронзи ще 10 знаків за хвилину.');
    expect(goalHint('5', 100, 99, 3)).toMatch(/Золото вже є/);
  });
});

describe('Т7: рекорди нічого не віднімають', () => {
  const fresh = () => emptyChallenge();
  it('перша спроба: рекорди записані, «новий рекорд» не лунає', () => {
    const ch = fresh();
    const out = applyChallenge(ch, 'ua', '5', { cpm: 80, acc: 94, typed: 160 });
    expect(out).toMatchObject({ medal: 1, newMedal: true, first: true, newCpm: false, newAcc: false, short: false });
    expect(ch.rec.ua).toMatchObject({ runs: 1, medal: 1, bestCpm: 80, bestAcc: 94 });
  });
  it('гірша спроба не зменшує ні рекорди, ні медаль', () => {
    const ch = fresh();
    applyChallenge(ch, 'ua', '5', { cpm: 110, acc: 96, typed: 220 });
    const before = JSON.stringify(ch.rec.ua);
    const out = applyChallenge(ch, 'ua', '5', { cpm: 40, acc: 70, typed: 80 });
    expect(out.medal).toBe(0);
    expect(ch.rec.ua).toMatchObject({ medal: 2, bestCpm: 110, bestAcc: 96, runs: 2 });
    expect(JSON.parse(before).medal).toBe(2);
  });
  it('швидкість у рекорд іде лише при точності від 92%', () => {
    const ch = fresh();
    applyChallenge(ch, 'ua', '5', { cpm: 60, acc: 95, typed: 120 });
    applyChallenge(ch, 'ua', '5', { cpm: 200, acc: 80, typed: 400 }); // швидко й неточно
    expect(ch.rec.ua.bestCpm).toBe(60);
    const out = applyChallenge(ch, 'ua', '5', { cpm: 75, acc: 93, typed: 150 });
    expect(out.newCpm).toBe(true);
    expect(ch.rec.ua.bestCpm).toBe(75);
  });
  it('новий рекорд точності та нова медаль відмічаються', () => {
    const ch = fresh();
    applyChallenge(ch, 'ua', '6', { cpm: 100, acc: 93, typed: 200 });
    const out = applyChallenge(ch, 'ua', '6', { cpm: 100, acc: 98, typed: 200 });
    expect(out.newAcc).toBe(true);
    expect(out.newMedal).toBe(false); // бронза вже була
    const out2 = applyChallenge(ch, 'ua', '6', { cpm: 145, acc: 96, typed: 290 });
    expect(out2.newMedal).toBe(true);
    expect(ch.rec.ua.medal).toBe(2);
  });
  it('замало знаків — нічого не рахуємо і нічого не віднімаємо', () => {
    const ch = fresh();
    applyChallenge(ch, 'ua', '5', { cpm: 90, acc: 96, typed: 180 });
    const copy = JSON.stringify(ch);
    const out = applyChallenge(ch, 'ua', '5', { cpm: 300, acc: 100, typed: MIN_CHARS - 1 });
    expect(out.short).toBe(true);
    expect(JSON.stringify(ch)).toBe(copy);
  });
  it('мови окремо', () => {
    const ch = fresh();
    applyChallenge(ch, 'ua', '5', { cpm: 90, acc: 96, typed: 180 });
    expect(ch.rec.en.runs).toBe(0);
    expect(medalsCount(ch)).toBe(1);
  });
  it('зіпсований запис очищається', () => {
    const c = cleanChallenge({ open: 1, rec: { ua: { runs: -3, medal: 9, bestCpm: 'x', bestAcc: 500 }, en: null }, seen: [3, 'a', -1, 7.5, 9] });
    expect(c.open).toBe(true);
    expect(c.rec.ua).toEqual({ runs: 0, medal: 0, bestCpm: 0, bestAcc: 100, topCpm: 0, topAcc: 0, hist: [] });
    expect(c.seen).toEqual([3, 9]);
    expect(cleanChallenge(null)).toEqual(emptyChallenge());
  });
  it('фрази: до 3 рядків, без вигуків, ціль називає точність', () => {
    const ch = fresh();
    const res = { cpm: 150, acc: 85 };
    const out = applyChallenge(ch, 'ua', '5', { ...res, typed: 300 });
    const lines = resultLines('5', res, out, ch.rec.ua);
    expect(lines.length).toBeLessThanOrEqual(3);
    expect(lines.join(' ')).not.toMatch(/!/);
    expect(lines.join(' ')).toMatch(/точність 92%/);
    expect(resultLines('5', res, { short: true }, ch.rec.ua)).toEqual(['Замало знаків для результату. Спробуй ще раз.']);
  });
});

describe('Т7: текст випробування', () => {
  it('лише літери й прості знаки, без цифр, апострофа, Ґ, лапок і дужок', () => {
    for (const layout of ['ua', 'en']) {
      const pool = challengePool(layout);
      expect(pool.length).toBeGreaterThan(60);
      for (const e of pool) expect(e.t).toMatch(/^[^\d'’ʼґҐ"()№%*+=#$&@\n]+$/);
    }
  });
  it('достатньо довгий і не повторює речень, поки є нові', () => {
    for (const layout of ['ua', 'en']) {
      const { text, ids } = buildChallengeText(layout, [], seeded(3));
      expect(text.length).toBeGreaterThanOrEqual(1100);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
  it('наступна спроба бере речення, яких ще не було', () => {
    const a = buildChallengeText('ua', [], seeded(5));
    const b = buildChallengeText('ua', a.ids, seeded(9));
    expect(b.ids.filter((i) => a.ids.includes(i))).toEqual([]);
  });
  it('коли нових не лишилось, повторюємо найдавніші, а не ламаємось', () => {
    const all = TEEN_TEXTS.ua.sentences.map((_, i) => i);
    const { text, ids } = buildChallengeText('ua', all, seeded(2));
    expect(text.length).toBeGreaterThanOrEqual(1100);
    expect(ids.length).toBeGreaterThan(5);
  });
});

describe('Т7: доступ і карта', () => {
  it('«Вершина швидкості»: закрита, поки не пройдено курс; потім відкрита; після золота — пройдена', () => {
    const states = (done) => lessonStates('ua', { teen: { ua: done } });
    const last = (done, ch) => worldsFromLessons('ua', states(done), ch)[5];
    expect(last({}).state).toBe('locked');
    expect(last({}).hint).toMatch(/Цифровий ліс/);
    expect(last(allDone('ua'))).toMatchObject({ state: 'now', pct: 0 });
    expect(last(allDone('ua'), { medal: 2 })).toMatchObject({ state: 'now', pct: 67 });
    expect(last(allDone('ua'), { medal: 3 })).toMatchObject({ state: 'done', pct: 100 });
  });
  it('випробування відкрите після курсу або коли дорослий відкрив його вручну', () => {
    const store = createStore(memory());
    const p = store.create({ name: 'Оля', avatar: 'fox', level: '5', world: 'voxel' });
    expect(challengeOpen(store.get(p.id), 'ua')).toBe(false);
    store.update(p.id, { challengeOpen: true });
    expect(challengeOpen(store.get(p.id), 'ua')).toBe(true);
    store.update(p.id, { challengeOpen: false });
    expect(challengeOpen({ ...store.get(p.id), teen: { ua: allDone('ua'), en: {} } }, 'ua')).toBe(true);
  });
});

describe('Т7: збереження результату', () => {
  it('finishTeenChallenge: рекорди, досвід, завдання дня; зберігається і читається', () => {
    const st = memory();
    const store = createStore(st);
    const p = store.create({ name: 'Ілько', avatar: 'fox', level: '6', world: 'sky' });
    const r = store.finishTeenChallenge(p.id, { layout: 'ua', cpm: 150, acc: 96, typed: 300, errors: 12, words: 30, ids: [1, 2, 3] });
    expect(r.out).toMatchObject({ medal: 2, newMedal: true });
    expect(r.game.gain).toBeGreaterThan(0);
    expect(store.get(p.id).xp).toBeGreaterThan(0);
    const again = createStore(st).get(p.id);
    expect(again.challenge.rec.ua).toMatchObject({ medal: 2, bestCpm: 150, bestAcc: 96, runs: 1 });
    expect(again.challenge.seen).toEqual([1, 2, 3]);
  });
  it('слабка спроба дає трохи досвіду і нічого не зменшує', () => {
    const store = createStore(memory());
    const p = store.create({ name: 'Ілько', avatar: 'fox', level: '5', world: 'pixel' });
    store.finishTeenChallenge(p.id, { layout: 'ua', cpm: 90, acc: 96, typed: 180, errors: 8, words: 20, ids: [1] });
    const xp = store.get(p.id).xp;
    const r = store.finishTeenChallenge(p.id, { layout: 'ua', cpm: 30, acc: 60, typed: 60, errors: 40, words: 1, ids: [2] });
    expect(r.out.medal).toBe(0);
    expect(store.get(p.id).xp).toBeGreaterThan(xp);
    expect(store.get(p.id).challenge.rec.ua).toMatchObject({ medal: 1, bestCpm: 90, bestAcc: 96 });
  });
  it('для 1–4 класів результат не записується', () => {
    const store = createStore(memory());
    const p = store.create({ name: 'Мала', avatar: 'fox', level: '3-4' });
    expect(store.finishTeenChallenge(p.id, { layout: 'ua', cpm: 90, acc: 96, typed: 180, errors: 1, words: 5, ids: [] })).toBeNull();
  });
  it('старий профіль без поля challenge читається; зміна класу не губить медалі', () => {
    expect(cleanProfile({ id: 'a', name: 'x', level: '5' }).challenge).toEqual(emptyChallenge());
    const store = createStore(memory());
    const p = store.create({ name: 'Ілько', avatar: 'fox', level: '5', world: 'voxel' });
    store.finishTeenChallenge(p.id, { layout: 'ua', cpm: 90, acc: 96, typed: 180, errors: 8, words: 20, ids: [] });
    store.update(p.id, { level: '6' });
    expect(store.get(p.id).challenge.rec.ua.medal).toBe(1);
    expect(GOALS[6].bronze.cpm).toBe(100);
  });
});

describe('Т7: екран відкривається в усіх трьох світах', () => {
  for (const world of ['voxel', 'pixel', 'sky']) {
    it(`${world}: закрите й відкрите випробування, посилання в панелі й на карті`, async () => {
      const { challengeScreen } = await import('../src/teen/screens/challenge.js');
      const { worldsScreen } = await import('../src/teen/screens/worlds.js');
      const { playBar } = await import('../src/teen/screens/controls.js');
      const { teenContext } = await import('../src/teen/screens/context.js');
      const store = createStore(memory());
      const p = store.create({ name: 'Оля', avatar: 'fox', level: '5', world });
      const closed = challengeScreen(store.get(p.id));
      expect(closed).toContain('ще закрите');
      expect(closed).not.toContain('keys-panel');
      expect(worldsScreen(store.get(p.id))).not.toContain('teen/challenge');
      store.update(p.id, { challengeOpen: true });
      const open = challengeScreen(store.get(p.id));
      expect(open).toContain('data-time');
      expect(open).toContain('keys-panel');
      expect(open).not.toContain('data-hint'); // підказок у випробуванні немає
      expect(open.toLowerCase()).toMatch(/випробування/);
      expect(open).not.toContain('undefined');
      expect(worldsScreen(store.get(p.id))).toContain('href="#teen/challenge"');
      // звичайний урок без таймера
      const lesson = themeOf(world).screen('lesson', teenContext(store.get(p.id), { lesson: { id: 1, layout: 'ua', heading: 'Урок 1', numRow: false } }));
      expect(lesson).not.toContain('data-time');
      expect(lesson).toContain('data-hint');
      // панель «Далі» після всіх уроків веде у випробування
      const done = { ...store.get(p.id), teen: { ua: allDone('ua'), en: {} } };
      expect(playBar('x', teenContext(done))).toContain('href="#teen/challenge"');
    });
  }
});
