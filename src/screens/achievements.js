import { klavik } from '../character/klavik.js';
import { AVATARS } from '../character/avatars.js';
import { icons, stars } from '../design/icons.js';
import { badge } from '../design/badges.js';
import { BADGES } from '../content/badges.js';
import { btn, homeButton, esc, soundButton } from './common.js';
import { totalStars, lessonsDone } from '../storage/badges.js';
import { learnedCount } from '../lessons/course.js';
import { accuracy, charsPerMinute, hardLetters } from '../lessons/stats.js';
import { plural } from '../content/phrases.js';

// Скільки літер дитина вже знає в курсі (за найдальшим пройденим уроком)
export function lettersKnown(profile, layout) {
  const ids = Object.keys(profile.progress[layout] ?? {}).map(Number);
  return ids.length ? learnedCount(layout, Math.max(...ids)) : 0;
}

// Екран «Мої досягнення»: лише власний прогрес дитини, без порівнянь з іншими
export function achievementsScreen(profile) {
  const layout = profile.layout;
  const letters = lettersKnown(profile, layout);
  const done = lessonsDone(profile);
  const st = profile.stats;
  const chips = [
    `<div class="chip-stat">${stars(1, 1, 38)}<b>${totalStars(profile)}</b><span>зірочок</span></div>`,
    `<div class="chip-stat">${icons.check(34)}<b>${done}</b><span>${plural(done, ['урок', 'уроки', 'уроків'])}</span></div>`,
    `<div class="chip-stat"><b class="chip-letter">А</b><b>${letters}</b><span>${plural(letters, ['літера', 'літери', 'літер'])}</span></div>`,
  ].join('');
  let extra = '';
  if (profile.level === '3-4' && st.typed > 0) { // статистика лише для 3–4 класу
    const hard = hardLetters(st.missed);
    extra = `<div class="done-stats ach-stats">
      <div class="stat"><b>${accuracy(st.typed, st.errors)}%</b><span>точність</span></div>
      <div class="stat"><b>${charsPerMinute(st.chars, st.ms)}</b><span>знаків за хвилину</span></div></div>
      ${hard.length ? `<div class="done-hard"><span>Потренуй:</span>${hard.map((c) => `<span class="keycap">${c.toUpperCase()}</span>`).join('')}</div>` : ''}`;
  }
  const grid = BADGES.map((b) => {
    const got = !!profile.badges[b.id];
    return `<div class="badge-cell ${got ? 'is-earned' : 'is-locked'}" role="img" aria-label="${b.name}${got ? '' : `: ${b.how}`}">
      ${badge(b.id, { earned: got, size: 118 })}<b>${got ? b.name : b.how}</b></div>`;
  }).join('');
  const earned = Object.keys(profile.badges).length;
  return `<div class="screen screen-ach theme-warm">
    <div class="topbar">${homeButton()}<div class="topbar-spacer"></div>${soundButton()}
      <button class="btn round light" data-go="adult" aria-label="Для дорослого">${icons.gear(32)}</button>
      ${btn({ label: 'Карта', icon: 'map', kind: 'primary', attrs: 'data-go="map"' })}</div>
    <div class="ach-me">
      ${AVATARS[profile.avatar]?.(120) ?? ''}
      <div class="ach-name">${esc(profile.name)}</div>
      <div class="chip-stats">${chips}</div>
      ${extra}
    </div>
    <div class="ach-badges">
      <h2 class="ach-title">Мої значки <small>${earned} з ${BADGES.length}</small></h2>
      <div class="badge-grid">${grid}</div>
    </div>
    <div class="ach-klavik" aria-hidden="true">${klavik(earned ? 'joy' : 'cheer', 120)}</div>
  </div>`;
}
