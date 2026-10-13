// Вступний тест (Етап Т2): три частини без підказок, розміщення, пропуск, перенесення вивченого з попередніх класів.
// Логіка в ../logic/placement.js; оформлення дає «рамка» світу (themeOf(world).frame) — тут лише спільний вміст.
import { themeOf } from '../worlds/index.js';
import { teenContext } from './context.js';
import { classifyKey } from '../../keyboard/detect.js';
import { layoutHint } from '../../screens/keyboard.js';
import {
  makeLetters, makeWordsText, makeSentencesText, toLines, scoreFind, scoreTyping, weakLetters, place, carryOver, carryPlacement,
  KIND_INFO, PART_MS,
} from '../logic/placement.js';

export function placementScreen(profile) {
  return themeOf(profile.world).frame(teenContext(profile), '');
}

const SELF_LABEL = { yes: 'Так', almost: 'Майже', no: 'Ні' };
const PARTS = {
  p1: { n: 1, title: 'Знайди літеру', text: 'На екрані з’являється літера. Натисни її на клавіатурі. Клавіатуру не видно, і це нормально.' },
  p2: { n: 2, title: 'Слова', text: 'Друкуй слова, як умієш. Помилки не страшні: просто йди далі.' },
  p3: { n: 3, title: 'Речення', text: 'Тепер речення: з великої літери, з комою й крапкою.' },
};
const btn = (label, attrs, primary = false) => `<button class="pl-btn ${primary ? 'primary' : ''}" ${attrs}>${label}</button>`;
const sec = (ms) => (ms == null ? '—' : `${(ms / 1000).toFixed(1).replace('.', ',')} с`);
const pct = (v) => (v == null ? '—' : `${Math.round(v)}%`);

export function mountPlacement(app, route, state) {
  const host = app.querySelector('[data-pl]');
  const profile = () => state.store.get(state.profileId);
  if (!host || !profile()) return null;
  const rng = Math.random;
  const carry = carryOver(profile().progress);
  const run = { self: null, find: null, words: null, sent: null, weak: {} };
  let stage = route.tab === 'test' ? 'p1' : 'intro';
  let timer = null, live = null; // live — стан поточної частини
  const now = () => performance.now();
  const q = (s) => host.querySelector(s);

  const save = (placement, missed = null) => {
    state.store.update(state.profileId, { placement: { ...placement, at: Date.now() } });
    if (missed && Object.keys(missed).length) state.store.saveStep(state.profileId, { typed: 0, errors: 0, ms: 0, chars: 0, missed, keepResume: true });
    state.go('teen');
  };
  const metrics = () => ({ medianMs: run.find?.medianMs, wordsAcc: run.words?.accuracy, wordsCpm: run.words?.cpm, sentencesAcc: run.sent?.accuracy, self: run.self });

  // ---------- вигляд ----------
  function intro() {
    const own = carry.has
      ? `<p class="pl-note">Ти вже вивчав літери (УКР: ${carry.learned.ua.length}, ENG: ${carry.learned.en.length}). Вони не пропадуть: можна пропустити те, що знаєш.</p>` : '';
    host.innerHTML = `<h2 class="pl-h">Вступний тест</h2>
      <p class="pl-lead">Він покаже, з чого тобі почати. Це не оцінка: тест можна пропустити або пройти ще раз.</p>${own}
      <div class="pl-q"><span>Ти друкуєш, не дивлячись на клавіатуру?</span><div class="pl-pills" role="group">${Object.entries(SELF_LABEL).map(([k, t]) => `<button class="pl-pill" data-self="${k}" aria-pressed="${run.self === k}">${t}</button>`).join('')}</div></div>
      <div class="pl-actions">${btn('Пройти тест', 'data-act="start-test"', true)}${carry.has ? btn('Пропустити те, що знаю', 'data-act="carry"') : ''}${btn('Почну з початку', 'data-act="skip"')}</div>`;
  }
  function ready() {
    const p = PARTS[stage];
    host.innerHTML = `<div class="pl-step">Вступний тест · ${p.n} з 3</div><h2 class="pl-h">${p.title}</h2><p class="pl-lead">${p.text} Тест триває ${PART_MS / 1000} секунд.</p>
      <div class="pl-actions">${btn('Почати', 'data-act="go"', true)}${btn('Пропустити тест', 'data-act="skip"')}</div>`;
  }
  function frame(inner) {
    host.innerHTML = `<div class="pl-step">Вступний тест · ${PARTS[stage].n} з 3 · ${PARTS[stage].title}</div>${inner}
      <div class="pl-time" aria-hidden="true"><i data-bar></i></div><div class="pl-msg" data-msg role="status"></div>`;
  }
  function result() {
    const kind = place({ find: run.find, words: run.words }, run.self);
    const info = KIND_INFO[kind];
    host.innerHTML = `<div class="pl-step">Результат</div><h2 class="pl-h">${info.title}</h2><p class="pl-lead">${info.text}</p>
      <div class="pl-stats"><span>Літера: <b>${sec(run.find?.medianMs)}</b></span><span>Точність слів: <b>${pct(run.words?.accuracy)}</b></span><span>Швидкість: <b>${Math.min(999, Math.round(run.words?.cpm ?? 0))}</b> знаків за хвилину</span><span>Речення: <b>${pct(run.sent?.accuracy)}</b></span></div>
      <p class="pl-note">Розміщення збережеться. Уроки цього рівня з’являться в наступних оновленнях.</p>
      <div class="pl-actions">${btn('Прийняти', `data-act="accept" data-kind="${kind}"`, true)}${btn('Пройти ще раз', 'data-act="again"')}</div>
      <div class="pl-manual"><span>Або обери старт сам:</span>${['zero', 'mid', 'pro'].map((k) => btn(KIND_INFO[k].short, `data-act="accept" data-kind="${k}" data-manual="1"`)).join('')}</div>`;
  }

  // ---------- частини тесту ----------
  const stopTimer = () => { clearInterval(timer); timer = null; };
  function startTimer(onEnd) {
    const t0 = now();
    timer = setInterval(() => {
      const f = Math.min(1, (now() - t0) / PART_MS);
      const bar = q('[data-bar]');
      if (bar) bar.style.width = `${f * 100}%`;
      if (f >= 1) onEnd();
    }, 100);
  }
  const msg = (html) => { const m = q('[data-msg]'); if (m) m.innerHTML = html; };

  function startFind() {
    const letters = makeLetters(rng, 40);
    live = { type: 'find', letters, i: 0, errs: 0, samples: [], shownAt: now() };
    frame(`<div class="pl-letter" data-letter aria-live="polite">${letters[0].toUpperCase()}</div>`);
    startTimer(finishPart);
  }
  function startTyping() {
    const text = stage === 'p2' ? makeWordsText(rng) : makeSentencesText(rng);
    live = { type: 'typing', lines: toLines(text), li: 0, ci: 0, correct: 0, errors: 0, t0: 0 };
    frame('<div class="pl-lines" data-lines></div>');
    paintLines();
    startTimer(finishPart);
  }
  function paintLines() {
    const { lines, li, ci } = live;
    const cur = [...lines[li]].map((c, n) => `<span class="${n < ci ? 'pl-done' : n === ci ? 'pl-cur' : ''}">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    q('[data-lines]').innerHTML = `<div class="pl-line">${cur}</div><div class="pl-line pl-next">${lines[li + 1] ?? ''}</div>`;
  }
  function finishPart() {
    stopTimer();
    const l = live;
    live = null;
    if (l.type === 'find') {
      run.find = scoreFind(l.samples);
      run.weak = weakLetters(l.letters, l.samples);
      stage = 'p2';
    } else {
      const ms = l.t0 ? Math.min(PART_MS, now() - l.t0) : PART_MS;
      const s = scoreTyping({ correct: l.correct, errors: l.errors, ms });
      if (stage === 'p2') { run.words = s; stage = 'p3'; } else { run.sent = s; stage = 'result'; }
    }
    paint();
  }
  function paint() {
    if (stage === 'intro') intro();
    else if (stage === 'result') result();
    else ready();
  }

  // ---------- клавіатура ----------
  const onKey = (e) => {
    if (e.ctrlKey || e.metaKey) return;
    const typing = !!live;
    const waiting = !live && (stage === 'p1' || stage === 'p2' || stage === 'p3');
    if (!typing && !waiting) return; // на екранах з кнопками клавіші працюють як звичайно
    if (!(e.altKey || /^F\d+$/.test(e.code) || e.code === 'Escape')) e.preventDefault(); // без прокрутки пробілом, без Backspace-назад
    if (waiting) { if (e.key === 'Enter') begin(); return; }
    const kind = classifyKey(e, 'ua');
    if (kind === 'ignore') return;
    if (kind === 'wrong-layout') { msg(layoutHint('ua')); return; }
    if (e.key.length !== 1) return;
    const l = live;
    if (l.type === 'find') {
      if (e.key.toLowerCase() === l.letters[l.i]) {
        l.samples.push({ ms: now() - l.shownAt, errors: l.errs });
        l.i += 1; l.errs = 0;
        msg('');
        if (l.i >= l.letters.length) return finishPart();
        q('[data-letter]').textContent = l.letters[l.i].toUpperCase();
        l.shownAt = now();
      } else { l.errs += 1; msg('Не та клавіша. Спробуй ще.'); }
      return;
    }
    if (!l.t0) l.t0 = now();
    if (e.key === l.lines[l.li][l.ci]) {
      l.correct += 1; l.ci += 1; msg('');
      if (l.ci >= l.lines[l.li].length) { l.li += 1; l.ci = 0; if (l.li >= l.lines.length) return finishPart(); }
      paintLines();
    } else { l.errors += 1; msg(''); }
  };
  const begin = () => (stage === 'p1' ? startFind() : startTyping());

  const onClick = (e) => {
    const b = e.target.closest('[data-act],[data-self]');
    if (!b) return;
    if (b.dataset.self) { run.self = run.self === b.dataset.self ? null : b.dataset.self; return intro(); }
    const act = b.dataset.act;
    if (act === 'start-test') { stage = 'p1'; ready(); }
    else if (act === 'go') begin();
    else if (act === 'skip') { stopTimer(); save({ kind: 'zero', source: 'skip', self: run.self }); }
    else if (act === 'carry') save({ ...carryPlacement(profile().progress), self: run.self });
    else if (act === 'again') { Object.assign(run, { find: null, words: null, sent: null, weak: {} }); stage = 'p1'; ready(); }
    else if (act === 'accept') save({ kind: b.dataset.kind, source: b.dataset.manual ? 'manual' : 'test', ...metrics() }, run.weak);
  };

  host.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);
  paint();
  return () => { stopTimer(); host.removeEventListener('click', onClick); window.removeEventListener('keydown', onKey); };
}
