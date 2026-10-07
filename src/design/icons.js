// Прості власні іконки (SVG). Колір — currentColor, тому вони нейтральні.
const wrap = (body, size = 32, extra = '') =>
  `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`;

export const icons = {
  home: (s) => wrap('<path d="M3.5 11.5 12 4l8.5 7.5"/><path d="M6 10v10h4.5v-6h3v6H18V10"/>', s),
  pause: (s) => wrap('<rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor"/>', s),
  play: (s) => wrap('<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>', s),
  speaker: (s) => wrap('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a8 8 0 0 1 0 11"/>', s),
  sound: (s) => wrap('<path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.6" fill="currentColor"/><circle cx="16.5" cy="16" r="2.6" fill="currentColor"/>', s),
  soundOff: (s) => wrap('<path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.6" fill="currentColor"/><circle cx="16.5" cy="16" r="2.6" fill="currentColor"/><path d="M3 3l18 18" stroke-width="3.2"/>', s),
  check: (s) => wrap('<path d="m5 12.5 4.5 4.5L19 7.5" stroke-width="3.4"/>', s),
  lock: (s) => wrap('<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.4" fill="currentColor"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>', s),
  replay: (s) => wrap('<path d="M5 12a7 7 0 1 0 2.2-5.1"/><path d="M4.5 4.5v4.5H9"/>', s),
  next: (s) => wrap('<path d="M5 12h13"/><path d="m13 6 6 6-6 6"/>', s),
  map: (s) => wrap('<path d="M4 6.5 9 5l6 1.5 5-1.5v12.5L15 19.5 9 18l-5 1.5z"/><path d="M9 5v13M15 6.5v13"/>', s),
  back: (s) => wrap('<path d="M19 12H6"/><path d="m11 6-6 6 6 6"/>', s),
  trophy: (s) => wrap('<path d="M7 4.5h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 4.5M17 6h2.5a2.5 2.5 0 0 1-2.5 4.5"/><path d="M12 14.5V18M8.5 19.5h7"/>', s),
  gear: (s) => wrap('<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.4M12 18.1v2.4M3.5 12h2.4M18.1 12h2.4M6 6l1.7 1.7M16.3 16.3 18 18M6 18l1.7-1.7M16.3 7.7 18 6"/>', s),
  close: (s) => wrap('<path d="M6 6l12 12M18 6 6 18" stroke-width="3.4"/>', s),
  trash: (s) => wrap('<path d="M5 7h14M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/>', s),
  balloon: (s) => wrap('<ellipse cx="12" cy="9.5" rx="6" ry="7" fill="currentColor"/><path d="M12 16.5l-1.6 2.4h3.2z" fill="currentColor"/><path d="M12 19c-1.5 1.2 1.5 2 0 3.2"/>', s),
  drop: (s) => wrap('<rect x="6" y="2.5" width="12" height="11" rx="3" fill="currentColor"/><path d="M12 16.5v4.5"/><path d="m8.5 18 3.5 3.5 3.5-3.5"/>', s),
  plus: (s) => wrap('<path d="M12 5v14M5 12h14" stroke-width="3.4"/>', s),
};

export const STAR_POINTS = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 === 0 ? 11 : 4.6;
  const a = (Math.PI / 5) * i - Math.PI / 2;
  return `${(12 + r * Math.cos(a)).toFixed(2)},${(12.6 + r * Math.sin(a)).toFixed(2)}`;
}).join(' ');

// Зірочка: заповнена = отримана, контур = ще ні (форма, а не колір)
export function star(filled = true, size = 40) {
  return `<svg class="star ${filled ? 'is-on' : 'is-off'}" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><polygon points="${STAR_POINTS}" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
}

export function stars(count, total = 3, size = 40) {
  return `<span class="stars" role="img" aria-label="${count} з ${total}">${Array.from({ length: total }, (_, i) => star(i < count, size)).join('')}</span>`;
}
