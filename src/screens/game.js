import { klavik } from '../character/klavik.js';
import { keyboard } from '../keyboard/onscreen.js';
import { attachLiveKeyboard } from '../keyboard/live.js';
import { codeOfChar } from '../keyboard/layouts.js';
import { icons } from '../design/icons.js';
import { btn, homeButton, soundButton, setBackdrop, offerBreak } from './common.js';
import { layoutHint } from './keyboard.js';
import { gameArt } from './games.js';
import { playSfx } from '../audio/sfx.js';
import {
  GAMES, FIELD_H, ITEM_SIZE, LANES, createGame, step, press, target, topOf, timeLeft, isUnlocked, gameLetters,
} from '../games/engine.js';
import { GAME_START, GAME_PRAISE, GAME_STREAK, GAME_RECORD, gameDonePhrase, pickPhrase } from '../content/phrases.js';

const FIELD_W = 1286; // ширина поля всередині рамки
const ITEM_W = 92;
const FACE = 120;
const laneX = (lane) => 20 + (lane * (FIELD_W - 40 - ITEM_W)) / (LANES - 1);

// Порожня оболонка: далі екран «оживляє» mountGame
export const gameScreen = () => '<div class="screen screen-game theme-neutral" data-game-root></div>';

export function mountGame(root, state) {
  const stage = root.querySelector('.stage');
  const kind = GAMES[state.gameKind] ? state.gameKind : 'balloons';
  if (!isUnlocked(kind, state.layout, state.progress, state.openAll)) { // закриту гру не відкриваємо
    setTimeout(() => state.go('games'), 0);
    return null;
  }
  const meta = GAMES[kind];
  const letters = gameLetters(state.layout, state.progress, state.openAll);
  const missed = state.profileId ? state.store.get(state.profileId)?.stats.missed ?? {} : {};
  const weights = Object.fromEntries(Object.entries(missed).map(([c, n]) => [c, Math.floor(n / 2)]));

  let screen = null;
  let g = null;
  let raf = 0;
  let last = 0;
  let paused = false;
  let started = false;
  let stopLive = null;
  let streak = 0;
  let targetId = null;
  let lastHint = 0;
  let lastPhrase = null;
  const els = new Map(); // id -> елемент на полі
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); };
  const $ = (sel) => screen.querySelector(sel);

  const setFace = (emotion) => { $('[data-face]').innerHTML = klavik(emotion, FACE); };
  const say = (text, face = null, back = 0) => {
    $('[data-msg]').textContent = text;
    if (face) setFace(face);
    if (back) later(() => setFace('think'), back);
  };
  const startPhrase = () => pickPhrase(GAME_START[kind], lastPhrase);

  // Яку клавішу підказати: ту, що ось-ось зникне
  function paintTarget() {
    const t = target(g);
    const id = t?.id ?? null;
    if (id === targetId) return;
    if (targetId !== null) els.get(targetId)?.classList.remove('is-target');
    targetId = id;
    screen.querySelectorAll('.key.is-next').forEach((k) => k.classList.remove('is-next'));
    if (!t) return;
    els.get(id)?.classList.add('is-target');
    const k = screen.querySelector(`.key[data-code="${codeOfChar(t.ch, state.layout)}"]`);
    if (k) { void k.offsetWidth; k.classList.add('is-next'); }
  }

  function addItem(it) {
    const el = document.createElement('div');
    el.className = `game-item is-${kind}`;
    const code = codeOfChar(it.ch, state.layout);
    const key = screen.querySelector(`.key[data-code="${code}"]`);
    const finger = key ? [...key.classList].find((c) => /^f-/.test(c)) : '';
    el.classList.add(finger || 'f-th'); // колір плитки = колір пальця цієї літери
    el.innerHTML = `<span class="game-item-ch">${it.ch.toUpperCase()}</span>`;
    els.set(it.id, el);
    $('[data-field]').appendChild(el);
    place(it, el);
  }

  function place(it, el) {
    const sway = kind === 'balloons' ? Math.sin(g.t * 1.3 + it.phase) * 16 : 0;
    el.style.transform = `translate(${Math.round(laneX(it.lane) + sway)}px, ${Math.round(topOf(kind, it.p))}px)`;
  }

  function removeItem(id, cls) {
    const el = els.get(id);
    els.delete(id);
    if (!el) return;
    el.classList.add(cls);
    setTimeout(() => el.remove(), 420);
  }

  function burst(el) { // маленький салют на місці влучання
    const x = el.style.transform;
    el.style.transform = x; // позиція вже зафіксована
    el.insertAdjacentHTML('beforeend', Array.from({ length: 6 }, (_, i) => `<i class="spark" style="--a:${i * 60}deg"></i>`).join(''));
  }

  function updateHud() {
    $('[data-score]').textContent = g.caught;
    const bar = $('[data-timebar]');
    const left = timeLeft(g);
    if (bar && left !== null) bar.firstElementChild.style.transform = `scaleX(${left})`;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000 || 0);
    last = now;
    if (paused || !started) return;
    for (const ev of step(g, dt)) {
      if (ev.type === 'spawn') addItem(ev.item);
      else if (ev.type === 'gone') { streak = 0; removeItem(ev.item.id, kind === 'balloons' && !ev.final ? 'is-away' : 'is-fade'); }
    }
    for (const it of g.items) { const el = els.get(it.id); if (el) place(it, el); }
    paintTarget();
    updateHud();
    if (g.done) finish();
  }

  function onKey({ key, code, kind: how }) {
    if (code === 'Escape') return togglePause();
    if (!started) { if (code === 'Space' || code === 'Enter') begin(); return; }
    if (paused || g.done) return;
    if (how === 'wrong-layout') { // не промах: підказка про мову
      const b = $('[data-banner]');
      b.innerHTML = layoutHint(state.layout);
      b.hidden = false;
      clearTimeout(b._t);
      b._t = setTimeout(() => { b.hidden = true; }, 3500);
      return;
    }
    if (how !== 'ok') return;
    const { hit } = press(g, key);
    if (!hit) { // літери немає на полі: тихий м'який звук, без штрафу
      const now = performance.now();
      if (g.items.length && now - lastHint > 700) { lastHint = now; playSfx('hint'); }
      return;
    }
    const el = els.get(hit.id);
    if (el) burst(el);
    removeItem(hit.id, 'is-pop');
    playSfx('pop');
    streak += 1;
    if (streak % 8 === 0) say(pickPhrase(GAME_STREAK), 'joy', 2200);
    else if (streak % 4 === 0) say(pickPhrase(GAME_PRAISE), 'joy', 1600);
    if (targetId === hit.id) targetId = null;
    paintTarget();
    updateHud();
  }

  function begin() {
    if (started) return;
    started = true;
    $('[data-intro]')?.remove();
    last = performance.now();
    say(startPhrase(), 'think');
  }

  function togglePause() {
    if (!started || g.done) return;
    const layer = screen.querySelector('.pause-layer');
    if (layer) { layer.remove(); paused = false; last = performance.now(); return; }
    paused = true;
    screen.insertAdjacentHTML('beforeend', `<div class="pause-layer" role="dialog" aria-label="Пауза">
      <div>${klavik('rest', 200)}</div>
      <div class="row">${btn({ label: 'Продовжити', icon: 'play', kind: 'primary', size: 'big', attrs: 'data-act="resume"' })}${btn({ label: 'Додому', icon: 'home', kind: 'light', size: 'big', attrs: 'data-home' })}</div>
    </div>`);
  }

  function finish() {
    stopLive?.();
    stopLive = null;
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    timers.clear();
    const n = g.caught;
    let record = false;
    if (state.profileId) record = state.store.saveGame(state.profileId, kind, state.layout, n).record;
    const ratio = g.spawned ? n / g.spawned : 0;
    playSfx('stars', ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1);
    if (record) later(() => playSfx('badge'), 900);
    const phrase = gameDonePhrase(kind, n);
    setBackdrop(true);
    stage.innerHTML = `<div class="screen screen-done screen-game-done theme-warm" data-done>
      <div class="topbar">${homeButton()}<div class="topbar-spacer"></div>${soundButton()}</div>
      <div class="done-main">
        <div class="done-klavik">${klavik(n > 0 ? 'joy' : 'cheer', 230)}</div>
        <div class="done-col">
          <div class="game-score" role="img" aria-label="${phrase}">${gameArt(kind, 110)}<b>${n}</b></div>
          <div class="bubble done-bubble"><span class="bubble-text">${phrase}</span></div>
          ${record ? `<div class="done-badges" role="status"><span class="done-badges-title">${icons.trophy(34)} ${pickPhrase(GAME_RECORD)}</span></div>` : ''}
          <div class="done-buttons">
            ${btn({ label: 'Ще раз', icon: 'replay', kind: 'primary', size: 'big', attrs: 'data-act="again"' })}
            ${btn({ label: 'Ігри', icon: 'balloon', kind: 'light', size: 'big', attrs: 'data-go="games"' })}
            ${btn({ label: 'Карта', icon: 'map', kind: 'light', size: 'big', attrs: 'data-go="map"' })}
          </div>
        </div>
      </div>
    </div>`;
    offerBreak(stage.firstElementChild, state);
  }

  function start() {
    cancelAnimationFrame(raf);
    stopLive?.();
    timers.forEach(clearTimeout);
    timers.clear();
    els.clear();
    setBackdrop(false);
    g = createGame({ kind, letters, level: state.level, weights });
    started = false; paused = false; streak = 0; targetId = null;
    stage.innerHTML = gameScreen();
    screen = stage.querySelector('[data-game-root]');
    const chips = letters.map((c) => `<span class="keycap">${c.toUpperCase()}</span>`).join('');
    const bar = kind === 'falling' && state.level === '3-4' ? '<div class="time-bar" data-timebar aria-hidden="true"><i></i></div>' : '';
    screen.innerHTML = `<div class="topbar">${homeButton()}
        <div class="pill game-title">${icons[kind === 'balloons' ? 'balloon' : 'drop'](34)}<span>${meta.title}</span></div>
        <div class="topbar-spacer">${bar}</div>
        <div class="pill" aria-label="Скільки зроблено">${icons.check(32)}<b data-score>0</b></div>
        ${soundButton()}${btn({ label: 'Пауза', icon: 'pause', kind: 'light', attrs: 'aria-label="Пауза" data-act="pause"' })}</div>
      <div class="game-field" data-field aria-label="Ігрове поле">
        <div class="game-banner" data-banner hidden></div>
        <div class="game-intro" data-intro>
          ${gameArt(kind, 96)}
          <div class="bubble"><span class="bubble-text">${startPhrase()}</span></div>
          <div class="game-letters" aria-label="Літери гри">${chips}</div>
          ${btn({ label: 'Почати', icon: 'play', kind: 'primary', attrs: 'data-act="go"' })}
        </div>
      </div>
      <div class="game-bottom">
        <div class="game-kb">${keyboard({ layout: state.layout, next: null })}</div>
        <div class="game-helper"><div data-face aria-hidden="true">${klavik('think', FACE)}</div><div class="bubble"><span class="bubble-text" data-msg>Готовий?</span></div></div>
      </div>`;
    stopLive = attachLiveKeyboard(screen, { getLayout: () => state.layout, trackFinger: false, onKey });
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  const onClick = (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    b.blur(); // щоб пробіл не «натискав» кнопку
    const act = b.dataset.act;
    if (act === 'go') begin();
    if (act === 'pause' || act === 'resume') togglePause();
    if (act === 'again') start();
  };
  stage.addEventListener('click', onClick);
  start();

  return () => {
    stage.removeEventListener('click', onClick);
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    stopLive?.();
  };
}
