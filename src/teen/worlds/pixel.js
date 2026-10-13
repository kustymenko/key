// Концепція 2 «Піксель-аркада»: піксельна 8-бітна карта (поле вдень, інтерфейс на нічному тлі), герой 12×16 пікселів, нагороди-спрайти.
// Усі спрайти намальовані вручну буквами в цьому файлі: власні, нічого не скопійовано.
import { TABS, avatarControls, settingsRows, hideHelperButton, homeButton, playBar } from '../screens/controls.js';
import { taskText, keysPanel } from '../screens/typing.js';
import { hintToggle, lessonBody, lessonDone } from '../screens/lessonView.js';
import { HERO_OPTIONS as AV_OPTIONS, DEFAULT_HERO } from '../logic/profile.js';
import { shade, noise } from './draw.js';

// Поточний екран: усе, що залежить від профілю, береться з ctx (задається на початку screen()).
let C, PLAYER, WORLDS, QUESTS, REWARDS, av = DEFAULT_HERO;
const useCtx = (ctx) => { C = ctx; PLAYER = ctx.player; WORLDS = ctx.progress.worlds; QUESTS = ctx.progress.quests; REWARDS = ctx.progress.rewards; av = ctx.hero; };

export const heroSize = 18; // розмір великого героя на екрані «Герой»
export const meta = { id: 'pixel', name: 'Піксель-аркада', short: 'Піксель', desc: 'Піксельна 8-бітна карта пригод. Рівні, скарби й герой із пікселів.' };

// ---------- Спрайти ----------
const PAL = {
  g: '#3f9b4b', G: '#2e7a3a', l: '#63c46a', w: '#2f66d0', W: '#5d95f5', d: '#d2a35a', D: '#a97a3a',
  t: '#6b4226', f: '#1f6b34', F: '#33944b', s: '#8d93a8', S: '#5c6280', n: '#f2f6ff', r: '#e0453f', y: '#ffd23f',
  k: '#14122a', o: '#f08a2c', p: '#c96ad8', m: '#59d3ff',
};
const fit = (rows, w) => rows.map((r) => r.padEnd(w, '.').slice(0, w));
const rects = (rows, pal, x0 = 0, y0 = 0) => rows.map((row, y) => {
  let out = '';
  for (let x = 0; x < row.length;) {
    const ch = row[x];
    let n = 1;
    while (row[x + n] === ch) n++;
    if (ch !== '.' && pal[ch]) out += `<rect x="${x0 + x}" y="${y0 + y}" width="${n}" height="1" fill="${pal[ch]}"/>`;
    x += n;
  }
  return out;
}).join('');

const TILES = {
  g: ['gggggggg', 'gglggggg', 'ggggggGg', 'gggggggg', 'gGgggllg', 'gggggggg', 'gglggggg', 'ggggGggg'],
  w: ['wwwwwwww', 'wwWWwwww', 'wwwwwwww', 'wwwwwWWw', 'wwwwwwww', 'WWwwwwww', 'wwwwwwww', 'wwwWWwww'],
  p: ['dddddddd', 'ddDddddd', 'dddddddD', 'dddddddd', 'dDddddDd', 'dddddddd', 'ddddDddd', 'dddddddd'],
  t: ['..ffff..', '.fFFFFf.', 'fFFFFFFf', 'fFfFFFFf', '.fFFFFf.', '..ffff..', '...tt...', '...tt...'],
  m: ['...nn...', '..nnnn..', '..nssn..', '.ssssss.', '.sSssSs.', 'sSssssSs', 'ssSssSss', 'SSSSSSSS'],
  f: ['........', '..r.....', '.rpr..y.', '..r..yoy', '......y.', '.y......', 'yoy..r..', '.y..rpr.'],
};
const CASTLE = fit(['.rr..........rr.', '.sS...ssss...sS.', 'ssSs..sSSs..ssSs', 'sSSs.ssssss.sSSs', 'ssss.sSsSSs.ssss', 'ssss.ssssss.ssss', 'sSsssssSSsssssSs', 'ssssssssSsssssss', 'sSsSsssssssSssss', 'ssssssSkkSssssss', 'sssSssSkkSsssssS', 'ssssssSkkSssSsss', 'sSssssSkkSssssss', 'ssssssSkkSssSsss', 'SSSSSSSSSSSSSSSS'], 16).concat(['................']);
const STAR = ['...yy...', '...yy...', 'yyyyyyyy', '.yyyyyy.', '..yyyy..', '.yyyyyy.', '.yy..yy.', 'yy....yy'];
const LOCK = ['..ssss..', '.s....s.', '.s....s.', 'kkkkkkkk', 'kSSSSSSk', 'kSSkkSSk', 'kSSSSSSk', 'kkkkkkkk'];
const COIN = ['..kkkk..', '.kyyyyk.', 'kyyoyyyk', 'kyoyyyyk', 'kyoyyyyk', 'kyyoyyyk', '.kyyyyk.', '..kkkk..'];

const PLAYER_ROWS = fit([
  '....hhhh....', '...hhhhhh...', '...hhhhhh...', '...aaaaaa...', '...aeaaea...', '...aaaaaa...', '....aaaa....',
  '..cccccccc..', '.aaccccccaa.', '.aaccccccaa.', '..aCCCCCCa..', '...pppppp...', '...pp..pp...', '...pp..pp...', '...kk..kk...', '............',
], 12);
const HATS = {
  none: [],
  cap: ['....HHHH....', '...HHHHHH...', '...HHHHHHVV.'],
  crown: ['...y.yy.y...', '...yyyyyy...', '...hhhhhh...'],
  tuft: ['...h.hh.h...', '...hhhhhh...', '...hhhhhh...'],
};

export function playerRects(x0 = 0, y0 = 0, hero = av) {
  const outfit = AV_OPTIONS.outfit.vals[hero.outfit];
  const pal = { h: '#4a3020', a: AV_OPTIONS.skin.vals[hero.skin], e: '#14122a', c: outfit, C: shade(outfit, 0.7), p: '#394a7a', k: '#14122a', H: outfit, V: shade(outfit, 0.7), y: '#ffd23f' };
  const hat = HATS[AV_OPTIONS.hat.vals[hero.hat]];
  const rows = [...hat, ...PLAYER_ROWS.slice(hat.length)];
  return rects(rows, pal, x0, y0);
}
const heroSvg = (hero, w, h) => `<svg viewBox="0 0 12 16" width="${w}" height="${h}" shape-rendering="crispEdges" aria-label="Твій герой">${playerRects(0, 0, hero)}</svg>`;
export const avatarSvg = (size = 18, hero = av) => heroSvg(hero, 12 * size, 16 * size);
// Маленький герой для картки на екрані «Хто ти?»
export const heroIcon = (hero, px) => heroSvg(hero, Math.round(px * 0.75), px);

// ---------- Карта ----------
const COLS = 42, ROWS = 14;
const ROUTE = [[3, 10], [9, 10], [9, 6], [16, 6], [16, 10], [24, 10], [24, 4], [31, 4], [31, 9], [38, 9], [38, 4]];
const NODE_AT = [[3, 10], [9, 6], [16, 10], [24, 4], [31, 9], [38, 4]];

function mapSvg() {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill('g'));
  const deco = Array.from({ length: ROWS }, () => Array(COLS).fill(''));
  const lake = (cx, cy, rx, ry) => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1) grid[y][x] = 'w'; };
  lake(6, 1.5, 7, 2.6); lake(21, 0.5, 5, 2.2); lake(12, 13.5, 5, 1.8);
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const [ax, ay] = ROUTE[i], [bx, by] = ROUTE[i + 1];
    for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) grid[y][x] = 'p';
  }
  for (let y = 5; y <= 8; y++) for (let x = 33; x <= 36; x++) if (noise(x, y, 2) > 0.2) deco[y][x] = 'm';
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (grid[y][x] !== 'g' || deco[y][x]) continue;
    const n = noise(x, y, 8);
    if (n > 0.8 && !(x >= 36 && y <= 3)) deco[y][x] = 't';
    else if (n < 0.07) deco[y][x] = 'f';
  }
  const sym = (id, rows, w = 8) => `<symbol id="${id}" viewBox="0 0 ${w} ${w}">${rects(rows, PAL)}</symbol>`;
  const defs = `<defs>${Object.entries(TILES).map(([k, r]) => sym(`px-${k}`, r)).join('')}${sym('px-castle', CASTLE, 16)}${sym('px-star', STAR)}${sym('px-lock', LOCK)}${sym('px-coin', COIN)}</defs>`;
  const use = (id, x, y, s = 8) => `<use href="#${id}" x="${x}" y="${y}" width="${s}" height="${s}"/>`;
  let tiles = '';
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const g = grid[y][x];
    tiles += use(`px-${g === 'w' ? 'w' : g === 'p' ? 'p' : 'g'}`, x * 8, y * 8);
    if (deco[y][x]) tiles += use(`px-${deco[y][x]}`, x * 8, y * 8);
  }
  tiles += use('px-castle', 37 * 8, 1 * 8, 16);
  let marks = '';
  NODE_AT.forEach(([cx, cy], i) => {
    const st = WORLDS[i]?.state ?? 'locked', px = cx * 8 + 4, py = cy * 8 + 4;
    const fill = st === 'done' ? '#ffd23f' : st === 'now' ? '#ff5fa2' : '#8d93a8';
    marks += `<g transform="translate(${px - 8} ${py - 8})" class="${st === 'now' ? 'px-now' : ''}">
      <rect x="-1" y="-1" width="18" height="18" fill="#14122a"/><rect x="1" y="1" width="14" height="14" fill="${fill}"/>
      <rect x="1" y="12" width="14" height="3" fill="#000" opacity=".22"/>
      ${st === 'locked' ? use('px-lock', 4, 4) : `<text x="8" y="11.4" text-anchor="middle" font-size="8" fill="#14122a">${i + 1}</text>`}</g>`;
    if (st === 'done') marks += `<g transform="translate(${px + 3} ${py - 17})">${use('px-star', 0, 0, 7)}</g>`;
    if (st === 'now') marks += `<g class="px-hero-map" transform="translate(${px + 12} ${py - 14})">${playerRects()}</g>`;
  });
  return `<svg class="px-map" viewBox="0 0 ${COLS * 8} ${ROWS * 8}" width="${COLS * 32}" height="${ROWS * 32}" shape-rendering="crispEdges" aria-hidden="true">${defs}${tiles}${marks}</svg>`;
}

// ---------- Оболонка ----------
const xpBar = () => `<div class="px-xp" aria-label="Досвід">${Array.from({ length: 10 }, (_, i) => `<i class="${i < Math.round((PLAYER.xp / PLAYER.xpMax) * 10) ? 'on' : ''}"></i>`).join('')}</div>`;
const stars = () => `<div class="px-stars" aria-hidden="true">${Array.from({ length: 34 }, (_, i) => `<i style="left:${(noise(i, 1) * 1346).toFixed(0)}px;top:${(noise(i, 2) * 340).toFixed(0)}px;${i % 5 === 0 ? 'width:6px;height:6px' : ''}"></i>`).join('')}</div>`;

function shell(tab, inner) {
  return `<div class="screen cn cn-pixel is-tab-${tab}">${stars()}
    <header class="px-top">
      ${C.demo ? '' : homeButton('px')}
      <nav class="px-nav" aria-label="Розділи">${TABS.map(([id, label]) => `<a class="px-tab ${id === tab ? 'is-on' : ''}" href="${C.href(id)}" ${id === tab ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
      <div class="px-lvl"><div class="px-who"><span class="px-name">${PLAYER.name}</span><span class="px-rank">РІВ. <b data-level>${PLAYER.level}</b></span></div>${xpBar()}<small data-xp-text>${PLAYER.xp}/${PLAYER.xpMax}</small></div>
      <div class="px-coins" aria-label="Монети: ${PLAYER.coins}"><svg viewBox="0 0 8 8" width="32" height="32" shape-rendering="crispEdges" aria-hidden="true">${rects(COIN, PAL)}</svg><b>${PLAYER.coins}</b></div>
    </header>
    ${inner}</div>`;
}

const ghost = `<svg viewBox="0 0 8 8" width="40" height="40" shape-rendering="crispEdges" aria-hidden="true">${rects(['..nnnn..', '.nnnnnn.', 'nnknnknn', 'nnnnnnnn', 'nnnnnnnn', 'nnnnnnnn', 'nn.nn.nn', 'n..nn..n'], { ...PAL, n: '#e9e6ff' })}</svg>`;

const worldTab = () => shell('world', `${mapSvg()}${playBar('px', C)}
  <section class="px-quests ${C.helper ? '' : 'is-wide'}">${QUESTS.map((q) => `<div class="px-q ${q.done ? 'is-done' : ''}"><i>${q.done ? '✓' : ''}</i><div><b>${q.t}</b><small>${q.done ? 'Виконано' : q.now}</small></div><span>+${q.xp}</span></div>`).join('')}</section>
  ${C.helper ? `<div class="px-sprite">${C.demo ? '' : hideHelperButton('px')}<div>${ghost}</div><p>${C.tip}</p></div>` : ''}
  <div class="px-where"><small>Світ</small><b>${(WORLDS.find((w) => w.state === 'now') ?? WORLDS[0]).name}</b></div>`);

const avatarTab = () => shell('avatar', `<div class="px-platform"></div>
  <div class="px-hero" data-avatar>${avatarSvg(18, C.hero)}</div>
  <section class="px-panel px-wardrobe"><h2>Налаштуй героя</h2>${avatarControls('px', C)}${settingsRows('px', C)}</section>`);

const doneStar = `<svg viewBox="0 0 8 8" width="80" height="80" shape-rendering="crispEdges" aria-hidden="true">${rects(STAR, { ...PAL, y: '#5b5880' })}</svg>`;
const typeTab = () => {
  const L = C.lesson;
  return shell('type', `<div class="px-ground" aria-hidden="true"></div>
  <div class="px-task"><div class="px-task-tag">${L ? 'УРОК ' + L.id : 'ЗАВДАННЯ'}</div><div class="px-task-top"><span>${L ? L.title : 'Вправа «Нові землі»'}</span>
  <span>Точність <b data-acc>—</b></span><span>Знаків за хвилину <b data-speed>—</b></span>${L ? hintToggle() : ''}</div>
  <div class="px-bar"><div ${L ? 'data-bar' : 'data-xp-fill'} style="width:${L ? 0 : (PLAYER.xp / PLAYER.xpMax) * 100}%"></div></div>
  ${L ? lessonBody() : taskText()}<div class="px-msg" data-msg></div>
  <div class="px-done" data-done hidden>${L ? lessonDone() : `${doneStar}<div class="px-done-text"><b>ГОТОВО!</b><div class="px-chips"><span>Точність <b data-done-acc></b></span><span>Знаків за хвилину <b data-done-speed></b></span></div></div><button class="px-btn" data-again>Ще раз</button>`}</div></div>
  ${keysPanel({ layout: L ? L.layout : 'ua', demo: !L })}`);
};

const GEMS = [
  ['..aaaa..', '.ahaaaA.', 'ahaaaaaA', '.aaaaaA.', '..aaaA..', '...aA...'],
  ['aaaaaaaa', 'ahaaaaaA', 'ahaaaaaA', '.ahaaaA.', '..ahaA..', '...aA...'],
  ['...aa...', '...aa...', 'aaaaaaaa', '.ahaaaA.', '..aaaA..', '.aaAAaA.'],
  ['aaaaaaaa', '.ahaaaA.', '.ahaaaA.', '..aaaA..', '...aA...', '..aaaA..'],
];
const rewardArt = (r, i) => {
  const hex = ['#ff5fa2', '#59d3ff', '#ffd23f', '#9bf06b'][i % 4];
  const pal = r.got ? { a: hex, A: shade(hex, 0.65), h: shade(hex, 1.5) } : { a: '#4a456f', A: '#36325a', h: '#4a456f' };
  return `<svg viewBox="0 0 8 8" width="72" height="72" shape-rendering="crispEdges" aria-hidden="true">${rects(GEMS[i % 4], pal, 0, 1)}${r.got ? '' : rects(['..ss..', '.s..s.', 'kkkkkk', 'kSSSSk', 'kSkkSk', 'kkkkkk'], PAL, 1, 2)}</svg>`;
};
const rewardsTab = () => shell('rewards', `<section class="px-panel px-shelf"><h2>Мої нагороди <small>${REWARDS.filter((r) => r.got).length} з ${REWARDS.length}</small></h2>
  <div class="px-grid">${REWARDS.map((r, i) => `<div class="px-reward ${r.got ? 'is-got' : ''}">${rewardArt(r, i)}<span>${r.name}</span></div>`).join('')}</div></section>`);


// Рамка для екранів вступного тесту: тло, «Додому» і панель світу; вміст (inner) малює спільний код
export const frame = (ctx, inner = '') => {
  const saved = [C, PLAYER, WORLDS, QUESTS, REWARDS, av];
  useCtx(ctx);
  try { return `<div class="screen cn cn-pixel is-tab-test">${stars()}<header class="px-top">${homeButton('px')}</header><div class="px-panel pl-panel" data-pl>${inner}</div></div>`; } finally { [C, PLAYER, WORLDS, QUESTS, REWARDS, av] = saved; }
};

export const screen = (tab, ctx) => {
  const saved = [C, PLAYER, WORLDS, QUESTS, REWARDS, av]; // мініатюри світів викликають screen() усередині screen()
  useCtx(ctx);
  try { return ({ world: worldTab, avatar: avatarTab, type: typeTab, lesson: typeTab, rewards: rewardsTab }[tab] ?? worldTab)(); } finally { [C, PLAYER, WORLDS, QUESTS, REWARDS, av] = saved; }
};
