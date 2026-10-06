import { klavik } from '../character/klavik.js';
import { keyboard, hands } from '../keyboard/onscreen.js';
import { fingerOf } from '../keyboard/fingers.js';
import { icons, stars } from '../design/icons.js';
import { btn, homeButton, bubble } from './common.js';

const WORD = ['в', 'о', 'д', 'а'];

// Екран вправи. hint: 'next' — спокійна підказка, 'error' — після помилки
export function exerciseScreen({ hint = 'next', layout = 'ua' } = {}) {
  const idx = 1;
  const next = 'KeyJ'; // «о» на клавіші J
  const letters = WORD.map((ch, i) => `<span class="task-ch ${i < idx ? 'is-done' : i === idx ? 'is-current' : ''}">${ch}</span>`).join('');
  const text = hint === 'error' ? 'Ось ця клавіша' : 'Знайди О';
  const dots = WORD.map((_, i) => `<i class="dot ${i < idx ? 'is-on' : ''}"></i>`).join('');
  return `<div class="screen screen-exercise theme-neutral">
    <div class="topbar">${homeButton()}<div class="progress-dots" aria-hidden="true">${dots}</div>
      ${btn({ label: 'Пауза', icon: 'pause', kind: 'light', attrs: 'aria-label="Пауза"' })}</div>
    <div class="task-card">
      <div class="task-klavik">${klavik(hint === 'error' ? 'cheer' : 'think', 150)}</div>
      <div class="task-main">
        <div class="task-text" aria-label="Завдання">${letters}</div>
        ${bubble(text)}
      </div>
    </div>
    <div class="play-row">
      ${keyboard({ layout, next, hint })}
      ${hands({ active: fingerOf(next), hint })}
    </div>
  </div>`;
}
