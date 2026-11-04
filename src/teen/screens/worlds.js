// Карта світів (Етап Т6): шість світів курсу. Відкриваються за курсом; закритий світ — замок і підказка, як його відкрити.
// Однаковий для всіх трьох світів: оформлення (тло, панель, шрифти) дає themeOf(world).frame.
import { themeOf } from '../worlds/index.js';
import { teenContext } from './context.js';
import { icons } from '../../design/icons.js';
import { MEDAL_NAME, MEDALS } from '../logic/challenge.js';

const STATE_TEXT = { done: 'Пройдено', now: 'Ти тут', locked: 'Закрито' };

export function worldsScreen(profile) {
  const ctx = teenContext(profile);
  const lang = ctx.layout === 'ua' ? 'українська' : 'англійська';
  const cards = ctx.progress.worlds.map((w, i) => {
    const mark = w.state === 'locked' ? icons.lock(30) : w.state === 'done' ? icons.check(30) : `<b>${i + 1}</b>`;
    const medal = w.medal ? `Медаль: ${MEDAL_NAME[MEDALS[w.medal - 1]].toLowerCase()}` : 'Медалей ще немає';
    const note = i === 5 && w.state !== 'locked' ? `<div class="wl-bar" aria-label="Медалей: ${w.medal ?? 0} з 3"><i style="width:${w.pct}%"></i></div><small>${medal}</small>` : w.state === 'locked' ? `<small class="wl-hint">${w.hint}</small>`
      : `<div class="wl-bar" aria-label="Пройдено ${w.pct}%"><i style="width:${w.pct}%"></i></div><small>${STATE_TEXT[w.state]}${w.state === 'now' ? ` · ${w.pct}%` : ''}</small>`;
    return `<div class="wl-card is-${w.state}" data-world-card="${i}"><span class="wl-mark" aria-hidden="true">${mark}</span>
      <div class="wl-body"><b>${w.name}</b><span>${w.range && w.range !== w.sub ? `${w.sub} · ${w.range}` : w.sub}</span>${note}</div></div>`;
  }).join('');
  return themeOf(profile.world).frame(ctx, `<div class="pl-step">Карта світів · ${lang}</div><h2 class="pl-h">Світи</h2>
    <div class="wl-grid">${cards}</div>
    <div class="pl-actions"><a class="pl-btn primary" href="#teen/lesson">Грай</a>${ctx.challenge.open ? '<a class="pl-btn" href="#teen/challenge">Випробування</a>' : ''}<a class="pl-btn" href="#teen">До світу</a></div>`);
}
