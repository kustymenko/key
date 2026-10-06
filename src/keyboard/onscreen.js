// Екранна клавіатура і схема долонь (без логіки: лише малює за станом).
import { ROWS } from './layouts.js';
import { fingerOf, FINGERS } from './fingers.js';
import { contrast } from '../design/color-utils.js';

const FINGER_HEX = {
  lp: '#cc79a7', lr: '#f0e442', lm: '#009e73', li: '#6a3d9a',
  ri: '#e69f00', rm: '#0072b2', rr: '#d55e00', rp: '#56b4e9', th: '#b8c0c8',
};
// Колір тексту на насиченій клавіші: білий або темний, залежно від контрасту
const inkOn = (f) => (contrast('#1b2430', FINGER_HEX[f]) >= contrast('#ffffff', FINGER_HEX[f]) ? '#1b2430' : '#ffffff');

const SERVICE = new Set(['Backspace', 'Tab', 'CapsLock', 'Enter', 'ShiftLeft', 'ShiftRight']);

/**
 * state: { layout: 'ua'|'en', next: code|null, hint: 'next'|'error'|null, rows }
 * Усі клавіші бліді; насичена лише `next`.
 */
export function keyboard({ layout = 'ua', next = null, hint = 'next', rows = ROWS.slice(1) } = {}) {
  const html = rows
    .map(
      (row) =>
        `<div class="kb-row">${row
          .map((k) => {
            const f = fingerOf(k.code);
            const isNext = k.code === next;
            const cls = ['key', `f-${f}`, SERVICE.has(k.code) ? 'is-service' : '', k.code === 'Space' ? 'is-space' : '', isNext ? `is-next is-${hint}` : '']
              .filter(Boolean)
              .join(' ');
            const style = `flex-grow:${k.code === 'Space' ? 0 : k.w}${isNext ? `;--ink:${inkOn(f)}` : ''}`;
            return `<div class="${cls}" style="${style}" data-code="${k.code}"><span class="key-label">${k[layout]}</span></div>`;
          })
          .join('')}</div>`,
    )
    .join('');
  return `<div class="kb" role="img" aria-label="Екранна клавіатура">${html}</div>`;
}

// ---------- Схема долонь ----------
// Права долоня — дзеркальне відображення лівої (через CSS), тому геометрія одна.
const FINGERS_GEO = [
  { n: 'p', x: 14, top: 74, len: 80 },
  { n: 'r', x: 56, top: 36, len: 118 },
  { n: 'm', x: 98, top: 12, len: 142 },
  { n: 'i', x: 140, top: 38, len: 116 },
];

function hand(side, active) {
  const pre = side === 'left' ? 'l' : 'r';
  const fs = FINGERS_GEO.map((p) => {
    const id = pre + p.n;
    return `<rect class="finger f-${id} ${active === id ? 'is-active' : ''}" x="${p.x}" y="${p.top}" width="34" height="${p.len}" rx="17"/>`;
  }).join('');
  const palm = '<path class="palm" d="M10 140q0-8 8-8h156q16 0 16 22v26q0 38-46 38H56q-46 0-46-40z"/>';
  const thumb = `<g transform="rotate(16 182 190)"><rect class="finger f-th ${active === 'th' ? 'is-active' : ''}" x="170" y="120" width="34" height="84" rx="17"/></g>`;
  return `<svg class="hand hand-${side}" viewBox="0 0 224 232" width="224" height="232" aria-hidden="true">${fs}${palm}${thumb}</svg>`;
}

export function hands({ active = null, hint = 'next', caption = true } = {}) {
  const name = FINGERS.find((f) => f.id === active)?.name ?? '';
  return `<div class="hands is-${hint}" role="img" aria-label="Схема долонь${name ? ': ' + name : ''}">
    <div class="hands-pair">${hand('left', active)}${hand('right', active)}</div>
    ${caption && name ? `<div class="hands-caption">${name}</div>` : ''}
  </div>`;
}
