// Аватари-тваринки для карток дітей: власні кольорові малюнки з різними силуетами.
// Кольори тіла винесені в AVATAR_COLORS — тест стежить, щоб вони не збігалися з кольорами пальців.
const INK = '#2b3a4a';
export const AVATAR_COLORS = {
  fox: '#ee7d4b', hedgehog: '#a0714f', cat: '#9aa6e8', bear: '#b9784a',
  rabbit: '#f4b6c8', owl: '#c58b3c', frog: '#8fd14f', penguin: '#3a4252',
};
export const AVATAR_NAMES = {
  fox: 'Лисичка', hedgehog: 'Їжачок', cat: 'Кошеня', bear: 'Ведмедик',
  rabbit: 'Зайчик', owl: 'Совеня', frog: 'Жабка', penguin: 'Пінгвін',
};
const C = AVATAR_COLORS;
const W = '#fff';
const S = `stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;
const eye = (x, y, r = 5.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x + 1.8}" cy="${y - 1.8}" r="${r * 0.32}" fill="#fff"/>`;
const wrap = (inner, size) => `<svg class="avatar" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">${inner}</svg>`;

export const AVATARS = {
  // Лисичка: високі гострі вуха, мордочка-трикутник з білими щічками
  fox: (s = 120) => wrap(`
    <path d="M14 6L50 30 18 58z" fill="${C.fox}" ${S}/><path d="M106 6L70 30 102 58z" fill="${C.fox}" ${S}/>
    <path d="M22 12L40 28 24 44z" fill="${INK}"/><path d="M98 12L80 28 96 44z" fill="${INK}"/>
    <path d="M10 56Q12 28 60 28t50 28Q104 84 60 112 16 84 10 56z" fill="${C.fox}" ${S}/>
    <path d="M12 62Q34 66 48 86L60 108 72 86Q86 66 108 62 100 84 60 112 20 84 12 62z" fill="${W}"/>
    <path d="M10 56Q12 28 60 28t50 28Q104 84 60 112 16 84 10 56z" fill="none" ${S}/>
    ${eye(42, 62)}${eye(78, 62)}<ellipse cx="60" cy="102" rx="7" ry="5" fill="${INK}"/>`, s),

  // Їжачок: купол із голками, світле личко збоку
  hedgehog: (s = 120) => wrap(`
    <path d="M8 88Q4 40 40 30l-4-14 14 8 8-14 10 12 14-8 2 16 18 4-6 12 12 8-10 10q4 14 0 28z" fill="${C.hedgehog}" ${S}/>
    <path d="M44 100Q30 60 66 56t52 30q0 18-24 20z" fill="#f6dcb8" ${S}/>
    ${eye(80, 76, 5)}<circle cx="116" cy="90" r="6" fill="${INK}"/>
    <path d="M22 100h16M70 104h16" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`, s),

  // Кошеня: кругла голова, маленькі вуха, смужки і вусики
  cat: (s = 120) => wrap(`
    <path d="M22 50L22 14 50 32M98 50L98 14 70 32" fill="${C.cat}" ${S}/>
    <ellipse cx="60" cy="68" rx="44" ry="38" fill="${C.cat}" ${S}/>
    <path d="M60 32v12M48 34l3 10M72 34l-3 10" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>
    <ellipse cx="60" cy="86" rx="15" ry="11" fill="${W}"/>
    ${eye(42, 66, 6)}${eye(78, 66, 6)}<path d="M55 80h10l-5 6z" fill="${INK}" ${S.replace('stroke-width="5"', 'stroke-width="3"')}/>
    <path d="M60 86q-6 8-12 4M60 86q6 8 12 4" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M4 66l22 4M4 80l22-4M116 66l-22 4M116 80l-22-4" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`, s),

  // Ведмедик: круглі вуха, широка мордочка
  bear: (s = 120) => wrap(`
    <circle cx="24" cy="30" r="17" fill="${C.bear}" ${S}/><circle cx="96" cy="30" r="17" fill="${C.bear}" ${S}/>
    <circle cx="24" cy="30" r="8" fill="#e8b78e"/><circle cx="96" cy="30" r="8" fill="#e8b78e"/>
    <circle cx="60" cy="68" r="44" fill="${C.bear}" ${S}/>
    <ellipse cx="60" cy="82" rx="21" ry="16" fill="#f0cfa8" ${S.replace('stroke-width="5"', 'stroke-width="4"')}/>
    ${eye(42, 60)}${eye(78, 60)}<ellipse cx="60" cy="76" rx="7" ry="5" fill="${INK}"/>
    <path d="M60 81v5M52 90q8 6 16 0" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`, s),

  // Зайчик: дуже довгі вуха
  rabbit: (s = 120) => wrap(`
    <ellipse cx="42" cy="30" rx="12" ry="32" fill="${C.rabbit}" ${S}/><ellipse cx="78" cy="30" rx="12" ry="32" fill="${C.rabbit}" ${S}/>
    <ellipse cx="42" cy="32" rx="5" ry="22" fill="#ec8aa8"/><ellipse cx="78" cy="32" rx="5" ry="22" fill="#ec8aa8"/>
    <circle cx="60" cy="82" r="34" fill="${C.rabbit}" ${S}/>
    ${eye(46, 78, 5.5)}${eye(74, 78, 5.5)}<path d="M55 90h10l-5 5z" fill="#e0527f" ${S.replace('stroke-width="5"', 'stroke-width="3"')}/>
    <path d="M60 95v4M52 101q8 5 16 0" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M14 86l18 2M14 96l18-4M106 86l-18 2M106 96l-18-4" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`, s),

  // Совеня: велике око-диски, пір'їнки-«вушка»
  owl: (s = 120) => wrap(`
    <path d="M18 14L40 30M102 14L80 30" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M60 12Q104 12 108 66q0 44-48 46T12 66Q16 12 60 12z" fill="${C.owl}" ${S}/>
    <path d="M40 96q20 18 40 0-6 14-20 14t-20-14z" fill="#e9c58a"/>
    <circle cx="40" cy="58" r="20" fill="${W}" ${S}/><circle cx="80" cy="58" r="20" fill="${W}" ${S}/>
    <circle cx="42" cy="60" r="9" fill="${INK}"/><circle cx="78" cy="60" r="9" fill="${INK}"/>
    <circle cx="45" cy="57" r="3" fill="#fff"/><circle cx="81" cy="57" r="3" fill="#fff"/>
    <path d="M53 76h14l-7 12z" fill="#ffc93c" ${S.replace('stroke-width="5"', 'stroke-width="3.5"')}/>`, s),

  // Жабка: широка голова, очі-кульки зверху, велика усмішка
  frog: (s = 120) => wrap(`
    <ellipse cx="60" cy="74" rx="52" ry="36" fill="${C.frog}" ${S}/>
    <circle cx="34" cy="38" r="20" fill="${C.frog}" ${S}/><circle cx="86" cy="38" r="20" fill="${C.frog}" ${S}/>
    <circle cx="34" cy="38" r="12" fill="${W}"/><circle cx="86" cy="38" r="12" fill="${W}"/>
    <circle cx="36" cy="40" r="6.5" fill="${INK}"/><circle cx="84" cy="40" r="6.5" fill="${INK}"/>
    <path d="M24 78q36 32 72 0" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/>
    <circle cx="52" cy="62" r="2.6" fill="${INK}"/><circle cx="68" cy="62" r="2.6" fill="${INK}"/>
    <ellipse cx="22" cy="80" rx="8" ry="5" fill="#fff" opacity=".4"/><ellipse cx="98" cy="80" rx="8" ry="5" fill="#fff" opacity=".4"/>`, s),

  // Пінгвін: темне тіло-овал, біле черевце, дзьоб
  penguin: (s = 120) => wrap(`
    <path d="M14 76q-4-14 6-18l8 24zM106 76q4-14-6-18l-8 24z" fill="${C.penguin}" ${S}/>
    <ellipse cx="60" cy="62" rx="42" ry="52" fill="${C.penguin}" ${S}/>
    <path d="M60 40Q86 44 86 80q0 28-26 30T34 80q0-36 26-40z" fill="${W}"/>
    <circle cx="46" cy="50" r="5" fill="#fff"/><circle cx="74" cy="50" r="5" fill="#fff"/>
    <circle cx="47" cy="51" r="2.8" fill="${INK}"/><circle cx="75" cy="51" r="2.8" fill="${INK}"/>
    <path d="M50 62h20l-10 14z" fill="#ffc93c" ${S.replace('stroke-width="5"', 'stroke-width="3.5"')}/>
    <ellipse cx="46" cy="116" rx="14" ry="5" fill="#ffc93c" ${S.replace('stroke-width="5"', 'stroke-width="3.5"')}/><ellipse cx="74" cy="116" rx="14" ry="5" fill="#ffc93c" ${S.replace('stroke-width="5"', 'stroke-width="3.5"')}/>`, s),
};
