// Концепція 1 «Кубічний світ»: денний острів з кубиків (ізометрія), герой із кубиків, нагороди-кубики.
// Усе намальовано кодом: жодних чужих текстур, назв чи персонажів.
import { TABS, avatarControls, settingsRows, hideHelperButton } from '../screens/controls.js';
import { taskText, keysPanel } from '../screens/typing.js';
import { HERO_OPTIONS as AV_OPTIONS, DEFAULT_HERO } from '../logic/profile.js';
import { shade, noise, hslHex } from './draw.js';

// Поточний екран: усе, що залежить від профілю, береться з ctx (задається на початку screen()).
let C, PLAYER, WORLDS, QUESTS, REWARDS, av = DEFAULT_HERO;
const useCtx = (ctx) => { C = ctx; PLAYER = ctx.player; WORLDS = ctx.progress.worlds; QUESTS = ctx.progress.quests; REWARDS = ctx.progress.rewards; av = ctx.hero; };

export const heroSize = 360; // розмір великого героя на екрані «Герой»
export const meta = { id: 'voxel', name: 'Кубічний світ', desc: 'Острів із кубиків. Збудуй свій світ і відкривай нові землі.' };

// ---------- Ізометричні кубики ----------
function iso(ox, oy, S, V) {
  const P = (x, y, z) => `${(ox + (x - y) * S).toFixed(1)},${(oy + ((x + y) * S) / 2 - z * V).toFixed(1)}`;
  const poly = (pts, fill, stroke = 'rgb(20 30 50 / .22)') => `<polygon points="${pts.map((p) => P(...p)).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="1" stroke-linejoin="round"/>`;
  // Коробка: верх, ліва (передня) і права грані
  const box = (x, y, z, dx, dy, dz, c, k = {}) => {
    const top = k.top ?? c, left = k.left ?? shade(c, 0.82), right = k.right ?? shade(c, 0.64);
    return poly([[x, y, z + dz], [x + dx, y, z + dz], [x + dx, y + dy, z + dz], [x, y + dy, z + dz]], top)
      + poly([[x, y + dy, z + dz], [x + dx, y + dy, z + dz], [x + dx, y + dy, z], [x, y + dy, z]], left)
      + poly([[x + dx, y, z + dz], [x + dx, y + dy, z + dz], [x + dx, y + dy, z], [x + dx, y, z]], right);
  };
  return { P, poly, box };
}

// Герой із кубиків; ноги стоять у точці (ox, oy)
export function heroG(ox, oy, S, V, hero = av) {
  const { poly, box } = iso(ox, oy, S, V);
  const skin = AV_OPTIONS.skin.vals[hero.skin], suit = AV_OPTIONS.outfit.vals[hero.outfit], hat = AV_OPTIONS.hat.vals[hero.hat];
  const hair = '#4a3020', pants = '#3b4a6b';
  let g = box(0.15, 0.2, 0, 0.3, 0.6, 0.55, pants) + box(0.55, 0.2, 0, 0.3, 0.6, 0.55, pants);
  g += box(0.1, 0.15, 0.55, 0.8, 0.7, 0.7, suit);
  g += box(-0.12, 0.25, 0.6, 0.22, 0.5, 0.62, skin) + box(0.9, 0.25, 0.6, 0.22, 0.5, 0.62, skin);
  g += box(0.15, 0.1, 1.25, 0.7, 0.8, 0.7, skin);
  // очі на передній (лівій) грані голови
  const eye = (x) => poly([[x, 0.9, 1.7], [x + 0.12, 0.9, 1.7], [x + 0.12, 0.9, 1.52], [x, 0.9, 1.52]], '#1c2233', 'none');
  g += eye(0.3) + eye(0.58);
  g += poly([[0.38, 0.9, 1.4], [0.62, 0.9, 1.4], [0.62, 0.9, 1.34], [0.38, 0.9, 1.34]], shade(skin, 0.6), 'none');
  g += box(0.13, 0.08, 1.9, 0.74, 0.84, 0.1, hair);
  if (hat === 'cap') g += box(0.1, 0.05, 1.98, 0.8, 0.9, 0.2, suit) + box(0.1, 0.95, 1.98, 0.8, 0.28, 0.07, shade(suit, 0.8));
  if (hat === 'crown') g += box(0.14, 0.1, 2.0, 0.72, 0.8, 0.16, '#ffc531') + [0.14, 0.46, 0.7].map((x) => box(x, 0.1, 2.16, 0.16, 0.16, 0.2, '#ffc531')).join('') + [0.14, 0.7].map((x) => box(x, 0.74, 2.16, 0.16, 0.16, 0.2, '#ffc531')).join('');
  if (hat === 'tuft') g += [0.2, 0.45, 0.65].map((x, i) => box(x, 0.3 + (i % 2) * 0.2, 2.0, 0.17, 0.17, 0.3 + i * 0.05, hair)).join('');
  return g;
}

const heroSvg = (hero, w, h) => `<svg viewBox="-110 50 220 230" width="${w}" height="${h}" aria-label="Твій герой">
  ${iso(0, 170, 50, 46).box(-0.5, -0.5, -0.5, 2, 2, 0.5, '#c4ccd6')}${heroG(0, 170, 50, 46, hero)}</svg>`;
export const avatarSvg = (size = 360, hero = av) => heroSvg(hero, size, size * 1.045);
// Маленький герой для картки на екрані «Хто ти?»
export const heroIcon = (hero, px) => heroSvg(hero, px, px);

// ---------- Острів ----------
const N = 11;
// Стежка зигзагом: вздовж осей, щоб позначки рівнів не накладались (рух по x і по y дає різні напрямки на екрані)
const PATH = [[2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [6, 7], [6, 6], [6, 5], [7, 5], [8, 5], [9, 5], [9, 4], [9, 3], [9, 2]];
const NODES = [0, 2, 4, 7, 10, 13]; // індекси на стежці
const PALETTE = { grass: '#78c044', dirt: '#9b6a45', stone: '#9ba4b0', sand: '#ecd596', path: '#efe0ac', water: '#52a9e6' };

function island(ox, oy) {
  const S = 40, V = 36;
  const { P, poly, box } = iso(ox, oy, S, V);
  const pathKey = new Map(PATH.map(([x, y], i) => [`${x},${y}`, i]));
  const info = (x, y) => {
    const d = Math.hypot(x - 5, y - 5.2);
    const n = noise(x, y, 3);
    const onPath = pathKey.has(`${x},${y}`);
    if (!(d < 5.4 - n * 1.5 || onPath)) return null;
    if (onPath) return { type: 'path', h: 1 };
    if (x + y <= 7 && d < 4.4) return { type: 'stone', h: 2 + (x + y <= 5 ? 1 : 0) + (n > 0.6 ? 1 : 0) };
    if (x + y >= 13) return { type: 'sand', h: 1 };
    return { type: 'grass', h: n > 0.88 ? 2 : 1 };
  };
  let svg = '';
  const cells = [];
  for (let s = 0; s < 2 * N - 1; s++) for (let x = 0; x < N; x++) { const y = s - x; if (y >= 0 && y < N) cells.push([x, y]); }
  // вода
  for (const [x, y] of cells) {
    if (info(x, y)) continue;
    const w = noise(x, y, 9) > 0.55 ? shade(PALETTE.water, 1.12) : PALETTE.water;
    svg += box(x, y, 0.4, 1, 1, 0.12, w, { left: shade(w, 0.85), right: shade(w, 0.7) });
  }
  const tags = [];
  for (const [x, y] of cells) {
    const c = info(x, y);
    if (!c) continue;
    const n = noise(x, y, 5);
    const top = c.type === 'stone' ? shade(PALETTE.stone, 0.92 + n * 0.16) : c.type === 'sand' ? shade(PALETTE.sand, 0.94 + n * 0.1) : c.type === 'path' ? PALETTE.path : shade(PALETTE.grass, 0.92 + n * 0.22);
    const side = c.type === 'stone' ? PALETTE.stone : c.type === 'sand' ? '#d9bd78' : PALETTE.dirt;
    svg += box(x, y, 0, 1, 1, c.h - (c.type === 'stone' ? 0 : 0.22), side);
    if (c.type === 'stone') {
      svg += box(x, y, c.h - 0.0001, 1, 1, 0.0001, top, { top });
    } else {
      svg += box(x, y, c.h - 0.22, 1, 1, 0.22, top, { left: shade(top, 0.8), right: shade(top, 0.62) });
    }
    if (c.type === 'grass' && n > 0.78 && x > 1) {
      svg += box(x + 0.38, y + 0.38, c.h, 0.24, 0.24, 0.8, '#7a5230');
      svg += box(x + 0.1, y + 0.1, c.h + 0.8, 0.8, 0.8, 0.8, '#3f9a45') + box(x + 0.28, y + 0.28, c.h + 1.6, 0.44, 0.44, 0.42, '#4cae52');
    }
    if (c.type === 'grass' && n < 0.12) svg += box(x + 0.4, y + 0.4, c.h, 0.2, 0.2, 0.22, '#f4d03f') ;
    const ni = NODES.findIndex((pi) => pathKey.get(`${x},${y}`) === pi);
    if (ni >= 0) {
      const st = WORLDS[ni]?.state ?? 'locked';
      const col = st === 'done' ? '#ffc531' : st === 'now' ? '#ff7a3d' : '#8d96a3';
      svg += box(x + 0.2, y + 0.2, c.h, 0.6, 0.6, 0.28, col);
      const [tx, ty] = P(x + 0.5, y + 0.5, c.h + 0.28).split(',').map(Number);
      tags.push({ tx, ty, n: ni + 1, st });
      if (st === 'now') svg += heroG(tx - 7, ty + 10, 20, 19); // герой стоїть на цьому рівні
    }
  }
  // бирки рівнів поверх усього
  for (const t of tags) {
    const fill = t.st === 'done' ? '#ffc531' : t.st === 'now' ? '#ff7a3d' : '#cfd5dd';
    const ink = t.st === 'locked' ? '#59616e' : '#2a2018';
    const up = t.st === 'now' ? 118 : 46;
    svg += `<g class="vx-tag ${t.st === 'now' ? 'is-now' : ''}" transform="translate(${t.tx.toFixed(1)} ${(t.ty - up).toFixed(1)})">
      <rect x="-22" y="-22" width="44" height="44" rx="8" fill="${fill}" stroke="#2a2f3d" stroke-width="4"/>
      <text y="9" text-anchor="middle" font-size="26" font-weight="800" fill="${ink}">${t.st === 'locked' ? '' : t.n}</text>
      ${t.st === 'locked' ? '<rect x="-9" y="-2" width="18" height="14" rx="3" fill="#59616e"/><path d="M-5 -2v-5a5 5 0 0 1 10 0v5" fill="none" stroke="#59616e" stroke-width="3.5"/>' : ''}
      <path d="M-8 22h16l-8 9z" fill="#2a2f3d"/></g>`;
  }
  // хмаринки з кубиків
  const clouds = [[-3, 2, 5], [9, -2, 6], [12, 10, 5]].map(([x, y, z]) => box(x, y, z, 2.2, 1.2, 0.5, '#ffffff') + box(x + 0.4, y + 0.1, z + 0.5, 1.2, 0.9, 0.4, '#ffffff')).join('');
  return `<svg class="vx-island" viewBox="0 0 1366 768" width="1366" height="768" aria-hidden="true">${clouds}${svg}</svg>`;
}

// ---------- Оболонка: панель героя, монети, меню ----------
const segBar = (frac, n = 10) => `<div class="vx-seg" aria-label="Досвід">${Array.from({ length: n }, (_, i) => `<i class="${i < Math.floor(frac * n) ? 'on' : i < frac * n ? 'half' : ''}"></i>`).join('')}</div>`;
const cubeIcon = (c) => `<svg viewBox="-16 -15 32 32" width="32" height="32" aria-hidden="true">${iso(0, 0, 14, 13).box(0, 0, 0, 1, 1, 1, c)}</svg>`;
const tabIcon = { world: '#78c044', avatar: '#2e86de', type: '#ff7a3d', rewards: '#ffc531' };

function shell(tab, inner) {
  const frac = PLAYER.xp / PLAYER.xpMax;
  const head = `<svg viewBox="-34 -78 68 96" width="52" height="72" aria-hidden="true">${heroG(0, 20, 22, 20)}</svg>`;
  return `<div class="screen cn cn-voxel is-tab-${tab}">
    ${inner}
    <div class="vx-plate"><div class="vx-head">${head}</div>
      <div><div class="vx-name">${PLAYER.name}</div>
      <div class="vx-lvl">Рівень <b data-level>${PLAYER.level}</b></div>${segBar(frac)}
      <div class="vx-xpt"><span data-xp-text>${PLAYER.xp} / ${PLAYER.xpMax}</span> досвіду</div></div></div>
    <div class="vx-coins" aria-label="Кубики: ${PLAYER.coins}">${cubeIcon('#ffc531')}<b>${PLAYER.coins}</b></div>
    <nav class="vx-nav" aria-label="Розділи">${TABS.map(([id, label]) =>
      `<a class="vx-tab ${id === tab ? 'is-on' : ''}" href="${C.href(id)}" ${id === tab ? 'aria-current="page"' : ''}>${cubeIcon(tabIcon[id])}<span>${label}</span></a>`).join('')}</nav>
  </div>`;
}

// ---------- Вкладки ----------
const questPanel = () => `<aside class="vx-panel vx-quests"><h2>Завдання дня</h2>
  ${QUESTS.map((q) => `<div class="vx-q ${q.done ? 'is-done' : ''}"><i class="vx-box">${q.done ? '✓' : ''}</i><div><b>${q.t}</b><small>${q.done ? 'Виконано' : q.now}</small></div><span class="vx-xp">+${q.xp}</span></div>`).join('')}
  ${C.helper ? `<div class="vx-bot">${C.demo ? '' : hideHelperButton('vx')}<svg viewBox="-24 -34 48 56" width="48" height="56" aria-hidden="true">${iso(0, 0, 14, 14).box(-0.7, -0.7, 0.2, 1.4, 1.4, 1.4, '#e9eef5')}<polygon points="-10,-3 -3,-3 -3,-9 -10,-9" fill="#2a2f3d"/></svg>
  <p>${C.tip}</p></div>` : ''}</aside>`;

const worldTab = () => shell('world', `<div class="vx-sky"></div>${island(592, 150)}${questPanel()}`);

const avatarTab = () => shell('avatar', `<div class="vx-sky"></div>
  <section class="vx-panel vx-wardrobe"><h2>Налаштуй героя</h2>${avatarControls('vx', C)}${settingsRows('vx', C)}</section>
  <div class="vx-hero" data-avatar>${avatarSvg(360, C.hero)}</div>`);

const typeTab = () => shell('type', `<div class="vx-sky vx-calm"></div>
  <div class="vx-task"><div class="vx-task-top"><span>Вправа: «Нові землі»</span>
    <span class="vx-stat">Точність <b data-acc>—</b></span><span class="vx-stat">Знаків за хвилину <b data-speed>—</b></span></div>
    <div class="vx-xpbar"><div data-xp-fill style="width:${(PLAYER.xp / PLAYER.xpMax) * 100}%"></div></div>
    ${taskText()}
    <div class="vx-msg" data-msg></div>
    <div class="vx-done" data-done hidden><b>Вправу пройдено!</b> Точність <span data-done-acc></span>
      <button class="vx-btn" data-again>Ще раз</button></div></div>
  ${keysPanel()}`);

const rewardCube = (r, i) => {
  const base = r.got ? `hsl(${(i * 47 + 20) % 360} 70% 56%)` : '#c6ccd4';
  const hex = r.got ? hslHex((i * 47 + 20) % 360, 70, 56) : '#c6ccd4';
  return `<svg viewBox="-36 -8 72 80" width="86" height="96" aria-hidden="true">${iso(0, 4, 24, 24).box(0, 0, 0, 1, 1, 1, hex)}${r.got ? '' : '<rect x="-9" y="34" width="18" height="14" rx="3" fill="#7a828e"/><path d="M-5 34v-5a5 5 0 0 1 10 0v5" fill="none" stroke="#7a828e" stroke-width="3.5"/>'}</svg>`;
};
const rewardsTab = () => shell('rewards', `<div class="vx-sky"></div>
  <section class="vx-panel vx-shelf"><h2>Мої нагороди <small>${REWARDS.filter((r) => r.got).length} з ${REWARDS.length}</small></h2>
  <div class="vx-grid">${REWARDS.map((r, i) => `<div class="vx-reward ${r.got ? 'is-got' : ''}">${rewardCube(r, i)}<span>${r.name}</span></div>`).join('')}</div></section>`);

export const screen = (tab, ctx) => { useCtx(ctx); return ({ world: worldTab, avatar: avatarTab, type: typeTab, rewards: rewardsTab }[tab] ?? worldTab)(); };
