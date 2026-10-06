// Статистика для 3–4 класу: точність, знаки за хвилину, «важкі літери».
// 1–2 клас бачить лише зірочки (швидкість не показуємо).

// Точність у відсотках: правильні натискання / усі натискання
export const accuracy = (typed, errors) => (typed + errors === 0 ? 100 : Math.round((typed / (typed + errors)) * 100));

// Знаки за хвилину: правильно надруковані символи (з пробілами) / хвилини
export const charsPerMinute = (chars, ms) => (ms <= 0 ? 0 : Math.round(chars / (ms / 60000)));

// Літери, на яких помилялися найчастіше (від minErrors разів), не більше n
export function hardLetters(missed, n = 3, minErrors = 2) {
  return Object.entries(missed)
    .filter(([ch, c]) => c >= minErrors && ch.trim())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([ch]) => ch);
}

// Додати помилки однієї вправи до загальних по уроку
export const mergeMissed = (total, part) => {
  const out = { ...total };
  for (const [ch, c] of Object.entries(part)) out[ch] = (out[ch] ?? 0) + c;
  return out;
};
