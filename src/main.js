import '@fontsource/nunito/cyrillic-600.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/cyrillic-800.css';
import '@fontsource/nunito/latin-800.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';

import { demoPage } from './screens/demo.js';
import { profilesScreen, mountProfiles } from './screens/profiles.js';
import { newProfileScreen, mountNewProfile } from './screens/newprofile.js';
import { achievementsScreen } from './screens/achievements.js';
import { adultScreen, mountAdult } from './screens/adult.js';
import { mapScreen, mountMap } from './screens/map.js';
import { setBackdrop } from './screens/common.js';
import { exerciseScreen } from './screens/exercise.js';
import { keyboardScreen, mountKeyboardScreen } from './screens/keyboard.js';
import { lessonScreen, mountLesson } from './screens/lesson.js';
import { createStore } from './storage/store.js';
import { stopSpeech } from './audio/speech.js';

const app = document.getElementById('app');
const freshProgress = () => ({ ua: {}, en: {} });
// Стан сесії. profileId — яка дитина зараз за комп'ютером (не зберігається: за ноутбук сідають по черзі).
// Без профілю (лише в демо) прогрес живе в пам'яті вкладки. demo — сторінка для вчителя (#demo).
const state = {
  layout: 'ua', level: '1-2', lessonId: 1, progress: freshProgress(), openAll: false,
  profileId: null, demo: false, store: createStore(),
  openProfile(id) {
    const p = this.store.get(id);
    if (!p) return;
    Object.assign(this, { profileId: id, layout: p.layout, level: p.level, progress: p.progress, lessonId: 1 });
  },
  closeProfile() {
    Object.assign(this, { profileId: null, progress: freshProgress(), lessonId: 1 });
  },
  // Перейти на екран (і перемалювати, якщо адреса вже така)
  go(name) {
    if (location.hash.replace('#', '') === name) render();
    else location.hash = name;
  },
  setLayout(layout) {
    this.layout = layout;
    if (this.profileId) this.store.update(this.profileId, { layout });
    render();
  },
};

const SCREENS = {
  '': () => profilesScreen({ profiles: state.store.list(), persistent: state.store.persistent, canCreate: state.store.canCreate() }),
  new: newProfileScreen,
  map: () => mapScreen(state),
  achievements: () => achievementsScreen(state.store.get(state.profileId)),
  adult: adultScreen,
  lesson: lessonScreen,
  // Ескізи — лише для вчителя (#demo)
  exercise: () => exerciseScreen({ layout: state.layout }),
  'exercise-error': () => exerciseScreen({ hint: 'error', layout: state.layout }),
  keyboard: () => keyboardScreen({ layout: state.layout }),
};
const DEMO_ONLY = new Set(['exercise', 'exercise-error', 'keyboard']);
const NEEDS_PROFILE = new Set(['achievements', 'adult']); // карта й урок у демо працюють і без профілю
// Екрани, які слухають справжню клавіатуру або кліки: повертають функцію «вимкнути»
const MOUNT = {
  '': mountProfiles, new: mountNewProfile, adult: mountAdult,
  keyboard: mountKeyboardScreen, lesson: mountLesson, map: mountMap,
};
let unmount = null;

// Сцена 1366×768, яка масштабується під вікно
function fitStage() {
  const stage = document.querySelector('.stage');
  if (!stage) return;
  const k = Math.min(window.innerWidth / 1366, window.innerHeight / 768);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}

// Мініатюри екранів у демо масштабуються під ширину рамки
function fitFrames() {
  document.querySelectorAll('.frame-clip').forEach((clip) => {
    clip.firstElementChild.style.transform = `scale(${clip.clientWidth / 1366})`;
  });
}

function routeName() {
  let name = location.hash.replace('#', '');
  if (name === 'profiles') name = '';
  if (name === 'demo') return name;
  if (!(name in SCREENS)) return '';
  if (DEMO_ONLY.has(name) && !state.demo) return '';
  if (!state.profileId && (NEEDS_PROFILE.has(name) || (!state.demo && (name === 'map' || name === 'lesson')))) return '';
  return name;
}

function render() {
  unmount?.();
  unmount = null;
  stopSpeech();
  const name = routeName();
  if (name === 'demo') {
    state.demo = true;
    document.body.classList.remove('is-screen');
    setBackdrop(false);
    app.innerHTML = demoPage(state);
    fitFrames();
    return;
  }
  if (name !== location.hash.replace('#', '') && !(name === '' && location.hash === '#profiles')) {
    history.replaceState(null, '', location.pathname + location.search); // чужа адреса → «Хто ти?»
  }
  if (name === '') state.closeProfile(); // «Хто ти?» — наступна дитина обирає себе
  document.body.classList.add('is-screen');
  const back = state.demo ? '<a class="back-link" href="#demo">← до всіх ескізів</a>' : '';
  app.innerHTML = `<div class="stage">${SCREENS[name]()}</div>${back}`;
  fitStage();
  setBackdrop(!!app.querySelector('.stage > .screen.theme-warm')); // тепле тло на все вікно
  unmount = MOUNT[name]?.(app, state) ?? null;
}

// Кнопка «Додому» на будь-якому екрані повертає на головну сторінку
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-home]')) state.go('');
});

// Кнопки з переходом на інший екран (наприклад «Карта» після уроку)
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-go]');
  if (b) state.go(b.dataset.go);
});

// Перемикачі в демо (мова клавіатури, рівень, відкриті уроки)
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-layout],[data-level],[data-openall]');
  if (!b) return;
  if (b.dataset.layout) state.layout = b.dataset.layout;
  if (b.dataset.level) state.level = b.dataset.level;
  if (b.dataset.openall) state.openAll = b.dataset.openall === '1';
  const y = window.scrollY;
  render();
  window.scrollTo(0, y);
});

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
window.addEventListener('resize', () => { fitStage(); fitFrames(); });
render();
