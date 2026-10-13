// Швидкий курс клавіш для 5–6 класів (Етап Т3): дані й прості правила, без малювання.
// letters — нові клавіші уроку (малими; розділові клавіші теж тут). kind: letters | review | shift.
// world — до якої групи (світу карти) належить урок. Розділові знаки, цифри й апостроф з Ґ — Етапи Т4–Т5.
const L = (id, letters, label, title, world, extra = {}) => ({ id, letters, label, title, world, kind: 'letters', ...extra });

export const TEEN_COURSE = {
  ua: [
    L(1, ['ф', 'і', 'в', 'а', 'о', 'л', 'д', 'ж'], 'ФІВА ОЛДЖ', 'основний ряд', 0),
    L(2, ['п', 'р', 'є'], 'П Р Є', 'П, Р, Є і повторення', 0),
    L(3, ['й', 'ц', 'у', 'к', 'е'], 'Й Ц У К Е', 'верхній ряд, ліва рука', 1),
    L(4, ['н', 'г', 'ш', 'щ', 'з', 'х', 'ї'], 'Н Г Ш Щ З Х Ї', 'верхній ряд, права рука', 1),
    L(5, ['я', 'ч', 'с', 'м', 'и'], 'Я Ч С М И', 'нижній ряд, ліва рука', 2),
    L(6, ['т', 'ь', 'б', 'ю', '.'], 'Т Ь Б Ю .', 'нижній ряд, права рука', 2),
    { id: 7, letters: [], label: 'Усі літери', title: 'усі літери', world: 2, kind: 'review' },
    { id: 8, letters: [], label: 'Аа', title: 'великі літери', world: 2, kind: 'shift', intro: ['к', 'н'] },
  ],
  en: [
    L(1, ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'], 'ASDF JKL;', 'основний ряд', 0),
    L(2, ['g', 'h'], 'G H', 'G, H і повторення', 0),
    L(3, ['q', 'w', 'e', 'r', 't'], 'Q W E R T', 'верхній ряд, ліва рука', 1),
    L(4, ['y', 'u', 'i', 'o', 'p'], 'Y U I O P', 'верхній ряд, права рука', 1),
    L(5, ['z', 'x', 'c', 'v', 'b'], 'Z X C V B', 'нижній ряд, ліва рука', 2),
    L(6, ['n', 'm', ',', '.', '/'], 'N M , . /', 'нижній ряд, права рука', 2),
    { id: 7, letters: [], label: 'Aa', title: 'великі літери', world: 2, kind: 'shift', intro: ['f', 'j'] },
  ],
};

// Групи уроків = перші три світи карти (решта світів — наступні етапи)
export const WORLD_GROUPS = { ua: [[1, 2], [3, 4], [5, 6, 7, 8]], en: [[1, 2], [3, 4], [5, 6, 7]] };

const PUNCT = new Set(['.', ',', ';', '/']);
export const isPunctKey = (c) => PUNCT.has(c);
export const lessonsOf = (layout) => TEEN_COURSE[layout] ?? [];
export const getTeenLesson = (layout, id) => lessonsOf(layout).find((l) => l.id === id) ?? null;
export const lessonTitleOf = (l) => `Урок ${l.id} · ${l.title}`;

// Усі клавіші, вивчені до цього уроку включно (малими; пробіл — з першого уроку)
export function learnedKeys(layout, id) {
  const keys = new Set([' ']);
  for (const l of lessonsOf(layout)) if (l.id <= id) l.letters.forEach((c) => keys.add(c));
  return keys;
}
export const learnedLetters = (layout, id) => [...learnedKeys(layout, id)].filter((c) => c !== ' ' && !isPunctKey(c));
// Остання «літерна» вправа курсу (Shift-урок — окремо)
export const lastLetterLesson = (layout) => Math.max(...lessonsOf(layout).filter((l) => l.kind !== 'shift').map((l) => l.id));
