// Демонстраційні концепції стилю для 5–6 класів. Відкриваються лише за адресами (#concepts, #voxel, #pixel, #sky),
// з екранів для 1–4 класів сюди посилань немає. Це макети: прогрес не зберігається, дані умовні.
import './concepts.css';
import './voxel.css';
import './pixel.css';
import './sky.css';
import * as voxel from './voxel.js';
import * as pixel from './pixel.js';
import * as sky from './sky.js';
import { mountTyping, av, AV_OPTIONS } from './shared.js';

export const CONCEPTS = { voxel, pixel, sky };
const TAB_IDS = ['world', 'avatar', 'type', 'rewards'];

// '#voxel/avatar' → { id: 'voxel', tab: 'avatar' }; '#concepts' → { menu: true }; інше → null
export function conceptRoute(name) {
  if (name === 'concepts') return { menu: true };
  const [id, tab = 'world'] = name.split('/');
  return CONCEPTS[id] && TAB_IDS.includes(tab) ? { id, tab } : null;
}

// Картка — не посилання, бо в мініатюрі вже є посилання меню: посилання лежить поверх картки
const thumb = (c, n) => `<div class="cm-card">
  <div class="cm-shot"><div class="cm-scale" inert>${c.screen('world')}</div></div>
  <div class="cm-num">${n}</div>
  <div class="cm-text"><h2>${c.meta.name}</h2><p>${c.meta.desc}</p></div>
  <a class="cm-link" href="#${c.meta.id}" aria-label="Концепція ${n}: ${c.meta.name}"></a></div>`;

const menu = () => `<div class="screen cn cn-menu">
  <h1>Обери стиль свого світу</h1>
  <p class="cm-lead">Відкрий кожен варіант, змінюй героя й спробуй надрукувати вправу. Потім голосуємо!</p>
  <div class="cm-row">${Object.values(CONCEPTS).map((c, i) => thumb(c, i + 1)).join('')}</div>
  <p class="cm-foot">Це макети: дані умовні, прогрес не зберігається.</p></div>`;

export function conceptScreen(route) {
  if (route.menu) return menu();
  return CONCEPTS[route.id].screen(route.tab);
}

export const conceptBackdrop = (route) => (route.menu ? '#14181f' : '#e9ecef');

export function conceptBadge(route) {
  if (route.menu) return '';
  return '<div class="cn-badge"><a href="#concepts">← Усі стилі</a></div>';
}

// Оживлення: вибір вигляду героя, вправа з друком
export function mountConcept(app, route) {
  if (route.menu) return null;
  const onClick = (e) => {
    const b = e.target.closest('[data-opt]');
    if (!b) return;
    av[b.dataset.opt] = Number(b.dataset.val);
    app.querySelectorAll(`[data-opt="${b.dataset.opt}"]`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const holder = app.querySelector('[data-avatar]');
    if (holder) holder.innerHTML = CONCEPTS[route.id].avatarSvg();
  };
  app.addEventListener('click', onClick);
  const stopTyping = route.tab === 'type' ? mountTyping(app) : null;
  return () => { app.removeEventListener('click', onClick); stopTyping?.(); };
}
export { AV_OPTIONS };
