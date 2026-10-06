// Перевірка кольорів пальців: різниця між сусідніми пальцями при різних видах дальтонізму.
import { readFileSync } from 'node:fs';
import { deltaE } from '../src/design/color-utils.js';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const vars = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
const order = ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp'];
const kinds = ['normal', 'protanopia', 'deuteranopia', 'tritanopia'];
const pale = order.map((f) => vars[`finger-${f}-pale`]);
const sat = order.map((f) => vars[`finger-${f}`]);
for (const [name, set] of [['насичені', sat], ['бліді', pale]]) {
  let worst = Infinity; let who = '';
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) for (const k of kinds) {
    const d = deltaE(set[i], set[j], k);
    if (d < worst) { worst = d; who = `${order[i]}-${order[j]} (${k})`; }
  }
  console.log(`${name}: найгірша пара з усіх — ${who}, різниця ${worst.toFixed(1)}`);
}
