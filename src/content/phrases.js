// Фрази Клавика (лише дані). Від першої особи чи на «ти», для 1–2 класу — до 5 слів.
// {letters} підставляється літерами уроку, наприклад «А і О».

export const DONE_PHRASES = {
  3: ['Ти знайшов {letters}!', 'Супер! {letters} — твої!', 'Ось які в тебе пальці!'],
  2: ['Гарно! Знаєш {letters}!', 'Вже майже без помилок!', 'Так тримати! {letters}!'],
  1: ['Ти вже знаєш {letters}!', 'Молодець, що дійшов!', 'Ще разок — буде легше!'],
};

export const HINT_PHRASES = { again: 'Ось ця клавіша', found: 'Так! Це клавіша {key}', drill: 'Друкуй букви' };

// Випадкова фраза, не така сама, як попередня
export function pickPhrase(list, last = null) {
  const pool = list.length > 1 ? list.filter((p) => p !== last) : list;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const fill = (phrase, vars) => phrase.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
