// Етап Т4: довгі тексти, розділові знаки, апостроф, Ґ, абзаци. Банки текстів, генератор, розташування клавіш, зараховування за event.key.
import { describe, it, expect } from 'vitest';
import { TEEN_TEXTS } from '../src/content/teen/index.js';
import { MARK_CHARS, marksOf, needsOf } from '../src/content/teen/util.js';
import { TEEN_COURSE, learnedKeys, isPunctKey, needsNumberRow } from '../src/teen/logic/course.js';
import { buildTeenLesson } from '../src/teen/logic/lessons.js';
import { MARK_RANGES, PARAGRAPH_RANGES, usable, paragraphPool } from '../src/teen/logic/marks.js';
import { lessonStates, worldsFromLessons, creditedIds } from '../src/teen/logic/progress.js';
import { keysFor, codeOfChar, ROWS, TEEN_ROWS, SHIFTED } from '../src/keyboard/layouts.js';
import { fingerOf } from '../src/keyboard/fingers.js';
import { classifyKey, isAltGr } from '../src/keyboard/detect.js';
import { normChar, isApostrophe, isYo } from '../src/keyboard/chars.js';
import { createExercise, pressChar } from '../src/lessons/exercise.js';
import { keyboard } from '../src/keyboard/onscreen.js';
import { getLaptopFlag, setLaptopFlag, YO_FLAG } from '../src/storage/laptop.js';
import { createStore } from '../src/storage/store.js';
import { teenScreen, teenRoute } from '../src/teen/screens/index.js';
import { comboText, paragraphLines } from '../src/teen/screens/lesson.js';
import { WORLD_IDS } from '../src/teen/logic/profile.js';

const seeded = (seed = 5) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const LAYOUTS = ['ua', 'en'];
const words = (t) => t.split(' ').length;
const UA_CHARS = new Set([...'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя']);
const EN_CHARS = new Set([...'abcdefghijklmnopqrstuvwxyz']);
const allowed = (layout) => (ch) => ch === ' ' || MARK_CHARS.includes(ch) || (layout === 'ua' ? UA_CHARS : EN_CHARS).has(ch.toLowerCase());
const everything = (layout) => Object.values(TEEN_TEXTS[layout]).flat();

describe('банки текстів 5–6: символи, довжини, обсяг', () => {
  it('лише літери мови, пробіл і знаки курсу; без цифр, посилань, адрес, латиниці в українських текстах', () => {
    for (const layout of LAYOUTS) for (const e of everything(layout)) {
      for (const ch of e.t) expect(allowed(layout)(ch), `${layout}: «${ch}» у «${e.t}»`).toBe(true);
      expect(e.t, e.t).not.toMatch(/https?|www|@|\d|[«»—–“”‘’]/);
      expect(e.t).toBe(e.t.trim());
      expect(e.t).not.toMatch(/ {2}/);
    }
  });
  it('речення: 8–16 слів, з великої літери, закінчуються знаком; фрази короткі', () => {
    for (const layout of LAYOUTS) {
      for (const e of [...TEEN_TEXTS[layout].sentences, ...TEEN_TEXTS[layout].aposSentences, ...TEEN_TEXTS[layout].guSentences]) {
        expect(words(e.t), e.t).toBeGreaterThanOrEqual(layout === 'ua' && TEEN_TEXTS.ua.aposSentences.includes(e) ? 7 : 8);
        expect(words(e.t), e.t).toBeLessThanOrEqual(16);
        expect(e.t[0], e.t).toBe(e.t[0].toUpperCase());
        expect(/[.!?"]$/.test(e.t), e.t).toBe(true);
      }
      for (const e of TEEN_TEXTS[layout].phrases) expect(e.t.length, e.t).toBeLessThanOrEqual(55);
    }
  });
  it('абзаци: 5 клас 250–450, 6 клас 450–700 знаків; 3–5+ речень; Enter лише між абзацами (в самому тексті немає переносів)', () => {
    for (const layout of LAYOUTS) for (const p of TEEN_TEXTS[layout].paragraphs) {
      const [min, max] = PARAGRAPH_RANGES[p.g];
      expect(p.t.length, p.t.slice(0, 30)).toBeGreaterThanOrEqual(min);
      expect(p.t.length, p.t.slice(0, 30)).toBeLessThanOrEqual(max);
      expect(p.t).not.toContain('\n');
      expect(p.t.split(/[.!?]\s/).length, p.t.slice(0, 30)).toBeGreaterThanOrEqual(3);
    }
  });
  it('обсяг за ukrainian-content: абзаців 30+30 (УКР) і 15+15 (ENG), речень, слів з апострофом і Ґ', () => {
    const n = (l, g) => TEEN_TEXTS[l].paragraphs.filter((p) => p.g === g).length;
    expect(n('ua', '5')).toBeGreaterThanOrEqual(30); expect(n('ua', '6')).toBeGreaterThanOrEqual(30);
    expect(n('en', '5')).toBeGreaterThanOrEqual(15); expect(n('en', '6')).toBeGreaterThanOrEqual(15);
    expect(TEEN_TEXTS.ua.sentences.length).toBeGreaterThanOrEqual(120);
    expect(TEEN_TEXTS.en.sentences.length).toBeGreaterThanOrEqual(80);
    expect(TEEN_TEXTS.ua.aposWords.length).toBeGreaterThanOrEqual(60);
    expect(TEEN_TEXTS.ua.aposSentences.length).toBeGreaterThanOrEqual(20);
    expect(TEEN_TEXTS.ua.guWords.length).toBeGreaterThanOrEqual(30);
    expect(TEEN_TEXTS.ua.guSentences.length).toBeGreaterThanOrEqual(15);
  });
  it('кожен знак є щонайменше у 10 текстах (речення + абзаци) в обох мовах', () => {
    for (const layout of LAYOUTS) for (const m of MARK_CHARS) {
      const count = [...TEEN_TEXTS[layout].sentences, ...TEEN_TEXTS[layout].paragraphs, ...TEEN_TEXTS[layout].aposSentences].filter((e) => e.marks.includes(m)).length;
      expect(count, `${layout} «${m}»`).toBeGreaterThanOrEqual(10);
    }
  });
  it('кожен знак є в достатній кількості речень без жодних пізніших знаків (щоб урок мав із чого вибирати)', () => {
    // порядок вивчення: кома → ? ! → : ; → дужки → лапки → дефіс
    const order = { ua: [[','], ['?', '!'], [':', ';'], ['(', ')'], ['"'], ['-']], en: [["'"], ['?', '!'], [':'], ['(', ')'], ['"'], ['-']] };
    for (const layout of LAYOUTS) {
      const learned = new Set(['.', ...(layout === 'en' ? [',', ';'] : [])]);
      for (const group of order[layout]) {
        group.forEach((g) => learned.add(g));
        for (const m of group) {
          const pool = TEEN_TEXTS[layout].sentences.filter((e) => e.marks.every((x) => learned.has(x)) && e.marks.includes(m));
          expect(pool.length, `${layout} «${m}»`).toBeGreaterThanOrEqual(8);
        }
      }
    }
  });
  it('поля marks і needs збігаються з вмістом; апостроф і Ґ лише у призначених банках та абзацах', () => {
    for (const layout of LAYOUTS) for (const e of everything(layout)) {
      expect(e.marks).toEqual(marksOf(e.t));
      expect(e.needs).toEqual(needsOf(e.t));
      expect(e.needs).not.toContain('digits'); // цифри — Етап Т5
    }
    for (const e of [...TEEN_TEXTS.ua.sentences, ...TEEN_TEXTS.ua.phrases]) expect(e.needs, e.t).toEqual([]);
    for (const e of TEEN_TEXTS.ua.aposWords) expect(e.needs).toEqual(['apostrophe']);
    for (const e of TEEN_TEXTS.ua.aposSentences) expect(e.needs, e.t).toContain('apostrophe');
    for (const e of [...TEEN_TEXTS.ua.guWords, ...TEEN_TEXTS.ua.guSentences]) expect(e.needs, e.t).toContain('g-upturn');
    expect(TEEN_TEXTS.ua.paragraphs.some((p) => p.needs.includes('apostrophe'))).toBe(true);
    expect(TEEN_TEXTS.ua.paragraphs.some((p) => p.needs.includes('g-upturn'))).toBe(true);
  });
  it('немає повторів', () => {
    for (const layout of LAYOUTS) {
      const all = everything(layout).map((e) => e.t);
      expect(new Set(all).size).toBe(all.length);
    }
  });
});

describe('розпізнавання за тим, що надруковано (event.key)', () => {
  it('апостроф у трьох виглядах: \' ’ ʼ — однаковий', () => {
    for (const a of ["'", '’', 'ʼ']) {
      expect(isApostrophe(a)).toBe(true);
      expect(normChar(a)).toBe("'");
      let st = createExercise("м'я");
      st = pressChar(st, 'м').state;
      const r = pressChar(st, a);
      expect(r.result, a).toBe('ok');
    }
    // і навпаки: в тексті ’
    expect(pressChar({ ...createExercise('м’я'), pos: 1 }, "'").result).toBe('ok');
    expect(normChar('.')).toBe('.');
  });
  it('«ё» — не апостроф і не зараховується; Ґ і ґ розрізняються регістром, як і решта літер', () => {
    expect(isYo('ё')).toBe(true);
    expect(isYo('е')).toBe(false);
    const st = { ...createExercise("м'я"), pos: 1 };
    expect(pressChar(st, 'ё').result).toBe('error');
    expect(pressChar(createExercise('ґ'), 'ґ').result).toBe('done');
    expect(pressChar(createExercise('Ґ'), 'ґ').result).toBe('error'); // велика вимагає Shift
    expect(pressChar(createExercise('Ґ'), 'Ґ').result).toBe('done');
    expect(pressChar(createExercise('ґ'), 'г').result).toBe('error');
  });
  it('кінець абзацу друкується клавішею Enter; інша клавіша — помилка', () => {
    const st = { ...createExercise('а\nб'), pos: 1 };
    expect(pressChar(st, 'Enter').result).toBe('ok');
    expect(pressChar(st, ' ').result).toBe('error');
    expect(pressChar(st, 'б').result).toBe('error');
  });
  it('поведінка для 1–4 класів не змінилась: звичайні літери і Shift', () => {
    expect(pressChar(createExercise('а'), 'А').result).toBe('done');
    expect(pressChar(createExercise('А'), 'а').result).toBe('error');
    expect(pressChar(createExercise('ж'), 'з').result).toBe('error');
  });
  it('AltGr + Г = Ґ: подія з ctrl+alt (Windows) або AltGraph вважається введенням лише для 5–6 класів', () => {
    const e = { key: 'ґ', code: 'KeyU', ctrlKey: true, altKey: true, repeat: false, metaKey: false };
    expect(isAltGr(e)).toBe(true);
    expect(classifyKey(e, 'ua', { altGr: true })).toBe('ok');
    expect(classifyKey(e, 'ua')).toBe('ignore'); // як і раніше для 1–4: Ctrl+Alt не рахується
    const linux = { key: 'ґ', code: 'KeyU', ctrlKey: false, altKey: false, getModifierState: (m) => m === 'AltGraph' };
    expect(classifyKey(linux, 'ua', { altGr: true })).toBe('ok');
    expect(classifyKey({ key: 'v', code: 'KeyV', ctrlKey: true, altKey: false }, 'ua', { altGr: true })).toBe('ignore'); // Ctrl+V лишається комбінацією
    expect(classifyKey({ key: 'ґ', code: 'KeyU', altKey: true }, 'ua', { altGr: true })).toBe('ignore'); // сам Alt без Ctrl — комбінація
  });
  it('знаки з Shift та інші символи: kind «other», літери не того алфавіту — wrong-layout', () => {
    for (const k of ['?', '!', ':', ';', '(', ')', '"', '-', "'", 'Enter']) expect(classifyKey({ key: k, code: '' }, 'ua')).toBe('other');
    expect(classifyKey({ key: 'a', code: 'KeyA' }, 'ua')).toBe('wrong-layout');
    expect(classifyKey({ key: 'ґ', code: 'KeyU' }, 'ua')).toBe('ok');
  });
});

describe('розташування клавіш: стандартна українська розкладка Windows', () => {
  const k = (ch, layout = 'ua') => keysFor(ch, layout).join('+');
  it('апостроф — ліворуч від 1; Ґ — AltGr + Г; кома — Shift + клавіша крапки; дефіс — праворуч від 0', () => {
    expect(k("'")).toBe('Backquote');
    expect(k('’')).toBe('Backquote');
    expect(k('ʼ')).toBe('Backquote');
    expect(k('ґ')).toBe('KeyU+AltRight');
    expect(k('Ґ')).toBe('KeyU+AltRight+ShiftLeft');
    expect(k('.')).toBe('Slash');
    expect(k(',')).toBe('Slash+ShiftLeft');
    expect(k('-')).toBe('Minus');
  });
  it('Shift + цифри 1–0: ! " № ; % : ? * ( ) — потрібною рукою (Shift протилежної руки)', () => {
    const expected = { '!': ['Digit1', 'ShiftRight'], '"': ['Digit2', 'ShiftRight'], '№': ['Digit3', 'ShiftRight'], ';': ['Digit4', 'ShiftRight'], '%': ['Digit5', 'ShiftRight'],
      ':': ['Digit6', 'ShiftLeft'], '?': ['Digit7', 'ShiftLeft'], '*': ['Digit8', 'ShiftLeft'], '(': ['Digit9', 'ShiftLeft'], ')': ['Digit0', 'ShiftLeft'] };
    for (const [ch, codes] of Object.entries(expected)) expect(keysFor(ch, 'ua'), ch).toEqual(codes);
    expect(Object.keys(SHIFTED.ua).filter((c) => c !== ',').join('')).toBe('!"№;%:?*()');
  });
  it('англійська: ? ! : " ( ) \' - ; Enter', () => {
    expect(k('?', 'en')).toBe('Slash+ShiftLeft');
    expect(k('!', 'en')).toBe('Digit1+ShiftRight');
    expect(k(':', 'en')).toBe('Semicolon+ShiftLeft');
    expect(k('"', 'en')).toBe('Quote+ShiftLeft');
    expect(k("'", 'en')).toBe('Quote');
    expect(k('(', 'en')).toBe('Digit9+ShiftLeft');
    expect(k('-', 'en')).toBe('Minus');
    expect(k(';', 'en')).toBe('Semicolon');
    expect(k('\n', 'en')).toBe('Enter');
    expect(k('\n', 'ua')).toBe('Enter');
  });
  it('кожна клавіша курсу має палець; кожен символ уроків знаходить клавішу в обох мовах', () => {
    for (const layout of LAYOUTS) for (const l of TEEN_COURSE[layout]) for (const c of l.letters) {
      const codes = keysFor(c, layout);
      expect(codes.length, `${layout} ${c}`).toBeGreaterThan(0);
      for (const code of codes) expect(fingerOf(code), `${layout} ${c} ${code}`).toBeTruthy();
    }
  });
  it('дитяча клавіатура не змінилась (ROWS), а клавіатура 5–6 має ряд цифр, апостроф, Alt Gr і підписи', () => {
    expect(ROWS[0][0].ua).toBe(''); // Backquote у дитячій без підпису
    expect(ROWS.at(-1)).toHaveLength(1);
    const flat = TEEN_ROWS.flat();
    expect(flat.find((x) => x.code === 'Backquote').ua).toBe("'");
    expect(flat.find((x) => x.code === 'AltRight')).toBeTruthy();
    expect(flat.find((x) => x.code === 'Digit7').sub.ua).toBe('?');
    expect(flat.find((x) => x.code === 'KeyU').sub.ua).toBe('Ґ');
    const html = keyboard({ layout: 'ua', rows: TEEN_ROWS, marks: true, next: 'Digit7' });
    expect(html).toContain('key-sub');
    expect(html).toContain('data-code="AltRight"');
    expect(keyboard({ layout: 'ua' })).not.toContain('key-sub');
    expect(codeOfChar('?', 'ua')).toBe('Digit7');
  });
  it('підказки «як набрати»', () => {
    expect(comboText('?', 'ua')).toBe('Shift + 7');
    expect(comboText('ґ', 'ua')).toBe('Alt Gr + Г');
    expect(comboText('Ґ', 'ua')).toBe('Alt Gr + Shift + Г');
    expect(comboText("'", 'ua')).toContain('ліворуч від 1');
    expect(comboText('-', 'ua')).toContain('праворуч від 0');
    expect(comboText(',', 'ua')).toBe('Shift + .');
  });
});

describe('курс знаків: уроки і генератор', () => {
  const marksLessons = (layout) => TEEN_COURSE[layout].filter((l) => ['punct', 'mixed', 'paragraph'].includes(l.kind));
  it('українська: кома, ? !, : ;, дужки, лапки, дефіс, апостроф, Ґ, усі знаки, абзаци; англійська — без коми (вона з уроку 6)', () => {
    expect(marksLessons('ua').map((l) => l.label)).toEqual([',', '? !', ': ;', '( )', '"', '-', '’', 'Ґ', 'Усі знаки', 'Абзаци']);
    expect(marksLessons('en').map((l) => l.id)).toEqual([8, 9, 10, 11, 12, 13, 14, 15]);
    expect(TEEN_COURSE.ua.find((l) => l.label === '’').moved).toBe(true);
    expect(TEEN_COURSE.ua.find((l) => l.label === 'Ґ').moved).toBe(true);
    for (const layout of LAYOUTS) marksLessons(layout).forEach((l) => expect(needsNumberRow(l)).toBe(true));
    expect(needsNumberRow(TEEN_COURSE.ua[0])).toBe(false);
  });
  it('на кожному уроці, в обох мовах і класах, у багатьох варіантах — лише вивчені клавіші; нові знаки є у вправах', () => {
    for (const layout of LAYOUTS) for (const lesson of marksLessons(layout)) for (const grade of ['5', '6']) for (let s = 1; s <= 30; s++) {
      const known = learnedKeys(layout, lesson.id);
      const b = buildTeenLesson({ layout, id: lesson.id, rng: seeded(s), grade });
      const drills = b.steps.filter((x) => x.kind === 'drill');
      expect(drills, `${layout} ${lesson.id}`).toHaveLength(lesson.kind === 'paragraph' ? 2 : 3);
      for (const d of drills) {
        expect(usable(d.text, known), `${layout} урок ${lesson.id}: «${d.text}»`).toBe(true);
        expect(d.text).toBe(d.text.trim());
        expect(d.text.length).toBeGreaterThan(0);
      }
      const all = drills.map((d) => d.text).join(' ');
      for (const c of lesson.letters) expect(all.toLowerCase().includes(c), `${layout} урок ${lesson.id}: немає «${c}»`).toBe(true);
    }
  });
  it('довжини вправ знаків: фраза 40–70, 80–120, 130–180; хоча б перші дві — з підказкою, остання без; без повторів у межах уроку', () => {
    for (const layout of LAYOUTS) for (const lesson of marksLessons(layout).filter((l) => l.kind !== 'paragraph')) for (let s = 1; s <= 30; s++) {
      const drills = buildTeenLesson({ layout, id: lesson.id, rng: seeded(s) }).steps.filter((x) => x.kind === 'drill');
      drills.forEach((d, i) => {
        expect(d.text.length, `${layout} ${lesson.id} вправа ${i + 1}: ${d.text.length}`).toBeGreaterThanOrEqual(MARK_RANGES[i][0]);
        expect(d.text.length).toBeLessThanOrEqual(MARK_RANGES[i][1]);
        expect(d.hint).toBe(i < 2);
      });
      expect(new Set(drills.map((d) => d.text)).size).toBe(3);
    }
  });
  it('кожен знак урока є саме там, де його потрібно відпрацювати: перша вправа — перший знак, друга — другий, третя — усі', () => {
    for (const layout of LAYOUTS) for (const lesson of marksLessons(layout).filter((l) => l.kind === 'punct' && l.letters.length)) for (let s = 1; s <= 20; s++) {
      const d = buildTeenLesson({ layout, id: lesson.id, rng: seeded(s) }).steps.filter((x) => x.kind === 'drill');
      const [a, b = a] = lesson.letters;
      expect(d[0].text.toLowerCase()).toContain(a);
      expect(d[1].text.toLowerCase()).toContain(b);
      for (const c of lesson.letters) expect(d[2].text.toLowerCase()).toContain(c);
    }
  });
  it('уроки апострофа і Ґ беруть слова й речення з окремих банків (УКР); слів з апострофом немає до цього уроку', () => {
    const apos = TEEN_COURSE.ua.find((l) => l.label === '’');
    const gu = TEEN_COURSE.ua.find((l) => l.label === 'Ґ');
    for (let s = 1; s <= 20; s++) {
      const a = buildTeenLesson({ layout: 'ua', id: apos.id, rng: seeded(s) }).steps.filter((x) => x.kind === 'drill');
      a.forEach((d) => expect(d.text).toContain("'"));
      const g = buildTeenLesson({ layout: 'ua', id: gu.id, rng: seeded(s) }).steps.filter((x) => x.kind === 'drill');
      g.forEach((d) => expect(/[ґҐ]/.test(d.text)).toBe(true));
    }
    // до відповідних уроків жоден урок не містить апострофа чи Ґ
    for (const lesson of TEEN_COURSE.ua.filter((l) => l.id < apos.id)) for (let s = 1; s <= 15; s++) {
      const text = buildTeenLesson({ layout: 'ua', id: lesson.id, rng: seeded(s) }).steps.filter((x) => x.kind === 'drill').map((x) => x.text).join(' ');
      expect(text, `урок ${lesson.id}`).not.toMatch(/['ґҐ]/);
    }
    for (const lesson of TEEN_COURSE.ua.filter((l) => l.id < gu.id)) for (let s = 1; s <= 15; s++) {
      const text = buildTeenLesson({ layout: 'ua', id: lesson.id, rng: seeded(s) }).steps.filter((x) => x.kind === 'drill').map((x) => x.text).join(' ');
      expect(text, `урок ${lesson.id}`).not.toMatch(/[ґҐ]/);
    }
  });
  it('урок «Усі знаки»: у кожній вправі щоразу кілька різних знаків (2, 3, 4)', () => {
    for (const layout of LAYOUTS) {
      const mixed = TEEN_COURSE[layout].find((l) => l.kind === 'mixed');
      for (let s = 1; s <= 30; s++) {
        const d = buildTeenLesson({ layout, id: mixed.id, rng: seeded(s) }).steps.filter((x) => x.kind === 'drill');
        d.forEach((x, i) => expect(MARK_CHARS.filter((m) => m !== '.' && x.text.includes(m)).length, `${layout} ${s} ${x.text}`).toBeGreaterThanOrEqual(i + 2));
      }
    }
  });
  it('абзаци: 5 клас — 250–450 знаків, 6 клас — 450–700; Enter між абзацами; друга вправа без підказки', () => {
    for (const layout of LAYOUTS) {
      const lesson = TEEN_COURSE[layout].find((l) => l.kind === 'paragraph');
      expect(lesson.letters).toEqual(['\n']);
      for (const grade of ['5', '6']) for (let s = 1; s <= 25; s++) {
        const [one, two] = buildTeenLesson({ layout, id: lesson.id, rng: seeded(s), grade }).steps.filter((x) => x.kind === 'drill');
        const [min, max] = PARAGRAPH_RANGES[grade];
        expect(one.text.length).toBeGreaterThanOrEqual(min); expect(one.text.length).toBeLessThanOrEqual(max);
        expect(one.text).not.toContain('\n');
        expect(one.hint).toBe(true);
        const parts = two.text.split('\n');
        expect(parts).toHaveLength(2);
        parts.forEach((p) => { expect(p.length).toBeGreaterThanOrEqual(min); expect(p.length).toBeLessThanOrEqual(max); });
        expect(parts[0]).not.toBe(parts[1]);
        expect(two.hint).toBe(false);
      }
      expect(paragraphPool(layout, learnedKeys(layout, lesson.id), '5').length).toBeGreaterThanOrEqual(10);
      expect(paragraphPool(layout, learnedKeys(layout, lesson.id), '6').length).toBeGreaterThanOrEqual(10);
    }
  });
  it('абзац можна надрукувати до кінця: вправа з Enter проходиться', () => {
    const lesson = TEEN_COURSE.ua.find((l) => l.kind === 'paragraph');
    const two = buildTeenLesson({ layout: 'ua', id: lesson.id, rng: seeded(3), grade: '5' }).steps.filter((x) => x.kind === 'drill')[1].text;
    let st = createExercise(two);
    let last;
    for (const ch of two) { const r = pressChar(st, ch === '\n' ? 'Enter' : ch === "'" ? '’' : ch); expect(r.result).not.toBe('error'); st = r.state; last = r.result; }
    expect(last).toBe('done');
    expect(st.errors).toBe(0);
  });
  it('рядки вправи: абзац з нового рядка, довжини рядків у сумі = довжина тексту', () => {
    const text = 'Перший абзац тут.\nДругий абзац тут і він трохи довший за перший, щоб ще раз перенестись на інший рядок.';
    const lines = paragraphLines(text, 30);
    expect(lines.join('')).toBe(text);
    expect(lines[0].endsWith('\n')).toBe(true);
    expect(lines.length).toBeGreaterThan(2);
  });
  it('знаки не змінюють літерні уроки і розміщення: «досвідчений» не зараховує уроки знаків', () => {
    for (const layout of LAYOUTS) {
      const ids = [...creditedIds(layout, { kind: 'pro' })];
      for (const id of ids) expect(['letters', 'review']).toContain(TEEN_COURSE[layout].find((l) => l.id === id).kind);
      const st = lessonStates(layout, { teen: {}, placement: { kind: 'pro' } });
      expect(st.filter((l) => l.state === 'current')).toHaveLength(1);
      expect(st.find((l) => l.state === 'current').kind).toBe('shift');
    }
  });
  it('після Shift-уроку відкривається «Місто знаків»; знаки йдуть по черзі', () => {
    const done = (layout, upTo) => Object.fromEntries(TEEN_COURSE[layout].filter((l) => l.id <= upTo).map((l) => [l.id, { stars: 2 }]));
    const w = (layout, upTo) => worldsFromLessons(layout, lessonStates(layout, { teen: { [layout]: done(layout, upTo) } })).map((x) => `${x.state}${x.pct}`).join(' ');
    expect(w('ua', 8)).toBe('done100 done100 done100 now0 locked0 locked0');
    expect(w('ua', 13)).toBe('done100 done100 done100 now50 locked0 locked0');
    expect(w('ua', 18)).toBe('done100 done100 done100 done100 now0 locked0');
    expect(w('en', 7)).toBe('done100 done100 done100 now0 locked0 locked0');
    expect(w('en', 15)).toBe('done100 done100 done100 done100 now0 locked0');
  });
});

describe('екрани уроків знаків у всіх трьох світах', () => {
  it('кожен урок знаків відкривається в кожному світі й обох мовах: ряд цифр, Alt Gr, підписи, без undefined', () => {
    for (const world of WORLD_IDS) for (const layout of LAYOUTS) for (const lesson of TEEN_COURSE[layout].filter((l) => l.kind !== 'letters' && l.kind !== 'review' && l.kind !== 'shift')) {
      const st = createStore(memory());
      const p = st.create({ name: 'Олекса', avatar: 'fox', level: '5', world, layout });
      st.update(p.id, { layout, placement: { kind: 'zero', source: 'skip', at: 1 } });
      for (const l of TEEN_COURSE[layout].filter((x) => x.id < lesson.id)) st.finishTeenLesson(p.id, { layout, lessonId: l.id, stars: 3, acc: 99, cpm: 100 });
      const html = teenScreen(teenRoute(`teen/lesson/${lesson.id}`), st.get(p.id));
      expect(html, `${world} ${layout} ${lesson.id}`).toContain('has-numrow');
      expect(html).toContain('data-code="AltRight"');
      expect(html).toContain('data-code="Backquote"');
      expect(html).toContain('key-sub');
      expect(html.toLowerCase()).toContain(`урок ${lesson.id}`); // піксельний світ пише «УРОК» великими
      expect(html).not.toMatch(/undefined|NaN|\[object|https?:\/\/(?!www\.w3\.org)/);
    }
  });
  it('літерні уроки лишаються зі старою клавіатурою (без ряду цифр)', () => {
    for (const world of WORLD_IDS) {
      const st = createStore(memory());
      const p = st.create({ name: 'Дана', avatar: 'owl', level: '5', world });
      st.update(p.id, { placement: { kind: 'zero', source: 'skip', at: 1 } });
      const html = teenScreen(teenRoute('teen/lesson/1'), st.get(p.id));
      expect(html).not.toContain('has-numrow');
      expect(html).not.toContain('key-sub');
      expect(html).not.toContain('data-code="AltRight"');
    }
  });
  it('список уроків вміщає всі уроки і показує їх усі', () => {
    for (const world of WORLD_IDS) for (const layout of LAYOUTS) {
      const st = createStore(memory());
      const p = st.create({ name: 'Ліна', avatar: 'cat', level: '6', world, layout });
      const html = teenScreen(teenRoute('teen/lessons'), st.get(p.id));
      expect(html.match(/data-lesson-go=/g)).toHaveLength(TEEN_COURSE[layout].length);
    }
  });
});

describe('пам’ять про ноутбук («ё» замість апострофа)', () => {
  it('прапорець зберігається окремо від профілів і знімається', () => {
    expect(getLaptopFlag(YO_FLAG)).toBe(false);
    const store = memory();
    globalThis.localStorage = store;
    try {
      setLaptopFlag(YO_FLAG, true);
      expect(getLaptopFlag(YO_FLAG)).toBe(true);
      expect(store.getItem('klaviaturka.laptop.v1')).toContain(YO_FLAG);
      expect(store.getItem('klaviaturka.v1')).toBeNull();
      setLaptopFlag(YO_FLAG, false);
      expect(getLaptopFlag(YO_FLAG)).toBe(false);
    } finally { delete globalThis.localStorage; }
  });
  it('якщо сховище недоступне — не ламається і працює далі', () => {
    globalThis.localStorage = { getItem() { throw new Error('заборонено'); }, setItem() { throw new Error('заборонено'); } };
    try {
      expect(() => setLaptopFlag(YO_FLAG, true)).not.toThrow();
      expect(() => getLaptopFlag(YO_FLAG)).not.toThrow();
    } finally { delete globalThis.localStorage; }
    setLaptopFlag(YO_FLAG, false);
  });
  it('знаки не вважаються літерами курсу', () => {
    for (const c of ['?', '!', ':', ';', '(', ')', '"', '-', "'", '\n', ',', '.']) expect(isPunctKey(c), c).toBe(true);
    expect(isPunctKey('ґ')).toBe(false);
  });
});
