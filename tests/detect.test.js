import { describe, it, expect } from 'vitest';
import { classifyKey, scriptOf } from '../src/keyboard/detect.js';
import { ROWS, codeOfChar } from '../src/keyboard/layouts.js';
import { fingerOf } from '../src/keyboard/fingers.js';
import { deltaE, labOf } from '../src/design/color-utils.js';
import { readFileSync } from 'node:fs';

const ev = (key, extra = {}) => ({ key, code: 'KeyA', repeat: false, ctrlKey: false, altKey: false, metaKey: false, ...extra });

describe('розпізнавання неправильної розкладки', () => {
  it('кирилиця при очікуваній кирилиці — звичайне натискання', () => {
    expect(classifyKey(ev('ф'), 'ua')).toBe('ok');
    expect(classifyKey(ev('Ї'), 'ua')).toBe('ok');
    expect(classifyKey(ev('ґ'), 'ua')).toBe('ok');
  });
  it('латиниця при очікуваній латиниці — звичайне натискання', () => {
    expect(classifyKey(ev('a'), 'en')).toBe('ok');
    expect(classifyKey(ev('A'), 'en')).toBe('ok');
  });
  it('латиниця замість кирилиці й навпаки — неправильна розкладка, а не помилка', () => {
    expect(classifyKey(ev('a'), 'ua')).toBe('wrong-layout');
    expect(classifyKey(ev('ф'), 'en')).toBe('wrong-layout');
  });
  it('цифри, знаки, пробіл — інші клавіші', () => {
    for (const key of ['1', ',', ' ', 'Enter', 'Backspace', '/', ';']) {
      expect(classifyKey(ev(key), 'ua'), key).toBe('other');
      expect(classifyKey(ev(key), 'en'), key).toBe('other');
    }
  });
  it('автоповтор, Shift/Caps, поєднання з Ctrl/Alt/Meta ігноруються', () => {
    expect(classifyKey(ev('ф', { repeat: true }), 'ua')).toBe('ignore');
    expect(classifyKey(ev('Shift'), 'ua')).toBe('ignore');
    expect(classifyKey(ev('CapsLock'), 'en')).toBe('ignore');
    expect(classifyKey(ev('c', { ctrlKey: true }), 'en')).toBe('ignore');
    expect(classifyKey(ev('Shift', { altKey: true }), 'ua')).toBe('ignore');
    expect(classifyKey(ev('a', { metaKey: true }), 'en')).toBe('ignore');
  });
  it('алфавіти розрізняються (і, ї, є — кирилиця)', () => {
    expect(scriptOf('і')).toBe('cyr');
    expect(scriptOf('Є')).toBe('cyr');
    expect(scriptOf('i')).toBe('lat');
    expect(scriptOf('1')).toBe(null);
    expect(scriptOf('ab')).toBe(null);
  });
});

describe('пальці за літерами (таблиця з навички typing-pedagogy)', () => {
  const UA = { lp: 'ЙФЯ', lr: 'ЦІЧ', lm: 'УВС', li: 'КЕАПМИ', ri: 'НГОРТЬ', rm: 'ШЛБ', rr: 'ЩДЮ', rp: 'ЗХЇЖЄ.' };
  const EN = { lp: 'QAZ', lr: 'WSX', lm: 'EDC', li: 'RTFGVB', ri: 'YUJHNM', rm: 'IK,', rr: 'OL.', rp: 'P[];\'/' };
  for (const [layout, table] of [['ua', UA], ['en', EN]]) {
    it(`розкладка ${layout}: кожна літера на своєму пальці`, () => {
      for (const [finger, chars] of Object.entries(table)) {
        for (const ch of chars) {
          const code = codeOfChar(ch, layout);
          expect(code, `${layout} ${ch}`).not.toBeNull();
          expect(fingerOf(code), `${layout} ${ch}`).toBe(finger);
        }
      }
    });
  }
  it('codeOfChar не залежить від регістру і не знає чужих символів', () => {
    expect(codeOfChar('о', 'ua')).toBe('KeyJ');
    expect(codeOfChar('О', 'ua')).toBe('KeyJ');
    expect(codeOfChar('o', 'en')).toBe('KeyO');
    expect(codeOfChar('ф', 'en')).toBeNull();
  });
  it('усі клавіші мають підпис для обох розкладок (крім Ґ і апострофа)', () => {
    for (const k of ROWS.flat()) expect(typeof k.ua).toBe('string');
  });
});

describe('однакова насиченість блідих клавіш', () => {
  const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
  const pale = [...css.matchAll(/--finger-(l[prmi]|r[imrp])-pale:\s*(#[0-9a-f]{6})/gi)].map((m) => m[2]);
  const chroma = (hex) => { const [, a, b] = labOf(hex); return Math.hypot(a, b); };
  it('вісім блідих відтінків лишаються в одній смузі насиченості (розкид ≤ 14; раніше було 22)', () => {
    expect(pale.length).toBe(8);
    const cs = pale.map(chroma);
    expect(Math.max(...cs) - Math.min(...cs)).toBeLessThanOrEqual(14);
  });
  it('і при цьому всі різняться', () => {
    expect(deltaE(pale[0], pale[6], 'tritanopia')).toBeGreaterThan(12);
  });
});
