// Перевірка Етапу 6 «Міні-ігри»: відкриття ігор після 3-го/6-го уроку, лише вивчені літери, гра до кінця,
// екран підсумку, рекорд зберігається, нуль мережевих запитів, знімки.
// Запуск: npm run build && node scripts/stage6.mjs
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { codeOfChar } from '../src/keyboard/layouts.js';
import { learnedLetters } from '../src/lessons/generator.js';

const file = resolve('docs/index.html');
if (!existsSync(file)) throw new Error('Спочатку: npm run build');
mkdirSync('screenshots', { recursive: true });
const base = pathToFileURL(file).href;
const cloudChrome = '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath: existsSync(cloudChrome) ? cloudChrome : undefined });
const problems = [];
const ok = (c, m) => { if (!c) problems.push(m); };
const doneTo = (layout, n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, 2]));
const seed = (layout, level, n, games = {}) => ({
  profiles: [{ id: 'p1', name: 'Оля', avatar: 'fox', level, layout, progress: { ua: layout === 'ua' ? doneTo(layout, n) : {}, en: layout === 'en' ? doneTo(layout, n) : {} }, stats: {}, badges: {}, flags: {}, games }],
});

async function open(page, data) {
  await page.evaluate((d) => localStorage.setItem('klaviaturka.v1', JSON.stringify(d)), data);
  await page.goto(base); await page.reload();
  await page.click('[data-profile]');
  await page.waitForSelector('.screen-map');
}
const press = (page, ch, layout) => page.evaluate(([c, k]) => window.dispatchEvent(new KeyboardEvent('keydown', { code: c, key: k, bubbles: true })), [codeOfChar(ch, layout), ch]);
const fits = (page) => page.evaluate(() => {
  const s = document.querySelector('.stage').getBoundingClientRect();
  return [...document.querySelectorAll('.stage button, .game-field, .game-bottom, .pill')].every((e) => { const r = e.getBoundingClientRect(); return r.width === 0 || (r.left >= s.left - 1 && r.right <= s.right + 1 && r.bottom <= s.bottom + 1); });
});

for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && problems.push(`консоль: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`помилка: ${e.message}`));
  page.on('request', (r) => !r.url().startsWith('file:') && !r.url().startsWith('data:') && problems.push(`мережа: ${r.url()}`));
  await page.goto(base);

  // 1. Після 2 уроків обидві гри закриті; кнопка «Ігри» на карті на місці й не налазить на інше
  await open(page, seed('ua', '1-2', 2));
  ok(await fits(page), `${w}: карта — кнопки вилізли за сцену`);
  await page.screenshot({ path: `screenshots/s6-map-${w}.png` });
  await page.click('[data-go="games"]');
  await page.waitForSelector('.screen-games');
  ok((await page.$$('.game-card:disabled')).length === 2, `${w}: після 2 уроків ігри мають бути закриті`);
  await page.screenshot({ path: `screenshots/s6-games-locked-${w}.png` });

  // 2. Після 3 — відкриті «Кульки», після 6 — обидві
  await open(page, seed('ua', '1-2', 3));
  await page.click('[data-go="games"]');
  await page.waitForSelector('.screen-games');
  ok((await page.$$('.game-card:disabled')).length === 1, `${w}: після 3 уроків має бути закрита лише «Падаючі літери»`);
  await page.screenshot({ path: `screenshots/s6-games-3-${w}.png` });

  for (const [layout, level, n, kind] of [['ua', '1-2', 3, 'balloons'], ['ua', '3-4', 6, 'falling'], ['ua', '1-2', 6, 'falling'], ['en', '3-4', 3, 'balloons'], ['en', '3-4', 6, 'falling']]) {
    await open(page, seed(layout, level, n));
    await page.click('[data-go="games"]');
    await page.click(`[data-game="${kind}"]`);
    await page.waitForSelector('[data-intro]');
    const allowed = new Set(learnedLetters(layout, n));
    const intro = await page.$$eval('.game-letters .keycap', (els) => els.map((e) => e.textContent.toLowerCase()));
    ok(intro.length === allowed.size && intro.every((c) => allowed.has(c)), `${w} ${layout} ${kind}: літери на вході ${intro}`);
    if (w === 1366) await page.screenshot({ path: `screenshots/s6-${kind}-${layout}-${level}-intro.png` });
    await page.click('[data-act="go"]');
    const seen = new Set();
    let shot = false;
    let popped = 0;
    const t0 = Date.now();
    // Грає «дитина»: ловить усе, що бачить, з невеликою затримкою; обмеження — 100 с
    while (Date.now() - t0 < 100000 && !(await page.$('[data-done]'))) {
      const items = await page.$$eval('.game-item:not(.is-pop):not(.is-away):not(.is-fade) .game-item-ch', (e) => e.map((x) => x.textContent.toLowerCase()));
      items.forEach((c) => seen.add(c));
      if (items.length && popped < 50) { await press(page, items[0], layout); popped++; }
      if (!shot && w === 1366 && items.length >= 2 && popped >= 3) { shot = true; await page.screenshot({ path: `screenshots/s6-${kind}-${layout}-${level}-play.png` }); ok(await fits(page), `${w} ${kind}: у грі щось вилізло за сцену`); }
      await page.waitForTimeout(kind === 'balloons' ? 700 : 400);
      if (kind === 'falling' && popped >= 8 && Date.now() - t0 > 12000 && !(await page.$('[data-done]')) && process.env.QUICK) break;
    }
    ok([...seen].every((c) => allowed.has(c)), `${w} ${layout} ${kind}: з'явились чужі літери ${[...seen].filter((c) => !allowed.has(c))}`);
    if (await page.$('[data-done]')) {
      const n2 = await page.textContent('.game-score b');
      ok(Number(n2) > 0, `${w} ${kind}: результат 0`);
      ok(await fits(page), `${w} ${kind}: підсумок вилізає за сцену`);
      if (w === 1366) await page.screenshot({ path: `screenshots/s6-${kind}-${layout}-${level}-done.png` });
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('klaviaturka.v1')).profiles[0].games);
      ok(saved[`${kind}-${layout}`]?.plays === 1, `${w} ${kind}: результат не збережено ${JSON.stringify(saved)}`);
    } else ok(false, `${w} ${layout} ${kind}: гра не закінчилась за 100 с`);
  }
  await ctx.close();
}

// Гра без профілю й закрита гра за прямою адресою
{
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(base + '#game');
  ok(await page.$('.screen-profiles'), '#game без дитини має вести на «Хто ти?»');
  await page.close();
}
await browser.close();
console.log(problems.length ? 'ПРОБЛЕМИ:\n' + problems.join('\n') : 'Етап 6: усе гаразд');
process.exit(problems.length ? 1 : 0);
