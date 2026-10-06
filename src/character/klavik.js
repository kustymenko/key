// Клавик — власний персонаж: добра м'яка клавіша з пружинкою-антенкою.
// Лише нейтральні сіро-білі тони (кольори пальців зарезервовані).
const INK = '#2b3a4a';

const eyes = {
  open: `<ellipse cx="80" cy="108" rx="9" ry="12" fill="${INK}"/><ellipse cx="120" cy="108" rx="9" ry="12" fill="${INK}"/>
         <circle cx="83" cy="103" r="3.4" fill="#fff"/><circle cx="123" cy="103" r="3.4" fill="#fff"/>`,
  happy: `<path d="M69 112q11-18 22 0M109 112q11-18 22 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,
  wink: `<ellipse cx="80" cy="108" rx="9" ry="12" fill="${INK}"/><circle cx="83" cy="103" r="3.4" fill="#fff"/>
         <path d="M110 110q10-12 20 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,
  up: `<ellipse cx="82" cy="104" rx="9" ry="12" fill="${INK}"/><ellipse cx="122" cy="104" rx="9" ry="12" fill="${INK}"/>
       <circle cx="86" cy="98" r="3.4" fill="#fff"/><circle cx="126" cy="98" r="3.4" fill="#fff"/>`,
  closed: `<path d="M69 106q11 12 22 0M109 106q11 12 22 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,
};

const mouths = {
  big: `<path d="M80 130q20 26 40 0z" fill="${INK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M92 143q8 6 16 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
  smile: `<path d="M84 132q16 16 32 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,
  small: `<ellipse cx="104" cy="138" rx="6" ry="7" fill="${INK}"/>`,
  rest: `<path d="M90 136q10 7 20 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,
};

// Руки: [ліва, права]
const arms = {
  down: [`M36 124q-22 2-24 22`, `M164 124q22 2 24 22`, [12, 146], [188, 146]],
  up: [`M36 116q-24-2-28-30`, `M164 116q24-2 28-30`, [8, 86], [192, 86]],
  one: [`M36 124q-22 2-24 22`, `M164 116q24-2 28-30`, [12, 146], [192, 86]],
  chin: [`M36 124q-22 2-24 22`, `M164 126q4 18-22 26`, [12, 146], [142, 152]],
  rest: [`M36 126q-18 6-20 20`, `M164 126q18 6 20 20`, [16, 146], [184, 146]],
};

const emotions = {
  joy: { eyes: 'happy', mouth: 'big', arms: 'up' },
  cheer: { eyes: 'wink', mouth: 'smile', arms: 'one' },
  think: { eyes: 'up', mouth: 'small', arms: 'chin' },
  rest: { eyes: 'closed', mouth: 'rest', arms: 'rest' },
};

export const EMOTIONS = Object.keys(emotions);

export function klavik(emotion = 'joy', size = 200) {
  const e = emotions[emotion] ?? emotions.joy;
  const [la, ra, lh, rh] = arms[e.arms];
  const extra =
    emotion === 'think'
      ? `<circle cx="164" cy="46" r="4" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="176" cy="30" r="6" fill="#fff" stroke="${INK}" stroke-width="3"/>`
      : emotion === 'rest'
        ? `<text x="150" y="60" font-family="Nunito,sans-serif" font-weight="800" font-size="26" fill="${INK}">z</text><text x="168" y="38" font-family="Nunito,sans-serif" font-weight="800" font-size="20" fill="${INK}">z</text>`
        : '';
  return `<svg class="klavik klavik-${emotion}" viewBox="0 0 200 224" width="${size}" height="${(size * 224) / 200}" role="img" aria-label="Клавик">
  <path d="M100 52q-13-8 0-14t0-14" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
  <circle cx="100" cy="14" r="9" fill="#fff" stroke="${INK}" stroke-width="5"/>
  <ellipse cx="76" cy="206" rx="19" ry="9" fill="#fff" stroke="${INK}" stroke-width="5"/>
  <ellipse cx="124" cy="206" rx="19" ry="9" fill="#fff" stroke="${INK}" stroke-width="5"/>
  <rect x="34" y="64" width="132" height="136" rx="40" fill="#cfd6dd" stroke="${INK}" stroke-width="6"/>
  <rect x="34" y="52" width="132" height="136" rx="40" fill="#fff" stroke="${INK}" stroke-width="6"/>
  <rect x="52" y="68" width="96" height="104" rx="28" fill="#f2f4f6" stroke="#c9d0d8" stroke-width="3"/>
  <path d="${la}" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
  <path d="${ra}" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
  <circle cx="${lh[0]}" cy="${lh[1]}" r="8" fill="#fff" stroke="${INK}" stroke-width="5"/>
  <circle cx="${rh[0]}" cy="${rh[1]}" r="8" fill="#fff" stroke="${INK}" stroke-width="5"/>
  <ellipse cx="64" cy="128" rx="10" ry="6.5" fill="#dfe4ea"/><ellipse cx="136" cy="128" rx="10" ry="6.5" fill="#dfe4ea"/>
  ${eyes[e.eyes]}${mouths[e.mouth]}${extra}
</svg>`;
}
