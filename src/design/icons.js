// Прості власні іконки (SVG). Колір — currentColor, тому вони нейтральні.
const wrap = (body, size = 32, extra = '') =>
  `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`;

export const icons = {
  home: (s) => wrap('<path d="M3.5 11.5 12 4l8.5 7.5"/><path d="M6 10v10h4.5v-6h3v6H18V10"/>', s),
  pause: (s) => wrap('<rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor"/>', s),
  play: (s) => wrap('<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>', s),
  speaker: (s) => wrap('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a8 8 0 0 1 0 11"/>', s),
  check: (s) => wrap('<path d="m5 12.5 4.5 4.5L19 7.5" stroke-width="3.4"/>', s),
  lock: (s) => wrap('<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.4" fill="currentColor"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>', s),
  plus: (s) => wrap('<path d="M12 5v14M5 12h14" stroke-width="3.4"/>', s),
};

const STAR_POINTS = Array.from({ length: 10 }, (_, i) => {
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
