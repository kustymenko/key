// Контекст екрана 5–6 класів: усе, що світ має знати, щоб намалювати екран. Логіка не залежить від світу.
import { levelInfo, DEFAULT_HERO, pickTip } from '../logic/profile.js';
import { emptyProgress, sampleProgress } from '../logic/stub.js';
import { lessonStates, currentLesson, worldsFromLessons } from '../logic/progress.js';
import { esc } from '../../screens/common.js';

const hrefFor = (base) => (tab) => base + (tab === 'world' ? '' : `/${tab}`);

let lastTip = '';
const tip = () => (lastTip = pickTip(lastTip));

// Справжній профіль. extra.lesson — дані поточного уроку (екран уроку)
export function teenContext(profile, extra = {}) {
  const info = levelInfo(profile.xp);
  const layout = profile.layout === 'en' ? 'en' : 'ua';
  const states = lessonStates(layout, profile);
  const progress = emptyProgress();
  progress.worlds = worldsFromLessons(layout, states);
  return {
    demo: false,
    href: hrefFor('#teen'),
    player: { name: esc(profile.name), level: info.level, xp: info.xp, xpMax: info.xpMax, coins: 0 },
    hero: profile.hero,
    helper: !profile.helperHidden,
    world: profile.world,
    tip: tip(),
    progress,
    layout,
    states,
    next: currentLesson(states), // поточний урок швидкого курсу (або null, якщо літерні уроки пройдено)
    ...extra,
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
