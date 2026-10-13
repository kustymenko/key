// Етап Т1 (світ 5–6 класів): node scripts/teen.mjs
// Створення профілів 5–6 через екрани, три світи, зміна світу й героя, помічник, зміна класу без втрати прогресу, нуль запитів.
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
const problems = [];
const ok = (c, m) => { if (!c) problems.push(m); };
const TEXT = 'новий світ чекає на тебе і твої швидкі пальці';
const WORLDS = ['voxel', 'pixel', 'sky'];
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('klaviaturka.v1') ?? '{"profiles":[]}').profiles);

// Нічого не виходить за сцену 1366×768
const overflow = (page) => page.evaluate(() => {
  const st = document.querySelector('.stage')?.getBoundingClientRect(); if (!st) return 'немає сцени';
  return [...document.querySelectorAll('.stage *')].filter((el) => {
    const b = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return b.width > 0 && cs.display !== 'none' && !el.closest('svg') && !el.closest('.cm-scale') && !el.closest('.cm-num') && (b.right > st.right + 2 || b.bottom > st.bottom + 2 || b.left < st.left - 2 || b.top < st.top - 2);
  }).map((el) => el.className || el.tagName).slice(0, 5).join(', ');
});

for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const requests = [];
  page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) requests.push(r.url()); });
  page.on('pageerror', (e) => problems.push(`${w}: помилка сторінки ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`${w}: консоль ${m.text()}`); });
  const shot = (name) => page.screenshot({ path: `screenshots/t1-${name}-${w}.png` });
  const check = async (name) => { const o = await overflow(page); if (o) problems.push(`${w} ${name}: виходить за межі: ${o}`); };

  await page.goto(base); await page.evaluate(() => localStorage.clear()); await page.reload();

  // 1–2 клас (щоб бачити змішані картки й перевірити, що дитячий шлях живий)
  await page.click('[data-go="new"]'); await page.fill('.name-input', 'Соня'); await page.click('[data-act="name-next"]');
  await shot('class-step'); await check('class-step');
  await page.click('[data-level-pick="3-4"]'); await page.click('.avatar-pick >> nth=0'); await page.click('[data-act="avatar-next"]');
  await page.waitForSelector('.screen-map');
  // трішки прогресу, щоб перевірити зміну класу
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('klaviaturka.v1')); d.profiles[0].progress.ua = { 1: 3, 2: 2, 3: 3 }; d.profiles[0].stats.typed = 120;
    localStorage.setItem('klaviaturka.v1', JSON.stringify(d));
  });

  // Три учні 5–6 класів: по одному в кожному світі
  const names = ['Олекса', 'Дарина', 'Тимур'];
  for (let i = 0; i < 3; i++) {
    await page.goto(base); await page.waitForSelector('[data-go="new"]');
    await page.click('[data-go="new"]'); await page.fill('.name-input', names[i]); await page.click('[data-act="name-next"]');
    await page.click(`[data-level-pick="${i === 1 ? 6 : 5}"]`);
    await page.waitForSelector('[data-pick-world]');
    if (i === 0) { await shot('pick-new'); await check('pick-new'); }
    await page.click(`[data-pick-world="${WORLDS[i]}"]`);
    await page.waitForSelector(`.cn-${WORLDS[i]}`);
    ok(page.url().endsWith('#teen'), `${WORLDS[i]}: після створення має відкритись #teen, а відкрилось ${page.url()}`);
  }
  let profiles = await store(page);
  ok(profiles.length === 4 && profiles.slice(1).every((p, i) => p.world === WORLDS[i] && ['5', '6'].includes(p.level)), 'профілі 5–6 збережені без світу чи класу');

  // «Хто ти?»: доросліші картки з героєм
  await page.goto(base); await page.waitForSelector('.profile-card.is-teen');
  await shot('profiles'); await check('profiles');
  ok((await page.locator('.profile-card.is-teen .hero-icon svg').count()) === 3, 'у картках 5–6 класу немає героя');
  ok((await page.locator('.profile-card:not(.is-teen):not(.is-new) svg').count()) >= 1, 'картка дитини 3–4 класу втратила тваринку');

  // Кожен світ: чотири розділи
  for (let i = 0; i < 3; i++) {
    const world = WORLDS[i];
    await page.goto(base); await page.waitForSelector('.profile-card.is-teen');
    await page.click(`.profile-card.is-teen >> nth=${i}`);
    await page.waitForSelector(`.cn-${world}`);
    for (const tab of ['', 'avatar', 'type', 'rewards']) {
      await page.goto(`${base}#teen${tab ? '/' + tab : ''}`); await page.waitForSelector(`.cn-${world}`); await page.waitForTimeout(120);
      await shot(`${world}-${tab || 'world'}`); await check(`${world}/${tab || 'world'}`);
    }
    // вправа: одна помилка, потім до кінця
    await page.goto(`${base}#teen/type`); await page.waitForSelector('[data-task]');
    const press = (code, key) => page.evaluate(([c, k]) => window.dispatchEvent(new KeyboardEvent('keydown', { code: c, key: k, bubbles: true })), [code, key]);
    for (let n = 0; n < TEXT.length; n++) {
      if (n === 5) { await press('KeyZ', 'я'); if (w === 1366) await shot(`${world}-type-error`); }
      await press(codeOfChar(TEXT[n], 'ua'), TEXT[n]);
    }
    ok(await page.evaluate(() => !document.querySelector('[data-done]').hidden), `${world}: вправа не завершилась`);
    if (w === 1366) await shot(`${world}-type-done`);
    const xp = await page.evaluate(() => document.querySelector('[data-xp-text]').textContent);
    ok(/^0\s*\/\s*500$/.test(xp), `${world}: досвід за пробну вправу змінився (${xp})`);
    ok((await store(page))[i + 1].xp === 0, `${world}: пробна вправа змінила збережений досвід`);
  }

  // Герой, світ, помічник: змінюємо й перевіряємо після перезавантаження
  await page.goto(base); await page.click('.profile-card.is-teen >> nth=0'); await page.waitForSelector('.cn-voxel');
  await page.goto(`${base}#teen/avatar`); await page.waitForSelector('[data-opt]');
  await page.click('[data-opt="hat"][data-val="2"]'); await page.click('[data-opt="outfit"][data-val="3"]');
  await page.click('[data-set-helper="0"]'); await page.waitForTimeout(100);
  await page.goto(base); await page.click('.profile-card.is-teen >> nth=0'); await page.waitForSelector('.cn-voxel'); // як після закриття вкладки
  await page.goto(`${base}#teen/avatar`); await page.waitForSelector('[data-opt]');
  profiles = await store(page);
  ok(profiles[1].hero.hat === 2 && profiles[1].hero.outfit === 3 && profiles[1].helperHidden === true, 'герой/помічник не збереглись');
  ok((await page.locator('[data-opt="hat"][data-val="2"][aria-pressed="true"]').count()) === 1, 'вибраний убір не відмічений після перезавантаження');
  await page.goto(`${base}#teen`); await page.waitForSelector('.cn-voxel');
  ok((await page.locator('[data-act="hide-helper"]').count()) === 0, 'помічник не сховався');
  await shot('voxel-world-no-helper'); await check('voxel-no-helper');
  await page.goto(`${base}#teen/avatar`); await page.click('[data-set-helper="1"]'); await page.goto(`${base}#teen`);
  ok((await page.locator('[data-act="hide-helper"]').count()) === 1, 'помічник не повернувся');
  await page.click('[data-act="hide-helper"]'); ok((await store(page))[1].helperHidden === true, 'кнопка «×» біля помічника не ховає його');
  // змінити світ — прогрес на місці
  await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('klaviaturka.v1')); d.profiles[1].xp = 730; localStorage.setItem('klaviaturka.v1', JSON.stringify(d)); });
  await page.goto(base); await page.reload(); await page.click('.profile-card.is-teen >> nth=0'); await page.waitForSelector('.cn-voxel'); // сховище читається заново
  await page.goto(`${base}#teen/avatar`); await page.waitForSelector('[data-opt]');
  for (const world of ['sky', 'pixel', 'voxel']) {
    await page.click(`[data-set-world="${world}"]`); await page.waitForSelector(`.cn-${world}`);
    const p = (await store(page))[1];
    ok(p.world === world && p.xp === 730 && p.hero.hat === 2, `після зміни світу на ${world} щось втрачено`);
    if (w === 1366 && world === 'sky') await shot('change-world-sky');
  }
  ok((await page.locator('.cn-voxel').count()) === 1 && /Рівень\s*2/.test(await page.locator('.vx-lvl').innerText()), 'рівень за досвідом 730 має бути 2');

  // Для дорослого: зміна класу 3–4 → 5 із підтвердженням, прогрес зберігається, світ обирається при вході
  await page.goto(base); await page.reload(); await page.click('.profile-card:not(.is-teen):not(.is-new) >> nth=0'); await page.waitForSelector('.screen-map');
  await page.goto(`${base}#achievements`); await page.click('[aria-label*="дорослого"], [data-go="adult"]').catch(() => {});
  await page.goto(`${base}#adult`); await page.waitForSelector('.sum-input');
  const sum = (await page.innerText('.adult-sum')).match(/\d+/g).map(Number);
  await page.fill('.sum-input', String(sum[0] * sum[1])); await page.click('[data-act="check"]');
  await page.waitForSelector('[data-set-level]');
  ok((await page.locator('[data-set-level]').count()) === 4, 'у «Для дорослого» має бути 4 класи');
  await page.click('[data-set-level="5"]'); await shot('adult-confirm-level'); await check('adult-confirm');
  await page.click('[data-act="cancel"]');
  ok((await store(page))[0].level === '3-4', 'клас змінився без підтвердження');
  await page.click('[data-set-level="5"]'); await page.click('[data-do="level:5"]');
  const kid = (await store(page))[0];
  ok(kid.level === '5' && kid.progress.ua[1] === 3 && kid.progress.ua[2] === 2 && kid.progress.ua[3] === 3 && kid.stats.typed === 120, 'зміна класу на 5 не зберегла прогрес');
  await page.click('[data-go="teen/pick"]'); await page.waitForSelector('[data-pick-world]');
  await shot('pick-existing'); await check('pick-existing');
  await page.click('[data-pick-world="pixel"]'); await page.waitForSelector('.cn-pixel');
  ok((await store(page))[0].world === 'pixel' && (await store(page))[0].progress.ua[3] === 3, 'вибір світу після зміни класу');
  // дитячі екрани недоступні учневі 5–6
  await page.goto(`${base}#map`); await page.waitForSelector('.cn-pixel');
  // назад на 3–4: прогрес і світ на місці, відкривається дитяча карта
  await page.goto(`${base}#adult`); await page.waitForSelector('.sum-input');
  const s2 = (await page.innerText('.adult-sum')).match(/\d+/g).map(Number);
  await page.fill('.sum-input', String(s2[0] * s2[1])); await page.click('[data-act="check"]');
  await page.click('[data-set-level="3-4"]'); await page.click('[data-do="level:3-4"]');
  await page.goto(base); await page.click('.profile-card:not(.is-teen):not(.is-new) >> nth=0'); await page.waitForSelector('.screen-map');
  ok((await store(page))[0].progress.ua[3] === 3, 'після повернення на 3–4 прогрес втрачено');

  ok(requests.length === 0, `${w}: мережеві запити: ${requests.join(', ')}`);
  await ctx.close();
}
await browser.close();
console.log(problems.length ? 'ПРОБЛЕМИ:\n' + problems.join('\n') : 'Етап Т1: усе гаразд, знімки в screenshots/t1-*');
process.exitCode = problems.length ? 1 : 0;
