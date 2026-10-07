import { klavik } from '../character/klavik.js';
import { icons } from '../design/icons.js';
import { btn, homeButton, soundButton } from './common.js';
import { GAMES, GAME_IDS, isUnlocked, gameLetters } from '../games/engine.js';

// Малюнок гри для картки: кульки або літери, що падають (власні, прості, у теплих кольорах)
export function gameArt(kind, size = 150) {
  const body = kind === 'balloons'
    ? `<g stroke="#2b3a4a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M44 100q-6 24 6 40M100 96q4 24-8 44M74 112q0 18 2 28" fill="none"/>
        <ellipse cx="44" cy="62" rx="26" ry="32" fill="#ff8aa1"/><ellipse cx="102" cy="58" rx="24" ry="30" fill="#ffc21a"/><ellipse cx="74" cy="82" rx="24" ry="30" fill="#8f90ec"/>
      </g><ellipse cx="36" cy="50" rx="6" ry="9" fill="#fff" opacity=".7"/><ellipse cx="95" cy="46" rx="5" ry="8" fill="#fff" opacity=".7"/>`
    : `<g stroke="#2b3a4a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="18" y="22" width="48" height="52" rx="14" fill="#fff"/><rect x="82" y="56" width="48" height="52" rx="14" fill="#ffe08a"/>
        <path d="M42 90v18M106 126v14" fill="none" stroke-dasharray="2 12"/>
      </g><text x="42" y="60" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="800" font-size="34" fill="#2b3a4a">А</text>
      <text x="106" y="94" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="800" font-size="34" fill="#2b3a4a">О</text>`;
  return `<svg viewBox="0 0 148 148" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;
}

// Екран «Ігри»: дві картки; гра, що ще закрита, показує, після якого уроку відкриється
export function gamesScreen(state) {
  const profile = state.profileId ? state.store.get(state.profileId) : null;
  const cards = GAME_IDS.map((kind) => {
    const g = GAMES[kind];
    const open = isUnlocked(kind, state.layout, state.progress, state.openAll);
    const best = profile?.games?.[`${kind}-${state.layout}`]?.best ?? 0;
    const foot = !open ? `<span class="game-note">${icons.lock(30)}<span>${g.hint}</span></span>`
      : best > 0 ? `<span class="game-note">${icons.trophy(30)}<span>Рекорд: ${best}</span></span>`
      : `<span class="game-note">${icons.play(30)}<span>Грай</span></span>`;
    return `<button class="game-card ${open ? '' : 'is-locked'}" data-game="${kind}" aria-label="${g.title}${open ? '' : ': закрита, ' + g.hint}" ${open ? '' : 'disabled'}>
      <span class="game-art">${open ? gameArt(kind, 168) : `<span class="game-art-lock">${icons.lock(72)}</span>`}</span>
      <b class="game-name">${g.title}</b>${foot}</button>`;
  }).join('');
  return `<div class="screen screen-games theme-warm">
    <div class="topbar">${homeButton()}<div class="topbar-spacer"></div>
      ${btn({ label: 'Карта', icon: 'map', kind: 'light', attrs: 'data-go="map"' })}${soundButton()}</div>
    <div class="games-head"><div aria-hidden="true">${klavik('cheer', 120)}</div><div class="bubble"><span class="bubble-text">Обери гру</span></div></div>
    <div class="game-cards">${cards}</div>
  </div>`;
}

export function mountGames(root, state) {
  const onClick = (e) => {
    const b = e.target.closest('[data-game]');
    if (!b || b.disabled) return;
    state.gameKind = b.dataset.game;
    state.go('game');
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}

// Скільки літер знає дитина (для відладки/перевірок)
export const lettersForGames = (state) => gameLetters(state.layout, state.progress, state.openAll);
