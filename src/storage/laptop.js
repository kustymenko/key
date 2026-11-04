// Відомості про САМ ноутбук (не про учня): наприклад, що на ньому стара розкладка з «ё» замість апострофа,
// вимкнена таблиця лідерів, змінені цілі медалей. Окремий ключ у localStorage; усе в try/catch, без сховища працює в пам'яті вкладки.
const KEY = 'klaviaturka.laptop.v1';
let memory = {};

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return { ...memory };
  }
}
function write(next) {
  memory = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* без сховища — лише в пам'яті */ }
}

export const getLaptopFlag = (name) => read()[name] === true;

export function setLaptopFlag(name, value) {
  const next = { ...read() };
  if (value) next[name] = true; else delete next[name];
  write(next);
}

// Значення (не лише так/ні): наприклад, свої цілі медалей. null — прибрати.
export const getLaptopValue = (name) => read()[name] ?? null;
export function setLaptopValue(name, value) {
  const next = { ...read() };
  if (value === null || value === undefined) delete next[name]; else next[name] = value;
  write(next);
}

// Замість апострофа друкується «ё» (стара розкладка Windows XP): покажемо підказку в «Для дорослого»
export const YO_FLAG = 'yoApostrophe';
// Таблиця лідерів ВИМКНЕНА дорослим (за замовчуванням вона увімкнена)
export const BOARD_OFF_FLAG = 'boardOff';
// Свої цілі медалей для 5 і 6 класу (див. teen/logic/challenge.js)
export const GOALS_KEY = 'goals';
