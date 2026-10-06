// Знімки екрана для самоперевірки: відкриває docs/index.html (file://) і знімає екрани.
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

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
  await ctx.close();
}
await browser.close();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('Знімки готові в screenshots/');
