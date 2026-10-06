// Карта пальців: фізична клавіша (event.code) -> палець. Не залежить від мови.
export const FINGERS = [
  { id: 'lp', name: 'лівий мізинець' },
  { id: 'lr', name: 'лівий безіменний' },
  { id: 'lm', name: 'лівий середній' },
  { id: 'li', name: 'лівий вказівний' },
  { id: 'th', name: 'великий палець' },
  { id: 'ri', name: 'правий вказівний' },
  { id: 'rm', name: 'правий середній' },
  { id: 'rr', name: 'правий безіменний' },
  { id: 'rp', name: 'правий мізинець' },
];

const byFinger = {
  lp: ['Backquote', 'Digit1', 'Tab', 'KeyQ', 'CapsLock', 'KeyA', 'ShiftLeft', 'KeyZ'],
  lr: ['Digit2', 'KeyW', 'KeyS', 'KeyX'],
  lm: ['Digit3', 'KeyE', 'KeyD', 'KeyC'],
  li: ['Digit4', 'Digit5', 'KeyR', 'KeyT', 'KeyF', 'KeyG', 'KeyV', 'KeyB'],
  th: ['Space'],
  ri: ['Digit6', 'Digit7', 'KeyY', 'KeyU', 'KeyH', 'KeyJ', 'KeyN', 'KeyM'],
  rm: ['Digit8', 'KeyI', 'KeyK', 'Comma'],
  rr: ['Digit9', 'KeyO', 'KeyL', 'Period'],
  rp: [
    'Digit0', 'Minus', 'Equal', 'Backspace', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash',
    'Semicolon', 'Quote', 'Enter', 'Slash', 'ShiftRight',
  ],
};

export const FINGER_OF_CODE = Object.fromEntries(
  Object.entries(byFinger).flatMap(([finger, codes]) => codes.map((c) => [c, finger])),
);

export function fingerOf(code) {
  return FINGER_OF_CODE[code] ?? null;
}

// Домашні клавіші (основний ряд) — для схеми долонь
export const HOME_CODES = {
  lp: 'KeyA', lr: 'KeyS', lm: 'KeyD', li: 'KeyF', ri: 'KeyJ', rm: 'KeyK', rr: 'KeyL', rp: 'Semicolon',
};

// Який Shift тримати для клавіші: ту, що лівою рукою, — правим Shift, і навпаки
export const shiftCodeFor = (code) => (fingerOf(code)?.startsWith('l') ? 'ShiftRight' : 'ShiftLeft');
