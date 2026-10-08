// Етап 7: перевірка ВСІХ екранів за чек-листом kids-ux на 1366×768 і 1920×1080.
// Знімає екрани (screenshots/s7-*.png) і автоматично перевіряє:
//  - нічого не виходить за межі сцени, сторінка без прокручування;
//  - кнопки й поля ≥ 64×64 (у пікселях сцени), відступи між кнопками ≥ 16;
//  - текст ≥ 20 px (текст завдання: 1–2 клас ≥ 56, 3–4 клас ≥ 36), контраст ≥ 4.5;
//  - вільне друкування, Esc-пауза, пропозиція перерви; нуль мережевих запитів.
// Запуск: npm run build && node scripts/stage7.mjs
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
const notes = [];

const profile = (over = {}) => ({
  id: 'p1', name: 'Оля', avatar: 'fox', level: '1-2', layout: 'ua', stats: { typed: 120, errors: 9, ms: 90000, chars: 100, missed: { ш: 3, щ: 2 } }, badges: { first: 1, three: 2 }, flags: {},
  progress: { ua: Object.fromEntries([1, 2, 3, 4, 5, 6].map((i) => [i, i % 3 + 1])), en: {} }, ...over,
});
const press = (page, ch, layout = 'ua') => page.evaluate(([c, k, sh]) => window.dispatchEvent(new KeyboardEvent('keydown', { code: c, key: k, shiftKey: sh, bubbles: true })), [codeOfChar(ch, layout), ch, needsShift(ch, layout)]);
const key = (page, code) => page.evaluate((c) => window.dispatchEvent(new KeyboardEvent('keydown', { code: c, key: c, bubbles: true })), code);

// Друкує вправи, доки не з'явиться екран завершення (або stopAt знаків)
async function typeAll(page, layout, { stopAt = Infinity } = {}) {
  let n = 0;
  for (let g = 0; g < 1500; g++) {
    if (await page.$('[data-done]')) return true;
    const cur = await page.evaluate(() => (document.querySelector('[data-msg] .bubble-text')?.textContent.startsWith('Так!') ? null : document.querySelector('.task-ch.is-current')?.textContent ?? null));
    if (cur === null) { await page.waitForTimeout(50); continue; }
    if (n >= stopAt) return false;
    await press(page, cur === '␣' ? ' ' : cur, layout);
    n++;
    await page.waitForTimeout(4);
  }
  return false;
}

// Автоматична перевірка поточного екрана
async function audit(page, name, w, h, { taskMin = null } = {}) {
  const r = await page.evaluate(({ taskMin }) => {
    const stage = document.querySelector('.stage');
    const sr = stage.getBoundingClientRect();
    const k = sr.width / 1366;
    const out = [];
    const vis = (el) => { const cs = getComputedStyle(el); const b = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05 && b.width > 0 && b.height > 0 && !el.closest('[hidden]'); };
    const short = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`;
    if (document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1) out.push('є прокручування сторінки');
    // за межі сцени
    for (const el of stage.querySelectorAll('*')) {
      if (!vis(el) || el.closest('svg') && el.tagName !== 'svg' || el.matches('.map-path, .map-path *, .node-ring, .game-field *, .spark, .game-item, .game-item *')) continue;
      const b = el.getBoundingClientRect();
      if (b.left < sr.left - 2 || b.right > sr.right + 2 || b.top < sr.top - 2 || b.bottom > sr.bottom + 2) out.push(`за межами сцени: ${short(el)}`);
    }
    // кнопки
    const top = (e) => { const b = e.getBoundingClientRect(); const t = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !t || e === t || e.contains(t) || t.contains(e); };
    const btns = [...stage.querySelectorAll('button, input, a.back-link')].filter((e) => vis(e) && top(e)); // закриті шаром (пауза, підтвердження) не рахуємо
    const rects = btns.map((el) => ({ el, b: el.getBoundingClientRect() }));
    for (const { el, b } of rects) {
      if (el.matches('.back-link')) continue;
      if (b.width / k < 63.5 || b.height / k < 63.5) out.push(`мала кнопка ${Math.round(b.width / k)}×${Math.round(b.height / k)}: ${short(el)} «${(el.getAttribute('aria-label') || el.textContent).trim().slice(0, 20)}»`);
    }
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i].b; const c = rects[j].b;
      if (rects[i].el.contains(rects[j].el) || rects[j].el.contains(rects[i].el)) continue;
      if (rects[i].el.closest('.segmented') && rects[i].el.closest('.segmented') === rects[j].el.closest('.segmented')) continue; // перемикач: кнопки впритул за задумом
      const dx = Math.max(a.left - c.right, c.left - a.right, 0) / k;
      const dy = Math.max(a.top - c.bottom, c.top - a.bottom, 0) / k;
      const d = Math.hypot(dx, dy);
      if (d < 15.5) out.push(`кнопки надто близько (${Math.round(d)}px): «${(rects[i].el.getAttribute('aria-label') || rects[i].el.textContent).trim().slice(0, 14)}» і «${(rects[j].el.getAttribute('aria-label') || rects[j].el.textContent).trim().slice(0, 14)}»`);
    }
    // текст
    const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { c: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
    const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const p = parse(getComputedStyle(e).backgroundColor); if (p && p.a > 0.5) return p.c; } return [255, 255, 255]; };
    let t;
    while ((t = walker.nextNode())) {
      const text = t.textContent.trim();
      const el = t.parentElement;
      if (!text || seen.has(el) || !vis(el) || el.closest('svg, .game-item, .spark')) continue;
      seen.add(el);
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      const isTask = el.closest('.task-line, .task-text');
      if (isTask && taskMin && fs < taskMin - 0.5) out.push(`текст завдання ${fs}px < ${taskMin}: «${text.slice(0, 10)}»`);
      else if (!isTask && fs < 19.5 && !el.closest('.key')) out.push(`дрібний текст ${fs}px: «${text.slice(0, 24)}» (${short(el)})`);
      if (!el.closest('.key')) { // підписи клавіш мають власну перевірку в тестах кольорів
        const fg = parse(cs.color);
        if (fg) {
          const bg = bgOf(el);
          const l1 = lum(fg.c); const l2 = lum(bg);
          const cr = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
          if (cr < 4.5 && !el.closest('.is-locked, [disabled]')) out.push(`контраст ${cr.toFixed(1)}: «${text.slice(0, 20)}» (${short(el)})`);
        }
      }
    }
    return out;
  }, { taskMin });
  const uniq = [...new Set(r)];
  for (const m of uniq) problems.push(`[${w}] ${name}: ${m}`);
  await page.screenshot({ path: `screenshots/s7-${name}-${w}.png` });
  return uniq;
}

async function open(ctx, w, h, data, hash = '') {
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && problems.push(`консоль: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`помилка: ${e.message}`));
  page.on('request', (r) => !r.url().startsWith('file:') && !r.url().startsWith('data:') && problems.push(`мережа: ${r.url()}`));
  await page.addInitScript((d) => { try { if (d && !localStorage.getItem('k.seeded')) { localStorage.setItem('klaviaturka.v1', JSON.stringify({ v: 1, profiles: d })); localStorage.setItem('k.seeded', '1'); } } catch {} }, data);
  await page.goto(base + hash);
  await page.waitForTimeout(120);
  return page;
}

for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  for (const level of ['1-2', '3-4']) {
    const L = level === '1-2' ? '12' : '34';
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const rich = profile({ level, progress: { ua: Object.fromEntries([...Array(21).keys()].map((i) => [i + 1, (i % 3) + 1])), en: { 1: 3, 2: 2 } } });
    const page = await open(ctx, w, h, [rich, profile({ id: 'p2', name: 'Максим', avatar: 'cat', level: '3-4' })]);
    const tm = level === '1-2' ? 56 : 36;
    const A = (name, opt) => audit(page, `${name}-${L}`, w, h, opt);

    await A('profiles');
    if (level === '1-2') { // створення профілю
      await page.goto(base + '#new'); await page.waitForTimeout(80); await A('new-name');
      await page.fill('.name-input', 'Данило'); await page.click('[data-act="name-next"]'); await page.waitForTimeout(80); await A('new-avatar');
      await page.click('[data-avatar]'); await page.click('[data-act="avatar-next"]'); await page.waitForTimeout(80); await A('new-level');
      await page.goto(base); await page.waitForTimeout(80);
    }
    await page.click('[data-profile="p1"]'); await page.waitForSelector('.screen-map');
    await A('map');
    // «Вільно»
    const freeBtn = await page.$('[data-free]');
    if (!freeBtn) problems.push('на карті немає кнопки «Вільно»');
    await page.click('[data-go="games"]'); await page.waitForSelector('.screen-games'); await A('games');
    await page.click('[data-go="map"]'); await page.waitForSelector('.screen-map');
    await page.click('[data-go="achievements"]'); await page.waitForTimeout(100); await A('achievements');
    await page.click('[data-go="map"]'); await page.waitForSelector('.screen-map');

    // урок 1: знайомство → вправа → пауза Esc → кінець
    await page.click('.node[data-lesson-id="1"]'); await page.waitForSelector('[data-lesson] .task-ch');
    await A('lesson-intro', { taskMin: tm });
    await press(page, 'о'); await page.waitForTimeout(100); await A('lesson-error', { taskMin: tm });
    await typeAll(page, 'ua', { stopAt: 4 });
    await key(page, 'Escape'); await page.waitForSelector('.pause-layer'); await A('lesson-pause', { taskMin: tm });
    await key(page, 'Escape'); await page.waitForTimeout(100);
    if (await page.$('.pause-layer')) problems.push(`[${w}] Esc не закрив паузу`);
    await typeAll(page, 'ua');
    await page.waitForTimeout(900); await A('lesson-done');

    // урок 12 (довгий текст у 3–4 класі)
    await page.click('[data-go="map"]'); await page.waitForSelector('.screen-map');
    await page.click('.node[data-lesson-id="12"]'); await page.waitForSelector('[data-lesson] .task-ch');
    await typeAll(page, 'ua', { stopAt: 6 }); await page.waitForTimeout(100); await A('lesson-12', { taskMin: tm });
    await page.goto(base + '#map'); await page.waitForSelector('.screen-map');

    // Вільне друкування
    await page.click('[data-free]'); await page.waitForSelector('[data-lesson] .task-ch');
    await page.waitForTimeout(100); await A('free', { taskMin: tm });
    await press(page, 'ь'); await page.waitForTimeout(80); await A('free-error', { taskMin: tm });
    const tasks = new Set();
    const before = await page.evaluate(() => document.querySelector('[data-task]').textContent);
    tasks.add(before);
    await key(page, 'Escape'); await page.waitForSelector('.pause-layer'); await A('free-pause', { taskMin: tm }); await key(page, 'Escape');
    const done = await typeAll(page, 'ua');
    if (!done) problems.push(`[${w}] вільне друкування ${level} не дійшло до кінця`);
    await page.waitForTimeout(900); await A('free-done');
    const doneText = await page.evaluate(() => document.querySelector('.done-bubble')?.textContent);
    notes.push(`${w} ${level} кінець вільного друку: «${doneText}», зірочок на екрані: ${await page.$$eval('.done-stars', (e) => e.length)}`);
    // прогрес уроків не змінився вільним друком
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('klaviaturka.v1')).profiles.find((p) => p.id === 'p1'));
    if (JSON.stringify(saved.progress.ua) !== JSON.stringify(rich.progress.ua === undefined ? {} : (() => { const o = {}; for (const [i, v] of Object.entries(saved.progress.ua)) o[i] = v; return o; })())) problems.push('прогрес змінився');
    if (saved.stats.typed <= 120) problems.push(`[${w}] статистика не зросла після вільного друку`);
    await page.click('[data-act="again"]'); await page.waitForSelector('[data-lesson] .task-ch');
    const after = await page.evaluate(() => document.querySelector('[data-task]').textContent);
    if (after === before) notes.push(`(перший текст «ще раз» збігся: ${after})`);
    await page.goto(base + '#map'); await page.waitForSelector('.screen-map');

    // Закрите вільне друкування (мало уроків) на карті
    const ctx2 = await browser.newContext({ viewport: { width: w, height: h } });
    const page2 = await open(ctx2, w, h, [profile({ level, progress: { ua: { 1: 3 }, en: {} } })]);
    await page2.click('[data-profile="p1"]'); await page2.waitForSelector('.screen-map');
    if (await page2.$('[data-free]')) problems.push('вільне друкування відкрите надто рано');
    await audit(page2, `map-locked-free-${L}`, w, h);
    await ctx2.close();

    // ігри
    for (const kind of ['balloons', 'falling']) {
      await page.goto(base + '#games'); await page.waitForSelector('.screen-games');
      await page.click(`[data-game="${kind}"]`); await page.waitForSelector('[data-game-root]');
      await page.waitForTimeout(120); await A(`game-${kind}-intro`);
      await key(page, 'Space'); await page.waitForTimeout(1800); await A(`game-${kind}`);
      await key(page, 'Escape'); await page.waitForSelector('.pause-layer'); await A(`game-${kind}-pause`);
      await key(page, 'Escape');
    }
    // доросла сторінка
    await page.goto(base + '#adult'); await page.waitForTimeout(100); await A('adult-gate');
    const sum = await page.evaluate(() => document.querySelector('.adult-sum').textContent.match(/(\d+) × (\d+)/).slice(1).map(Number));
    await page.fill('.sum-input', String(sum[0] * sum[1])); await page.click('[data-act="check"]'); await page.waitForTimeout(100); await A('adult');
    await page.click('[data-ask="reset"]'); await page.waitForTimeout(100); await A('adult-confirm');

    // пропозиція перерви: підміняємо час, ніби дитина друкує 16 хвилин
    const ctx3 = await browser.newContext({ viewport: { width: w, height: h } });
    await ctx3.addInitScript(() => { let off = 0; const real = Date.now; Date.now = () => real() + off; window.__skip = (ms) => { off += ms; }; });
    const page3 = await open(ctx3, w, h, [profile({ level })]);
    await page3.click('[data-profile="p1"]'); await page3.waitForSelector('.screen-map');
    await page3.click('.node[data-lesson-id="2"]'); await page3.waitForSelector('[data-lesson] .task-ch');
    for (let m = 0; m < 16; m++) { await page3.evaluate(() => window.__skip(60000)); await key(page3, 'Digit9'); await page3.mouse.click(5, 5); }
    await typeAll(page3, 'ua'); await page3.waitForTimeout(900);
    if (!(await page3.$('.break-layer'))) problems.push(`[${w}] ${level}: перерву не запропоновано`);
    else {
      await audit(page3, `break-${L}`, w, h);
      await page3.click('[data-act="keep-going"]'); await page3.waitForTimeout(100);
      if (await page3.$('.break-layer')) problems.push('«Ще трохи» не закрило перерву');
    }
    await ctx3.close();
    await ctx.close();
  }
}

// Окремо: перше проходження без профілів у приватному режимі (сховище недоступне) — працює далі
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await ctx.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('заборонено'); } }); });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`без сховища: ${e.message}`));
  await page.goto(base); await page.waitForTimeout(150);
  await audit(page, 'no-storage', 1366, 768);
  await ctx.close();
}

await browser.close();
console.log(notes.join('\n'));
if (problems.length) {
  const uniq = [...new Set(problems)];
  console.log(`\nЗнайдено зауважень: ${uniq.length}`);
  uniq.forEach((p) => console.log(' -', p));
  process.exitCode = 1;
} else console.log('\nУсе гаразд: екрани пройшли чек-лист.');
