// Прогрес швидкого курсу: стани уроків, зірочки, карта світів. Чиста логіка (без DOM), однакова для всіх світів.
import { TEEN_COURSE, WORLD_GROUPS, lastLetterLesson, isPunctKey } from './course.js';

export const PASS_ACC = 90; // нижче — «Ще раз», без покарання
export const QUICK_ACC = 93; // швидка перевірка: з першої спроби не нижче — зараховано
export const QUICK_UP_TO = 6; // розміщення «Середній»: швидка перевірка для уроків 1–6
export const STAR_LIMITS = { 5: { three: 96, two: 90 }, 6: { three: 97, two: 92 } };

// Зірочки за урок (typing-pedagogy, 5–6 класи): < 90% — урок не зараховується (0), далі за класом; щонайменше одна
export function teenStars(grade, accuracy) {
  if (!(accuracy >= PASS_ACC)) return 0;
  const lim = STAR_LIMITS[grade] ?? STAR_LIMITS[5];
  return accuracy >= lim.three ? 3 : accuracy >= lim.two ? 2 : 1;
}

// Уроки, які розміщення (тест / перехід із 3–4) уже зараховує
export function creditedIds(layout, placement) {
  const list = TEEN_COURSE[layout];
  const out = new Set();
  if (!placement) return out;
  if (placement.kind === 'pro') {
    const top = lastLetterLesson(layout);
    list.forEach((l) => { if (l.kind !== 'shift' && l.id <= top) out.add(l.id); });
  } else if (placement.kind === 'carry') {
    const learned = new Set(placement.learned?.[layout] ?? []);
    list.forEach((l) => {
      if (l.kind === 'letters' && l.letters.filter((c) => !isPunctKey(c)).every((c) => learned.has(c))) out.add(l.id);
    });
    const top = lastLetterLesson(layout);
    const review = list.find((l) => l.kind === 'review');
    if (review && list.filter((l) => l.kind === 'letters' && l.id < review.id).every((l) => out.has(l.id)) && review.id <= top) out.add(review.id);
  }
  return out;
}

/**
 * Стани уроків: done (пройдено, є зірочки), credited (зараховано розміщенням), current (наступний), locked.
 * quick — для поточного уроку при розміщенні «Середній»: спершу швидка перевірка.
 */
export function lessonStates(layout, { teen = {}, placement = null } = {}) {
  const done = teen[layout] ?? {};
  const credit = creditedIds(layout, placement);
  let found = false;
  return TEEN_COURSE[layout].map((l) => {
    const rec = done[l.id];
    let state = 'locked';
    if (rec) state = 'done';
    else if (credit.has(l.id)) state = 'credited';
    else if (!found) { state = 'current'; found = true; }
    const quick = state === 'current' && placement?.kind === 'mid' && l.id <= QUICK_UP_TO && l.kind !== 'shift';
    return { ...l, state, stars: rec?.stars ?? 0, acc: rec?.acc ?? null, cpm: rec?.cpm ?? null, quick };
  });
}
export const currentLesson = (states) => states.find((l) => l.state === 'current') ?? null;
export const playable = (l) => l.state !== 'locked';

// Шість світів карти: перші три — групи уроків швидкого курсу, решта чекають наступних етапів
const WORLD_NAMES = [
  ['Зелена долина', 'Основний ряд'], ['Кам’яні гори', 'Верхній ряд'], ['Піщаний берег', 'Нижній ряд'],
  ['Цифровий ліс', 'Цифри й символи'], ['Місто знаків', 'Розділові знаки'], ['Вершина швидкості', 'Випробування на час'],
];
export function worldsFromLessons(layout, states) {
  const groups = WORLD_GROUPS[layout];
  let nowSet = false;
  return WORLD_NAMES.map(([name, sub], i) => {
    const ids = groups[i];
    if (!ids) return { name, sub, state: 'locked', pct: 0 };
    const mine = states.filter((l) => ids.includes(l.id));
    const finished = mine.filter((l) => l.state === 'done' || l.state === 'credited').length;
    const pct = Math.round((finished / mine.length) * 100);
    if (finished === mine.length) return { name, sub, state: 'done', pct: 100 };
    if (!nowSet) { nowSet = true; return { name, sub, state: 'now', pct }; }
    return { name, sub, state: 'locked', pct };
  });
}

// Очищення запису прогресу курсу з профілю (зіпсовані записи відкидаються)
export function cleanTeenProgress(t) {
  const out = { ua: {}, en: {} };
  for (const layout of ['ua', 'en']) {
    const ids = new Set(TEEN_COURSE[layout].map((l) => l.id));
    for (const [id, r] of Object.entries(t?.[layout] ?? {})) {
      const n = Number(id);
      if (!ids.has(n) || !r || ![1, 2, 3].includes(r.stars)) continue;
      out[layout][n] = {
        stars: r.stars,
        acc: Number.isFinite(r.acc) ? Math.round(r.acc) : null,
        cpm: Number.isFinite(r.cpm) ? Math.round(r.cpm) : null,
        by: ['lesson', 'quick'].includes(r.by) ? r.by : 'lesson',
      };
    }
  }
  return out;
}
