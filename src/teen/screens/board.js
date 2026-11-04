// Розділ «Результати» (Етап Т8): мій прогрес порівняно з минулими спробами + (якщо не вимкнено дорослим) перша п'ятірка ноутбука.
// Не на головному екрані: сюди ведуть кнопки з екрана випробування. Однаковий для всіх світів: оформлення дає themeOf(world).frame.
import { themeOf } from '../worlds/index.js';
import { teenContext } from './context.js';
import { gradeOf } from '../logic/challenge.js';
import { BOARD_SIZE, boardRows, boardNote, progressOf, signed } from '../logic/board.js';
import { getLaptopFlag, BOARD_OFF_FLAG } from '../../storage/laptop.js';
import { esc } from '../../screens/common.js';

export const boardEnabled = () => !getLaptopFlag(BOARD_OFF_FLAG);
// Підпис кнопки, що веде в розділ: коли таблицю вимкнено, кнопки «до таблиці» немає — лишається лише «Мій прогрес»
export const boardLinkLabel = () => (boardEnabled() ? 'Результати' : 'Мій прогрес');

const langLabel = (l) => (l === 'ua' ? 'українська' : 'англійська');

// Стовпчики останніх спроб: число зверху, висота ~ швидкість, точність знизу. Остання спроба — з рамкою (форма, а не лише колір)
function barsHtml(p) {
  if (!p.hist.length) return '<p class="bd-empty">Спроб ще немає.</p>';
  const max = Math.max(...p.hist.map((h) => h.cpm), 1);
  const cols = p.hist.map((h, i) => `<li class="${i === p.hist.length - 1 ? 'is-last' : ''}"><b>${h.cpm}</b><i style="height:${Math.max(6, Math.round((h.cpm / max) * 70))}px"></i><small>${h.acc}%</small></li>`).join('');
  const label = p.hist.map((h, i) => `спроба ${i + 1}: ${h.cpm} знаків за хвилину, точність ${h.acc}%`).join('; ');
  return `<ol class="bd-bars" aria-label="${label}">${cols}</ol><small class="bd-cap">Знаків за хвилину; внизу — точність. Остання спроба в рамці.</small>`;
}

export function boardScreen(profile, profiles = []) {
  const ctx = teenContext(profile);
  const layout = ctx.layout;
  const grade = gradeOf(profile.level);
  const enabled = boardEnabled();
  const p = progressOf(profile.challenge?.rec?.[layout]);
  const lang = ['ua', 'en'].map((l) => `<button class="pl-pill" data-set-layout="${l}" aria-pressed="${layout === l}">${l === 'ua' ? 'УКР' : 'ENG'}</button>`).join('');

  const compare = p.prev
    ? `<div class="ld-chips bd-chips"><span>Минулого разу <b>${p.prev.cpm}</b></span><span>Зараз <b>${p.last.cpm}</b></span><span>Різниця <b>${signed(p.dCpm)}</b></span><span>Точність <b>${p.prev.acc}% → ${p.last.acc}%</b></span></div>`
    : '';
  const since = p.sinceFirst !== null ? `<p class="bd-p">Від першої показаної спроби до найкращої: <b>${signed(p.sinceFirst)}</b> знаків за хвилину.</p>` : '';
  const mine = `<section class="bd-card" aria-label="Мій прогрес">
    <h3 class="bd-h">Мій прогрес</h3>
    <div class="ld-chips bd-chips"><span>Мій рекорд <b>${p.bestCpm || '—'}</b></span><span>Рекорд точності <b>${p.bestAcc ? `${p.bestAcc}%` : '—'}</b></span><span>Спроб <b>${p.runs}</b></span></div>
    ${compare}${since}<p class="bd-p">${p.line}</p>${barsHtml(p)}</section>`;

  let board = '';
  if (enabled) {
    const rows = boardRows(profiles, grade, layout, true);
    const note = boardNote(profile, rows, layout);
    const list = rows.length
      ? `<ol class="bd-rows">${rows.map((r) => `<li class="${r.id === profile.id ? 'is-me' : ''}"><span class="bd-place">${r.place}</span><span class="bd-name">${esc(r.name)}${r.id === profile.id ? ' (ти)' : ''}</span><span class="bd-cpm"><b>${r.cpm}</b></span><span class="bd-acc">${r.acc}%</span></li>`).join('')}</ol>`
      : '<p class="bd-empty">Поки що порожньо. Першим може стати будь-хто.</p>';
    board = `<section class="bd-card" aria-label="П’ятірка ноутбука">
      <h3 class="bd-h">П’ятірка ноутбука · ${grade} клас</h3>
      <small class="bd-cap">Знаків за хвилину і точність</small>
      ${list}<p class="bd-p">${note.line}</p>
      <small class="bd-cap">Лише цей ноутбук. Враховується швидкість при точності від 95%. Показано до ${BOARD_SIZE} найкращих.</small></section>`;
  }

  return themeOf(profile.world).frame(ctx, `<div class="pl-step">${enabled ? 'Результати' : 'Мій прогрес'} · ${langLabel(layout)}</div>
    <h2 class="pl-h">${enabled ? 'Мої результати і п’ятірка' : 'Мій прогрес'}</h2>
    <div class="bd-grid ${enabled ? '' : 'is-solo'}">${mine}${board}</div>
    <div class="pl-actions"><a class="pl-btn primary" href="#teen/challenge">Випробування</a><span class="pb-langs" role="group" aria-label="Мова">${lang}</span><a class="pl-btn" href="#teen">До світу</a></div>`);
}
