// Етап Т3: швидкий курс 5–6 класів наскрізь у кожному світі: node scripts/lessons.mjs
// Проходить усі уроки обох мов, перевіряє розміщення (з нуля / швидка перевірка / досвідчений / перехід з 3–4), провал без запису, знімки.
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
const ok = (c, m) => { if (!c) problems.push(m); };

const profileFor = (i, extra = {}) => ({ id: `p${i}`, name: `Учень${i}`, avatar: 'fox', level: '5', world: WORLDS[i % 3], layout: 'ua', placement: { kind: 'zero', source: 'skip', at: 1 }, ...extra });

for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const requests = [];
  page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) requests.push(r.url()); });
  page.on('pageerror', (e) => problems.push(`${w}: помилка сторінки ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`${w}: консоль ${m.text()}`); });
  const shot = (name) => page.screenshot({ path: `screenshots/t3-${name}-${w}.png` });
  const store = () => page.evaluate(() => JSON.parse(localStorage.getItem('klaviaturka.v1') ?? '{"profiles":[]}').profiles);
  const seed = async (profiles) => { await page.goto(base); await page.evaluate((p) => localStorage.setItem('klaviaturka.v1', JSON.stringify({ v: 1, profiles: p })), profiles); await page.reload(); };
  const open = async (i, hash = 'teen') => { await page.goto(base); await page.reload(); await page.click(`[data-profile="p${i}"]`); await page.waitForTimeout(80); await page.goto(`${base}#${hash}`); await page.waitForTimeout(150); };
  const overflow = () => page.evaluate(() => {
    const st = document.querySelector('.stage')?.getBoundingClientRect(); if (!st) return 'немає сцени';
    const k = st.width / 1366;
    const bad = [...document.querySelectorAll('.stage *')].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && getComputedStyle(el).display !== 'none' && !el.closest('svg') && !el.closest('.cm-scale') && !el.closest('.wt-scale') && !el.closest('.cm-num') && (b.right > st.right + 2 || b.bottom > st.bottom + 2 || b.left < st.left - 2 || b.top < st.top - 2); }).map((el) => el.className || el.tagName).slice(0, 4).join(', ');
    // текст вправи й підсумок вміщаються в картці завдання
    const card = document.querySelector('.stage > .screen > [class$="-task"]')?.getBoundingClientRect();
    const lines = document.querySelector('[data-lines]')?.getBoundingClientRect();
    const ld = document.querySelector('[data-ld]')?.getBoundingClientRect();
    const out = [];
    if (card && lines && lines.bottom > card.bottom + 1) out.push('текст вправи виходить за картку');
    if (card && ld && ld.height > 0 && (ld.bottom > card.bottom + 1 || ld.top < card.top - 1)) out.push('підсумок не вміщається в картці');
    void k;
    return [bad, ...out].filter(Boolean).join('; ');
  });
  const check = async (name) => { const o = await overflow(); if (o) problems.push(`${w} ${name}: ${o}`); };

  // Грає поточний урок «пальцями»: err — скільки разів помилитись (навмисна клавіша «ъ»), stop — зупинитись, коли з'явиться підсумок
  const play = (err = 0) => page.evaluate((errTotal) => {
    let errs = 0;
    for (let guard = 0; guard < 4000; guard++) {
      const done = document.querySelector('[data-done]');
      if (done && !done.hidden && document.querySelector('.ld-h') && !document.querySelector('.li')) return { errs };
      const start = document.querySelector('[data-act="start"]');
      if (start) { start.click(); continue; }
      const c = document.querySelector('.ll-ch.is-current');
      if (!c) return { errs, noCursor: true };
      let k = c.textContent.replace(/ /g, ' ');
      if (k === '␣') k = ' ';
      if (errs < errTotal && guard % 3 === 0) { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ъ', code: 'BracketRight', bubbles: true, cancelable: true })); errs += 1; continue; }
      window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: '', shiftKey: k !== k.toLowerCase(), bubbles: true, cancelable: true }));
    }
    return { errs, stuck: true };
  }, err);

  // ---------- 1. Усі уроки в кожному світі, обидві мови ----------
  await seed([0, 1, 2].map((i) => profileFor(i)));
  for (let i = 0; i < 3; i++) {
    const world = WORLDS[i];
    for (const [layout, count] of [['ua', 8], ['en', 7]]) {
      await page.goto(base); await page.reload();
      await page.evaluate(([id, l]) => { const d = JSON.parse(localStorage.getItem('klaviaturka.v1')); d.profiles[id].layout = l; localStorage.setItem('klaviaturka.v1', JSON.stringify(d)); }, [i, layout]);
      await page.reload();
      await open(i, 'teen');
      if (layout === 'ua') { await shot(`${world}-world`); await check(`${world}/world`); }
      for (let n = 1; n <= count; n++) {
        await page.goto(`${base}#teen/lesson/${n}`); await page.waitForSelector('[data-lines]'); await page.waitForTimeout(60);
        if (n === 1 && layout === 'ua') { await shot(`${world}-intro`); await check(`${world}/intro`); }
        const hasIntro = (await page.locator('.li').count()) === 1;
        ok(hasIntro === !(layout === 'ua' && n === 7), `${world} ${layout} ${n}: знайомство ${hasIntro ? 'є' : 'немає'}, а має бути навпаки`); // лише урок «усі літери» без знайомства
        if (hasIntro) await page.click('[data-act="start"]');
        if (n === 4 && layout === 'ua') { // посередині вправи: кілька правильних і одна помилка
          await page.evaluate(() => { for (let i = 0; i < 4; i++) { const c = document.querySelector('.ll-ch.is-current'); window.dispatchEvent(new KeyboardEvent('keydown', { key: c.textContent === '␣' ? ' ' : c.textContent, bubbles: true, cancelable: true })); } window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ъ', code: 'BracketRight', bubbles: true, cancelable: true })); });
          await shot(`${world}-drill`); await check(`${world}/drill`);
        }
        const r = await play(0);
        ok(!r.stuck && !r.noCursor, `${world} ${layout} ${n}: урок не дійшов до підсумку`);
        if (n === 1 && layout === 'ua') { await shot(`${world}-result`); await check(`${world}/result`); }
        const acc = await page.evaluate(() => document.querySelector('.ld-chips b')?.textContent);
        ok(acc === '100%' || (n === 4 && layout === 'ua' && parseInt(acc) >= 98), `${world} ${layout} ${n}: точність ${acc}; ${JSON.stringify(r)}; ${await page.evaluate(() => document.querySelector('.stage').innerText.replace(/\s+/g, ' ').slice(0, 200))}`);
      }
      const done = (await store())[i].teen[layout];
      ok(Object.keys(done).length === count && Object.values(done).every((x) => x.stars === 3), `${world} ${layout}: не всі уроки записано (${JSON.stringify(done)})`);
      await page.goto(`${base}#teen`); await page.waitForTimeout(100);
      ok((await page.locator('.pb-go').count()) === 0, `${world} ${layout}: після курсу немає лишитись кнопки «Грай»`);
      await shot(`${world}-${layout}-course-done`);
    }
    await open(i, 'teen/lessons'); await shot(`${world}-lessons`); await check(`${world}/lessons`);
  }
  ok((await store()).every((p) => p.stats.typed > 500), 'статистику друку не збережено');

  // ---------- 2. Провал: менше 90% — не зараховується; потім успіх ----------
  await seed([profileFor(0)]);
  await open(0, 'teen/lesson'); await page.click('[data-act="start"]');
  await play(60);
  ok((await page.locator('.ld-h').innerText()).includes('Ще трохи'), 'при великій кількості помилок немає підказки «Ще раз»');
  ok(Object.keys((await store())[0].teen.ua).length === 0, 'провалений урок записано');
  ok((await page.locator('[data-act="again"]').count()) === 1, 'немає «Ще раз»');
  await shot('fail'); await check('fail');
  await page.click('[data-act="again"]'); await page.waitForSelector('[data-act="start"]');
  await page.click('[data-act="start"]'); await play(0);
  ok(Object.keys((await store())[0].teen.ua).join() === '1', 'після успіху урок не записано');

  // ---------- 3. Розміщення ----------
  // 3а. «Досвідчений»: літерні уроки зараховані, поточний — великі літери
  await seed([profileFor(0, { placement: { kind: 'pro', source: 'test', at: 1 } })]);
  await open(0, 'teen/lessons');
  const states = await page.$$eval('.lg-card', (c) => c.map((x) => x.className.match(/is-(\w+)/)[1]));
  ok(states.join() === 'credited,credited,credited,credited,credited,credited,credited,current', `pro: стани уроків ${states.join()}`);
  // 3б. «Середній»: швидка перевірка — без знайомства, одна вправа; успіх → зараховано, невдача → повний урок
  await seed([profileFor(0, { placement: { kind: 'mid', source: 'test', at: 1 } })]);
  await open(0, 'teen/lesson');
  ok((await page.locator('.li').count()) === 0, 'швидка перевірка має починатись без знайомства');
  await shot('quick');
  await play(0);
  ok((await page.locator('.ld-h').innerText()).includes('Зараховано'), 'швидка перевірка без помилок має зарахуватись');
  ok((await store())[0].teen.ua[1]?.by === 'quick', 'швидкий запис не позначено');
  await open(0, 'teen/lesson'); // тепер урок 2
  const bad = await page.evaluate(() => {
    let errs = 0; // багато помилок на швидкій перевірці
    for (let g = 0; g < 4000; g++) {
      if (document.querySelector('.li') || (document.querySelector('[data-done]') && !document.querySelector('[data-done]').hidden)) return { falls: !!document.querySelector('.li'), errs };
      const c = document.querySelector('.ll-ch.is-current'); if (!c) break;
      if (g % 2 === 0 && errs < 40) { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ъ', code: 'BracketRight', bubbles: true, cancelable: true })); errs += 1; continue; }
      let k = c.textContent.replace(/ /g, ' '); if (k === '␣') k = ' ';
      window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    }
    return { falls: false, errs };
  });
  ok(bad.falls, 'після невдалої швидкої перевірки не почався повний урок');
  // 3в. Перехід із 3–4 класу: зараховано те, що вивчено
  await seed([profileFor(0, { level: '5', progress: { ua: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 }, en: {} }, placement: { kind: 'carry', source: 'carry', at: 1, learned: { ua: [...'аовлідфж'], en: [] } } })]);
  await open(0, 'teen/lessons');
  const carry = await page.$$eval('.lg-card', (c) => c.map((x) => x.className.match(/is-(\w+)/)[1]));
  ok(carry.slice(0, 2).join() === 'credited,locked' || carry.join().startsWith('credited,current'), `carry: стани ${carry.join()}`);

  ok(requests.length === 0, `${w}: мережеві запити: ${requests.join(', ')}`);
  await ctx.close();
}
await browser.close();
console.log(problems.length ? 'ПРОБЛЕМИ:\n' + problems.join('\n') : 'Етап Т3: усе гаразд, знімки в screenshots/t3-*');
process.exitCode = problems.length ? 1 : 0;
