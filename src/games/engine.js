// Логіка мініігор «Кульки» і «Падаючі літери» (без малювання — щоб її можна було перевіряти тестами).
// Правила: тільки вивчені літери; «програшу» немає — кулька чи літера, що зникла, просто зникає без штрафу;
// швидкість підлаштовується: ловить усе — трохи швидше, пропускає — повільніше.
import { learnedLetters } from '../lessons/generator.js';

export const GAMES = {
  balloons: { id: 'balloons', title: 'Кульки', unlockLesson: 3, hint: 'після 3 уроку' },
  falling: { id: 'falling', title: 'Падаючі літери', unlockLesson: 6, hint: 'після 6 уроку' },
};
export const GAME_IDS = Object.keys(GAMES);

export const FIELD_H = 380; // висота ігрового поля (px сцени)
export const ITEM_SIZE = 112; // висота кульки / плитки з літерою
export const LANES = 9; // скільки «доріжок» зліва направо

// Параметри за рівнем. speed — стартова швидкість, px/с (для 1–2 класу вдвічі менша),
// every — як часто з'являється нове, с; max — скільки одночасно; cap — стеля «пришвидшення».
const BASE = {
  balloons: { '1-2': { speed: 30, every: 3.4, max: 3, cap: 1.7, total: 12 }, '3-4': { speed: 60, every: 2.2, max: 5, cap: 2.2, total: 20 } },
  falling: { '1-2': { speed: 35, every: 2.8, max: 3, cap: 1.7 }, '3-4': { speed: 70, every: 1.6, max: 5, cap: 2.2 } },
};
export const FALLING_SECONDS = 60; // «Падаючі літери»: рівно хвилина
const MIN_F = 0.5; // найповільніше — половина стартової швидкості

// ---------- відкриття ігор і літери ----------
// Гра відкривається, коли пройдено потрібний урок (є зірочки). openAll — режим перевірки.
export function isUnlocked(kind, layout, progress, openAll = false) {
  return openAll || !!progress?.[layout]?.[GAMES[kind].unlockLesson];
}

// Літери для ігор: усі, вивчені до найдальшого пройденого уроку. Нічого понад це.
export function gameLetters(layout, progress, openAll = false) {
  const ids = Object.keys(progress?.[layout] ?? {}).map(Number);
  let top = ids.length ? Math.max(...ids) : 0;
  if (openAll) top = Math.max(top, GAMES.falling.unlockLesson);
  return top ? learnedLetters(layout, top) : [];
}

// ---------- одна гра ----------
export function createGame({ kind, letters, level = '1-2', weights = {}, rng = Math.random }) {
  const cfg = BASE[kind][level] ?? BASE[kind]['1-2'];
  return {
    kind, level, cfg, letters, weights, rng,
    t: 0, f: 1, // f — множник швидкості (адаптивний)
    hitRun: 0, missRun: 0,
    nextAt: 0.6, spawned: 0, caught: 0, gone: 0, presses: 0,
    items: [], lastLetter: null, lastLane: -1, nextId: 1,
    done: false,
  };
}

const speedOf = (g) => g.cfg.speed * g.f;
export const speedFactor = (g) => g.f;

// Яку літеру показати наступною: не ту, що вже на полі, і не ту саму двічі поспіль; важкі літери трохи частіше
function pickLetter(g) {
  const onField = new Set(g.items.map((i) => i.ch));
  let pool = g.letters.filter((c) => !onField.has(c) && c !== g.lastLetter);
  if (!pool.length) pool = g.letters.filter((c) => c !== g.lastLetter);
  if (!pool.length) pool = g.letters;
  const bag = pool.flatMap((c) => Array(1 + Math.min(2, g.weights[c] ?? 0)).fill(c));
  return bag[Math.floor(g.rng() * bag.length)];
}

function pickLane(g) {
  let lane;
  do { lane = Math.floor(g.rng() * LANES); } while (LANES > 2 && Math.abs(lane - g.lastLane) < 2);
  g.lastLane = lane;
  return lane;
}

// Подія для адаптивної швидкості: влучив (true) чи не встиг (false)
function adapt(g, hit) {
  if (hit) {
    g.hitRun += 1; g.missRun = 0;
    if (g.hitRun >= 3) { g.f = Math.min(g.cfg.cap, g.f * 1.1); g.hitRun = 0; }
  } else {
    g.missRun += 1; g.hitRun = 0;
    if (g.missRun >= 2) { g.f = Math.max(MIN_F, g.f * 0.8); g.missRun = 0; }
  }
}

// Шлях предмета — від 0 (старт) до 1 (зник): це p. Кульки летять знизу вгору, літери падають згори вниз.
const DIST = FIELD_H + ITEM_SIZE;
export const topOf = (kind, p) => (kind === 'balloons' ? FIELD_H - p * DIST : -ITEM_SIZE + p * DIST);

// Крок часу dt (секунди). Повертає події: { type: 'spawn'|'gone', item }
export function step(g, dt) {
  const events = [];
  if (g.done) return events;
  g.t += dt;
  for (const it of g.items) it.p += (speedOf(g) * dt) / DIST;
  for (const it of g.items.filter((i) => i.p >= 1)) { // не встиг — просто зникає, без штрафу
    g.items = g.items.filter((i) => i !== it);
    g.gone += 1;
    adapt(g, false);
    events.push({ type: 'gone', item: it });
  }
  const timeUp = g.kind === 'falling' && g.t >= FALLING_SECONDS;
  const allOut = g.kind === 'balloons' && g.spawned >= g.cfg.total;
  if (!timeUp && !allOut && g.t >= g.nextAt && g.items.length < g.cfg.max && g.letters.length) {
    const it = { id: g.nextId++, ch: pickLetter(g), lane: pickLane(g), p: 0, phase: g.rng() * 6.28 };
    g.items.push(it);
    g.lastLetter = it.ch;
    g.spawned += 1;
    g.nextAt = g.t + g.cfg.every / Math.sqrt(g.f);
    events.push({ type: 'spawn', item: it });
  }
  if (timeUp || (allOut && !g.items.length)) {
    g.items.forEach((it) => events.push({ type: 'gone', item: it, final: true }));
    g.items = [];
    g.done = true;
  }
  return events;
}

// Яку літеру «підказати»: ту, що ось-ось зникне (найдалі пройшла)
export function target(g) {
  return g.items.reduce((best, it) => (!best || it.p > best.p ? it : best), null);
}

// Натискання літери: влучили в предмет чи ні. Регістр не важливий. Штрафів немає.
export function press(g, ch) {
  if (g.done) return { hit: null };
  g.presses += 1;
  const c = String(ch).toLowerCase();
  const it = g.items.filter((i) => i.ch === c).sort((a, b) => b.p - a.p)[0];
  if (!it) return { hit: null };
  g.items = g.items.filter((i) => i !== it);
  g.caught += 1;
  adapt(g, true);
  return { hit: it };
}

// Скільки ще залишилось (0..1) — для спокійної смужки в «Падаючих літерах»
export const timeLeft = (g) => (g.kind === 'falling' ? Math.max(0, 1 - g.t / FALLING_SECONDS) : null);
