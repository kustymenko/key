// Генератор вправ: з банків слів і речень робить кроки уроку.
// Правило: у вправі ЗАВЖДИ лише клавіші, вивчені до цього уроку (див. learnedKeys).
// Рівень '1-2': вправи по 5–10 символів. Рівень '3-4': по 20–60 символів, у кінці — речення.
import { WORDS_UA } from '../content/words-ua.js';
import { WORDS_EN } from '../content/words-en.js';
import { SENTENCES_UA } from '../content/sentences-ua.js';
import { SENTENCES_EN } from '../content/sentences-en.js';
import { getLesson, learnedKeys, isPunct } from './course.js';

const WORDS = { ua: WORDS_UA, en: WORDS_EN };
const SENTENCES = { ua: SENTENCES_UA, en: SENTENCES_EN };
const VOWELS = { ua: 'аоуиіеєюяї', en: 'aeiou' };
const TARGETS_34 = [24, 38, 52]; // довжини трьох вправ 3–4 класу
const MAX_34 = 60;

const rnd = (rng, n) => Math.floor(rng() * n);
const pick = (rng, arr) => arr[rnd(rng, arr.length)];
function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(rng, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const cap = (w) => w[0].toUpperCase() + w.slice(1);

// ---------- що вже вивчено ----------
export function learnedLetters(layout, id) {
  return [...learnedKeys(layout, id)].filter((c) => c !== ' ' && !isPunct(c));
}

// Слова банку, у яких усі літери вивчені (будь-який рівень)
export function wordPool(layout, id) {
  const known = new Set(learnedLetters(layout, id));
  return WORDS[layout].filter((x) => [...x.w].every((c) => known.has(c)));
}

// Склади й пари для ранніх уроків, коли справжніх слів ще мало. Лише вивчені літери.
export function syllablePool(layout, id) {
  const letters = learnedLetters(layout, id).filter((c) => c !== 'ь' && c !== 'й');
  const vow = letters.filter((c) => VOWELS[layout].includes(c));
  const con = letters.filter((c) => !VOWELS[layout].includes(c));
  const out = new Set();
  for (const c of con) for (const v of vow) { out.add(c + v); out.add(v + c); }
  if (!out.size) for (const a of letters) for (const b of letters) out.add(a + b); // ще немає голосних (англійська, уроки 1–3)
  return [...out];
}

// Скільки різних елементів (слова + склади) є для вправ цього уроку
export const poolSize = (layout, id) => new Set([...wordPool(layout, id).map((x) => x.w), ...syllablePool(layout, id)]).size;

// ---------- збирання тексту вправи ----------
const rep = (c, n = 5) => c.repeat(n);
const alt = (a, b, n = 6) => Array.from({ length: n }, (_, i) => (i % 2 ? b : a)).join('');

// 1–2 клас: 1–3 елементи через пробіл, разом 5–10 символів
function compose12(rng, items, spaceOk, used) {
  if (!items.length) return null;
  const sep = spaceOk ? ' ' : '';
  for (let t = 0; t < 80; t++) {
    const k = 1 + rnd(rng, 3);
    const text = Array.from({ length: k }, () => pick(rng, items)).join(sep);
    if (text.length >= 5 && text.length <= 10 && !used.has(text)) return text;
  }
  let text = pick(rng, items);
  while (text.length < 5) text += sep + pick(rng, items);
  return text.slice(0, 10).trim();
}

// 3–4 клас: додаємо елементи, доки не дійдемо до потрібної довжини (не більше 60)
function compose34(rng, items, sep, target) {
  if (!items.length) return null;
  const pool = shuffle(rng, items);
  let text = '';
  for (let i = 0; text.length < target && i < 400; i++) {
    const it = pool[i % pool.length];
    const next = text ? text + sep + it : it;
    if (next.length > MAX_34) { if (text.length >= 20) break; continue; }
    text = next;
  }
  return text;
}

// Речення потрібної довжини (не довше max); commas: true — лише з комою, false — лише без коми
function pickSentence(rng, list, { max, commas, avoid = '' }) {
  const ok = list.filter((x) => x.s.length <= max && x.s.includes(',') === commas && x.s.length >= 20 && !avoid.includes(x.s));
  return ok.length ? pick(rng, ok).s : null;
}

// Два речення до max символів
function twoSentences(rng, list, { max, commas }) {
  for (let t = 0; t < 120; t++) {
    const a = pickSentence(rng, list, { max, commas });
    const b = pickSentence(rng, list, { max, commas: false, avoid: a ?? '' });
    if (a && b && a.length + b.length + 1 <= max && a.length + b.length + 1 >= 40) return `${a} ${b}`;
  }
  return pickSentence(rng, list, { max, commas });
}

// ---------- кроки уроку ----------
const uniqItems = (arr) => [...new Set(arr)];

// Елементи вправ: слова, а де слів мало (ранні уроки) — ще й склади.
// fresh(x) — чи є в елементі нова клавіша уроку.
function itemSets({ layout, id, lesson, minLen = 2, maxLen = 8 }) {
  const fresh = (x) => lesson.letters.some((c) => x.includes(c));
  const words = uniqItems(wordPool(layout, id).map((x) => x.w).filter((w) => w.length >= minLen && w.length <= maxLen));
  const syl = syllablePool(layout, id);
  const withNew = words.filter(fresh);
  const sylNew = syl.filter(fresh);
  const allItems = words.length >= 10 ? words : uniqItems([...words, ...syl]);
  return {
    sylNew: sylNew.length ? sylNew : syl,
    // повторення: нових клавіш немає, тож «нові» елементи — це всі
    newItems: !lesson.letters.length ? allItems : withNew.length >= 3 ? withNew : uniqItems([...withNew, ...sylNew]),
    allItems,
  };
}

function drills12(ctx) {
  const { rng, layout, id, lesson, spaceOk } = ctx;
  const newL = lesson.letters.filter((c) => !isPunct(c));
  const punct = lesson.letters.find(isPunct);
  if (id === 1) { // перший урок: лише дві літери, без складів і пробілу
    const [a, b] = newL;
    return [rep(a), rep(b), alt(a, b), `${b}${b}${a}${a}${a}${b}${b}`];
  }
  const { sylNew, newItems, allItems } = itemSets({ layout, id, lesson, maxLen: 4 });
  const asWords = (items) => (punct ? items.map((w) => w + punct) : items);
  const out = newL.map((c) => rep(c));
  if (punct) out.push(alt(newL[0] ?? learnedLetters(layout, id)[0], punct));
  const slots = lesson.kind === 'review'
    ? [allItems, allItems, allItems, allItems]
    : [sylNew, asWords(newItems), asWords(newItems), asWords(allItems)];
  const used = new Set(out);
  for (let i = 0; out.length < 4; i++) {
    const text = compose12(rng, slots[i], spaceOk, used) ?? rep(learnedLetters(layout, id)[0]);
    used.add(text);
    out.push(text);
  }
  return out.slice(0, 4);
}

function drills34(ctx) {
  const { rng, layout, id, lesson, spaceOk } = ctx;
  const sep = spaceOk ? ' ' : '';
  const sentences = SENTENCES[layout];

  if (lesson.kind === 'shift') { // великі літери: слова з великої, потім речення
    const words = wordPool(layout, id).filter((x) => x.w.length >= 4 && x.w.length <= 7).map((x) => cap(x.w));
    return [
      compose34(rng, words, ' ', 24),
      pickSentence(rng, sentences, { max: 40, commas: false }),
      twoSentences(rng, sentences, { max: MAX_34, commas: false }),
    ];
  }
  if (lesson.kind === 'punct' || lesson.kind === 'sentences') { // коми й крапки в реченнях
    const commaLesson = lesson.kind === 'punct';
    const words = wordPool(layout, id).filter((x) => x.w.length >= 3 && x.w.length <= 6).map((x) => x.w);
    return [
      commaLesson ? compose34(rng, words, ', ', 24) : pickSentence(rng, sentences, { max: 40, commas: false }),
      pickSentence(rng, sentences, { max: 48, commas: true }),
      twoSentences(rng, sentences, { max: MAX_34, commas: commaLesson }),
    ];
  }

  const { newItems, allItems } = itemSets({ layout, id, lesson, minLen: 4 });
  const fallback = itemSets({ layout, id, lesson }); // коротші слова й склади, коли довгих ще немає
  const punct = lesson.letters.find(isPunct);
  const asWords = (items) => (punct ? items.map((w) => w + punct) : items);
  const pool = (items, alt) => asWords(items.length >= 6 ? items : alt);
  return [
    compose34(rng, pool(newItems, fallback.newItems), sep, TARGETS_34[0]),
    compose34(rng, pool(uniqItems([...newItems, ...allItems]), uniqItems([...fallback.newItems, ...fallback.allItems])), sep, TARGETS_34[1]),
    compose34(rng, pool(allItems, fallback.allItems), sep, TARGETS_34[2]),
  ];
}

/**
 * Урок для рівня: { id, letters, steps }.
 * steps: { kind: 'intro', ch } — знайомство з клавішею; { kind: 'drill', text } — вправа.
 */
export function buildLesson({ layout, id, level = '1-2', rng = Math.random }) {
  const lesson = getLesson(layout, id);
  if (!lesson) throw new Error(`Немає уроку ${id}`);
  const spaceOk = id >= 2;
  const ctx = { rng, layout, id, lesson, spaceOk };
  const texts = level === '3-4' ? drills34(ctx) : drills12(ctx);
  const intro = (lesson.intro ?? lesson.letters).map((ch) => ({ kind: 'intro', ch }));
  return {
    id,
    letters: lesson.letters,
    steps: [...intro, ...texts.map((text) => ({ kind: 'drill', text }))],
  };
}
