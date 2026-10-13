// Логіка профілю 5–6 класів. Одна для всіх світів: без малювання й без DOM.
// Світ (voxel / pixel / sky) — лише тема оформлення, тому тут його немає, крім ідентифікатора.
export const TEEN_LEVELS = ['5', '6'];
export const isTeen = (level) => TEEN_LEVELS.includes(level);
export const WORLD_IDS = ['voxel', 'pixel', 'sky'];
export const WORLD_NAMES = { voxel: 'Кубічний світ', pixel: 'Піксель-аркада', sky: 'Небесні острови' };
export const WORLD_SHORT = { voxel: 'Кубічний', pixel: 'Піксель', sky: 'Небесні' };

// Вигляд героя: індекси варіантів (кольори й форми — це дані, малює кожен світ по-своєму)
export const HERO_OPTIONS = {
  skin: { label: 'Колір шкіри', vals: ['#f3cfae', '#dba57b', '#aa7149', '#6d4527'] },
  outfit: { label: 'Одяг', vals: ['#e4572e', '#2e86de', '#2fa866', '#8e5bd1', '#f0a020'] },
  hat: { label: 'Головний убір', vals: ['none', 'cap', 'crown', 'tuft'], names: ['Без', 'Кепка', 'Корона', 'Чуб'] },
};
export const DEFAULT_HERO = { skin: 1, outfit: 1, hat: 1 };

// Приводить героя до безпечного вигляду (зіпсований запис не ламає екран)
export function cleanHero(h) {
  const out = { ...DEFAULT_HERO };
  for (const [k, o] of Object.entries(HERO_OPTIONS)) {
    const v = h?.[k];
    if (Number.isInteger(v) && v >= 0 && v < o.vals.length) out[k] = v;
  }
  return out;
}

// Рівні й досвід. Поки досвід лише зберігається (нараховувати його почнемо з Етапу Т6): 500 за рівень.
export const XP_PER_LEVEL = 500;
export function levelInfo(totalXp) {
  const t = Number.isFinite(totalXp) && totalXp > 0 ? Math.floor(totalXp) : 0;
  return { level: 1 + Math.floor(t / XP_PER_LEVEL), xp: t % XP_PER_LEVEL, xpMax: XP_PER_LEVEL, total: t };
}

// Що показати як початок: профіль 5–6 без світу спершу обирає світ
export function homeRoute(profile) {
  if (!profile) return '';
  if (!isTeen(profile.level)) return 'map';
  if (!profile.world) return 'teen/pick';
  return profile.placement ? 'teen' : 'teen/start';
}

// Короткі підказки помічника (до 10 слів); однакові для всіх світів, обираються без повторів підряд
export const HELPER_TIPS = [
  'Точність важливіша за швидкість.',
  'Не дивись на клавіатуру. Пальці знають шлях.',
  'Спокійний ритм краще за поспіх.',
  'Помилка — це підказка, а не вирок.',
  'Основний ряд — твоя база. Повертайся до нього.',
  'Коротка вправа щодня краще за довгу раз на тиждень.',
];
export function pickTip(prev = '') {
  const pool = HELPER_TIPS.filter((t) => t !== prev);
  return pool[Math.floor(Math.random() * pool.length)];
}
