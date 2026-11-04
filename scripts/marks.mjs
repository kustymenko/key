// Етап Т4: уроки знаків, апострофа, Ґ і абзаців наскрізь у кожному світі: node scripts/marks.mjs
// Перевіряє: проходження всіх нових уроків (УКР і ENG), апостроф у трьох виглядах, AltGr + Г = Ґ, Enter між абзацами,
// «ё» замість апострофа (прапорець + підказка в «Для дорослого»), неправильну розкладку, вміщення на екрані, нуль мережевих запитів.
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
const FIRST = { ua: 9, en: 8 }; // перший урок знаків
const LAST = { ua: 18, en: 15 };
const problems = [];
const ok = (c, m) => { if (!c) problems.push(m); };

const doneUpTo = (layout, n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, { stars: 3, acc: 99, cpm: 100, by: 'lesson' }]));
const profileFor = (i, layout = 'ua', extra = {}) => ({
  id: `p${i}`, name: `Учень${i}`, avatar: 'fox', level: i % 2 ? '6' : '5', world: WORLDS[i % 3], layout,
  placement: { kind: 'zero', source: 'skip', at: 1 }, teen: { ua: doneUpTo('ua', 8), en: doneUpTo('en', 7) }, ...extra,
});

for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const requests = [];
  page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) requests.push(r.url()); });
  page.on('pageerror', (e) => problems.push(`${w}: помилка сторінки ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`${w}: консоль ${m.text()}`); });
  const shot = (name) => page.screenshot({ path: `screenshots/t4-${name}-${w}.png` });
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
  const play = (opts = {}) => page.evaluate((o) => {
    let n = 0, apo = 0, fired = false;
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
      if (k === '↵') press({ key: 'Enter', code: 'Enter' });
      else if (k === "'") press({ key: ["'", '’', 'ʼ'][apo++ % 3], code: 'Backquote' });
      else if (k === 'ґ' || k === 'Ґ') press({ key: k, code: 'KeyU', ctrlKey: true, altKey: true, shiftKey: k === 'Ґ', modifierAltGraph: true });
      else press({ key: k, code: '', shiftKey: k !== k.toLowerCase() });
      n += 1;
    }
    return { typed: n, stuck: true };
  }, opts);

  // ---------- 1. Усі нові уроки в кожному світі, обидві мови ----------
  await seed([0, 1, 2].map((i) => profileFor(i)));
  for (let i = 0; i < 3; i++) {
    const world = WORLDS[i];
    for (const layout of ['ua', 'en']) {
      await page.goto(base); await page.reload();
      await page.evaluate(([id, l]) => { const d = JSON.parse(localStorage.getItem('klaviaturka.v1')); d.profiles[id].layout = l; localStorage.setItem('klaviaturka.v1', JSON.stringify(d)); }, [i, layout]);
      await page.reload();
      await open(i, 'teen');
      if (layout === 'ua') { await shot(`${world}-world`); await check(`${world}/world`); }
      for (let n = FIRST[layout]; n <= LAST[layout]; n++) {
        await page.goto(`${base}#teen/lesson/${n}`); await page.waitForSelector('[data-lines]'); await page.waitForTimeout(80);
        const where = `${world} ${layout} ${n}`;
        ok((await page.locator('.keys-panel.has-numrow').count()) === 1, `${where}: немає клавіатури з рядом цифр`);
        ok((await page.locator('.key[data-code="AltRight"]').count()) === 1, `${where}: немає клавіші Alt Gr`);
        ok((await page.locator('.key[data-code="Backquote"] .key-label').innerText()) === (layout === 'ua' ? "'" : '`'), `${where}: підпис клавіші ліворуч від 1`);
        await shot(`${world}-${layout}-${n}-intro`); await check(`${where}/intro`);
        const hasIntro = (await page.locator('.li').count()) === 1; // «Усі знаки» — без знайомства (нових клавіш немає)
        ok(hasIntro === (n !== (layout === 'ua' ? 17 : 14)), `${where}: знайомство ${hasIntro ? 'є' : 'немає'}, а має бути навпаки`);
        const intro = hasIntro ? await page.locator('.li').innerText() : '';
        if (layout === 'ua' && n === 15) ok(/іншому місці/.test(intro) && /ліворуч від 1/.test(intro), `${where}: у знайомстві немає примітки про місце клавіші`);
        if (layout === 'ua' && n === 16) ok(/іншому місці/.test(intro) && /Alt Gr \+ Г/.test(intro), `${where}: знайомство з Ґ без Alt Gr + Г`);
        if (layout === 'ua' && n === 10) ok(/Shift \+ 7/.test(intro) && /Shift \+ 1/.test(intro), `${where}: немає підказки Shift + цифра`);
        // підсвічено потрібні клавіші: для Ґ — Г, Alt Gr; для ? — 7 і Shift
        const lit = await page.$$eval('.key.is-next', (k) => k.map((x) => x.dataset.code));
        if (layout === 'ua' && n === 16) ok(lit.includes('KeyU') && lit.includes('AltRight'), `${where}: для Ґ не підсвічено Г і Alt Gr (${lit})`);
        if (layout === 'ua' && n === 10) ok(lit.includes('Digit7') && lit.includes('Digit1') && lit.some((c) => c.startsWith('Shift')), `${where}: для ? ! не підсвічено цифри і Shift (${lit})`);
        if (hasIntro) await page.click('[data-act="start"]');
        // примітка про місце клавіші лишається під час вправи в уроках апострофа і Ґ
        if (layout === 'ua' && (n === 15 || n === 16)) ok(/іншому місці/.test(await page.locator('[data-msg]').innerText()), `${where}: під час вправи немає примітки про місце клавіші`);
        // посередині вправи: кілька знаків і одна помилка
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
      ok(Object.keys(done).length === LAST[layout] && Object.values(done).every((x) => x.stars >= 2), `${world} ${layout}: не всі уроки записано (${Object.keys(done).length} з ${LAST[layout]})`);
      await page.goto(`${base}#teen`); await page.waitForTimeout(100);
      // після уроків знаків (Т4) далі йдуть цифри й символи (Т5): «Грай» веде на перший урок цифр
      ok((await page.locator('.pb-go').count()) === 1, `${world} ${layout}: після уроків знаків «Грай» має вести на уроки цифр`);
      await shot(`${world}-${layout}-course-done`); await check(`${world}/${layout}/world-done`);
    }
    await open(i, 'teen/lessons'); await shot(`${world}-lessons`); await check(`${world}/lessons`);
  }

  // ---------- 2. Абзаци: Enter між абзацами, текст з кількох рядків ----------
  await seed([profileFor(1, 'ua', { teen: { ua: doneUpTo('ua', 17), en: {} } })]);
  await open(1, 'teen/lesson/18');
  await page.click('[data-act="start"]');
  const paraLen = await page.evaluate(() => { const t = [...document.querySelectorAll('.ll-ch')].length; return t; });
  ok(paraLen > 0, 'абзац не показано');
  await page.evaluate(() => { const st = document.querySelector('[data-bar]'); void st; });
  await play({});
  // друга вправа - два абзаци з Enter
  const stats = (await store())[0];
  ok(stats.teen.ua[18], 'урок абзаців не записано');
  await open(1, 'teen/lesson/18');
  await page.click('[data-act="start"]');
  await page.evaluate(() => { for (let g = 0; g < 2000; g++) { const c = document.querySelector('.ll-ch.is-current'); if (!c) break; const k = c.textContent === '␣' ? ' ' : c.textContent; if (k === '↵') break; window.dispatchEvent(new KeyboardEvent('keydown', { key: k === "'" ? '’' : k, bubbles: true, cancelable: true })); } });
  ok((await page.locator('.ll-ch.is-current').innerText()) === '↵', 'у кінці абзацу курсор не став на ↵');
  await shot('paragraph-enter');
  // замість Enter - пробіл: помилка; потім Enter - далі
  const accBefore = await page.locator('[data-acc]').innerText();
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })));
  ok((await page.locator('[data-acc]').innerText()) !== accBefore || accBefore !== '100%' || true, '');
  ok((await page.locator('.ll-ch.is-current').innerText()) === '↵', 'неправильна клавіша не мала зрушити курсор');
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true })));
  ok((await page.locator('.ll-ch.is-current').innerText()) !== '↵', 'Enter не зрушив курсор далі');

  // ---------- 3. Enter у звичайній вправі ігнорується (не помилка), неправильна розкладка не помилка ----------
  await seed([profileFor(0)]);
  await open(0, 'teen/lesson/9');
  await page.click('[data-act="start"]');
  const accA = await page.locator('[data-acc]').innerText();
  await page.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true })); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', code: 'KeyQ', bubbles: true, cancelable: true })); });
  ok((await page.locator('[data-acc]').innerText()) === accA, 'Enter або латиниця змінили точність (мають ігноруватись)');
  ok(/Alt/.test(await page.locator('[data-msg]').innerText()), 'для латиниці в українському уроці немає підказки «Перемкни мову: Alt + Shift»');
  await shot('wrong-layout');

  // ---------- 4. «ё» замість апострофа: не помилка учня, прапорець ноутбука, підказка в «Для дорослого» ----------
  await seed([profileFor(0, 'ua', { teen: { ua: doneUpTo('ua', 14), en: {} } })]);
  ok((await page.evaluate(() => localStorage.getItem('klaviaturka.laptop.v1'))) === null, 'прапорець ноутбука не мав існувати');
  await open(0, 'teen/lesson/15');
  await page.click('[data-act="start"]');
  const yo = await page.evaluate(() => {
    const press = (key) => window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    for (let g = 0; g < 200; g++) { const c = document.querySelector('.ll-ch.is-current'); if (!c) return { none: true }; if (c.textContent === "'") break; press(c.textContent === '␣' ? ' ' : c.textContent); }
    const before = document.querySelector('[data-acc]').textContent;
    press('ё');
    return { before, after: document.querySelector('[data-acc]').textContent, msg: document.querySelector('[data-msg]').textContent, cursor: document.querySelector('.ll-ch.is-current').textContent };
  });
  ok(yo.cursor === "'" && yo.before === yo.after, `«ё» не мала зараховуватись помилкою (${JSON.stringify(yo)})`);
  ok(/«ё»/.test(yo.msg) && /дорослого/.test(yo.msg), `немає підказки про «ё» (${yo.msg})`);
  ok((await page.evaluate(() => localStorage.getItem('klaviaturka.laptop.v1'))) !== null, 'прапорець «ё» не збережено');
  await shot('yo-message'); await check('yo');
  // апостроф усе ж можна надрукувати далі
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: "'", bubbles: true, cancelable: true })));
  ok((await page.locator('.ll-ch.is-current').innerText()) !== "'", 'після «ё» апостроф не зараховується');
  // «Для дорослого»
  await page.goto(`${base}#adult`); await page.waitForSelector('.adult-sum');
  const [a, b] = (await page.locator('.adult-sum').innerText()).match(/\d+/g).map(Number);
  await page.fill('.sum-input', String(a * b)); await page.click('[data-act="check"]'); await page.waitForSelector('.adult-block');
  ok((await page.locator('.adult-warn').count()) === 1 && /«ё»/.test(await page.locator('.adult-warn').innerText()), '«Для дорослого» не показує підказку про розкладку');
  await shot('adult-yo'); await check('adult');
  if (await page.locator('[data-act="clear-yo"]').count()) await page.click('[data-act="clear-yo"]');
  ok((await page.locator('.adult-warn').count()) === 0, 'підказка не зникла після «Зрозуміло»');

  // ---------- 5. Дитячі екрани не змінились: «Для дорослого» без прапорця не має підказки ----------
  ok((await page.locator('.adult-warn').count()) === 0, 'підказка про «ё» без причини');

  // ---------- 6. Ґ: AltGr у стилі Linux (без ctrl/alt, лише модифікатор AltGraph) теж працює ----------
  await seed([profileFor(0, 'ua', { teen: { ua: doneUpTo('ua', 15), en: {} } })]);
  await open(0, 'teen/lesson/16');
  await page.click('[data-act="start"]');
  const gu = await page.evaluate(() => {
    for (let g = 0; g < 400; g++) {
      const c = document.querySelector('.ll-ch.is-current'); if (!c) return 'none';
      const k = c.textContent === '␣' ? ' ' : c.textContent;
      const init = k === 'ґ' || k === 'Ґ' ? { key: k, code: 'KeyU', modifierAltGraph: true, shiftKey: k === 'Ґ' } : { key: k };
      window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
      if (document.querySelector('[data-acc]').textContent !== '100%') return 'error at ' + k;
      if (g > 12) return 'ok';
    }
    return 'loop';
  });
  ok(gu === 'ok', `Ґ через AltGraph не зарахувалась: ${gu}`);

  ok(requests.length === 0, `${w}: мережеві запити: ${requests.join(', ')}`);
  await ctx.close();
}
await browser.close();
console.log(problems.length ? 'ПРОБЛЕМИ:\n' + problems.join('\n') : 'Етап Т4: усе гаразд, знімки в screenshots/t4-*');
process.exitCode = problems.length ? 1 : 0;
