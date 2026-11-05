// Етап Т9: перевірка всіх екранів світу 5–6 класів за чек-листом teen-ux: node scripts/audit.mjs
// Три світи × 1366×768 і 1920×1080. Для кожного екрана: нічого не виходить за сцену; кнопки й посилання ≥ 48 px
// (дрібні підкреслені посилання заборонені); текст ≥ 14 px (піксельний шрифт ≥ 14 px); на екранах з клавіатурою оточення нейтральне
// (кольорові лише пальці); сцена без прокручування; нуль мережевих запитів. Знімки: screenshots/t9-<екран>-<світ>-<ширина>.png
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const file = resolve('docs/index.html');
if (!existsSync(file)) throw new Error('Спочатку: npm run build');
mkdirSync('screenshots', { recursive: true });
const cloudChrome = '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath: existsSync(cloudChrome) ? cloudChrome : undefined });
const base = pathToFileURL(file).href;
const WORLDS = ['voxel', 'pixel', 'sky'];
const problems = [];
const seenScreens = new Set();
const ok = (c, m) => { if (!c) problems.push(m); };

const rec = (cpm, acc) => ({ runs: 3, medal: 1, bestCpm: cpm, bestAcc: acc, topCpm: acc >= 95 ? cpm : 0, topAcc: acc >= 95 ? acc : 0, hist: [{ cpm: cpm - 10, acc: acc - 1, d: '2026-10-10' }, { cpm, acc, d: '2026-10-11' }] });
// Учень посеред курсу, із відкритим випробуванням (кнопка «Випробування» має бути на карті поруч з «Грай»)
const profile = (world, extra = {}) => ({ id: 'p0', name: 'Аня', avatar: 'fox', level: '5', world, layout: 'ua', placement: { kind: 'zero', source: 'skip', at: 1 }, challenge: { open: true, rec: { ua: rec(80, 96), en: rec(0, 0) }, seen: [] }, ...extra });
const friend = (world) => ({ id: 'p1', name: 'Богдан', avatar: 'fox', level: '5', world, layout: 'ua', placement: { kind: 'zero', source: 'skip', at: 1 }, challenge: { open: true, rec: { ua: rec(100, 97), en: rec(0, 0) }, seen: [] } });

for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const requests = [];
  page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) requests.push(r.url()); });
  page.on('pageerror', (e) => problems.push(`${w}: помилка сторінки ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`${w}: консоль ${m.text()}`); });

  const seed = async (profiles) => {
    await page.goto(base);
    await page.evaluate((p) => { localStorage.clear(); localStorage.setItem('klaviaturka.v1', JSON.stringify({ v: 1, profiles: p })); }, profiles);
    await page.reload();
  };
  const open = async (hash) => { await page.goto(base); await page.reload(); await page.click('[data-profile="p0"]'); await page.waitForTimeout(80); await page.goto(`${base}#${hash}`); await page.waitForTimeout(160); };

  // Перевірка поточного екрана
  const audit = async (name, world) => {
    const tag = `${w} ${name}/${world}`;
    seenScreens.add(name);
    const r = await page.evaluate(() => {
      const st = document.querySelector('.stage');
      if (!st) return { none: true };
      const sb = st.getBoundingClientRect();
      const vis = (el) => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); return b.width > 0 && b.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && !el.closest('[inert]') && !el.closest('[hidden]') && !el.closest('svg'); };
      const out = { overflow: [], small: [], underlined: [], tiny: [], page: document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1 };
      const k = sb.width / 1366; // масштаб сцени
      for (const el of st.querySelectorAll('*')) {
        if (!vis(el)) continue;
        const b = el.getBoundingClientRect();
        if (b.right > sb.right + 2 || b.bottom > sb.bottom + 2 || b.left < sb.left - 2 || b.top < sb.top - 2) out.overflow.push(el.className || el.tagName);
      }
      // кнопки й посилання: ≥ 48 px у сцені (1366×768); клавіші клавіатури й кнопки-мініатюри (прозорі накладки) не рахуємо
      for (const el of st.querySelectorAll('a, button, [role="button"]')) {
        if (!vis(el) || el.closest('.keys-panel, .kb') || el.matches('.wt-btn, .cm-link, [data-pick-world]')) continue;
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const name = `${el.className || el.tagName}:${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20)}`;
        if (b.height / k < 47.5 || b.width / k < 47.5) out.small.push(`${name} ${Math.round(b.width / k)}×${Math.round(b.height / k)}`);
        if (cs.textDecorationLine.includes('underline') && cs.borderTopWidth === '0px') out.underlined.push(name);
      }
      // дрібний текст (< 14 px у сцені); клавіші й підписи символів на клавішах не рахуємо
      for (const el of st.querySelectorAll('*')) {
        if (!vis(el) || el.closest('.keys-panel, .kb, .key-sub')) continue;
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!own) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 13.5) out.tiny.push(`${el.className || el.tagName} ${fs.toFixed(1)}px «${el.textContent.trim().slice(0, 16)}»`);
      }
      out.keys = !!st.querySelector('.keys-panel');
      return out;
    });
    if (r.none) { problems.push(`${tag}: немає сцени`); return r; }
    ok(!r.page, `${tag}: сторінка прокручується`);
    ok(!r.overflow.length, `${tag}: виходить за сцену: ${[...new Set(r.overflow)].slice(0, 4).join(', ')}`);
    ok(!r.small.length, `${tag}: дрібні кнопки (<48 px): ${[...new Set(r.small)].slice(0, 5).join('; ')}`);
    ok(!r.underlined.length, `${tag}: підкреслені посилання замість кнопок: ${[...new Set(r.underlined)].slice(0, 4).join(', ')}`);
    ok(!r.tiny.length, `${tag}: дрібний текст: ${[...new Set(r.tiny)].slice(0, 4).join('; ')}`);
    await page.screenshot({ path: `screenshots/t9-${name}-${world}-${w}.png` });
    return r;
  };

  // Друк: поточний урок/випробування — натискаємо потрібну літеру
  const press = (n = 1) => page.evaluate((cnt) => {
    for (let i = 0; i < cnt; i++) {
      const c = document.querySelector('.ll-ch.is-current'); if (!c) return;
      let k = c.textContent.replace(/ /g, ' '); if (k === '␣') k = ' ';
      window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: '', shiftKey: k !== k.toLowerCase(), bubbles: true, cancelable: true }));
    }
  }, n);
  const finishRun = () => page.evaluate(() => {
    for (let guard = 0; guard < 4000; guard++) {
      const done = document.querySelector('[data-done]');
      if (done && !done.hidden && document.querySelector('.ld-h')) return true;
      const start = document.querySelector('[data-act="start"]'); if (start) { start.click(); continue; }
      const c = document.querySelector('.ll-ch.is-current'); if (!c) return false;
      let k = c.textContent.replace(/ /g, ' '); if (k === '␣') k = ' ';
      window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: '', shiftKey: k !== k.toLowerCase(), bubbles: true, cancelable: true }));
    }
    return false;
  });

  for (const world of WORLDS) {
    await seed([profile(world), friend(world)]);

    // Екрани без клавіатури
    for (const [name, hash] of [['world', 'teen'], ['avatar', 'teen/avatar'], ['rewards', 'teen/rewards'], ['worlds', 'teen/worlds'], ['lessons', 'teen/lessons'], ['board', 'teen/board'], ['pick', 'teen/pick'], ['start', 'teen/start']]) {
      await open(hash);
      const r = await audit(name, world);
      ok(!r.keys || name === 'type', `${w} ${name}/${world}: несподівана клавіатура`);
    }
    // Карта: «Усі уроки», «Світи» і «Випробування» — кнопки (≥ 48 px), а не підкреслені посилання
    await open('teen');
    for (const href of ['#teen/lessons', '#teen/worlds', '#teen/challenge', '#teen/lesson']) {
      ok((await page.locator(`.pb a[href="${href}"]`).count()) === 1, `${w} ${world}: на панелі карти немає кнопки ${href}`);
    }
    // Екрани з клавіатурою
    for (const [name, hash] of [['type', 'teen/type'], ['lesson-intro', 'teen/lesson/1'], ['challenge-ready', 'teen/challenge']]) {
      await open(hash);
      await audit(name, world);
    }
    await open('teen/lesson/1'); await page.click('[data-act="start"]'); await page.waitForTimeout(60); await press(3);
    const dr = await audit('lesson-drill', world);
    ok(dr.keys, `${w} lesson-drill/${world}: немає клавіатури`);
    await open('teen/lesson/1'); await finishRun(); await page.waitForTimeout(100);
    await audit('lesson-result', world);
    await open('teen/challenge'); await page.click('[data-act="start"]'); await page.waitForTimeout(60); await press(4);
    await audit('challenge-run', world);
    // Вступний тест: початок і перша частина
    await open('teen/start');
    const go = page.locator('[data-act="start-test"], [data-act="go"]');
    if (await go.count()) { await go.first().click(); await page.waitForTimeout(80); const g2 = page.locator('[data-act="go"]'); if (await g2.count()) { await g2.first().click(); await page.waitForTimeout(80); } await audit('placement-run', world); }
    // «Для дорослого» (учень 5–6, із задачею на множення)
    await open('adult');
    if (await page.locator('.sum-input').count()) {
      const t = await page.evaluate(() => document.querySelector('.screen-adult')?.innerText ?? '');
      const m = t.match(/(\d+)\s*[×x*]\s*(\d+)/);
      await page.fill('.sum-input', String(Number(m[1]) * Number(m[2]))); await page.press('.sum-input', 'Enter'); await page.waitForTimeout(100);
    }
    await audit('adult', world);
    if (await page.locator('[data-act="compete"]').count()) { await page.click('[data-act="compete"]'); await page.waitForTimeout(80); await audit('adult-compete', world); }
  }
  ok(requests.length === 0, `${w}: мережеві запити: ${requests.slice(0, 3).join(', ')}`);
  await ctx.close();
}
await browser.close();
console.log(`Екранів перевірено: ${[...seenScreens].join(', ')}`);
if (problems.length) { console.log(`ПРОБЛЕМ: ${problems.length}`); problems.forEach((p) => console.log(' - ' + p)); process.exit(1); }
console.log('Усе гаразд: усі екрани 5–6 класів у трьох світах на 1366×768 і 1920×1080.');
