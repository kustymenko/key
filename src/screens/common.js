import { icons, stars } from '../design/icons.js';
import { PHRASE_SPEECH } from '../audio/settings.js';
import { sfx } from '../audio/sfx.js';
import { klavik } from '../character/klavik.js';
import { pickPhrase, BREAK_PHRASES, BREAK_TIPS } from '../content/phrases.js';

export const btn = ({ label, icon, kind = '', size = '', attrs = '' }) =>
  `<button class="btn ${kind} ${size}" ${attrs}>${icon ? icons[icon](32) : ''}${label ? `<span>${label}</span>` : ''}</button>`;

// Кнопка «Додому»: завжди зліва вгорі
export const homeButton = () => btn({ label: 'Додому', icon: 'home', kind: 'light', attrs: 'aria-label="Додому" data-home' });

// Імена вводять діти: у HTML вставляємо лише екрановані
export const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Кнопка-динамік біля фрази: поки озвучку фраз вимкнено (PHRASE_SPEECH), кнопок немає
export const speakButton = (attrs = '') => !PHRASE_SPEECH ? '' :
  `<button class="btn round light" aria-label="Послухати" ${attrs}>${icons.speaker(32)}</button>`;

export const bubble = (text, { speak = PHRASE_SPEECH } = {}) =>
  `<div class="bubble"><span class="bubble-text">${text}</span>${speak ? speakButton() : ''}</div>`;

export const totalStars = (n) => `<div class="pill" aria-label="Зірочок: ${n}">${stars(1, 1, 36)}<b>${n}</b></div>`;

// Тло навколо сцени: теплі екрани займають усе вікно (без сірих смужок з боків)
export const setBackdrop = (warm) => document.body.classList.toggle('is-warm', warm);

// Перемикач звукових ефектів: однаково виглядає скрізь, стан беремо з sfx (форма, а не лише колір)
export const soundButton = () => {
  const on = sfx.isEnabled();
  return `<button class="btn round light sound-toggle" data-sound ${on ? '' : 'data-off'} aria-label="${on ? 'Звуки: увімкнено' : 'Звуки: вимкнено'}">${on ? icons.sound(32) : icons.soundOff(32)}</button>`;
};

// Пропозиція перерви: поверх екрана завершення. Дитина обирає сама — «Відпочити» (додому) або «Ще трохи».
// Нічого не примушує і не лічить час уголос.
export function offerBreak(host, state) {
  if (!state.activity?.due()) return;
  const layer = document.createElement('div');
  layer.className = 'pause-layer break-layer';
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-label', 'Перерва');
  layer.innerHTML = `<div>${klavik('rest', 200)}</div>
    <div class="bubble"><span class="bubble-text">${pickPhrase(BREAK_PHRASES)}</span></div>
    <div class="break-tip">${icons.eye(48)}<span>${pickPhrase(BREAK_TIPS)}</span></div>
    <div class="row">${btn({ label: 'Відпочити', icon: 'home', kind: 'primary', size: 'big', attrs: 'data-home' })}${btn({ label: 'Ще трохи', icon: 'play', kind: 'light', size: 'big', attrs: 'data-act="keep-going"' })}</div>`;
  layer.addEventListener('click', (e) => {
    if (e.target.closest('[data-act="keep-going"]')) { state.activity.reset(); layer.remove(); }
  });
  host.appendChild(layer);
}
