// Допоміжне для банків текстів 5–6 класів (лише дані): знаки й особливі символи визначаємо автоматично, щоб не помилитись вручну.
// Усі тексти власні, написані для цього проєкту. Апостроф у даних — прямий ', лапки — прямі ", тире — дефіс із пробілами.

// Знаки, які вивчає курс (пробіл, крапка тощо)
export const MARK_CHARS = [',', '.', '?', '!', ':', ';', '(', ')', '"', '-', "'"];
export const marksOf = (t) => MARK_CHARS.filter((m) => t.includes(m));
export const needsOf = (t) => [
  ...(t.includes("'") ? ['apostrophe'] : []),
  ...(/[ґҐ]/.test(t) ? ['g-upturn'] : []),
  ...(/\d/.test(t) ? ['digits'] : []),
];

const lines = (text) => text.split('\n').map((s) => s.trim()).filter(Boolean);
export const entry = (t, topic, g = '56') => ({ t, topic, g, marks: marksOf(t), needs: needsOf(t) });
// Багато рядків -> записи (речення, фрази, слова)
export const S = (topic, text) => lines(text).map((t) => entry(t, topic));
// Слова через пропуск
export const Wd = (topic, text) => text.split(/\s+/).filter(Boolean).map((t) => entry(t, topic));
// Абзац: g — клас ('5' | '6'); переноси рядків у коді не потрапляють у текст
export const P = (g, topic, text) => entry(text.replace(/\s+/g, ' ').trim(), topic, g);
