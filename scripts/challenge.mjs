// Етап Т7: випробування на час 5–6 класів наскрізь у кожному світі: node scripts/challenge.mjs
// Закрите/відкрите, цілі, таймер (керований годинник Playwright, без справжніх 2 хвилин), медалі 5 і 6 класу, неточний результат без медалі,
// рекорди не зменшуються, нові тексти, жодних підказок на клавіатурі, нуль запитів, знімки screenshots/t7-*.
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

// Повністю пройдений курс (УКР): тоді «Вершина швидкості» відкрита без допомоги дорослого
const fullCourse = Object.fromEntries(Array.from({ length: 24 }, (_, i) => [i + 1, { stars: 2, acc: 95, cpm: 100, by: 'lesson' }]));
const prof = (i, o = {}) => ({ id: `p${i}`, name: `Учень${i}`, avatar: 'fox', level: '5', world: WORLDS[i % 3], layout: 'ua', placement: { kind: 'zero', source: 'skip', at: 1 }, ...o });
const PROFILES = [
  prof(0, { teen: { ua: fullCourse, en: {} } }), // 5 клас, курс пройдено
  prof(1, { challenge: { open: true } }), // 5 клас, відкрито дорослим
  prof(2, { challenge: { open: true } }),
  prof(3, { level: '6', world: 'sky', challenge: { open: true } }), // 6 клас
  prof(4, { world: 'voxel' }), // закрите
  prof(5, { world: 'pixel', challenge: { open: true } }), // 5 клас: неточний результат
  prof(6, { world: 'sky', challenge: { open: true } }), // 5 клас: рекорди не зменшуються
];

for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.clock.install();
  const requests = [];
  page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) requests.push(r.url()); });
  page.on('pageerror', (e) => problems.push(`${w}: помилка сторінки ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`${w}: консоль ${m.text()}`); });
  const shot = (name) => page.screenshot({ path: `screenshots/t7-${name}-${w}.png` });
  const store = () => page.evaluate(() => JSON.parse(localStorage.getItem('klaviaturka.v1') ?? '{"profiles":[]}').profiles);
  const rec = async (i) => (await store()).find((p) => p.id === `p${i}`).challenge.rec.ua;
  const seed = async (profiles) => { await page.goto(base); await page.evaluate((p) => localStorage.setItem('klaviaturka.v1', JSON.stringify({ v: 1, profiles: p })), profiles); await page.reload(); };
  const open = async (i, hash = 'teen/challenge') => { await page.goto(base); await page.reload(); await page.click(`[data-profile="p${i}"]`); await page.waitForTimeout(80); await page.goto(`${base}#${hash}`); await page.waitForTimeout(150); };
  const text = () => page.evaluate(() => document.querySelector('.stage').innerText.replace(/\s+/g, ' '));
  const overflow = () => page.evaluate(() => {
    const st = document.querySelector('.stage')?.getBoundingClientRect(); if (!st) return 'немає сцени';
    const bad = [...document.querySelectorAll('.stage *')].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && getComputedStyle(el).display !== 'none' && !el.closest('svg') && !el.closest('.cm-scale') && !el.closest('.wt-scale') && !el.closest('.cm-num') && (b.right > st.right + 2 || b.bottom > st.bottom + 2 || b.left < st.left - 2 || b.top < st.top - 2); }).map((el) => el.className || el.tagName).slice(0, 4).join(', ');
    const card = document.querySelector('.stage > .screen > [class$="-task"]')?.getBoundingClientRect();
    const ld = document.querySelector('[data-ld]')?.getBoundingClientRect();
    const out = [];
    if (card && ld && ld.height > 0 && (ld.bottom > card.bottom + 1 || ld.top < card.top - 1)) out.push('вміст не вміщається в картці');
    return [bad, ...out].filter(Boolean).join('; ');
  });
  const check = async (name) => { const o = await overflow(); if (o) problems.push(`${w} ${name}: ${o}`); };
  const done = () => page.evaluate(() => !!document.querySelector('[data-ld] .ld-h') && !document.querySelector('[data-done]').hidden);
  // Натискає поточну літеру; повертає її. bad — натиснути не ту клавішу (помилка)
  const press = (bad = false) => page.evaluate((b) => {
    if (b) { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ъ', code: 'BracketRight', bubbles: true, cancelable: true })); return 'ъ'; }
    const c = document.querySelector('.ll-ch.is-current');
    if (!c) return null;
    let k = c.textContent.replace(/ /g, ' ');
    if (k === '␣') k = ' ';
    window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: '', shiftKey: k !== k.toLowerCase(), bubbles: true, cancelable: true }));
    return k;
  }, bad);
  // Друкує «живими» натисканнями з паузою msPer; кожні errEvery знаків — одна помилка; до maxChars або поки не з'явиться результат
  async function typeFor({ msPer, errEvery = 0, maxChars = 600 }) {
    let n = 0;
    while (n < maxChars && !(await done())) {
      await press(errEvery > 0 && n > 0 && n % errEvery === 0);
      await page.clock.runFor(msPer);
      n += 1;
    }
    return n;
  }
  const start = async () => { await page.click('[data-act="start"]'); await page.waitForTimeout(60); };

  await seed(PROFILES);

  // ---------- 1. Закрите випробування ----------
  await open(4, 'teen/challenge');
  ok((await text()).includes('ще закрите'), `${w}: у нового учня випробування має бути закрите`);
  ok((await page.locator('.keys-panel').count()) === 0, `${w}: у закритого випробування немає клавіатури`);
  await shot('closed'); await check('closed');
  await open(4, 'teen/worlds');
  ok((await page.locator('a[href="#teen/challenge"]').count()) === 0, `${w}: закрите випробування має кнопку на карті`);
  ok((await page.locator('.wl-card.is-locked .wl-hint').count()) === 5, `${w}: у п'яти закритих світів має бути підказка`);

  // ---------- 2. Курс пройдено: «Вершина» відкрита, на панелі кнопка «Випробування» ----------
  await open(0, 'teen');
  ok((await page.locator('a.pb-chal').count()) === 1, `${w}: на панелі після курсу має бути кнопка «Випробування»`);
  await check('world-after-course');
  await shot('panel');
  await open(0, 'teen/worlds');
  ok((await page.locator('.wl-card.is-now[data-world-card="5"]').count()) === 1, `${w}: «Вершина швидкості» має бути відкрита`);
  await shot('worlds'); await check('worlds');

  // ---------- 3. Початковий екран кожного світу ----------
  for (const i of [0, 1, 2, 3]) {
    const world = PROFILES[i].world;
    await open(i, 'teen/challenge');
    const t = await text();
    ok(t.includes('Бронза') && t.includes('Срібло') && t.includes('Золото'), `${world}: на початку немає трьох цілей`);
    const g = PROFILES[i].level === '6' ? ['100', '140', '180'] : ['70', '100', '130'];
    ok(g.every((n) => t.includes(`${n} знаків за хвилину`)), `${world}: цілі не ті для ${PROFILES[i].level} класу`);
    ok(t.includes('Підказок немає'), `${world}: немає слів про відсутність підказок`);
    ok((await page.locator('.ll-time').innerText()) === '2:00', `${world}: таймер має показувати 2:00`);
    ok((await page.locator('[data-hint]').count()) === 0, `${world}: у випробуванні не має бути кнопки «Підказка»`);
    await shot(`${world}-ready${i === 3 ? '-g6' : ''}`); await check(`${world}/ready`);
  }

  // ---------- 4. Золото (5 клас): ~133 знаки за хвилину, точність ≥ 97% ----------
  await open(0, 'teen/challenge');
  await start();
  ok((await page.locator('.ll-time').innerText()) === '2:00', 'таймер не має йти до першої літери');
  await page.clock.runFor(30000);
  ok((await page.locator('.ll-time').innerText()) === '2:00', 'таймер пішов ще до першої літери');
  await typeFor({ msPer: 450, maxChars: 60, errEvery: 0 });
  const mid = await page.locator('.ll-time').innerText();
  ok(/^1:[0-5]\d$/.test(mid) || mid === '1:60', `${w}: посередині таймер має показувати 1:xx, а не «${mid}»`);
  ok((await page.locator('.key.is-next').count()) === 0, 'у випробуванні клавіатура не має підсвічувати наступну клавішу');
  ok((await page.locator('.hands .is-active, .hands [data-active]').count()) === 0, 'схема долонь не має підказувати палець');
  await shot('run-voxel'); await check('run');
  await typeFor({ msPer: 450, maxChars: 600, errEvery: 70 });
  ok(await done(), `${w}: після 2 хвилин мав з'явитись результат`);
  let t = await text();
  ok(t.includes('Золото'), `${w}: 5 клас, ~130 знаків і 98% — мало бути золото. Текст: ${t.slice(0, 260)}`);
  const r0 = await rec(0);
  ok(r0.medal === 3 && r0.runs === 1 && r0.bestCpm >= 130, `${w}: рекорд золота не записано ${JSON.stringify(r0)}`);
  ok((await store())[0].xp > 0, `${w}: за випробування немає досвіду`);
  await shot('result-gold-voxel'); await check('result-gold');
  await open(0, 'teen/worlds');
  ok((await page.locator('.wl-card.is-done[data-world-card="5"]').count()) === 1, `${w}: після золота «Вершина» має бути пройдена`);
  await shot('worlds-gold');

  // ---------- 5. Той самий результат у 6 класі — лише бронза; тексти нові ----------
  await open(3, 'teen/challenge');
  await start();
  const firstLine = await page.locator('[data-lines] .ll-line').first().innerText();
  await typeFor({ msPer: 450, maxChars: 600, errEvery: 70 });
  t = await text();
  ok(t.includes('Бронза'), `${w}: 6 клас, ~130 знаків і 98% — мала бути бронза. Текст: ${t.slice(0, 260)}`);
  ok(/До срібла ще \d+ знаків за хвилину/.test(t), `${w}: немає підказки до срібла`);
  ok((await rec(3)).medal === 1, `${w}: у 6 класі медаль не бронза`);
  await shot('result-bronze-sky-g6'); await check('result-bronze');
  // друга спроба — інший текст
  await page.click('[data-act="again"]'); await page.waitForTimeout(100);
  await start();
  const secondLine = await page.locator('[data-lines] .ll-line').first().innerText();
  ok(firstLine !== secondLine, `${w}: у другій спробі той самий початок тексту`);

  // ---------- 6. Швидко, але неточно: без медалі, рекорд швидкості не змінюється ----------
  await open(5, 'teen/challenge');
  await start();
  await typeFor({ msPer: 280, maxChars: 800, errEvery: 7 });
  t = await text();
  ok(!/Бронза|Срібло|Золото|Медаль:/.test(t.replace(/Бронза \d|Срібло \d|Золото \d/g, '')) || t.includes('Результат записано'), `${w}: неточний результат не повинен давати медаль`);
  ok(t.includes('Результат записано'), `${w}: без медалі має бути спокійний заголовок «Результат записано». Текст: ${t.slice(0, 200)}`);
  ok(/потрібна точність 92%/.test(t), `${w}: підказка має починатися з точності. Текст: ${t.slice(0, 300)}`);
  ok(!/!/.test(await page.locator('[data-ld]').innerText()), `${w}: у результаті не має бути вигуків`);
  const r5 = await rec(5);
  ok(r5.medal === 0 && r5.bestCpm === 0 && r5.runs === 1, `${w}: неточна спроба не повинна давати рекорд швидкості ${JSON.stringify(r5)}`);
  ok((await store())[5].xp > 0, `${w}: навіть слабка спроба дає трохи досвіду`);
  await shot('result-nomedal-pixel'); await check('result-nomedal');

  // ---------- 7. Рекорди не зменшуються ----------
  await open(6, 'teen/challenge');
  await start();
  await typeFor({ msPer: 450, maxChars: 600, errEvery: 70 });
  const good = await rec(6);
  ok(good.medal >= 2, `${w}: перша спроба мала дати срібло чи золото ${JSON.stringify(good)}`);
  await open(6, 'teen/challenge');
  await start();
  await typeFor({ msPer: 1200, maxChars: 600, errEvery: 3 });
  const worse = await rec(6);
  ok(worse.runs === 2 && worse.medal === good.medal && worse.bestCpm === good.bestCpm && worse.bestAcc >= good.bestAcc, `${w}: гірша спроба зменшила рекорди ${JSON.stringify([good, worse])}`);
  t = await text();
  ok(t.includes('Результат записано'), `${w}: слабка друга спроба — спокійний заголовок`);
  await shot('result-sky-after-weak'); await check('result-after-weak');

  // ---------- 8. Закінчили друкувати раніше: час усе одно закінчується, результат є ----------
  await open(2, 'teen/challenge');
  await start();
  await typeFor({ msPer: 500, maxChars: 20, errEvery: 0 });
  await page.clock.runFor(125000);
  await page.waitForTimeout(50);
  ok(await done(), `${w}: час мав закінчитись сам`);
  ok((await text()).includes('Замало знаків'), `${w}: 20 знаків — «Замало знаків для результату»`);
  ok((await rec(2)).runs === 0, `${w}: замало знаків не повинно записуватись`);

  // ---------- 9. «Для дорослого»: перемикач відкриває випробування ----------
  await open(4, 'adult');
  await page.waitForTimeout(100);
  const gate = await page.locator('.sum-input').count();
  if (gate) {
    const sum = await page.evaluate(() => document.querySelector('.screen-adult')?.innerText ?? '');
    const m = sum.match(/(\d+)\s*[×x*]\s*(\d+)/);
    if (m) { await page.fill('.sum-input', String(Number(m[1]) * Number(m[2]))); await page.press('.sum-input', 'Enter'); await page.waitForTimeout(100); }
  }
  if (await page.locator('[data-act="challenge-open"][data-val="1"]').count()) {
    await page.click('[data-act="challenge-open"][data-val="1"]');
    await page.waitForTimeout(80);
    ok((await store())[4].challenge.open === true, `${w}: перемикач у «Для дорослого» не зберіг відкриття`);
    await shot('adult');
    await open(4, 'teen/challenge');
    ok((await text()).includes('Підказок немає'), `${w}: після відкриття дорослим випробування має працювати`);
  } else problems.push(`${w}: у «Для дорослого» немає перемикача випробування`);

  ok(requests.length === 0, `${w}: були мережеві запити: ${requests.join(', ')}`);
  await ctx.close();
}

await browser.close();
if (problems.length) { console.log('ПРОБЛЕМИ:\n' + problems.map((p) => '- ' + p).join('\n')); process.exit(1); }
console.log('Випробування на час: усе гаразд (3 світи, 5 і 6 клас, 1366×768 і 1920×1080, нуль запитів).');
