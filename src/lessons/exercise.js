// Логіка однієї вправи (без малювання): що друкуємо, де курсор, скільки помилок.
// Помилка не рухає курсор: дитина продовжує, коли натисне правильну клавішу.

export const createExercise = (text) => ({ text, pos: 0, errors: 0, streak: 0, done: false });

export const currentChar = (st) => st.text[st.pos] ?? null;

/**
 * Обробити введений символ. Повертає { state, result }:
 *  'ok' — правильно, 'done' — правильно і вправу закінчено, 'error' — не та клавіша.
 * streak — помилки поспіль на одній літері (після 3 показуємо розширену підказку).
 */
export function pressChar(st, key) {
  if (st.done) return { state: st, result: 'ignore' };
  const want = st.text[st.pos];
  if (String(key).toLowerCase() === want.toLowerCase()) {
    const pos = st.pos + 1;
    const done = pos >= st.text.length;
    return { state: { ...st, pos, streak: 0, done }, result: done ? 'done' : 'ok' };
  }
  return { state: { ...st, errors: st.errors + 1, streak: st.streak + 1 }, result: 'error' };
}
