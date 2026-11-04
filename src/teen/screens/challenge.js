// Випробування на час (Етап Т7): 2 хвилини, текст без підказок, медалі. Логіка однакова в усіх світах (../logic/challenge.js);
// світ малює лише обгортку: той самий екран «lesson» (themeOf(world).screen('lesson')) з позначкою challenge.
import { themeOf } from '../worlds/index.js';
import { teenContext } from './context.js';
import { attachLiveKeyboard, setActiveFinger } from '../../keyboard/live.js';
import { normChar, isYo, isParagraphKey } from '../../keyboard/chars.js';
import { layoutHint } from '../../screens/keyboard.js';
import { createExercise, currentChar, pressChar } from '../../lessons/exercise.js';
import { accuracy, charsPerMinute, hardLetters } from '../../lessons/stats.js';
import { icons } from '../../design/icons.js';
import { playSfx } from '../../audio/sfx.js';
import { levelInfo } from '../logic/profile.js';
import { CHALLENGE_MS, MEDAL_NAME, MEDALS, buildChallengeText, challengeOpen, gradeOf, goalsOf, resultLines } from '../logic/challenge.js';
import { boardLinkLabel } from './board.js';
import { signed } from '../logic/board.js';
import { paragraphLines } from './lesson.js';
import { newHtml } from './lessonView.js';

const LINE = 42;
const escText = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const clock = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const langLabel = (l) => (l === 'ua' ? 'українська' : 'англійська');

// Медаль формою, а не кольором: кільце зі стрічкою й 1–3 крапки (бронза — одна, срібло — дві, золото — три)
export function medalIcon(level, size = 40) {
  const dots = Array.from({ length: level }, (_, i) => `<circle cx="${12 + (i - (level - 1) / 2) * 3.6}" cy="14.5" r="1.3" fill="currentColor" stroke="none"/>`).join('');
  return `<svg class="medal" viewBox="0 0 24 24" width="${size}" height="${size}" role="img" aria-label="${level ? MEDAL_NAME[MEDALS[level - 1]] : 'Без медалі'}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
    <path d="M8 2.5 12 9l4-6.5"/><circle cx="12" cy="14.5" r="6.5" ${level ? '' : 'stroke-dasharray="3 3" opacity=".6"'}/>${dots}</svg>`;
}

// ---------- екран ----------
export function challengeScreen(profile) {
  const layout = profile.layout === 'en' ? 'en' : 'ua';
  const theme = themeOf(profile.world);
  if (!challengeOpen(profile, layout)) {
    const ctx = teenContext(profile);
    return theme.frame(ctx, `<div class="pl-step">Випробування · ${langLabel(layout)}</div><h2 class="pl-h">Випробування ще закрите</h2>
      <p class="pl-lead">Воно відкриється, коли ти пройдеш усі уроки цієї мови. Спершу пройди «Цифровий ліс».</p>
      <div class="pl-actions"><a class="pl-btn primary" href="#teen/lesson">До уроків</a><a class="pl-btn" href="#teen/worlds">Карта світів</a></div>`);
  }
  const L = { challenge: true, layout, heading: 'Випробування · 2 хвилини', title: '2 хвилини, без підказок', numRow: true };
  return theme.screen('lesson', teenContext(profile, { lesson: L }));
}

// ---------- саме випробування ----------
export function mountChallenge(app, route, state) {
  const panel = app.querySelector('.keys-panel');
  const profile = () => state.store.get(state.profileId);
  if (!panel || !profile()) return null; // закрите випробування показує рамку без клавіатури
  const q = (s) => app.querySelector(s);
  const p0 = profile();
  const layout = p0.layout === 'en' ? 'en' : 'ua';
  const grade = gradeOf(p0.level);
  let stage = 'ready'; // ready | run | result
  let run = null; // { ex, lines, starts, t0, ids, sum, word }
  let timer = null;

  const msg = (html) => { q('[data-msg]').innerHTML = html || ''; };
  const setTime = (ms) => {
    q('[data-time]').textContent = clock(CHALLENGE_MS - ms);
    q('[data-bar]').style.width = `${Math.min(100, (ms / CHALLENGE_MS) * 100)}%`;
  };
  const clearKeys = () => { panel.querySelectorAll('.key').forEach((k) => k.classList.remove('is-next', 'is-error')); setActiveFinger(panel, null); };

  // ----- початковий екран: цілі, рекорд, «Почати» -----
  function ready() {
    stage = 'ready';
    const rec = profile().challenge.rec[layout];
    const goals = goalsOf(grade).map((g) => `<li class="${rec.medal >= g.level ? 'is-got' : ''}">${medalIcon(rec.medal >= g.level ? g.level : 0, 34)}<span><b>${g.name}</b>${g.cpm} знаків за хвилину<br>точність ${g.acc}%</span></li>`).join('');
    const best = rec.runs ? `Твій рекорд: ${rec.bestCpm} знаків за хвилину (при точності від 92%), точність до ${rec.bestAcc}%.` : 'Це перша спроба: ми просто запишемо результат.';
    const lang = ['ua', 'en'].map((l) => `<button class="pb-lang" data-set-layout="${l}" aria-pressed="${layout === l}">${l === 'ua' ? 'УКР' : 'ENG'}</button>`).join('');
    q('[data-lines]').innerHTML = '';
    q('[data-time]').textContent = clock(CHALLENGE_MS);
    q('[data-bar]').style.width = '0%';
    q('[data-ld]').innerHTML = `<div class="ld-main"><ul class="ch-goals" aria-label="Цілі: медаль за швидкість і точність разом">${goals}</ul>
      <p class="ld-p ch-p">${best} Точність важливіша: друкуй чисто. Підказок немає. Таймер почнеться з першої літери. <a class="ch-link" href="#teen/board">${boardLinkLabel()}</a></p></div>
      <div class="ld-btns"><button class="pl-btn primary" data-act="start">Почати</button><div class="pb-langs" role="group" aria-label="Мова випробування">${lang}</div><a class="pl-btn" href="#teen">До світу</a></div>`;
    q('[data-done]').hidden = false;
    q('[data-ld] [data-act="start"]')?.focus?.();
    msg('');
    clearKeys();
  }

  // ----- текст: два рядки з вікна (як в уроці) -----
  function paint() {
    const { lines, starts, ex } = run;
    const pos = ex.pos;
    let li = starts.findIndex((s, i) => pos >= s && pos < s + lines[i].length);
    if (li < 0) li = lines.length - 1;
    const row = (text, base, withCursor) => `<div class="ll-line">${[...text].map((c, n) => {
      const cls = !withCursor ? '' : base + n < pos ? 'is-done' : base + n === pos ? 'is-current' : '';
      const shown = c === ' ' ? (cls === 'is-current' ? '␣' : '&nbsp;') : escText(c);
      return `<span class="ll-ch ${cls}">${shown}</span>`;
    }).join('')}</div>`;
    q('[data-lines]').innerHTML = row(lines[li], starts[li], true) + (lines[li + 1] ? `<div class="ll-next">${row(lines[li + 1], starts[li + 1], false)}</div>` : '');
  }
  const setAcc = () => {
    const { sum } = run;
    q('[data-acc]').textContent = sum.typed + sum.errors ? `${accuracy(sum.typed, sum.errors)}%` : '—';
  };

  function begin() {
    stage = 'run';
    const { text, ids } = buildChallengeText(layout, profile().challenge.seen);
    const lines = paragraphLines(text, LINE);
    run = {
      ex: createExercise(text), lines, ids, t0: null, ended: false,
      starts: lines.reduce((a, l, i) => { a.push(i ? a[i - 1] + lines[i - 1].length : 0); return a; }, []),
      sum: { typed: 0, errors: 0 }, word: { len: 0, clean: true, words: 0 },
    };
    q('[data-done]').hidden = true;
    q('[data-ld]').innerHTML = '';
    q('[data-speed]').textContent = '—';
    q('[data-acc]').textContent = '—';
    setTime(0);
    paint();
    clearKeys();
    msg('Друкуй наосліп. Таймер почнеться з першої літери.');
  }

  function tick() {
    if (!run?.t0 || stage !== 'run') return;
    const ms = performance.now() - run.t0;
    if (ms >= CHALLENGE_MS) return finish(CHALLENGE_MS);
    setTime(ms);
  }

  // ----- результат -----
  function resultHtml({ acc, cpm, out, rec, game, hard, lines }) {
    const chips = `<div class="ld-chips"><span>Точність <b>${acc}%</b></span><span>Знаків за хвилину <b>${cpm}</b></span>${out.prev && !out.short ? `<span>Минулого разу <b>${out.prev.cpm}</b> (${signed(cpm - out.prev.cpm)})</span>` : ''}${game ? `<span>Досвід <b>+${game.gain + game.bonus}</b></span>` : ''}${hard.length ? `<span>Потренуй: <b>${hard.map((c) => escText(c.toUpperCase())).join(', ')}</b></span>` : ''}</div>`;
    const head = out.medal
      ? `<div class="ch-head"><span class="ld-stars">${medalIcon(out.medal, 40)}</span><h2 class="ld-h">${MEDAL_NAME[MEDALS[out.medal - 1]]}${out.newMedal ? ' · нова медаль' : ''}</h2></div>`
      : '<h2 class="ld-h">Результат записано</h2>';
    return `<div class="ld-main">${head}${chips}<p class="ld-p ch-p">${lines.map(escText).join(' ')}</p>${newHtml(game)}</div>
      <div class="ld-btns"><button class="pl-btn primary" data-act="again">${icons.replay(22)}<span>Ще раз</span></button><a class="pl-btn" href="#teen/board">${boardLinkLabel()}</a><a class="pl-btn" href="#teen">До світу</a></div>`;
  }

  function finish(ms) {
    if (run.ended) return;
    run.ended = true;
    clearInterval(timer); timer = null;
    stage = 'result';
    const { sum, word } = run;
    const acc = accuracy(sum.typed, sum.errors);
    const cpm = charsPerMinute(sum.typed, ms);
    state.store.saveStep(state.profileId, { typed: sum.typed, errors: sum.errors, ms, chars: sum.typed, missed: run.ex.missed, keepResume: true });
    const res = state.store.finishTeenChallenge(state.profileId, { layout, cpm, acc, typed: sum.typed, errors: sum.errors, words: word.words, ids: run.ids });
    if (!res) return;
    const { game, out, rec } = res;
    themeOf(p0.world).setXp?.(app, levelInfo(game.xpTotal));
    clearKeys();
    q('[data-speed]').textContent = String(Math.min(999, cpm));
    setTime(ms);
    q('[data-ld]').innerHTML = resultHtml({ acc, cpm, out, rec, game, hard: hardLetters(run.ex.missed, 3, 2), lines: resultLines(grade, { cpm, acc }, out, rec) });
    q('[data-done]').hidden = false;
    playSfx(out.medal ? 'stars' : 'step', out.medal || 1);
    q('[data-ld] .pl-btn.primary')?.focus?.();
  }

  // ----- клавіші -----
  const endWord = () => { if (run.word.len >= 2 && run.word.clean) run.word.words += 1; run.word.len = 0; run.word.clean = true; };
  const onKey = ({ code, key, kind }) => {
    if (stage === 'result') { if (code === 'Enter') q('[data-ld] .pl-btn.primary')?.click(); return; }
    if (stage === 'ready') { if (code === 'Enter' || code === 'Space') begin(); return; }
    if (kind === 'ignore' || ['Backspace', 'Tab', 'CapsLock', 'Escape'].includes(code)) return;
    if (isParagraphKey(key)) return; // Enter у випробуванні не потрібен
    if (kind === 'wrong-layout') { msg(layoutHint(layout)); return; } // не помилка учня
    if (key.length !== 1) return;
    if (isYo(key) && normChar(currentChar(run.ex)) === "'") return;
    if (!run.t0) { run.t0 = performance.now(); timer = setInterval(tick, 250); msg(''); } // таймер стартує з першої літери
    const want0 = currentChar(run.ex);
    const { state: st, result } = pressChar(run.ex, key);
    run.ex = st;
    if (result === 'error') {
      run.sum.errors += 1;
      run.word.clean = false;
      playSfx('hint');
      msg('Не та клавіша. Друкуй далі.');
    } else if (result === 'ok' || result === 'done') {
      run.sum.typed += 1;
      playSfx('tap');
      msg('');
      if (want0 === ' ') endWord(); else run.word.len += 1;
      if (result === 'done') { endWord(); paint(); return finish(Math.min(CHALLENGE_MS, performance.now() - run.t0)); }
      paint();
    }
    setAcc();
  };

  const onClick = (e) => {
    if (e.target.closest('[data-act="start"]')) return begin();
    if (e.target.closest('[data-act="again"]')) return state.go('teen/challenge');
    const lang = e.target.closest('[data-set-layout]');
    if (lang) { state.store.update(state.profileId, { layout: lang.dataset.setLayout }); state.go('teen/challenge'); }
  };

  const stop = attachLiveKeyboard(panel, { getLayout: () => layout, trackFinger: false, altGr: true, onKey });
  app.addEventListener('click', onClick);
  ready();
  return () => { clearInterval(timer); stop(); app.removeEventListener('click', onClick); };
}
