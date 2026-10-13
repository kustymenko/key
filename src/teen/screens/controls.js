// Спільні елементи екранів світу: вибір вигляду, світу, помічника, кнопка «Додому». Однакові для всіх світів (світ дає лише класи оформлення).
import { HERO_OPTIONS, WORLD_IDS } from '../logic/profile.js';
import { THEMES } from '../worlds/index.js';
import { demoContext } from './context.js';
import { icons } from '../../design/icons.js';

export const TABS = [['world', 'Світ'], ['avatar', 'Герой'], ['type', 'Друк'], ['rewards', 'Нагороди']];

// «Додому» (повернення до «Хто ти?»): є на кожному екрані кожного світу, окрім демо-сторінки
export const homeButton = (cls) => `<button class="${cls}-home" data-home aria-label="Додому">${icons.home(30)}<span>Додому</span></button>`;

// Вигляд героя: ряди кнопок із кольорами / назвами
export const avatarControls = (cls, ctx) => Object.entries(HERO_OPTIONS).map(([key, o]) =>
  `<div class="${cls}-group"><h3>${o.label}</h3><div class="${cls}-row">${o.vals.map((v, i) =>
    `<button class="${cls}-opt opt-${key}" data-opt="${key}" data-val="${i}" aria-pressed="${ctx.hero[key] === i}" aria-label="${o.names ? o.names[i] : o.label + ' ' + (i + 1)}" ${key === 'hat' ? '' : `style="--sw:${v}"`}>${key === 'hat' ? `<span>${o.names[i]}</span>` : ''}</button>`).join('')}</div></div>`).join('');

// Змінити світ: мініатюри карт трьох світів. Поверх мініатюри лежить кнопка (мініатюра сама не клікабельна).
const worldThumbs = (cls, ctx) => WORLD_IDS.map((id) => {
  const t = THEMES[id];
  return `<div class="wt wt-${id} ${ctx.world === id ? 'is-on' : ''}"><div class="wt-shot"><div class="wt-scale" inert>${t.screen('world', demoContext({ base: `#${id}` }))}</div></div>
    <span class="wt-name">${t.meta.short}</span>
    <button class="wt-btn" data-set-world="${id}" aria-pressed="${ctx.world === id}" aria-label="Змінити світ: ${t.meta.name}"></button></div>`;
}).join('');

// «Змінити світ» і «Помічник» — лише у справжньому профілі (у демо їх немає); «Для дорослого» — окремою кнопкою
export const settingsRows = (cls, ctx) => ctx.demo ? '' : `
  <div class="${cls}-group"><h3>Змінити світ</h3><div class="wt-row">${worldThumbs(cls, ctx)}</div></div>
  <div class="${cls}-group"><h3>Помічник</h3><div class="${cls}-row">
    <button class="${cls}-opt opt-hat" data-set-helper="1" aria-pressed="${ctx.helper}"><span>Показувати</span></button>
    <button class="${cls}-opt opt-hat" data-set-helper="0" aria-pressed="${!ctx.helper}"><span>Сховати</span></button></div></div>
  <div class="${cls}-adult-row"><a class="${cls}-adult" href="#adult">${icons.gear(24)}<span>Для дорослого</span></a></div>`;

// Кнопка «сховати» біля помічника
export const hideHelperButton = (cls) => `<button class="${cls}-hide" data-act="hide-helper" aria-label="Сховати помічника"><span aria-hidden="true">×</span></button>`;
