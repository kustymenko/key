import { klavik } from '../character/klavik.js';
import { AVATARS, AVATAR_NAMES } from '../character/avatars.js';
import { icons } from '../design/icons.js';
import { btn, homeButton, bubble, esc } from './common.js';
import { MAX_NAME } from '../storage/store.js';

const PAGES = [['fox', 'hedgehog', 'cat', 'bear'], ['rabbit', 'owl', 'frog', 'penguin']]; // не більше 4–5 варіантів на екрані

export const newProfileScreen = () => '<div class="screen screen-new theme-warm" data-new></div>';

// Три кроки: ім'я → тваринка → клас. Прогрес кроків — лише в пам'яті, дитина створюється в кінці.
export function mountNewProfile(root, state) {
  const screen = root.querySelector('[data-new]');
  const w = { step: 1, name: '', avatar: null, page: 0 };
  const top = () => `<div class="topbar">${homeButton()}</div>`;
  const back = () => btn({ label: 'Назад', icon: 'back', kind: 'light', size: 'big', attrs: 'data-act="back"' });

  function paint() {
    if (w.step === 1) {
      screen.innerHTML = `${top()}<div class="new-main">
        <div class="new-head">${klavik('cheer', 190)}${bubble('Як тебе звати?', { speak: false })}</div>
        <input class="name-input" type="text" maxlength="${MAX_NAME}" value="${esc(w.name)}" autocomplete="off" autocapitalize="words" spellcheck="false" aria-label="Як тебе звати?">
        <div class="row">${btn({ label: 'Далі', icon: 'next', kind: 'primary', size: 'big', attrs: 'data-act="name-next"' })}</div></div>`;
      const input = screen.querySelector('.name-input');
      const next = screen.querySelector('[data-act="name-next"]');
      const sync = () => { next.disabled = !input.value.trim(); };
      input.addEventListener('input', sync);
      sync();
      input.focus();
    } else if (w.step === 2) {
      const pics = PAGES[w.page]
        .map((a) => `<button class="avatar-pick" data-avatar="${a}" aria-label="${AVATAR_NAMES[a]}" aria-pressed="${w.avatar === a}">${AVATARS[a](130)}<span>${AVATAR_NAMES[a]}</span></button>`)
        .join('');
      screen.innerHTML = `${top()}<div class="new-main">
        <div class="new-head">${klavik('joy', 150)}${bubble('Обери тваринку', { speak: false })}</div>
        <div class="avatar-picks">${pics}<button class="btn round light" data-act="more" aria-label="Ще тваринки">${icons.next(32)}</button></div>
        <div class="row">${back()}${btn({ label: 'Далі', icon: 'next', kind: 'primary', size: 'big', attrs: `data-act="avatar-next" ${w.avatar ? '' : 'disabled'}` })}</div></div>`;
    } else {
      screen.innerHTML = `${top()}<div class="new-main">
        <div class="new-head">${klavik('cheer', 150)}${bubble('Який ти клас?', { speak: false })}</div>
        <div class="level-picks">
          <button class="level-pick" data-level-pick="1-2"><b>1–2</b><span>клас</span></button>
          <button class="level-pick" data-level-pick="3-4"><b>3–4</b><span>клас</span></button>
        </div>
        <div class="row">${back()}</div></div>`;
    }
  }

  const goName = () => {
    const v = screen.querySelector('.name-input')?.value.trim();
    if (!v) return;
    w.name = v;
    w.step = 2;
    paint();
  };

  const onClick = (e) => {
    const b = e.target.closest('[data-act],[data-avatar],[data-level-pick]');
    if (!b || b.disabled) return;
    if (b.dataset.act === 'name-next') goName();
    else if (b.dataset.act === 'avatar-next' && w.avatar) { w.step = 3; paint(); }
    else if (b.dataset.act === 'more') { w.page = (w.page + 1) % PAGES.length; paint(); }
    else if (b.dataset.act === 'back') { w.step -= 1; paint(); }
    else if (b.dataset.avatar) { w.avatar = b.dataset.avatar; paint(); }
    else if (b.dataset.levelPick) {
      const p = state.store.create({ name: w.name, avatar: w.avatar, level: b.dataset.levelPick });
      if (p) { state.openProfile(p.id); state.go('map'); } else state.go('');
    }
  };
  const onKey = (e) => { if (e.key === 'Enter' && w.step === 1 && e.target.matches?.('.name-input')) goName(); };
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKey);
  paint();
  return () => { root.removeEventListener('click', onClick); root.removeEventListener('keydown', onKey); };
}
