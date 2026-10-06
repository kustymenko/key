// Проходить КОЖЕН урок обох курсів і обох рівнів «пальцями» (імітація натискань).
// Перевіряє, що жоден урок не зависає: кожну потрібну клавішу можна натиснути, екран завершення з'являється.
// Запуск: npm run build && node scripts/playall.mjs
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { codeOfChar, needsShift } from '../src/keyboard/layouts.js';
import { COURSE, lessonsFor } from '../src/lessons/course.js';

const file = resolve('docs/index.html');
if (!existsSync(file)) throw new Error('Спочатку: npm run build');
const base = pathToFileURL(file).href;
const cloudChrome = '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath: existsSync(cloudChrome) ? cloudChrome : undefined });

const jobs = [];
for (const layout of ['ua', 'en']) for (const level of ['1-2', '3-4']) for (const l of lessonsFor(layout, level)) jobs.push({ layout, level, id: l.id });
const problems = [];

async function play(page, { layout, level, id }) {
  await page.goto(base);
  await page.click(`[data-layout="${layout}"]`);
  await page.click(`[data-level="${level}"]`);
  await page.click('[data-openall="1"]');
  await page.goto(`${base}#map`);
  await page.click(`.node[data-lesson-id="${id}"]`);
  const started = Date.now();
  for (let guard = 0; guard < 2000; guard++) {
    if (await page.$('[data-done]')) return;
    if (Date.now() - started > 60000) break;
    const cur = await page.evaluate(() => (document.querySelector('[data-msg] .bubble-text')?.textContent.startsWith('Так!') ? null : document.querySelector('.task-ch.is-current')?.textContent ?? null));
    if (cur === null) { await page.waitForTimeout(40); continue; }
    const ch = cur === '␣' ? ' ' : cur;
    const code = codeOfChar(ch, layout);
    if (!code) throw new Error(`немає клавіші для «${ch}»`);
    await page.evaluate(([c, k, sh]) => window.dispatchEvent(new KeyboardEvent('keydown', { code: c, key: k, shiftKey: sh, bubbles: true })), [code, ch, needsShift(ch, layout)]);
    await page.waitForTimeout(2);
  }
  throw new Error('урок не дійшов до екрана завершення');
}

const queue = [...jobs];
await Promise.all(Array.from({ length: 4 }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  for (let job = queue.shift(); job; job = queue.shift()) {
    errors.length = 0;
    try { await play(page, job); if (errors.length) throw new Error(errors.join('; ')); }
    catch (e) { problems.push(`${job.layout} ${job.level} урок ${job.id}: ${e.message}`); }
  }
  await ctx.close();
}));
await browser.close();
console.log(`Пройдено уроків: ${jobs.length - problems.length} з ${jobs.length}`);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
