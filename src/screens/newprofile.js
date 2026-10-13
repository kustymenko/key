import { klavik } from '../character/klavik.js';
import { AVATARS, AVATAR_NAMES } from '../character/avatars.js';
import { icons } from '../design/icons.js';
import { btn, homeButton, bubble, esc } from './common.js';
import { MAX_NAME } from '../storage/store.js';
import { setBackdrop } from './common.js';
import { worldPickInner } from '../teen/screens/pick.js';
import { WORLD_IDS, isTeen, homeRoute, DEFAULT_HERO } from '../teen/logic/profile.js';

const PAGES = [['fox', 'hedgehog', 'cat', 'bear'], ['rabbit', 'owl', 'frog', 'penguin']]; // не більше 4–5 варіантів на екрані

export const newProfileScreen = () => '<div class="screen screen-new theme-warm" data-new></div>';

// Кроки: ім'я → клас → (1–4 клас: тваринка) або (5–6 клас: свій світ). Прогрес кроків — лише в пам'яті, профіль створюється в кінці.
export function mountNewProfile(root, state) {
  const screen = root.querySelector('[data-new]');
  const w = { step: 1, name: '', avatar: null, page: 0, level: null };
  const dark = (on) => { setBackdrop(!on); document.body.style.background = on ? '#14181f' : ''; }; // крок «світ» — темний, «дорослий»
  const top = () => `<div class="topbar">${homeButton()}</div>`;
  const back = () => btn({ label: 'Назад', icon: 'back', kind: 'light', size: 'big', attrs: 'data-act="back"' });

  function paint() {
    const animalStep = w.step === 3 && !isTeen(w.level);
    const worldStep = w.step === 3 && isTeen(w.level);
    // «Ім'я» і «клас» — нейтральні, без Клавика (ще невідомо, з якого учень класу); тваринка — дитяча, тепла
    if (!worldStep) { screen.className = `screen screen-new ${animalStep ? 'theme-warm' : 'theme-neutral'}`; dark(false); setBackdrop(animalStep); }
    if (w.step === 1) {
      screen.innerHTML = `${top()}<div class="new-main">
        <h1 class="new-title">Як тебе звати?</h1>
        <input class="name-input" type="text" maxlength="${MAX_NAME}" value="${esc(w.name)}" autocomplete="off" autocapitalize="words" spellcheck="false" aria-label="Як тебе звати?">
        <div class="row">${btn({ label: 'Далі', icon: 'next', kind: 'primary', size: 'big', attrs: 'data-act="name-next"' })}</div></div>`;
      const input = screen.querySelector('.name-input');
      const next = screen.querySelector('[data-act="name-next"]');
      const sync = () => { next.disabled = !input.value.trim(); };
      input.addEventListener('input', sync);
      sync();
      input.focus();
    } else if (w.step === 2) {
      screen.innerHTML = `${top()}<div class="new-main">
        <h1 class="new-title">Який ти клас?</h1>
        <div class="level-picks is-four">
          ${[['1-2', '1–2'], ['3-4', '3–4'], ['5', '5'], ['6', '6']].map(([v, t]) => `<button class="level-pick" data-level-pick="${v}"><b>${t}</b><span>клас</span></button>`).join('')}
        </div>
        <div class="row">${back()}</div></div>`;
    } else if (w.step === 3 && isTeen(w.level)) {
      screen.className = 'screen cn cn-menu cn-pick';
      dark(true);
      screen.innerHTML = worldPickInner({ back: 'back' });
    } else {
      const pics = PAGES[w.page]
        .map((a) => `<button class="avatar-pick" data-avatar="${a}" aria-label="${AVATAR_NAMES[a]}" aria-pressed="${w.avatar === a}">${AVATARS[a](130)}<span>${AVATAR_NAMES[a]}</span></button>`)
        .join('');
      screen.innerHTML = `${top()}<div class="new-main">
        <div class="new-head">${klavik('joy', 150)}${bubble('Обери тваринку', { speak: false })}</div>
        <div class="avatar-picks">${pics}<button class="btn round light" data-act="more" aria-label="Ще тваринки">${icons.next(32)}</button></div>
        <div class="row">${back()}${btn({ label: 'Далі', icon: 'next', kind: 'primary', size: 'big', attrs: `data-act="avatar-next" ${w.avatar ? '' : 'disabled'}` })}</div></div>`;
    }
  }

  const goName = () => {
    const v = screen.querySelector('.name-input')?.value.trim();
    if (!v) return;
    w.name = v;
    w.step = 2;
    paint();
  };

  const finish = (extra) => {
    const p = state.store.create({ name: w.name, avatar: w.avatar ?? 'fox', level: w.level, ...extra });
    if (p) { state.openProfile(p.id); state.go(homeRoute(p)); } else state.go('');
  };
  const onClick = (e) => {
    const b = e.target.closest('[data-act],[data-avatar],[data-level-pick],[data-pick-world]');
    if (!b || b.disabled) return;
    if (b.dataset.act === 'name-next') goName();
    else if (b.dataset.act === 'avatar-next' && w.avatar) finish({});
    else if (b.dataset.act === 'more') { w.page = (w.page + 1) % PAGES.length; paint(); }
    else if (b.dataset.act === 'back') { w.step -= 1; paint(); }
    else if (b.dataset.avatar) { w.avatar = b.dataset.avatar; paint(); }
    else if (b.dataset.levelPick) { w.level = b.dataset.levelPick; w.step = 3; paint(); }
    else if (b.dataset.pickWorld && WORLD_IDS.includes(b.dataset.pickWorld)) finish({ world: b.dataset.pickWorld, hero: DEFAULT_HERO });
  };
  const onKey = (e) => { if (e.key === 'Enter' && w.step === 1 && e.target.matches?.('.name-input')) goName(); };
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKey);
  paint();
  return () => { root.removeEventListener('click', onClick); root.removeEventListener('keydown', onKey); dark(false); };
}
