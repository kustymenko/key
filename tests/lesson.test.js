import { describe, it, expect } from 'vitest';
import { createExercise, pressChar, currentChar } from '../src/lessons/exercise.js';
import { starsFor } from '../src/lessons/stars.js';
import { DONE_PHRASES, pickPhrase, donePhrase, plural, letterNoun } from '../src/content/phrases.js';
import { accuracy, charsPerMinute, hardLetters, mergeMissed } from '../src/lessons/stats.js';

describe('вправа', () => {
  it('правильні клавіші рухають курсор і закінчують вправу', () => {
    let st = createExercise('ао');
    let r = pressChar(st, 'а'); st = r.state;
    expect(r.result).toBe('ok');
    expect(currentChar(st)).toBe('о');
    r = pressChar(st, 'О'); // для малої літери регістр не важливий
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
  it('велика літера в завданні вимагає Shift: мала не підходить', () => {
    expect(pressChar(createExercise('К'), 'к').result).toBe('error');
    expect(pressChar(createExercise('К'), 'К').result).toBe('done');
  });
  it('запам’ятовує, на яких літерах помилялися', () => {
    let st = createExercise('кк');
    st = pressChar(st, 'н').state;
    st = pressChar(st, 'н').state;
    expect(st.missed).toEqual({ к: 2 });
  });
  it('пробіл — звичайний символ вправи', () => {
    let st = pressChar(createExercise('а о'), 'а').state;
    expect(currentChar(st)).toBe(' ');
    expect(pressChar(st, ' ').result).toBe('ok');
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

describe('статистика 3–4 класу', () => {
  it('точність у відсотках', () => {
    expect(accuracy(95, 5)).toBe(95);
    expect(accuracy(0, 0)).toBe(100);
    expect(accuracy(10, 10)).toBe(50);
  });
  it('знаки за хвилину: 50 символів за 60 секунд = 50', () => {
    expect(charsPerMinute(50, 60000)).toBe(50);
    expect(charsPerMinute(30, 30000)).toBe(60);
    expect(charsPerMinute(30, 0)).toBe(0);
  });
  it('важкі літери: найчастіші, від двох помилок, не більше трьох', () => {
    expect(hardLetters({ к: 5, н: 2, а: 1, о: 3, у: 4 })).toEqual(['к', 'у', 'о']);
    expect(hardLetters({ а: 1 })).toEqual([]);
  });
  it('помилки кількох вправ додаються', () => {
    expect(mergeMissed({ к: 1 }, { к: 2, н: 1 })).toEqual({ к: 3, н: 1 });
  });
});

describe('фрази Клавика', () => {
  it('не повторює попередню фразу', () => {
    const list = DONE_PHRASES['1-2'][3];
    for (let i = 0; i < 50; i++) expect(pickPhrase(list, list[0])).not.toBe(list[0]);
  });
  it('відмінювання біля числа', () => {
    expect([1, 2, 5, 11, 12, 21, 32].map(letterNoun)).toEqual(['літеру', 'літери', 'літер', 'літер', 'літер', 'літеру', 'літери']);
    expect(plural(3, ['помилка', 'помилки', 'помилок'])).toBe('помилки');
  });
  it('1–2 клас: до 5 слів, хвала конкретна (називає літери чи кількість)', () => {
    for (const stars of [1, 2, 3])
      for (const what of ['А і О', 'Є', 'нові клавіші', 'великі літери', 'кому і крапку', null])
        for (let i = 0; i < 20; i++) {
          const p = donePhrase({ level: '1-2', stars, what, count: 8 });
          expect(p.split(/\s+/).length, p).toBeLessThanOrEqual(5);
          expect(p).not.toMatch(/\{|undefined/);
        }
  });
  it('3–4 клас: до 12 слів', () => {
    for (const stars of [1, 2, 3])
      for (let i = 0; i < 20; i++) expect(donePhrase({ level: '3-4', stars, what: 'кому і крапку', count: 32 }).split(/\s+/).length).toBeLessThanOrEqual(12);
  });
  it('для повторення (без нових літер) фрази називають кількість літер', () => {
    for (let i = 0; i < 30; i++) expect(donePhrase({ level: '1-2', stars: 3, what: null, count: 8 })).toMatch(/8/);
  });
  it('усі фрази кінця уроку: нова фраза не з тих, що звучать незавершено', () => {
    const all = Object.values(DONE_PHRASES).flatMap((byStars) => Object.values(byStars).flat());
    expect(all.some((p) => /Ось які/.test(p))).toBe(false);
  });
});
