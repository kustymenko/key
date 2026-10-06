import { klavik } from '../character/klavik.js';
import { AVATARS } from '../character/avatars.js';
import { icons } from '../design/icons.js';
import { bubble } from './common.js';

const kids = [
  { name: 'Соня', avatar: 'fox' },
  { name: 'Максим', avatar: 'hedgehog' },
  { name: 'Ліза', avatar: 'cat' },
];

// Екран «Хто ти?»
export function profilesScreen() {
  const cards = kids
    .map((k) => `<button class="profile-card">${AVATARS[k.avatar](150)}<span class="profile-name">${k.name}</span></button>`)
    .join('');
  return `<div class="screen screen-profiles">
    <div class="profiles-head">
      <div class="profiles-klavik">${klavik('cheer', 210)}</div>
      ${bubble('Хто ти?')}
    </div>
    <div class="profile-cards">
      ${cards}
      <button class="profile-card is-new" aria-label="Новий друг">${icons.plus(72)}<span class="profile-name">Новий</span></button>
    </div>
  </div>`;
}
