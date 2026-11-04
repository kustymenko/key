import { shiftCodeFor } from './fingers.js';

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

// Символи, які друкуються з Shift: символ -> фізична клавіша.
// ua — стандартна українська розкладка Windows (типова з Windows 8): Shift + цифри 1…0 = ! " № ; % : ? * ( ),
// кома = Shift + клавіша крапки. en — розкладка США.
export const SHIFTED = {
  ua: { '!': 'Digit1', '"': 'Digit2', '№': 'Digit3', ';': 'Digit4', '%': 'Digit5', ':': 'Digit6', '?': 'Digit7', '*': 'Digit8', '(': 'Digit9', ')': 'Digit0', ',': 'Slash' },
  en: { '!': 'Digit1', '@': 'Digit2', '#': 'Digit3', $: 'Digit4', '%': 'Digit5', '^': 'Digit6', '&': 'Digit7', '*': 'Digit8', '(': 'Digit9', ')': 'Digit0', ':': 'Semicolon', '"': 'Quote', '?': 'Slash' },
};
// Знак + (Етап Т5): Shift + клавіша «=» в обох розкладках; знак = — сама клавіша
const SHIFTED_EXTRA = { '+': 'Equal' };
// Символи без Shift, яких немає в підписах основних клавіш: апостроф в українській — клавіша ліворуч від 1
const PLAIN = { ua: { "'": 'Backquote' }, en: {} };
// Ґ: правий Alt (AltGr) + Г; велика — AltGr + Shift + Г
export const GU = { code: 'KeyU', altGr: 'AltRight' };

// Фізична клавіша для символу розкладки (регістр не важливий), або null.
// Для символів із Shift повертає основну клавішу (Shift додає keysFor).
export function codeOfChar(ch, layout) {
  if (ch === ' ') return 'Space';
  if (ch === '\n') return 'Enter';
  if (SHIFTED[layout]?.[ch]) return SHIFTED[layout][ch];
  if (SHIFTED_EXTRA[ch]) return SHIFTED_EXTRA[ch];
  if (PLAIN[layout]?.[ch]) return PLAIN[layout][ch];
  if (layout === 'ua' && (ch === 'ґ' || ch === 'Ґ')) return GU.code;
  const up = String(ch).toUpperCase();
  return ROWS.flat().find((k) => k[layout] && k[layout].toUpperCase() === up)?.code ?? null;
}

// Чи треба тримати Shift для символу (велика літера; кома, ? ! : тощо)
export const needsShift = (ch, layout) =>
  (ch !== ch.toLowerCase() && ch === ch.toUpperCase()) || SHIFTED[layout]?.[ch] !== undefined || SHIFTED_EXTRA[ch] !== undefined;

// Усі клавіші, які треба тримати для символу: основна, Shift (протилежною рукою), AltGr для Ґ.
// Апостроф у трьох виглядах (' ’ ʼ) — одна клавіша. Порожній масив, якщо клавішу не знайдено.
export function keysFor(ch, layout) {
  const c = ch === '\u2019' || ch === '\u02BC' ? "'" : ch;
  const main = codeOfChar(c, layout);
  if (!main) return [];
  const out = [main];
  if (layout === 'ua' && (c === 'ґ' || c === 'Ґ')) out.push(GU.altGr);
  if (needsShift(c, layout)) out.push(shiftCodeFor(main));
  return out;
}

// ---------- Клавіатура для уроків знаків (5–6 клас) ----------
// Показуємо стандартне розташування: апостроф ліворуч від 1 (українська), Ґ на клавіші Г з AltGr,
// Shift-символи — малим підписом у куті клавіші. Дитяча клавіатура (ROWS) не змінюється.
const SUB = {
  ua: { Digit1: '!', Digit2: '"', Digit3: '№', Digit4: ';', Digit5: '%', Digit6: ':', Digit7: '?', Digit8: '*', Digit9: '(', Digit0: ')', Equal: '+', Slash: ',', KeyU: 'Ґ' },
  en: { Backquote: '~', Digit1: '!', Digit2: '@', Digit3: '#', Digit4: '$', Digit5: '%', Digit6: '^', Digit7: '&', Digit8: '*', Digit9: '(', Digit0: ')', Minus: '_', Equal: '+', Semicolon: ':', Quote: '"', Slash: '?', Comma: '<', Period: '>' },
};
const UA_OVERRIDE = { Backquote: "'" };

export const TEEN_ROWS = [
  ...ROWS.slice(0, 4).map((row) => row.map((k) => ({
    ...k,
    ua: UA_OVERRIDE[k.code] ?? k.ua,
    sub: { ua: SUB.ua[k.code] ?? '', en: SUB.en[k.code] ?? '' },
  }))),
  [{ ...K('Space', '', '', 7), sub: { ua: '', en: '' } }, { ...K('AltRight', 'Alt', 'Alt Gr', 1), sub: { ua: '', en: '' } }],
];
