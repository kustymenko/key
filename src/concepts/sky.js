// Концепція 3 «Небесні острови»: нічний космос, острови з гострих граней (low-poly), скляні панелі, кристали-нагороди.
// Усе намальовано кодом: власні форми, власні кольори.
import { PLAYER, WORLDS, QUESTS, REWARDS, TABS, AV_OPTIONS, av, avatarControls, taskText, keysPanel, shade, noise, hslHex } from './shared.js';

export const meta = { id: 'sky', name: 'Небесні острови', tag: 'Концепція 3', desc: 'Літаючі острови в нічному небі. Мости, кристали й нові світи за туманом.' };

const tri = (pts, fill, stroke = 'rgb(255 255 255 / .14)') => `<polygon points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="1" stroke-linejoin="round"/>`;

// ---------- Герой з граней ----------
export function heroG(ox, oy, k = 1) {
  const skin = AV_OPTIONS.skin.vals[av.skin], suit = AV_OPTIONS.outfit.vals[av.outfit], hat = AV_OPTIONS.hat.vals[av.hat];
  const hair = '#3b2a4a', pants = '#2c3763';
  const P = (x, y) => [ox + x * k, oy + y * k];
  const T = (a, b, c, col) => tri([P(...a), P(...b), P(...c)], col);
  let g = '';
  // ноги
  g += T([30, 112], [47, 112], [44, 152], pants) + T([30, 112], [44, 152], [27, 152], shade(pants, 0.75));
  g += T([53, 112], [70, 112], [73, 152], shade(pants, 0.85)) + T([53, 112], [73, 152], [56, 152], shade(pants, 0.65));
  g += T([24, 152], [44, 152], [44, 160], '#1a2040') + T([56, 152], [76, 152], [56, 160], '#1a2040');
  // руки
  g += T([14, 62], [24, 60], [18, 108], shade(suit, 0.7)) + T([76, 60], [86, 62], [82, 108], shade(suit, 0.6));
  g += T([16, 104], [24, 104], [20, 116], skin) + T([78, 104], [84, 104], [82, 116], shade(skin, 0.8));
  // тулуб
  const C = [50, 86];
  g += T([24, 60], [76, 60], C, shade(suit, 1.18)) + T([76, 60], [70, 112], C, shade(suit, 0.78)) + T([70, 112], [30, 112], C, shade(suit, 0.64)) + T([30, 112], [24, 60], C, suit);
  // голова: шестикутник із 6 граней
  const hc = [50, 34], r = 25;
  const ring = Array.from({ length: 6 }, (_, i) => [hc[0] + Math.cos((Math.PI / 3) * i - Math.PI / 2) * r, hc[1] + Math.sin((Math.PI / 3) * i - Math.PI / 2) * r]);
  const tones = [1.1, 0.95, 0.8, 0.7, 0.85, 1.0];
  ring.forEach((p, i) => { g += T(hc, p, ring[(i + 1) % 6], i === 0 || i === 5 ? shade(skin, 1.12) : shade(skin, tones[i])); });
  g += T([38, 34], [46, 30], [46, 38], '#1c2233') + T([54, 30], [62, 34], [54, 38], '#1c2233');
  g += T([44, 46], [56, 46], [50, 50], shade(skin, 0.55));
  // зачіска/головний убір
  g += T(ring[5], ring[0], hc, hair) + T(ring[0], ring[1], hc, shade(hair, 0.8));
  if (hat === 'cap') g += T([22, 24], [78, 24], [50, 4], suit) + T([22, 24], [50, 4], [30, 10], shade(suit, 1.2)) + T([60, 24], [92, 28], [60, 18], shade(suit, 0.7));
  if (hat === 'crown') g += T([28, 16], [72, 16], [72, 4], '#ffc531') + T([28, 16], [72, 4], [28, 4], '#ffe08a') + T([28, 4], [36, -10], [44, 4], '#ffc531') + T([44, 4], [50, -12], [56, 4], '#ffe08a') + T([56, 4], [64, -10], [72, 4], '#ffc531');
  if (hat === 'tuft') g += T([40, 12], [46, -12], [52, 12], hair) + T([50, 12], [58, -8], [62, 14], shade(hair, 1.3)) + T([32, 14], [36, -4], [44, 12], shade(hair, 0.8));
  return g;
}
export const avatarSvg = (size = 300) => `<svg viewBox="-10 -24 120 192" width="${size}" height="${size * 1.6}" aria-label="Твій герой"><ellipse cx="50" cy="164" rx="42" ry="7" fill="rgb(0 0 0 / .3)"/>${heroG(0, 0)}</svg>`;

// ---------- Острів ----------
const TOPS = { done: ['#5fd48a', '#3fae6e'], now: ['#7ad9ff', '#4aa8e0'], locked: ['#6a6f95', '#4d5278'] };
function island(cx, cy, r, seed, st) {
  const n = 9, [t1, t2] = TOPS[st === 'now' ? 'now' : st];
  const ring = Array.from({ length: n }, (_, i) => {
    const a = ((Math.PI * 2) / n) * i + (noise(i, seed) - 0.5) * 0.35;
    const rad = r * (0.86 + noise(i, seed, 4) * 0.28);
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.4];
  });
  const top = [cx + (noise(seed, 1) - 0.5) * r * 0.2, cy - r * 0.14];
  const apex = [cx + (noise(seed, 2) - 0.5) * r * 0.3, cy + r * 1.0];
  let g = '';
  const rock = st === 'locked' ? '#3a3e63' : '#7a5a8f';
  ring.forEach((p, i) => { const q = ring[(i + 1) % n]; g += tri([p, q, apex], shade(rock, 0.6 + noise(i, seed, 6) * 0.55)); });
  ring.forEach((p, i) => { const q = ring[(i + 1) % n]; g += tri([top, p, q], shade(i % 2 ? t1 : t2, 0.82 + noise(i, seed, 8) * 0.4)); });
  // дерева-конуси та кристал на острові
  const tree = (x, y, s) => tri([[x - 10 * s, y], [x + 10 * s, y], [x, y - 26 * s]], '#2e9a6b') + tri([[x - 8 * s, y - 12 * s], [x + 8 * s, y - 12 * s], [x, y - 34 * s]], '#46c18a') + tri([[x - 2 * s, y], [x + 2 * s, y], [x + 2 * s, y + 7 * s]], '#6b4a3a');
  if (st !== 'locked') {
    g += tree(cx - r * 0.38, cy + r * 0.02, r / 90) + tree(cx + r * 0.32, cy - r * 0.04, r / 100) + tree(cx - r * 0.1, cy + r * 0.12, r / 110);
    const g0 = [cx + r * 0.1, cy - r * 0.02];
    g += tri([[g0[0] - 7, g0[1]], [g0[0], g0[1] - 26], [g0[0] + 7, g0[1]]], '#ff9dd2') + tri([[g0[0], g0[1] - 26], [g0[0] + 7, g0[1]], [g0[0] + 1, g0[1] + 4]], '#d96bb0');
  }
  return g;
}

const ISLANDS = [[300, 540, 92], [540, 410, 104], [800, 500, 88], [880, 280, 82], [1120, 210, 92], [1190, 450, 108]];
function worldSvg() {
  let g = '<defs><radialGradient id="sk-fog"><stop offset="0" stop-color="#b8b4ff" stop-opacity=".75"/><stop offset=".7" stop-color="#8a86e8" stop-opacity=".35"/><stop offset="1" stop-color="#8a86e8" stop-opacity="0"/></radialGradient><radialGradient id="sk-glow"><stop offset="0" stop-color="#7ad9ff" stop-opacity=".55"/><stop offset="1" stop-color="#7ad9ff" stop-opacity="0"/></radialGradient></defs>';
  for (let i = 0; i < ISLANDS.length - 1; i++) {
    const [x1, y1] = ISLANDS[i], [x2, y2] = ISLANDS[i + 1];
    const open = WORLDS[i + 1].state !== 'locked';
    g += `<path d="M${x1} ${y1 + 10} Q${(x1 + x2) / 2} ${Math.min(y1, y2) - 70} ${x2} ${y2 + 10}" fill="none" stroke="${open ? '#7ad9ff' : '#5a5e92'}" stroke-width="${open ? 5 : 3}" stroke-dasharray="${open ? '2 12' : '2 10'}" stroke-linecap="round"/>`;
  }
  ISLANDS.forEach(([x, y, r], i) => {
    const w = WORLDS[i];
    if (w.state === 'now') g += `<ellipse cx="${x}" cy="${y}" rx="${r * 1.6}" ry="${r * 0.9}" fill="url(#sk-glow)"/>`;
    g += `<g class="sk-isle ${w.state === 'locked' ? '' : 'sk-float'}" style="animation-delay:${-i * 0.7}s">${island(x, y, r, i + 3, w.state)}`;
    if (w.state === 'now') g += `<g class="sk-hero-map">${heroG(x - 20, y - 78, 0.5)}</g>`;
    if (w.state === 'locked') g += `<ellipse cx="${x}" cy="${y + 10}" rx="${r * 1.25}" ry="${r * 0.8}" fill="url(#sk-fog)"/>`;
    g += '</g>';
    const label = w.state === 'locked' ? '' : `<text x="${x}" y="${y - r * 0.55 - (w.state === 'now' ? 76 : 30)}" text-anchor="middle" class="sk-label">${i + 1} · ${w.name}</text>`;
    g += label;
    if (w.state === 'locked') g += `<g transform="translate(${x} ${y + 6})"><rect x="-13" y="-4" width="26" height="20" rx="4" fill="#dcd9ff"/><path d="M-7 -4v-6a7 7 0 0 1 14 0v6" fill="none" stroke="#dcd9ff" stroke-width="4"/></g>`;
    if (w.state === 'now') g += `<g transform="translate(${x} ${y - r * 0.55 - 58})"><rect x="-66" y="-12" width="132" height="10" rx="5" fill="rgb(255 255 255 / .2)"/><rect x="-66" y="-12" width="${132 * (w.pct / 100)}" height="10" rx="5" fill="#7ad9ff"/></g>`;
  });
  return `<svg class="sk-world" viewBox="0 0 1366 768" width="1366" height="768" aria-hidden="true">${g}</svg>`;
}

// ---------- Оболонка ----------
const ico = {
  world: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17"/>',
  avatar: '<path d="M6 14a6 6 0 0 1 12 0v3H6z"/><path d="M9 14h6"/><path d="M12 8V5"/>',
  type: '<rect x="3" y="7" width="18" height="11" rx="2.5"/><path d="M7 11h.01M11 11h.01M15 11h.01M8 14.5h8"/>',
  rewards: '<path d="m12 3 6 5-2 10H8L6 8z"/><path d="M6 8h12M12 3v15"/>',
};
const stars = () => `<div class="sk-stars" aria-hidden="true">${Array.from({ length: 70 }, (_, i) => `<i style="left:${(noise(i, 11) * 1366).toFixed(0)}px;top:${(noise(i, 12) * 720).toFixed(0)}px;opacity:${(0.25 + noise(i, 13) * 0.6).toFixed(2)};width:${noise(i, 14) > 0.9 ? 4 : 2}px;height:${noise(i, 14) > 0.9 ? 4 : 2}px"></i>`).join('')}</div>`;

function shell(tab, inner) {
  const frac = PLAYER.xp / PLAYER.xpMax, C = 2 * Math.PI * 30;
  return `<div class="screen cn cn-sky is-tab-${tab}">${stars()}${inner}
    <nav class="sk-side" aria-label="Розділи"><div class="sk-logo" aria-hidden="true"><svg viewBox="-4 -4 32 32" width="38" height="38">${tri([[12, 1], [22, 10], [12, 23], [2, 10]], '#7ad9ff')}${tri([[12, 1], [22, 10], [12, 12]], '#c9f1ff')}${tri([[12, 12], [22, 10], [12, 23]], '#4aa8e0')}</svg></div>
      ${TABS.map(([id, label]) => `<a class="sk-tab ${id === tab ? 'is-on' : ''}" href="#sky${id === 'world' ? '' : '/' + id}" ${id === tab ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ico[id]}</svg><span>${label}</span></a>`).join('')}</nav>
    <div class="sk-status"><div class="sk-coins" aria-label="Кристали: ${PLAYER.coins}"><svg viewBox="0 0 20 24" width="22" height="26" aria-hidden="true">${tri([[10, 1], [18, 8], [10, 23], [2, 8]], '#ff9dd2')}${tri([[10, 1], [18, 8], [10, 10]], '#ffd3ec')}</svg><b>${PLAYER.coins}</b></div>
      <div class="sk-ring" aria-label="Рівень ${PLAYER.level}"><svg viewBox="0 0 72 72" width="72" height="72"><circle cx="36" cy="36" r="30" fill="rgb(10 14 42 / .6)" stroke="rgb(255 255 255 / .18)" stroke-width="6"/><circle cx="36" cy="36" r="30" fill="none" stroke="#7ad9ff" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(C * frac).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 36 36)" data-ring/></svg><b data-level>${PLAYER.level}</b></div></div>
  </div>`;
}

const questStrip = () => `<section class="sk-quests"><div class="sk-orb" aria-hidden="true"><svg viewBox="-24 -28 48 56" width="52" height="60">${tri([[0, -26], [18, 0], [0, 4]], '#e8f9ff')}${tri([[0, -26], [-18, 0], [0, 4]], '#9fe3ff')}${tri([[0, 26], [18, 0], [0, 4]], '#4aa8e0')}${tri([[0, 26], [-18, 0], [0, 4]], '#7ad9ff')}</svg></div>
  ${QUESTS.map((q) => `<div class="sk-q ${q.done ? 'is-done' : ''}"><i>${q.done ? '✓' : ''}</i><div><b>${q.t}</b><small>${q.done ? 'Виконано' : q.now}</small></div><span>+${q.xp}</span></div>`).join('')}</section>`;

const worldTab = () => shell('world', `${worldSvg()}${questStrip()}`);

const avatarTab = () => shell('avatar', `<div class="sk-podium" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="sk-hero" data-avatar>${avatarSvg(250)}</div>
  <section class="sk-glass sk-wardrobe"><h2>Налаштуй героя</h2>${avatarControls('sk')}</section>`);

const typeTab = () => shell('type', `<div class="sk-task"><div class="sk-task-top"><span>Вправа «Нові землі»</span><span>Точність <b data-acc>—</b></span><span>Знаків за хвилину <b data-speed>—</b></span><span data-xp-text class="sk-xpt">${PLAYER.xp} / ${PLAYER.xpMax}</span></div>
  <div class="sk-bar"><div data-xp-fill style="width:${(PLAYER.xp / PLAYER.xpMax) * 100}%"></div></div>
  ${taskText()}<div class="sk-msg" data-msg></div>
  <div class="sk-done" data-done hidden><b>Вправу пройдено!</b><span>Точність <span data-done-acc></span> · +160 досвіду</span><button class="sk-btn" data-again>Ще раз</button></div></div>
  ${keysPanel()}`);

const crystal = (r, i) => {
  const hue = (i * 47 + 190) % 360, c = r.got ? hslHex(hue, 75, 62) : '#59608f';
  return `<svg viewBox="0 0 60 76" width="78" height="96" aria-hidden="true">${r.got ? '<ellipse cx="30" cy="68" rx="24" ry="5" fill="rgb(255 255 255 / .18)"/>' : ''}
    ${tri([[30, 4], [52, 24], [30, 66], [8, 24]], c)}${tri([[30, 4], [52, 24], [30, 28]], shade(c, 1.4))}${tri([[30, 28], [52, 24], [30, 66]], shade(c, 0.7))}${tri([[30, 4], [8, 24], [30, 28]], shade(c, 1.15))}${tri([[30, 28], [8, 24], [30, 66]], shade(c, 0.85))}
    ${r.got ? '' : '<rect x="21" y="26" width="18" height="15" rx="3" fill="#dcd9ff"/><path d="M26 26v-5a4 4 0 0 1 8 0v5" fill="none" stroke="#dcd9ff" stroke-width="3.5"/>'}</svg>`;
};
const rewardsTab = () => shell('rewards', `<section class="sk-glass sk-shelf"><h2>Мої кристали <small>${REWARDS.filter((r) => r.got).length} з ${REWARDS.length}</small></h2>
  <div class="sk-grid">${REWARDS.map((r, i) => `<div class="sk-reward ${r.got ? 'is-got' : ''}">${crystal(r, i)}<span>${r.name}</span></div>`).join('')}</div></section>`);

export const screen = (tab) => ({ world: worldTab, avatar: avatarTab, type: typeTab, rewards: rewardsTab }[tab] ?? worldTab)();
