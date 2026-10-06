// Перевірка Етапу 5 «Звук і персонаж» + правки карти:
// бульбашка уроку в один рядок для всіх уроків, кільце поточного уроку, немає кнопок-динаміків,
// звукові ефекти (рахуємо звуки), перемикач звуку (зберігається), фрази Клавика, нуль мережевих запитів.
// Запуск: npm run build && node scripts/stage5.mjs
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { codeOfChar, needsShift } from '../src/keyboard/layouts.js';
import { COURSE } from '../src/lessons/course.js';

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

// «Несправжній» звук: рахуємо, скільки тонів було запущено
const COUNTER = `(() => {
  window.__tones = 0;
  const Real = window.AudioContext;
  window.AudioContext = class extends Real {
    createOscillator() { window.__tones += 1; return super.createOscillator(); }
  };
})();`;

const seed = (layout, level, done) => ({
  profiles: [{ id: 'p1', name: 'Оля', avatar: 'fox', level, layout, progress: { ua: layout === 'ua' ? done : {}, en: layout === 'en' ? done : {} }, stats: {}, badges: {}, flags: {} }],
});

for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(COUNTER);
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && problems.push(`консоль: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`помилка: ${e.message}`));
  page.on('request', (r) => !r.url().startsWith('file:') && !r.url().startsWith('data:') && problems.push(`мережа: ${r.url()}`));
  await page.goto(base);

  // 1. Бульбашка «Урок N: …» — один рядок, не налазить на кнопки, для кожного уроку обох курсів і рівнів
  let checked = 0;
  for (const layout of ['ua', 'en']) {
    for (const level of ['1-2', '3-4']) {
      const list = COURSE[layout].filter((l) => !(l.minLevel === '3-4' && level === '1-2'));
      for (let k = 0; k < list.length; k++) {
        const done = Object.fromEntries(list.slice(0, k).map((l) => [l.id, 2]));
        await page.evaluate((d) => localStorage.setItem('klaviaturka.v1', JSON.stringify(d)), seed(layout, level, done));
        await page.goto(base); await page.reload();
        await page.click('[data-profile]');
        await page.waitForSelector('.screen-map');
        const m = await page.evaluate(() => {
          const t = document.querySelector('.map-title .bubble-text');
          const r = t.getBoundingClientRect();
          const lh = parseFloat(getComputedStyle(t).fontSize);
          const bub = document.querySelector('.map-title').getBoundingClientRect();
          const next = document.querySelector('.map-course').getBoundingClientRect();
          // рядки: групуємо літери за висотою; «сирітка» — останній рядок коротший за 25% першого
          const rg = document.createRange(); const tn = t.firstChild; const rows = new Map();
          for (let i = 0; i < tn.length; i++) { rg.setStart(tn, i); rg.setEnd(tn, i + 1); const b = rg.getBoundingClientRect(); if (!b.width) continue; const y = Math.round(b.top); const o = rows.get(y) ?? [1e9, 0]; rows.set(y, [Math.min(o[0], b.left), Math.max(o[1], b.right)]); }
          const widths = [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, [l, rr]]) => rr - l);
          return { widths, lines: widths.length, right: bub.right, nextLeft: next.left, text: t.textContent, speakBtns: document.querySelectorAll('.map-title button').length, rings: document.querySelectorAll('.node-ring').length, lessonBtns: document.querySelectorAll('.bubble button').length };
        });
        const tag = `${layout} ${level} «${m.text}»`;
        ok(m.lines <= 2, `забагато рядків: ${tag}`);
        ok(m.lines === 1 || m.widths[1] >= m.widths[0] * 0.4, `«сирітка» в бульбашці: ${tag} ${m.widths.map(Math.round)}`);
        if (m.text.length <= 20) ok(m.lines === 1, `коротка назва переноситься: ${tag}`);
        ok(m.right <= m.nextLeft - 8, `бульбашка налазить на кнопки: ${tag} (${Math.round(m.right)} > ${Math.round(m.nextLeft)})`);
        ok(m.speakBtns === 1, 'біля фрази на карті немає кнопки-динаміка');
        ok(m.rings === 1, `кільце поточного уроку: ${m.rings}`);
        checked += 1;
      }
    }
  }
  console.log(`[${w}] карта: перевірено станів ${checked}`);

  // 2. Скріншот карти (урок 1 УКР)
  await page.evaluate((d) => localStorage.setItem('klaviaturka.v1', JSON.stringify(d)), seed('ua', '1-2', {}));
  await page.reload(); await page.click('[data-profile]'); await page.waitForSelector('.screen-map');
  await page.waitForTimeout(150);
  await page.screenshot({ path: `screenshots/s5-map-${w}.png` });
  await page.evaluate(() => document.querySelector('.node.is-current')?.scrollIntoView());
  await page.screenshot({ path: `screenshots/s5-ring-${w}.png`, clip: { x: 0, y: 140, width: Math.round(w * 0.45), height: Math.round(h * 0.38) } });

  // 3. Звукові ефекти і перемикач
  await page.click('.node.is-current');
  await page.waitForSelector('[data-lesson]');
  await page.waitForTimeout(100);
  const tones = () => page.evaluate(() => window.__tones);
  const t0 = await tones();
  ok(t0 > 0, 'клік по кнопці без звуку');
  await press(page, 'а'); // потрібна «а» у першому кроці
  await page.waitForTimeout(900); // після кроку екран на мить «замикається» і хвалить
  ok((await tones()) > t0, 'правильна клавіша без звуку');
  const t1 = await tones();
  await press(page, 'щ'); // помилка (чекаємо «о»)
  ok((await tones()) > t1, 'підказка після помилки без звуку');
  
  await page.screenshot({ path: `screenshots/s5-lesson-${w}.png` });
  // вимикаємо звук
  await page.click('.sound-toggle');
  ok((await page.getAttribute('.sound-toggle', 'data-off')) !== null, 'перемикач не показує «вимкнено»');
  const t2 = await tones();
  await press(page, 'о'); await page.waitForTimeout(100);
  ok((await tones()) === t2, 'звук грає після вимкнення');
  await page.screenshot({ path: `screenshots/s5-lesson-muted-${w}.png` });
  // після перезавантаження звук лишається вимкненим
  await page.reload(); await page.click('[data-profile]'); await page.waitForSelector('.screen-map');
  ok((await page.getAttribute('.sound-toggle', 'data-off')) !== null, 'вимкнений звук не запам’ятався');
  await page.click('.sound-toggle');
  ok((await page.getAttribute('.sound-toggle', 'data-off')) === null, 'звук не вмикається назад');

  // 4. Фрази Клавика: різні підказки після помилок, серія, кінець вправи; повний урок до екрана завершення
  await page.click('.node.is-current'); await page.waitForSelector('[data-lesson]');
  const seen = new Set();
  let streak = false, stepDone = false;
  for (let g = 0; g < 400 && !(await page.$('[data-done]')); g++) {
    const cur = await page.evaluate(() => (document.querySelector('[data-msg] .bubble-text')?.textContent.startsWith('Так!') ? null : document.querySelector('.task-ch.is-current')?.textContent ?? null));
    if (cur === null) { await page.waitForTimeout(50); continue; }
    const ch = cur === '␣' ? ' ' : cur;
    if (g % 9 === 4 && ch !== ' ') { await press(page, 'щ'); seen.add(await text(page, '[data-msg] .bubble-text')); }
    await press(page, ch);
    const msg = await text(page, '[data-msg] .bubble-text');
    if (/Так тримати|Чудово йде|Класно виходить|Ти вмієш|друкарю|Без жодної/.test(msg ?? '')) streak = true;
    if (/Вправа готова|Гарна вправа|Ось так|Чудово!|Супер, далі/.test(msg ?? '')) stepDone = true;
    await page.waitForTimeout(25);
  }
  ok(await page.$('[data-done]'), 'урок не дійшов до завершення');
  ok(seen.size >= 2, `підказки після помилок однакові: ${[...seen]}`);
  ok(streak, 'Клавик не похвалив за серію');
  await page.waitForTimeout(700);
  ok(!!(await page.$('.screen-done .sound-toggle')), 'на екрані завершення немає перемикача звуку');
  await page.screenshot({ path: `screenshots/s5-done-${w}.png` });
  console.log(`[${w}] підказки: ${[...seen].join(' | ')}; серія: ${streak}; кінець вправи: ${stepDone}`);

  // 5. «Хто ти?» і «Мої досягнення»: перемикач звуку на місці
  await page.goto(`${base}#`); await page.reload();
  ok(!!(await page.$('.screen-profiles .sound-toggle')), 'на «Хто ти?» немає перемикача звуку');
  await page.screenshot({ path: `screenshots/s5-who-${w}.png` });
  await page.click('[data-profile]'); await page.click('[data-go="achievements"]'); await page.waitForSelector('.screen-ach');
  ok(!!(await page.$('.screen-ach .sound-toggle')), 'на «Мої досягнення» немає перемикача звуку');
  await page.screenshot({ path: `screenshots/s5-ach-${w}.png` });
  await ctx.close();
}
await browser.close();
if (problems.length) { console.log('ПРОБЛЕМИ:\n' + [...new Set(problems)].join('\n')); process.exit(1); }
console.log('Етап 5: усе гаразд');
