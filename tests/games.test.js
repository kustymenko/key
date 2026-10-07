import { describe, it, expect } from 'vitest';
import { createGame, step, press, target, isUnlocked, gameLetters, FALLING_SECONDS, GAMES } from '../src/games/engine.js';
import { learnedLetters } from '../src/lessons/generator.js';
import { COURSE } from '../src/lessons/course.js';
import { createStore, cleanProfile } from '../src/storage/store.js';
import { gameDonePhrase } from '../src/content/phrases.js';

// Дитина, що пройшла уроки 1..n
const doneTo = (layout, n) => ({ ua: {}, en: {}, [layout]: Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, 2])) });
// Передбачуваний «випадковий» генератор
const seeded = (seed = 7) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const run = (g, seconds, dt = 0.05) => { const ev = []; for (let t = 0; t < seconds && !g.done; t += dt) ev.push(...step(g, dt)); return ev; };

describe('відкриття ігор', () => {
  it('«Кульки» — після 3-го уроку, «Падаючі літери» — після 6-го', () => {
    for (const layout of ['ua', 'en']) {
      expect(isUnlocked('balloons', layout, doneTo(layout, 2))).toBe(false);
      expect(isUnlocked('balloons', layout, doneTo(layout, 3))).toBe(true);
      expect(isUnlocked('falling', layout, doneTo(layout, 5))).toBe(false);
      expect(isUnlocked('falling', layout, doneTo(layout, 6))).toBe(true);
    }
  });
  it('уроки іншого курсу не відкривають гру', () => {
    expect(isUnlocked('balloons', 'en', doneTo('ua', 10))).toBe(false);
  });
  it('режим перевірки відкриває обидві', () => {
    expect(isUnlocked('falling', 'ua', doneTo('ua', 0), true)).toBe(true);
  });
});

describe('літери ігор', () => {
  it('лише вивчені літери, без пробілу й розділових знаків', () => {
    for (const layout of ['ua', 'en']) {
      for (let n = 1; n <= COURSE[layout].length; n++) {
        const letters = gameLetters(layout, doneTo(layout, n));
        const allowed = new Set(learnedLetters(layout, n));
        expect(letters.length).toBeGreaterThan(0);
        letters.forEach((c) => { expect(allowed.has(c)).toBe(true); expect(/^[\p{L}]$/u.test(c)).toBe(true); });
      }
    }
  });
  it('після 3 уроку українською — 6 літер: а о в л і д', () => {
    expect(new Set(gameLetters('ua', doneTo('ua', 3)))).toEqual(new Set(['а', 'в', 'д', 'і', 'л', 'о']));
  });
  it('у грі не з’являється жодної літери понад вивчені (обидві гри, обидва рівні)', () => {
    for (const layout of ['ua', 'en']) for (const kind of Object.keys(GAMES)) for (const level of ['1-2', '3-4']) {
      const letters = gameLetters(layout, doneTo(layout, kind === 'balloons' ? 3 : 6));
      const g = createGame({ kind, letters, level, rng: seeded() });
      const seen = new Set();
      run(g, 70).forEach((e) => e.type === 'spawn' && seen.add(e.item.ch));
      expect(seen.size).toBeGreaterThan(0);
      seen.forEach((c) => expect(letters).toContain(c));
    }
  });
});

describe('кульки', () => {
  const mk = (level = '1-2') => createGame({ kind: 'balloons', letters: ['а', 'о', 'в', 'л', 'і', 'д'], level, rng: seeded() });
  it('правильна літера лопає кульку, велика теж; неправильна нічого не ламає', () => {
    const g = mk(); run(g, 1);
    const b = g.items[0];
    expect(press(g, 'я').hit).toBeNull();
    expect(g.items).toHaveLength(1);
    expect(press(g, b.ch.toUpperCase()).hit).toBe(b);
    expect(g.caught).toBe(1);
  });
  it('кулька, що відлетіла, зникає без штрафу; раунд закінчується сам', () => {
    const g = mk();
    const ev = run(g, 400);
    expect(g.done).toBe(true);
    expect(g.caught).toBe(0);
    expect(g.spawned).toBe(12);
    expect(ev.filter((e) => e.type === 'gone').length).toBe(12);
  });
  it('на полі ніколи не більше, ніж дозволено, і однакові літери не повторюються, поки є вибір', () => {
    const g = mk('3-4');
    for (let t = 0; t < 60; t += 0.05) {
      step(g, 0.05);
      expect(g.items.length).toBeLessThanOrEqual(5);
      const chs = g.items.map((i) => i.ch);
      expect(new Set(chs).size).toBe(chs.length);
    }
  });
  it('у 1–2 класі стартова швидкість вдвічі менша', () => {
    expect(mk('1-2').cfg.speed * 2).toBe(mk('3-4').cfg.speed);
  });
  it('підказка (target) — кулька, що ось-ось відлетить', () => {
    const g = mk('3-4'); run(g, 6);
    const t = target(g);
    g.items.forEach((i) => expect(i.p).toBeLessThanOrEqual(t.p));
  });
});

describe('падаючі літери', () => {
  it('гра триває рівно хвилину', () => {
    const g = createGame({ kind: 'falling', letters: ['а', 'о', 'в', 'л', 'і', 'д'], level: '3-4', rng: seeded() });
    run(g, FALLING_SECONDS - 1);
    expect(g.done).toBe(false);
    run(g, 2);
    expect(g.done).toBe(true);
    expect(g.items).toHaveLength(0);
  });
});

describe('адаптивна швидкість', () => {
  const letters = ['а', 'о', 'в', 'л', 'і', 'д'];
  it('якщо влучає в усе — пришвидшується, але не безмежно', () => {
    const g = createGame({ kind: 'falling', letters, level: '1-2', rng: seeded() });
    for (let i = 0; i < 400 && !g.done; i++) { step(g, 0.1); g.items.slice().forEach((it) => press(g, it.ch)); }
    expect(g.f).toBeGreaterThan(1);
    expect(g.f).toBeLessThanOrEqual(g.cfg.cap);
  });
  it('якщо пропускає — сповільнюється, але не менше половини', () => {
    const g = createGame({ kind: 'falling', letters, level: '3-4', rng: seeded() });
    run(g, 59);
    expect(g.f).toBeLessThan(1);
    expect(g.f).toBeGreaterThanOrEqual(0.5);
  });
  it('один промах швидкість не міняє', () => {
    const g = createGame({ kind: 'balloons', letters, level: '3-4', rng: seeded() });
    g.hitRun = 2; g.missRun = 0;
    g.items.push({ id: 99, ch: 'а', lane: 0, p: 0.999, phase: 0 });
    step(g, 0.5);
    expect(g.f).toBe(1);
  });
});

describe('збереження результатів гри', () => {
  const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  it('рекорд рахується лише порівняно з самою дитиною, перша гра рекордом не є', () => {
    const s = createStore(memory());
    const p = s.create({ name: 'Оля', avatar: 'fox' });
    expect(s.saveGame(p.id, 'balloons', 'ua', 5).record).toBe(false);
    expect(s.saveGame(p.id, 'balloons', 'ua', 8).record).toBe(true);
    expect(s.saveGame(p.id, 'balloons', 'ua', 3)).toEqual({ record: false, best: 8 });
    expect(s.saveGame(p.id, 'balloons', 'en', 2).record).toBe(false); // інший курс — окремий результат
    expect(p.games['balloons-ua']).toEqual({ plays: 3, best: 8 });
  });
  it('зіпсовані дані ігор очищуються', () => {
    const c = cleanProfile({ id: 'x', games: { 'balloons-ua': { plays: -4, best: 'a' }, evil: { best: 9 }, 'falling-en': { plays: 2, best: 7 } } });
    expect(c.games).toEqual({ 'balloons-ua': { plays: 0, best: 0 }, 'falling-en': { plays: 2, best: 7 } });
  });
});

describe('фрази', () => {
  it('підсумок гри відмінюється правильно і підбадьорює при нулі', () => {
    expect(gameDonePhrase('balloons', 1)).toBe('Ти лопнув 1 кульку!');
    expect(gameDonePhrase('balloons', 3)).toBe('Ти лопнув 3 кульки!');
    expect(gameDonePhrase('balloons', 12)).toBe('Ти лопнув 12 кульок!');
    expect(gameDonePhrase('falling', 5)).toBe('Ти спіймав 5 літер!');
    expect(gameDonePhrase('falling', 0)).not.toMatch(/0/);
  });
});
