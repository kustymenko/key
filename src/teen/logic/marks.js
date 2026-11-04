// Уроки знаків (Етап Т4): кома, ? !, : ;, дужки, лапки, дефіс, апостроф, Ґ, усі знаки разом, абзаци.
// Той самий принцип: у вправі лише вивчені клавіші. Тексти — з власних банків 5–6 класів (src/content/teen).
import { TEEN_TEXTS } from '../../content/teen/index.js';
import { MARK_CHARS } from '../../content/teen/util.js';
import { normChar, PARAGRAPH } from '../../keyboard/chars.js';
import { getTeenLesson, learnedKeys } from './course.js';

// Довжини вправ знаків: фраза, речення, два речення. Абзаци — за класом (нижче).
export const MARK_RANGES = [[40, 70], [80, 120], [130, 180]];
export const PARAGRAPH_RANGES = { 5: [250, 450], 6: [450, 700] };

const rnd = (rng, n) => Math.floor(rng() * n);
function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(rng, i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Усі символи тексту вивчені? (апостроф у трьох виглядах — один символ; великі літери — після уроку про Shift)
export const usable = (text, known) => [...text].every((c) => c === ' ' || known.has(normChar(c).toLowerCase()));
export const hasMark = (text, m) => text.toLowerCase().includes(normChar(m));
// Скільки різних знаків (крім крапки) у тексті
export const distinctMarks = (text) => MARK_CHARS.filter((m) => m !== '.' && hasMark(text, m)).length;

// Склеює записи до довжини [min, max]; need — знаки, що обов'язково мають бути; minDistinct — скільки різних знаків
// avoid — записи, які вже були в цьому уроці (не повторюємо їх у наступних вправах); успішно використані додаються до avoid
function compose(rng, pool, [min, max], need = [], minDistinct = 0, avoid = new Set()) {
  const fresh = pool.filter((e) => e.t.length <= max && !avoid.has(e.t));
  const items = fresh.length ? fresh : pool.filter((e) => e.t.length <= max);
  if (!items.length) return null;
  for (let attempt = 0; attempt < 800; attempt++) {
    const order = shuffle(rng, items);
    const parts = [];
    for (const m of need) {
      if (parts.some((t) => hasMark(t, m))) continue;
      const cand = order.filter((e) => hasMark(e.t, m));
      if (cand.length) parts.push(cand[attempt % cand.length].t);
    }
    let text = parts.join(' ');
    for (let i = 0; text.length < min && i < 40; i++) {
      const it = order[(i + attempt) % order.length].t;
      if (parts.includes(it)) continue;
      const next = text ? `${text} ${it}` : it;
      if (next.length <= max) { text = next; parts.push(it); }
    }
    if (text.length >= min && text.length <= max && need.every((m) => hasMark(text, m)) && distinctMarks(text) >= minDistinct) {
      parts.forEach((t) => avoid.add(t));
      return text;
    }
  }
  return null;
}

// Запасний варіант, якщо склеїти не вдалося: найкоротший запис із потрібним знаком (тести стежать, щоб цього не траплялось)
const fallback = (pool, need) => (pool.filter((e) => need.every((m) => hasMark(e.t, m))).sort((a, b) => a.t.length - b.t.length)[0]?.t ?? pool[0]?.t ?? '');

// Абзаци для класу, які можна надрукувати вивченими клавішами
export function paragraphPool(layout, known, grade) {
  const [min, max] = PARAGRAPH_RANGES[grade] ?? PARAGRAPH_RANGES[5];
  return TEEN_TEXTS[layout].paragraphs.filter((p) => p.g === String(grade) && p.t.length >= min && p.t.length <= max && usable(p.t, known));
}

/**
 * Урок знаків. Повертає { id, layout, kind, newKeys, steps, quick }.
 * punct: знайомство + фраза з новим знаком, 1–2 речення, 2 речення (остання без підказки);
 * mixed: те саме, але щоразу кілька різних знаків; paragraph: знайомство з Enter + абзац + два абзаци з Enter між ними (без підказки).
 */
export function buildMarksLesson({ layout, id, rng = Math.random, grade = '5' }) {
  const lesson = getTeenLesson(layout, id);
  const known = learnedKeys(layout, id);
  const T = TEEN_TEXTS[layout];
  const ok = (list) => list.filter((e) => usable(e.t, known));
  const newKeys = lesson.letters;
  const intro = newKeys.length ? [{ kind: 'intro', keys: newKeys, marks: true, moved: !!lesson.moved }] : [];

  if (lesson.kind === 'paragraph') {
    const paras = paragraphPool(layout, known, grade);
    const sorted = [...paras].sort((a, b) => a.t.length - b.t.length);
    const first = paras[rnd(rng, paras.length)];
    const short = shuffle(rng, sorted.slice(0, Math.ceil(sorted.length / 2)).filter((p) => p !== first));
    const second = [short[0].t, short[1].t].join(PARAGRAPH);
    return {
      id, layout, kind: lesson.kind, newKeys, quick: false,
      steps: [...intro, { kind: 'drill', text: first.t, hint: true }, { kind: 'drill', text: second, hint: false }],
    };
  }

  const phrases = ok(T.phrases);
  const sentences = ok(T.sentences);
  const aposS = ok(T.aposSentences);
  const guS = ok(T.guSentences);
  const [r1, r2, r3] = MARK_RANGES;
  // перша вправа — короткі фрази й речення; далі лише речення (щоб вправи читались як звичайний текст)
  let first = [...phrases, ...sentences];
  let long = [...sentences, ...aposS, ...guS];
  let need = [[], [], []];
  if (lesson.kind === 'punct') {
    const [a, b = a] = newKeys;
    need = [[a], [b], newKeys];
    // апостроф і Ґ в українській мають власні банки слів і речень; в англійській апостроф — у загальних реченнях
    if (newKeys[0] === "'" && T.aposWords.length) { first = ok(T.aposWords); long = aposS; }
    if (newKeys[0] === 'ґ') { first = ok(T.guWords); long = guS; }
  }
  const minDistinct = lesson.kind === 'mixed' ? [2, 3, 4] : [0, 0, 0];
  const ranges = [r1, r2, r3];
  const pools = [first, long, long];
  const used = new Set();
  const texts = ranges.map((r, i) => compose(rng, pools[i], r, need[i], minDistinct[i], used)
    ?? compose(rng, pools[i], r, need[i], 0, used) ?? fallback([...first, ...long], need[i]));
  return {
    id, layout, kind: lesson.kind, newKeys, quick: false,
    steps: [...intro, ...texts.map((text, i) => ({ kind: 'drill', text, hint: i < 2 }))],
  };
}
