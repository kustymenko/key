import '@fontsource/nunito/cyrillic-600.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/cyrillic-800.css';
import '@fontsource/nunito/latin-800.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';

import { demoPage } from './screens/demo.js';
import { profilesScreen } from './screens/profiles.js';
import { mapScreen } from './screens/map.js';
import { exerciseScreen } from './screens/exercise.js';
import { keyboardScreen, mountKeyboardScreen } from './screens/keyboard.js';

const app = document.getElementById('app');
const state = { layout: 'ua', level: '1-2' };

const SCREENS = {
  profiles: profilesScreen,
  map: mapScreen,
  exercise: () => exerciseScreen({ layout: state.layout }),
  'exercise-error': () => exerciseScreen({ hint: 'error', layout: state.layout }),
  keyboard: () => keyboardScreen({ layout: state.layout }),
};
// Екрани, які слухають справжню клавіатуру: повертають функцію «вимкнути»
const MOUNT = { keyboard: mountKeyboardScreen };
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

function render() {
  unmount?.();
  unmount = null;
  const name = location.hash.replace('#', '');
  if (SCREENS[name]) {
    document.body.classList.add('is-screen');
    app.innerHTML = `<div class="stage">${SCREENS[name]()}</div><a class="back-link" href="#">← до всіх ескізів</a>`;
    fitStage();
    unmount = MOUNT[name]?.(app, state) ?? null;
  } else {
    document.body.classList.remove('is-screen');
    app.innerHTML = demoPage(state);
    fitFrames();
  }
}

// Перемикачі в демо (мова клавіатури і рівень)
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-layout],[data-level]');
  if (!b) return;
  if (b.dataset.layout) state.layout = b.dataset.layout;
  if (b.dataset.level) state.level = b.dataset.level;
  const y = window.scrollY;
  render();
  window.scrollTo(0, y);
});

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
window.addEventListener('resize', () => { fitStage(); fitFrames(); });
render();
