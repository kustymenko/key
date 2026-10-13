// Вибір світу: три картки (мініатюри світів). Використовується при створенні профілю і для змінення світу.
import { THEMES } from '../worlds/index.js';
import { WORLD_IDS } from '../logic/profile.js';
import { demoContext } from './context.js';
import { btn, homeButton } from '../../screens/common.js';

export const WORLD_CARDS_CLASS = 'cm-row';

// back: 'home' — кнопка «Додому»; 'back' — «Назад» (під час створення профілю)
export function worldPickInner({ back = 'home', title = 'Обери свій світ' } = {}) {
  const cards = WORLD_IDS.map((id, i) => {
    const t = THEMES[id];
    return `<div class="cm-card">
      <div class="cm-shot"><div class="cm-scale" inert>${t.screen('world', demoContext({ base: `#${id}` }))}</div></div>
      <div class="cm-num">${i + 1}</div>
      <div class="cm-text"><h2>${t.meta.name}</h2><p>${t.meta.desc}</p></div>
      <button class="cm-link" data-pick-world="${id}" aria-label="Світ: ${t.meta.name}"></button></div>`;
  }).join('');
  const nav = back === 'home' ? homeButton() : btn({ label: 'Назад', icon: 'back', kind: 'light', attrs: 'data-act="back"' });
  return `<div class="pick-top">${nav}</div>
    <h1>${title}</h1>
    <p class="cm-lead">Світ змінює лише вигляд. Уроки й прогрес однакові. Змінити світ можна будь-коли в розділі «Герой».</p>
    <div class="cm-row">${cards}</div>`;
}
export const worldPickHtml = (opts) => `<div class="screen cn cn-menu cn-pick">${worldPickInner(opts)}</div>`;
