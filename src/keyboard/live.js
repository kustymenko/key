// «Жива» екранна клавіатура: показує натискання справжньої клавіатури.
import { classifyKey } from './detect.js';
import { fingerOf, FINGERS } from './fingers.js';
import { ROWS } from './layouts.js';

const SHOW_MS = 160; // найкоротший час, поки натиснута клавіша видна
const KEYS = new Map(ROWS.flat().map((k) => [k.code, k]));

// Показати палець (або кілька, як для Shift + літера) на схемі долонь і підпис під нею
export function setActiveFinger(root, id) {
  const ids = [id].flat().filter(Boolean);
  root.querySelectorAll('.finger').forEach((el) => el.classList.toggle('is-active', ids.some((f) => el.classList.contains(`f-${f}`))));
  const name = ids.map((f) => FINGERS.find((x) => x.id === f)?.name).filter(Boolean).join(' + ');
  const caption = root.querySelector('.hands-caption');
  if (caption) caption.textContent = name;
  root.querySelector('.hands')?.setAttribute('aria-label', `Схема долонь${name ? ': ' + name : ''}`);
}

// Підписи клавіш у потрібній розкладці
export function setKeyboardLayout(root, layout) {
  root.querySelectorAll('.key').forEach((el) => {
    const k = KEYS.get(el.dataset.code);
    if (k) el.querySelector('.key-label').textContent = k[layout];
  });
}

/**
 * Слухає справжню клавіатуру і підсвічує клавішу та палець у `root`.
 * getLayout() — яка розкладка очікується; trackFinger: false — не міняти палець на долонях (у вправі); onKey({ code, key, label, finger, kind }) — для екрана.
 * Повертає функцію, яка вимикає слухачів.
 */
export function attachLiveKeyboard(root, { getLayout, onKey = () => {}, trackFinger = true }) {
  const since = new Map(); // code -> коли натиснули
  const timers = new Map();
  const keyEl = (code) => root.querySelector(`.key[data-code="${code}"]`);

  const release = (code) => {
    clearTimeout(timers.get(code));
    timers.delete(code);
    since.delete(code);
    keyEl(code)?.classList.remove('is-pressed');
  };

  const onDown = (e) => {
    if (e.ctrlKey || e.metaKey) return; // Ctrl+R, Ctrl+W тощо працюють як завжди
    const shortcut = e.altKey || /^F\d+$/.test(e.code) || e.code === 'Escape';
    if (!shortcut) e.preventDefault(); // без прокрутки пробілом, повернення Backspace, виходу з поля Tab
    const el = keyEl(e.code);
    if (el) {
      clearTimeout(timers.get(e.code));
      since.set(e.code, performance.now());
      el.classList.add('is-pressed');
      if (trackFinger) setActiveFinger(root, fingerOf(e.code)); // у вправі палець лишається «правильним»
    }
    if (e.repeat) return;
    const k = KEYS.get(e.code);
    onKey({
      code: e.code,
      key: e.key,
      label: k ? k[getLayout()] : e.key,
      finger: fingerOf(e.code),
      kind: classifyKey(e, getLayout()),
    });
  };

  const onUp = (e) => {
    if (!since.has(e.code)) return;
    const wait = Math.max(0, SHOW_MS - (performance.now() - since.get(e.code)));
    timers.set(e.code, setTimeout(() => release(e.code), wait));
  };

  const onBlur = () => [...since.keys()].forEach(release);

  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  window.addEventListener('blur', onBlur);
  return () => {
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    window.removeEventListener('blur', onBlur);
    onBlur();
  };
}
