// Відомості про САМ ноутбук (не про учня): наприклад, що на ньому стара розкладка з «ё» замість апострофа.
// Окремий ключ у localStorage; усе в try/catch, без сховища працює в пам'яті вкладки.
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

export const getLaptopFlag = (name) => read()[name] === true;

export function setLaptopFlag(name, value) {
  const next = { ...read() };
  if (value) next[name] = true; else delete next[name];
  memory = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* без сховища — лише в пам'яті */ }
}

// Замість апострофа друкується «ё» (стара розкладка Windows XP): покажемо підказку в «Для дорослого»
export const YO_FLAG = 'yoApostrophe';
