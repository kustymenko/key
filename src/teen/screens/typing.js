// Вправа з друком для світів 5–6 класів: спільна логіка, різне оформлення (малюють світи).
// Поки це пробна вправа (Етап Т1): досвід за неї не нараховується; справжні уроки — Етапи Т2–Т4.
import { keyboard, hands } from '../../keyboard/onscreen.js';
import { ROWS, codeOfChar } from '../../keyboard/layouts.js';
import { attachLiveKeyboard, setActiveFinger } from '../../keyboard/live.js';
import { fingerOf } from '../../keyboard/fingers.js';
import { layoutHint } from '../../screens/keyboard.js';

// ---------- Вправа з друком (спільна логіка, різне оформлення) ----------
export const TEXT = 'новий світ чекає на тебе і твої швидкі пальці';

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
export function mountTyping(app, { xpBase = 0, xpMax = 500, animate = false } = {}) {
  const panel = app.querySelector('.keys-panel');
  if (!panel) return null;
  const q = (s) => app.querySelector(s);
  const chars = [...app.querySelectorAll('[data-i]')];
  let i = 0, errors = 0, t0 = 0;
  const xpNow = () => (animate ? xpBase + i * 2 : xpBase); // у справжньому профілі досвід тут не змінюється

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
    q('[data-xp-fill]').style.width = `${Math.min(100, (xp / xpMax) * 100)}%`;
    q('[data-xp-text]').textContent = `${Math.min(xp, xpMax)} / ${xpMax}`;
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
    const sp = q('[data-done-speed]');
    if (sp) sp.textContent = String(Math.min(999, Math.round(i / Math.max((performance.now() - t0) / 60000, 1 / 600))));
    q('[data-msg]').innerHTML = acc >= 95 ? 'Чиста робота!' : 'Вправу пройдено. Спробуй ще раз — точніше!';
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
