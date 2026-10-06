// Фрази Клавика (лише дані). Від першої особи чи на «ти»; для 1–2 класу — до 5 слів, для 3–4 — до 12.
// Підстановки: {what} — що знайшов («А і О», «великі літери»), {count} {noun} — «8 літер».
// Хвала конкретна: називає літери чи кількість, а не лише «Молодець!».

export const DONE_PHRASES = {
  '1-2': {
    3: ['Ти знайшов {what}!', 'Супер! Знаєш {what}!', 'Ти вже знаєш {count} {noun}!', 'Гарно! Знаєш {what}!'],
    2: ['Гарно! Знаєш {what}!', 'Вже знаєш {what}!', 'Ти знаєш {count} {noun}!', 'Так тримати, друкарю!'],
    1: ['Вже знаєш {what}!', 'Ти дійшов до кінця!', 'Ще разок, буде легше!', 'Ти знаєш {count} {noun}!'],
  },
  '3-4': {
    3: ['Ти знайшов {what}! Точність чудова!', 'Чудова точність! Ти знаєш {count} {noun}!', 'Ти вже знаєш {count} {noun}, і друкуєш точно!'],
    2: ['Гарно! Ти знайшов {what}, ще трохи точності!', 'Ти вже знаєш {count} {noun}, так тримати!', 'Майже три зірочки, точність росте!'],
    1: ['Ти дійшов до кінця! Спробуй ще раз, буде точніше.', 'Ти вже знаєш {count} {noun}, не здавайся!', 'Повільно й точно, і буде три зірочки!'],
  },
};

export const HINT_PHRASES = { again: 'Ось ця клавіша', found: 'Так! Це клавіша {key}', drill: 'Друкуй букви' };

// Відмінювання біля числа: plural(1, ['помилка', 'помилки', 'помилок']) — «помилка»; 2 — «помилки»; 5 — «помилок»
export function plural(n, [one, few, many]) {
  const last = n % 10;
  const teen = n % 100 >= 11 && n % 100 <= 14;
  return last === 1 && !teen ? one : last >= 2 && last <= 4 && !teen ? few : many;
}

// «1 літеру», «2 літери», «5 літер»
export const letterNoun = (n) => plural(n, ['літеру', 'літери', 'літер']);

// Випадкова фраза, не така сама, як попередня
export function pickPhrase(list, last = null) {
  const pool = list.length > 1 ? list.filter((p) => p !== last) : list;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const fill = (phrase, vars) => phrase.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

// Фраза для кінця уроку: лише ті, для яких є що підставити (у повторенні немає {what})
export function donePhrase({ level, stars, what, count, last }) {
  const vars = { what: what ?? '', count, noun: letterNoun(count) };
  const list = DONE_PHRASES[level][stars].filter((p) => what || !p.includes('{what}')).map((p) => fill(p, vars));
  return pickPhrase(list, last);
}
