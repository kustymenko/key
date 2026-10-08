// Облік «безперервної роботи» дитини: коли пора запропонувати перерву (kids-ux: після ~15 хвилин).
// Рахуємо лише час, коли дитина справді натискала клавіші чи кнопки. Пауза довша за gapMs вважається перервою.
export function createActivity({ breakMs = 15 * 60000, gapMs = 3 * 60000, now = () => Date.now() } = {}) {
  let active = 0;
  let last = null;
  return {
    // Дитина щось натиснула
    tick() {
      const t = now();
      if (last !== null) active = t - last > gapMs ? 0 : active + (t - last);
      last = t;
    },
    // Чи пора пропонувати перерву
    due() {
      const t = now();
      if (last === null || t - last > gapMs) return false; // давно нічого не натискали: перерва вже була
      return active >= breakMs;
    },
    // Перерву зроблено чи дитина відмовилась: рахуємо наново
    reset() { active = 0; last = now(); },
    get activeMs() { return active; },
  };
}
