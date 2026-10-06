import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ROWS, lettersOf } from '../src/keyboard/layouts.js';
import { FINGERS, fingerOf } from '../src/keyboard/fingers.js';
import { AVATAR_COLORS } from '../src/character/avatars.js';
import { deltaE, contrast, labOf } from '../src/design/color-utils.js';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const vars = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
const kinds = ['normal', 'protanopia', 'deuteranopia', 'tritanopia'];

describe('карта пальців', () => {
  it('кожна клавіша має рівно один відомий палець', () => {
    const ids = new Set(FINGERS.map((f) => f.id));
    for (const key of ROWS.flat()) {
      expect(ids.has(fingerOf(key.code)), key.code).toBe(true);
    }
  });

  it('літери української розкладки: 32 літери без повторів (без Ґ)', () => {
    const l = lettersOf('ua').map((k) => k.ua);
    expect(l.length).toBe(32);
    expect(new Set(l).size).toBe(32);
  });

  it('літери англійської розкладки: 26 без повторів', () => {
    const l = lettersOf('en').map((k) => k.en);
    expect(new Set(l).size).toBe(26);
  });

  it('коди клавіш не повторюються', () => {
    const codes = ROWS.flat().map((k) => k.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('основний ряд: правильні пальці', () => {
    const want = { KeyA: 'lp', KeyS: 'lr', KeyD: 'lm', KeyF: 'li', KeyJ: 'ri', KeyK: 'rm', KeyL: 'rr', Semicolon: 'rp', Space: 'th' };
    for (const [code, f] of Object.entries(want)) expect(fingerOf(code)).toBe(f);
  });
});

describe('кольори', () => {
  const order = ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp'];
  const finger = order.map((f) => vars[`finger-${f}`]);

  it('сусідні пальці розрізняються (звичайний зір і дальтонізм)', () => {
    for (let i = 0; i < 7; i++) {
      for (const k of kinds) expect(deltaE(finger[i], finger[i + 1], k), `${order[i]}-${order[i + 1]} ${k}`).toBeGreaterThan(30);
    }
  });

  const pale = order.map((f) => vars[`finger-${f}-pale`]);

  it('усі бліді відтінки клавіш існують і не збігаються з насиченими', () => {
    for (const p of pale) expect(p).toMatch(/^#[0-9a-f]{6}$/i);
    order.forEach((f, i) => expect(pale[i]).not.toBe(finger[i]));
  });

  it('БУДЬ-ЯКІ два бліді відтінки розрізняються (звичайний зір і дальтонізм)', () => {
    for (let i = 0; i < 8; i++) {
      for (let j = i + 1; j < 8; j++) {
        for (const k of kinds) {
          expect(deltaE(pale[i], pale[j], k), `${order[i]}-${order[j]} ${k}`).toBeGreaterThan(12);
        }
      }
    }
  });

  it('сусідні бліді відтінки розрізняються ще краще', () => {
    for (let i = 0; i < 7; i++) {
      for (const k of kinds) expect(deltaE(pale[i], pale[i + 1], k), `${order[i]}-${order[i + 1]} ${k}`).toBeGreaterThan(20);
    }
  });

  it('бліді відтінки лишаються того ж тону, що й насичені (±25° за відтінком)', () => {
    const hue = (hex) => { const [, a, b] = labOf(hex); return (Math.atan2(b, a) * 180) / Math.PI; };
    pale.forEach((p, i) => {
      const d = Math.abs(((hue(p) - hue(finger[i]) + 540) % 360) - 180);
      expect(d, order[i]).toBeLessThanOrEqual(25);
    });
  });

  it('кольори інтерфейсу не схожі на кольори пальців', () => {
    const ui = Object.entries(vars).filter(([k]) => k.startsWith('ui-') && !['ui-bg', 'ui-card', 'ui-text', 'ui-key-text', 'ui-line'].includes(k) || k === 'ui-main');
    for (const [name, hex] of ui) {
      for (const f of finger) expect(deltaE(hex, f), `${name} vs ${f}`).toBeGreaterThan(30);
    }
  });

  it('контраст тексту інтерфейсу не менше 4.5', () => {
    expect(contrast(vars['ui-main'], '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrast(vars['ui-text'], vars['ui-bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(vars['ui-text-soft'], vars['ui-bg'])).toBeGreaterThanOrEqual(4.5);
  });

  it('символи на блідих клавішах читаються (контраст ≥ 4.5)', () => {
    for (const f of pale) expect(contrast(vars['ui-key-text'], f)).toBeGreaterThanOrEqual(4.5);
  });

  describe('тепла гама (екрани без клавіатури)', () => {
    const warm = Object.entries(vars).filter(([k]) => k.startsWith('warm-') && !['warm-bg', 'warm-line'].includes(k));

    it('тепла гама не повторює кольори пальців (ΔE ≥ 14)', () => {
      for (const [name, hex] of warm) {
        for (const f of finger) expect(deltaE(hex, f), `${name} vs ${f}`).toBeGreaterThanOrEqual(14);
      }
    });

    it('кольори тварин не повторюють кольори пальців (ΔE ≥ 14)', () => {
      for (const [name, hex] of Object.entries(AVATAR_COLORS)) {
        for (const f of finger) expect(deltaE(hex, f), `${name} ${hex} vs ${f}`).toBeGreaterThanOrEqual(14);
      }
    });

    it('аватарів не менше 8 і всі різні за кольором', () => {
      const colors = Object.values(AVATAR_COLORS);
      expect(colors.length).toBeGreaterThanOrEqual(8);
      expect(new Set(colors).size).toBe(colors.length);
    });

    it('контраст тепла: кнопка і «пройдено» з білим, текст на тлі ≥ 4.5', () => {
      expect(contrast(vars['warm-accent'], '#ffffff')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(vars['warm-done'], '#ffffff')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(vars['warm-text-soft'], vars['warm-bg'])).toBeGreaterThanOrEqual(4.5);
    });
  });
});
