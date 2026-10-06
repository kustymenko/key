import { klavik, EMOTIONS } from '../character/klavik.js';
import { AVATARS, AVATAR_NAMES } from '../character/avatars.js';
import { keyboard, hands } from '../keyboard/onscreen.js';
import { FINGERS, fingerOf } from '../keyboard/fingers.js';
import { stars, icons } from '../design/icons.js';
import { btn } from './common.js';
import { profilesScreen } from './profiles.js';
import { mapScreen } from './map.js';
import { exerciseScreen } from './exercise.js';
import { keyboardScreen } from './keyboard.js';

const TITLE = 'Клавіатурка'.toUpperCase().split('');
const CAPTIONS = { joy: 'Радіє', cheer: 'Підбадьорює', think: 'Думає', rest: 'Відпочиває' };
const FINGER_VARS = ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp'];
const UI_SWATCHES = [
  ['#f2f4f6', 'Фон'], ['#ffffff', 'Картки'], ['#2b3a4a', 'Головний'], ['#1b2430', 'Текст'], ['#5b6672', 'Другорядний'], ['#c9d0d8', 'Рамки'],
];

const WARM_SWATCHES = [
  ['--warm-bg', 'Тепле тло'], ['--warm-accent', 'Кнопка «Грай»'], ['--warm-gold', 'Зірочки'], ['--warm-done', 'Пройдено'], ['--warm-line', 'Стежка'], ['--warm-text-soft', 'Другорядний'],
];

const SAMPLE_KIDS = [{ id: 'a', name: 'Соня', avatar: 'fox' }, { id: 'b', name: 'Максим', avatar: 'frog' }, { id: 'c', name: 'Ліза', avatar: 'rabbit' }];

const frame = (hash, title, html) =>
  `<a class="frame" href="#${hash}" aria-label="${title}"><div class="frame-clip"><div class="frame-scale">${html}</div></div><span class="frame-title">${title}</span></a>`;

export function demoPage(state) {
  const { layout, level, openAll } = state;
  const next = 'KeyJ';
  return `<main class="demo theme-warm"><div class="demo-wrap">
  <section class="hero">
    <div class="hero-klavik">${klavik('joy', 250)}</div>
    <div class="hero-main">
      <h1 class="title" aria-label="Клавіатурка">${TITLE.map((c) => `<span class="title-key">${c}</span>`).join('')}</h1>
      <p class="lead">Друкуємо разом з Клавиком!</p>
      <div class="row">
        <a class="btn primary big" href="#map" style="text-decoration:none">${icons.play(32)}<span>Грай</span></a>
        <div class="segmented" role="group" aria-label="Курс">
          <button class="btn seg" data-layout="ua" aria-pressed="${layout === 'ua'}">Українська</button>
          <button class="btn seg" data-layout="en" aria-pressed="${layout === 'en'}">English</button>
        </div>
      </div>
      <div class="row">
        <div class="segmented" role="group" aria-label="Рівень">
          <button class="btn seg" data-level="1-2" aria-pressed="${level === '1-2'}">1–2 клас</button>
          <button class="btn seg" data-level="3-4" aria-pressed="${level === '3-4'}">3–4 клас</button>
        </div>
        <div class="segmented" role="group" aria-label="Уроки">
          <button class="btn seg" data-openall="0" aria-pressed="${!openAll}">Уроки по черзі</button>
          <button class="btn seg" data-openall="1" aria-pressed="${openAll}">Усі уроки відкриті</button>
        </div>
      </div>
    </div>
  </section>

  <section class="block">
    <h2>Клавик — помічник</h2>
    <div class="emotions">${EMOTIONS.map((e) => `<figure class="emotion">${klavik(e, 170)}<figcaption>${CAPTIONS[e]}</figcaption></figure>`).join('')}</div>
    <h3>Тваринки для карток</h3>
    <div class="avatars">${Object.keys(AVATARS).map((a) => `<figure class="avatar-card" style="margin:0">${AVATARS[a](120)}<span>${AVATAR_NAMES[a]}</span></figure>`).join('')}</div>
  </section>

  <section class="block">
    <h2>Кнопки</h2>
    <div class="row">
      ${btn({ label: 'Грай', icon: 'play', kind: 'primary' })}
      <span class="theme-neutral btn-note">${btn({ label: 'Грай', icon: 'play', kind: 'primary' })}</span>
      ${btn({ label: 'Додому', icon: 'home', kind: 'light' })}
      ${btn({ label: 'Пауза', icon: 'pause', kind: 'light' })}
      <button class="btn round light" aria-label="Послухати">${icons.speaker(32)}</button>
    </div>
    <div class="row">
      <div class="segmented" role="group" aria-label="Рівень">
        <button class="btn seg" data-level="1-2" aria-pressed="${level === '1-2'}">1–2 клас</button>
        <button class="btn seg" data-level="3-4" aria-pressed="${level === '3-4'}">3–4 клас</button>
      </div>
      <div class="stars-demo">${stars(3)}${stars(2)}${stars(1)}</div>
    </div>
    <p class="note">Кнопки великі (від 64 пікселів), з іконкою; при натисканні «втискаються». Перша «Грай» — тепла (карта, вибір дитини), друга — нейтральна (екрани з клавіатурою).</p>
  </section>

  <section class="block">
    <h2>Кольори</h2>
    <h3>Пальці: насичений і блідий колір (використовуємо лише для пальців)</h3>
    <div class="swatches">${FINGER_VARS.map((f) => `<div class="swatch"><span class="chip f-${f}"></span><span class="chip pale f-${f}"></span><span>${FINGERS.find((x) => x.id === f).name}</span></div>`).join('')}</div>
    <h3>Екрани з клавіатурою (вправа, уроки, ігри) — спокійна нейтральна гама</h3>
    <div class="swatches ui">${UI_SWATCHES.map(([v, n]) => `<div class="swatch"><span class="chip" style="background:${v}"></span><span>${n}</span></div>`).join('')}</div>
    <h3>Екрани без клавіатури (вибір дитини, карта, досягнення) — тепла гама</h3>
    <div class="swatches warm">${WARM_SWATCHES.map(([v, n]) => `<div class="swatch"><span class="chip" style="background:var(${v})"></span><span>${n}</span></div>`).join('')}</div>
  </section>

  <section class="block">
    <h2>Екранна клавіатура</h2>
    <div class="row">
      <div class="segmented" role="group" aria-label="Розкладка">
        <button class="btn seg" data-layout="ua" aria-pressed="${layout === 'ua'}">Українська</button>
        <button class="btn seg" data-layout="en" aria-pressed="${layout === 'en'}">English</button>
      </div>
    </div>
    <h3>Наступна клавіша — обвідка і світіння</h3>
    <div class="kb-demo theme-neutral">${keyboard({ layout, next, hint: 'next' })}${hands({ active: fingerOf(next), hint: 'next' })}</div>
    <div class="row"><a class="btn primary" href="#keyboard" style="text-decoration:none">${icons.play(32)}<span>Спробуй клавіатуру</span></a></div>
    <p class="note">Натискай клавіші на справжній клавіатурі: на екранній загориться така сама клавіша, а на долонях — потрібний палець.</p>
    <h3>Підказка після помилки — подвійна обвідка і підстрибування</h3>
    <div class="kb-demo theme-neutral">${keyboard({ layout, next, hint: 'error' })}${hands({ active: fingerOf(next), hint: 'error' })}</div>
  </section>

  <section class="block">
    <h2>Ескізи екранів <small>(натисни, щоб відкрити на весь екран)</small></h2>
    <div class="frames">
      ${frame('profiles', 'Хто ти?', profilesScreen({ profiles: SAMPLE_KIDS }))}
      ${frame('map', 'Карта пригод', mapScreen(state))}
      ${frame('keyboard', 'Спробуй клавіатуру', keyboardScreen({ layout }))}
      ${frame('exercise', 'Вправа', exerciseScreen({ layout }))}
      ${frame('exercise-error', 'Вправа: підказка після помилки', exerciseScreen({ hint: 'error', layout }))}
    </div>
  </section>
</div></main>`;
}
