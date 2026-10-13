// Вступний тест і розміщення (Етап Т2). Чиста логіка без DOM: однакова для всіх світів.
// Пороги — стартові (див. typing-pedagogy, розділ 5–6): після пілоту з класами їх варто уточнити.
import { lettersOf } from '../../keyboard/layouts.js';
import { WORDS_UA } from '../../content/words-ua.js';
import { SENTENCES_UA } from '../../content/sentences-ua.js';
import { topLesson, learnedLetters } from '../../lessons/generator.js';

export const KINDS = ['zero', 'mid', 'pro', 'carry'];
export const SOURCES = ['test', 'skip', 'carry', 'manual'];
export const SELF = ['yes', 'almost', 'no'];
export const PART_MS = 30000; // кожна частина тесту триває ~30 с
export const THRESHOLDS = { fastMs: 600, slowMs: 1200, proAcc: 94, zeroAcc: 85 };
export const MIN_SAMPLES = { letters: 10, wordChars: 15 }; // менше — даних замало, починаємо з нуля

const num = (v) => (Number.isFinite(v) && v >= 0 ? Math.round(v * 10) / 10 : null);

// Безпечний запис розміщення з профілю (зіпсований запис → null)
export function cleanPlacement(p) {
  if (!p || typeof p !== 'object' || !KINDS.includes(p.kind)) return null;
  const learned = { ua: [], en: [] };
  for (const l of ['ua', 'en']) if (Array.isArray(p.learned?.[l])) learned[l] = p.learned[l].filter((c) => typeof c === 'string' && c.length === 1).slice(0, 40);
  return {
    kind: p.kind,
    source: SOURCES.includes(p.source) ? p.source : 'test',
    at: Number.isFinite(p.at) ? p.at : 0,
    medianMs: num(p.medianMs), wordsAcc: num(p.wordsAcc), wordsCpm: num(p.wordsCpm), sentencesAcc: num(p.sentencesAcc),
    self: SELF.includes(p.self) ? p.self : null,
    learned,
  };
}

export const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// ---------- Тексти тесту (лише власні банки проєкту) ----------
const ALPHABET = new Set(lettersOf('ua').map((k) => k.ua.toLowerCase()));
export const testLetters = () => [...ALPHABET];
const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

// Частина 1: n випадкових літер з усіх рядів, одна літера не повторюється підряд
export function makeLetters(rng = Math.random, n = 40) {
  const all = testLetters(), out = [];
  while (out.length < n) {
    const c = pick(all, rng);
    if (c !== out[out.length - 1]) out.push(c);
  }
  return out;
}

// Частина 2: слова 4–8 літер лише з клавіш, які є на клавіатурі (без апострофа й Ґ)
const okWord = (w) => w.length >= 4 && w.length <= 8 && [...w].every((c) => ALPHABET.has(c));
export function makeWordsText(rng = Math.random, minChars = 320) {
  const pool = WORDS_UA.map((x) => x.w).filter(okWord);
  const out = [];
  let len = 0;
  while (len < minChars) { const w = pick(pool, rng); if (w !== out[out.length - 1]) { out.push(w); len += w.length + 1; } }
  return out.join(' ');
}

// Частина 3: речення з великої літери, з комою й крапкою (спершу ті, що з комою)
const okSentence = (s) => s.length >= 20 && s.length <= 60 && [...s].every((c) => ALPHABET.has(c.toLowerCase()) || ' ,.'.includes(c));
export function makeSentencesText(rng = Math.random, minChars = 320) {
  const all = SENTENCES_UA.map((x) => x.s).filter(okSentence);
  const withComma = all.filter((s) => s.includes(','));
  const out = [];
  let len = 0;
  while (len < minChars) {
    const pool = out.length < 3 ? withComma : all;
    const s = pick(pool, rng);
    if (!out.includes(s)) { out.push(s); len += s.length + 1; }
  }
  return out.join(' ');
}

// Рядки для показу: не розриваємо слова; пробіл лишається в кінці рядка (щоб його теж друкували)
export function toLines(text, width = 34) {
  const lines = [];
  let cur = '';
  for (const word of text.split(' ')) {
    const next = cur ? `${cur}${word} ` : `${word} `;
    if (cur && next.length - 1 > width) { lines.push(cur); cur = `${word} `; } else cur = next;
  }
  if (cur) lines.push(cur.trimEnd());
  return lines;
}

// ---------- Підрахунок ----------
// samples: [{ ms, errors }] — час до правильної клавіші й помилки на цій літері
export function scoreFind(samples) {
  const ms = samples.map((s) => s.ms);
  const errors = samples.reduce((n, s) => n + s.errors, 0);
  const total = samples.length + errors;
  return { count: samples.length, medianMs: median(ms), errors, accuracy: total ? (samples.length / total) * 100 : null };
}
export function scoreTyping({ correct, errors, ms }) {
  const total = correct + errors;
  return { correct, errors, accuracy: total ? (correct / total) * 100 : null, cpm: ms > 0 ? (correct / ms) * 60000 : 0 };
}
// Літери, на яких тест показав слабке місце (помилки або дуже довга відповідь) — підуть у «Потренуй»
export function weakLetters(letters, samples) {
  const med = median(samples.map((s) => s.ms)) ?? 0;
  const missed = {};
  samples.forEach((s, i) => { if (s.errors > 0 || (med && s.ms > med * 2.2 && s.ms > 1500)) missed[letters[i]] = (missed[letters[i]] ?? 0) + Math.max(1, s.errors); });
  return missed;
}

/**
 * Розміщення за результатами. find — scoreFind, words — scoreTyping, self — 'yes' | 'almost' | 'no' | null.
 *  З нуля: даних замало, або медіана > 1,2 с, або точність слів < 85%.
 *  Досвідчений: медіана < 0,6 с і точність ≥ 94%.
 *  Середній: усе інше (зокрема точність 85–90% при швидкій відповіді — краще швидка перевірка, ніж початок з нуля).
 *  Відповідь «ні» на питання про клавіатуру лише опускає «досвідчений» до «середнього»: діти себе переоцінюють, але не недооцінюють.
 */
export function place({ find, words }, self = null) {
  const T = THRESHOLDS;
  if (!find || find.count < MIN_SAMPLES.letters || !words || words.correct < MIN_SAMPLES.wordChars) return 'zero';
  const acc = words.accuracy ?? 0;
  if (find.medianMs > T.slowMs || acc < T.zeroAcc) return 'zero';
  if (find.medianMs < T.fastMs && acc >= T.proAcc) return self === 'no' ? 'mid' : 'pro';
  return 'mid';
}

export const KIND_INFO = {
  zero: { title: 'Починаємо з основ', text: 'Пройдеш усі клавіші швидким курсом: уроки короткі, із ходу до слів.', short: 'З початку' },
  mid: { title: 'Ти вже орієнтуєшся на клавіатурі', text: 'Літери пройдеш як швидку перевірку: що знаєш, зарахується одразу.', short: 'Швидка перевірка' },
  pro: { title: 'Ти друкуєш наосліп', text: 'Літерні уроки зараховані. Починаєш із довгих текстів, цифр і випробувань.', short: 'Довгі тексти' },
  carry: { title: 'Те, що вивчено раніше, враховано', text: 'Літери з попередніх класів зараховані. Продовжуєш з того, чого ще не знаєш.', short: 'Продовжити' },
};

// ---------- Перехід із 3–4 класу ----------
// Що учень уже вивчив (за прогресом попередніх класів): літери й найдальший урок для кожної мови
export function carryOver(progress) {
  const out = { has: false, learned: { ua: [], en: [] }, top: { ua: 0, en: 0 } };
  for (const l of ['ua', 'en']) {
    const top = topLesson(l, progress);
    out.top[l] = top;
    if (top > 0) { out.learned[l] = learnedLetters(l, top); out.has = true; }
  }
  return out;
}
export function carryPlacement(progress, now = Date.now()) {
  const c = carryOver(progress);
  return cleanPlacement({ kind: 'carry', source: 'carry', at: now, learned: c.learned });
}
