import { klavik } from '../character/klavik.js';
import { keyboard, hands } from '../keyboard/onscreen.js';
import { attachLiveKeyboard, setKeyboardLayout } from '../keyboard/live.js';
import { ROWS } from '../keyboard/layouts.js';
import { bubble, homeButton } from './common.js';

const SERVICE = new Set(['Backspace', 'Tab', 'CapsLock', 'Enter', 'ShiftLeft', 'ShiftRight']);
const NAMES = { ua: 'УКР', en: 'ENG' };

// Підказка «Перемкни мову: Alt + Shift» з картинкою клавіш
export const layoutHint = (layout) =>
  `<div class="bubble layout-hint" role="status" aria-label="Перемкни мову: Alt+Shift">
    <span class="bubble-text">Перемкни мову:</span>
    <span class="keycap">Alt</span><span class="keys-plus">+</span><span class="keycap">Shift</span>
    <span class="lang-chip" aria-label="Потрібна мова">${NAMES[layout]}</span>
  </div>`;

const pressedBubble = (label) => bubble(`Це клавіша ${label}`, { speak: false });

// Екран «Спробуй клавіатуру»: натискай справжні клавіші — вони світяться на екранній
export function keyboardScreen({ layout = 'ua' } = {}) {
  const seg = ['ua', 'en']
    .map((l) => `<button class="btn seg" data-kb-layout="${l}" aria-pressed="${l === layout}">${l === 'ua' ? 'Українська' : 'English'}</button>`)
    .join('');
  return `<div class="screen screen-keys theme-neutral" data-layout-now="${layout}">
    <div class="topbar">${homeButton()}<div class="topbar-spacer"></div>
      <div class="segmented" role="group" aria-label="Мова клавіатури">${seg}</div></div>
    <div class="task-card">
      <div class="task-klavik" data-klavik>${klavik('think', 150)}</div>
      <div class="task-main">
        <div class="press-key is-empty" data-press aria-live="polite">?</div>
        <div class="keys-msg" data-msg>${bubble('Натисни клавішу', { speak: false })}</div>
      </div>
    </div>
    <div class="play-row">
      ${keyboard({ layout, rows: ROWS })}
      ${hands({ active: null })}
    </div>
  </div>`;
}

// Оживляє екран: слухає справжню клавіатуру. Повертає функцію «вимкнути».
export function mountKeyboardScreen(root, state) {
  const screen = root.querySelector('.screen-keys');
  let layout = state.layout;
  const press = screen.querySelector('[data-press]');
  const msg = screen.querySelector('[data-msg]');
  const face = screen.querySelector('[data-klavik]');

  const setLayout = (l) => {
    layout = state.layout = l;
    screen.dataset.layoutNow = l;
    screen.querySelectorAll('[data-kb-layout]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kbLayout === l)));
    setKeyboardLayout(screen, l);
  };

  const onClick = (e) => {
    const b = e.target.closest('[data-kb-layout]');
    if (!b) return;
    setLayout(b.dataset.kbLayout);
    msg.innerHTML = bubble('Натисни клавішу', { speak: false });
    b.blur(); // щоб пробіл і Enter не «натискали» кнопку
  };
  screen.addEventListener('click', onClick);

  const stop = attachLiveKeyboard(screen, {
    getLayout: () => layout,
    onKey: ({ code, label, kind }) => {
      press.textContent = label || '?';
      press.classList.remove('is-empty');
      press.classList.toggle('is-service', SERVICE.has(code) || label.length > 1);
      if (kind === 'wrong-layout') {
        msg.innerHTML = layoutHint(layout);
        face.innerHTML = klavik('think', 150);
      } else if (kind === 'ok') {
        msg.innerHTML = pressedBubble(label);
        face.innerHTML = klavik('joy', 150);
      } else if (kind === 'other') {
        msg.innerHTML = bubble('Ось ця клавіша', { speak: false });
      }
    },
  });
  return () => { screen.removeEventListener('click', onClick); stop(); };
}
