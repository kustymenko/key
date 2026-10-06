// Перевірка Етапу 4 «Профілі і збереження»: створення профілів, збереження після перезавантаження,
// відновлення вправи, значки, «Мої досягнення», «Для дорослого», приховані ескізи.
// Запуск: npm run build && node scripts/stage4.mjs
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { codeOfChar, needsShift } from '../src/keyboard/layouts.js';

const file = resolve('docs/index.html');
if (!existsSync(file)) throw new Error('Спочатку: npm run build');
mkdirSync('screenshots', { recursive: true });
const base = pathToFileURL(file).href;
const cloudChrome = '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath: existsSync(cloudChrome) ? cloudChrome : undefined });
const problems = [];
const ok = (cond, msg) => { if (!cond) problems.push(msg); };

const press = (page, ch, layout = 'ua') => page.evaluate(([c, k, sh]) => window.dispatchEvent(new KeyboardEvent('keydown', { code: c, key: k, shiftKey: sh, bubbles: true })), [codeOfChar(ch, layout), ch, needsShift(ch, layout)]);
const text = (page, sel) => page.evaluate((s) => document.querySelector(s)?.textContent ?? null, sel);

// Друкує, доки не з'явиться екран завершення (або stopDots вправ)
async function play(page, { layout = 'ua', untilDots = null, mistakes = 0 } = {}) {
  let wrong = mistakes;
  for (let g = 0; g < 1500; g++) {
    if (await page.$('[data-done]')) return true;
    if (untilDots !== null && (await page.$$('.dot.is-on')).length >= untilDots) return false;
    const cur = await page.evaluate(() => (document.querySelector('[data-msg] .bubble-text')?.textContent.startsWith('Так!') ? null : document.querySelector('.task-ch.is-current')?.textContent ?? null));
    if (cur === null) { await page.waitForTimeout(50); continue; }
    const ch = cur === '␣' ? ' ' : cur;
    if (wrong > 0 && ch !== ' ') { wrong -= 1; await press(page, ch.toLowerCase() === 'щ' ? 'ю' : 'щ', layout); }
    await press(page, ch, layout);
    await page.waitForTimeout(3);
  }
  return false;
}

async function createKid(page, name, animalIdx, level) {
  await page.click('[data-go="new"]');
  await page.fill('.name-input', name);
  await page.click('[data-act="name-next"]');
  await page.click(`.avatar-pick >> nth=${animalIdx}`);
  await page.click('[data-act="avatar-next"]');
  await page.click(`[data-level-pick="${level}"]`);
  await page.waitForSelector('.screen-map');
}

for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  const shot = (page, n) => page.screenshot({ path: `screenshots/s4-${n}-${w}.png` });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && problems.push(`консоль: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`помилка: ${e.message}`));
  page.on('request', (r) => !r.url().startsWith('file:') && !r.url().startsWith('data:') && problems.push(`мережа: ${r.url()}`));

  // Приховане від дітей: ескізи і кнопка «до всіх ескізів»
  await page.goto(base);
  ok(!(await page.$('.back-link')), 'кнопка «до всіх ескізів» видна дітям');
  await shot(page, 'who-empty');
  await page.goto(`${base}#exercise`); await page.waitForTimeout(80);
  ok(!!(await page.$('.screen-profiles')), 'ескіз #exercise відкрився без #demo');
  await page.goto(`${base}#map`); await page.waitForTimeout(80);
  ok(!!(await page.$('.screen-profiles')), '#map без профілю не веде на «Хто ти?»');
  await page.goto(`${base}#demo`); await page.waitForTimeout(80);
  ok(!!(await page.$('.demo')), '#demo не відкрилась');
  await page.goto(`${base}#exercise`); await page.waitForTimeout(80);
  ok(!!(await page.$('.back-link')) && !!(await page.$('.screen-exercise')), 'у демо ескіз і кнопка «до всіх ескізів» мають бути');

  // Нова дитина, створення і збереження
  await page.goto(`${base}?fresh=${w}#`); await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.click('[data-go="new"]');
  await shot(page, 'new-name');
  await page.fill('.name-input', 'Соня');
  await page.click('[data-act="name-next"]');
  await shot(page, 'new-avatar');
  await page.click('[data-act="more"]'); await page.click('.avatar-pick >> nth=0'); // совеня... (друга сторінка: зайчик)
  await page.click('[data-act="more"]'); await page.click('.avatar-pick >> nth=0'); // лисичка
  await page.click('[data-act="avatar-next"]');
  await shot(page, 'new-level');
  await page.click('[data-level-pick="1-2"]');
  await page.waitForSelector('.screen-map'); await page.waitForTimeout(100);
  await shot(page, 'map-new');
  ok((await text(page, '.map-title .bubble-text')) === 'Урок 1: літери А і О', `заголовок карти: ${await text(page, '.map-title .bubble-text')}`);

  // Урок 1 з однією помилкою: значки «Перший урок» (і т.д.), збереження
  await page.click('[data-lesson-id="1"].node');
  await play(page, { mistakes: 3 });
  await page.waitForTimeout(1200);
  await shot(page, 'done-badge');
  ok(!!(await page.$('.done-badges')), 'немає «Новий значок»');
  await page.click('[data-go="map"]'); await page.waitForTimeout(100);
  ok((await page.$$('.node.is-done')).length === 1, 'урок 1 не відмічено пройденим');

  // Перезавантаження: прогрес на місці
  await page.reload(); await page.waitForTimeout(150);
  ok(!!(await page.$('.screen-profiles')), 'після перезавантаження має бути «Хто ти?»');
  ok((await text(page, '.profile-name')) === 'Соня', 'картки Соні немає після перезавантаження');
  await page.click('[data-profile]'); await page.waitForSelector('.screen-map');
  ok((await page.$$('.node.is-done')).length === 1, 'зірочки зникли після перезавантаження');
  ok((await text(page, '.map-title .bubble-text')) === 'Урок 2: літери В і Л', 'після уроку 1 Клавик не називає урок 2');

  // Вправа відновлюється після закриття вкладки
  await page.click('[data-lesson-id="2"].node');
  await play(page, { untilDots: 3 });
  await page.reload(); await page.waitForTimeout(150);
  await page.click('[data-profile]'); await page.waitForSelector('.screen-map');
  await page.click('.node.is-current'); await page.waitForTimeout(150);
  ok((await text(page, '[data-msg] .bubble-text')) === 'Продовжимо!', 'вправа не відновилась');
  ok((await page.$$('.dot.is-on')).length === 3, `точки прогресу після відновлення: ${(await page.$$('.dot.is-on')).length}`);
  await shot(page, 'resume');
  await play(page);
  await page.waitForTimeout(1000);
  await page.click('[data-go="map"]');

  // Мої досягнення
  await page.click('[data-go="achievements"]'); await page.waitForTimeout(100);
  await shot(page, 'achievements');
  ok((await page.$$('.badge-cell.is-earned')).length >= 1, 'на «Мої досягнення» немає отриманих значків');

  // Для дорослого: неправильна відповідь, потім правильна
  await page.click('[data-go="adult"]');
  await page.fill('.sum-input', '1'); await page.click('[data-act="check"]');
  ok((await text(page, '.adult-note')) === 'Спробуй ще раз', 'неправильна відповідь не відхилена');
  const sum = await text(page, '.adult-sum');
  const [a, b] = sum.match(/\d+/g).map(Number);
  await shot(page, 'adult-gate');
  await page.fill('.sum-input', String(a * b)); await page.click('[data-act="check"]');
  await shot(page, 'adult-panel');
  await page.click('[data-set-level="3-4"]');
  await page.click('[data-ask="reset"]'); await page.waitForTimeout(80);
  await shot(page, 'adult-confirm');
  await page.click('[data-act="cancel"]');
  ok((await page.evaluate(() => JSON.parse(localStorage.getItem('klaviaturka.v1')).profiles[0].level)) === '3-4', 'клас не змінився');
  ok(Object.keys(await page.evaluate(() => JSON.parse(localStorage.getItem('klaviaturka.v1')).profiles[0].progress.ua)).length >= 2, 'прогрес зник без підтвердження');
  await page.click('[data-ask="reset"]'); await page.click('[data-do="reset"]');
  ok(Object.keys(await page.evaluate(() => JSON.parse(localStorage.getItem('klaviaturka.v1')).profiles[0].progress.ua)).length === 0, 'скидання не спрацювало');
  await page.click('[data-ask="delete"]'); await page.click('[data-do="delete"]');
  await page.waitForSelector('.screen-profiles');
  ok((await page.$$('[data-profile]')).length === 0, 'картку не видалено');

  // Багато дітей: різні розміри карток, усе вміщається
  for (const n of [4, 9, 17]) {
    await page.evaluate((cnt) => {
      const av = ['fox', 'hedgehog', 'cat', 'bear', 'rabbit', 'owl', 'frog', 'penguin'];
      const profiles = Array.from({ length: cnt }, (_, i) => ({ id: `k${i}`, name: ['Соня', 'Максим', 'Ліза', 'Олександра', 'Богдан'][i % 5], avatar: av[i % 8], level: i % 2 ? '3-4' : '1-2', layout: 'ua', progress: { ua: { 1: 3 }, en: {} }, badges: { first: 1 } }));
      localStorage.setItem('klaviaturka.v1', JSON.stringify({ v: 1, profiles }));
    }, n);
    await page.reload(); await page.waitForTimeout(150);
    await shot(page, `who-${n}`);
    const fits = await page.evaluate(() => { const st = document.querySelector('.stage').getBoundingClientRect(); const c = document.querySelector('.profile-cards').getBoundingClientRect(); return c.bottom <= st.bottom - 20 && c.top >= st.top && c.left >= st.left && c.right <= st.right; });
    ok(fits, `${n} карток не вміщаються`);
  }

  // Карта з поточним уроком «Є» (урок 7) і значки
  await page.evaluate(() => {
    const progress = { ua: { 1: 3, 2: 2, 3: 3, 4: 1, 5: 3, 6: 2 }, en: { 1: 3, 2: 3 } };
    localStorage.setItem('klaviaturka.v1', JSON.stringify({ v: 1, profiles: [{ id: 'x', name: 'Максим', avatar: 'frog', level: '3-4', layout: 'ua', progress, stats: { typed: 400, errors: 18, ms: 600000, chars: 380, missed: { щ: 4, ц: 3 } }, badges: { first: 1, three: 1, 'home-row': 1, clean: 1 }, flags: { clean: true } }] }));
  });
  await page.reload(); await page.click('[data-profile]'); await page.waitForSelector('.screen-map'); await page.waitForTimeout(150);
  ok((await text(page, '.map-title .bubble-text')) === 'Урок 7: літера Є', `заголовок: ${await text(page, '.map-title .bubble-text')}`);
  await shot(page, 'map-lesson7');
  await page.click('[data-go="achievements"]'); await page.waitForTimeout(100);
  await shot(page, 'achievements-34');
  await ctx.close();
}
await browser.close();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('Етап 4: усе гаразд, знімки в screenshots/s4-*');
