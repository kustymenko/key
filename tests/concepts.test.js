// Демонстраційні концепції 5–6 класів: адреси, відсутність мережі й чужих назв, герой змінюється
import { describe, it, expect } from 'vitest';
import { conceptRoute, conceptScreen, CONCEPTS } from '../src/concepts/index.js';
import { av, TEXT } from '../src/concepts/shared.js';
import { codeOfChar } from '../src/keyboard/layouts.js';
import { fingerOf } from '../src/keyboard/fingers.js';

const TABS = ['world', 'avatar', 'type', 'rewards'];

describe('концепції стилю для 5–6 класів', () => {
  it('адреси розпізнаються, чужі — ні', () => {
    expect(conceptRoute('concepts')).toEqual({ menu: true });
    expect(conceptRoute('voxel')).toEqual({ id: 'voxel', tab: 'world' });
    expect(conceptRoute('sky/type')).toEqual({ id: 'sky', tab: 'type' });
    for (const bad of ['', 'map', 'lesson', 'pixel/nope', 'demo']) expect(conceptRoute(bad)).toBeNull();
  });

  it('кожен екран кожної концепції малюється без помилок і без зовнішніх посилань', () => {
    for (const id of Object.keys(CONCEPTS)) for (const tab of TABS) {
      const html = conceptScreen({ id, tab });
      expect(html.length).toBeGreaterThan(500);
      expect(html).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
      expect(html).not.toMatch(/undefined|NaN|\[object/);
    }
    expect(conceptScreen({ menu: true })).toContain('Обери свій світ');
  });

  it('на екрані друку є клавіатура з кольорами пальців і долоні', () => {
    for (const id of Object.keys(CONCEPTS)) {
      const html = conceptScreen({ id, tab: 'type' });
      expect(html).toContain('data-code="KeyF"');
      expect(html).toContain('class="hands');
      expect(html).toContain('data-task');
    }
  });

  it('усі літери вправи мають клавішу й палець', () => {
    for (const ch of TEXT) {
      const code = codeOfChar(ch, 'ua');
      expect(code, ch).toBeTruthy();
      expect(fingerOf(code), ch).toBeTruthy();
    }
  });

  it('вигляд героя міняється разом із вибором', () => {
    const before = CONCEPTS.pixel.avatarSvg();
    av.outfit = (av.outfit + 1) % 5;
    expect(CONCEPTS.pixel.avatarSvg()).not.toBe(before);
    const v = CONCEPTS.voxel.avatarSvg();
    av.hat = (av.hat + 1) % 4;
    expect(CONCEPTS.voxel.avatarSvg()).not.toBe(v);
    const s = CONCEPTS.sky.avatarSvg();
    av.skin = (av.skin + 1) % 4;
    expect(CONCEPTS.sky.avatarSvg()).not.toBe(s);
  });
});
