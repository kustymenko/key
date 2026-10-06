// Урок 1: перші дві літери основного ряду (вказівні пальці).
// Українська: А (лівий вказівний, клавіша F) і О (правий вказівний, клавіша J). Англійська: F і J.
// Спочатку знайомство з кожною літерою, потім вправи по 5–7 символів (рівень 1–2 клас).

const DRILLS = ['aaaaa', 'ooooo', 'aoaoao', 'ooaaaoo']; // a, o — позначки, замінюються на літери курсу

function make(left, right) {
  const swap = (t) => t.replaceAll('a', left).replaceAll('o', right);
  return {
    id: 1,
    letters: [left, right],
    steps: [
      { kind: 'intro', ch: left },
      { kind: 'intro', ch: right },
      ...DRILLS.map((t) => ({ kind: 'drill', text: swap(t) })),
    ],
  };
}

export const LESSON1 = { ua: make('а', 'о'), en: make('f', 'j') };
