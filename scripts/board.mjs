// Етап Т8: «Результати» (мій прогрес + п'ятірка ноутбука), вимикач таблиці й цілі медалей у «Для дорослого»: node scripts/board.mjs
// Три світи × 1366×768 і 1920×1080: не більше 5 рядків, останніх місць немає, свій прогрес завжди поруч, вимкнено → немає п'ятірки,
// цілі змінюються і повертаються, 6 клас не залежить від 5, усе зберігається після перезавантаження, нуль мережевих запитів. Знімки screenshots/t8-*.
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

const rec = (cpm, acc, hist = []) => ({ runs: hist.length || 1, medal: cpm >= 70 ? 1 : 0, bestCpm: cpm, bestAcc: acc, topCpm: acc >= 95 ? cpm : 0, topAcc: acc >= 95 ? acc : 0, hist });
const hist = (...v) => v.map(([cpm, acc], i) => ({ cpm, acc, d: `2026-10-${10 + i}` }));
const prof = (id, name, level, world, ua, extra = {}) => ({ id, name, avatar: 'fox', level, world, layout: 'ua', placement: { kind: 'zero', source: 'skip', at: 1 }, challenge: { open: true, rec: { ua, en: rec(0, 0) }, seen: [] }, ...extra });
const PROFILES = [
  prof('p0', 'Аня', '5', 'voxel', rec(120, 98, hist([90, 96], [105, 97], [120, 98]))),
  prof('p1', 'Богдан', '5', 'pixel', rec(100, 96)),
  prof('p2', 'Віка', '5', 'sky', rec(90, 96)),
  prof('p3', 'Гліб', '5', 'voxel', rec(80, 96)),
  prof('p4', 'Дана', '5', 'pixel', rec(70, 96)),
  prof('p5', 'Остання', '5', 'sky', rec(60, 96, hist([40, 93], [48, 95], [52, 96], [60, 96]))), // поза п'ятіркою
  prof('p6', 'Шостий', '6', 'voxel', rec(150, 97)),
  prof('p7', 'Новачок', '5', 'pixel', rec(0, 0), { challenge: { open: true, rec: { ua: { runs: 0, medal: 0, bestCpm: 0, bestAcc: 0, topCpm: 0, topAcc: 0, hist: [] }, en: rec(0, 0) }, seen: [] } }),
];
// Той, хто дивиться, і світ, у якому відкриваємо екран (профіль міняє світ — це лише тема)
const VIEWERS = [{ id: 'p0', world: 'voxel' }, { id: 'p5', world: 'sky' }, { id: 'p7', world: 'pixel' }, { id: 'p5', world: 'pixel' }, { id: 'p0', world: 'sky' }];

for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const requests = [];
  page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) requests.push(r.url()); });
  page.on('pageerror', (e) => problems.push(`${w}: помилка сторінки ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`${w}: консоль ${m.text()}`); });
  const shot = (name) => page.screenshot({ path: `screenshots/t8-${name}-${w}.png` });
  const text = () => page.evaluate(() => document.querySelector('.stage').innerText.replace(/\s+/g, ' '));
  const laptop = () => page.evaluate(() => JSON.parse(localStorage.getItem('klaviaturka.laptop.v1') ?? '{}'));
  const overflow = () => page.evaluate(() => {
    const st = document.querySelector('.stage')?.getBoundingClientRect(); if (!st) return 'немає сцени';
    return [...document.querySelectorAll('.stage *')].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && getComputedStyle(el).display !== 'none' && !el.closest('svg') && (b.right > st.right + 2 || b.bottom > st.bottom + 2 || b.left < st.left - 2 || b.top < st.top - 2); }).map((el) => el.className || el.tagName).slice(0, 4).join(', ');
  });
  const check = async (name) => { const o = await overflow(); if (o) problems.push(`${w} ${name}: ${o}`); };
  const seed = async (profiles, lap = null) => {
    await page.goto(base);
    await page.evaluate(([p, l]) => { localStorage.clear(); localStorage.setItem('klaviaturka.v1', JSON.stringify({ v: 1, profiles: p })); if (l) localStorage.setItem('klaviaturka.laptop.v1', JSON.stringify(l)); }, [profiles, lap]);
    await page.reload();
  };
  const open = async (id, hash) => { await page.goto(base); await page.reload(); await page.click(`[data-profile="${id}"]`); await page.waitForTimeout(80); await page.goto(`${base}#${hash}`); await page.waitForTimeout(150); };
  const adult = async (id) => {
    await open(id, 'adult'); await page.waitForTimeout(100);
    if (await page.locator('.sum-input').count()) {
      const t = await page.evaluate(() => document.querySelector('.screen-adult')?.innerText ?? '');
      const m = t.match(/(\d+)\s*[×x*]\s*(\d+)/);
      await page.fill('.sum-input', String(Number(m[1]) * Number(m[2]))); await page.press('.sum-input', 'Enter'); await page.waitForTimeout(100);
    }
  };

  // ---------- 1. Розділ «Результати» у трьох світах ----------
  for (const v of VIEWERS) {
    const profiles = PROFILES.map((p) => (p.id === v.id ? { ...p, world: v.world } : p));
    await seed(profiles);
    await open(v.id, 'teen/board');
    const t = await text();
    const tag = `${v.id}/${v.world}`;
    ok(t.includes('Мій прогрес'), `${w} ${tag}: немає «Мій прогрес»`);
    ok(t.includes('П’ятірка ноутбука · 5 клас'), `${w} ${tag}: немає п'ятірки`);
    const rows = await page.locator('.bd-rows li').count();
    ok(rows <= 5 && rows === 5, `${w} ${tag}: у таблиці ${rows} рядків, має бути 5`);
    ok(!t.includes('Шостий'), `${w} ${tag}: у таблиці 5 класу є учень 6 класу`);
    if (v.id === 'p5') {
      ok(!(await page.locator('.bd-rows').innerText()).includes('Остання'), `${w} ${tag}: учня поза п'ятіркою показано в таблиці`);
      ok(/До п’ятірки ще 11/.test(t), `${w} ${tag}: немає «До п'ятірки ще 11»`);
      ok(/Мій рекорд 60/.test(t) && /Минулого разу 56|Минулого разу 52/.test(t), `${w} ${tag}: немає рекорду й порівняння з минулою спробою`);
      ok(!/\b6-й\b|із 8|останн[іє] місц/i.test(t.replace('Остання', '')), `${w} ${tag}: показано місце поза п'ятіркою`);
    }
    if (v.id === 'p0') ok(await page.locator('.bd-rows li.is-me').count() === 1, `${w} ${tag}: свій рядок не виділено`);
    if (v.id === 'p7') ok(/Спроб 0|Спроб\s*0/.test(t), `${w} ${tag}: порожній прогрес новачка`);
    ok(await page.locator('.bd-bars li').count() === (v.id === 'p0' ? 3 : v.id === 'p5' ? 4 : 0), `${w} ${tag}: стовпчики спроб`);
    await check(`board ${tag}`);
    await shot(`board-${v.id}-${v.world}`);
  }

  // ---------- 2. Кнопки: з випробування є «Результати»; на головному екрані кнопки немає ----------
  await seed(PROFILES);
  await open('p0', 'teen');
  ok(!(await page.locator('a[href="#teen/board"]').count()), `${w}: на головному екрані світу не має бути кнопки до таблиці`);
  await open('p0', 'teen/worlds');
  ok(!(await page.locator('a[href="#teen/board"]').count()), `${w}: на карті світів не має бути кнопки до таблиці`);
  await open('p0', 'teen/challenge');
  ok((await page.locator('a[href="#teen/board"]').innerText()) === 'Результати', `${w}: на екрані випробування має бути «Результати»`);
  await check('challenge-ready');
  await page.click('a[href="#teen/board"]'); await page.waitForTimeout(120);
  ok((await text()).includes('П’ятірка ноутбука'), `${w}: кнопка «Результати» не веде до розділу`);
  // Екрани 1–4 не змінено: у списку профілів — звичайні картки
  // ---------- 3. «Для дорослого»: вимкнути таблицю ----------
  await adult('p0');
  ok(await page.locator('[data-act="compete"]').count() === 1, `${w}: у «Для дорослого» немає кнопки «Змагання і цілі медалей»`);
  await page.click('[data-act="compete"]'); await page.waitForTimeout(80);
  await check('adult-compete'); await shot('adult-compete');
  ok((await page.locator('[data-act="board"][data-val="1"]').getAttribute('aria-pressed')) === 'true', `${w}: за замовчуванням таблиця має бути увімкнена`);
  await page.click('[data-act="board"][data-val="0"]'); await page.waitForTimeout(80);
  ok((await laptop()).boardOff === true, `${w}: вимкнення таблиці не збереглось`);
  await open('p0', 'teen/challenge');
  ok((await page.locator('a[href="#teen/board"]').innerText()) === 'Мій прогрес', `${w}: коли таблицю вимкнено, кнопка має називатись «Мій прогрес»`);
  await page.click('a[href="#teen/board"]'); await page.waitForTimeout(120);
  const off = await text();
  ok(!off.includes('П’ятірка') && !off.includes('Богдан') && (await page.locator('.bd-rows').count()) === 0, `${w}: таблицю вимкнено, але п'ятірка видна`);
  ok(off.includes('Мій прогрес') && off.includes('Мій рекорд 120'), `${w}: при вимкненій таблиці має лишатись «Мій прогрес»`);
  await check('board-off'); await shot('board-off');
  // вмикаємо назад
  await adult('p0'); await page.click('[data-act="compete"]'); await page.click('[data-act="board"][data-val="1"]'); await page.waitForTimeout(60);
  ok((await laptop()).boardOff === undefined, `${w}: увімкнення таблиці не збереглось`);

  // ---------- 4. Цілі медалей ----------
  await adult('p0'); await page.click('[data-act="compete"]'); await page.waitForTimeout(60);
  const val = (sel) => page.locator(sel).innerText();
  const rowVals = () => page.evaluate(() => [...document.querySelectorAll('.goal-row:not(.is-head)')].map((r) => [...r.querySelectorAll('.goal-val')].map((v) => v.textContent).join('/')));
  ok(JSON.stringify(await rowVals()) === JSON.stringify(['70/92%', '100/95%', '130/97%']), `${w}: стандартні цілі 5 класу: ${await rowVals()}`);
  await page.click('[data-goal="bronze:cpm:1"]'); await page.click('[data-goal="bronze:cpm:1"]'); await page.waitForTimeout(60);
  await page.click('[data-goal="gold:acc:-1"]'); await page.waitForTimeout(60);
  ok(JSON.stringify(await rowVals()) === JSON.stringify(['80/92%', '100/95%', '130/96%']), `${w}: цілі після «+»: ${await rowVals()}`);
  await shot('adult-goals');
  // Срібло не може опуститись нижче бронзи
  for (let i = 0; i < 6; i++) await page.click('[data-goal="silver:cpm:-1"]');
  const sv = (await rowVals())[1].split('/')[0];
  ok(Number(sv) > 80, `${w}: срібло опустилось до бронзи або нижче (${sv})`);
  // 6 клас не залежить від 5
  await page.click('[data-goal-grade="6"]'); await page.waitForTimeout(60);
  ok(JSON.stringify(await rowVals()) === JSON.stringify(['100/92%', '140/95%', '180/97%']), `${w}: 6 клас мав лишитись стандартним: ${await rowVals()}`);
  await check('adult-goals-6');
  // збереглось і діє в учнів
  await page.goto(base); await page.reload();
  ok((await laptop()).goals?.['5']?.bronze?.cpm === 80, `${w}: цілі не збереглись у сховищі ноутбука`);
  await open('p1', 'teen/challenge'); // інший учень 5 класу
  const goalsText = await text();
  ok(goalsText.includes('80 знаків за хвилину') && goalsText.includes('96%'), `${w}: інший учень не бачить змінених цілей`);
  await open('p6', 'teen/challenge'); // 6 клас: стандартні
  ok((await text()).includes('100 знаків за хвилину') && (await text()).includes('180 знаків'), `${w}: 6 клас показує не свої цілі`);
  await shot('challenge-goals-6');
  // повернути стандартні
  await adult('p0'); await page.click('[data-act="compete"]'); await page.click('[data-act="goals-reset"]'); await page.waitForTimeout(60);
  ok(JSON.stringify(await rowVals()) === JSON.stringify(['70/92%', '100/95%', '130/97%']), `${w}: «Повернути стандартні значення» не спрацювало: ${await rowVals()}`);
  ok((await laptop()).goals === undefined, `${w}: після повернення у сховищі лишились свої цілі`);
  await open('p1', 'teen/challenge');
  ok((await text()).includes('70 знаків за хвилину'), `${w}: після повернення учень має бачити стандартні цілі`);

  // ---------- 5. Дитячий профіль не бачить налаштувань змагань ----------
  await seed([...PROFILES, { id: 'k1', name: 'Мала', avatar: 'fox', level: '1-2' }]);
  await adult('k1');
  ok(await page.locator('[data-act="compete"]').count() === 0, `${w}: у дитячому профілі з'явилась кнопка змагань`);
  // Екрани 1–4 недоступні/незмінні: учень 1–2 класу не потрапляє на #teen/board
  await open('k1', 'teen/board');
  ok(!(await text()).includes('П’ятірка'), `${w}: дитина потрапила до таблиці`);

  ok(requests.length === 0, `${w}: були мережеві запити: ${requests.join(', ')}`);
  await ctx.close();
}

await browser.close();
if (problems.length) { console.log('ПРОБЛЕМИ:\n' + problems.map((p) => '- ' + p).join('\n')); process.exit(1); }
console.log('Етап Т8: усе гаразд (3 світи × 1366 і 1920, розділ «Результати», вимикач, цілі, нуль запитів).');
