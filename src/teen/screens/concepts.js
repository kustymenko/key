// Сторінка для вчителя: #concepts (вибір із трьох), #voxel, #pixel, #sky і вкладки /avatar, /type, /rewards. Дані умовні, нічого не зберігається.
import { THEMES } from '../worlds/index.js';
import { DEFAULT_HERO } from '../logic/profile.js';
import { demoContext } from './context.js';
import { mountTyping } from './typing.js';

export const CONCEPTS = THEMES;
const TAB_IDS = ['world', 'avatar', 'type', 'rewards'];
const demoHero = { ...DEFAULT_HERO }; // у демо вигляд героя пам'ятається лише в пам'яті сторінки

// '#voxel/avatar' → { id: 'voxel', tab: 'avatar' }; '#concepts' → { menu: true }; інше → null
export function conceptRoute(name) {
  if (name === 'concepts') return { menu: true };
  const [id, tab = 'world'] = name.split('/');
  return CONCEPTS[id] && TAB_IDS.includes(tab) ? { id, tab } : null;
}

const ctxFor = (id) => demoContext({ base: `#${id}`, hero: demoHero, world: id });

const thumb = (c, n) => `<div class="cm-card">
  <div class="cm-shot"><div class="cm-scale" inert>${c.screen('world', ctxFor(c.meta.id))}</div></div>
  <div class="cm-num">${n}</div>
  <div class="cm-text"><h2>${c.meta.name}</h2><p>${c.meta.desc}</p></div>
  <a class="cm-link" href="#${c.meta.id}" aria-label="Світ ${n}: ${c.meta.name}"></a></div>`;

const menu = () => `<div class="screen cn cn-menu">
  <h1>Три світи для 5–6 класів</h1>
  <p class="cm-lead">Кожен учень обирає свій світ. Відкрий кожен, змін героя й спробуй надрукувати вправу.</p>
  <div class="cm-row">${Object.values(CONCEPTS).map((c, i) => thumb(c, i + 1)).join('')}</div>
  <p class="cm-foot">Це макети: дані умовні, прогрес не зберігається.</p></div>`;

export function conceptScreen(route) {
  if (route.menu) return menu();
  return CONCEPTS[route.id].screen(route.tab, ctxFor(route.id));
}

export const conceptBackdrop = (route) => (route.menu ? '#14181f' : '#e9ecef');

export function conceptBadge(route) {
  if (route.menu) return '';
  return '<div class="cn-badge"><a href="#concepts">← Усі світи</a></div>';
}

// Оживлення: вибір вигляду героя, вправа з друком
export function mountConcept(app, route) {
  if (route.menu) return null;
  const onClick = (e) => {
    const b = e.target.closest('[data-opt]');
    if (!b) return;
    demoHero[b.dataset.opt] = Number(b.dataset.val);
    app.querySelectorAll(`[data-opt="${b.dataset.opt}"]`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const holder = app.querySelector('[data-avatar]');
    if (holder) holder.innerHTML = CONCEPTS[route.id].avatarSvg(CONCEPTS[route.id].heroSize, demoHero);
  };
  app.addEventListener('click', onClick);
  const stopTyping = route.tab === 'type' ? mountTyping(app, { xpBase: 340, xpMax: 500, animate: true }) : null;
  return () => { app.removeEventListener('click', onClick); stopTyping?.(); };
}
