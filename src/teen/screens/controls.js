// Спільні елементи екрана «Герой»: вибір вигляду, світу й помічника. Однакові для всіх світів (кожен світ дає лише класи оформлення).
import { HERO_OPTIONS, WORLD_IDS, WORLD_SHORT } from '../logic/profile.js';

export const TABS = [['world', 'Світ'], ['avatar', 'Герой'], ['type', 'Друк'], ['rewards', 'Нагороди']];

// Вигляд героя: ряди кнопок із кольорами / назвами
export const avatarControls = (cls, ctx) => Object.entries(HERO_OPTIONS).map(([key, o]) =>
  `<div class="${cls}-group"><h3>${o.label}</h3><div class="${cls}-row">${o.vals.map((v, i) =>
    `<button class="${cls}-opt opt-${key}" data-opt="${key}" data-val="${i}" aria-pressed="${ctx.hero[key] === i}" aria-label="${o.names ? o.names[i] : o.label + ' ' + (i + 1)}" ${key === 'hat' ? '' : `style="--sw:${v}"`}>${key === 'hat' ? `<span>${o.names[i]}</span>` : ''}</button>`).join('')}</div></div>`).join('');

// Світ, помічник і «Для дорослого» — лише у справжньому профілі (у демо їх немає)
export const settingsRows = (cls, ctx) => ctx.demo ? '' : `
  <div class="${cls}-group"><h3>Світ</h3><div class="${cls}-row">${WORLD_IDS.map((id) =>
    `<button class="${cls}-opt opt-hat" data-set-world="${id}" aria-pressed="${ctx.world === id}"><span>${WORLD_SHORT[id]}</span></button>`).join('')}</div></div>
  <div class="${cls}-group"><h3>Помічник</h3><div class="${cls}-row">
    <button class="${cls}-opt opt-hat" data-set-helper="1" aria-pressed="${ctx.helper}"><span>Показувати</span></button>
    <button class="${cls}-opt opt-hat" data-set-helper="0" aria-pressed="${!ctx.helper}"><span>Сховати</span></button>
    <a class="${cls}-opt opt-hat" href="#adult"><span>Для дорослого</span></a></div></div>`;

// Кнопка «сховати» біля помічника
export const hideHelperButton = (cls) => `<button class="${cls}-hide" data-act="hide-helper" aria-label="Сховати помічника"><span aria-hidden="true">×</span></button>`;
