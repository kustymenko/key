import { icons, stars } from '../design/icons.js';

export const btn = ({ label, icon, kind = '', size = '', attrs = '' }) =>
  `<button class="btn ${kind} ${size}" ${attrs}>${icon ? icons[icon](32) : ''}${label ? `<span>${label}</span>` : ''}</button>`;

// Кнопка «Додому»: завжди зліва вгорі
export const homeButton = () => btn({ label: 'Додому', icon: 'home', kind: 'light', attrs: 'aria-label="Додому" data-home' });

// Імена вводять діти: у HTML вставляємо лише екрановані
export const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const speakButton = (attrs = '') =>
  `<button class="btn round light" aria-label="Послухати" ${attrs}>${icons.speaker(32)}</button>`;

export const bubble = (text, { speak = true } = {}) =>
  `<div class="bubble"><span class="bubble-text">${text}</span>${speak ? speakButton() : ''}</div>`;

export const totalStars = (n) => `<div class="pill" aria-label="Зірочок: ${n}">${stars(1, 1, 36)}<b>${n}</b></div>`;

// Тло навколо сцени: теплі екрани займають усе вікно (без сірих смужок з боків)
export const setBackdrop = (warm) => document.body.classList.toggle('is-warm', warm);
