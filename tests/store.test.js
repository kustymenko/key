import { describe, it, expect } from 'vitest';
import { createStore, KEY, MAX_PROFILES, cleanProfile } from '../src/storage/store.js';
import { awardBadges } from '../src/storage/badges.js';
import { BADGES } from '../src/content/badges.js';
import { COURSE, lessonTitle } from '../src/lessons/course.js';
import { spokenTitle } from '../src/audio/lessonSpeech.js';

// Проста заміна localStorage для перевірок
const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), raw: m };
};
const kid = { name: 'Соня', avatar: 'fox', level: '1-2' };

describe('профілі й збереження', () => {
  it('профіль створюється і переживає «перезавантаження»', () => {
    const st = memory();
    const a = createStore(st);
    const p = a.create(kid);
    a.finishLesson(p.id, { layout: 'ua', lessonId: 1, stars: 2, errors: 3 });
    const b = createStore(st); // нова вкладка читає те саме сховище
    expect(b.list()).toHaveLength(1);
    expect(b.list()[0].name).toBe('Соня');
    expect(b.list()[0].progress.ua[1]).toBe(2);
  });

  it('зірочки за урок лише зростають', () => {
    const s = createStore(memory());
    const p = s.create(kid);
    s.finishLesson(p.id, { layout: 'ua', lessonId: 1, stars: 3, errors: 0 });
    s.finishLesson(p.id, { layout: 'ua', lessonId: 1, stars: 1, errors: 9 });
    expect(p.progress.ua[1]).toBe(3);
  });

  it('порожнє ім’я не створює профіль, ім’я обрізається', () => {
    const s = createStore(memory());
    expect(s.create({ ...kid, name: '   ' })).toBeNull();
    expect(s.create({ ...kid, name: 'Олександрівна-Петрівна' }).name).toHaveLength(12);
  });

  it('не більше 17 профілів', () => {
    const s = createStore(memory());
    for (let i = 0; i < MAX_PROFILES + 3; i++) s.create({ ...kid, name: `Д${i}` });
    expect(s.list()).toHaveLength(MAX_PROFILES);
    expect(s.canCreate()).toBe(false);
  });

  it('видалення й скидання прогресу', () => {
    const s = createStore(memory());
    const a = s.create(kid);
    const b = s.create({ ...kid, name: 'Макс' });
    s.finishLesson(a.id, { layout: 'ua', lessonId: 1, stars: 3, errors: 0 });
    s.resetProgress(a.id);
    expect(s.get(a.id).progress.ua).toEqual({});
    expect(s.get(a.id).badges).toEqual({});
    expect(s.get(a.id).name).toBe('Соня'); // ім’я лишається
    s.remove(a.id);
    expect(s.list().map((p) => p.id)).toEqual([b.id]);
  });

  it('статистика й місце в уроці зберігаються після кожної вправи', () => {
    const st = memory();
    const s = createStore(st);
    const p = s.create(kid);
    s.saveStep(p.id, { typed: 6, errors: 2, ms: 4000, chars: 6, missed: { а: 2 }, resume: { layout: 'ua', id: 1, level: '1-2', i: 2, steps: [{}, {}, {}] } });
    s.saveStep(p.id, { typed: 5, errors: 0, ms: 3000, chars: 5, missed: { а: 1, о: 1 }, resume: null });
    const q = createStore(st).list()[0];
    expect(q.stats).toMatchObject({ typed: 11, errors: 2, ms: 7000, chars: 11, missed: { а: 3, о: 1 } });
    expect(q.resume).toBeNull();
  });

  it('сховище недоступне: усе працює в пам’яті без помилок', () => {
    const broken = { getItem() { throw new Error('заборонено'); }, setItem() { throw new Error('заборонено'); }, removeItem() { throw new Error('x'); } };
    const s = createStore(broken);
    expect(s.persistent).toBe(false);
    const p = s.create(kid);
    expect(p).toBeTruthy();
    expect(() => s.finishLesson(p.id, { layout: 'ua', lessonId: 1, stars: 3, errors: 0 })).not.toThrow();
    expect(createStore(null).persistent).toBe(false);
  });

  it('зіпсований запис не ламає тренажер', () => {
    const st = memory();
    st.setItem(KEY, '{не json');
    expect(createStore(st).list()).toEqual([]);
    st.setItem(KEY, JSON.stringify({ profiles: [null, 5, { id: 'a', name: 'Ок', progress: { ua: { 1: 9, 2: 3 } }, level: 'x' }] }));
    const [p] = createStore(st).list();
    expect(p.progress.ua).toEqual({ 2: 3 });
    expect(p.level).toBe('1-2');
    expect(cleanProfile({})).toBeNull();
  });
});

describe('значки', () => {
  const fresh = () => cleanProfile({ id: 'a', name: 'А' });
  it('перший урок і три зірочки', () => {
    const p = fresh();
    p.progress.ua[1] = 3;
    expect(awardBadges(p)).toEqual(['first', 'three']);
    expect(awardBadges(p)).toEqual([]); // другий раз не видаємо
  });
  it('основний ряд — уроки 1–5, абетка — усі уроки з літерами', () => {
    const p = fresh();
    for (let i = 1; i <= 5; i++) p.progress.ua[i] = 1;
    expect(awardBadges(p)).toContain('home-row');
    for (const l of COURSE.ua.filter((x) => x.kind === 'letters' || x.kind === 'review')) p.progress.ua[l.id] = 1;
    expect(awardBadges(p)).toContain('alphabet');
  });
  it('дві мови, 10 уроків, 10 зірочок', () => {
    const p = fresh();
    p.progress.ua = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2 };
    p.progress.en = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 };
    const got = awardBadges(p);
    expect(got).toEqual(expect.arrayContaining(['two-courses', 'lessons-10', 'stars-10']));
  });
  it('у кожного значка є назва, підказка до 5 слів і правило', () => {
    for (const b of BADGES) {
      expect(b.name).toBeTruthy();
      expect(b.how.split(/\s+/).length).toBeLessThanOrEqual(5);
    }
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
  });
});

describe('назва уроку для Клавика', () => {
  const lesson = (layout, id) => COURSE[layout].find((l) => l.id === id);
  it('приклади', () => {
    expect(lessonTitle('ua', lesson('ua', 7))).toBe('Урок 7: літера Є');
    expect(lessonTitle('ua', lesson('ua', 2))).toBe('Урок 2: літери В і Л');
    expect(lessonTitle('ua', lesson('ua', 5))).toBe('Урок 5: повторення');
    expect(lessonTitle('ua', lesson('ua', 18))).toBe('Урок 18: літера Я і крапка');
    expect(lessonTitle('ua', lesson('ua', 21))).toBe('Урок 21: кома і крапка');
    expect(lessonTitle('en', lesson('en', 4))).toBe('Урок 4: літера A і крапка з комою');
  });
  it('кожен урок має назву, що починається з «Урок N:», і озвучку', () => {
    for (const layout of ['ua', 'en']) {
      for (const l of COURSE[layout]) {
        expect(lessonTitle(layout, l)).toMatch(new RegExp(`^Урок ${l.id}: .{4,}`));
        expect(spokenTitle(layout, l)).toMatch(new RegExp(`^Урок ${l.id}\\. .{4,}`));
      }
    }
  });
  it('літери озвучуються назвами: Л — «ел», J — «джей»', () => {
    expect(spokenTitle('ua', lesson('ua', 2))).toBe('Урок 2. літери ве і ел');
    expect(spokenTitle('en', lesson('en', 1))).toBe('Урок 1. літери еф і джей');
  });
});
