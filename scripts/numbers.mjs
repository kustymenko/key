// Етап Т5: уроки цифр і символів наскрізь у кожному світі: node scripts/numbers.mjs
// Перевіряє: проходження 6 нових уроків (УКР) і 6 (ENG) у трьох світах, підсвітку цифр і Shift (обидві руки), цифровий блок,
// «Shift + цифра» не тієї мови (підказка, не помилка), карту світів, вміщення на екрані, нуль мережевих запитів.
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
const FIRST = { ua: 19, en: 16 }; // перший урок цифр
const LAST = { ua: 24, en: 21 };
const PRE = { ua: 18, en: 15 }; // уроків до Етапу Т5
const problems = [];
const ok = (c, m) => { if (!c) problems.push(m); };

const doneUpTo = (layout, n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, { stars: 3, acc: 99, cpm: 100, by: 'lesson' }]));
const profileFor = (i, layout = 'ua', extra = {}) => ({
  id: `p${i}`, name: `Учень${i}`, avatar: 'fox', level: i % 2 ? '6' : '5', world: WORLDS[i % 3], layout,
  placement: { kind: 'zero', source: 'skip', at: 1 }, teen: { ua: doneUpTo('ua', 18), en: doneUpTo('en', 15) }, ...extra,
});

for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const requests = [];
  page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) requests.push(r.url()); });
  page.on('pageerror', (e) => problems.push(`${w}: помилка сторінки ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`${w}: консоль ${m.text()}`); });
  const shot = (name) => page.screenshot({ path: `screenshots/t5-${name}-${w}.png` });
  const store = () => page.evaluate(() => JSON.parse(localStorage.getItem('klaviaturka.v1') ?? '{"profiles":[]}').profiles);
  const seed = async (profiles) => { await page.goto(base); await page.evaluate((p) => { localStorage.clear(); localStorage.setItem('klaviaturka.v1', JSON.stringify({ v: 1, profiles: p })); }, profiles); await page.reload(); };
  const open = async (i, hash) => { await page.goto(base); await page.reload(); await page.click(`[data-profile="p${i}"]`); await page.waitForTimeout(80); await page.goto(`${base}#${hash}`); await page.waitForTimeout(150); };
  const overflow = () => page.evaluate(() => {
    const st = document.querySelector('.stage')?.getBoundingClientRect(); if (!st) return 'немає сцени';
    const bad = [...document.querySelectorAll('.stage *')].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && getComputedStyle(el).display !== 'none' && !el.closest('svg') && !el.closest('.cm-scale') && !el.closest('.wt-scale') && !el.closest('.cm-num') && (b.right > st.right + 2 || b.bottom > st.bottom + 2 || b.left < st.left - 2 || b.top < st.top - 2); }).map((el) => el.className || el.tagName).slice(0, 4).join(', ');
    const card = document.querySelector('.stage > .screen > [class$="-task"]')?.getBoundingClientRect();
    const lines = document.querySelector('[data-lines]')?.getBoundingClientRect();
    const ld = document.querySelector('[data-ld]')?.getBoundingClientRect();
    const panel = document.querySelector('.keys-panel')?.getBoundingClientRect();
    const out = [];
    if (card && lines && lines.bottom > card.bottom + 1) out.push('текст вправи виходить за картку');
    if (card && ld && ld.height > 0 && (ld.bottom > card.bottom + 1 || ld.top < card.top - 1)) out.push('підсумок не вміщається в картці');
    if (card && panel && panel.top < card.bottom - 1) out.push('клавіатура заходить на картку завдання');
    if (panel && panel.bottom > st.bottom - 2) out.push('клавіатура виходить за нижній край');
    // підписи Shift-символів не мають вилазити за свою клавішу
    const subs = [...document.querySelectorAll('.key-sub')].filter((s) => { const k = s.parentElement.getBoundingClientRect(); const b = s.getBoundingClientRect(); return b.right > k.right + 1 || b.top < k.top - 1; });
    if (subs.length) out.push('підпис символу виходить за клавішу');
    return [bad, ...out].filter(Boolean).join('; ');
  });
  const check = async (name) => { const o = await overflow(); if (o) problems.push(`${w} ${name}: ${o}`); };

  // Друкує урок «пальцями». Апостроф по черзі в трьох виглядах; Ґ — як AltGr (ctrl+alt, Windows); ↵ — Enter.
  // errAt — після скількох знаків навмисно натиснути «ъ» (одна помилка); stopAt — зупинитись після стількох знаків

  // Друкує урок «пальцями»: символ береться з тексту на екрані; цифри — з основного ряду
  const play = (opts = {}) => page.evaluate((o) => {
    let n = 0, fired = false;
    const press = (init) => window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
    for (let guard = 0; guard < 6000; guard++) {
      const done = document.querySelector('[data-done]');
      if (done && !done.hidden && document.querySelector('.ld-h') && !document.querySelector('.li')) return { typed: n };
      const start = document.querySelector('[data-act="start"]');
      if (start) { start.click(); continue; }
      const c = document.querySelector('.ll-ch.is-current');
      if (!c) return { typed: n, noCursor: true };
      let k = c.textContent.replace(/ /g, ' ');
      if (k === '␣') k = ' ';
      if (o.errAt != null && !fired && n >= o.errAt) { fired = true; press({ key: 'ъ', code: 'BracketRight' }); continue; }
      if (o.stopAt != null && n >= o.stopAt) return { typed: n, stopped: true };
      press({ key: k, code: /^\d$/.test(k) ? `Digit${k}` : '', shiftKey: k !== k.toLowerCase() });
      n += 1;
    }
    return { typed: n, stuck: true };
  }, opts);
  const litKeys = () => page.$$eval('.key.is-next', (k) => k.map((x) => x.dataset.code));
  const activeFingers = () => page.$$eval('.hands .finger.is-active', (f) => f.map((x) => [...x.classList].find((c) => /^f-[lr]/.test(c))));

  // ---------- 1. Усі нові уроки в кожному світі, обидві мови ----------
  await seed([0, 1, 2].map((i) => profileFor(i)));
  for (let i = 0; i < 3; i++) {
    const world = WORLDS[i];
    for (const layout of ['ua', 'en']) {
      await page.goto(base); await page.reload();
      await page.evaluate(([id, l]) => { const d = JSON.parse(localStorage.getItem('klaviaturka.v1')); d.profiles[id].layout = l; localStorage.setItem('klaviaturka.v1', JSON.stringify(d)); }, [i, layout]);
      await page.reload();
      await open(i, 'teen');
      // карта: після знаків відкрито «Цифровий ліс»
      const names = await page.locator('body').innerText();
      if (world !== 'voxel') ok(/Цифровий ліс/.test(names), `${world} ${layout}: на карті немає «Цифрового лісу»`); // кубічна карта показує лише номери: 5-й вузол — «Цифровий ліс»
      await shot(`${world}-${layout}-world`); await check(`${world}/${layout}/world`);
      for (let n = FIRST[layout]; n <= LAST[layout]; n++) {
        await page.goto(`${base}#teen/lesson/${n}`); await page.waitForSelector('[data-lines]'); await page.waitForTimeout(80);
        const where = `${world} ${layout} ${n}`;
        ok((await page.locator('.keys-panel.has-numrow').count()) === 1, `${where}: немає клавіатури з рядом цифр`);
        for (const d of '1234567890') ok((await page.locator(`.key[data-code="Digit${d}"]`).count()) === 1, `${where}: немає клавіші ${d}`);
        const hasIntro = (await page.locator('.li').count()) === 1;
        const noIntro = [FIRST[layout] + 2, FIRST[layout] + 5]; // «числа, дати» і «усе разом» — нових клавіш немає
        ok(hasIntro === !noIntro.includes(n), `${where}: знайомство ${hasIntro ? 'є' : 'немає'}, а має бути навпаки`);
        const intro = hasIntro ? await page.locator('.li').innerText() : '';
        await shot(`${world}-${layout}-${n}-intro`); await check(`${where}/intro`);
        const lit = await litKeys();
        if (layout === 'ua' && n === 19) {
          ok(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].every((c) => lit.includes(c)) && !lit.includes('Digit6'), `${where}: підсвічено не цифри 1–5 (${lit})`);
          ok(/Цифри — у верхньому ряду/.test(intro), `${where}: немає пояснення про цифри`);
        }
        if (layout === 'ua' && n === 22) {
          ok(['Digit3', 'Digit5', 'Digit8', 'ShiftLeft', 'ShiftRight'].every((c) => lit.includes(c)), `${where}: для № % * не підсвічено цифри і обидва Shift (${lit})`);
          ok(/Shift \+ 3/.test(intro) && /Shift \+ 5/.test(intro) && /Shift \+ 8/.test(intro) && /іншому місці/.test(intro), `${where}: знайомство без Shift + цифра або без примітки`);
        }
        if (layout === 'ua' && n === 23) ok(lit.includes('Equal') && lit.some((c) => c.startsWith('Shift')) && /Shift \+ =/.test(intro), `${where}: для + = не підсвічено «=» і Shift (${lit})`);
        if (layout === 'en' && n === 19) ok(['Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit7', 'Digit8'].every((c) => lit.includes(c)) && /Shift \+ 2/.test(intro), `${where}: для # $ % & @ * не підсвічено цифри (${lit})`);
        if (hasIntro) await page.click('[data-act="start"]');
        // у першій вправі підсвічена наступна клавіша; для символів з Shift горять обидві руки
        const first = await page.locator('.ll-ch.is-current').innerText();
        const f1 = await activeFingers();
        if (/^\d$/.test(first)) ok(f1.length === 1, `${where}: для цифри ${first} має світитись один палець (${f1})`);
        const r1 = await play({ errAt: 6, stopAt: 8 });
        ok(r1.stopped, `${where}: не вдалось зупинитись посередині вправи`);
        await shot(`${world}-${layout}-${n}-drill`); await check(`${where}/drill`);
        const r = await play({});
        ok(!r.stuck && !r.noCursor, `${where}: урок не дійшов до підсумку (${JSON.stringify(r)})`);
        const acc = parseInt(await page.evaluate(() => document.querySelector('.ld-chips b')?.textContent));
        ok(acc >= 95, `${where}: точність ${acc} (одна навмисна помилка)`);
        await shot(`${world}-${layout}-${n}-result`); await check(`${where}/result`);
      }
      const done = (await store())[i].teen[layout];
      ok(Object.keys(done).length === LAST[layout], `${world} ${layout}: записано ${Object.keys(done).length} уроків із ${LAST[layout]}`);
      await page.goto(`${base}#teen`); await page.waitForTimeout(100);
      ok((await page.locator('.pb-go').count()) === 0, `${world} ${layout}: після курсу не має лишитись кнопки «Грай»`);
      await shot(`${world}-${layout}-course-done`); await check(`${world}/${layout}/world-done`);
    }
    await open(i, 'teen/lessons'); await shot(`${world}-lessons`); await check(`${world}/lessons`);
    ok((await page.locator('.lg-card').count()) === LAST.ua || (await page.locator('.lg-card').count()) === LAST.en, `${world}: у списку не всі уроки`);
  }

  // ---------- 2. Символи з Shift: обидві руки на схемі долонь під час вправи ----------
  await seed([profileFor(1, 'ua', { teen: { ua: doneUpTo('ua', 21), en: {} } })]);
  await open(1, 'teen/lesson/22');
  await page.click('[data-act="start"]');
  let both = false;
  for (let g = 0; g < 80 && !both; g++) {
    const cur = await page.locator('.ll-ch.is-current').innerText();
    if ('№%*'.includes(cur)) {
      const f = await activeFingers();
      both = f.some((x) => x.startsWith('f-l')) && f.some((x) => x.startsWith('f-r'));
      ok(both, `Shift-символ ${cur}: світиться не пара рук (${f})`);
      await shot('shift-both-hands'); await check('shift-both');
      break;
    }
    await page.evaluate((k) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })), cur === '␣' ? ' ' : cur);
  }

  // ---------- 3. Цифровий блок і «не та мова» ----------
  await seed([profileFor(0, 'ua', { teen: { ua: doneUpTo('ua', 20), en: {} } })]);
  await open(0, 'teen/lesson/21');
  if (await page.locator('[data-act="start"]').count()) await page.click('[data-act="start"]'); // уроку 21 знайомства немає
  const np = await page.evaluate(() => {
    const press = (init) => window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
    for (let g = 0; g < 80; g++) { const c = document.querySelector('.ll-ch.is-current'); if (!c) return { none: true }; if (/^\d$/.test(c.textContent)) break; press({ key: c.textContent === '␣' ? ' ' : c.textContent }); }
    const want = document.querySelector('.ll-ch.is-current').textContent;
    const before = document.querySelector('[data-acc]').textContent;
    press({ key: want, code: `Numpad${want}` }); // цифра з цифрового блоку
    return { want, before, after: document.querySelector('[data-acc]').textContent, next: document.querySelector('.ll-ch.is-current').textContent };
  });
  ok(!np.none && np.after === '100%', `цифра з цифрового блоку не зарахувалась (${JSON.stringify(np)})`);
  await seed([profileFor(0, 'ua', { teen: { ua: doneUpTo('ua', 21), en: {} } })]);
  await open(0, 'teen/lesson/22');
  await page.click('[data-act="start"]');
  const wrong = await page.evaluate(() => {
    const press = (init) => window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
    for (let g = 0; g < 80; g++) { const c = document.querySelector('.ll-ch.is-current'); if (!c) return { none: true }; if (c.textContent === '№') break; press({ key: c.textContent === '␣' ? ' ' : c.textContent }); }
    const before = document.querySelector('[data-acc]').textContent;
    press({ key: '#', code: 'Digit3', shiftKey: true }); // англійська розкладка замість української
    return { before, after: document.querySelector('[data-acc]').textContent, msg: document.querySelector('[data-msg]').textContent, cursor: document.querySelector('.ll-ch.is-current').textContent };
  });
  ok(wrong.cursor === '№' && wrong.before === wrong.after && /Alt/.test(wrong.msg), `«#» замість «№» має давати підказку про мову, не помилку (${JSON.stringify(wrong)})`);
  await shot('wrong-layout-hash');

  // ---------- 4. Після 18 уроків у профілі зберігається прогрес ----------
  await seed([profileFor(2, 'ua')]);
  await open(2, 'teen/lessons');
  const states = await page.$$eval('.lg-card', (c) => c.map((x) => x.className.match(/is-(\w+)/)?.[1]));
  ok(states.slice(0, 18).every((s) => s === 'done') && states[18] === 'current' && states.slice(19).every((s) => s === 'locked'), `стани уроків після 18: ${states.join(',')}`);

  ok(requests.length === 0, `${w}: мережеві запити: ${requests.join(', ')}`);
  await ctx.close();
}
await browser.close();
console.log(problems.length ? 'ПРОБЛЕМИ:\n' + problems.join('\n') : 'Етап Т5: усе гаразд, знімки в screenshots/t5-*');
process.exitCode = problems.length ? 1 : 0;
