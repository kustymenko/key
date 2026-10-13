// Спільне для демонстраційних концепцій 5–6 класів: умовні дані, вправа з друком, вибір вигляду героя.
// Усе тут — лише для показу стилів учням. Ніякого збереження прогресу.
import { keyboard, hands } from '../keyboard/onscreen.js';
import { ROWS, codeOfChar } from '../keyboard/layouts.js';
import { attachLiveKeyboard, setActiveFinger } from '../keyboard/live.js';
import { fingerOf } from '../keyboard/fingers.js';
import { layoutHint } from '../screens/keyboard.js';

export const TABS = [['world', 'Світ'], ['avatar', 'Герой'], ['type', 'Друк'], ['rewards', 'Нагороди']];

export const PLAYER = { name: 'Мандрівник', level: 7, xp: 340, xpMax: 500, coins: 245 };

export const WORLDS = [
  { name: 'Зелена долина', sub: 'Основний ряд', state: 'done' },
  { name: 'Кам’яні гори', sub: 'Верхній ряд', state: 'now', pct: 60 },
  { name: 'Піщаний берег', sub: 'Нижній ряд', state: 'locked' },
  { name: 'Цифровий ліс', sub: 'Цифри й символи', state: 'locked' },
  { name: 'Місто знаків', sub: 'Розділові знаки', state: 'locked' },
  { name: 'Вершина швидкості', sub: 'Випробування на час', state: 'locked' },
];

export const QUESTS = [
  { t: 'Надрукуй 3 слова без помилок', done: true, xp: 30 },
  { t: 'Досягни точності 95%', now: '92 з 95', xp: 50 },
  { t: 'Пройди 2 вправи сьогодні', now: '1 з 2', xp: 40 },
];

export const REWARDS = [
  { name: 'Перша вправа', got: true }, { name: 'Без помилок', got: true }, { name: 'Основний ряд', got: true }, { name: 'Дві мови', got: true },
  { name: 'Верхній ряд', got: false }, { name: 'Нижній ряд', got: false }, { name: 'Цифри', got: false }, { name: 'Знаки', got: false },
  { name: 'Точність 98%', got: false }, { name: '150 знаків за хвилину', got: false }, { name: 'Усі світи', got: false }, { name: 'Майстер друку', got: false },
];

// Вигляд героя (спільні варіанти; кожна концепція малює їх по-своєму)
export const AV_OPTIONS = {
  skin: { label: 'Колір шкіри', vals: ['#f3cfae', '#dba57b', '#aa7149', '#6d4527'] },
  outfit: { label: 'Одяг', vals: ['#e4572e', '#2e86de', '#2fa866', '#8e5bd1', '#f0a020'] },
  hat: { label: 'Головний убір', vals: ['none', 'cap', 'crown', 'tuft'], names: ['Без', 'Кепка', 'Корона', 'Чуб'] },
};
export const av = { skin: 1, outfit: 1, hat: 1 };

export const avatarControls = (cls) => Object.entries(AV_OPTIONS).map(([key, o]) =>
  `<div class="${cls}-group"><h3>${o.label}</h3><div class="${cls}-row">${o.vals.map((v, i) =>
    `<button class="${cls}-opt opt-${key}" data-opt="${key}" data-val="${i}" aria-pressed="${av[key] === i}" aria-label="${o.names ? o.names[i] : o.label + ' ' + (i + 1)}" ${key === 'hat' ? '' : `style="--sw:${v}"`}>${key === 'hat' ? `<span>${o.names[i]}</span>` : ''}</button>`).join('')}</div></div>`).join('');

// ---------- Вправа з друком (спільна логіка, різне оформлення) ----------
export const TEXT = 'новий світ чекає на тебе і твої швидкі пальці';
const BASE_XP = PLAYER.xp;

// Текст по словах, щоб слово не розривалось між рядками
export function taskText() {
  let i = 0;
  const words = TEXT.split(' ').map((w, wi, all) => {
    const chars = [...w].map((c) => `<span class="tt-ch" data-i="${i++}">${c}</span>`).join('');
    const sp = wi < all.length - 1 ? `<span class="tt-ch tt-sp" data-i="${i++}">&nbsp;</span>` : '';
    return `<span class="tt-w">${chars}${sp}</span>`;
  });
  return `<div class="tt" data-task aria-label="Завдання">${words.join('')}</div>`;
}

export const keysPanel = () => `<div class="keys-panel">${keyboard({ layout: 'ua', next: codeOfChar(TEXT[0], 'ua'), hint: 'next', rows: ROWS.slice(1) })}${hands({ active: fingerOf(codeOfChar(TEXT[0], 'ua')) })}</div>`;

/**
 * Оживляє вправу: слухає справжню клавіатуру, рухає курсор, рахує точність/швидкість і досвід.
 * У розмітці концепції мають бути: [data-task], [data-xp-fill], [data-xp-text], [data-acc], [data-speed], [data-msg], [data-done], .keys-panel.
 */
export function mountTyping(app) {
  const panel = app.querySelector('.keys-panel');
  if (!panel) return null;
  const q = (s) => app.querySelector(s);
  const chars = [...app.querySelectorAll('[data-i]')];
  let i = 0, errors = 0, t0 = 0;
  const xpNow = () => BASE_XP + i * 2 + (i >= TEXT.length ? PLAYER.xpMax - BASE_XP - TEXT.length * 2 : 0);

  const showNext = (error) => {
    panel.querySelectorAll('.key.is-next').forEach((k) => k.classList.remove('is-next', 'is-error'));
    if (i >= TEXT.length) { setActiveFinger(panel, null); return; }
    const code = codeOfChar(TEXT[i], 'ua');
    const k = panel.querySelector(`.key[data-code="${code}"]`);
    if (k) {
      k.classList.add('is-next');
      if (error) { void k.offsetWidth; k.classList.add('is-error'); }
    }
    setActiveFinger(panel, fingerOf(code));
  };
  const paint = () => {
    chars.forEach((c, n) => { c.classList.toggle('is-done', n < i); c.classList.toggle('is-current', n === i); });
    const xp = xpNow();
    q('[data-xp-fill]').style.width = `${Math.min(100, (xp / PLAYER.xpMax) * 100)}%`;
    q('[data-xp-text]').textContent = `${Math.min(xp, PLAYER.xpMax)} / ${PLAYER.xpMax}`;
    const total = i + errors;
    q('[data-acc]').textContent = total ? `${Math.round((i / total) * 100)}%` : '—';
    const min = (performance.now() - t0) / 60000;
    q('[data-speed]').textContent = i > 4 && min > 0 ? String(Math.min(999, Math.round(i / min))) : '—';
  };
  const finish = () => {
    const total = i + errors;
    const acc = Math.round((i / total) * 100);
    q('[data-done]').hidden = false;
    q('[data-done-acc]').textContent = `${acc}%`;
    q('[data-msg]').innerHTML = acc >= 95 ? 'Чиста робота! Новий рівень!' : 'Вправу пройдено. Спробуй ще раз — точніше!';
  };

  const stop = attachLiveKeyboard(panel, {
    getLayout: () => 'ua',
    trackFinger: false,
    onKey: ({ key, kind }) => {
      if (i >= TEXT.length || kind === 'ignore') return;
      if (kind === 'wrong-layout') { q('[data-msg]').innerHTML = layoutHint('ua'); return; }
      if (key.length !== 1) return; // Backspace, Enter тощо не рахуємо
      if (!t0) t0 = performance.now();
      if (key === TEXT[i]) {
        i++;
        q('[data-msg]').textContent = '';
        showNext(false);
        paint();
        if (i >= TEXT.length) finish();
      } else {
        errors++;
        q('[data-msg]').textContent = `Тобі потрібна клавіша «${TEXT[i] === ' ' ? 'пробіл' : TEXT[i].toUpperCase()}»`;
        showNext(true);
        paint();
      }
    },
  });
  app.querySelector('[data-again]')?.addEventListener('click', () => window.dispatchEvent(new HashChangeEvent('hashchange')));
  showNext(false);
  paint();
  return stop;
}

// ---------- Малі помічники для малювання ----------
export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)))));
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
// Детермінований «випадковий» шум 0..1 за координатами (щоб світи завжди виглядали однаково)
export const noise = (x, y, s = 0) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
};

// Колір із відтінку/насиченості/світлості (у відсотках) → #rrggbb
export function hslHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return `#${[f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
