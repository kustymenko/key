import { klavik } from '../character/klavik.js';
import { AVATARS } from '../character/avatars.js';
import { icons } from '../design/icons.js';
import { bubble, esc, soundButton } from './common.js';

// Скільки карток — такий розмір: одна дитина-двоє великі, клас — менші (до 18 карток, без прокручування)
export const cardSize = (count) => (count <= 4 ? 'l' : count <= 10 ? 'm' : 's');

// Екран «Хто ти?»: картки дітей + «Новий». persistent=false — тренажер не зможе зберегти прогрес
export function profilesScreen({ profiles = [], persistent = true, canCreate = true } = {}) {
  const count = profiles.length + (canCreate ? 1 : 0);
  const size = cardSize(count);
  const avatarPx = { l: 150, m: 110, s: 84 }[size];
  const cards = profiles
    .map((k) => `<button class="profile-card is-${size}" data-profile="${k.id}" aria-label="${esc(k.name)}">${AVATARS[k.avatar]?.(avatarPx) ?? ''}<span class="profile-name">${esc(k.name)}</span></button>`)
    .join('');
  const add = canCreate
    ? `<button class="profile-card is-new is-${size}" data-go="new" aria-label="Новий друг">${icons.plus(size === 'l' ? 72 : size === 'm' ? 56 : 44)}<span class="profile-name">Новий</span></button>`
    : '';
  const warn = persistent ? '' : `<div class="save-warn" role="status">${icons.lock(26)}<span>Тут прогрес не збережеться</span></div>`;
  return `<div class="screen screen-profiles theme-warm is-${size}">
    <div class="topbar"><div class="topbar-spacer"></div>${soundButton()}</div>
    <div class="profiles-head">
      <div class="profiles-klavik">${klavik('cheer', size === 'l' ? 210 : 130)}</div>
      ${bubble('Хто ти?', { speak: false })}
    </div>
    <div class="profile-cards is-${size}">${cards}${add}</div>
    ${warn}
  </div>`;
}

// Натискання на картку відкриває карту цієї дитини
export function mountProfiles(root, state) {
  const onClick = (e) => {
    const b = e.target.closest('[data-profile]');
    if (!b) return;
    state.openProfile(b.dataset.profile);
    state.go('map');
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
