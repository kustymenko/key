import { klavik } from '../character/klavik.js';
import { icons, stars } from '../design/icons.js';
import { btn, homeButton, totalStars } from './common.js';
import { lessonsFor } from '../lessons/course.js';

const COLS = 7; // вузлів у ряду; ряди йдуть зміїкою
const X0 = 130;
const STEP = (1366 - 2 * X0) / (COLS - 1);
const ROW_Y = [250, 440, 630];

// Стан кожного уроку: зроблений (є зірочки), поточний (перший без зірочок), відкритий, закритий.
// Наступний урок відкривається після будь-якого завершення (мінімум 1 зірочка); openAll — показати все (для перевірки).
export function mapNodes({ layout, level, progress, openAll }) {
  const done = progress?.[layout] ?? {};
  const list = lessonsFor(layout, level);
  const currentIdx = Math.max(0, list.findIndex((l) => !done[l.id]));
  const hasCurrent = list.some((l) => !done[l.id]);
  return list.map((l, i) => {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const x = Math.round(X0 + (row % 2 ? COLS - 1 - col : col) * STEP);
    const state = done[l.id] ? 'done' : hasCurrent && i === currentIdx ? 'current' : openAll || i <= currentIdx ? 'open' : 'locked';
    return { ...l, x, y: ROW_Y[row], state, stars: done[l.id] ?? 0 };
  });
}

// Стежка через усі вузли: праворуч, вниз, ліворуч, вниз, праворуч
function pathFor(nodes) {
  const rows = Math.ceil(nodes.length / COLS);
  const right = Math.round(X0 + (COLS - 1) * STEP);
  let d = `M${X0} ${ROW_Y[0]}H${right}`;
  for (let r = 1; r < rows; r++) {
    const y0 = ROW_Y[r - 1];
    const y1 = ROW_Y[r];
    const last = nodes.filter((n) => n.y === y1).map((n) => n.x);
    if (r % 2) d += `C${right + 100} ${y0} ${right + 100} ${y1} ${right} ${y1}H${Math.min(...last)}`;
    else d += `C${X0 - 100} ${y0} ${X0 - 100} ${y1} ${X0} ${y1}H${Math.max(...last)}`;
  }
  return d;
}

export function mapScreen(state = { layout: 'ua', level: '1-2', progress: { ua: {}, en: {} } }) {
  const nodes = mapNodes(state);
  const html = nodes.map((n) => {
    const inner = n.state === 'locked'
      ? `<span class="node-lock">${icons.lock(44)}</span>`
      : `<span class="node-label ${n.label.length > 3 ? 'is-small' : ''}">${n.label}</span>`;
    const under = n.state === 'locked' ? '' : stars(n.stars, 3, 30);
    const label = n.state === 'locked' ? `Урок ${n.id}: закритий` : `Урок ${n.id}: ${n.label}`;
    return `<button class="node is-${n.state}" style="left:${n.x}px;top:${n.y}px" data-lesson-id="${n.id}" aria-label="${label}" ${n.state === 'locked' ? 'disabled' : ''}>
      <span class="node-disc">${inner}</span><span class="node-stars">${under}</span></button>`;
  }).join('');
  const cur = nodes.find((n) => n.state === 'current') ?? nodes[nodes.length - 1];
  const total = nodes.reduce((sum, n) => sum + n.stars, 0);
  return `<div class="screen screen-map theme-warm">
    <div class="topbar">${homeButton()}<div class="topbar-spacer"></div>
      ${btn({ label: 'Грай', icon: 'play', kind: 'primary', attrs: `data-lesson-id="${cur.id}"` })}${totalStars(total)}</div>
    <div class="map-head" aria-hidden="true">${klavik('cheer', 104)}<div class="bubble map-title"><span class="bubble-text">Урок ${cur.id}</span></div></div>
    <svg class="map-path" viewBox="0 0 1366 768" aria-hidden="true"><path d="${pathFor(nodes)}"/></svg>
    ${html}
  </div>`;
}

// Натискання на урок або «Грай» відкриває урок
export function mountMap(root, state) {
  const onClick = (e) => {
    const b = e.target.closest('[data-lesson-id]');
    if (!b || b.disabled) return;
    state.lessonId = Number(b.dataset.lessonId);
    location.hash = 'lesson';
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
