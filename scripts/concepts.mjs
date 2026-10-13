// Знімки і перевірка демонстраційних концепцій стилю для 5–6 класів: node scripts/concepts.mjs
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { codeOfChar } from '../src/keyboard/layouts.js';

const file = resolve('docs/index.html');
if (!existsSync(file)) throw new Error('Спочатку: npm run build');
mkdirSync('screenshots', { recursive: true });
const cloudChrome = '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath: existsSync(cloudChrome) ? cloudChrome : undefined });
const url = pathToFileURL(file).href;
const problems = [];
const TEXT = 'новий світ чекає на тебе і твої швидкі пальці';
const ROUTES = ['concepts', ...['voxel', 'pixel', 'sky'].flatMap((c) => ['', '/avatar', '/type', '/rewards'].map((t) => c + t))];

for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const requests = [];
  page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) requests.push(r.url()); });
  page.on('pageerror', (e) => problems.push(`${w}: помилка сторінки ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`${w}: консоль ${m.text()}`); });
  for (const r of ROUTES) {
    await page.goto(`${url}#${r}`);
    await page.reload(); // нова відправна точка для hashchange
    await page.waitForTimeout(250);
    await page.screenshot({ path: `screenshots/cn-${r.replace('/', '-')}-${w}.png` });
    // нічого не виходить за сцену
    const over = await page.evaluate(() => {
      const st = document.querySelector('.stage')?.getBoundingClientRect(); if (!st) return 'немає сцени';
      return [...document.querySelectorAll('.stage *')].filter((el) => {
        const b = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        return b.width > 0 && cs.display !== 'none' && !el.closest('svg') && !el.closest('.cm-scale') && (b.right > st.right + 2 || b.bottom > st.bottom + 2 || b.left < st.left - 2 || b.top < st.top - 2);
      }).map((el) => el.className || el.tagName).slice(0, 5).join(', ');
    });
    if (over) problems.push(`${w} ${r}: виходить за межі: ${over}`);
  }
  // Вправа: друкуємо справжніми натисканнями (з однією помилкою)
  for (const c of ['voxel', 'pixel', 'sky']) {
    await page.goto(`${url}#${c}/type`); await page.reload(); await page.waitForTimeout(200);
    const press = (code, key) => page.evaluate(([cd, k]) => window.dispatchEvent(new KeyboardEvent('keydown', { code: cd, key: k, bubbles: true })), [code, key]);
    for (let i = 0; i < TEXT.length; i++) {
      if (i === 5) { await press('KeyZ', 'я'); if (w === 1366) await page.screenshot({ path: `screenshots/cn-${c}-type-error-${w}.png` }); }
      if (i === 20 && w === 1366) await page.screenshot({ path: `screenshots/cn-${c}-type-mid-${w}.png` });
      await press(codeOfChar(TEXT[i], 'ua'), TEXT[i]);
    }
    await page.waitForTimeout(150);
    const done = await page.evaluate(() => !document.querySelector('[data-done]').hidden);
    if (!done) problems.push(`${w} ${c}: вправа не завершилась`);
    if (w === 1366) await page.screenshot({ path: `screenshots/cn-${c}-type-done-${w}.png` });
  }
  // Герой змінюється
  await page.goto(`${url}#pixel/avatar`); await page.reload();
  await page.click('.px-opt.opt-hat[data-val="2"]');
  await page.click('.px-opt.opt-outfit[data-val="3"]');
  await page.waitForTimeout(100);
  if (w === 1366) await page.screenshot({ path: `screenshots/cn-pixel-avatar-changed-${w}.png` });
  if (requests.length) problems.push(`${w}: мережеві запити: ${requests.join(', ')}`);
  await page.close();
}
// 1–4 клас не зачеплено: головна сторінка без посилань на концепції
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page.goto(url); await page.waitForTimeout(200);
const links = await page.evaluate(() => document.body.innerHTML.match(/#(voxel|pixel|sky|concepts)/g));
if (links) problems.push('на головній є посилання на концепції');
await browser.close();
console.log(problems.length ? 'ПРОБЛЕМИ:\n' + problems.join('\n') : 'Усе гаразд: концепції відкриваються, вправа проходиться, запитів немає.');
process.exitCode = problems.length ? 1 : 0;
