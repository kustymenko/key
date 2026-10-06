// Фізична схема клавіш і підписи для двох розкладок.
// Кожна клавіша: code (event.code), ua і en — підписи, w — ширина в «одиницях» клавіші.
// Апостроф і Ґ у ЙЦУКЕН не вигадуємо: їхні клавіші в українській без підпису,
// доки вчитель не перевірить, де вони на шкільних ноутбуках.

const K = (code, en, ua = en, w = 1) => ({ code, en, ua, w });
const letters = (codes, en, ua) => codes.map((c, i) => K(c, en[i], ua[i]));

export const ROWS = [
  [
    K('Backquote', '`', ''),
    ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d) => K(`Digit${d}`, d)),
    K('Minus', '-'), K('Equal', '='), K('Backspace', '⌫', '⌫', 1.6),
  ],
  [
    K('Tab', '⇥', '⇥', 1.4),
    ...letters(
      ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight'],
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']'],
      ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х', 'Ї'],
    ),
    K('Backslash', '\\', '', 1.2),
  ],
  [
    K('CapsLock', '⇪', '⇪', 1.7),
    ...letters(
      ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"],
      ['Ф', 'І', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Є'],
    ),
    K('Enter', '⏎', '⏎', 1.9),
  ],
  [
    K('ShiftLeft', '⇧', '⇧', 2.2),
    ...letters(
      ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
      ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю', '.'],
    ),
    K('ShiftRight', '⇧', '⇧', 2.6),
  ],
  [K('Space', '', '', 7)],
];

export const LAYOUTS = ['ua', 'en'];

// Літери розкладки (без службових клавіш і знаків)
export function lettersOf(layout) {
  const re = layout === 'ua' ? /^[А-ЩЬЮЯЄІЇ]$/ : /^[A-Z]$/;
  return ROWS.flat().filter((k) => re.test(k[layout]));
}
