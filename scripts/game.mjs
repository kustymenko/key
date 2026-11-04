// Етап Т6: ігрова оболонка 5–6 класів наскрізь у кожному світі: node scripts/game.mjs
// Урок → досвід, нове на екрані результату, смуга досвіду, завдання дня, нагороди, закриті й відкриті предмети героя, карта світів; нуль запитів.
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
const profileFor = (i, extra = {}) => ({ id: `p${i}`, name: `Учень${i}`, avatar: 'fox', level: i === 1 ? '6' : '5', world: WORLDS[i % 3], layout: 'ua', placement: { kind: 'zero', source: 'skip', at: 1 }, ...extra });

for (const [w, h] of [[1366, 768], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const requests = [];
  page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) requests.push(r.url()); });
  page.on('pageerror', (e) => problems.push(`${w}: помилка сторінки ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`${w}: консоль ${m.text()}`); });
  const shot = (name) => page.screenshot({ path: `screenshots/t6-${name}-${w}.png` });
  const store = () => page.evaluate(() => JSON.parse(localStorage.getItem('klaviaturka.v1') ?? '{"profiles":[]}').profiles);
  const seed = async (profiles) => { await page.goto(base); await page.evaluate((p) => localStorage.setItem('klaviaturka.v1', JSON.stringify({ v: 1, profiles: p })), profiles); await page.reload(); };
  const open = async (i, hash = 'teen') => { await page.goto(base); await page.reload(); await page.click(`[data-profile="p${i}"]`); await page.waitForTimeout(80); await page.goto(`${base}#${hash}`); await page.waitForTimeout(150); };
  const overflow = () => page.evaluate(() => {
    const st = document.querySelector('.stage')?.getBoundingClientRect(); if (!st) return 'немає сцени';
    const bad = [...document.querySelectorAll('.stage *')].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && getComputedStyle(el).display !== 'none' && !el.closest('svg') && !el.closest('.cm-scale') && !el.closest('.wt-scale') && !el.closest('.cm-num') && (b.right > st.right + 2 || b.bottom > st.bottom + 2 || b.left < st.left - 2 || b.top < st.top - 2); }).map((el) => el.className || el.tagName).slice(0, 4).join(', ');
    const card = document.querySelector('.stage > .screen > [class$="-task"]')?.getBoundingClientRect();
    const ld = document.querySelector('[data-ld]')?.getBoundingClientRect();
    const out = [];
    if (card && ld && ld.height > 0 && (ld.bottom > card.bottom + 1 || ld.top < card.top - 1)) out.push('підсумок не вміщається в картці');
    // тексти не накладаються на сусідні блоки: панелі квестів і нагород не виходять за вікно
    return [bad, ...out].filter(Boolean).join('; ');
  });
  const check = async (name) => { const o = await overflow(); if (o) problems.push(`${w} ${name}: ${o}`); };
  const play = (err = 0) => page.evaluate((errTotal) => {
    let errs = 0;
    for (let guard = 0; guard < 4000; guard++) {
      const done = document.querySelector('[data-done]');
      if (done && !done.hidden && document.querySelector('.ld-h') && !document.querySelector('.li')) return { errs };
      const start = document.querySelector('[data-act="start"]');
      if (start) { start.click(); continue; }
      const c = document.querySelector('.ll-ch.is-current');
      if (!c) return { errs, noCursor: true };
      let k = c.textContent.replace(/ /g, ' ');
      if (k === '␣') k = ' ';
      if (errs < errTotal && guard % 3 === 0) { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ъ', code: 'BracketRight', bubbles: true, cancelable: true })); errs += 1; continue; }
      window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: '', shiftKey: k !== k.toLowerCase(), bubbles: true, cancelable: true }));
    }
    return { errs, stuck: true };
  }, err);
  const text = () => page.evaluate(() => document.querySelector('.stage').innerText.replace(/\s+/g, ' '));

  await seed([0, 1, 2].map((i) => profileFor(i)));
  for (let i = 0; i < 3; i++) {
    const world = WORLDS[i];
    // ---------- 1. Новий учень: нічого вигаданого ----------
    await open(i, 'teen');
    await shot(`${world}-world-new`); await check(`${world}/world-new`);
    ok((await page.locator('a[href="#teen/worlds"]').count()) === 1, `${world}: на карті немає посилання «Світи»`);
    await open(i, 'teen/rewards');
    await shot(`${world}-rewards-new`); await check(`${world}/rewards-new`);
    ok((await text()).includes('0 з 12'), `${world}: у нового учня має бути «0 з 12»`);
    ok((await text()).includes('Пройди будь-який урок'), `${world}: у закритих нагород немає підказки`);
    await open(i, 'teen/avatar');
    await shot(`${world}-avatar-locked`); await check(`${world}/avatar-locked`);
    ok((await page.locator('.is-locked').count()) === 5, `${world}: має бути 5 закритих предметів`);
    ok((await page.locator('button.is-locked:not([aria-disabled])').count()) === 0, `${world}: закритий предмет натискається`);
    await open(i, 'teen/worlds');
    await shot(`${world}-worlds`); await check(`${world}/worlds`);
    ok((await page.locator('[data-world-card]').count()) === 6, `${world}: на карті світів не шість карток`);
    ok((await page.locator('.wl-card.is-locked .wl-hint').count()) === 5, `${world}: у закритих світів немає підказок`);

    // ---------- 2. Урок: досвід, нове, смуга ----------
    await open(i, 'teen/lesson');
    await page.click('[data-act="start"]');
    const r = await play(0);
    ok(!r.stuck && !r.noCursor, `${world}: урок не дійшов до підсумку`);
    await page.waitForTimeout(100);
    const t = await text();
    ok(/Досвід\s*\+\d+/.test(t), `${world}: на підсумку немає «Досвід +N» (${t.slice(0, 160)})`);
    ok(t.includes('Нагороди: Перший урок'), `${world}: немає нагороди «Перший урок»`);
    ok(t.includes('Перший урок, Без помилок'), `${world}: немає нагороди «Без помилок»`);
    await shot(`${world}-result`); await check(`${world}/result`);
    const p1 = (await store())[i];
    ok(p1.xp > 0, `${world}: досвід не збережено`);
    ok(p1.game.clean === true && p1.game.quests.length === 3, `${world}: гра не збережена`);
    const barText = await page.evaluate(() => document.querySelector('[data-xp-text]')?.textContent ?? null);
    if (barText != null) ok(barText.replace(/\s/g, '').startsWith(`${p1.xp % 500}/`), `${world}: смуга досвіду не оновилась (${barText} проти ${p1.xp})`);

    // ---------- 3. Після уроку: нагороди, герой, квести ----------
    await open(i, 'teen/rewards');
    await shot(`${world}-rewards`); await check(`${world}/rewards`);
    ok(!(await text()).includes('0 з 12'), `${world}: нагороди не відкрились`);
    ok((await text()).includes('Предмет: навушники'), `${world}: немає подарунка «навушники»`);
    await open(i, 'teen/avatar');
    await shot(`${world}-avatar`); await check(`${world}/avatar`);
    ok((await page.locator('.is-locked').count()) === 4, `${world}: після «Без помилок» має лишитись 4 закриті предмети`);
    await page.click('button[data-opt="hat"][data-val="4"]');
    ok((await store())[i].hero.hat === 4, `${world}: навушники не вибралися`);
    await page.waitForTimeout(60);
    await shot(`${world}-avatar-headset`);
    // закритий предмет не вибирається: натискання лише показує підказку
    await page.click('button[data-opt="hat"][data-val="5"]', { force: true });
    ok((await page.locator('[data-lockinfo]').innerText()).includes('Досягни 3 рівня'), `${world}: немає підказки до закритої шапки`);
    ok((await store())[i].hero.hat === 4, `${world}: закриту шапку вдалось вибрати`);
    await open(i, 'teen');
    await shot(`${world}-world`); await check(`${world}/world`);
    const quests = (await store())[i].game.quests;
    ok(quests.some((q) => q.prog > 0), `${world}: квести не рухаються`);
    await open(i, 'teen/worlds');
    ok((await page.locator('.wl-card.is-now').count()) === 1, `${world}: немає поточного світу`);
  }
  ok(requests.length === 0, `${w}: мережеві запити: ${requests.join(', ')}`);
  await ctx.close();
}
await browser.close();
if (problems.length) { console.error(`Етап Т6: ${problems.length} проблем(и):\n- ${problems.join('\n- ')}`); process.exit(1); }
console.log('Етап Т6: усе гаразд, знімки в screenshots/t6-*');
