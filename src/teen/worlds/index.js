// Реєстр світів: кожен світ — лише тема оформлення (малюнки, кольори, шрифти). Логіка спільна, див. ../logic.
import './voxel.css';
import './pixel.css';
import './sky.css';
import * as voxel from './voxel.js';
import * as pixel from './pixel.js';
import * as sky from './sky.js';

export const THEMES = { voxel, pixel, sky };
export const themeOf = (id) => THEMES[id] ?? voxel;

// Маленький герой у стилі світу (картка на «Хто ти?»). Без світу — нейтральний вигляд першого світу.
export const heroIconOf = (worldId, hero, px) =>
  `<span class="hero-icon" style="width:${px}px;height:${px}px">${themeOf(worldId).heroIcon(hero, px)}</span>`;

// Колір тла за межами сцени (щоб у широкому вікні не було смужок іншого кольору)
export const backdropOf = (worldId, tab) => (worldId === 'pixel' ? '#14122a' : worldId === 'sky' ? '#12104a' : tab === 'type' ? '#e9ecef' : '#bfe3ff');
