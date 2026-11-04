// Етап Т5: цифри й символи верхнього ряду. Банк текстів, генератор, розташування клавіш і пальці, зараховування за надрукованим символом, екрани в трьох світах.
import { describe, it, expect } from 'vitest';
import { TEEN_NUMBERS } from '../src/content/teen/numbers.js';
import { TEEN_COURSE, WORLD_GROUPS, learnedKeys, isDigitKey, needsNumberRow, isNumberLesson } from '../src/teen/logic/course.js';
import { buildTeenLesson } from '../src/teen/logic/lessons.js';
import { NUMBER_RANGES, MIXED_RANGES } from '../src/teen/logic/numbers.js';
import { usable } from '../src/teen/logic/marks.js';
import { lessonStates, currentLesson, worldsFromLessons } from '../src/teen/logic/progress.js';
import { keysFor, codeOfChar, needsShift } from '../src/keyboard/layouts.js';
import { fingerOf } from '../src/keyboard/fingers.js';
import { classifyKey } from '../src/keyboard/detect.js';
import { createExercise, pressChar, currentChar } from '../src/lessons/exercise.js';
import { createStore } from '../src/storage/store.js';
import { teenScreen, teenRoute } from '../src/teen/screens/index.js';
import { comboText } from '../src/teen/screens/lesson.js';
import { WORLD_IDS } from '../src/teen/logic/profile.js';

const seeded = (seed = 7) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const LAYOUTS = ['ua', 'en'];
const FIRST = { ua: 19, en: 16 };
const numberLessons = (layout) => TEEN_COURSE[layout].filter(isNumberLesson);
const UA = new Set([...'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя']);
const EN = new Set([...'abcdefghijklmnopqrstuvwxyz']);
const ALLOWED_MARKS = new Set([...' .,;:?!()"-\'0123456789№%*+=#$&@']);

describe('курс Т5: уроки цифр і символів', () => {
  it('нові уроки йдуть після абзаців: УКР 19–24, ENG 16–21; id без пропусків', () => {
    for (const layout of LAYOUTS) {
      const list = TEEN_COURSE[layout];
      expect(list.map((l) => l.id)).toEqual(list.map((_, i) => i + 1));
      expect(numberLessons(layout).map((l) => l.id)).toEqual(layout === 'ua' ? [19, 20, 21, 22, 23, 24] : [16, 17, 18, 19, 20, 21]);
      expect(list.at(-1).kind).toBe('nmixed');
      expect(list.find((l) => l.kind === 'paragraph').id).toBe(FIRST[layout] - 1);
    }
  });
  it('цифри 0–9 вивчаються по групах пальців: 1–5 ліва рука, 6–0 права', () => {
    for (const layout of LAYOUTS) {
      const digits = numberLessons(layout).filter((l) => l.kind === 'digits');
      expect(digits.map((l) => l.letters.join(''))).toEqual(['12345', '67890']);
    }
  });
  it('символи: УКР № % * потім + =; ENG # $ % & @ * потім + =', () => {
    expect(numberLessons('ua').filter((l) => l.kind === 'symbols').map((l) => l.letters.join(''))).toEqual(['№%*', '+=']);
    expect(numberLessons('en').filter((l) => l.kind === 'symbols').map((l) => l.letters.join(''))).toEqual(['#$%&@*', '+=']);
  });
  it('усі уроки входять у групу карти рівно один раз; світи йдуть у порядку курсу', () => {
    for (const layout of LAYOUTS) {
      const ids = WORLD_GROUPS[layout].flat();
      expect(ids.sort((a, b) => a - b)).toEqual(TEEN_COURSE[layout].map((l) => l.id));
    }
  });
  it('карта: після знаків відкривається «Цифровий ліс», після останнього уроку все пройдено', () => {
    const done = (layout, upTo) => Object.fromEntries(TEEN_COURSE[layout].filter((l) => l.id <= upTo).map((l) => [l.id, { stars: 2 }]));
    const w = (layout, upTo) => worldsFromLessons(layout, lessonStates(layout, { teen: { [layout]: done(layout, upTo) } })).map((x) => `${x.state}${x.pct}`).join(' ');
    expect(w('ua', 18)).toBe('done100 done100 done100 done100 now0 locked0');
    expect(w('ua', 21)).toBe('done100 done100 done100 done100 now50 locked0');
    expect(w('ua', 24)).toBe('done100 done100 done100 done100 done100 locked0');
    expect(w('en', 15)).toBe('done100 done100 done100 done100 now0 locked0');
    expect(w('en', 21)).toBe('done100 done100 done100 done100 done100 locked0');
  });
  it('учень, що пройшов 18 уроків (до Т5), продовжує з уроку 19 без втрат', () => {
    const teen = { ua: Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, { stars: 3 }])) };
    const st = lessonStates('ua', { teen });
    expect(currentLesson(st).id).toBe(19);
    expect(st.slice(0, 18).every((l) => l.state === 'done')).toBe(true);
  });
  it('уроки цифр і символів вимагають клавіатури з рядом цифр', () => {
    for (const layout of LAYOUTS) for (const l of numberLessons(layout)) expect(needsNumberRow(l), `${layout} ${l.id}`).toBe(true);
  });
  it('попередні уроки вивчають лише своє: цифр і символів немає до Етапу Т5 (30 варіантів кожного)', () => {
    for (const layout of LAYOUTS) for (const l of TEEN_COURSE[layout].filter((x) => !isNumberLesson(x))) {
      const rng = seeded(l.id);
      for (let i = 0; i < 30; i++) {
        const b = buildTeenLesson({ layout, id: l.id, rng, grade: i % 2 ? '5' : '6' });
        for (const s of b.steps.filter((x) => x.kind === 'drill')) expect(s.text, `${layout} ${l.id}`).not.toMatch(/[0-9№%*+=#$&@]/);
      }
    }
  });
});

describe('банк текстів з цифрами й символами', () => {
  const all = (layout) => TEEN_NUMBERS[layout].all;
  it('лише літери мови, цифри, пробіл і вивчені знаки; без посилань, пошти, довгих номерів і чужих символів', () => {
    for (const layout of LAYOUTS) for (const e of all(layout)) {
      for (const ch of e.t) expect(ALLOWED_MARKS.has(ch) || (layout === 'ua' ? UA : EN).has(ch.toLowerCase()), `${layout}: «${ch}» у «${e.t}»`).toBe(true);
      expect(e.t, e.t).not.toMatch(/https?|www|\S@\S|\d{5,}|[«»—–“”‘’]/);
      expect(e.t).toBe(e.t.trim());
      expect(e.t).not.toMatch(/ {2}/);
      if (layout === 'ua') expect(e.t, e.t).not.toMatch(/[a-z]/i);
      expect(/[\d№%*+=#$&@]/.test(e.t), e.t).toBe(true); // кожен текст має цифру або символ
      expect(e.needs.includes('digits'), e.t).toBe(/\d/.test(e.t));
    }
  });
  it('довжини: одне речення 25–75 знаків (щоб вправи складалися в 70–120 знаків), з великої літери (або з числа)', () => {
    for (const layout of LAYOUTS) for (const e of all(layout)) {
      expect(e.t.length, e.t).toBeGreaterThanOrEqual(25);
      expect(e.t.length, e.t).toBeLessThanOrEqual(75);
      expect(/^[\p{Lu}\d]/u.test(e.t), e.t).toBe(true);
    }
  });
  it('приклади на дії арифметично вірні', () => {
    // «15 + 27 = 42», «3 + 3 + 3 = 9»: порахувати ліву частину (лише цифри й + - *) і порівняти з правою
    for (const layout of LAYOUTS) for (const e of all(layout)) {
      for (const m of e.t.matchAll(/((?:\d+ [+*-] )+\d+) = (\d+)/g)) expect(Function(`return ${m[1]}`)(), e.t).toBe(+m[2]);
    }
  });
  it('кожен символ уроку є щонайменше у 10 текстах кожної мови', () => {
    const need = { ua: ['№', '%', '*', '+', '='], en: ['#', '$', '%', '&', '@', '*', '+', '='] };
    for (const layout of LAYOUTS) for (const m of need[layout]) expect(all(layout).filter((e) => e.t.includes(m)).length, `${layout} ${m}`).toBeGreaterThanOrEqual(10);
  });
  it('записи не повторюються', () => {
    for (const layout of LAYOUTS) expect(new Set(all(layout).map((e) => e.t)).size).toBe(all(layout).length);
  });
});

describe('генератор уроків цифр і символів', () => {
  const rangesFor = (kind) => ({
    digits: NUMBER_RANGES,
    numbers: NUMBER_RANGES,
    symbols: [MIXED_RANGES[0], NUMBER_RANGES[1], NUMBER_RANGES[2]],
    nmixed: MIXED_RANGES,
  }[kind]);
  const lettersN = (t) => (t.match(/\p{L}/gu) ?? []).length;

  it('кожен урок обох мов, 60 варіантів: 3 вправи у межах довжини, лише вивчені клавіші, нова клавіша є у вправах', () => {
    for (const layout of LAYOUTS) for (const l of numberLessons(layout)) {
      const known = learnedKeys(layout, l.id);
      const rng = seeded(l.id * 3 + 1);
      for (let i = 0; i < 60; i++) {
        const b = buildTeenLesson({ layout, id: l.id, rng, grade: i % 2 ? '5' : '6' });
        const drills = b.steps.filter((s) => s.kind === 'drill');
        expect(drills, `${layout} ${l.id}`).toHaveLength(3);
        expect(b.steps[0].kind).toBe(l.letters.length ? 'intro' : 'drill');
        drills.forEach((d, n) => {
          const [min, max] = rangesFor(l.kind)[n];
          expect(d.text.length, `${layout} ${l.id} вправа ${n + 1}: «${d.text}»`).toBeGreaterThanOrEqual(min);
          expect(d.text.length, `${layout} ${l.id} вправа ${n + 1}: «${d.text}»`).toBeLessThanOrEqual(max);
          expect(usable(d.text, known), `${layout} ${l.id}: «${d.text}»`).toBe(true);
          expect(d.hint).toBe(n < 2);
        });
        const joined = drills.map((d) => d.text).join(' ');
        for (const k of l.letters) expect(joined.includes(k), `${layout} ${l.id}: немає «${k}» у «${joined}»`).toBe(true);
      }
    }
  });
  it('друга й третя вправи — справжні речення з текстами (не лише числа), крім вправ з одиницями', () => {
    for (const layout of LAYOUTS) for (const l of numberLessons(layout)) {
      const rng = seeded(l.id + 40);
      for (let i = 0; i < 40; i++) {
        const drills = buildTeenLesson({ layout, id: l.id, rng }).steps.filter((s) => s.kind === 'drill');
        expect(lettersN(drills[2].text), `${layout} ${l.id}: «${drills[2].text}»`).toBeGreaterThanOrEqual(15);
        if (l.kind !== 'digits') expect(lettersN(drills[1].text), `${layout} ${l.id}: «${drills[1].text}»`).toBeGreaterThanOrEqual(15);
      }
    }
  });
  it('урок «цифри, ліва рука» не містить 6–0; наступний не містить символів, яких ще не вчили', () => {
    for (const layout of LAYOUTS) {
      const rng = seeded(11);
      for (let i = 0; i < 40; i++) {
        const left = buildTeenLesson({ layout, id: FIRST[layout], rng }).steps.map((s) => s.text ?? '').join(' ');
        expect(left).not.toMatch(/[6-90№%*+=#$&@]/);
        const right = buildTeenLesson({ layout, id: FIRST[layout] + 1, rng }).steps.map((s) => s.text ?? '').join(' ');
        expect(right).not.toMatch(/[№%*+=#$&@]/);
      }
    }
  });
  it('урок «+ =»: усі приклади на дії вірні (30 варіантів)', () => {
    for (const layout of LAYOUTS) for (const id of [FIRST[layout] + 4, FIRST[layout] + 5]) {
      const rng = seeded(id);
      for (let i = 0; i < 30; i++) for (const s of buildTeenLesson({ layout, id, rng }).steps.filter((x) => x.kind === 'drill')) {
        for (const m of s.text.matchAll(/((?:\d+ [+*-] )+\d+) = (\d+)/g)) expect(Function(`return ${m[1]}`)(), s.text).toBe(+m[2]);
      }
    }
  });
  it('«усе разом»: у третій вправі щонайменше 3 різні символи, у другій щонайменше 2', () => {
    for (const layout of LAYOUTS) {
      const id = TEEN_COURSE[layout].at(-1).id;
      const rng = seeded(id);
      const kinds = (t) => new Set([...t].filter((c) => '№%*+=#$&@'.includes(c))).size;
      for (let i = 0; i < 40; i++) {
        const d = buildTeenLesson({ layout, id, rng }).steps.filter((s) => s.kind === 'drill');
        expect(kinds(d[1].text), d[1].text).toBeGreaterThanOrEqual(2);
        expect(kinds(d[2].text), d[2].text).toBeGreaterThanOrEqual(3);
      }
    }
  });
  it('генератор не падає без сидів (Math.random) і дає різні вправи', () => {
    const a = buildTeenLesson({ layout: 'ua', id: 19 }).steps.map((s) => s.text).join('|');
    const variants = new Set(Array.from({ length: 12 }, () => buildTeenLesson({ layout: 'ua', id: 19 }).steps.map((s) => s.text).join('|')));
    expect(a.length).toBeGreaterThan(50);
    expect(variants.size).toBeGreaterThan(6);
  });
});

describe('розташування цифр і символів, пальці, обидві руки для Shift', () => {
  const k = (ch, layout = 'ua') => keysFor(ch, layout).join('+');
  it('цифри 1…0: одна клавіша, палець такий самий, як у літери під нею', () => {
    const f = { 1: 'lp', 2: 'lr', 3: 'lm', 4: 'li', 5: 'li', 6: 'ri', 7: 'ri', 8: 'rm', 9: 'rr', 0: 'rp' };
    for (const layout of LAYOUTS) for (const [d, finger] of Object.entries(f)) {
      expect(keysFor(d, layout), d).toEqual([`Digit${d}`]);
      expect(fingerOf(`Digit${d}`)).toBe(finger);
    }
  });
  it('№ % * (УКР): Shift + 3, 5, 8 — Shift протилежної руки', () => {
    expect(k('№')).toBe('Digit3+ShiftRight');
    expect(k('%')).toBe('Digit5+ShiftRight');
    expect(k('*')).toBe('Digit8+ShiftLeft');
  });
  it('+ та = : плюс — Shift + «=», знак рівності — сама клавіша; в обох мовах', () => {
    for (const layout of LAYOUTS) {
      expect(k('=', layout)).toBe('Equal');
      expect(k('+', layout)).toBe('Equal+ShiftLeft');
      expect(needsShift('+', layout)).toBe(true);
      expect(needsShift('=', layout)).toBe(false);
      expect(codeOfChar('+', layout)).toBe('Equal');
    }
  });
  it('ENG: # $ % & @ * — Shift + цифра', () => {
    expect(k('#', 'en')).toBe('Digit3+ShiftRight');
    expect(k('$', 'en')).toBe('Digit4+ShiftRight');
    expect(k('%', 'en')).toBe('Digit5+ShiftRight');
    expect(k('&', 'en')).toBe('Digit7+ShiftLeft');
    expect(k('@', 'en')).toBe('Digit2+ShiftRight');
    expect(k('*', 'en')).toBe('Digit8+ShiftLeft');
  });
  it('кожна клавіша кожного нового уроку знаходиться й має палець; символи з Shift підсвічують обидві руки', () => {
    for (const layout of LAYOUTS) for (const l of numberLessons(layout)) for (const c of l.letters) {
      const codes = keysFor(c, layout);
      expect(codes.length, `${layout} ${c}`).toBeGreaterThan(0);
      const fingers = codes.map(fingerOf);
      fingers.forEach((f, i) => expect(f, `${layout} ${c} ${codes[i]}`).toBeTruthy());
      if (!isDigitKey(c) && c !== '=') expect(new Set(fingers.map((x) => x[0])), `${layout} ${c}`).toEqual(new Set(['l', 'r']));
    }
  });
  it('підказка «як набрати» у знайомстві: Shift + 3, Shift + 5, Shift + =', () => {
    expect(comboText('№', 'ua')).toBe('Shift + 3');
    expect(comboText('%', 'ua')).toBe('Shift + 5');
    expect(comboText('*', 'ua')).toBe('Shift + 8');
    expect(comboText('+', 'ua')).toBe('Shift + =');
    expect(comboText('=', 'ua')).toContain('праворуч від дефіса');
    expect(comboText('@', 'en')).toBe('Shift + 2');
  });
});

describe('стійкість до розкладок: зараховується надрукований символ', () => {
  const press = (text, keys) => keys.reduce((st, key) => pressChar(st, key).state, createExercise(text));
  it('цифра з цифрового блоку (event.key «5», code Numpad5) і з основного ряду — те саме', () => {
    expect(classifyKey({ key: '5', code: 'Numpad5' }, 'ua')).toBe('other');
    expect(classifyKey({ key: '5', code: 'Digit5' }, 'en')).toBe('other');
    expect(pressChar(createExercise('5'), '5').result).toBe('done');
    // символи з цифрового блоку теж зараховуються за тим, що надруковано
    expect(pressChar(createExercise('+'), '+').result).toBe('done');
    expect(pressChar(createExercise('*'), '*').result).toBe('done');
    expect(pressChar(createExercise('-'), '-').result).toBe('done');
  });
  it('символи Shift + цифри: № % * + = # $ & @ приймаються, інший символ — помилка, а не пропуск', () => {
    for (const ch of '№%*+=#$&@') {
      expect(pressChar(createExercise(ch), ch).result, ch).toBe('done');
      expect(pressChar(createExercise(ch), '7').result, ch).toBe('error');
    }
    const st = press('№ 12', ['№', ' ', '1', '2']);
    expect(st.done).toBe(true);
    expect(st.errors).toBe(0);
  });
  it('Shift/Ctrl+Alt: «№» і «%» не стають комбінаціями; Ctrl+5 лишається комбінацією', () => {
    expect(classifyKey({ key: '№', code: 'Digit3', shiftKey: true }, 'ua')).toBe('other');
    expect(classifyKey({ key: '%', code: 'Digit5', shiftKey: true }, 'ua')).toBe('other');
    expect(classifyKey({ key: '5', code: 'Digit5', ctrlKey: true }, 'ua')).toBe('ignore');
  });
  it('вся вправа кожного нового уроку проходиться дослівним введенням її символів (event.key) без помилок', () => {
    for (const layout of LAYOUTS) for (const l of numberLessons(layout)) {
      const rng = seeded(l.id + 99);
      for (let i = 0; i < 10; i++) for (const s of buildTeenLesson({ layout, id: l.id, rng }).steps.filter((x) => x.kind === 'drill')) {
        let st = createExercise(s.text);
        while (!st.done) { const r = pressChar(st, currentChar(st)); expect(r.result).not.toBe('error'); st = r.state; }
        expect(st.errors).toBe(0);
      }
    }
  });
});

describe('екрани уроків цифр і символів у всіх трьох світах', () => {
  it('кожен новий урок відкривається в кожному світі й обох мовах: ряд цифр, підписи, без undefined', () => {
    for (const world of WORLD_IDS) for (const layout of LAYOUTS) for (const lesson of numberLessons(layout)) {
      const st = createStore(memory());
      const p = st.create({ name: 'Олекса', avatar: 'fox', level: '5', world, layout });
      st.update(p.id, { layout, placement: { kind: 'zero', source: 'skip', at: 1 } });
      for (const l of TEEN_COURSE[layout].filter((x) => x.id < lesson.id)) st.finishTeenLesson(p.id, { layout, lessonId: l.id, stars: 3, acc: 99, cpm: 100 });
      const html = teenScreen(teenRoute(`teen/lesson/${lesson.id}`), st.get(p.id));
      expect(html, `${world} ${layout} ${lesson.id}`).toContain('has-numrow');
      expect(html).toContain('data-code="Digit5"');
      expect(html).toContain('data-code="Equal"');
      expect(html).toContain('key-sub');
      expect(html.toLowerCase()).toContain(`урок ${lesson.id}`);
      expect(html).not.toMatch(/undefined|NaN|\[object/);
    }
  });
  it('карта і список уроків відкриваються в кожному світі, коли пройдено весь курс', () => {
    for (const world of WORLD_IDS) for (const layout of LAYOUTS) {
      const st = createStore(memory());
      const p = st.create({ name: 'Олекса', avatar: 'fox', level: '6', world, layout });
      st.update(p.id, { layout, placement: { kind: 'zero', source: 'skip', at: 1 } });
      for (const l of TEEN_COURSE[layout]) st.finishTeenLesson(p.id, { layout, lessonId: l.id, stars: 3, acc: 99, cpm: 100 });
      for (const hash of ['teen', 'teen/lessons', 'teen/lesson']) {
        const html = teenScreen(teenRoute(hash), st.get(p.id));
        expect(html, `${world} ${layout} ${hash}`).not.toMatch(/undefined|NaN|\[object/);
      }
      expect(teenScreen(teenRoute('teen/lessons'), st.get(p.id))).toContain(`data-lesson-go="${TEEN_COURSE[layout].length}"`);
    }
  });
});

void learnedKeys;
