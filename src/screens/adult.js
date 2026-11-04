import { klavik } from '../character/klavik.js';
import { AVATARS } from '../character/avatars.js';
import { icons } from '../design/icons.js';
import { btn, homeButton, esc } from './common.js';
import { heroIconOf } from '../teen/worlds/index.js';
import { isTeen, homeRoute } from '../teen/logic/profile.js';
import { getLaptopFlag, setLaptopFlag, setLaptopValue, YO_FLAG, BOARD_OFF_FLAG, GOALS_KEY } from '../storage/laptop.js';
import { MEDALS, GOAL_LIMITS, goalsOf, standardGoals, goalOverrides, setGoalOverrides, cleanGradeGoals } from '../teen/logic/challenge.js';

export const adultScreen = () => '<div class="screen screen-adult theme-warm" data-adult></div>';

// Просте завдання для дорослого: множення, яке першокласник не розв'яже
const newSum = () => { const a = 6 + Math.floor(Math.random() * 4); const b = 6 + Math.floor(Math.random() * 4); return { a, b }; };

// Для дорослого: перевірка завданням → рівень, скидання прогресу, видалення картки (з підтвердженням)
export function mountAdult(root, state) {
  const screen = root.querySelector('[data-adult]');
  const p = () => state.store.get(state.profileId);
  let sum = newSum();
  let wrong = false;
  let goalGrade = '5';

  const top = (right = '') => `<div class="topbar">${homeButton()}<div class="topbar-spacer"></div>${right}</div>`;

  function gate() {
    screen.innerHTML = `${top()}<div class="adult-main">
      <div class="adult-head">${icons.gear(56)}<h2>Для дорослого</h2></div>
      <p class="adult-sum" aria-live="polite">${sum.a} × ${sum.b} = ?</p>
      <input class="name-input sum-input" type="text" inputmode="numeric" maxlength="3" autocomplete="off" aria-label="Відповідь">
      <p class="adult-note">${wrong ? 'Спробуй ще раз' : 'Розв’яжи, щоб увійти'}</p>
      <div class="row">${btn({ label: 'Далі', icon: 'next', kind: 'primary', size: 'big', attrs: 'data-act="check"' })}</div></div>`;
    screen.querySelector('.sum-input').focus();
  }

  // Підказка про ноутбук: замість апострофа друкується «ё» (стара розкладка Windows XP). З'являється лише після такого випадку в уроці
  function yoNote() {
    if (!getLaptopFlag(YO_FLAG)) return '';
    return `<div class="adult-block adult-warn" role="note"><span class="adult-label">Клавіатура цього ноутбука</span>
      <p>Замість апострофа тут друкується «ё». Це стара розкладка (як у Windows XP), через неї уроки з апострофом не вийдуть.
      Варто змінити розкладку: у налаштуваннях мови Windows додайте до української стандартну клавіатуру «Українська», а стару приберіть. Якщо не виходить, попросіть вчителя інформатики.</p>
      ${btn({ label: 'Зрозуміло, не нагадувати', icon: 'check', kind: 'light', attrs: 'data-act="clear-yo"' })}</div>`;
  }

  function panel(msg = '') {
    const prof = p();
    if (!prof) { state.go(''); return; }
    const teen = isTeen(prof.level);
    screen.innerHTML = `${top((teen ? btn({ label: 'Змагання і цілі', icon: 'gear', kind: 'light', attrs: 'data-act="compete"' }) : '') + btn({ label: teen ? 'Мій світ' : 'Карта', icon: 'map', kind: 'primary', attrs: `data-go="${homeRoute(prof)}"` }))}<div class="adult-main">
      <div class="adult-who">${teen ? heroIconOf(prof.world, prof.hero, 110) : AVATARS[prof.avatar]?.(110) ?? ''}<div class="ach-name">${esc(prof.name)}</div></div>
      <div class="adult-block"><span class="adult-label">Клас</span>
        <div class="segmented" role="group" aria-label="Клас">
          ${['1-2', '3-4', '5', '6'].map((l) => `<button class="btn seg" data-set-level="${l}" aria-pressed="${prof.level === l}">${l === '5' || l === '6' ? `${l} клас` : `${l.replace('-', '–')} клас`}</button>`).join('')}
        </div></div>
      ${teen ? `<div class="adult-block"><span class="adult-label">Випробування на час</span>
        <div class="segmented" role="group" aria-label="Випробування на час">
          <button class="btn seg" data-act="challenge-open" data-val="0" aria-pressed="${!prof.challenge?.open}">Після всіх уроків</button>
          <button class="btn seg" data-act="challenge-open" data-val="1" aria-pressed="${!!prof.challenge?.open}">Відкрити зараз</button>
        </div></div>` : ''}
      ${yoNote()}
      <div class="row">
        ${btn({ label: 'Скинути прогрес', icon: 'replay', kind: 'light', attrs: 'data-ask="reset"' })}
        ${btn({ label: 'Видалити картку', icon: 'trash', kind: 'light', attrs: 'data-ask="delete"' })}
      </div>
      <p class="adult-note" role="status">${msg}</p></div>`;
  }

  // Налаштування змагань для всього ноутбука: вимикач таблиці лідерів і цілі медалей (5 і 6 клас окремо)
  function compete(msg = '') {
    const prof = p();
    if (!prof) { state.go(''); return; }
    const boardOn = !getLaptopFlag(BOARD_OFF_FLAG);
    const std = standardGoals(goalGrade);
    const rows = goalsOf(goalGrade).map((g, i) => {
      const step = (field, label, unit) => {
        const diff = g[field] !== std[i][field];
        return `<div class="goal-cell">
          <button class="btn round goal-btn" data-goal="${g.id}:${field}:-1" aria-label="Менше: ${g.name}, ${label}">−</button>
          <b class="goal-val" aria-live="polite">${g[field]}${unit}</b>
          <button class="btn round goal-btn" data-goal="${g.id}:${field}:1" aria-label="Більше: ${g.name}, ${label}">+</button>
          <small class="goal-std">${diff ? `стандарт ${std[i][field]}${unit}` : ''}</small></div>`;
      };
      return `<div class="goal-row"><b class="goal-medal">${g.name}</b>${step('cpm', 'Знаків за хвилину', '')}${step('acc', 'Точність', '%')}</div>`;
    }).join('');
    screen.innerHTML = `${top(btn({ label: 'Назад', icon: 'back', kind: 'primary', attrs: 'data-act="back"' }))}<div class="adult-main adult-compete">
      <div class="adult-head">${icons.gear(48)}<h2>Змагання і цілі</h2></div>
      <p class="adult-hint">Налаштування діють на всьому ноутбуці, для всіх учнів 5–6 класів.</p>
      <div class="adult-block"><span class="adult-label">Таблиця лідерів</span>
        <div class="segmented" role="group" aria-label="Таблиця лідерів">
          <button class="btn seg" data-act="board" data-val="1" aria-pressed="${boardOn}">Увімкнена</button>
          <button class="btn seg" data-act="board" data-val="0" aria-pressed="${!boardOn}">Вимкнена</button>
        </div></div>
      <div class="adult-block"><span class="adult-label">Цілі медалей</span>
        <div class="segmented" role="group" aria-label="Для якого класу">
          ${['5', '6'].map((g) => `<button class="btn seg" data-goal-grade="${g}" aria-pressed="${goalGrade === g}">${g} клас</button>`).join('')}
        </div></div>
      <div class="goal-table"><div class="goal-row is-head"><span class="goal-medal"></span><span class="goal-name">Знаків за хвилину</span><span class="goal-name">Точність</span></div>${rows}</div>
      <p class="adult-hint">Медаль дається, коли виконано і швидкість, і точність. Отримані медалі й рекорди не зникають. Коли таблицю вимкнено, учні бачать лише свій прогрес.</p>
      <div class="row">${btn({ label: 'Повернути стандартні значення', icon: 'replay', kind: 'light', attrs: 'data-act="goals-reset"' })}</div>
      <p class="adult-note" role="status">${msg}</p></div>`;
  }

  // Змінити одну ціль кнопками «+» і «−» (кроки: знаки 5, точність 1); решта підтягується, щоб медалі лишались по зростанню
  function stepGoal(spec) {
    const [id, field, dir] = spec.split(':');
    if (!MEDALS.includes(id) || !GOAL_LIMITS[field]) return compete();
    const cur = Object.fromEntries(goalsOf(goalGrade).map((g) => [g.id, { cpm: g.cpm, acc: g.acc }]));
    const lim = GOAL_LIMITS[field];
    const before = cur[id][field];
    cur[id][field] = Math.min(lim.max, Math.max(lim.min, before + Number(dir) * lim.step));
    const fixed = cleanGradeGoals(cur, goalGrade);
    const changed = fixed[id][field] !== before;
    const same = MEDALS.every((m) => fixed[m].cpm === standardGoals(goalGrade)[MEDALS.indexOf(m)].cpm && fixed[m].acc === standardGoals(goalGrade)[MEDALS.indexOf(m)].acc);
    const next = { ...goalOverrides() };
    if (same) delete next[goalGrade]; else next[goalGrade] = fixed;
    setLaptopValue(GOALS_KEY, Object.keys(setGoalOverrides(next)).length ? goalOverrides() : null);
    compete(changed ? 'Цілі збережено' : 'Далі міняти не можна: медалі мають зростати, а значення — лишатись у межах');
  }

  function confirm(kind) {
    const prof = p();
    const text = kind === 'reset'
      ? `Скинути прогрес: ${esc(prof.name)}? Зірочки й значки зникнуть.`
      : kind.startsWith('level:')
        ? `Змінити клас: ${esc(prof.name)} → ${kind.slice(6)} клас? Прогрес і вивчені літери збережуться.`
        : `Видалити картку: ${esc(prof.name)}? Її не можна повернути.`;
    const isLevel = kind.startsWith('level:');
    screen.insertAdjacentHTML('beforeend', `<div class="pause-layer confirm-layer" role="dialog" aria-label="Підтвердження">
      <div>${klavik('think', 170)}</div>
      <p class="confirm-text">${text}</p>
      <div class="row">${btn({ label: 'Ні, лишити', icon: 'back', kind: 'primary', size: 'big', attrs: 'data-act="cancel"' })}
        ${btn({ label: isLevel ? 'Так, змінити' : kind === 'reset' ? 'Так, скинути' : 'Так, видалити', icon: isLevel ? 'check' : kind === 'reset' ? 'replay' : 'trash', kind: 'light', size: 'big', attrs: `data-do="${kind}"` })}</div></div>`);
  }

  const onClick = (e) => {
    const g = e.target.closest('[data-goal],[data-goal-grade]');
    if (g?.dataset.goalGrade) { goalGrade = g.dataset.goalGrade; return compete(); }
    if (g) return stepGoal(g.dataset.goal);
    const b = e.target.closest('[data-act],[data-ask],[data-do],[data-set-level]');
    if (!b) return;
    if (b.dataset.act === 'check') return check();
    if (b.dataset.act === 'compete') return compete();
    if (b.dataset.act === 'back') return panel();
    if (b.dataset.act === 'board') { setLaptopFlag(BOARD_OFF_FLAG, b.dataset.val === '0'); return compete(b.dataset.val === '1' ? 'Таблиця лідерів увімкнена' : 'Таблиця лідерів вимкнена: учні бачать лише свій прогрес'); }
    if (b.dataset.act === 'goals-reset') { setGoalOverrides({}); setLaptopValue(GOALS_KEY, null); return compete('Повернено стандартні значення для 5 і 6 класу'); }
    if (b.dataset.act === 'cancel') return screen.querySelector('.confirm-layer')?.remove();
    if (b.dataset.act === 'challenge-open') { state.store.update(state.profileId, { challengeOpen: b.dataset.val === '1' }); return panel(b.dataset.val === '1' ? 'Випробування відкрите для цього учня' : 'Випробування відкриється після всіх уроків'); }
    if (b.dataset.act === 'clear-yo') { setLaptopFlag(YO_FLAG, false); return panel(); }
    if (b.dataset.ask) return confirm(b.dataset.ask);
    if (b.dataset.setLevel) {
      if (b.dataset.setLevel === p().level) return;
      return confirm(`level:${b.dataset.setLevel}`); // зміна класу — лише після підтвердження
    }
    if (b.dataset.do?.startsWith('level:')) {
      const level = b.dataset.do.slice(6);
      state.store.update(state.profileId, { level }); // прогрес не чіпаємо: літери, зірочки, значки лишаються
      state.level = level;
      return panel(isTeen(level) && !p().world ? 'Готово. Наступного разу учень обере світ.' : 'Готово');
    }
    if (b.dataset.do === 'reset') {
      state.store.resetProgress(state.profileId);
      state.openProfile(state.profileId); // оновити посилання на прогрес
      return panel('Прогрес скинуто');
    }
    if (b.dataset.do === 'delete') {
      state.store.remove(state.profileId);
      state.closeProfile();
      state.go('');
    }
  };
  function check() {
    const v = screen.querySelector('.sum-input')?.value.trim();
    if (v === String(sum.a * sum.b)) panel();
    else { wrong = true; sum = newSum(); gate(); }
  }
  const onKey = (e) => { if (e.key === 'Enter' && e.target.matches?.('.sum-input')) check(); };
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKey);
  gate();
  return () => { root.removeEventListener('click', onClick); root.removeEventListener('keydown', onKey); };
}
