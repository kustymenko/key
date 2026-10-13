// Екрани світу 5–6 класів: #teen, #teen/avatar, #teen/type, #teen/rewards, #teen/pick.
// Екрани однакові для всіх світів: світ лише малює (див. ../worlds).
import { themeOf } from '../worlds/index.js';
import { WORLD_IDS, levelInfo } from '../logic/profile.js';
import { teenContext } from './context.js';
import { mountTyping } from './typing.js';
import { worldPickHtml } from './pick.js';
import { placementScreen, mountPlacement } from './placement.js';

const TAB_IDS = ['world', 'avatar', 'type', 'rewards'];

// 'teen' → { tab: 'world' }; 'teen/pick' → { tab: 'pick' }; інакше null
export function teenRoute(name) {
  const [root, tab = 'world'] = name.split('/');
  if (root !== 'teen') return null;
  return ['pick', 'start', 'test'].includes(tab) || TAB_IDS.includes(tab) ? { tab } : null;
}

export function teenScreen(route, profile) {
  if (route.tab === 'pick' || !profile.world) return worldPickHtml({ back: 'home' });
  if (route.tab === 'start' || route.tab === 'test') return placementScreen(profile);
  return themeOf(profile.world).screen(route.tab, teenContext(profile));
}

// Оживлення: вибір світу, герой, помічник, пробна вправа
export function mountTeen(app, route, state) {
  if (route.tab === 'start' || route.tab === 'test') return mountPlacement(app, route, state);
  const store = state.store;
  const profile = () => store.get(state.profileId);
  const rerender = () => state.go(location.hash.replace('#', ''));
  const onClick = (e) => {
    const p = profile();
    if (!p) return;
    const pick = e.target.closest('[data-pick-world]');
    if (pick && WORLD_IDS.includes(pick.dataset.pickWorld)) {
      store.update(p.id, { world: pick.dataset.pickWorld });
      return state.go('teen');
    }
    const opt = e.target.closest('[data-opt]');
    if (opt) {
      const hero = { ...p.hero, [opt.dataset.opt]: Number(opt.dataset.val) };
      store.update(p.id, { hero });
      app.querySelectorAll(`[data-opt="${opt.dataset.opt}"]`).forEach((x) => x.setAttribute('aria-pressed', String(x === opt)));
      const theme = themeOf(p.world), holder = app.querySelector('[data-avatar]');
      if (holder) holder.innerHTML = theme.avatarSvg(theme.heroSize, profile().hero);
      return;
    }
    const world = e.target.closest('[data-set-world]');
    if (world) { store.update(p.id, { world: world.dataset.setWorld }); return rerender(); }
    const helper = e.target.closest('[data-set-helper]');
    if (helper) { store.update(p.id, { helperHidden: helper.dataset.setHelper === '0' }); return rerender(); }
    if (e.target.closest('[data-act="hide-helper"]')) { store.update(p.id, { helperHidden: true }); rerender(); }
  };
  app.addEventListener('click', onClick);
  const p = profile();
  const info = levelInfo(p?.xp);
  const stopTyping = route.tab === 'type' && p?.world ? mountTyping(app, { xpBase: info.xp, xpMax: info.xpMax, animate: false }) : null;
  return () => { app.removeEventListener('click', onClick); stopTyping?.(); };
}
