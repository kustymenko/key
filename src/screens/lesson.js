import { klavik } from '../character/klavik.js';
import { keyboard, hands } from '../keyboard/onscreen.js';
import { attachLiveKeyboard, setActiveFinger } from '../keyboard/live.js';
import { fingerOf } from '../keyboard/fingers.js';
import { codeOfChar } from '../keyboard/layouts.js';
import { stars } from '../design/icons.js';
import { btn, homeButton, bubble } from './common.js';
import { layoutHint } from './keyboard.js';
import { LESSON1 } from '../lessons/lesson1.js';
import { createExercise, currentChar, pressChar } from '../lessons/exercise.js';
import { starsFor } from '../lessons/stars.js';
import { DONE_PHRASES, HINT_PHRASES, pickPhrase, fill } from '../content/phrases.js';

const IGNORED = new Set(['Backspace', 'Tab', 'Enter', 'CapsLock', 'Escape']); // службові: не помилка
const FACE = 150;

// Порожня оболонка: далі екран «оживляє» mountLesson
export const lessonScreen = () => '<div class="screen screen-exercise theme-neutral" data-lesson></div>';

// Екран «Урок 1»: знайомство з літерами, вправи, завершення з зірочками
export function mountLesson(root, state) {
  const stage = root.querySelector('.stage');
  const lesson = LESSON1[state.layout];
  const letters = lesson.letters.map((c) => c.toUpperCase()).join(' і ');
  const timers = new Set();
  let stopLive = null;
  let screen = null;
  let run = null;
  let lastPhrase = null;

  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
    timers.add(t);
  };
  const $ = (sel) => screen.querySelector(sel);

  function setFace(emotion) {
    if (run.face === emotion) return;
    run.face = emotion;
    $('[data-face]').innerHTML = klavik(emotion, FACE);
  }
  const setMsg = (html) => { $('[data-msg]').innerHTML = html; };

  // Яка клавіша і який палець зараз «наступні»
  function setNext(ch, hint = 'next') {
    const code = codeOfChar(ch, state.layout);
    screen.querySelectorAll('.key').forEach((k) => k.classList.remove('is-next', 'is-error'));
    const el = screen.querySelector(`.key[data-code="${code}"]`);
    if (el) {
      void el.offsetWidth; // перезапуск анімації підказки
      el.classList.add('is-next');
      if (hint === 'error') el.classList.add('is-error');
    }
    const h = $('.hands');
    h.classList.toggle('is-error', hint === 'error');
    setActiveFinger(screen, fingerOf(code));
  }

  function paintTask() {
    const step = lesson.steps[run.i];
    const ex = run.ex;
    if (step.kind === 'intro') {
      $('[data-task]').innerHTML = `<span class="task-ch is-current">${step.ch}</span><span class="intro-eq" aria-hidden="true">=</span><span class="press-key intro-key" aria-label="клавіша ${step.ch.toUpperCase()}">${step.ch.toUpperCase()}</span>`;
    } else {
      $('[data-task]').innerHTML = [...step.text]
        .map((ch, i) => `<span class="task-ch ${i < ex.pos ? 'is-done' : i === ex.pos ? 'is-current' : ''}">${ch}</span>`)
        .join('');
    }
    $('[data-dots]').innerHTML = lesson.steps.map((_, i) => `<i class="dot ${i < run.i ? 'is-on' : ''}"></i>`).join('');
  }

  function showStep() {
    const step = lesson.steps[run.i];
    const ch = step.kind === 'intro' ? step.ch : step.text;
    run.ex = createExercise(ch);
    run.locked = false;
    setFace('think');
    setMsg(bubble(step.kind === 'intro' ? `Знайди ${step.ch.toUpperCase()}` : HINT_PHRASES.drill, { speak: false }));
    paintTask();
    setNext(currentChar(run.ex));
  }

  function finish() {
    stopLive?.();
    stopLive = null;
    const n = starsFor({ level: state.level, errors: run.errors, total: run.typed });
    const phrase = pickPhrase(DONE_PHRASES[n], lastPhrase);
    lastPhrase = phrase;
    stage.innerHTML = `<div class="screen screen-done theme-warm" data-done>
      <div class="topbar">${btn({ label: 'Додому', icon: 'home', kind: 'light', attrs: 'aria-label="Додому" data-home' })}</div>
      <div class="done-main">
        <div class="done-klavik">${klavik(n === 3 ? 'joy' : 'cheer', 230)}</div>
        <div class="done-stars" role="img" aria-label="Зірочок: ${n} з 3">${stars(n, 3, 120)}</div>
        <div class="bubble done-bubble"><span class="bubble-text">${fill(phrase, { letters })}</span></div>
        ${btn({ label: 'Ще раз', icon: 'replay', kind: 'primary', size: 'big', attrs: 'data-act="again"' })}
      </div>
    </div>`;
  }

  function onKey({ code, key, kind }) {
    if (code === 'Escape') return togglePause();
    if (run.paused || run.locked || IGNORED.has(code)) return;
    if (kind === 'wrong-layout') { // не помилка: просто підказка про мову
      setMsg(layoutHint(state.layout));
      setFace('think');
      return;
    }
    if (kind === 'ignore') return;
    const step = lesson.steps[run.i];
    const { state: next, result } = pressChar(run.ex, key);
    run.ex = next;
    if (result === 'error') {
      run.errors += 1;
      const want = currentChar(next);
      setFace('cheer');
      setNext(want, 'error');
      setMsg(bubble(next.streak >= 3 ? `Це клавіша ${want.toUpperCase()}` : HINT_PHRASES.again, { speak: false }));
      return;
    }
    run.typed += 1;
    paintTask();
    if (result === 'ok') {
      setFace('think');
      setMsg(bubble(HINT_PHRASES.drill, { speak: false }));
      setNext(currentChar(next));
      return;
    }
    // крок завершено
    run.locked = true;
    setFace('joy');
    screen.querySelectorAll('.key').forEach((k) => k.classList.remove('is-next', 'is-error'));
    if (step.kind === 'intro') setMsg(bubble(fill(HINT_PHRASES.found, { key: step.ch.toUpperCase() }), { speak: false }));
    later(() => {
      run.i += 1;
      if (run.i >= lesson.steps.length) finish();
      else showStep();
    }, step.kind === 'intro' ? 700 : 500);
  }

  function togglePause() {
    if (!run) return;
    const layer = screen.querySelector('.pause-layer');
    if (layer) { layer.remove(); run.paused = false; return; }
    run.paused = true;
    screen.insertAdjacentHTML('beforeend', `<div class="pause-layer" role="dialog" aria-label="Пауза">
      <div>${klavik('rest', 200)}</div>
      <div class="row">${btn({ label: 'Продовжити', icon: 'play', kind: 'primary', size: 'big', attrs: 'data-act="resume"' })}${btn({ label: 'Додому', icon: 'home', kind: 'light', size: 'big', attrs: 'data-home' })}</div>
    </div>`);
  }

  function start() {
    timers.forEach(clearTimeout);
    timers.clear();
    stopLive?.();
    stage.innerHTML = lessonScreen();
    screen = stage.querySelector('[data-lesson]');
    run = { i: 0, ex: null, errors: 0, typed: 0, locked: false, paused: false, face: null };
    const first = codeOfChar(lesson.letters[0], state.layout);
    screen.innerHTML = `<div class="topbar">${homeButton()}<div class="progress-dots" data-dots aria-hidden="true"></div>
        ${btn({ label: 'Пауза', icon: 'pause', kind: 'light', attrs: 'aria-label="Пауза" data-act="pause"' })}</div>
      <div class="task-card">
        <div class="task-klavik" data-face></div>
        <div class="task-main"><div class="task-text" data-task aria-label="Завдання"></div><div data-msg></div></div>
      </div>
      <div class="play-row">${keyboard({ layout: state.layout, next: first })}${hands({ active: fingerOf(first) })}</div>`;
    stopLive = attachLiveKeyboard(screen, { getLayout: () => state.layout, trackFinger: false, onKey });
    showStep();
  }

  const onClick = (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    b.blur(); // щоб пробіл і Enter не «натискали» кнопку
    if (b.dataset.act === 'pause' || b.dataset.act === 'resume') togglePause();
    if (b.dataset.act === 'again') start();
  };
  stage.addEventListener('click', onClick);
  start();

  return () => {
    stage.removeEventListener('click', onClick);
    timers.forEach(clearTimeout);
    stopLive?.();
  };
}
