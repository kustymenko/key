import { klavik } from '../character/klavik.js';
import { keyboard, hands } from '../keyboard/onscreen.js';
import { attachLiveKeyboard, setActiveFinger } from '../keyboard/live.js';
import { fingerOf, shiftCodeFor } from '../keyboard/fingers.js';
import { codeOfChar, needsShift, ROWS } from '../keyboard/layouts.js';
import { stars } from '../design/icons.js';
import { btn, homeButton, bubble, setBackdrop, soundButton, offerBreak } from './common.js';
import { layoutHint } from './keyboard.js';
import { getLesson, keyNameAcc, keyNameNom, isPunct, learnedCount, nextLesson } from '../lessons/course.js';
import { buildLesson, buildFree, topLesson } from '../lessons/generator.js';
import { createExercise, currentChar, pressChar } from '../lessons/exercise.js';
import { starsFor } from '../lessons/stars.js';
import { accuracy, charsPerMinute, hardLetters, mergeMissed } from '../lessons/stats.js';
import { donePhrase, freeDonePhrase, BADGE_PHRASES, pickPhrase, HINT_PHRASES, fill, plural, AGAIN_PHRASES, DRILL_PHRASES, STREAK_PHRASES, STEP_DONE_PHRASES, BACK_PHRASES, RESUME_PHRASES, FREE_START } from '../content/phrases.js';
import { playSfx } from '../audio/sfx.js';
import { badge } from '../design/badges.js';
import { BADGES } from '../content/badges.js';

const IGNORED = new Set(['Backspace', 'Tab', 'Enter', 'CapsLock', 'Escape']); // службові: не помилка
const FACE = 150;
const KEY_LABELS = new Map(ROWS.flat().map((k) => [k.code, k]));
const STREAK_EVERY = 6; // скільки правильних натискань поспіль викликають похвалу Клавика

// Порожня оболонка: далі екран «оживляє» mountLesson
export const lessonScreen = () => '<div class="screen screen-exercise theme-neutral" data-lesson></div>';

// Підписи клавіш для знайомства: велика К = ⇧ + К; кома в українській = ⇧ + .
function introCaps(ch, layout) {
  const label = KEY_LABELS.get(codeOfChar(ch, layout))?.[layout] ?? ch.toUpperCase();
  return needsShift(ch, layout) ? ['⇧', label] : [label];
}

// Текст вправи розбито на «слова» (слово + пробіл після нього), щоб рядок переносився між словами
function tokens(text) {
  const out = [];
  let cur = [];
  [...text].forEach((ch, i) => {
    cur.push({ ch, i });
    if (ch === ' ' || cur.length >= 8) { out.push(cur); cur = []; } // довгі рядки без пробілів ріжемо по 8
  });
  if (cur.length) out.push(cur);
  return out;
}

function taskHtml(text, pos, level, tight = false) {
  const long = level === '3-4';
  const size = long ? 'long' : text.length <= 7 ? 'xl' : 'l';
  const chars = (t) => t.map(({ ch, i }) => {
    const cls = ['task-ch', i < pos ? 'is-done' : i === pos ? 'is-current' : '', ch === ' ' ? 'is-space' : ''].filter(Boolean).join(' ');
    return `<span class="${cls}">${ch === ' ' ? '␣' : ch}</span>`;
  }).join('');
  return `<div class="task-line is-${size} ${tight ? 'is-tight' : ''}">${tokens(text).map((t) => `<span class="tk">${chars(t)}</span>`).join('')}</div>`;
}

// «Новий значок!» на екрані завершення
function badgesHtml(ids) {
  const items = ids.map((id) => `<span class="new-badge">${badge(id, { size: 64 })}<b>${BADGES.find((b) => b.id === id).name}</b></span>`).join('');
  return `<div class="done-badges" role="status"><span class="done-badges-title">${pickPhrase(BADGE_PHRASES)}</span>${items}</div>`;
}

// Екран уроку: знайомство з клавішами, вправи, завершення з зірочками (і статистикою для 3–4 класу)
export function mountLesson(root, state) {
  const stage = root.querySelector('.stage');
  const timers = new Set();
  let stopLive = null;
  let screen = null;
  let run = null;
  let lastPhrase = null;
  let meta = null; // опис уроку з курсу
  let built = null; // кроки уроку (знайомство + вправи)

  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
    timers.add(t);
  };
  const $ = (sel) => screen.querySelector(sel);
  const level = () => state.level;
  // Фраза Клавика зі списку: випадкова, не така сама, як попередня з цього списку
  const lastBy = new Map();
  const pick = (list) => { const p = pickPhrase(list, lastBy.get(list)); lastBy.set(list, p); return p; };

  function setFace(emotion) {
    if (run.face === emotion) return;
    run.face = emotion;
    $('[data-face]').innerHTML = klavik(emotion, FACE);
  }
  const setMsg = (html) => { $('[data-msg]').innerHTML = html; };

  // Яка клавіша і який палець зараз «наступні» (для великої літери — ще й Shift)
  function setNext(ch, hint = 'next') {
    const code = codeOfChar(ch, state.layout);
    const shift = needsShift(ch, state.layout) ? shiftCodeFor(code) : null;
    screen.querySelectorAll('.key').forEach((k) => k.classList.remove('is-next', 'is-error'));
    for (const c of [code, shift].filter(Boolean)) {
      const el = screen.querySelector(`.key[data-code="${c}"]`);
      if (!el) continue;
      void el.offsetWidth; // перезапуск анімації підказки
      el.classList.add('is-next');
      if (hint === 'error') el.classList.add('is-error');
    }
    $('.hands').classList.toggle('is-error', hint === 'error');
    setActiveFinger(screen, [fingerOf(code), shift && fingerOf(shift)]);
  }

  function paintTask() {
    const step = built.steps[run.i];
    if (step.kind === 'intro') {
      const caps = introCaps(step.ch, state.layout)
        .map((c) => `<span class="press-key intro-key" aria-label="клавіша ${c}">${c}</span>`)
        .join('<span class="keys-plus" aria-hidden="true">+</span>');
      $('[data-task]').innerHTML = `<span class="task-ch is-current">${step.ch}</span><span class="intro-eq" aria-hidden="true">=</span>${caps}`;
    } else {
      const box = $('[data-task]');
      box.innerHTML = taskHtml(step.text, run.ex.pos, level(), run.tight);
      if (run.tight === undefined && level() === '3-4') { // довгий текст у три рядки не вміщається: на цю вправу трохи дрібніше (але не менше 36 px)
        run.tight = box.firstElementChild.offsetHeight > 150; // 2 рядки ≈ 132 px, 3 рядки ≈ 196 px
        if (run.tight) box.innerHTML = taskHtml(step.text, run.ex.pos, level(), true);
      }
    }
    $('[data-dots]').innerHTML = built.steps.map((_, i) => `<i class="dot ${i < run.i ? 'is-on' : ''}"></i>`).join('');
  }

  const introMsg = (ch) => (isPunct(ch) ? `Знайди ${keyNameAcc(ch)}` : needsShift(ch, state.layout) ? `Знайди велику ${ch}` : `Знайди ${ch.toUpperCase()}`);
  const foundMsg = (ch) =>
    isPunct(ch) ? `Так! Це ${keyNameNom(ch)}` : needsShift(ch, state.layout) ? `Так! Це велика ${ch}` : fill(HINT_PHRASES.found, { key: ch.toUpperCase() });

  function showStep() {
    const step = built.steps[run.i];
    run.ex = createExercise(step.kind === 'intro' ? step.ch : step.text);
    run.locked = false;
    run.stepStart = null;
    run.stepPaused = 0;
    run.stepErr0 = run.errors;
    run.tight = undefined;
    setFace('think');
    run.hold = 0;
    run.drillMsg = pick(DRILL_PHRASES[level()]);
    setMsg(bubble(step.kind === 'intro' ? introMsg(step.ch) : run.drillMsg, { speak: false }));
    paintTask();
    setNext(currentChar(run.ex));
  }

  function finish() {
    stopLive?.();
    stopLive = null;
    const free = !!meta.free;
    const n = starsFor({ level: level(), errors: run.errors, total: run.typed });
    playSfx(free ? 'step' : 'stars', n);
    let fresh = [];
    if (free) fresh = []; // вільне друкування: зірочок і значків немає, прогрес уроків не змінюється
    else if (state.profileId) fresh = state.store.finishLesson(state.profileId, { layout: state.layout, lessonId: meta.id, stars: n, errors: run.errors });
    else if (state.progress) { // демо без профілю: зірочки лише в пам'яті вкладки
      const prev = state.progress[state.layout][meta.id] ?? 0;
      state.progress[state.layout][meta.id] = Math.max(prev, n);
    }
    const count = learnedCount(state.layout, meta.id);
    const phrase = free ? freeDonePhrase(level(), run.drillChars, lastPhrase) : donePhrase({ level: level(), stars: n, what: meta.what, count, last: lastPhrase });
    lastPhrase = phrase;
    const next = free ? null : nextLesson(state.layout, level(), meta.id);
    setBackdrop(true);
    if (fresh.length) later(() => playSfx('badge'), 1100); // значок — після зірочок

    let statsHtml = '';
    if (level() === '3-4') { // статистика лише для 3–4 класу: точність на першому місці
      const acc = accuracy(run.typed, run.errors);
      const cpm = charsPerMinute(run.drillChars, run.drillMs);
      const hard = hardLetters(run.missed);
      statsHtml = `<div class="done-stats">
        <div class="stat"><b>${acc}%</b><span>точність</span></div>
        <div class="stat"><b>${run.errors}</b><span>${plural(run.errors, ['помилка', 'помилки', 'помилок'])}</span></div>
        <div class="stat"><b>${cpm}</b><span>знаків за хвилину</span></div>
      </div>${hard.length ? `<div class="done-hard"><span>Потренуй:</span>${hard.map((c) => `<span class="keycap">${c.toUpperCase()}</span>`).join('')}</div>` : ''}`;
    }
    stage.innerHTML = `<div class="screen screen-done theme-warm ${level() === '3-4' ? 'has-stats' : ''}" data-done>
      <div class="topbar">${btn({ label: 'Додому', icon: 'home', kind: 'light', attrs: 'aria-label="Додому" data-home' })}<div class="topbar-spacer"></div>${soundButton()}</div>
      <div class="done-main">
        <div class="done-klavik">${klavik(n === 3 ? 'joy' : 'cheer', 230)}</div>
        <div class="done-col">
          ${free ? '' : `<div class="done-stars" role="img" aria-label="Зірочок: ${n} з 3">${stars(n, 3, 110)}</div>`}
          <div class="bubble done-bubble"><span class="bubble-text">${phrase}</span></div>
          ${statsHtml}
          ${fresh.length ? badgesHtml(fresh) : ''}
          <div class="done-buttons">
            ${next ? btn({ label: 'Далі', icon: 'next', kind: 'primary', size: 'big', attrs: 'data-act="next"' }) : ''}
            ${btn({ label: 'Ще раз', icon: 'replay', kind: next ? 'light' : 'primary', size: 'big', attrs: 'data-act="again"' })}
            ${btn({ label: 'Карта', icon: 'map', kind: 'light', size: 'big', attrs: 'data-go="map"' })}
          </div>
        </div>
      </div>
    </div>`;
    offerBreak(stage.firstElementChild, state);
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
    const step = built.steps[run.i];
    if (run.stepStart === null) run.stepStart = performance.now();
    const { state: next, result } = pressChar(run.ex, key);
    run.ex = next;
    if (result === 'error') {
      run.errors += 1;
      run.okRun = 0;
      run.hold = 0;
      playSfx('hint');
      const want = currentChar(next);
      setFace('cheer');
      setNext(want, 'error');
      const again = want === ' ' ? 'Ось пробіл' : pick(AGAIN_PHRASES);
      setMsg(bubble(next.streak >= 3 && want !== ' ' ? `Це ${isPunct(want) ? keyNameNom(want) : `клавіша ${want.toUpperCase()}`}` : again, { speak: false }));
      return;
    }
    run.typed += 1;
    run.okRun += 1;
    paintTask();
    if (result === 'ok') {
      playSfx('tap');
      if (step.kind === 'drill' && run.okRun % STREAK_EVERY === 0) { // серія без помилок: Клавик радіє, фраза лишається ще кілька натискань
        setFace('joy');
        setMsg(bubble(pick(STREAK_PHRASES), { speak: false }));
        run.hold = run.okRun + 3;
      } else if (run.okRun > run.hold) {
        setFace('think');
        setMsg(bubble(run.drillMsg, { speak: false }));
      }
      setNext(currentChar(next));
      return;
    }
    playSfx('step');
    // крок завершено
    run.locked = true;
    run.missed = mergeMissed(run.missed, next.missed);
    if (step.kind === 'drill') { // швидкість рахуємо лише по вправах, без пауз
      run.drillMs += performance.now() - run.stepStart - run.stepPaused;
      run.drillChars += step.text.length;
    }
    saveProgress(step, next);
    setFace('joy');
    screen.querySelectorAll('.key').forEach((k) => k.classList.remove('is-next', 'is-error'));
    setMsg(bubble(step.kind === 'intro' ? foundMsg(step.ch) : pick(STEP_DONE_PHRASES), { speak: false }));
    later(() => {
      run.i += 1;
      if (run.i >= built.steps.length) finish();
      else showStep();
    }, step.kind === 'intro' ? 700 : 500);
  }

  // Прогрес зберігається після кожної вправи: статистика і місце, де зупинилась дитина
  function saveProgress(step, ex) {
    if (!state.profileId) return;
    const drill = step.kind === 'drill';
    const isLast = run.i + 1 >= built.steps.length;
    state.store.saveStep(state.profileId, {
      typed: step.kind === 'intro' ? 1 : step.text.length,
      keepResume: !!meta.free,
      errors: run.errors - run.stepErr0,
      ms: drill ? performance.now() - run.stepStart - run.stepPaused : 0,
      chars: drill ? step.text.length : 0,
      missed: ex.missed,
      resume: isLast ? null : {
        layout: state.layout, id: meta.id, level: level(), i: run.i + 1, steps: built.steps,
        errors: run.errors, typed: run.typed, missed: run.missed, drillMs: run.drillMs, drillChars: run.drillChars,
      },
    });
  }

  function togglePause() {
    if (!run) return;
    const layer = screen.querySelector('.pause-layer');
    if (layer) {
      layer.remove();
      run.paused = false;
      run.stepPaused += performance.now() - run.pauseAt;
      setFace('cheer');
      setMsg(bubble(pick(BACK_PHRASES), { speak: false }));
      return;
    }
    run.paused = true;
    run.pauseAt = performance.now();
    screen.insertAdjacentHTML('beforeend', `<div class="pause-layer" role="dialog" aria-label="Пауза">
      <div>${klavik('rest', 200)}</div>
      <div class="row">${btn({ label: 'Продовжити', icon: 'play', kind: 'primary', size: 'big', attrs: 'data-act="resume"' })}${btn({ label: 'Додому', icon: 'home', kind: 'light', size: 'big', attrs: 'data-home' })}</div>
    </div>`);
  }

  function start({ fresh = false } = {}) {
    timers.forEach(clearTimeout);
    timers.clear();
    stopLive?.();
    setBackdrop(false);
    // Урок, прихований для рівня (або неіснуючий), замінюємо першим
    let lesson = getLesson(state.layout, state.lessonId);
    if (!lesson || (lesson.minLevel === '3-4' && level() === '1-2')) lesson = getLesson(state.layout, 1);
    state.lessonId = lesson.id;
    meta = lesson;
    if (state.free) { // вільне друкування: вправи з усіх вивчених клавіш, без збереженого місця
      const top = Math.max(topLesson(state.layout, state.progress), state.openAll ? 7 : 0, 1);
      meta = { id: top, letters: [], kind: 'review', what: null, free: true };
    }
    const saved = !fresh && !meta.free && state.profileId ? state.store.get(state.profileId)?.resume : null;
    const resumed = saved && saved.layout === state.layout && saved.id === lesson.id && saved.level === level() && saved.i < saved.steps.length;
    built = meta.free ? buildFree({ layout: state.layout, id: meta.id, level: level() })
      : resumed ? { id: lesson.id, letters: lesson.letters, steps: saved.steps } : buildLesson({ layout: state.layout, id: lesson.id, level: level() });
    stage.innerHTML = lessonScreen();
    screen = stage.querySelector('[data-lesson]');
    run = { okRun: 0, i: 0, ex: null, errors: 0, typed: 0, locked: false, paused: false, face: null, missed: {}, drillMs: 0, drillChars: 0, stepStart: null, stepPaused: 0, pauseAt: 0, stepErr0: 0 };
    if (resumed) Object.assign(run, { i: saved.i, errors: saved.errors, typed: saved.typed, missed: { ...saved.missed }, drillMs: saved.drillMs, drillChars: saved.drillChars, stepErr0: saved.errors });
    const s0 = built.steps[run.i];
    const first = codeOfChar(s0.kind === 'intro' ? s0.ch : s0.text[0], state.layout);
    screen.innerHTML = `<div class="topbar">${homeButton()}<div class="progress-dots" data-dots aria-hidden="true"></div>
        ${soundButton()}${btn({ label: 'Пауза', icon: 'pause', kind: 'light', attrs: 'aria-label="Пауза" data-act="pause"' })}</div>
      <div class="task-card">
        <div class="task-klavik" data-face></div>
        <div class="task-main"><div class="task-text" data-task aria-label="Завдання"></div><div data-msg></div></div>
      </div>
      <div class="play-row">${keyboard({ layout: state.layout, next: first })}${hands({ active: fingerOf(first) })}</div>`;
    stopLive = attachLiveKeyboard(screen, { getLayout: () => state.layout, trackFinger: false, onKey });
    showStep();
    if (resumed) setMsg(bubble(pick(RESUME_PHRASES), { speak: false }));
    else if (meta.free) setMsg(bubble(pick(FREE_START), { speak: false }));
  }

  const onClick = (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    b.blur(); // щоб пробіл і Enter не «натискали» кнопку
    if (b.dataset.act === 'pause' || b.dataset.act === 'resume') togglePause();
    if (b.dataset.act === 'again') start({ fresh: true });
    if (b.dataset.act === 'next') {
      const next = nextLesson(state.layout, level(), meta.id);
      if (next) state.lessonId = next.id;
      start({ fresh: true });
    }
  };
  stage.addEventListener('click', onClick);
  start();

  return () => {
    stage.removeEventListener('click', onClick);
    timers.forEach(clearTimeout);
    stopLive?.();
  };
}
