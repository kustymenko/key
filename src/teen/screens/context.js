// Контекст екрана 5–6 класів: усе, що світ має знати, щоб намалювати екран. Логіка не залежить від світу.
import { levelInfo, DEFAULT_HERO, pickTip } from '../logic/profile.js';
import { emptyProgress, sampleProgress } from '../logic/stub.js';
import { esc } from '../../screens/common.js';

const hrefFor = (base) => (tab) => base + (tab === 'world' ? '' : `/${tab}`);

let lastTip = '';
const tip = () => (lastTip = pickTip(lastTip));

// Справжній профіль
export function teenContext(profile) {
  const info = levelInfo(profile.xp);
  return {
    demo: false,
    href: hrefFor('#teen'),
    player: { name: esc(profile.name), level: info.level, xp: info.xp, xpMax: info.xpMax, coins: 0 },
    hero: profile.hero,
    helper: !profile.helperHidden,
    world: profile.world,
    tip: tip(),
    progress: emptyProgress(),
  };
}

// Приклад для сторінки #concepts і для мініатюр вибору світу
export function demoContext({ base, hero = DEFAULT_HERO, world = null } = {}) {
  return {
    demo: true,
    href: hrefFor(base),
    player: { name: 'Мандрівник', level: 7, xp: 340, xpMax: 500, coins: 245 },
    hero,
    helper: true,
    world,
    tip: 'Точність важливіша за швидкість.',
    progress: sampleProgress(),
  };
}
