import { klavik } from '../character/klavik.js';
import { icons, stars } from '../design/icons.js';
import { btn, homeButton, totalStars } from './common.js';

// Вузли карти: x, y — центр у координатах сцени 1366×768
const NODES = [
  { x: 190, y: 270, label: 'А О', state: 'done', stars: 3 },
  { x: 480, y: 270, label: 'В Л', state: 'done', stars: 2 },
  { x: 770, y: 270, label: 'І Д', state: 'done', stars: 3 },
  { x: 1060, y: 270, label: 'Ф Ж', state: 'current', stars: 0 },
  { x: 1060, y: 530, label: 'П Р', state: 'locked' },
  { x: 770, y: 530, label: 'Є', state: 'locked' },
  { x: 480, y: 530, label: 'К Е', state: 'locked' },
  { x: 190, y: 530, label: 'Н Г', state: 'locked' },
];

// Стежка між вузлами
const PATH = 'M190 270H1060Q1180 270 1180 400Q1180 530 1060 530H190';

export function mapScreen() {
  const nodes = NODES.map((n) => {
    const inner =
      n.state === 'locked'
        ? `<span class="node-lock">${icons.lock(44)}</span>`
        : `<span class="node-label">${n.label}</span>`;
    const under = n.state === 'done' ? stars(n.stars, 3, 30) : n.state === 'locked' ? '' : stars(0, 3, 30);
    return `<div class="node is-${n.state}" style="left:${n.x}px;top:${n.y}px">
      <div class="node-disc">${inner}</div><div class="node-stars">${under}</div></div>`;
  }).join('');
  const cur = NODES.find((n) => n.state === 'current');
  return `<div class="screen screen-map">
    <div class="topbar">${homeButton()}<div class="topbar-spacer"></div>${totalStars(8)}</div>
    <svg class="map-path" viewBox="0 0 1366 768" aria-hidden="true"><path d="${PATH}"/></svg>
    ${nodes}
    <div class="map-klavik" style="left:${cur.x - 215}px;top:${cur.y - 180}px">${klavik('cheer', 150)}</div>
    <div class="map-play">${btn({ label: 'Грай', icon: 'play', kind: 'primary', size: 'big' })}</div>
  </div>`;
}
