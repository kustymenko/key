// Логіка однієї вправи (без малювання): що друкуємо, де курсор, скільки помилок.
// Помилка не рухає курсор: дитина продовжує, коли натисне правильну клавішу.
// missed — скільки разів помилилися саме на цій літері (для «важких літер» 3–4 класу).

export const createExercise = (text) => ({ text, pos: 0, errors: 0, streak: 0, done: false, missed: {} });

export const currentChar = (st) => st.text[st.pos] ?? null;

// Велика літера в завданні вимагає Shift: маленька «а» її не замінює. Для малих літер регістр не важливий.
const same = (want, key) =>
  want !== want.toLowerCase() ? key === want : String(key).toLowerCase() === want.toLowerCase();

/**
 * Обробити введений символ. Повертає { state, result }:
 *  'ok' — правильно, 'done' — правильно і вправу закінчено, 'error' — не та клавіша.
 * streak — помилки поспіль на одній літері (після 3 показуємо розширену підказку).
 */
export function pressChar(st, key) {
  if (st.done) return { state: st, result: 'ignore' };
  const want = st.text[st.pos];
  if (same(want, key)) {
    const pos = st.pos + 1;
    const done = pos >= st.text.length;
    return { state: { ...st, pos, streak: 0, done }, result: done ? 'done' : 'ok' };
  }
  const low = want.toLowerCase();
  const missed = { ...st.missed, [low]: (st.missed[low] ?? 0) + 1 };
  return { state: { ...st, errors: st.errors + 1, streak: st.streak + 1, missed }, result: 'error' };
}
