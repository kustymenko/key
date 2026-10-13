// Етап Т2: вступний тест наскрізь у кожному світі: node scripts/placement.mjs
// Швидкий шлях («досвідчений»), пропуск, ручний вибір, неправильна розкладка, повторне проходження, нуль запитів.
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
const base = pathToFileURL(file).href;
const WORLDS = ['voxel', 'pixel', 'sky'];
const problems = [];
const ok = (c, m) => { if (!c) problems.push(m); };
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('klaviaturka.v1') ?? '{"profiles":[]}').profiles);

for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const requests = [];
  page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) requests.push(r.url()); });
  page.on('pageerror', (e) => problems.push(`${w}: помилка сторінки ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`${w}: консоль ${m.text()}`); });
  const shot = (name) => page.screenshot({ path: `screenshots/t2-${name}-${w}.png` });
  const press = (key, shift = false) => page.evaluate(([k, sh]) => {
    const lower = k.toLowerCase();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: window.__code?.(lower) ?? '', shiftKey: sh, bubbles: true, cancelable: true }));
  }, [key, shift]);
  const overflow = () => page.evaluate(() => {
    const st = document.querySelector('.stage')?.getBoundingClientRect(); if (!st) return 'немає сцени';
    return [...document.querySelectorAll('.stage *')].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && getComputedStyle(el).display !== 'none' && !el.closest('svg') && !el.closest('.cm-scale') && !el.closest('.cm-num') && (b.right > st.right + 2 || b.bottom > st.bottom + 2 || b.left < st.left - 2 || b.top < st.top - 2); }).map((el) => el.className || el.tagName).slice(0, 4).join(', ');
  });
  const check = async (name) => { const o = await overflow(); if (o) problems.push(`${w} ${name}: виходить за межі: ${o}`); };

  await page.goto(base); await page.evaluate(() => localStorage.clear()); await page.reload();
  // створюємо трьох учнів 5–6 класів, по одному в кожному світі
  for (let i = 0; i < 3; i++) {
    await page.goto(base); await page.waitForSelector('[data-go="new"]');
    await page.click('[data-go="new"]'); await page.fill('.name-input', `Учень${i + 1}`); await page.click('[data-act="name-next"]');
    await page.click('[data-level-pick="5"]'); await page.click(`[data-pick-world="${WORLDS[i]}"]`); await page.waitForSelector('[data-pl]');
  }
  const typeText = async (lineSel) => {
    for (let guard = 0; guard < 1200; guard++) {
      const ch = await page.evaluate((sel) => { const c = document.querySelector(`${sel} .pl-cur`); return c ? c.textContent.replace(/ /g, ' ') : null; }, lineSel);
      if (ch == null) return;
      const code = codeOfChar(ch, 'ua');
      await page.evaluate(([k, c, sh]) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: c, shiftKey: sh, bubbles: true, cancelable: true })), [ch, code ?? '', ch !== ch.toLowerCase()]);
    }
  };

  for (let i = 0; i < 3; i++) {
    const world = WORLDS[i];
    await page.goto(base); await page.reload();
    await page.click(`.profile-card.is-teen >> nth=${i}`); await page.waitForSelector('[data-pl]');
    ok(page.url().endsWith('#teen/start'), `${world}: перший вхід має вести на вступний тест`);
    await shot(`${world}-intro`); await check(`${world}-intro`);
    await page.click('[data-self="yes"]');
    ok((await page.locator('[data-self="yes"][aria-pressed="true"]').count()) === 1, `${world}: відповідь про клавіатуру не відмічена`);
    await page.click('[data-act="start-test"]');
    await shot(`${world}-ready`);
    // 1: літери (миттєві правильні відповіді → «досвідчений»)
    await page.click('[data-act="go"]');
    await page.waitForSelector('[data-letter]');
    await press('a'); // неправильна розкладка (латиниця) → підказка, не помилка
    await page.waitForSelector('.layout-hint');
    ok((await page.locator('[data-msg] .layout-hint').count()) === 1, `${world}: немає підказки про розкладку`);
    await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ф', code: 'KeyA', bubbles: true, cancelable: true }))); // «ф» — найімовірніше не та літера
    for (let n = 0; n < 40; n++) {
      const l = await page.evaluate(() => document.querySelector('[data-letter]')?.textContent);
      if (!l) break;
      await page.evaluate(([k]) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: '', bubbles: true, cancelable: true })), [l.toLowerCase()]);
    }
    if (w === 1366 && i === 0) { /* знімок частини 1 робимо нижче в кожному світі */ }
    await page.waitForSelector('.pl-step:has-text("2 з 3")');
    await page.click('[data-act="go"]'); await page.waitForSelector('[data-lines]');
    await shot(`${world}-words`); await check(`${world}-words`);
    await typeText('[data-lines]');
    await page.waitForSelector('.pl-step:has-text("3 з 3")');
    await page.click('[data-act="go"]'); await page.waitForSelector('[data-lines]');
    await shot(`${world}-sentences`);
    await typeText('[data-lines]');
    await page.waitForSelector('.pl-stats');
    await shot(`${world}-result`); await check(`${world}-result`);
    ok((await page.locator('[data-act="accept"][data-kind="pro"]:not([data-manual])').count()) === 1, `${world}: швидкий і точний шлях має дати «досвідчений»`);
    // ручний вибір: інший старт
    await page.click('[data-manual="1"][data-kind="mid"]');
    await page.waitForSelector(`.stage > .cn-${world}`);
    let p = (await store(page))[i];
    ok(p.placement?.kind === 'mid' && p.placement.source === 'manual' && p.placement.self === 'yes' && p.placement.wordsAcc > 90, `${world}: ручний вибір не збережено (${JSON.stringify(p.placement)})`);
    // повторне проходження: тепер приймаємо рекомендацію
    await page.goto(`${base}#teen/avatar`); await page.click('[href="#teen/start"]'); await page.waitForSelector('[data-pl]');
    await page.click('[data-act="start-test"]'); await page.click('[data-act="go"]'); await page.waitForSelector('[data-letter]');
    for (let n = 0; n < 40; n++) {
      const l = await page.evaluate(() => document.querySelector('[data-letter]')?.textContent);
      if (!l) break;
      await page.evaluate(([k]) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: '', bubbles: true, cancelable: true })), [l.toLowerCase()]);
    }
    await page.waitForSelector('.pl-step:has-text("2 з 3")'); await page.click('[data-act="go"]'); await page.waitForSelector('[data-lines]'); await typeText('[data-lines]');
    await page.waitForSelector('.pl-step:has-text("3 з 3")'); await page.click('[data-act="go"]'); await page.waitForSelector('[data-lines]'); await typeText('[data-lines]');
    await page.waitForSelector('.pl-stats');
    await page.click('[data-act="accept"]:not([data-manual])'); await page.waitForSelector(`.stage > .cn-${world}`);
    p = (await store(page))[i];
    ok(p.placement?.kind === 'pro' && p.placement.source === 'test', `${world}: прийняте розміщення не збережено`);
    // знову заходимо: тест уже не нав'язується
    await page.goto(base); await page.click(`.profile-card.is-teen >> nth=${i}`); await page.waitForSelector(`.stage > .cn-${world}`);
  }

  // Пропуск і «Пройти ще раз»: учень 1
  await page.goto(base); await page.reload();
  await page.click('.profile-card.is-teen >> nth=0'); await page.waitForSelector('.stage > .cn-voxel');
  await page.goto(`${base}#teen/start`); await page.waitForSelector('[data-pl]'); await page.click('[data-act="skip"]'); await page.waitForSelector('.stage > .cn-voxel');
  ok((await store(page))[0].placement?.kind === 'zero' && (await store(page))[0].placement.source === 'skip', 'пропуск не дав «з нуля»');
  // Тест без жодного натискання (учень задумався): результат — з нуля, частини завершуються самі за таймером (лише 1366)
  if (w === 1366) {
    await page.goto(`${base}#teen/test`); await page.waitForSelector('[data-pl]'); await page.click('[data-act="go"]');
    await page.waitForSelector('.pl-step:has-text("2 з 3")', { timeout: 40000 });
    await page.click('[data-act="go"]'); await page.waitForSelector('.pl-step:has-text("3 з 3")', { timeout: 40000 });
    await page.click('[data-act="go"]'); await page.waitForSelector('.pl-stats', { timeout: 40000 });
    ok((await page.locator('[data-act="accept"][data-kind="zero"]:not([data-manual])').count()) === 1, 'тест без натискань має дати «з нуля»');
    await shot('result-zero'); await check('result-zero');
  }
  ok(requests.length === 0, `${w}: мережеві запити: ${requests.join(', ')}`);
  await ctx.close();
}
await browser.close();
console.log(problems.length ? 'ПРОБЛЕМИ:\n' + problems.join('\n') : 'Етап Т2: усе гаразд, знімки в screenshots/t2-*');
process.exitCode = problems.length ? 1 : 0;
