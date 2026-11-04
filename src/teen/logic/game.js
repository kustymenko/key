// Ігрова оболонка 5–6 класів (Етап Т6): досвід, квести дня, нагороди, предмети героя. Одна логіка для всіх трьох світів:
// без малювання й без DOM. Світ лише показує те, що тут пораховано.
// Головне правило: нічого не віднімається і нічого не «згорає». Помилка лише зменшує приріст досвіду, але ніколи не робить його нулем чи мінусом.
import { levelInfo, DEFAULT_HERO } from './profile.js';
import { lessonStates, worldsFromLessons } from './progress.js';

// ---------- Досвід ----------
// 1 правильний знак = 1 досвід, помножений на коефіцієнт точності. Швидко й неточно друкувати невигідно, але нічого не віднімається.
export function accCoef(acc) {
  const a = Number.isFinite(acc) ? acc : 0;
  return a >= 98 ? 1 : a >= 95 ? 0.9 : a >= 90 ? 0.75 : a >= 80 ? 0.5 : 0.25;
}
export const xpForRun = (typed, acc) => (Number.isFinite(typed) && typed > 0 ? Math.max(1, Math.round(typed * accCoef(acc))) : 0);
export const MIN_RUN_CHARS = 40; // коротші вправи не рахуємо для рекордів точності й швидкості

// ---------- Квести дня ----------
// kind: words — слів без помилок; chars — знаків; steps — вправ; lessons — уроків; acc — точність уроку (найкраща за день)
const Q = (id, kind, goal, t, xp) => ({ id, kind, goal, t, xp });
export const QUEST_SLOTS = [
  [Q('words3', 'words', 3, 'Надрукуй 3 слова без помилок', 30), Q('words8', 'words', 8, 'Надрукуй 8 слів без помилок', 40), Q('chars200', 'chars', 200, 'Надрукуй 200 знаків', 30), Q('chars400', 'chars', 400, 'Надрукуй 400 знаків', 50)],
  [Q('acc95', 'acc', 95, 'Досягни точності 95%', 50), Q('acc92', 'acc', 92, 'Досягни точності 92%', 40), Q('lesson1', 'lessons', 1, 'Пройди один урок до кінця', 40)],
  [Q('steps2', 'steps', 2, 'Пройди 2 вправи сьогодні', 40), Q('steps4', 'steps', 4, 'Пройди 4 вправи сьогодні', 60), Q('steps3', 'steps', 3, 'Пройди 3 вправи сьогодні', 50)],
];
export const QUEST_BY_ID = Object.fromEntries(QUEST_SLOTS.flat().map((q) => [q.id, q]));

// Дата за місцевим часом ноутбука (без мережі)
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

// Три квести на день: по одному з кожної групи; той самий учень у той самий день завжди бачить ті самі
export function pickQuests(profileId, day) {
  return QUEST_SLOTS.map((slot, i) => slot[hash(`${profileId}|${day}|${i}`) % slot.length]);
}

// ---------- Стан гри в профілі ----------
const num = (v) => (Number.isFinite(v) && v >= 0 ? v : 0);
export const emptyGame = () => ({ day: '', quests: [], questsTotal: 0, bestAcc: 0, bestCpm: 0, clean: false, perfectDay: false });

// Приводить запис з сховища до безпечного вигляду (зіпсований запис не ламає екран)
export function cleanGame(g) {
  const out = emptyGame();
  if (!g || typeof g !== 'object') return out;
  out.questsTotal = Math.floor(num(g.questsTotal));
  out.bestAcc = Math.min(100, Math.round(num(g.bestAcc)));
  out.bestCpm = Math.min(999, Math.round(num(g.bestCpm)));
  out.clean = !!g.clean;
  out.perfectDay = !!g.perfectDay;
  const qs = Array.isArray(g.quests) ? g.quests.filter((q) => q && QUEST_BY_ID[q.id]) : [];
  if (/^\d{4}-\d{2}-\d{2}$/.test(g.day) && qs.length === 3) {
    out.day = g.day;
    out.quests = qs.map((q) => ({ id: q.id, prog: Math.min(QUEST_BY_ID[q.id].goal, Math.round(num(q.prog))), done: !!q.done }));
  }
  return out;
}

// Квести на сьогодні для показу (нічого не зберігає)
export function dayQuests(game, profileId, today = dayKey()) {
  if (game?.day === today && game.quests?.length === 3) return game.quests;
  return pickQuests(profileId, today).map((q) => ({ id: q.id, prog: 0, done: false }));
}
export function questView(q) {
  const d = QUEST_BY_ID[q.id];
  const now = q.done ? `${d.goal} з ${d.goal}` : q.prog > 0 ? `${q.prog} з ${d.goal}` : d.kind === 'acc' ? '—' : `0 з ${d.goal}`;
  return { id: d.id, t: d.t, xp: d.xp, goal: d.goal, done: q.done, now };
}
export const questsView = (profile, today = dayKey()) => dayQuests(profile.game, profile.id, today).map(questView);

// ---------- Нагороди (колекція). Усе рахується з профілю: ніяких окремих «прапорців», які можна підробити ----------
const recs = (p, layout) => Object.keys(p.teen?.[layout] ?? {}).length;
const worldDone = (p, i) => ['ua', 'en'].some((layout) => worldsFromLessons(layout, lessonStates(layout, p))[i]?.state === 'done');
// gift — предмет героя, який дає нагорода (див. HERO_LOCKS)
export const REWARDS = [
  { id: 'first', name: 'Перший урок', hint: 'Пройди будь-який урок', test: (p) => recs(p, 'ua') + recs(p, 'en') > 0 },
  { id: 'clean', name: 'Без помилок', hint: 'Урок без жодної помилки', gift: 'Навушники', test: (p) => p.game.clean },
  { id: 'main', name: 'Основний ряд', hint: 'Пройди «Зелену долину»', gift: 'Одяг: бірюзовий', test: (p) => worldDone(p, 0) },
  { id: 'langs', name: 'Дві мови', hint: 'Уроки і українською, і ENG', test: (p) => recs(p, 'ua') > 0 && recs(p, 'en') > 0 },
  { id: 'upper', name: 'Верхній ряд', hint: 'Пройди «Кам’яні гори»', gift: 'Одяг: рожевий', test: (p) => worldDone(p, 1) },
  { id: 'lower', name: 'Нижній ряд', hint: 'Пройди «Піщаний берег»', gift: 'Одяг: графітовий', test: (p) => worldDone(p, 2) },
  { id: 'marks', name: 'Знаки', hint: 'Пройди «Місто знаків»', test: (p) => worldDone(p, 3) },
  { id: 'digits', name: 'Цифри', hint: 'Пройди «Цифровий ліс»', test: (p) => worldDone(p, 4) },
  { id: 'acc98', name: 'Точність 98%', hint: 'Урок із точністю 98%', test: (p) => p.game.bestAcc >= 98 },
  { id: 'cpm100', name: '100 знаків за хвилину', hint: 'Урок зі швидкістю 100', test: (p) => p.game.bestCpm >= 100 },
  { id: 'daily', name: 'Усі завдання дня', hint: 'Виконай три завдання за день', test: (p) => p.game.perfectDay },
  { id: 'master', name: 'Майстер друку', hint: 'Досягни 10 рівня', test: (p) => levelInfo(p.xp).level >= 10 },
];
export const rewardsOf = (p) => REWARDS.map(({ test, ...r }) => ({ ...r, got: !!test(p) }));
export const rewardIds = (p) => REWARDS.filter((r) => r.test(p)).map((r) => r.id);

// ---------- Предмети героя: нові відкриваються нагородами й рівнями ----------
// Перші варіанти кожного ряду (HERO_OPTIONS у profile.js) відкриті одразу; тут — лише закриті.
export const HERO_LOCKS = [
  { key: 'outfit', idx: 5, by: { reward: 'main' } },
  { key: 'outfit', idx: 6, by: { reward: 'upper' } },
  { key: 'outfit', idx: 7, by: { reward: 'lower' } },
  { key: 'hat', idx: 4, by: { reward: 'clean' } },
  { key: 'hat', idx: 5, by: { level: 3 } },
];
const lockHint = (by) => (by.reward ? `Нагорода: ${REWARDS.find((r) => r.id === by.reward).name}` : `Досягни ${by.level} рівня`);
const lockOpen = (p, by) => (by.reward ? REWARDS.find((r) => r.id === by.reward).test(p) : levelInfo(p.xp).level >= by.level);

// '' — предмет відкритий; інакше підказка, як його отримати (до 6 слів)
export function heroLock(p, key, idx) {
  const lock = HERO_LOCKS.find((l) => l.key === key && l.idx === idx);
  return !lock || lockOpen(p, lock.by) ? '' : lockHint(lock.by);
}
// Усі закриті предмети: { 'hat:4': 'Нагорода: Без помилок', … }
export function heroLocks(p) {
  const out = {};
  for (const l of HERO_LOCKS) { const h = heroLock(p, l.key, l.idx); if (h) out[`${l.key}:${l.idx}`] = h; }
  return out;
}
export const unlockedItems = (p) => HERO_LOCKS.filter((l) => lockOpen(p, l.by)).map((l) => `${l.key}:${l.idx}`);
// Вигляд героя без закритих предметів (щоб не обійти замки)
export function allowedHero(p, hero) {
  const out = { ...hero };
  for (const l of HERO_LOCKS) if (out[l.key] === l.idx && !lockOpen(p, l.by)) out[l.key] = p.hero?.[l.key] !== l.idx && p.hero?.[l.key] !== undefined ? p.hero[l.key] : DEFAULT_HERO[l.key];
  return out;
}

// ---------- Підсумок вправи ----------
// Лишає в профілі квести, найкращі результати й досвід. Повертає, що нового побачить учень.
export function snapshot(p) {
  return { level: levelInfo(p.xp).level, rewards: rewardIds(p), items: unlockedItems(p) };
}
// before — снимок профілю ДО зарахування уроку (щоб нагорода за сам урок теж стала «новою»)
export function applyRun(p, run, today = dayKey(), before = snapshot(p)) {
  const g = p.game;
  if (g.day !== today || g.quests.length !== 3) { g.day = today; g.quests = dayQuests(null, p.id, today); }
  const typed = Math.max(0, run.typed | 0);
  const gain = xpForRun(typed, run.acc);
  const sample = typed >= MIN_RUN_CHARS;
  if (sample) { g.bestAcc = Math.max(g.bestAcc, Math.min(100, Math.round(run.acc))); g.bestCpm = Math.max(g.bestCpm, Math.min(999, Math.round(run.cpm || 0))); }
  if (sample && run.pass && run.errors === 0) g.clean = true;
  const done = [];
  for (const q of g.quests) {
    if (q.done) continue;
    const d = QUEST_BY_ID[q.id];
    if (d.kind === 'words') q.prog += run.words | 0;
    else if (d.kind === 'chars') q.prog += typed;
    else if (d.kind === 'steps') q.prog += run.steps | 0;
    else if (d.kind === 'lessons') q.prog += run.pass ? 1 : 0;
    else if (d.kind === 'acc' && sample) q.prog = Math.max(q.prog, Math.round(run.acc));
    q.prog = Math.min(d.goal, q.prog);
    if (q.prog >= d.goal) { q.done = true; done.push(questView(q)); }
  }
  g.questsTotal += done.length;
  if (g.quests.every((q) => q.done)) g.perfectDay = true;
  const bonus = done.reduce((s, q) => s + q.xp, 0);
  p.xp = num(p.xp) + gain + bonus;
  const after = snapshot(p);
  return {
    gain, bonus, quests: done, xpTotal: p.xp,
    levelUp: after.level > before.level ? after.level : 0,
    rewards: REWARDS.filter((r) => after.rewards.includes(r.id) && !before.rewards.includes(r.id)).map(({ id, name, gift }) => ({ id, name, gift })),
  };
}

// Зірочки й монети: монети — це зібране (зірочки уроків + виконані завдання), їх не витрачають і вони не зменшуються
export function coinsOf(p) {
  let stars = 0;
  for (const layout of ['ua', 'en']) for (const r of Object.values(p.teen?.[layout] ?? {})) stars += r.stars ?? 0;
  return stars + (p.game?.questsTotal ?? 0);
}
