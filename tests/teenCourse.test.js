// Етап Т3: швидкий курс 5–6 класів — вправи лише з вивчених клавіш, довжини, зірочки, стани уроків, розміщення, збереження
import { describe, it, expect } from 'vitest';
import { TEEN_COURSE, WORLD_GROUPS, learnedKeys, lastLetterLesson, isPunctKey, getTeenLesson } from '../src/teen/logic/course.js';
import { buildTeenLesson, DRILL_RANGES, wordPool, syllablePool, sentencePool } from '../src/teen/logic/lessons.js';
import { teenStars, lessonStates, creditedIds, currentLesson, worldsFromLessons, cleanTeenProgress, PASS_ACC, QUICK_ACC } from '../src/teen/logic/progress.js';
import { createStore } from '../src/storage/store.js';
import { teenScreen, teenRoute } from '../src/teen/screens/index.js';
import { WORLD_IDS } from '../src/teen/logic/profile.js';
import { codeOfChar } from '../src/keyboard/layouts.js';
import { fingerOf } from '../src/keyboard/fingers.js';

const seeded = (seed = 11) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const LAYOUTS = ['ua', 'en'];

describe('курс: дані', () => {
  it('кожна клавіша має єдиний палець; уроки йдуть підряд; нові клавіші не повторюються', () => {
    for (const layout of LAYOUTS) {
      const seen = new Set();
      TEEN_COURSE[layout].forEach((l, i) => {
        expect(l.id).toBe(i + 1);
        for (const k of l.letters) {
          expect(seen.has(k), `${layout}: «${k}» вже була`).toBe(false);
          seen.add(k);
          expect(fingerOf(codeOfChar(k, layout)), `${layout} ${k}`).toBeTruthy();
        }
      });
    }
  });
  it('УКР: усі 33 літери клавіатури вивчаються за курс', () => {
    const all = new Set(TEEN_COURSE.ua.flatMap((l) => l.letters).filter((c) => !isPunctKey(c)));
    expect([...all].sort().join('')).toBe([...'йцукенгшщзхїфівапролджєячсмитьбю'].sort().join(''));
  });
  it('EN: усі 26 літер', () => {
    const all = TEEN_COURSE.en.flatMap((l) => l.letters).filter((c) => !isPunctKey(c));
    expect(all.sort().join('')).toBe('abcdefghijklmnopqrstuvwxyz');
  });
  it('групи уроків покривають увесь курс без пропусків', () => {
    for (const layout of LAYOUTS) expect(WORLD_GROUPS[layout].flat()).toEqual(TEEN_COURSE[layout].map((l) => l.id));
  });
});

describe('генератор: лише вивчені клавіші', () => {
  it('на кожному уроці, обох мовах, багатьох варіантах (щоб не вийшло випадково)', () => {
    for (const layout of LAYOUTS) for (const lesson of TEEN_COURSE[layout]) for (let s = 1; s <= 25; s++) {
      const known = learnedKeys(layout, lesson.id);
      const b = buildTeenLesson({ layout, id: lesson.id, rng: seeded(s) });
      expect(b.steps.filter((x) => x.kind === 'drill')).toHaveLength(3);
      for (const step of b.steps) {
        if (step.kind === 'intro') continue;
        for (const ch of step.text) expect(known.has(ch.toLowerCase()), `${layout} урок ${lesson.id}: «${ch}» у «${step.text}»`).toBe(true);
        // великі літери — лише після уроку про Shift
        if (lesson.kind !== 'shift') expect(step.text, `${layout} ${lesson.id}`).toBe(step.text.toLowerCase());
      }
    }
  });
  it('довжини вправ: 40–60, 70–90, 100–120; остання без підказки', () => {
    for (const layout of LAYOUTS) for (const lesson of TEEN_COURSE[layout]) for (let s = 1; s <= 10; s++) {
      const drills = buildTeenLesson({ layout, id: lesson.id, rng: seeded(s) }).steps.filter((x) => x.kind === 'drill');
      drills.forEach((d, i) => {
        expect(d.text.length, `${layout} ${lesson.id} вправа ${i + 1}: ${d.text.length}`).toBeGreaterThanOrEqual(DRILL_RANGES[i][0] - 2);
        expect(d.text.length).toBeLessThanOrEqual(DRILL_RANGES[i][1]);
        expect(d.hint).toBe(i < 2);
        expect(d.text).toBe(d.text.trim());
      });
    }
  });
  it('нові клавіші зустрічаються у вправах уроку (крім знаків)', () => {
    for (const layout of LAYOUTS) for (const lesson of TEEN_COURSE[layout]) {
      if (lesson.kind === 'shift' || !lesson.letters.length) continue;
      for (let seed = 1; seed <= 15; seed++) {
        const text = buildTeenLesson({ layout, id: lesson.id, rng: seeded(seed) }).steps.filter((x) => x.kind === 'drill').map((x) => x.text).join(' ');
        const missing = lesson.letters.filter((c) => !text.includes(c));
        expect(missing, `${layout} урок ${lesson.id} (варіант ${seed}): немає ${missing.join('')}`).toEqual([]);
      }
    }
  });
  it('урок про великі літери: слова з великої й речення з крапкою; решта уроків без великих', () => {
    for (const layout of LAYOUTS) {
      const id = TEEN_COURSE[layout].find((l) => l.kind === 'shift').id;
      const [d1, d2, d3] = buildTeenLesson({ layout, id, rng: seeded(5) }).steps.filter((x) => x.kind === 'drill');
      expect(d1.text.split(' ').every((w) => w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase())).toBe(true);
      expect(/^[A-ZА-ЯІЇЄ]/.test(d2.text) && d2.text.includes('.')).toBe(true);
      expect(d3.text.length).toBeGreaterThan(95);
    }
  });
  it('в українському курсі до уроку про коми речення без коми (кома — Етап Т4)', () => {
    const known = learnedKeys('ua', 8);
    for (const s of sentencePool('ua', known)) expect(s.includes(',')).toBe(false);
    expect(sentencePool('ua', known).length).toBeGreaterThan(10);
  });
  it('знайомство: один крок з усіма новими клавішами; «швидка перевірка» — лише одна вправа без підказки', () => {
    const b = buildTeenLesson({ layout: 'ua', id: 4, rng: seeded(2) });
    expect(b.steps[0]).toMatchObject({ kind: 'intro', keys: ['н', 'г', 'ш', 'щ', 'з', 'х', 'ї'] });
    const q = buildTeenLesson({ layout: 'ua', id: 4, rng: seeded(2), quick: true });
    expect(q.steps).toHaveLength(1);
    expect(q.steps[0]).toMatchObject({ kind: 'drill', hint: false });
    expect(q.steps[0].text.length).toBeGreaterThanOrEqual(98);
  });
  it('ранні уроки мають із чого скласти вправи (слова або склади)', () => {
    for (const layout of LAYOUTS) {
      const known = learnedKeys(layout, 1);
      expect(wordPool(layout, known).length + syllablePool(layout, known).length).toBeGreaterThanOrEqual(8);
    }
  });
});

describe('зірочки й проходження', () => {
  it('межі: < 90% не зараховується; 5 клас 96/90; 6 клас 97/92', () => {
    expect(PASS_ACC).toBe(90);
    expect(QUICK_ACC).toBe(93);
    for (const [grade, a, want] of [['5', 89.9, 0], ['5', 90, 2], ['5', 95.9, 2], ['5', 96, 3], ['6', 90, 1], ['6', 91.9, 1], ['6', 92, 2], ['6', 96.9, 2], ['6', 97, 3], ['6', 100, 3], ['5', 0, 0]]) {
      expect(teenStars(grade, a), `${grade} клас, ${a}%`).toBe(want);
    }
    expect(teenStars('5', undefined)).toBe(0);
  });
});

describe('стани уроків і розміщення', () => {
  const states = (layout, teen = {}, placement = null) => lessonStates(layout, { teen, placement }).map((l) => l.state).join();
  it('без розміщення: перший урок поточний, решта закриті; по черзі відкриваються', () => {
    expect(states('ua')).toBe('current,locked,locked,locked,locked,locked,locked,locked');
    expect(states('ua', { ua: { 1: { stars: 2 }, 2: { stars: 3 } } })).toBe('done,done,current,locked,locked,locked,locked,locked');
    expect(states('en', { en: { 1: { stars: 1 } } })).toBe('done,current,locked,locked,locked,locked,locked');
  });
  it('«досвідчений»: літерні уроки зараховані, лишається Shift', () => {
    expect(states('ua', {}, { kind: 'pro' })).toBe('credited,credited,credited,credited,credited,credited,credited,current');
    expect(states('en', {}, { kind: 'pro' })).toBe('credited,credited,credited,credited,credited,credited,current');
    expect(lastLetterLesson('ua')).toBe(7);
  });
  it('«середній»: швидка перевірка для уроків 1–6; Shift звичайним', () => {
    const q = lessonStates('ua', { teen: {}, placement: { kind: 'mid' } });
    expect(currentLesson(q).quick).toBe(true);
    const late = lessonStates('ua', { teen: { ua: Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((i) => [i, { stars: 3 }])) }, placement: { kind: 'mid' } });
    expect(currentLesson(late)).toMatchObject({ id: 8, quick: false });
    expect(lessonStates('ua', { teen: {}, placement: { kind: 'zero' } })[0].quick).toBe(false);
  });
  it('перехід із 3–4: зараховано лише уроки, літери яких усі вивчені', () => {
    const learned = (s) => ({ kind: 'carry', learned: { ua: [...s], en: [] } });
    expect([...creditedIds('ua', learned('фівaолджaо'.replace(/a/g, 'а')))]).toEqual([1]);
    expect([...creditedIds('ua', learned('фівaолджпрєaо'.replace(/a/g, 'а')))]).toEqual([1, 2]);
    expect([...creditedIds('ua', learned(''))]).toEqual([]);
    const all = [...'йцукенгшщзхїфівапролджєячсмитьбю'];
    expect([...creditedIds('ua', learned(all.join('')))]).toEqual([1, 2, 3, 4, 5, 6, 7]); // Shift-урок не зараховується
    expect(states('ua', {}, learned('фівaолджaо'.replace(/a/g, 'а')))).toBe('credited,current,locked,locked,locked,locked,locked,locked');
  });
  it('пройдений урок має пріоритет, закритий не відкривається раніше часу', () => {
    expect(states('ua', { ua: { 3: { stars: 3 } } })).toBe('current,locked,done,locked,locked,locked,locked,locked');
  });
});

describe('карта світів за уроками', () => {
  it('перші три світи — групи уроків; решта чекає наступних етапів', () => {
    const w = (layout, teen) => worldsFromLessons(layout, lessonStates(layout, { teen })).map((x) => `${x.state}${x.pct}`).join(' ');
    expect(w('ua', {})).toBe('now0 locked0 locked0 locked0 locked0 locked0');
    expect(w('ua', { ua: { 1: { stars: 3 } } })).toBe('now50 locked0 locked0 locked0 locked0 locked0');
    expect(w('ua', { ua: { 1: { stars: 3 }, 2: { stars: 3 }, 3: { stars: 3 } } })).toBe('done100 now50 locked0 locked0 locked0 locked0');
    const all = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map((i) => [i, { stars: 3 }]));
    expect(w('ua', { ua: all })).toBe('done100 done100 done100 locked0 locked0 locked0');
  });
});

describe('збереження прогресу курсу', () => {
  it('записується, переживає перезавантаження; зірочки лише більше; сміття відкидається', () => {
    const storage = memory();
    const a = createStore(storage);
    const p = a.create({ name: 'Ліза', avatar: 'cat', level: '5', world: 'sky' });
    expect(a.finishTeenLesson(p.id, { layout: 'ua', lessonId: 1, stars: 2, acc: 93.4, cpm: 140.6 })).toBe(true);
    a.finishTeenLesson(p.id, { layout: 'ua', lessonId: 1, stars: 1, acc: 90, cpm: 100 }); // гірше — не знижує
    a.finishTeenLesson(p.id, { layout: 'en', lessonId: 2, stars: 3, acc: 99, cpm: 200, by: 'quick' });
    expect(a.finishTeenLesson(p.id, { layout: 'ua', lessonId: 99, stars: 3, acc: 99, cpm: 1 })).toBe(true); // невідомий урок відкинеться при очищенні
    expect(a.finishTeenLesson(p.id, { layout: 'ua', lessonId: 2, stars: 0, acc: 50, cpm: 1 })).toBe(false); // 0 зірочок — не запис
    const b = createStore(storage).get(p.id);
    expect(b.teen.ua[1]).toEqual({ stars: 2, acc: 93, cpm: 141, by: 'lesson' });
    expect(b.teen.en[2]).toMatchObject({ stars: 3, by: 'quick' });
    expect(b.teen.ua[99]).toBeUndefined();
    expect(cleanTeenProgress({ ua: { 1: { stars: 7 }, 2: null, x: { stars: 1 } } })).toEqual({ ua: {}, en: {} });
    expect(cleanTeenProgress(undefined)).toEqual({ ua: {}, en: {} });
  });
  it('зміна класу не губить пройдені уроки; скидання прогресу їх стирає', () => {
    const a = createStore(memory());
    const p = a.create({ name: 'Макс', avatar: 'bear', level: '5', world: 'voxel' });
    a.finishTeenLesson(p.id, { layout: 'ua', lessonId: 1, stars: 3, acc: 99, cpm: 100 });
    a.update(p.id, { level: '6' });
    expect(a.get(p.id).teen.ua[1].stars).toBe(3);
    a.update(p.id, { level: '3-4' });
    expect(a.get(p.id).teen.ua[1].stars).toBe(3);
    a.resetProgress(p.id);
    expect(a.get(p.id).teen.ua).toEqual({});
  });
});

describe('екрани уроку в усіх трьох світах', () => {
  it('карта з панеллю «Далі», урок, список уроків — у кожному світі й обох мовах', () => {
    for (const world of WORLD_IDS) for (const layout of LAYOUTS) {
      const st = createStore(memory());
      const p = st.create({ name: 'Олекса', avatar: 'fox', level: '5', world, layout });
      st.update(p.id, { layout, placement: { kind: 'zero', source: 'skip', at: 1 } });
      const prof = st.get(p.id);
      const w = teenScreen(teenRoute('teen'), prof);
      expect(w, `${world} ${layout} світ`).toContain('pb-go');
      expect(w).toContain('href="#teen/lesson"');
      expect(w).toContain('data-set-layout="en"');
      const lesson = teenScreen(teenRoute('teen/lesson'), prof);
      expect(lesson).toContain('data-lines');
      expect(lesson).toContain('data-hint');
      expect(lesson).toContain('data-code="KeyF"');
      expect(lesson).toContain(layout === 'en' ? 'data-code="KeyQ"' : 'data-code="KeyQ"');
      expect(lesson).toContain('data-ld');
      const list = teenScreen(teenRoute('teen/lessons'), prof);
      expect(list.match(/data-lesson-go=/g)).toHaveLength(getTeenLesson(layout, 1) ? TEEN_COURSE[layout].length : 0);
      for (const html of [w, lesson, list]) expect(html).not.toMatch(/undefined|NaN|\[object|https?:\/\/(?!www\.w3\.org)/);
    }
  });
  it('адреси уроків', () => {
    expect(teenRoute('teen/lesson')).toEqual({ tab: 'lesson', id: null });
    expect(teenRoute('teen/lesson/3')).toEqual({ tab: 'lesson', id: 3 });
    expect(teenRoute('teen/lesson/x')).toBeNull();
    expect(teenRoute('teen/lessons')).toEqual({ tab: 'lessons' });
  });
  it('закритий урок підміняється поточним; після курсу панель без «Грай»', () => {
    const st = createStore(memory());
    const p = st.create({ name: 'Дана', avatar: 'owl', level: '5', world: 'pixel' });
    st.update(p.id, { placement: { kind: 'zero', source: 'skip', at: 1 } });
    const html = teenScreen(teenRoute('teen/lesson/7'), st.get(p.id));
    expect(html).toMatch(/урок 1/i);
    for (const i of [1, 2, 3, 4, 5, 6, 7, 8]) st.finishTeenLesson(p.id, { layout: 'ua', lessonId: i, stars: 3, acc: 99, cpm: 100 });
    expect(teenScreen(teenRoute('teen'), st.get(p.id))).not.toContain('pb-go');
  });
});
