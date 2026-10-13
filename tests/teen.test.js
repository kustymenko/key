// Світ 5–6 класів, Етап Т1: одна логіка — три світи. Кожен екран відкривається в кожному світі.
import { describe, it, expect } from 'vitest';
import { createStore } from '../src/storage/store.js';
import { THEMES } from '../src/teen/worlds/index.js';
import { teenRoute, teenScreen } from '../src/teen/screens/index.js';
import { conceptRoute, conceptScreen } from '../src/teen/screens/concepts.js';
import { worldPickHtml } from '../src/teen/screens/pick.js';
import { teenContext } from '../src/teen/screens/context.js';
import { TEXT } from '../src/teen/screens/typing.js';
import { profilesScreen } from '../src/screens/profiles.js';
import { levelInfo, cleanHero, homeRoute, isTeen, WORLD_IDS, DEFAULT_HERO, HERO_OPTIONS, pickTip, HELPER_TIPS } from '../src/teen/logic/profile.js';
import { codeOfChar } from '../src/keyboard/layouts.js';
import { fingerOf } from '../src/keyboard/fingers.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};
const TABS = ['world', 'avatar', 'type', 'rewards'];
const teenProfile = (world, { helperHidden = false, ...extra } = {}) => {
  const st = createStore(memory());
  const p = st.create({ name: 'Олекса', avatar: 'fox', level: '5', world, hero: DEFAULT_HERO, ...extra });
  if (helperHidden) st.update(p.id, { helperHidden: true });
  return st.get(p.id);
};

describe('логіка профілю 5–6 (спільна для всіх світів)', () => {
  it('рівні й досвід', () => {
    expect(levelInfo(0)).toEqual({ level: 1, xp: 0, xpMax: 500, total: 0 });
    expect(levelInfo(499).level).toBe(1);
    expect(levelInfo(500)).toMatchObject({ level: 2, xp: 0 });
    expect(levelInfo(1340)).toMatchObject({ level: 3, xp: 340 });
    for (const bad of [undefined, null, -5, NaN, 'x']) expect(levelInfo(bad).level).toBe(1);
  });
  it('герой завжди безпечний', () => {
    expect(cleanHero(undefined)).toEqual(DEFAULT_HERO);
    expect(cleanHero({ skin: 99, outfit: -1, hat: 'x' })).toEqual(DEFAULT_HERO);
    expect(cleanHero({ skin: 3, outfit: 4, hat: 0 })).toEqual({ skin: 3, outfit: 4, hat: 0 });
  });
  it('куди йти після вибору картки', () => {
    expect(homeRoute({ level: '1-2' })).toBe('map');
    expect(homeRoute({ level: '3-4', world: 'sky' })).toBe('map');
    expect(homeRoute({ level: '5', world: 'sky' })).toBe('teen');
    expect(homeRoute({ level: '6', world: null })).toBe('teen/pick'); // клас змінили на 6, світ ще не обрано
    expect(isTeen('5') && isTeen('6') && !isTeen('3-4')).toBe(true);
  });
  it('підказки помічника короткі й не повторюються підряд', () => {
    for (const t of HELPER_TIPS) expect(t.split(/\s+/).length).toBeLessThanOrEqual(10);
    let prev = '';
    for (let i = 0; i < 50; i++) { const t = pickTip(prev); expect(t).not.toBe(prev); prev = t; }
  });
});

describe('збереження профілю 5–6', () => {
  it('світ, герой і помічник зберігаються й переживають перезавантаження', () => {
    const st = memory();
    const a = createStore(st);
    const p = a.create({ name: 'Олекса', avatar: 'fox', level: '6', world: 'pixel', hero: { skin: 2, outfit: 3, hat: 2 } });
    a.update(p.id, { world: 'sky', helperHidden: true, hero: { skin: 0, outfit: 0, hat: 3 } });
    const b = createStore(st).get(p.id);
    expect(b).toMatchObject({ level: '6', world: 'sky', helperHidden: true, hero: { skin: 0, outfit: 0, hat: 3 } });
  });
  it('неправильний світ не приймається; старий профіль без світу читається', () => {
    const a = createStore(memory());
    const p = a.create({ name: 'Ліза', avatar: 'cat', level: '5', world: 'nope' });
    expect(p.world).toBeNull();
    a.update(p.id, { world: 'dragons' });
    expect(a.get(p.id).world).toBeNull();
    const st = memory();
    st.setItem('klaviaturka.v1', JSON.stringify({ v: 1, profiles: [{ id: 'old', name: 'Старий', avatar: 'owl', level: '3-4', progress: { ua: { 1: 3 }, en: {} } }] }));
    const old = createStore(st).get('old');
    expect(old).toMatchObject({ world: null, helperHidden: false, xp: 0, hero: DEFAULT_HERO });
    expect(old.progress.ua[1]).toBe(3);
  });
  it('зміна класу з 3–4 на 5 і назад не губить прогрес', () => {
    const a = createStore(memory());
    const p = a.create({ name: 'Макс', avatar: 'bear', level: '3-4' });
    a.finishLesson(p.id, { layout: 'ua', lessonId: 1, stars: 3, errors: 0 });
    a.finishLesson(p.id, { layout: 'ua', lessonId: 2, stars: 2, errors: 4 });
    a.saveStep(p.id, { typed: 40, errors: 3, ms: 30000, chars: 37, missed: { ц: 2 } });
    const before = JSON.stringify([a.get(p.id).progress, a.get(p.id).stats, a.get(p.id).badges]);
    a.update(p.id, { level: '5' });
    expect(a.get(p.id).level).toBe('5');
    expect(JSON.stringify([a.get(p.id).progress, a.get(p.id).stats, a.get(p.id).badges])).toBe(before);
    a.update(p.id, { world: 'voxel' });
    a.update(p.id, { level: '3-4' });
    expect(JSON.stringify([a.get(p.id).progress, a.get(p.id).stats, a.get(p.id).badges])).toBe(before);
    expect(a.get(p.id).world).toBe('voxel'); // вибір світу теж лишився
  });
  it('зміна світу не змінює прогрес; скидання прогресу лишає світ, героя й помічника', () => {
    const a = createStore(memory());
    const p = a.create({ name: 'Дана', avatar: 'owl', level: '5', world: 'voxel', hero: { skin: 3, outfit: 2, hat: 0 } });
    a.finishLesson(p.id, { layout: 'ua', lessonId: 1, stars: 3, errors: 0 });
    a.update(p.id, { world: 'sky' });
    expect(a.get(p.id).progress.ua[1]).toBe(3);
    a.update(p.id, { helperHidden: true });
    a.resetProgress(p.id);
    expect(a.get(p.id)).toMatchObject({ level: '5', world: 'sky', helperHidden: true, hero: { skin: 3, outfit: 2, hat: 0 } });
    expect(a.get(p.id).progress.ua).toEqual({});
  });
});

describe('три світи: кожен екран відкривається в кожному світі', () => {
  it('усі екрани × усі світи', () => {
    for (const world of WORLD_IDS) for (const tab of TABS) {
      const p = teenProfile(world);
      const html = teenScreen(teenRoute(tab === 'world' ? 'teen' : `teen/${tab}`), p);
      expect(html.length, `${world}/${tab}`).toBeGreaterThan(800);
      expect(html, `${world}/${tab}`).not.toMatch(/undefined|NaN|\[object|https?:\/\/(?!www\.w3\.org)/);
      expect(html).toContain(`href="#teen${tab === 'world' ? '' : '/' + tab}"`); // навігація веде в справжній світ, а не в демо
      expect(html, `${world}/${tab}: ім'я`).toContain(p.name); // ім'я учня видно в усіх трьох світах
      expect(html, `${world}/${tab}: «Додому»`).toContain('data-home');
    }
    expect(Object.keys(THEMES)).toEqual(WORLD_IDS);
  });
  it('екран вибору світу показує всі три світи', () => {
    for (const html of [teenScreen(teenRoute('teen/pick'), teenProfile('voxel')), teenScreen({ tab: 'world' }, teenProfile(null)), worldPickHtml({ back: 'back' })]) {
      for (const id of WORLD_IDS) expect(html).toContain(`data-pick-world="${id}"`);
    }
  });
  it('екран друку в кожному світі: клавіатура з кольорами пальців, долоні, завдання', () => {
    for (const world of WORLD_IDS) {
      const html = teenScreen(teenRoute('teen/type'), teenProfile(world));
      expect(html).toContain('data-code="KeyF"');
      expect(html).toContain('class="hands');
      expect(html).toContain('data-task');
      expect(html).toContain('class="key f-lp');
    }
    for (const ch of TEXT) expect(fingerOf(codeOfChar(ch, 'ua')), ch).toBeTruthy();
  });
  it('екран «Герой»: вибір героя, світу й помічника є в кожному світі', () => {
    for (const world of WORLD_IDS) {
      const html = teenScreen(teenRoute('teen/avatar'), teenProfile(world));
      for (const k of Object.keys(HERO_OPTIONS)) expect(html).toContain(`data-opt="${k}"`);
      for (const id of WORLD_IDS) expect(html).toContain(`data-set-world="${id}"`);
      expect(html).toContain('data-set-helper="1"');
      expect(html).toContain('href="#adult"');
      expect(html).toContain('Змінити світ');
      expect(html.match(/class="wt wt-/g)).toHaveLength(3); // світи — мініатюрами
      expect(html).not.toMatch(/<h3>Світ<\/h3>/); // не плутається з вкладкою «Світ»
      expect(html).not.toMatch(/set-helper[^>]*>[^<]*<span>Для дорослого/); // «Для дорослого» не серед варіантів помічника
    }
  });
  it('помічник: є у кожному світі, ховається, показується знову', () => {
    for (const world of WORLD_IDS) {
      const shown = teenScreen(teenRoute('teen'), teenProfile(world));
      const hidden = teenScreen(teenRoute('teen'), teenProfile(world, { helperHidden: true }));
      expect(shown, world).toContain('data-act="hide-helper"');
      expect(hidden, world).not.toContain('data-act="hide-helper"');
      expect(hidden.length).toBeLessThan(shown.length);
    }
  });
  it('новий профіль: нічого не виконано, досвід 0, рівень 1 (без вигаданих досягнень)', () => {
    const ctx = teenContext(teenProfile('sky'));
    expect(ctx.player).toMatchObject({ level: 1, xp: 0, xpMax: 500 });
    expect(ctx.progress.quests.some((q) => q.done)).toBe(false);
    expect(ctx.progress.rewards.some((r) => r.got)).toBe(false);
    expect(ctx.progress.worlds.filter((w) => w.state === 'now')).toHaveLength(1);
  });
  it('вигляд героя міняється в кожному світі, а ім’я з HTML екранується', () => {
    for (const world of WORLD_IDS) {
      const t = THEMES[world];
      expect(t.avatarSvg(t.heroSize, { skin: 0, outfit: 0, hat: 1 })).not.toBe(t.avatarSvg(t.heroSize, { skin: 3, outfit: 2, hat: 2 }));
      expect(teenScreen(teenRoute('teen'), teenProfile(world, { name: '<b>x</b>' }))).not.toContain('<b>x</b>');
    }
  });
  it('картки «Хто ти?»: учень 5–6 класу має героя у стилі свого світу, а не тваринку', () => {
    const store = createStore(memory());
    const kid = store.create({ name: 'Малий', avatar: 'fox', level: '1-2' });
    const teens = WORLD_IDS.map((w, i) => store.create({ name: `Учень${i}`, avatar: 'fox', level: i % 2 ? '6' : '5', world: w }));
    const noWorld = store.create({ name: 'Без світу', avatar: 'cat', level: '5' });
    const html = profilesScreen({ profiles: store.list(), persistent: true, canCreate: true });
    expect(html.match(/class="profile-card is-teen/g)).toHaveLength(4);
    for (const w of WORLD_IDS) expect(html).toContain(`tw-${w}`);
    expect(html).toContain('tw-none');
    expect(html).toContain('hero-icon');
    expect(html).toContain('5 клас');
    expect(html).toContain('6 клас');
    expect(html.match(/data-profile=/g)).toHaveLength(store.list().length);
    expect([kid, noWorld, ...teens]).toHaveLength(5);
  });
});

describe('екран «Друк» у стилі кожного світу', () => {
  it('кожен світ має власне оформлення екрана друку й екрана результату (кольори пальців не змінені)', () => {
    const marks = { voxel: ['vx-deco', 'vx-done-text', 'vx-chips'], pixel: ['px-ground', 'px-task-tag', 'px-done-text'], sky: ['sk-deco', 'sk-done-text', 'sk-chips'] };
    for (const world of WORLD_IDS) {
      const html = teenScreen(teenRoute('teen/type'), teenProfile(world));
      for (const m of marks[world]) expect(html, `${world}: ${m}`).toContain(m);
      expect(html).toContain('data-done-speed');
      expect(html).toContain('class="key f-lp'); // ті самі класи кольорів пальців
    }
  });
  it('помічник і «Для дорослого» не в демо; у демо немає кнопки «Додому»', () => {
    for (const id of WORLD_IDS) for (const tab of TABS) expect(conceptScreen({ id, tab })).not.toContain('data-home');
  });
});

describe('демо-сторінка #concepts', () => {
  it('адреси розпізнаються, чужі — ні', () => {
    expect(conceptRoute('concepts')).toEqual({ menu: true });
    expect(conceptRoute('voxel')).toEqual({ id: 'voxel', tab: 'world' });
    expect(conceptRoute('sky/type')).toEqual({ id: 'sky', tab: 'type' });
    for (const bad of ['', 'map', 'lesson', 'pixel/nope', 'demo', 'teen']) expect(conceptRoute(bad)).toBeNull();
    expect(teenRoute('teen/pick')).toEqual({ tab: 'pick' });
    for (const bad of ['', 'map', 'voxel', 'teen/nope']) expect(teenRoute(bad)).toBeNull();
  });
  it('усі демо-екрани малюються', () => {
    for (const id of WORLD_IDS) for (const tab of TABS) expect(conceptScreen({ id, tab }).length).toBeGreaterThan(800);
    expect(conceptScreen({ menu: true })).toContain('Три світи');
  });
});
