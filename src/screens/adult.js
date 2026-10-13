import { klavik } from '../character/klavik.js';
import { AVATARS } from '../character/avatars.js';
import { icons } from '../design/icons.js';
import { btn, homeButton, esc } from './common.js';
import { heroIconOf } from '../teen/worlds/index.js';
import { isTeen, homeRoute } from '../teen/logic/profile.js';

export const adultScreen = () => '<div class="screen screen-adult theme-warm" data-adult></div>';

// Просте завдання для дорослого: множення, яке першокласник не розв'яже
const newSum = () => { const a = 6 + Math.floor(Math.random() * 4); const b = 6 + Math.floor(Math.random() * 4); return { a, b }; };

// Для дорослого: перевірка завданням → рівень, скидання прогресу, видалення картки (з підтвердженням)
export function mountAdult(root, state) {
  const screen = root.querySelector('[data-adult]');
  const p = () => state.store.get(state.profileId);
  let sum = newSum();
  let wrong = false;

  const top = (right = '') => `<div class="topbar">${homeButton()}<div class="topbar-spacer"></div>${right}</div>`;

  function gate() {
    screen.innerHTML = `${top()}<div class="adult-main">
      <div class="adult-head">${icons.gear(56)}<h2>Для дорослого</h2></div>
      <p class="adult-sum" aria-live="polite">${sum.a} × ${sum.b} = ?</p>
      <input class="name-input sum-input" type="text" inputmode="numeric" maxlength="3" autocomplete="off" aria-label="Відповідь">
      <p class="adult-note">${wrong ? 'Спробуй ще раз' : 'Розв’яжи, щоб увійти'}</p>
      <div class="row">${btn({ label: 'Далі', icon: 'next', kind: 'primary', size: 'big', attrs: 'data-act="check"' })}</div></div>`;
    screen.querySelector('.sum-input').focus();
  }

  function panel(msg = '') {
    const prof = p();
    if (!prof) { state.go(''); return; }
    const teen = isTeen(prof.level);
    screen.innerHTML = `${top(btn({ label: teen ? 'Мій світ' : 'Карта', icon: 'map', kind: 'primary', attrs: `data-go="${homeRoute(prof)}"` }))}<div class="adult-main">
      <div class="adult-who">${teen ? heroIconOf(prof.world, prof.hero, 110) : AVATARS[prof.avatar]?.(110) ?? ''}<div class="ach-name">${esc(prof.name)}</div></div>
      <div class="adult-block"><span class="adult-label">Клас</span>
        <div class="segmented" role="group" aria-label="Клас">
          ${['1-2', '3-4', '5', '6'].map((l) => `<button class="btn seg" data-set-level="${l}" aria-pressed="${prof.level === l}">${l === '5' || l === '6' ? `${l} клас` : `${l.replace('-', '–')} клас`}</button>`).join('')}
        </div></div>
      <div class="row">
        ${btn({ label: 'Скинути прогрес', icon: 'replay', kind: 'light', attrs: 'data-ask="reset"' })}
        ${btn({ label: 'Видалити картку', icon: 'trash', kind: 'light', attrs: 'data-ask="delete"' })}
      </div>
      <p class="adult-note" role="status">${msg}</p></div>`;
  }

  function confirm(kind) {
    const prof = p();
    const text = kind === 'reset'
      ? `Скинути прогрес: ${esc(prof.name)}? Зірочки й значки зникнуть.`
      : kind.startsWith('level:')
        ? `Змінити клас: ${esc(prof.name)} → ${kind.slice(6)} клас? Прогрес і вивчені літери збережуться.`
        : `Видалити картку: ${esc(prof.name)}? Її не можна повернути.`;
    const isLevel = kind.startsWith('level:');
    screen.insertAdjacentHTML('beforeend', `<div class="pause-layer confirm-layer" role="dialog" aria-label="Підтвердження">
      <div>${klavik('think', 170)}</div>
      <p class="confirm-text">${text}</p>
      <div class="row">${btn({ label: 'Ні, лишити', icon: 'back', kind: 'primary', size: 'big', attrs: 'data-act="cancel"' })}
        ${btn({ label: isLevel ? 'Так, змінити' : kind === 'reset' ? 'Так, скинути' : 'Так, видалити', icon: isLevel ? 'check' : kind === 'reset' ? 'replay' : 'trash', kind: 'light', size: 'big', attrs: `data-do="${kind}"` })}</div></div>`);
  }

  const onClick = (e) => {
    const b = e.target.closest('[data-act],[data-ask],[data-do],[data-set-level]');
    if (!b) return;
    if (b.dataset.act === 'check') return check();
    if (b.dataset.act === 'cancel') return screen.querySelector('.confirm-layer')?.remove();
    if (b.dataset.ask) return confirm(b.dataset.ask);
    if (b.dataset.setLevel) {
      if (b.dataset.setLevel === p().level) return;
      return confirm(`level:${b.dataset.setLevel}`); // зміна класу — лише після підтвердження
    }
    if (b.dataset.do?.startsWith('level:')) {
      const level = b.dataset.do.slice(6);
      state.store.update(state.profileId, { level }); // прогрес не чіпаємо: літери, зірочки, значки лишаються
      state.level = level;
      return panel(isTeen(level) && !p().world ? 'Готово. Наступного разу учень обере світ.' : 'Готово');
    }
    if (b.dataset.do === 'reset') {
      state.store.resetProgress(state.profileId);
      state.openProfile(state.profileId); // оновити посилання на прогрес
      return panel('Прогрес скинуто');
    }
    if (b.dataset.do === 'delete') {
      state.store.remove(state.profileId);
      state.closeProfile();
      state.go('');
    }
  };
  function check() {
    const v = screen.querySelector('.sum-input')?.value.trim();
    if (v === String(sum.a * sum.b)) panel();
    else { wrong = true; sum = newSum(); gate(); }
  }
  const onKey = (e) => { if (e.key === 'Enter' && e.target.matches?.('.sum-input')) check(); };
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKey);
  gate();
  return () => { root.removeEventListener('click', onClick); root.removeEventListener('keydown', onKey); };
}
