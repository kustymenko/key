import { describe, it, expect } from 'vitest';
import { LESSON1 } from '../src/lessons/lesson1.js';
import { createExercise, pressChar, currentChar } from '../src/lessons/exercise.js';
import { starsFor } from '../src/lessons/stars.js';
import { codeOfChar } from '../src/keyboard/layouts.js';
import { fingerOf } from '../src/keyboard/fingers.js';
import { DONE_PHRASES, pickPhrase, fill } from '../src/content/phrases.js';

describe('урок 1', () => {
  for (const layout of ['ua', 'en']) {
    const lesson = LESSON1[layout];
    it(`${layout}: вправи лише з літер уроку, 5–7 символів`, () => {
      for (const s of lesson.steps.filter((x) => x.kind === 'drill')) {
        expect(s.text.length).toBeGreaterThanOrEqual(5);
        expect(s.text.length).toBeLessThanOrEqual(7); // більше не вміщається на сцені
        expect([...s.text].every((c) => lesson.letters.includes(c))).toBe(true);
      }
    });
    it(`${layout}: літери на вказівних пальцях основного ряду`, () => {
      expect(lesson.letters.map((c) => fingerOf(codeOfChar(c, layout)))).toEqual(['li', 'ri']);
    });
    it(`${layout}: спочатку знайомство з обома літерами, потім вправи`, () => {
      expect(lesson.steps.slice(0, 2).map((s) => s.kind)).toEqual(['intro', 'intro']);
      expect(lesson.steps.slice(2).every((s) => s.kind === 'drill')).toBe(true);
    });
  }
});

describe('вправа', () => {
  it('правильні клавіші рухають курсор і закінчують вправу', () => {
    let st = createExercise('ао');
    let r = pressChar(st, 'а'); st = r.state;
    expect(r.result).toBe('ok');
    expect(currentChar(st)).toBe('о');
    r = pressChar(st, 'О'); // велика літера теж зараховується
    expect(r.result).toBe('done');
    expect(r.state.errors).toBe(0);
  });
  it('помилка не рухає курсор і рахується', () => {
    const r = pressChar(createExercise('а'), 'б');
    expect(r.result).toBe('error');
    expect(r.state.pos).toBe(0);
    expect(r.state.errors).toBe(1);
  });
  it('помилки поспіль рахуються, правильна клавіша скидає серію', () => {
    let st = createExercise('аа');
    for (let i = 0; i < 3; i++) st = pressChar(st, 'x').state;
    expect(st.streak).toBe(3);
    st = pressChar(st, 'а').state;
    expect(st.streak).toBe(0);
    expect(st.errors).toBe(3);
  });
});

describe('зірочки', () => {
  it('1–2 клас: за кількістю помилок', () => {
    expect([0, 2, 3, 6, 7, 40].map((errors) => starsFor({ level: '1-2', errors }))).toEqual([3, 3, 2, 2, 1, 1]);
  });
  it('3–4 клас: за точністю', () => {
    expect(starsFor({ level: '3-4', errors: 0, total: 40 })).toBe(3);
    expect(starsFor({ level: '3-4', errors: 2, total: 38 })).toBe(3); // 95%
    expect(starsFor({ level: '3-4', errors: 4, total: 36 })).toBe(2); // 90%
    expect(starsFor({ level: '3-4', errors: 20, total: 20 })).toBe(1);
  });
  it('завжди хоча б одна', () => {
    expect(starsFor({ level: '1-2', errors: 999 })).toBe(1);
    expect(starsFor({ level: '3-4', errors: 999, total: 0 })).toBe(1);
  });
});

describe('фрази Клавика', () => {
  it('для 1–2 класу не довші за 5 слів без підстановки літер', () => {
    for (const list of Object.values(DONE_PHRASES))
      for (const p of list) expect(fill(p, { letters: 'А і О' }).split(/\s+/).length).toBeLessThanOrEqual(5);
  });
  it('не повторює попередню фразу', () => {
    const list = DONE_PHRASES[3];
    for (let i = 0; i < 50; i++) expect(pickPhrase(list, list[0])).not.toBe(list[0]);
  });
});
