// Спільні шматки розмітки екрана уроку (однакові у всіх світах; світ дає лише обгортку й оформлення)
export const hintToggle = () => '<button class="ll-hint" data-hint aria-pressed="true" aria-label="Підказки: наступна клавіша і палець">Підказка</button>';
// У випробуванні над текстом — спокійний таймер (лише цифри, без сигналів)
export const lessonBody = (L) => `${L?.challenge ? '<div class="ll-time" data-time aria-label="Залишилось часу">2:00</div>' : ''}<div class="ll" data-lines aria-label="Завдання" aria-live="off"></div>`;
export const lessonDone = () => '<div class="ld" data-ld></div>';

const escText = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
// Що нового після вправи: рівень, виконані завдання, нагороди — одним коротким рядком, без вигуків
export function newHtml(game) {
  if (!game) return '';
  const items = [
    ...(game.levelUp ? [`<span class="is-lvl">Новий рівень: ${game.levelUp}</span>`] : []),
    ...(game.quests.length ? [`<span>Завдань: ${game.quests.length} · +${game.bonus}</span>`] : []),
    ...(game.rewards.length ? [`<span>${game.rewards.length > 1 ? 'Нагороди' : 'Нагорода'}: ${game.rewards.slice(0, 2).map((r) => escText(r.name)).join(', ')}${game.rewards.length > 2 ? ` і ще ${game.rewards.length - 2}` : ''}</span>`] : []),
  ];
  return items.length ? `<div class="ld-new">${items.join('')}</div>` : '';
}
