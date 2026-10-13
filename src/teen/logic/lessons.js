// Генератор вправ швидкого курсу 5–6 класів. ГОЛОВНЕ ПРАВИЛО: у вправі лише клавіші, вивчені до цього уроку (тести на кожен урок і мову).
// Урок: знайомство (одним кроком) + 3 вправи по 40–60, 70–90, 100–120 знаків; остання — без підказки.
import { WORDS_UA } from '../../content/words-ua.js';
import { WORDS_EN } from '../../content/words-en.js';
import { SENTENCES_UA } from '../../content/sentences-ua.js';
import { SENTENCES_EN } from '../../content/sentences-en.js';
import { getTeenLesson, learnedKeys, isPunctKey } from './course.js';

const WORDS = { ua: WORDS_UA, en: WORDS_EN };
const SENTENCES = { ua: SENTENCES_UA, en: SENTENCES_EN };
const VOWELS = { ua: 'аоуиіеєюяї', en: 'aeiou' };
export const DRILL_RANGES = [[40, 60], [70, 90], [100, 120]];

const rnd = (rng, n) => Math.floor(rng() * n);
const pick = (rng, arr) => arr[rnd(rng, arr.length)];
const uniq = (arr) => [...new Set(arr)];
function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(rng, i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const cap = (w) => w[0].toUpperCase() + w.slice(1);

// Слова банку, у яких усі літери вивчені
export function wordPool(layout, known) {
  return uniq(WORDS[layout].map((x) => x.w).filter((w) => w.length >= 3 && w.length <= 9 && [...w].every((c) => known.has(c))));
}
// Склади й пари, коли справжніх слів ще мало (лише вивчені літери)
export function syllablePool(layout, known) {
  const letters = [...known].filter((c) => c !== ' ' && !isPunctKey(c) && c !== 'ь' && c !== 'й');
  const vow = letters.filter((c) => VOWELS[layout].includes(c));
  const con = letters.filter((c) => !VOWELS[layout].includes(c));
  const out = new Set();
  for (const c of con) for (const v of vow) { out.add(c + v); out.add(v + c); }
  if (!out.size) for (const a of letters) for (const b of letters) out.add(a + b);
  return [...out];
}

// Додаємо елементи, доки довжина не потрапить у [min, max]; розділювач — пробіл
function compose(rng, items, [min, max], must = []) {
  if (!items.length) return '';
  const pool = shuffle(rng, items);
  for (let attempt = 0; attempt < 60; attempt++) {
    const parts = [...must];
    let text = parts.join(' ');
    for (let i = 0; text.length < min && i < 600; i++) {
      const it = pool[(i + attempt * 7) % pool.length];
      const next = text ? `${text} ${it}` : it;
      if (next.length > max) { if (text.length >= min) break; continue; }
      text = next;
    }
    if (text.length >= min && text.length <= max) return text;
  }
  return pool[0];
}

// Для клавіш-знаків (крапка, кома, «;», «/»): коротка вправа «літера + знак», лише вивчені клавіші
function punctPractice(known, punct, rng) {
  const letters = [...known].filter((c) => c !== ' ' && !isPunctKey(c));
  const base = letters[rnd(rng, letters.length)] ?? 'a';
  return punct.map((p) => (p === ',' || p === '.' || p === ';' ? `${base}${p}${base}${p}` : `${base}${p}${base}`)).join(' ');
}

// Слова, зібрані в короткі «фрази» з крапкою (або комою в англійській), якщо відповідна клавіша вже вивчена
function withMarks(rng, text, known, layout) {
  const canDot = known.has('.');
  const canComma = layout === 'en' && known.has(',');
  if (!canDot && !canComma) return text;
  const words = text.split(' ');
  const out = [];
  words.forEach((w, i) => {
    const last = i === words.length - 1;
    const every = 4;
    out.push(w + (last || (i + 1) % every === 0 ? (canDot ? '.' : '') : canComma && (i + 1) % 2 === 0 ? ',' : ''));
  });
  return out.join(' ');
}

// Речення банку, які можна надрукувати вивченими клавішами (великі — лише якщо вивчено Shift)
export function sentencePool(layout, known, { commas = false } = {}) {
  return SENTENCES[layout]
    .map((x) => x.s)
    .filter((s) => s.length >= 20 && s.length <= 60)
    .filter((s) => [...s].every((c) => c === ' ' || known.has(c.toLowerCase())))
    .filter((s) => commas || !s.includes(','))
    .filter((s) => !s.includes(',') || known.has(',')); // кома в українській — Етап Т4
}

// Речення, склеєні до потрібної довжини
function sentencesText(rng, pool, [min, max]) {
  const s = shuffle(rng, pool);
  for (let a = 0; a < 60; a++) {
    let text = '';
    for (let i = 0; i < s.length * 2 && text.length < min; i++) {
      const it = s[(i + a * 3) % s.length];
      const next = text ? `${text} ${it}` : it;
      if (next.length <= max) text = next;
    }
    if (text.length >= min && text.length <= max) return text;
  }
  return s[0] ?? '';
}

/**
 * Урок: { id, layout, kind, newKeys, steps, quick }.
 * steps: { kind: 'intro', keys } — знайомство; { kind: 'drill', text, hint } — вправа (hint: false — без підсвічування).
 * quick — «швидка перевірка» (розміщення «Середній»): лише одна довга вправа без підказки, без знайомства.
 */
export function buildTeenLesson({ layout, id, rng = Math.random, quick = false }) {
  const lesson = getTeenLesson(layout, id);
  if (!lesson) throw new Error(`Немає уроку ${id}`);
  const known = learnedKeys(layout, id);
  const knownLetters = [...known].filter((c) => c !== ' ' && !isPunctKey(c));
  const newLetters = lesson.letters.filter((c) => !isPunctKey(c));
  const newPunct = lesson.letters.filter(isPunctKey);
  const words = wordPool(layout, known);
  const syl = syllablePool(layout, known);
  const fresh = (x) => newLetters.some((c) => x.includes(c));
  const base = words.length >= 14 ? words : uniq([...words, ...syl]);
  const withNew = base.filter(fresh);
  const newItems = !newLetters.length ? base : withNew.length >= 4 ? withNew : uniq([...withNew, ...syl.filter(fresh)]);

  let texts;
  if (lesson.kind === 'shift') {
    const sentences = sentencePool(layout, known);
    const capWords = words.filter((w) => w.length >= 4).map(cap);
    texts = [
      compose(rng, capWords.length ? capWords : words.map(cap), DRILL_RANGES[0]),
      sentencesText(rng, sentences, DRILL_RANGES[1]),
      sentencesText(rng, sentences, DRILL_RANGES[2]),
    ];
  } else {
    const pre = newPunct.length ? [punctPractice(known, newPunct, rng)] : [];
    // кожна нова літера обов'язково з'являється в першій вправі: беремо коротке слово чи склад із нею
    const pool = uniq([...base, ...syl]);
    const must = newLetters.map((c) => {
      const cand = pool.filter((x) => x.includes(c)).sort((a, b) => a.length - b.length).slice(0, 4);
      return cand.length ? pick(rng, cand) : null;
    }).filter(Boolean);
    let musts = uniq([...pre, ...shuffle(rng, must)]);
    while (musts.join(' ').length > 54 && musts.length > 1) musts = musts.slice(0, -1); // не довше за межу вправи
    const d1 = compose(rng, newItems, DRILL_RANGES[0], musts);
    const d2 = withMarks(rng, compose(rng, uniq([...newItems, ...base]), DRILL_RANGES[1]), known, layout);
    const d3 = withMarks(rng, compose(rng, base, DRILL_RANGES[2]), known, layout);
    texts = [d1, d2, d3];
  }
  texts = texts.map((t, i) => (t.length > DRILL_RANGES[i][1] ? t.slice(0, DRILL_RANGES[i][1]).trimEnd() : t));

  const newKeys = lesson.letters;
  const intro = lesson.kind === 'shift'
    ? [{ kind: 'intro', keys: lesson.intro ?? [], shift: true }]
    : newKeys.length ? [{ kind: 'intro', keys: newKeys }] : [];
  const drills = texts.map((text, i) => ({ kind: 'drill', text, hint: i < 2 }));
  void knownLetters;
  return {
    id, layout, kind: lesson.kind, newKeys, quick,
    steps: quick ? [{ kind: 'drill', text: texts[2], hint: false }] : [...intro, ...drills],
  };
}
