// Уроки цифр і символів верхнього ряду (Етап Т5): цифри лівої й правої руки, числа й дати, символи № % * (ENG: # $ % & @ *), дії + =, усе разом.
// Той самий принцип: у вправі лише вивчені клавіші. Тексти — власні (src/content/teen/numbers.js) і прості «токени» (числа, одиниці, приклади),
// які будуємо з вивчених цифр і символів; приклади на дії завжди арифметично вірні.
import { TEEN_NUMBERS } from '../../content/teen/numbers.js';
import { getTeenLesson, learnedKeys, isDigitKey } from './course.js';
import { compose, fallback, usable, hasMark } from './marks.js';

// Довжини вправ: числа складні для пальців, тому вони коротші, ніж у знаків (Т4)
export const NUMBER_RANGES = [[40, 60], [70, 90], [100, 120]];
export const MIXED_RANGES = [[40, 70], [80, 120], [130, 180]];
const SYMBOLS = ['№', '%', '*', '+', '=', '#', '$', '&', '@'];
const UNITS = {
  ua: ['кг', 'г', 'м', 'см', 'км', 'мм', 'л', 'мл', 'хв', 'год', 'с', 'грн'],
  en: ['kg', 'g', 'm', 'cm', 'km', 'mm', 'l', 'ml', 'min', 'h', 's'],
};
const PAIRS = { ua: [], en: ['Tom & Ann', 'Max & Eva', 'salt & pepper', 'tea & milk', 'Art & Science'] };

const rnd = (rng, n) => Math.floor(rng() * n);
const pick = (rng, arr) => arr[rnd(rng, arr.length)];
const pad = (n) => String(n).padStart(2, '0');

// Число із заданої множини цифр (без нуля попереду)
function number(rng, digs, len) {
  let s = '';
  for (let i = 0; i < len; i++) {
    const pool = i === 0 && len > 1 ? digs.filter((d) => d !== '0') : digs;
    s += pick(rng, pool.length ? pool : digs);
  }
  return s;
}
// Число, що містить цифру d (на випадковому місці)
function numberWith(rng, digs, d, len = 3) {
  const s = number(rng, digs, len).split('');
  let at = rnd(rng, len);
  if (at === 0 && d === '0') at = 1 + rnd(rng, len - 1);
  s[at] = d;
  return s.join('');
}
const digitsIn = (n) => [...String(n)];
const fitsDigits = (n, digs) => digitsIn(n).every((d) => digs.includes(d));

// Приклад на дію з вивчених цифр і знаків; результат завжди вірний. Повертає рядок або null
function sum(rng, digs, ops, withEq) {
  for (let t = 0; t < 120; t++) {
    const op = pick(rng, ops);
    const a = 1 + rnd(rng, op === '*' ? 12 : 60);
    const b = 1 + rnd(rng, op === '*' ? 12 : 60);
    const [x, y] = op === '-' && b > a ? [b, a] : [a, b];
    const r = op === '+' ? x + y : op === '-' ? x - y : x * y;
    if (r <= 0 || ![x, y, r].every((n) => fitsDigits(n, digs))) continue;
    return withEq ? `${x} ${op} ${y} = ${r}` : `${x} ${op} ${y}`;
  }
  return null;
}

// Склеює токени (з make) до довжини [min, max]; must — токени, які мають бути. sep — розділювач, end — кінець (крапка)
function tokensText(rng, make, [min, max], { sep = ' ', end = '', must = [], need = [] } = {}) {
  for (let a = 0; a < 400; a++) {
    const parts = [...must];
    let text = parts.join(sep) + end;
    for (let i = 0; text.length < min && i < 40; i++) {
      const t = make();
      if (!t) continue;
      const next = [...parts, t].join(sep) + end;
      if (next.length <= max) { parts.push(t); text = next; }
    }
    if (text.length >= min && text.length <= max && need.every((m) => hasMark(text, m))) return text;
  }
  return null;
}

// Токени для знаків: кожен містить свій знак (№ 7, 25%, 6 * 7, #4, $12, 3 @ $4, 15 + 27 = 42)
function symbolToken(rng, key, digs, known, layout) {
  const n = () => { let s; do s = number(rng, digs, 1 + rnd(rng, 2)); while (/^0+$/.test(s)); return s; }; // не «0» і не «00»
  switch (key) {
    case '№': return `№ ${n()}`;
    case '%': return `${n()}%`;
    case '#': return `#${n()}`;
    case '$': return `$${n()}`;
    case '@': return `${pick(rng, digs.filter((d) => d !== '0'))} @ $${n()}`;
    case '&': return pick(rng, PAIRS[layout]);
    case '*': return sum(rng, digs, ['*'], known.has('='));
    case '+': return sum(rng, digs, known.has('-') ? ['+', '-'] : ['+'], known.has('='));
    case '=': return sum(rng, digs, ['+', '-', ...(known.has('*') ? ['*'] : [])], true);
    default: return null;
  }
}

const symbolsOf = (t) => SYMBOLS.filter((s) => t.includes(s));

/**
 * Урок цифр і символів. Повертає { id, layout, kind, newKeys, steps, quick }, як і інші генератори.
 * digits: числа з вивчених цифр, одиниці, речення; numbers: дати й час, речення; symbols: токени + речення з новими знаками;
 * nmixed: усе разом (кілька різних знаків у кожній вправі).
 */
export function buildNumbersLesson({ layout, id, rng = Math.random }) {
  const lesson = getTeenLesson(layout, id);
  const known = learnedKeys(layout, id);
  const bank = TEEN_NUMBERS[layout];
  const digs = [...known].filter(isDigitKey);
  const newKeys = lesson.letters;
  const newDigits = newKeys.filter(isDigitKey);
  const sentences = bank.all.filter((e) => usable(e.t, known));
  const syms = SYMBOLS.filter((s) => known.has(s));
  const used = new Set();
  const units = UNITS[layout];

  let texts;
  if (lesson.kind === 'digits') {
    const must = newDigits.map((d) => numberWith(rng, digs, d, 3));
    texts = [
      tokensText(rng, () => number(rng, digs, 2 + rnd(rng, 3)), NUMBER_RANGES[0], { must }),
      tokensText(rng, () => `${number(rng, digs, 1 + rnd(rng, 3))} ${pick(rng, units)}`, NUMBER_RANGES[1], { sep: ', ', end: '.' }),
      compose(rng, sentences, NUMBER_RANGES[2], [], 0, used),
    ];
  } else if (lesson.kind === 'numbers') {
    const date = () => `${pad(1 + rnd(rng, 28))}.${pad(1 + rnd(rng, 12))}.${2024 + rnd(rng, 12)}`;
    const time = () => `${pad(rnd(rng, 24))}:${pad(5 * rnd(rng, 12))}`;
    texts = [
      tokensText(rng, () => (rng() < 0.55 ? date() : time()), NUMBER_RANGES[0], { sep: ', ', end: '.' }),
      compose(rng, sentences, NUMBER_RANGES[1], [], 0, used),
      compose(rng, sentences, NUMBER_RANGES[2], [], 0, used),
    ];
  } else if (lesson.kind === 'symbols') {
    // перша вправа — токени з кожним новим знаком; друга й третя — речення, де знаки по черзі
    const must = newKeys.map((k) => symbolToken(rng, k, digs, known, layout)).filter(Boolean);
    const half = Math.ceil(newKeys.length / 2);
    const pool = sentences.filter((e) => newKeys.some((k) => hasMark(e.t, k)));
    const sentPool = pool.length ? pool : sentences;
    const need2 = newKeys.length > 2 ? newKeys.slice(0, half === 1 ? 1 : 2) : [newKeys[0]];
    const need3 = newKeys.length > 2 ? newKeys.slice(-2) : newKeys;
    texts = [
      tokensText(rng, () => symbolToken(rng, pick(rng, newKeys), digs, known, layout), MIXED_RANGES[0], { sep: ', ', must: dedupe(must) }),
      compose(rng, sentPool, NUMBER_RANGES[1], need2, 0, used),
      compose(rng, sentPool, NUMBER_RANGES[2], need3, 0, used),
    ];
  } else {
    // nmixed: у кожній вправі кілька різних символів і цифр
    const symSentences = sentences.filter((e) => symbolsOf(e.t).length);
    const distinct = (min) => {
      for (let t = 0; t < 80; t++) {
        const text = compose(rng, symSentences, MIXED_RANGES[min === 2 ? 1 : 2], [], 0, new Set(used));
        if (text && new Set(symbolsOf(text)).size >= min) { symSentences.forEach((e) => text.includes(e.t) && used.add(e.t)); return text; }
      }
      return null;
    };
    const mixTok = () => (rng() < 0.3 ? number(rng, digs, 2 + rnd(rng, 2)) : symbolToken(rng, pick(rng, syms), digs, known, layout));
    const first = tokensText(rng, mixTok, MIXED_RANGES[0], { sep: ', ' });
    const s2 = distinct(2);
    const s3 = distinct(3);
    texts = [first, s2, s3];
  }

  // запасний варіант, якщо склеїти не вдалося (тести стежать, щоб цього не траплялось)
  texts = texts.map((t, i) => t || tokensText(rng, () => number(rng, digs, 3), NUMBER_RANGES[i]) || fallback(sentences, newKeys.slice(0, 1)));
  const intro = newKeys.length
    ? [{ kind: 'intro', keys: newKeys, ...(newDigits.length ? { digits: true } : { marks: true, moved: !!lesson.moved }) }]
    : [];
  return {
    id, layout, kind: lesson.kind, newKeys, quick: false,
    steps: [...intro, ...texts.map((text, i) => ({ kind: 'drill', text, hint: i < 2 }))],
  };
}
const dedupe = (a) => [...new Set(a)];
