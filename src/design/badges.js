import { BADGES } from '../content/badges.js';
import { STAR_POINTS } from './icons.js';

// Медаль-значок: власний малюнок із кольорів теплої гами (--warm-*). Закритий значок — сірий контур із замочком.
const INK = '#2b3a4a';
const starAt = (cx, cy, k, fg) => `<g transform="translate(${cx - 12 * k} ${cy - 12.6 * k}) scale(${k})"><polygon points="${STAR_POINTS}" fill="#fff" stroke="${fg}" stroke-width="1.6" stroke-linejoin="round"/></g>`;
const txt = (t, size, fg) => `<text x="41" y="57" text-anchor="middle" font-size="${size}" font-weight="800" fill="${fg}" font-family="Nunito, system-ui, sans-serif">${t}</text>`;
const glyphs = {
  star: (b, fg) => starAt(41, 42, 2.9, fg),
  stars3: (b, fg) => starAt(22, 52, 1.6, fg) + starAt(60, 52, 1.6, fg) + starAt(41, 34, 2, fg),
  row: (b, fg) => [0, 1, 2].map((i) => `<rect x="${18 + i * 17}" y="38" width="13" height="20" rx="4" fill="#fff" stroke="${fg}" stroke-width="3"/>`).join('') + `<path d="M20 30h42" stroke="${fg}" stroke-width="3.5" stroke-linecap="round"/>`,
  check: (b, fg) => `<path d="m23 44 12 12 24-27" fill="none" stroke="${fg}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
  abc: (b, fg) => txt('А–Я', 28, fg),
  text: (b, fg) => txt(b.text, 36, fg),
};
const FILL = { first: 'var(--warm-gold)', three: 'var(--warm-gold)', 'home-row': 'var(--warm-done)', clean: 'var(--warm-accent)', 'stars-10': 'var(--warm-gold)', 'lessons-10': 'var(--warm-done)', 'two-courses': 'var(--warm-accent)', alphabet: 'var(--warm-done)' };
const LIGHT_TEXT = new Set(['home-row', 'clean', 'two-courses', 'alphabet', 'lessons-10']); // на темній медалі малюнок світлий

export function badge(id, { earned = true, size = 120 } = {}) {
  const b = BADGES.find((x) => x.id === id);
  const inner = glyphs[b.glyph](b, LIGHT_TEXT.has(id) ? '#fff' : INK);
  if (!earned) {
    return `<svg class="badge is-locked" viewBox="0 0 82 82" width="${size}" height="${size}" aria-hidden="true">
      <circle cx="41" cy="41" r="36" fill="var(--warm-bg)" stroke="var(--warm-text-soft)" stroke-width="4" stroke-dasharray="6 6"/>
      <g transform="translate(26 24) scale(1.3)" color="var(--warm-text-soft)"><rect x="5.5" y="10.5" width="13" height="9.5" rx="2.4" fill="currentColor"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></g></svg>`;
  }
  return `<svg class="badge" viewBox="0 0 82 82" width="${size}" height="${size}" aria-hidden="true">
    <path d="M26 6l10 26-8 4-10-22zM56 6 46 32l8 4 10-22z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <circle cx="41" cy="46" r="31" fill="${FILL[id]}" stroke="${INK}" stroke-width="4"/>
    <g>${inner}</g></svg>`;
}
