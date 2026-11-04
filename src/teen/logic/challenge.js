// Випробування на час (Етап Т7): 2 хвилини, цілі швидкості окремо для 5 і 6 класу. Одна логіка для всіх трьох світів: без DOM і малювання.
// Головне правило: точність важливіша за швидкість. Медаль — лише коли виконано ОБИДВІ умови (швидкість і точність).
// Нічого не віднімається: слабкий результат просто не дає медалі, а рекорди ніколи не зменшуються.
import { TEEN_TEXTS } from '../../content/teen/index.js';
import { lessonStates } from './progress.js';

export const CHALLENGE_MS = 120000; // 2 хвилини
export const MIN_CHARS = 40; // коротший результат не рахуємо (замало даних)
export const RECORD_ACC = 92; // швидкість у рекорд іде лише при точності не нижче бронзової (швидко й неточно — не рекорд)
export const TEXT_CHARS = 1100; // з запасом: понад 500 знаків за хвилину неможливо

export const MEDALS = ['bronze', 'silver', 'gold'];
export const MEDAL_NAME = { bronze: 'Бронза', silver: 'Срібло', gold: 'Золото' };
// Родовий відмінок для фраз «Для бронзи потрібна…»
const MEDAL_FOR = { bronze: 'бронзи', silver: 'срібла', gold: 'золота' };

// Стартові цілі (чисті знаки за хвилину ТА точність). Після пілоту з класами їх варто уточнити (див. ROADMAP).
export const GOALS = {
  5: { bronze: { cpm: 70, acc: 92 }, silver: { cpm: 100, acc: 95 }, gold: { cpm: 130, acc: 97 } },
  6: { bronze: { cpm: 100, acc: 92 }, silver: { cpm: 140, acc: 95 }, gold: { cpm: 180, acc: 97 } },
};
export const gradeOf = (g) => (String(g) === '6' ? '6' : '5');
// [{ id, level (1–3), name, cpm, acc }]
export const goalsOf = (grade) => MEDALS.map((id, i) => ({ id, level: i + 1, name: MEDAL_NAME[id], ...GOALS[gradeOf(grade)][id] }));

// Рівень медалі за результатом: 0 — без медалі, 1–3 — бронза/срібло/золото. Потрібні ОБИДВІ умови.
export function medalFor(grade, cpm, acc) {
  let level = 0;
  for (const g of goalsOf(grade)) if (cpm >= g.cpm && acc >= g.acc) level = g.level;
  return level;
}

// Підказка до наступної медалі. Точність названа першою: швидкість без точності не рахується.
export function goalHint(grade, cpm, acc, level = 0) {
  const g = goalsOf(grade)[level];
  if (!g) return 'Золото вже є. Тепер — рекорд для себе.';
  const forName = MEDAL_FOR[g.id];
  if (acc < g.acc && cpm >= g.cpm) return `Для ${forName} потрібна точність ${g.acc}%. Швидкості вистачає: друкуй чисто.`;
  if (acc < g.acc) return `Для ${forName} потрібна точність ${g.acc}% і ${g.cpm} знаків за хвилину. Спершу точність.`;
  return `До ${forName} ще ${Math.max(1, g.cpm - cpm)} знаків за хвилину.`;
}

// ---------- Стан у профілі ----------
const num = (v) => (Number.isFinite(v) && v >= 0 ? v : 0);
const emptyRec = () => ({ runs: 0, medal: 0, bestCpm: 0, bestAcc: 0 });
export const emptyChallenge = () => ({ open: false, rec: { ua: emptyRec(), en: emptyRec() }, seen: [] });

// Приводить запис зі сховища до безпечного вигляду (зіпсований запис не ламає екран)
export function cleanChallenge(c) {
  const out = emptyChallenge();
  if (!c || typeof c !== 'object') return out;
  out.open = !!c.open;
  for (const layout of ['ua', 'en']) {
    const r = c.rec?.[layout];
    if (!r || typeof r !== 'object') continue;
    out.rec[layout] = {
      runs: Math.floor(num(r.runs)),
      medal: [0, 1, 2, 3].includes(r.medal) ? r.medal : 0,
      bestCpm: Math.min(999, Math.round(num(r.bestCpm))),
      bestAcc: Math.min(100, Math.round(num(r.bestAcc))),
    };
  }
  out.seen = Array.isArray(c.seen) ? c.seen.filter((x) => Number.isInteger(x) && x >= 0).slice(-200) : [];
  return out;
}
export const medalsCount = (c) => ['ua', 'en'].reduce((s, l) => s + (c?.rec?.[l]?.medal ?? 0), 0);

// Випробування відкрите, коли пройдено весь курс мови (як «Вершина швидкості» на карті) або дорослий відкрив його вручну
export function challengeOpen(profile, layout) {
  if (profile?.challenge?.open) return true;
  return lessonStates(layout, profile).every((l) => l.state === 'done' || l.state === 'credited');
}

/**
 * Записує результат у рекорди (змінює ch). Нічого не зменшується.
 * Повертає, що нового побачить учень: { medal (рівень цієї спроби), newMedal, newCpm, newAcc, first, short }.
 */
export function applyChallenge(ch, layout, grade, { cpm, acc, typed }) {
  const rec = ch.rec[layout];
  const out = { medal: 0, newMedal: false, newCpm: false, newAcc: false, first: rec.runs === 0, short: typed < MIN_CHARS };
  if (out.short) return out; // замало знаків: нічого не рахуємо і нічого не віднімаємо
  const level = medalFor(grade, cpm, acc);
  out.medal = level;
  out.newMedal = level > rec.medal;
  if (acc >= RECORD_ACC && cpm > rec.bestCpm) { out.newCpm = !out.first; rec.bestCpm = Math.min(999, Math.round(cpm)); }
  if (acc > rec.bestAcc) { out.newAcc = !out.first; rec.bestAcc = Math.min(100, Math.round(acc)); }
  rec.medal = Math.max(rec.medal, level);
  rec.runs += 1;
  return out;
}

// ---------- Фрази про зусилля й точність (до 10 слів, без вигуків) ----------
const EFFORT = [
  'Дві хвилини спокійного друку. Це добра робота.',
  'Точність росте від повторень.',
  'Спокійний ритм дає більше за поспіх.',
  'Кожна спроба тренує пальці.',
  'Не поспішай: швидкість прийде сама.',
];
// Короткі фрази для екрана результату (одна про рекорд і одна про наступну ціль)
export function resultLines(grade, { cpm, acc }, out, rec) {
  if (out.short) return ['Замало знаків для результату. Спробуй ще раз.'];
  const news = [];
  if (out.newAcc) news.push(`Рекорд точності: ${acc}%`);
  if (out.newCpm) news.push(`Новий особистий рекорд: ${cpm} знаків за хвилину`);
  if (out.first && !out.medal) news.push('Перший результат записано. Це твоя точка відліку.');
  // далі: ціль до наступної медалі (rec.medal — найвища медаль учня, уже з цією спробою) або фраза про зусилля
  const next = rec.medal < 3 ? goalHint(grade, cpm, acc, rec.medal) : EFFORT[rec.runs % EFFORT.length];
  return [...news.slice(0, 1), next]; // медаль названа в заголовку екрана, тут — рекорд і наступна ціль
}

// ---------- Текст випробування ----------
// Лише літери, пробіл і прості знаки , . ? ! : ; - (без апострофа, Ґ, цифр і символів: вони залежать від розкладки ноутбука)
const PLAIN = /^[^\d'’ʼґҐ"()№%*+=#$&@\n]+$/;
const textId = (e, list) => list.indexOf(e);
function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function challengePool(layout) {
  return TEEN_TEXTS[layout].sentences.filter((e) => PLAIN.test(e.t) && e.t.length >= 25 && e.t.length <= 140);
}

/**
 * Текст випробування: речення, яких учень ще не бачив у випробуваннях (seen — номери речень у банку).
 * Коли нових не вистачає, береться найдавніше бачене. Повертає { text, ids } — ids потім додаються в seen.
 */
export function buildChallengeText(layout, seen = [], rng = Math.random, chars = TEXT_CHARS) {
  const all = TEEN_TEXTS[layout].sentences;
  const pool = challengePool(layout);
  const seenSet = new Set(seen);
  const fresh = shuffle(rng, pool.filter((e) => !seenSet.has(textId(e, all))));
  const old = [...seen].filter((id) => pool.includes(all[id])).map((id) => all[id]); // від найдавнішого до найновішого
  const order = [...fresh, ...old];
  const ids = [];
  let text = '';
  for (let i = 0; text.length < chars; i++) {
    const e = order[i % order.length];
    text = text ? `${text} ${e.t}` : e.t;
    ids.push(textId(e, all));
  }
  return { text, ids };
}
