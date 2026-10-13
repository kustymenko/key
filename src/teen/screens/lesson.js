// Екран уроку швидкого курсу 5–6 класів (Етап Т3). Логіка однакова в усіх світах; світ малює лише обгортку (themeOf(world).screen('lesson')).
import { themeOf } from '../worlds/index.js';
import { teenContext } from './context.js';
import { attachLiveKeyboard, setActiveFinger } from '../../keyboard/live.js';
import { fingerOf, shiftCodeFor } from '../../keyboard/fingers.js';
import { codeOfChar, needsShift } from '../../keyboard/layouts.js';
import { layoutHint } from '../../screens/keyboard.js';
import { createExercise, currentChar, pressChar } from '../../lessons/exercise.js';
import { accuracy, charsPerMinute, hardLetters, mergeMissed } from '../../lessons/stats.js';
import { stars as starsIcons, icons } from '../../design/icons.js';
import { playSfx } from '../../audio/sfx.js';
import { getTeenLesson, lessonTitleOf, isPunctKey } from '../logic/course.js';
import { buildTeenLesson } from '../logic/lessons.js';
import { toLines } from '../logic/placement.js';
import { lessonStates, currentLesson, teenStars, QUICK_ACC, PASS_ACC, playable } from '../logic/progress.js';

const LINE = 42; // знаків у рядку тексту
const IDLE_CAP = 4000; // пауза довша за 4 с у швидкість не входить
const KEY_NAMES = { '.': 'крапка', ',': 'кома', ';': 'крапка з комою', '/': 'скісна риска', ' ': 'пробіл' };
const keyLabel = (c) => (isPunctKey(c) ? c : c.toUpperCase());
const escText = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

// ---------- екрани ----------
// Урок для екрана: route.id або поточний; закритий урок замінюємо поточним
export function resolveLesson(profile, id) {
  const layout = profile.layout === 'en' ? 'en' : 'ua';
  const states = lessonStates(layout, profile);
  const want = states.find((l) => l.id === id);
  const lesson = want && playable(want) ? want : currentLesson(states) ?? states[states.length - 1];
  return { layout, states, lesson };
}

export function lessonScreen(profile, id) {
  const { layout, lesson } = resolveLesson(profile, id);
  const L = { id: lesson.id, layout, title: lesson.title, heading: lessonTitleOf(lesson), quick: lesson.quick };
  return themeOf(profile.world).screen('lesson', teenContext(profile, { lesson: L }));
}

const stateText = (l) => ({ done: 'пройдено', credited: 'зараховано', current: l.quick ? 'швидка перевірка' : 'поточний', locked: 'закрито' }[l.state]);
export function lessonsListScreen(profile) {
  const ctx = teenContext(profile);
  const cards = ctx.states.map((l) => `<button class="lg-card is-${l.state}" data-lesson-go="${l.id}" ${l.state === 'locked' ? 'disabled' : ''}>
    <b>${l.id}</b><span>${l.label}</span><small>${l.state === 'done' ? starsIcons(l.stars, 3, 22) : stateText(l)}</small></button>`).join('');
  const lang = ['ua', 'en'].map((l) => `<button class="pb-lang" data-set-layout="${l}" aria-pressed="${ctx.layout === l}">${l === 'ua' ? 'УКР' : 'ENG'}</button>`).join('');
  return themeOf(profile.world).frame(ctx, `<div class="pl-step">Швидкий курс · ${ctx.layout === 'ua' ? 'українська' : 'англійська'}</div><h2 class="pl-h">Усі уроки</h2>
    <div class="lg-grid">${cards}</div>
    <div class="pl-actions"><div class="pb-langs" role="group" aria-label="Мова курсу">${lang}</div><a class="pl-btn" href="#teen">До світу</a></div>`);
}

export function mountLessonsList(app, state) {
  const onClick = (e) => {
    const go = e.target.closest('[data-lesson-go]');
    if (go && !go.disabled) return state.go(`teen/lesson/${go.dataset.lessonGo}`);
    const lang = e.target.closest('[data-set-layout]');
    if (lang) { state.store.update(state.profileId, { layout: lang.dataset.setLayout }); state.go('teen/lessons'); }
  };
  app.addEventListener('click', onClick);
  return () => app.removeEventListener('click', onClick);
}

// ---------- сам урок ----------
export function mountLesson(app, route, state) {
  const panel = app.querySelector('.keys-panel');
  const profile = () => state.store.get(state.profileId);
  if (!panel || !profile()) return null;
  const q = (s) => app.querySelector(s);
  const p0 = profile();
  const { layout, lesson } = resolveLesson(p0, route.id);
  const grade = p0.level;
  const rng = Math.random;
  let quick = !!lesson.quick;
  let built = buildTeenLesson({ layout, id: lesson.id, rng, quick });
  let hintOn = true;
  const sum = { typed: 0, errors: 0, ms: 0, missed: {} }; // підсумок по уроку
  let run = null; // стан поточного кроку
  let stage = 'step'; // step | result
  let fell = false; // швидка перевірка не вдалась — проходимо урок повністю

  const msg = (html) => { q('[data-msg]').innerHTML = html; };
  const setStat = () => {
    const acc = sum.typed + sum.errors ? accuracy(sum.typed, sum.errors) : null;
    q('[data-acc]').textContent = acc == null ? '—' : `${acc}%`;
    const ms = sum.ms + (run?.ms ?? 0);
    q('[data-speed]').textContent = sum.typed + (run?.ex?.pos ?? 0) > 4 && ms > 0 ? String(Math.min(999, charsPerMinute(sum.typed + (run?.ex?.pos ?? 0), ms))) : '—';
  };

  // ----- підсвічування клавіш -----
  const clearNext = () => panel.querySelectorAll('.key').forEach((k) => k.classList.remove('is-next', 'is-error'));
  function lightKeys(chars, { error = false, fingers = true } = {}) {
    clearNext();
    const codes = new Set();
    for (const ch of chars) {
      const code = codeOfChar(ch, layout);
      if (!code) continue;
      codes.add(code);
      if (needsShift(ch, layout)) codes.add(shiftCodeFor(code));
    }
    for (const c of codes) {
      const el = panel.querySelector(`.key[data-code="${c}"]`);
      if (!el) continue;
      void el.offsetWidth; // перезапуск анімації підказки
      el.classList.add('is-next');
      if (error) el.classList.add('is-error');
    }
    panel.querySelector('.hands')?.classList.toggle('is-error', error);
    setActiveFinger(panel, fingers ? [...codes].map(fingerOf).filter(Boolean) : null);
  }
  const showHint = (ch, error = false) => {
    if (hintOn && run.step.hint) lightKeys([ch], { error });
    else lightKeys([], { fingers: false });
  };

  // ----- текст: два рядки з вікна -----
  function paintLines() {
    const { lines, starts } = run;
    const pos = run.ex.pos;
    let li = starts.findIndex((s, i) => pos >= s && pos < s + lines[i].length);
    if (li < 0) li = lines.length - 1;
    const row = (text, base, withCursor) => `<div class="ll-line">${[...text].map((c, n) => {
      const cls = !withCursor ? '' : base + n < pos ? 'is-done' : base + n === pos ? 'is-current' : '';
      return `<span class="ll-ch ${cls}">${c === ' ' ? (cls === 'is-current' ? '␣' : '&nbsp;') : escText(c)}</span>`;
    }).join('')}</div>`;
    q('[data-lines]').innerHTML = row(lines[li], starts[li], true) + (lines[li + 1] ? `<div class="ll-next">${row(lines[li + 1], starts[li + 1], false)}</div>` : '');
    q('[data-bar]').style.width = `${Math.round(((run.i + pos / run.ex.text.length) / built.steps.length) * 100)}%`;
  }

  // ----- кроки -----
  function showStep() {
    const step = built.steps[run.i];
    run.step = step;
    run.ms = 0;
    run.last = null;
    q('[data-done]').hidden = true;
    q('[data-ld]').innerHTML = ''; // знайомство з попереднього кроку не лишається в схованій панелі
    if (step.kind === 'intro') return showIntro(step);
    run.ex = createExercise(step.text);
    run.lines = toLines(step.text, LINE);
    run.starts = run.lines.reduce((a, l, i) => { a.push(i ? a[i - 1] + run.lines[i - 1].length : 0); return a; }, []);
    paintLines();
    showHint(currentChar(run.ex));
    msg(step.hint ? '' : 'Цю вправу — без підказки. Друкуй наосліп.');
    setStat();
  }
  function showIntro(step) {
    run.ex = null;
    const caps = step.shift
      ? `<span class="li-key">⇧</span><span class="li-plus">+</span>${step.keys.map((k) => `<span class="li-key">${keyLabel(k)}</span>`).join('')}`
      : step.keys.map((k) => `<span class="li-key" aria-label="${KEY_NAMES[k] ?? k}">${keyLabel(k)}</span>`).join('');
    const note = step.shift
      ? 'Велика літера: Shift однією рукою, літера — другою. Літери лівої руки — з правим Shift, правої руки — з лівим.'
      : `Нові клавіші підсвічені на клавіатурі. Кожну натискай своїм пальцем${quick ? '' : ': схема долонь покаже, яким'}.`;
    q('[data-lines]').innerHTML = '';
    q('[data-ld]').innerHTML = `<div class="li"><div class="li-title">${step.shift ? 'Великі літери' : 'Нові клавіші'}</div><div class="li-keys">${caps}</div><p>${note}</p></div>
      <div class="ld-btns"><button class="pl-btn primary" data-act="start">Почати</button></div>`;
    q('[data-done]').hidden = false;
    q('[data-bar]').style.width = '0%';
    if (step.shift) lightKeys([step.keys[0].toUpperCase()], { fingers: false });
    else lightKeys(step.keys, { fingers: false });
    msg('');
  }
  const nextStep = () => { run.i += 1; if (run.i >= built.steps.length) return finish(); showStep(); };

  // ----- підсумок -----
  function nextInfo() {
    const states = lessonStates(layout, profile());
    return { next: currentLesson(states), states };
  }
  function resultHtml({ acc, cpm, stars, pass, credited, hard, next }) {
    const chips = `<div class="ld-chips"><span>Точність <b>${acc}%</b></span><span>Знаків за хвилину <b>${cpm}</b></span>${hard.length ? `<span>Потренуй: <b>${hard.map((c) => c.toUpperCase()).join(', ')}</b></span>` : ''}</div>`;
    const head = pass
      ? `<div class="ld-stars">${starsIcons(stars, 3, 34)}</div><h2 class="ld-h">${credited ? 'Зараховано з першої спроби!' : 'Урок пройдено!'}</h2>`
      : `<h2 class="ld-h">Ще трохи точності</h2><p class="ld-p">Для наступного уроку потрібно ${PASS_ACC}%. Спробуй ще раз: спокійно, без поспіху.</p>`;
    const nextBtn = pass && next && next.id !== lesson.id ? `<a class="pl-btn primary" href="#teen/lesson/${next.id}" data-next>Далі: урок ${next.id}</a>` : '';
    const doneAll = pass && !next ? '<p class="ld-p">Літерні уроки пройдено. Далі — довгі тексти й розділові знаки.</p>' : '';
    return `<div class="ld-main">${head}${chips}${doneAll}</div>
      <div class="ld-btns">${nextBtn}<button class="pl-btn ${nextBtn ? '' : 'primary'}" data-act="again">${icons.replay(22)}<span>Ще раз</span></button><a class="pl-btn" href="#teen">До світу</a></div>`;
  }

  function finish() {
    const acc = accuracy(sum.typed, sum.errors);
    const cpm = charsPerMinute(sum.typed, sum.ms);
    // швидка перевірка: з першої спроби не нижче порога — зараховано; інакше йдемо повним уроком
    if (quick && acc < QUICK_ACC) {
      quick = false; fell = true;
      Object.assign(sum, { typed: 0, errors: 0, ms: 0, missed: {} });
      built = buildTeenLesson({ layout, id: lesson.id, rng, quick: false });
      run = { i: 0 };
      showStep();
      msg('Давай докладніше: пройдемо урок повністю.');
      return;
    }
    stage = 'result';
    const stars = teenStars(grade, acc);
    const pass = stars > 0;
    const hard = hardLetters(sum.missed, 3, 2);
    state.store.saveStep(state.profileId, { typed: sum.typed, errors: sum.errors, ms: sum.ms, chars: sum.typed, missed: sum.missed, keepResume: true });
    if (pass) state.store.finishTeenLesson(state.profileId, { layout, lessonId: lesson.id, stars, acc, cpm, by: quick ? 'quick' : 'lesson' });
    const { next } = nextInfo();
    lightKeys([], { fingers: false });
    const done = q('[data-done]');
    q('[data-ld]').innerHTML = resultHtml({ acc, cpm, stars, pass, credited: quick && !fell, hard, next });
    done.hidden = false;
    q('[data-bar]').style.width = '100%';
    playSfx(pass ? 'stars' : 'hint', stars);
    done.querySelector('.pl-btn.primary')?.focus?.();
  }

  // ----- клавіші -----
  const onKey = ({ code, key, kind }) => {
    if (stage === 'result') { if (code === 'Enter') (app.querySelector('[data-ld] .pl-btn.primary'))?.click(); return; }
    if (run.step.kind === 'intro') { if (code === 'Enter' || code === 'Space') nextStep(); return; }
    if (kind === 'ignore' || ['Backspace', 'Tab', 'Enter', 'CapsLock', 'Escape'].includes(code)) return;
    if (kind === 'wrong-layout') { msg(layoutHint(layout)); return; }
    if (key.length !== 1) return;
    const now = performance.now();
    if (run.last != null) run.ms += Math.min(now - run.last, IDLE_CAP);
    run.last = now;
    const { state: st, result } = pressChar(run.ex, key);
    run.ex = st;
    if (result === 'error') {
      sum.errors += 1;
      const want = currentChar(st);
      playSfx('hint');
      if (hintOn && run.step.hint) {
        showHint(want, true);
        const name = KEY_NAMES[want.toLowerCase()] ?? (needsShift(want, layout) ? `велика ${want} (Shift)` : want.toUpperCase());
        msg(`Тобі потрібна клавіша: ${name}`);
      } else msg('Не та клавіша. Спробуй ще.');
    } else if (result === 'ok' || result === 'done') {
      sum.typed += 1;
      playSfx('tap');
      msg('');
      if (result === 'done') {
        sum.ms += run.ms;
        sum.missed = mergeMissed(sum.missed, st.missed);
        playSfx('step');
        run.ex = { ...st };
        paintLines();
        setStat();
        return nextStep();
      }
      paintLines();
      showHint(currentChar(st));
    }
    setStat();
  };

  const onClick = (e) => {
    if (e.target.closest('[data-act="start"]')) return nextStep();
    if (e.target.closest('[data-act="again"]')) return state.go(`teen/lesson/${lesson.id}`); // саме цей урок ще раз
    const hint = e.target.closest('[data-hint]');
    if (hint) {
      hint.blur?.();
      hintOn = !hintOn;
      hint.setAttribute('aria-pressed', String(hintOn));
      if (run.ex && !run.ex.done) showHint(currentChar(run.ex));
    }
  };

  const stop = attachLiveKeyboard(panel, { getLayout: () => layout, trackFinger: false, onKey });
  app.addEventListener('click', onClick);
  run = { i: 0 };
  showStep();
  return () => { stop(); app.removeEventListener('click', onClick); };
}
