// Знімки екрана для самоперевірки: відкриває docs/index.html (file://) і знімає екрани.
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { codeOfChar, needsShift } from '../src/keyboard/layouts.js';

const file = resolve('docs/index.html');
if (!existsSync(file)) throw new Error('Спочатку: npm run build');
mkdirSync('screenshots', { recursive: true });

const SIZES = [[1366, 768], [1920, 1080]];
const SCREENS = ['profiles', 'map', 'exercise', 'exercise-error', 'keyboard'];
// У хмарі Chromium уже встановлено (не качаємо через playwright install)
const cloudChrome = '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath: existsSync(cloudChrome) ? cloudChrome : undefined });
const problems = [];

// Проходимо урок 1 «пальцями»: імітуємо справжні натискання (код фізичної клавіші + символ)
const press = (page, code, key) =>
  page.evaluate(([c, k]) => window.dispatchEvent(new KeyboardEvent('keydown', { code: c, key: k, bubbles: true })), [code, key]);
const CODE = { а: ['KeyF', 'а'], о: ['KeyJ', 'о'] };

async function lessonFlow(page, w) {
  await page.goto(`${pathToFileURL(file).href}#lesson`);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `screenshots/lesson-intro-${w}.png` });
  await press(page, 'KeyJ', 'о'); // помилка: чекаємо «а»
  await page.waitForTimeout(150);
  await page.screenshot({ path: `screenshots/lesson-error-${w}.png` });
  await press(page, 'KeyF', 'f'); // неправильна розкладка — не помилка
  await page.waitForTimeout(150);
  await page.screenshot({ path: `screenshots/lesson-layout-${w}.png` });
  // кожен крок після завершення на мить «замикається» (показує похвалу) — чекаємо
  const step = async (text, wait = 800) => {
    for (const ch of text) await press(page, ...CODE[ch]);
    await page.waitForTimeout(wait);
  };
  await step('а'); await step('о');
  await press(page, ...CODE['а']); await press(page, ...CODE['а']); // середина першої вправи
  await page.screenshot({ path: `screenshots/lesson-drill-${w}.png` });
  await press(page, 'Escape', 'Escape');
  await page.waitForTimeout(100);
  await page.screenshot({ path: `screenshots/lesson-pause-${w}.png` });
  await press(page, 'Escape', 'Escape');
  await step('ааа'); await step('ооооо'); await step('аоаоао');
  await press(page, ...CODE['о']); await press(page, ...CODE['о']);
  await press(page, ...CODE['а']); await press(page, ...CODE['а']); await press(page, ...CODE['а']);
  await press(page, ...CODE['о']); await press(page, ...CODE['о']);
  await page.waitForTimeout(900);
  if (!(await page.$('[data-done]'))) problems.push('урок не дійшов до екрана завершення');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `screenshots/lesson-done-${w}.png` });
}

// ---------- Етап 3: карта, різні уроки й рівні ----------
const base = pathToFileURL(file).href;

// Друкує поточну літеру завдання (читає її з екрана). mistakes — скільки разів навмисно помилитися
async function autoplay(page, layout, { mistakes = 0, delay = 8, stopAt = null, untilDots = null } = {}) {
  let wrong = mistakes;
  let typed = 0;
  for (let guard = 0; guard < 900; guard++) {
    if (await page.$('[data-done]')) return true;
    // після знайомства з клавішею екран на мить «замикається» і хвалить: чекаємо
    const cur = await page.evaluate(() => (document.querySelector('[data-msg] .bubble-text')?.textContent.startsWith('Так!') ? null : document.querySelector('.task-ch.is-current')?.textContent ?? null));
    if (cur === null) { await page.waitForTimeout(60); continue; }
    const ch = cur === '␣' ? ' ' : cur;
    if (stopAt !== null && typed >= stopAt) return false;
    if (untilDots !== null && (await page.$$('.dot.is-on')).length >= untilDots) return false;
    if (wrong > 0 && ch !== ' ') {
      wrong -= 1;
      const bad = layout === 'ua' ? (ch.toLowerCase() === 'щ' ? 'ю' : 'щ') : (ch.toLowerCase() === 'q' ? 'w' : 'q');
      await press(page, 'KeyZ', bad);
    }
    const code = codeOfChar(ch, layout);
    await page.evaluate(([c, k, sh]) => window.dispatchEvent(new KeyboardEvent('keydown', { code: c, key: k, shiftKey: sh, bubbles: true })), [code, ch, needsShift(ch, layout)]);
    typed += 1;
    await page.waitForTimeout(delay);
  }
  return false;
}

// Текст завдання не виходить за картку, а картка — за клавіатуру
const fitsCard = (page) => page.evaluate(() => {
  const card = document.querySelector('.task-card')?.getBoundingClientRect();
  const main = document.querySelector('.task-main')?.getBoundingClientRect();
  const kb = document.querySelector('.play-row')?.getBoundingClientRect();
  return !!card && main.bottom <= card.bottom + 1 && main.right <= card.right + 1 && card.bottom <= kb.top;
});

async function setup(page, { layout, level }) {
  await page.goto(base);
  await page.click(`[data-layout="${layout}"]`);
  await page.click(`[data-level="${level}"]`);
  await page.click('[data-openall="1"]');
}
async function openLesson(page, id) {
  await page.goto(`${base}#map`);
  await page.waitForTimeout(80);
  await page.click(`.node[data-lesson-id="${id}"]`);
  await page.waitForTimeout(150);
}

async function stage3(page, w) {
  const tag = (n) => `screenshots/${n}-${w}.png`;
  // Карта: за замовчуванням закриті, потім усі відкриті — у кожного рівня й курсу
  await setup(page, { layout: 'ua', level: '1-2' });
  await page.goto(`${base}#map`); await page.waitForTimeout(100);
  await page.screenshot({ path: tag('map-open-ua-12') });
  await setup(page, { layout: 'ua', level: '3-4' });
  await page.goto(`${base}#map`); await page.waitForTimeout(100);
  await page.screenshot({ path: tag('map-open-ua-34') });
  await setup(page, { layout: 'en', level: '1-2' });
  await page.goto(`${base}#map`); await page.waitForTimeout(100);
  await page.screenshot({ path: tag('map-open-en-12') });

  // Уроки 1–2 класу: середина курсу
  await setup(page, { layout: 'ua', level: '1-2' });
  for (const id of [2, 10, 18]) {
    await openLesson(page, id);
    await page.screenshot({ path: tag(`l${id}-ua-12-intro`) });
    await autoplay(page, 'ua', { stopAt: 4, delay: 20 }); // дві вправи далі за знайомство
    await page.waitForTimeout(900);
    await autoplay(page, 'ua', { stopAt: 4, delay: 20 });
    await page.screenshot({ path: tag(`l${id}-ua-12-drill`) });
    if (!(await fitsCard(page))) problems.push(`1–2, урок ${id}: завдання не вміщається (${w})`);
  }

  // Уроки 3–4 класу: довгі вправи і Shift
  await setup(page, { layout: 'ua', level: '3-4' });
  for (const id of [1, 10, 20, 21]) {
    await openLesson(page, id);
    await page.screenshot({ path: tag(`l${id}-ua-34-intro`) });
    await autoplay(page, 'ua', { stopAt: 3, delay: 15 });
    await page.waitForTimeout(900);
    await autoplay(page, 'ua', { stopAt: 12, delay: 15 }); // у середині довгої вправи
    await page.screenshot({ path: tag(`l${id}-ua-34-drill`) });
    if (!(await fitsCard(page))) problems.push(`3–4, урок ${id}: завдання не вміщається (${w})`);
  }
  // Найдовша вправа (третя, до 60 символів): дві стрічки в картці, нічого не виходить за межі
  await openLesson(page, 19);
  await autoplay(page, 'ua', { untilDots: 2, delay: 5 });
  await autoplay(page, 'ua', { stopAt: 6, delay: 5 });
  await page.screenshot({ path: tag('l19-ua-34-long') });
  if (!(await fitsCard(page))) problems.push(`3–4, довга вправа не вміщається (${w})`);
  // Увесь урок 3–4 з кількома помилками: екран завершення зі статистикою
  await openLesson(page, 10);
  if (!(await autoplay(page, 'ua', { mistakes: 3, delay: 120 }))) problems.push('урок 3–4 не дійшов до кінця');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: tag('done-ua-34') });
  const doneBox = await page.evaluate(() => { const r = document.querySelector('.done-main').getBoundingClientRect(); const s = document.querySelector('.stage').getBoundingClientRect(); return [r.left - s.left, r.right - s.left, r.top - s.top, r.bottom - s.top, s.width, s.height]; });
  if (doneBox[0] < 0 || doneBox[2] < 90 || doneBox[1] > doneBox[4] || doneBox[3] > doneBox[5]) problems.push(`екран завершення 3–4 виходить за сцену: ${doneBox}`);
  // Смужок з боків немає: тло тепле на все вікно
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  if (bg !== 'rgb(255, 241, 220)') problems.push(`тло навколо екрана завершення не тепле: ${bg}`);

  // Англійська
  await setup(page, { layout: 'en', level: '3-4' });
  for (const id of [4, 17]) {
    await openLesson(page, id);
    await page.screenshot({ path: tag(`l${id}-en-34-intro`) });
    await autoplay(page, 'en', { stopAt: 3, delay: 15 });
    await page.waitForTimeout(900);
    await autoplay(page, 'en', { stopAt: 10, delay: 15 });
    await page.screenshot({ path: tag(`l${id}-en-34-drill`) });
    if (!(await fitsCard(page))) problems.push(`EN 3–4, урок ${id}: завдання не вміщається (${w})`);
  }
  await setup(page, { layout: 'en', level: '1-2' });
  await openLesson(page, 2);
  if (!(await autoplay(page, 'en', { mistakes: 1, delay: 10 }))) problems.push('EN урок 2 не дійшов до кінця');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: tag('done-en-12') });
}

for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && problems.push(`консоль: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`помилка: ${e.message}`));
  page.on('request', (r) => !r.url().startsWith('file:') && !r.url().startsWith('data:') && problems.push(`мережа: ${r.url()}`));

  await page.goto(pathToFileURL(file).href);
  await page.screenshot({ path: `screenshots/demo-top-${w}.png` });
  await page.screenshot({ path: `screenshots/demo-full-${w}.png`, fullPage: true });
  for (const s of SCREENS) {
    await page.goto(`${pathToFileURL(file).href}#${s}`);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `screenshots/${s}-${w}.png` });
  }
  await lessonFlow(page, w);
  await stage3(page, w);
  await ctx.close();
}
await browser.close();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('Знімки готові в screenshots/');
