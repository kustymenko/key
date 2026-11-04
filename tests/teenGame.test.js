// Етап Т6: ігрова оболонка 5–6 класів — досвід, квести дня, нагороди, предмети героя. Одна логіка для всіх трьох світів.
import { describe, it, expect } from 'vitest';
import { createStore } from '../src/storage/store.js';
import { THEMES } from '../src/teen/worlds/index.js';
import { teenRoute, teenScreen } from '../src/teen/screens/index.js';
import { teenContext } from '../src/teen/screens/context.js';
import {
  accCoef, xpForRun, pickQuests, QUEST_SLOTS, QUEST_BY_ID, cleanGame, emptyGame, questsView, rewardsOf, REWARDS, HERO_LOCKS,
  heroLock, heroLocks, allowedHero, coinsOf, MIN_RUN_CHARS,
} from '../src/teen/logic/game.js';
import { HERO_OPTIONS, DEFAULT_HERO, levelInfo, WORLD_IDS } from '../src/teen/logic/profile.js';
import { TEEN_COURSE } from '../src/teen/logic/course.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};
const DAY1 = '2026-11-04', DAY2 = '2026-11-05';
const fresh = (extra = {}) => { const st = createStore(memory()); const p = st.create({ name: 'Олекса', avatar: 'fox', level: '5', world: 'voxel', ...extra }); return { st, id: p.id }; };
const run = (o = {}) => ({ layout: 'ua', lessonId: 1, stars: 3, acc: 100, cpm: 80, by: 'lesson', typed: 200, errors: 0, steps: 3, words: 20, ...o });

describe('досвід (XP)', () => {
  it('коефіцієнт точності зростає з точністю і ніколи не нульовий', () => {
    const accs = [0, 40, 79, 80, 89, 90, 94, 95, 97, 98, 100];
    const cs = accs.map(accCoef);
    for (let i = 1; i < cs.length; i++) expect(cs[i]).toBeGreaterThanOrEqual(cs[i - 1]);
    expect(Math.min(...cs)).toBeGreaterThan(0);
    expect(accCoef(100)).toBe(1);
    expect(accCoef(NaN)).toBeGreaterThan(0);
  });
  it('швидко й неточно невигідно: той самий текст з помилками дає менше, але не нуль і не мінус', () => {
    expect(xpForRun(200, 100)).toBe(200);
    expect(xpForRun(200, 96)).toBeLessThan(xpForRun(200, 100));
    expect(xpForRun(200, 85)).toBeLessThan(xpForRun(200, 96));
    expect(xpForRun(200, 10)).toBeGreaterThan(0);
    for (const bad of [0, -5, NaN, undefined]) expect(xpForRun(bad, 100)).toBe(0);
    for (const acc of [0, 50, 100]) expect(xpForRun(1, acc)).toBeGreaterThanOrEqual(1);
  });
  it('досвід після уроку записується, зберігається й ніколи не зменшується', () => {
    const mem = memory();
    const st = createStore(mem);
    const p = st.create({ name: 'Ліза', avatar: 'cat', level: '5', world: 'sky' });
    let prev = 0;
    for (const acc of [100, 60, 95, 30, 92]) {
      const r = st.finishTeenRun(p.id, run({ acc, stars: acc >= 90 ? 3 : 0, errors: 9 }), DAY1);
      expect(r.gain).toBeGreaterThan(0);
      expect(st.get(p.id).xp).toBeGreaterThanOrEqual(prev);
      prev = st.get(p.id).xp;
    }
    expect(createStore(mem).get(p.id).xp).toBe(prev); // переживає перезавантаження
  });
  it('рівень зростає за 500 досвіду; новий рівень повідомляється один раз', () => {
    const { st, id } = fresh();
    const a = st.finishTeenRun(id, run({ typed: 480 }), DAY1); // 480 + бонуси завдань
    const total = st.get(id).xp;
    expect(levelInfo(total).level).toBe(a.levelUp || 1);
    const b = st.finishTeenRun(id, run({ typed: 1 }), DAY1);
    expect(b.levelUp).toBe(0);
  });
  it('провал (нижче 90%) досвід дає, але урок не зараховує', () => {
    const { st, id } = fresh();
    const r = st.finishTeenRun(id, run({ stars: 0, acc: 80, errors: 40 }), DAY1);
    expect(r.gain).toBe(100);
    expect(st.get(id).teen.ua[1]).toBeUndefined();
    expect(st.get(id).xp).toBeGreaterThan(0);
  });
});

describe('квести дня', () => {
  it('три квести на день, по одному з кожної групи, і вони різні', () => {
    for (let n = 0; n < 40; n++) {
      const qs = pickQuests(`p${n}`, DAY1);
      expect(qs).toHaveLength(3);
      qs.forEach((q, i) => expect(QUEST_SLOTS[i]).toContain(q));
      expect(new Set(qs.map((q) => q.kind)).size).toBeGreaterThanOrEqual(2);
    }
  });
  it('той самий учень у той самий день завжди бачить ті самі квести; наступного дня — нові', () => {
    expect(pickQuests('p1', DAY1).map((q) => q.id)).toEqual(pickQuests('p1', DAY1).map((q) => q.id));
    const days = new Set();
    for (let d = 1; d <= 28; d++) days.add(pickQuests('p1', `2026-11-${String(d).padStart(2, '0')}`).map((q) => q.id).join());
    expect(days.size).toBeGreaterThan(4);
  });
  it('кожен квест виконуваний: ціль досяжна, текст до 8 слів, нагорода — додатний досвід', () => {
    for (const q of Object.values(QUEST_BY_ID)) {
      expect(q.goal).toBeGreaterThan(0);
      expect(q.xp).toBeGreaterThan(0);
      expect(q.t.split(/\s+/).length).toBeLessThanOrEqual(8);
    }
    expect(Object.keys(QUEST_BY_ID).length).toBe(QUEST_SLOTS.flat().length); // id не повторюються
  });
  it('новий профіль: квести показані, нічого не виконано', () => {
    const { st, id } = fresh();
    const qs = questsView(st.get(id), DAY1);
    expect(qs).toHaveLength(3);
    expect(qs.every((q) => !q.done)).toBe(true);
  });
  it('вправа рухає квести; виконаний квест додає бонус і рахується лише раз', () => {
    const { st, id } = fresh();
    const r = st.finishTeenRun(id, run({ typed: 100, steps: 4, words: 9, acc: 100 }), DAY1);
    const qs = questsView(st.get(id), DAY1);
    expect(qs.some((q) => q.done)).toBe(true);
    expect(r.bonus).toBe(r.quests.reduce((s, q) => s + q.xp, 0));
    expect(r.gain + r.bonus).toBe(st.get(id).xp);
    const again = st.finishTeenRun(id, run({ typed: 100, steps: 4, words: 9, acc: 100 }), DAY1);
    for (const q of r.quests) expect(again.quests.map((x) => x.id)).not.toContain(q.id);
    expect(st.get(id).game.questsTotal).toBeGreaterThanOrEqual(r.quests.length);
  });
  it('точність у квесті враховується лише в достатньо довгій вправі; слова з помилками не рахуються', () => {
    const { st, id } = fresh();
    st.finishTeenRun(id, run({ typed: MIN_RUN_CHARS - 1, acc: 100, steps: 0, words: 0, stars: 0 }), DAY1);
    const accQ = st.get(id).game.quests.find((q) => QUEST_BY_ID[q.id].kind === 'acc');
    if (accQ) expect(accQ.prog).toBe(0);
    st.finishTeenRun(id, run({ typed: 100, words: 0, steps: 0, acc: 100, stars: 3, errors: 0 }), DAY1);
    const q2 = st.get(id).game.quests.find((q) => QUEST_BY_ID[q.id].kind === 'words');
    if (q2) expect(q2.prog).toBe(0);
  });
  it('наступного дня квести нові, а накопичене (нагороди, виконані) лишається', () => {
    const { st, id } = fresh();
    st.finishTeenRun(id, run({ typed: 500, steps: 6, words: 30 }), DAY1);
    const done1 = st.get(id).game.questsTotal;
    expect(done1).toBeGreaterThan(0);
    expect(questsView(st.get(id), DAY2).every((q) => !q.done)).toBe(true);
    st.finishTeenRun(id, run({ typed: 5, steps: 0, words: 0, stars: 0 }), DAY2);
    expect(st.get(id).game.day).toBe(DAY2);
    expect(st.get(id).game.questsTotal).toBeGreaterThanOrEqual(done1);
  });
  it('усі три завдання за день → нагорода «Усі завдання дня»', () => {
    const { st, id } = fresh();
    const r = st.finishTeenRun(id, run({ typed: 600, steps: 6, words: 40, acc: 99 }), DAY1);
    expect(r.quests).toHaveLength(3);
    expect(rewardsOf(st.get(id)).find((x) => x.id === 'daily').got).toBe(true);
  });
  it('зіпсований запис гри не ламає екран', () => {
    for (const bad of [undefined, null, 5, 'x', { quests: 'a' }, { day: 'ні', quests: [{ id: 'nope' }] }, { quests: [{ id: 'words3' }], day: DAY1 }, { bestAcc: 'a', questsTotal: -4 }]) {
      const g = cleanGame(bad);
      expect(g).toMatchObject({ day: '', quests: [], questsTotal: 0 });
    }
    expect(cleanGame({ bestAcc: 150, bestCpm: 5000 })).toMatchObject({ bestAcc: 100, bestCpm: 999 });
    expect(cleanGame(emptyGame())).toEqual(emptyGame());
  });
});

describe('нагороди й колекція', () => {
  it('новий учень: нічого не відкрито, вигаданих нагород немає; у кожної закритої є підказка до 6 слів', () => {
    const { st, id } = fresh();
    const rs = rewardsOf(st.get(id));
    expect(rs).toHaveLength(12);
    expect(rs.some((r) => r.got)).toBe(false);
    for (const r of rs) { expect(r.hint.split(/\s+/).length).toBeLessThanOrEqual(6); expect(r.name).toBeTruthy(); }
    expect(new Set(REWARDS.map((r) => r.id)).size).toBe(REWARDS.length);
  });
  it('перший урок, без помилок, точність 98%, швидкість 100 відкриваються за результатами', () => {
    const { st, id } = fresh();
    const r = st.finishTeenRun(id, run({ acc: 100, errors: 0, cpm: 120, typed: 100 }), DAY1);
    expect(r.rewards.map((x) => x.id)).toEqual(expect.arrayContaining(['first', 'clean', 'acc98', 'cpm100']));
    const again = st.finishTeenRun(id, run({ acc: 100, errors: 0, cpm: 120, typed: 100 }), DAY1);
    for (const x of r.rewards) expect(again.rewards.map((y) => y.id)).not.toContain(x.id); // нагорода «нова» лише раз
  });
  it('нагорода не відкривається від короткої вправи і від помилок', () => {
    const { st, id } = fresh();
    st.finishTeenRun(id, run({ acc: 100, errors: 0, cpm: 300, typed: 10 }), DAY1);
    const got = rewardsOf(st.get(id)).filter((r) => r.got).map((r) => r.id);
    expect(got).not.toContain('acc98');
    expect(got).not.toContain('cpm100');
    expect(got).not.toContain('clean');
    st.finishTeenRun(id, run({ acc: 91, errors: 5, cpm: 50, typed: 100 }), DAY1);
    expect(rewardsOf(st.get(id)).find((r) => r.id === 'clean').got).toBe(false);
  });
  it('світи: нагорода за основний ряд з’являється, коли пройдено обидва уроки «Зеленої долини»', () => {
    const { st, id } = fresh();
    st.finishTeenRun(id, run({ lessonId: 1 }), DAY1);
    expect(rewardsOf(st.get(id)).find((r) => r.id === 'main').got).toBe(false);
    const r = st.finishTeenRun(id, run({ lessonId: 2 }), DAY1);
    expect(r.rewards.map((x) => x.id)).toContain('main');
  });
  it('«Дві мови» — лише коли є уроки обох курсів', () => {
    const { st, id } = fresh();
    st.finishTeenRun(id, run({ layout: 'ua', lessonId: 1 }), DAY1);
    expect(rewardsOf(st.get(id)).find((r) => r.id === 'langs').got).toBe(false);
    st.finishTeenRun(id, run({ layout: 'en', lessonId: 1 }), DAY1);
    expect(rewardsOf(st.get(id)).find((r) => r.id === 'langs').got).toBe(true);
  });
  it('усі уроки курсу: нагороди за світи відкриті, коли світи пройдені', () => {
    const { st, id } = fresh();
    for (const l of TEEN_COURSE.ua) st.finishTeenRun(id, run({ lessonId: l.id, typed: 60 }), DAY1);
    const got = rewardsOf(st.get(id)).filter((r) => r.got).map((r) => r.id);
    expect(got).toEqual(expect.arrayContaining(['main', 'upper', 'lower', 'marks', 'digits']));
  });
  it('«Майстер друку» — з 10 рівня', () => {
    const { st, id } = fresh();
    st.finishTeenRun(id, run({ typed: 4500, acc: 100, stars: 3 }), DAY1);
    expect(levelInfo(st.get(id).xp).level).toBeGreaterThanOrEqual(10);
    expect(rewardsOf(st.get(id)).find((r) => r.id === 'master').got).toBe(true);
  });
  it('монети — зібране: зірочки й виконані завдання, ніколи не зменшуються', () => {
    const { st, id } = fresh();
    let prev = 0;
    for (const o of [{ lessonId: 1, stars: 3 }, { lessonId: 1, stars: 1 }, { lessonId: 2, stars: 0, acc: 50 }, { lessonId: 3, stars: 2 }]) {
      st.finishTeenRun(id, run(o), DAY1);
      const c = coinsOf(st.get(id));
      expect(c).toBeGreaterThanOrEqual(prev);
      prev = c;
    }
    expect(prev).toBeGreaterThan(0);
  });
});

describe('предмети героя: нові відкриваються нагородами й рівнями', () => {
  it('закриті предмети мають підказку, їх індекси існують у HERO_OPTIONS', () => {
    for (const l of HERO_LOCKS) expect(l.idx).toBeLessThan(HERO_OPTIONS[l.key].vals.length);
    const { st, id } = fresh();
    const locks = heroLocks(st.get(id));
    expect(Object.keys(locks).length).toBe(HERO_LOCKS.length);
    for (const h of Object.values(locks)) expect(h.split(/\s+/).length).toBeLessThanOrEqual(6);
    // стартові варіанти відкриті
    expect(heroLock(st.get(id), 'hat', 0)).toBe('');
    expect(heroLock(st.get(id), 'outfit', 4)).toBe('');
  });
  it('закритий предмет вибрати не можна, а після нагороди — можна', () => {
    const { st, id } = fresh();
    st.update(id, { hero: { ...DEFAULT_HERO, hat: 4 } }); // навушники — за «Без помилок»
    expect(st.get(id).hero.hat).toBe(DEFAULT_HERO.hat);
    st.finishTeenRun(id, run({ acc: 100, errors: 0, typed: 100 }), DAY1);
    st.update(id, { hero: { ...DEFAULT_HERO, hat: 4 } });
    expect(st.get(id).hero.hat).toBe(4);
  });
  it('шапка відкривається з 3 рівня', () => {
    const { st, id } = fresh();
    expect(heroLock(st.get(id), 'hat', 5)).not.toBe('');
    st.finishTeenRun(id, run({ typed: 1100 }), DAY1);
    expect(levelInfo(st.get(id).xp).level).toBeGreaterThanOrEqual(3);
    expect(heroLock(st.get(id), 'hat', 5)).toBe('');
  });
  it('скидання прогресу знову закриває предмети й не лишає героя в закритому', () => {
    const { st, id } = fresh();
    st.finishTeenRun(id, run({ acc: 100, errors: 0, typed: 100 }), DAY1);
    st.update(id, { hero: { ...DEFAULT_HERO, hat: 4 } });
    st.resetProgress(id);
    expect(st.get(id).hero.hat).toBe(DEFAULT_HERO.hat);
    expect(st.get(id).xp).toBe(0);
    expect(st.get(id).game).toEqual(emptyGame());
  });
  it('allowedHero не змінює відкритий вибір', () => {
    const { st, id } = fresh();
    expect(allowedHero(st.get(id), { skin: 2, outfit: 0, hat: 3 })).toEqual({ skin: 2, outfit: 0, hat: 3 });
  });
});

describe('збереження і старі профілі', () => {
  it('гра переживає перезавантаження; старий профіль без гри читається', () => {
    const mem = memory();
    const a = createStore(mem);
    const p = a.create({ name: 'Макс', avatar: 'bear', level: '6', world: 'pixel' });
    a.finishTeenRun(p.id, run({ typed: 300 }), DAY1);
    const b = createStore(mem).get(p.id);
    expect(b.game.day).toBe(DAY1);
    expect(b.game.quests).toHaveLength(3);
    expect(b.game.bestAcc).toBe(100);
    const old = memory();
    old.setItem('klaviaturka.v1', JSON.stringify({ v: 1, profiles: [{ id: 'o', name: 'Старий', avatar: 'owl', level: '5', world: 'sky', xp: 700 }] }));
    const o = createStore(old).get('o');
    expect(o.game).toEqual(emptyGame());
    expect(o.xp).toBe(700);
  });
  it('профілі 1–4 класів нічого не отримують: гра лише в їхніх «схованих» полях', () => {
    const { st, id } = fresh({ level: '3-4' });
    expect(st.get(id).game).toEqual(emptyGame());
    expect(st.get(id).xp).toBe(0);
  });
  it('без сховища гра працює в пам’яті', () => {
    const st = createStore(null);
    const p = st.create({ name: 'Тимур', avatar: 'fox', level: '5', world: 'sky' });
    expect(st.finishTeenRun(p.id, run(), DAY1).gain).toBeGreaterThan(0);
  });
});

describe('екрани: світ, світи, нагороди, герой у кожному з трьох світів', () => {
  const teen = (world, play = false) => {
    const { st, id } = fresh({ world });
    if (play) { st.finishTeenRun(id, run({ acc: 100, errors: 0, typed: 100 }), DAY1); st.finishTeenRun(id, run({ lessonId: 2 }), DAY1); }
    return st.get(id);
  };
  it('карта світів #teen/worlds розпізнається й малюється в кожному світі', () => {
    expect(teenRoute('teen/worlds')).toEqual({ tab: 'worlds' });
    for (const w of WORLD_IDS) {
      const html = teenScreen({ tab: 'worlds' }, teen(w));
      expect(html, w).toContain('data-world-card="5"');
      expect(html).toContain('Спершу пройди');
      expect(html).toContain('Вершина швидкості');
      expect((html.match(/data-world-card/g) ?? []).length).toBe(6);
    }
  });
  it('закритий світ — підказка, пройдений — позначка, поточний — відсотки', () => {
    const p = teen('voxel', true);
    const html = teenScreen({ tab: 'worlds' }, p);
    expect(html).toContain('Пройдено');
    expect(html).toContain('Ти тут');
    expect(html).toContain('Відкриється з випробуваннями');
  });
  it('нагороди з підказками: закриті — «як отримати», відкриті — «Є!» або предмет; у кожному світі', () => {
    for (const w of WORLD_IDS) {
      const none = teenScreen({ tab: 'rewards' }, teen(w));
      expect(none, w).toContain('Пройди будь-який урок');
      expect(none).toContain('0 з 12');
      const some = teenScreen({ tab: 'rewards' }, teen(w, true));
      expect(some, w).toContain('Предмет:');
      expect(some).not.toContain('0 з 12');
    }
  });
  it('герой: закриті предмети — замочок і підказка; відкриті — звичайні кнопки', () => {
    for (const w of WORLD_IDS) {
      const html = teenScreen({ tab: 'avatar' }, teen(w));
      expect(html, w).toContain('Нагорода: Без помилок');
      expect(html).toContain('Досягни 3 рівня');
      expect(html).toContain('data-lockinfo');
      expect((html.match(/is-locked/g) ?? []).length).toBe(HERO_LOCKS.length);
      expect(html).toMatch(/data-opt="hat" data-val="4"[^>]*aria-disabled="true"[^>]*data-lock="Нагорода: Без помилок"/);
      expect(html).toMatch(/data-opt="hat" data-val="1"(?![^>]*aria-disabled)/);
      const open = teenScreen({ tab: 'avatar' }, teen(w, true));
      expect((open.match(/is-locked/g) ?? []).length).toBeLessThan(HERO_LOCKS.length);
    }
  });
  it('карта світів: завдання дня в кожному світі показують справжні дані профілю', () => {
    for (const w of WORLD_IDS) {
      const p = teen(w);
      const html = teenScreen({ tab: 'world' }, p);
      for (const q of questsView(p)) expect(html, `${w}: ${q.t}`).toContain(q.t);
      expect(html).toContain('href="#teen/worlds"');
    }
  });
  it('усі шість станів контексту: монети, рівень, нагороди, замки', () => {
    const p = teen('sky', true);
    const ctx = teenContext(p);
    expect(ctx.player.coins).toBe(coinsOf(p));
    expect(ctx.progress.rewards).toHaveLength(12);
    expect(ctx.progress.quests).toHaveLength(3);
    expect(Object.keys(ctx.locks).length).toBeGreaterThan(0);
  });
  it('кожен світ має setXp для оновлення смуги досвіду після вправи', () => {
    for (const w of WORLD_IDS) expect(typeof THEMES[w].setXp, w).toBe('function');
  });
  it('нові предмети (навушники, шапка) малюються в кожному світі й змінюють вигляд героя', () => {
    for (const w of WORLD_IDS) {
      const t = THEMES[w];
      const base = t.avatarSvg(100, { ...DEFAULT_HERO, hat: 0 });
      const a = t.avatarSvg(100, { ...DEFAULT_HERO, hat: 4 });
      const b = t.avatarSvg(100, { ...DEFAULT_HERO, hat: 5 });
      expect(a, w).not.toBe(base);
      expect(b, w).not.toBe(base);
      expect(a, w).not.toBe(b);
      for (const o of [5, 6, 7]) expect(t.avatarSvg(100, { ...DEFAULT_HERO, outfit: o }), w).not.toBe(t.avatarSvg(100, DEFAULT_HERO));
    }
  });
});
