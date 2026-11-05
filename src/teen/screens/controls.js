// Спільні елементи екранів світу: вибір вигляду, світу, помічника, кнопка «Додому». Однакові для всіх світів (світ дає лише класи оформлення).
import { HERO_OPTIONS, WORLD_IDS } from '../logic/profile.js';
import { THEMES } from '../worlds/index.js';
import { demoContext } from './context.js';
import { icons } from '../../design/icons.js';

export const TABS = [['world', 'Світ'], ['avatar', 'Герой'], ['type', 'Друк'], ['rewards', 'Нагороди']];

// «Додому» (повернення до «Хто ти?»): є на кожному екрані кожного світу, окрім демо-сторінки
export const homeButton = (cls) => `<button class="${cls}-home" data-home aria-label="Додому">${icons.home(30)}<span>Додому</span></button>`;

// Вигляд героя: ряди кнопок із кольорами / назвами. Закритий предмет — замочок; натиснеш — рядок внизу підкаже, як його відкрити (ctx.locks)
export const LOCK_DEFAULT = 'Закрито? Натисни — підкажу, як відкрити.';
export const avatarControls = (cls, ctx) => Object.entries(HERO_OPTIONS).map(([key, o]) =>
  `<div class="${cls}-group"><h3>${o.label}</h3><div class="${cls}-row">${o.vals.map((v, i) => {
    const lock = ctx.locks?.[`${key}:${i}`] ?? '';
    const name = o.names ? o.names[i] : `${o.label} ${i + 1}`;
    return `<button class="${cls}-opt opt-${key}${lock ? ' is-locked' : ''}" data-opt="${key}" data-val="${i}" aria-pressed="${ctx.hero[key] === i}" aria-label="${lock ? `${name} (закрито). ${lock}` : name}" ${lock ? `aria-disabled="true" data-lock="${lock}"` : ''} ${key === 'hat' ? '' : `style="--sw:${v}"`}>${lock ? icons.lock(key === 'hat' ? 16 : 24) : ''}${key === 'hat' ? `<span>${o.names[i]}</span>` : ''}</button>`;
  }).join('')}</div></div>`).join('') + (Object.keys(ctx.locks ?? {}).length ? `<small class="${cls}-lockinfo" data-lockinfo aria-live="polite">${LOCK_DEFAULT}</small>` : '');

// Нагорода в колекції: відкрита показує подарунок (якщо є), закрита — підказку «як отримати» (до 6 слів)
export const rewardNote = (r) => `<small class="rw-note">${r.got ? (r.gift ? `Предмет: ${r.gift.replace(/^Одяг: /, 'одяг ').toLowerCase()}` : 'Є!') : r.hint ?? ''}</small>`;

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
  <div class="${cls}-adult-row"><a class="${cls}-adult" href="#teen/start">${icons.pencil(24)}<span>Вступний тест</span></a> <a class="${cls}-adult" href="#adult">${icons.gear(24)}<span>Для дорослого</span></a></div>`;

// Панель «Далі: урок» на карті: який урок наступний, мова, «Грай», усі уроки. Лише у справжньому профілі.
export const playBar = (cls, ctx) => {
  if (ctx.demo || !ctx.states) return '';
  const n = ctx.next;
  const label = n ? `${n.quick ? 'Швидка перевірка · ' : ''}Урок ${n.id} · ${n.title}` : ctx.challenge?.open ? 'Випробування на час · 2 хвилини' : 'Усі уроки цієї мови пройдено';
  const lang = ['ua', 'en'].map((l) => `<button class="pb-lang" data-set-layout="${l}" aria-pressed="${ctx.layout === l}">${l === 'ua' ? 'УКР' : 'ENG'}</button>`).join('');
  // Верхній рядок: що далі, мова, головна кнопка. Нижній: справжні кнопки «Усі уроки», «Світи» і (якщо відкрито) «Випробування», а не дрібні посилання
  const main = n ? `<a class="pb-go" href="#teen/lesson">Грай</a>` : ctx.challenge?.open ? `<a class="pb-chal" href="#teen/challenge">Випробування</a>` : '';
  const chal = n && ctx.challenge?.open ? `<a class="pb-btn pb-chal" href="#teen/challenge">Випробування</a>` : '';
  return `<div class="pb ${cls}-play"><div class="pb-main"><div class="pb-text"><small>${n ? 'Далі' : 'Чудово'}</small><b>${label}</b></div>
    <div class="pb-langs" role="group" aria-label="Мова курсу">${lang}</div>${main}</div>
    <nav class="pb-nav" aria-label="Розділи курсу"><a class="pb-btn" href="#teen/lessons">Усі уроки</a><a class="pb-btn" href="#teen/worlds">Світи</a>${chal}</nav></div>`;
};

// Кнопка «сховати» біля помічника
export const hideHelperButton = (cls) => `<button class="${cls}-hide" data-act="hide-helper" aria-label="Сховати помічника"><span aria-hidden="true">×</span></button>`;
