// Розпізнавання натискань: правильна клавіша, інша клавіша чи неправильна розкладка.
// Палець беремо з event.code (фізична клавіша), символ — з event.key.

const MODIFIERS = new Set([
  'Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'CapsLock', 'Dead', 'Process', 'Unidentified', 'OS',
]);

// Яким алфавітом написано символ: 'cyr' (кирилиця), 'lat' (латиниця) або null
export function scriptOf(ch) {
  if (typeof ch !== 'string' || [...ch].length !== 1) return null;
  if (/[Ѐ-ӿԀ-ԯ]/.test(ch)) return 'cyr';
  if (/[A-Za-z]/.test(ch)) return 'lat';
  return null;
}

const SCRIPT_OF_LAYOUT = { ua: 'cyr', en: 'lat' };

/**
 * Що означає натискання, коли очікуємо розкладку `layout` ('ua' | 'en'):
 *  'ignore'       — автоповтор, службова клавіша, поєднання з Ctrl/Alt/Meta (не рахуємо);
 *  'ok'           — літера потрібного алфавіту;
 *  'wrong-layout' — літера не того алфавіту (НЕ помилка: показуємо «Перемкни мову»);
 *  'other'        — цифра, розділовий знак, пробіл, Enter тощо.
 */
export function classifyKey(e, layout) {
  if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) return 'ignore';
  if (MODIFIERS.has(e.key)) return 'ignore';
  const script = scriptOf(e.key);
  if (!script) return 'other';
  return script === SCRIPT_OF_LAYOUT[layout] ? 'ok' : 'wrong-layout';
}
