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
  await ctx.close();
}
await browser.close();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('Знімки готові в screenshots/');
