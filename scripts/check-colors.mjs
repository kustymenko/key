// Перевірка кольорів пальців: різниця між сусідніми пальцями при різних видах дальтонізму.
import { readFileSync } from 'node:fs';
import { deltaE, tint, contrast } from '../src/design/color-utils.js';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const vars = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
const order = ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp'];
const kinds = ['normal', 'protanopia', 'deuteranopia', 'tritanopia'];
let worst = Infinity;
for (let i = 0; i < order.length - 1; i++) {
  const [a, b] = [vars[`finger-${order[i]}`], vars[`finger-${order[i + 1]}`]];
  const row = kinds.map((k) => deltaE(a, b, k).toFixed(0).padStart(3));
  const pale = kinds.map((k) => deltaE(tint(a, 0.6), tint(b, 0.6), k).toFixed(0).padStart(3));
  worst = Math.min(worst, ...kinds.map((k) => deltaE(a, b, k)));
  console.log(`${order[i]}-${order[i + 1]}  насичені: ${row.join(' ')} | бліді: ${pale.join(' ')}`);
}
console.log('найгірша пара (насичені):', worst.toFixed(1));
