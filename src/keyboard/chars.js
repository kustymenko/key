// Символи, які різні розкладки друкують по-різному: апостроф має три вигляди, Enter — це «новий абзац».
// Зараховуємо те, що реально надруковано (event.key), а не фізичну клавішу.

// Апостроф: ' (U+0027), ’ (U+2019), ʼ (U+02BC) вважаються однаковими
export const APOSTROPHES = ["'", '’', 'ʼ'];
export const isApostrophe = (ch) => APOSTROPHES.includes(ch);

// Приводить будь-який апостроф до прямого '; решту символів не чіпає
export const normChar = (ch) => (isApostrophe(ch) ? "'" : ch);

// «ё» стоїть на місці апострофа в старій розкладці (Windows XP): її друкують замість апострофа
export const isYo = (ch) => ch === 'ё' || ch === 'Ё';

// Абзац у тексті завдання — символ нового рядка; надруковано Enter
export const PARAGRAPH = '\n';
export const isParagraphKey = (key) => key === 'Enter' || key === '\n';
