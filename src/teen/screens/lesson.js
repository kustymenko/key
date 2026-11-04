// Екран уроку швидкого курсу 5–6 класів (Етап Т3). Логіка однакова в усіх світах; світ малює лише обгортку (themeOf(world).screen('lesson')).
import { themeOf } from '../worlds/index.js';
import { teenContext } from './context.js';
import { attachLiveKeyboard, setActiveFinger } from '../../keyboard/live.js';
import { fingerOf } from '../../keyboard/fingers.js';
import { keysFor, needsShift, SHIFTED } from '../../keyboard/layouts.js';
import { normChar, isYo, isParagraphKey, PARAGRAPH } from '../../keyboard/chars.js';
import { setLaptopFlag, YO_FLAG } from '../../storage/laptop.js';
import { layoutHint } from '../../screens/keyboard.js';
import { createExercise, currentChar, pressChar } from '../../lessons/exercise.js';
import { accuracy, charsPerMinute, hardLetters, mergeMissed } from '../../lessons/stats.js';
import { stars as starsIcons, icons } from '../../design/icons.js';
import { playSfx } from '../../audio/sfx.js';
import { getTeenLesson, lessonTitleOf, isPunctKey, needsNumberRow } from '../logic/course.js';
import { buildTeenLesson } from '../logic/lessons.js';
import { toLines } from '../logic/placement.js';
import { lessonStates, currentLesson, teenStars, QUICK_ACC, PASS_ACC, playable } from '../logic/progress.js';
import { levelInfo } from '../logic/profile.js';
import { newHtml } from './lessonView.js';

const LINE = 42; // знаків у рядку тексту
// Рядки вправи; абзаци (\n) починаються з нового рядка, а кінець абзацу позначається символом ↵ (клавіша Enter)
export function paragraphLines(text, width = LINE) {
  const parts = text.split(PARAGRAPH);
  return parts.flatMap((part, i) => {
    const ls = toLines(part, width);
    if (i < parts.length - 1) ls[ls.length - 1] += PARAGRAPH;
    return ls;
  });
}
const IDLE_CAP = 4000; // пауза довша за 4 с у швидкість не входить
const KEY_NAMES = {
  '.': 'крапка', ',': 'кома', ';': 'крапка з комою', '/': 'скісна риска', ' ': 'пробіл', ':': 'двокрапка', '?': 'знак питання', '!': 'знак оклику',
  '(': 'ліва дужка', ')': 'права дужка', '"': 'лапки', '-': 'дефіс', "'": 'апостроф', 'ґ': 'літера Ґ', [PARAGRAPH]: 'Enter (новий абзац)',
  '№': 'знак номера', '%': 'відсоток', '*': 'зірочка', '+': 'плюс', '=': 'дорівнює', '#': 'решітка', $: 'долар', '&': 'амперсанд', '@': 'равлик',
};
// на кнопці-підказці апостроф прямий: так само, як на клавіатурі (типографський ’ схожий на кому)
const keyLabel = (c) => (c === PARAGRAPH ? 'Enter' : isPunctKey(c) ? c : c.toUpperCase());
// Де клавіша: «Shift + 7», «Alt Gr + Г», «ліворуч від 1» (стандартна розкладка; на деяких ноутбуках може бути інакше)
const POS = { Backquote: 'ліворуч від 1', Minus: 'праворуч від 0', Equal: 'праворуч від дефіса', Quote: 'праворуч від ;', Enter: 'праворуч у ряду з ;' };
const LABELS = { KeyU: 'Г', Slash: '.' };
export function comboText(ch, layout) {
  const codes = keysFor(ch, layout);
  if (!codes.length) return '';
  const main = codes[0];
  const label = layout === 'ua' && LABELS[main] ? LABELS[main] : main.startsWith('Digit') ? main.slice(5) : main === 'Semicolon' ? ';' : main === 'Equal' ? '=' : main === 'Quote' ? '’' : main === 'Slash' ? '/' : '';
  if (codes.includes('AltRight')) return `Alt Gr${codes.some((c) => c.startsWith('Shift')) ? ' + Shift' : ''} + ${label}`;
  if (codes.some((c) => c.startsWith('Shift'))) return `Shift + ${label}`;
  return POS[main] ? `клавіша ${POS[main]}` : '';
}
const isSymbol = (ch, layout) => SHIFTED[layout]?.[ch] !== undefined;
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
  const L = { id: lesson.id, layout, title: lesson.title, heading: lessonTitleOf(lesson), quick: lesson.quick, numRow: needsNumberRow(lesson) };
  return themeOf(profile.world).screen('lesson', teenContext(profile, { lesson: L }));
}

const stateText = (l) => ({ done: 'пройдено', credited: 'зараховано', current: l.quick ? 'швидка перевірка' : 'поточний', locked: 'закрито' }[l.state]);
export function lessonsListScreen(profile) {
  const ctx = teenContext(profile);
  const cards = ctx.states.map((l) => `<button class="lg-card is-${l.state}" data-lesson-go="${l.id}" ${l.state === 'locked' ? 'disabled' : ''}>
    <b>${l.id}</b><span>${l.label}</span><small>${l.state === 'done' ? starsIcons(l.stars, 3, 22) : stateText(l)}</small></button>`).join('');
  const lang = ['ua', 'en'].map((l) => `<button class="pb-lang" data-set-layout="${l}" aria-pressed="${ctx.layout === l}">${l === 'ua' ? 'УКР' : 'ENG'}</button>`).join('');
  return themeOf(profile.world).frame(ctx, `<div class="pl-step">Швидкий курс · ${ctx.layout === 'ua' ? 'українська' : 'англійська'}</div><h2 class="pl-h">Усі уроки</h2>
    <div class="lg-grid${ctx.states.length > 18 ? ' is-many' : ''}" style="grid-template-columns:repeat(${ctx.states.length > 12 ? 6 : 4}, 1fr)">${cards}</div>
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
  let built = buildTeenLesson({ layout, id: lesson.id, rng, quick, grade });
  let hintOn = true;
  const sum = { typed: 0, errors: 0, ms: 0, missed: {}, steps: 0, words: 0 }; // підсумок по уроку (steps — вправи, words — слова без помилок: для завдань дня)
  const word = { len: 0, clean: true }; // поточне слово
  let run = null; // стан поточного кроку
  let stage = 'step'; // step | result
  let fell = false; // швидка перевірка не вдалась — проходимо урок повністю

  // примітка в уроках про апостроф і Ґ: клавіша може стояти інакше (показується, поки немає іншого повідомлення)
  const MOVED_NOTE = 'На деяких ноутбуках ця клавіша може бути в іншому місці.';
  const baseMsg = () => (lesson.moved && built.steps[run?.i]?.kind === 'drill' ? MOVED_NOTE : '');
  const msg = (html) => { q('[data-msg]').innerHTML = html || baseMsg(); };
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
    for (const ch of chars) keysFor(ch, layout).forEach((c) => codes.add(c)); // основна клавіша, Shift, AltGr (для Ґ)
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
      const shown = c === ' ' ? (cls === 'is-current' ? '␣' : '&nbsp;') : c === PARAGRAPH ? '↵' : escText(c);
      return `<span class="ll-ch ${cls}">${shown}</span>`;
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
    run.lines = paragraphLines(step.text, LINE);
    run.starts = run.lines.reduce((a, l, i) => { a.push(i ? a[i - 1] + run.lines[i - 1].length : 0); return a; }, []);
    paintLines();
    showHint(currentChar(run.ex));
    msg(step.hint ? '' : 'Цю вправу — без підказки. Друкуй наосліп.');
    setStat();
  }
  function showIntro(step) {
    run.ex = null;
    const isMarks = !!step.marks;
    const isDigits = !!step.digits;
    // знак із підписом, як його набрати: «?» — Shift + 7, «Ґ» — Alt Gr + Г
    const cap = (k) => `<span class="li-key ${isMarks ? 'has-how' : ''}" aria-label="${KEY_NAMES[k] ?? k}">${keyLabel(k)}${isMarks ? `<small>${comboText(k, layout)}</small>` : ''}</span>`;
    const caps = step.shift
      ? `<span class="li-key">⇧</span><span class="li-plus">+</span>${step.keys.map((k) => `<span class="li-key">${keyLabel(k)}</span>`).join('')}`
      : step.keys.map(cap).join('');
    const names = isMarks ? step.keys.map((k) => KEY_NAMES[k]).filter(Boolean).join(', ') : '';
    const note = step.shift
      ? 'Велика літера: Shift однією рукою, літера — другою. Літери лівої руки — з правим Shift, правої руки — з лівим.'
      : isDigits
        ? 'Цифри — у верхньому ряду. Кожну цифру натискай тим самим пальцем, що й літеру під нею. Спершу знайди клавішу поглядом, потім спробуй не дивитись.'
      : isMarks
        ? `Знайди на клавіатурі: ${names}.${step.keys.some((k) => keysFor(k, layout).some((c) => c.startsWith('Shift'))) ? ' Shift тримай рукою, протилежною до клавіші.' : ''}${step.moved ? ` ${MOVED_NOTE}` : ''}`
        : `Нові клавіші підсвічені на клавіатурі. Кожну натискай своїм пальцем${quick ? '' : ': схема долонь покаже, яким'}.`;
    const title = step.shift ? 'Великі літери' : isDigits ? 'Нові цифри' : isMarks ? (step.keys[0] === PARAGRAPH ? 'Новий абзац' : step.keys.length > 1 ? 'Нові знаки' : 'Новий знак') : 'Нові клавіші';
    q('[data-lines]').innerHTML = '';
    q('[data-ld]').innerHTML = `<div class="li"><div class="li-title">${title}</div><div class="li-keys">${caps}</div><p>${note}</p></div>
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
  function resultHtml({ acc, cpm, stars, pass, credited, hard, next, game }) {
    const chips = `<div class="ld-chips"><span>Точність <b>${acc}%</b></span><span>Знаків за хвилину <b>${cpm}</b></span>${game ? `<span>Досвід <b>+${game.gain + game.bonus}</b></span>` : ''}${hard.length ? `<span>Потренуй: <b>${hard.map((c) => c.toUpperCase()).join(', ')}</b></span>` : ''}</div>`;
    const head = pass
      ? `<div class="ld-stars">${starsIcons(stars, 3, 34)}</div><h2 class="ld-h">${credited ? 'Зараховано з першої спроби!' : 'Урок пройдено!'}</h2>`
      : `<h2 class="ld-h">Ще трохи точності</h2><p class="ld-p">Для наступного уроку потрібно ${PASS_ACC}%. Спробуй ще раз: спокійно, без поспіху.</p>`;
    const nextBtn = pass && next && next.id !== lesson.id ? `<a class="pl-btn primary" href="#teen/lesson/${next.id}" data-next>Далі: урок ${next.id}</a>` : '';
    const doneAll = pass && !next ? '<p class="ld-p">Усі уроки цієї мови пройдено: літери, знаки, абзаци, цифри й символи.</p>' : '';
    return `<div class="ld-main">${head}${chips}${newHtml(game)}${doneAll}</div>
      <div class="ld-btns">${nextBtn}<button class="pl-btn ${nextBtn ? '' : 'primary'}" data-act="again">${icons.replay(22)}<span>Ще раз</span></button><a class="pl-btn" href="#teen">До світу</a></div>`;
  }

  function finish() {
    const acc = accuracy(sum.typed, sum.errors);
    const cpm = charsPerMinute(sum.typed, sum.ms);
    // швидка перевірка: з першої спроби не нижче порога — зараховано; інакше йдемо повним уроком
    if (quick && acc < QUICK_ACC) {
      quick = false; fell = true;
      Object.assign(sum, { typed: 0, errors: 0, ms: 0, missed: {}, steps: 0, words: 0 });
      built = buildTeenLesson({ layout, id: lesson.id, rng, quick: false, grade });
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
    // зараховуємо урок (якщо пройдено), досвід, завдання дня, нагороди; помилка лише зменшує приріст досвіду
    const game = state.store.finishTeenRun(state.profileId, { layout, lessonId: lesson.id, stars, acc, cpm, by: quick ? 'quick' : 'lesson', typed: sum.typed, errors: sum.errors, steps: sum.steps, words: sum.words });
    if (game) themeOf(p0.world).setXp?.(app, levelInfo(game.xpTotal));
    const { next } = nextInfo();
    lightKeys([], { fingers: false });
    const done = q('[data-done]');
    q('[data-ld]').innerHTML = resultHtml({ acc, cpm, stars, pass, credited: quick && !fell, hard, next, game });
    done.hidden = false;
    q('[data-bar]').style.width = '100%';
    playSfx(pass ? 'stars' : 'hint', stars);
    done.querySelector('.pl-btn.primary')?.focus?.();
  }

  // Слово закінчилось (пробіл, абзац або кінець вправи): якщо без помилок і не коротше двох знаків — зараховуємо
  const endWord = () => { if (word.len >= 2 && word.clean) sum.words += 1; word.len = 0; word.clean = true; };

  // ----- клавіші -----
  const onKey = ({ code, key, kind }) => {
    if (stage === 'result') { if (code === 'Enter') (app.querySelector('[data-ld] .pl-btn.primary'))?.click(); return; }
    if (run.step.kind === 'intro') { if (code === 'Enter' || code === 'Space') nextStep(); return; }
    if (kind === 'ignore' || ['Backspace', 'Tab', 'CapsLock', 'Escape'].includes(code)) return;
    // Enter — це частина вправи лише в абзацах (кінець абзацу); в інших вправах його ігноруємо, як і раніше
    const paragraphText = run.ex.text.includes(PARAGRAPH);
    if (isParagraphKey(key) && !paragraphText) return;
    // Shift + цифра дає інший символ, коли ввімкнена не та мова: «#» замість «№» (укр.), «№» замість «#» (англ.) — це не помилка учня
    const otherLang = (layout === 'ua' && /^[#$^&@]$/.test(key)) || (layout === 'en' && key === '№');
    if (kind === 'wrong-layout' || otherLang) { msg(layoutHint(layout)); return; }
    if (!isParagraphKey(key) && key.length !== 1) return;
    // «ё» на місці апострофа — стара розкладка (Windows XP): не помилка учня, а підказка дорослому
    if (isYo(key) && normChar(currentChar(run.ex)) === "'") {
      setLaptopFlag(YO_FLAG, true);
      msg('Ця клавіша друкує «ё», а не апостроф. На цьому ноутбуці розкладка стара. Покажи дорослому: розділ «Для дорослого» підкаже, що змінити.');
      return;
    }
    const now = performance.now();
    if (run.last != null) run.ms += Math.min(now - run.last, IDLE_CAP);
    run.last = now;
    const want0 = currentChar(run.ex); // клавіша, яку ждали (для слів без помилок)
    const { state: st, result } = pressChar(run.ex, key);
    run.ex = st;
    if (result === 'error') {
      sum.errors += 1;
      word.clean = false;
      const want = currentChar(st);
      playSfx('hint');
      if (hintOn && run.step.hint) {
        showHint(want, true);
        const lower = want.toLowerCase();
        const name = KEY_NAMES[lower] ?? (needsShift(want, layout) ? `велика ${want} (Shift)` : want.toUpperCase());
        const how = isPunctKey(normChar(want)) || lower === 'ґ' ? comboText(want, layout) : ''; // як набрати знак: Shift + 7, Alt Gr + Г
        msg(`Тобі потрібна клавіша: ${name}${how ? ` (${how})` : ''}`);
      } else msg('Не та клавіша. Спробуй ще.');
    } else if (result === 'ok' || result === 'done') {
      sum.typed += 1;
      playSfx('tap');
      msg('');
      if (want0 === ' ' || want0 === PARAGRAPH || want0 === '\n') endWord(); else word.len += 1;
      if (result === 'done') {
        endWord();
        sum.steps += 1;
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

  const stop = attachLiveKeyboard(panel, { getLayout: () => layout, trackFinger: false, altGr: true, onKey });
  app.addEventListener('click', onClick);
  run = { i: 0 };
  showStep();
  return () => { stop(); app.removeEventListener('click', onClick); };
}
