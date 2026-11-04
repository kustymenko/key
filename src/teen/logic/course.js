// Курс клавіш для 5–6 класів: дані й прості правила, без малювання.
// letters — нові клавіші уроку (малими; розділові знаки теж тут). kind: letters | review | shift (Етап Т3) та
// punct | mixed | paragraph (Етап Т4: знаки, апостроф, Ґ, усі знаки разом, абзаци) та
// digits | numbers | symbols | nmixed (Етап Т5: цифри лівої й правої руки, числа й дати, символи Shift+цифр, дії + =, усе разом).
// world — до якої групи (світу карти) належить урок. moved — клавіша може стояти інакше на деяких ноутбуках (примітка в уроці).
const L = (id, letters, label, title, world, extra = {}) => ({ id, letters, label, title, world, kind: 'letters', ...extra });
const M = (id, letters, label, title, extra = {}) => ({ id, letters, label, title, world: 4, kind: 'punct', ...extra });
// Етап Т5: уроки цифр і символів (світ карти «Цифровий ліс»)
const D = (id, letters, label, title, kind, extra = {}) => ({ id, letters, label, title, world: 4, kind, ...extra });

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
    M(9, [','], ',', 'кома'),
    M(10, ['?', '!'], '? !', 'питання й оклик'),
    M(11, [':', ';'], ': ;', 'двокрапка й крапка з комою'),
    M(12, ['(', ')'], '( )', 'дужки'),
    M(13, ['"'], '"', 'лапки'),
    M(14, ['-'], '-', 'дефіс (тире)'),
    M(15, ["'"], '’', 'апостроф', { moved: true }),
    M(16, ['ґ'], 'Ґ', 'літера Ґ', { moved: true }),
    { id: 17, letters: [], label: 'Усі знаки', title: 'усі знаки разом', world: 4, kind: 'mixed' },
    { id: 18, letters: ['\n'], label: 'Абзаци', title: 'абзаци', world: 4, kind: 'paragraph' },
    D(19, ['1', '2', '3', '4', '5'], '1 2 3 4 5', 'цифри, ліва рука', 'digits'),
    D(20, ['6', '7', '8', '9', '0'], '6 7 8 9 0', 'цифри, права рука', 'digits'),
    D(21, [], '12.09', 'числа, дати, одиниці', 'numbers'),
    D(22, ['№', '%', '*'], '№ % *', 'символи № % *', 'symbols', { moved: true }),
    D(23, ['+', '='], '+ =', 'приклади: + і =', 'symbols'),
    D(24, [], '1 № %', 'усе разом: цифри й символи', 'nmixed'),
  ],
  en: [
    L(1, ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'], 'ASDF JKL;', 'основний ряд', 0),
    L(2, ['g', 'h'], 'G H', 'G, H і повторення', 0),
    L(3, ['q', 'w', 'e', 'r', 't'], 'Q W E R T', 'верхній ряд, ліва рука', 1),
    L(4, ['y', 'u', 'i', 'o', 'p'], 'Y U I O P', 'верхній ряд, права рука', 1),
    L(5, ['z', 'x', 'c', 'v', 'b'], 'Z X C V B', 'нижній ряд, ліва рука', 2),
    L(6, ['n', 'm', ',', '.', '/'], 'N M , . /', 'нижній ряд, права рука', 2),
    { id: 7, letters: [], label: 'Aa', title: 'великі літери', world: 2, kind: 'shift', intro: ['f', 'j'] },
    M(8, ["'"], '’', 'апостроф'),
    M(9, ['?', '!'], '? !', 'питання й оклик'),
    M(10, [':'], ':', 'двокрапка'),
    M(11, ['(', ')'], '( )', 'дужки'),
    M(12, ['"'], '"', 'лапки'),
    M(13, ['-'], '-', 'дефіс (тире)'),
    { id: 14, letters: [], label: 'Усі знаки', title: 'усі знаки разом', world: 4, kind: 'mixed' },
    { id: 15, letters: ['\n'], label: 'Абзаци', title: 'абзаци', world: 4, kind: 'paragraph' },
    D(16, ['1', '2', '3', '4', '5'], '1 2 3 4 5', 'цифри, ліва рука', 'digits'),
    D(17, ['6', '7', '8', '9', '0'], '6 7 8 9 0', 'цифри, права рука', 'digits'),
    D(18, [], '12.09', 'числа, дати, одиниці', 'numbers'),
    D(19, ['#', '$', '%', '&', '@', '*'], '# $ % & @ *', 'символи верхнього ряду', 'symbols'),
    D(20, ['+', '='], '+ =', 'приклади: + і =', 'symbols'),
    D(21, [], '1 # %', 'усе разом: цифри й символи', 'nmixed'),
  ],
};

// Групи уроків = світи карти: 1–3 — літери (Т3), 4 («Місто знаків») — знаки (Т4), 5 («Цифровий ліс») — цифри й символи (Т5), 6 — випробування (Т7)
export const WORLD_GROUPS = {
  ua: [[1, 2], [3, 4], [5, 6, 7, 8], [9, 10, 11, 12, 13, 14, 15, 16, 17, 18], [19, 20, 21, 22, 23, 24], []],
  en: [[1, 2], [3, 4], [5, 6, 7], [8, 9, 10, 11, 12, 13, 14, 15], [16, 17, 18, 19, 20, 21], []],
};

// Клавіші-не-літери: крапка, кома, ; / : ? ! ( ) " - апостроф, Enter (кінець абзацу), цифри та символи верхнього ряду (Етап Т5)
const PUNCT = new Set(['.', ',', ';', '/', ':', '?', '!', '(', ')', '"', '-', "'", '\n',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '№', '%', '*', '+', '=', '#', '$', '&', '@']);
export const isDigitKey = (c) => /^[0-9]$/.test(c);
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
// Остання «літерна» вправа курсу (Shift-урок і уроки знаків — окремо)
export const lastLetterLesson = (layout) => Math.max(...lessonsOf(layout).filter((l) => l.kind === 'letters' || l.kind === 'review').map((l) => l.id));
// Уроки, які потребують ряду цифр на екранній клавіатурі (знаки з Shift, апостроф зліва від 1) і клавіші AltGr
export const needsNumberRow = (l) => ['punct', 'mixed', 'paragraph', 'digits', 'numbers', 'symbols', 'nmixed'].includes(l.kind);
// Уроки Етапу Т5 (цифри й символи): окремий генератор numbers.js
export const isNumberLesson = (l) => ['digits', 'numbers', 'symbols', 'nmixed'].includes(l.kind);
