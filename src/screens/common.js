import { icons, stars } from '../design/icons.js';

export const btn = ({ label, icon, kind = '', size = '', attrs = '' }) =>
  `<button class="btn ${kind} ${size}" ${attrs}>${icon ? icons[icon](32) : ''}${label ? `<span>${label}</span>` : ''}</button>`;

// Кнопка «Додому»: завжди зліва вгорі
export const homeButton = () => btn({ label: 'Додому', icon: 'home', kind: 'light', attrs: 'aria-label="Додому" data-home' });

export const speakButton = () =>
  `<button class="btn round light" aria-label="Послухати">${icons.speaker(32)}</button>`;

export const bubble = (text, { speak = true } = {}) =>
  `<div class="bubble"><span class="bubble-text">${text}</span>${speak ? speakButton() : ''}</div>`;

export const totalStars = (n) => `<div class="pill" aria-label="Зірочок: ${n}">${stars(1, 1, 36)}<b>${n}</b></div>`;
