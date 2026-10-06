// Аватари-тваринки для карток дітей. Власні прості малюнки в нейтральних тонах.
const INK = '#2b3a4a';
const base = (inner, size) =>
  `<svg class="avatar" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">${inner}</svg>`;
const face = `<circle cx="46" cy="64" r="6" fill="${INK}"/><circle cx="74" cy="64" r="6" fill="${INK}"/>`;

export const AVATARS = {
  fox: (s = 120) =>
    base(`<path d="M16 12L52 32 22 62zM104 12L68 32 98 62z" stroke="${INK}" stroke-width="6" stroke-linejoin="round" fill="#cfd6dd"/>
      <path d="M18 56q0-30 42-30t42 30q0 34-42 40-42-6-42-40z" fill="#fff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M18 62q16 26 42 30 26-4 42-30-14 4-26 12-8 8-16 8t-16-8q-12-8-26-12z" fill="#e3e8ed"/>
      ${face}<path d="M54 82h12l-6 7z" fill="${INK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`, s),
  hedgehog: (s = 120) =>
    base(`<path d="M14 62l8-8-2-12 12 2 6-12 10 6 10-12 10 12 12-8 6 12 12-2-2 12 8 8-8 8 4 12-12 2z" fill="#cfd6dd" stroke="${INK}" stroke-width="5" stroke-linejoin="round" transform="translate(0 -6)"/>
      <path d="M24 94q-6-26 14-34 22-8 40 0 22 12 18 34z" fill="#fff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <circle cx="58" cy="78" r="5.5" fill="${INK}"/><circle cx="82" cy="78" r="5.5" fill="${INK}"/><circle cx="100" cy="92" r="6" fill="${INK}"/>`, s),
  cat: (s = 120) =>
    base(`<path d="M20 48l4-30 24 16M100 48l-4-30-24 16" fill="#cfd6dd" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <ellipse cx="60" cy="68" rx="42" ry="36" fill="#fff" stroke="${INK}" stroke-width="6"/>
      ${face}<path d="M56 78h8l-4 6z" fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M12 74l24 4M12 86l24-4M108 74l-24 4M108 86l-24-4" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`, s),
  bear: (s = 120) =>
    base(`<circle cx="26" cy="30" r="16" fill="#cfd6dd" stroke="${INK}" stroke-width="6"/><circle cx="94" cy="30" r="16" fill="#cfd6dd" stroke="${INK}" stroke-width="6"/>
      <circle cx="60" cy="66" r="42" fill="#fff" stroke="${INK}" stroke-width="6"/>
      <ellipse cx="60" cy="82" rx="18" ry="14" fill="#e3e8ed" stroke="${INK}" stroke-width="4"/>
      ${face}<ellipse cx="60" cy="77" rx="6" ry="4.5" fill="${INK}"/>`, s),
};
