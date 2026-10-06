// Курс: порядок уроків за навичкою typing-pedagogy (лише дані й прості правила).
// letters — нові клавіші уроку (малими), label — підпис на карті, what — що «знайшов» (для похвали).
// minLevel '3-4' — урок прихований для 1–2 класу (Shift і розділові знаки).

const L = (id, letters, label, extra = {}) => ({ id, letters, label, kind: 'letters', what: letters.map((c) => c.toUpperCase()).join(' і '), ...extra });
const REVIEW = (id, label) => ({ id, letters: [], label, kind: 'review', what: null });
const KEYS = { what: 'нові клавіші' }; // уроки, де серед нових клавіш є розділовий знак

export const COURSE = {
  ua: [
    L(1, ['а', 'о'], 'А О'),
    L(2, ['в', 'л'], 'В Л'),
    L(3, ['і', 'д'], 'І Д'),
    L(4, ['ф', 'ж'], 'Ф Ж'),
    REVIEW(5, 'ФІВА'),
    L(6, ['п', 'р'], 'П Р'),
    L(7, ['є'], 'Є'),
    L(8, ['к', 'е'], 'К Е'),
    L(9, ['н', 'г'], 'Н Г'),
    L(10, ['м', 'и'], 'М И'),
    L(11, ['т', 'ь'], 'Т Ь'),
    L(12, ['у', 'ш'], 'У Ш'),
    L(13, ['с', 'б'], 'С Б'),
    L(14, ['ц', 'щ'], 'Ц Щ'),
    L(15, ['ч', 'ю'], 'Ч Ю'),
    L(16, ['й', 'з'], 'Й З'),
    L(17, ['х', 'ї'], 'Х Ї'),
    L(18, ['я', '.'], 'Я .', KEYS),
    REVIEW(19, 'Усі'),
    { id: 20, letters: [], intro: ['К', 'Н'], label: 'Аа', kind: 'shift', what: 'великі літери', minLevel: '3-4' },
    { id: 21, letters: [','], label: ', .', kind: 'punct', what: 'кому і крапку', minLevel: '3-4' },
  ],
  en: [
    L(1, ['f', 'j'], 'F J'),
    L(2, ['d', 'k'], 'D K'),
    L(3, ['s', 'l'], 'S L'),
    L(4, ['a', ';'], 'A ;', KEYS),
    REVIEW(5, 'ASDF'),
    L(6, ['g', 'h'], 'G H'),
    L(7, ['e', 'i'], 'E I'),
    L(8, ['r', 'u'], 'R U'),
    L(9, ['t', 'y'], 'T Y'),
    L(10, ['w', 'o'], 'W O'),
    L(11, ['q', 'p'], 'Q P'),
    L(12, ['v', 'm'], 'V M'),
    L(13, ['b', 'n'], 'B N'),
    L(14, ['c', ','], 'C ,', KEYS),
    L(15, ['x', '.'], 'X .', KEYS),
    L(16, ['z', '/'], 'Z /', KEYS),
    { id: 17, letters: [], intro: ['F', 'J'], label: 'Aa', kind: 'shift', what: 'великі літери', minLevel: '3-4' },
    { id: 18, letters: [], label: 'Abc.', kind: 'sentences', what: 'речення', minLevel: '3-4' },
  ],
};

// Уроки, видимі для рівня ('1-2' ховає Shift і розділові знаки)
export const lessonsFor = (layout, level) => COURSE[layout].filter((l) => !(l.minLevel === '3-4' && level === '1-2'));

export const getLesson = (layout, id) => COURSE[layout].find((l) => l.id === id) ?? null;

// Назви розділових клавіш для підказок: знайди «крапку», це клавіша «крапка»
const PUNCT = { '.': ['крапку', 'крапка'], ',': ['кому', 'кома'], ';': ['крапку з комою', 'крапка з комою'], '/': ['скісну риску', 'скісна риска'] };
export const keyNameAcc = (ch) => PUNCT[ch]?.[0] ?? ch.toUpperCase();
export const keyNameNom = (ch) => PUNCT[ch]?.[1] ?? ch.toUpperCase();
export const isPunct = (ch) => ch in PUNCT;

// Усі клавіші, вивчені до цього уроку включно (малими; пробіл — з уроку 2)
export function learnedKeys(layout, id) {
  const keys = new Set();
  for (const l of COURSE[layout]) if (l.id <= id) l.letters.forEach((c) => keys.add(c));
  if (id >= 2) keys.add(' ');
  return keys;
}

// Скільки літер (не знаків) вивчено до цього уроку включно
export const learnedCount = (layout, id) => [...learnedKeys(layout, id)].filter((c) => !isPunct(c) && c !== ' ').length;

// Наступний урок, видимий для рівня, або null
export function nextLesson(layout, level, id) {
  const list = lessonsFor(layout, level);
  const i = list.findIndex((l) => l.id === id);
  return i >= 0 ? list[i + 1] ?? null : null;
}
