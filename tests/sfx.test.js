import { describe, it, expect } from 'vitest';
import { createSfx, SOUND_NAMES } from '../src/audio/sfx.js';
import { SFX_KEY, PHRASE_SPEECH } from '../src/audio/settings.js';
import { speak } from '../src/audio/speech.js';
import { speakButton, bubble, soundButton } from '../src/screens/common.js';

// «Несправжній» звук: рахує створені тони
function fakeContext() {
  const made = { osc: 0, started: 0 };
  const node = () => ({ connect() {}, gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} } });
  const ctx = {
    state: 'running', currentTime: 0, destination: {}, made,
    createGain: node,
    createOscillator: () => { made.osc += 1; return { ...node(), frequency: {}, start() { made.started += 1; }, stop() {} }; },
  };
  return ctx;
}
const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), m }; };

describe('звукові ефекти', () => {
  it('кожен звук грає, поки звук увімкнено', () => {
    const ctx = fakeContext();
    const s = createSfx({ makeContext: () => ctx, storage: memory() });
    for (const n of SOUND_NAMES) expect(s.play(n, 3), n).toBe(true);
    expect(ctx.made.started).toBeGreaterThan(SOUND_NAMES.length);
  });
  it('вимкнений звук мовчить і запам’ятовується', () => {
    const st = memory();
    const ctx = fakeContext();
    const s = createSfx({ makeContext: () => ctx, storage: st });
    s.setEnabled(false);
    expect(s.play('tap')).toBe(false);
    expect(ctx.made.osc).toBe(0);
    expect(st.m.get(SFX_KEY)).toBe('off');
    expect(createSfx({ makeContext: () => ctx, storage: st }).isEnabled()).toBe(false); // новий запуск пам’ятає вибір
  });
  it('без Web Audio або без сховища нічого не ламається', () => {
    const s = createSfx({ makeContext: () => null, storage: null });
    expect(s.play('tap')).toBe(false);
    const bad = { getItem() { throw new Error('заборонено'); }, setItem() { throw new Error('заборонено'); } };
    const s2 = createSfx({ makeContext: () => { throw new Error('нема'); }, storage: bad });
    expect(() => { s2.setEnabled(false); s2.play('tap'); }).not.toThrow();
  });
  it('невідомий звук — нічого', () => {
    expect(createSfx({ makeContext: fakeContext, storage: memory() }).play('нема')).toBe(false);
  });
});

describe('озвучка фраз і перемикач звуку', () => {
  it('озвучка фраз доступна, кнопки-динаміки є (прапорець PHRASE_SPEECH)', () => {
    expect(PHRASE_SPEECH).toBe(true);
    expect(speakButton()).toContain('<button');
    expect(bubble('Привіт', { speak: true })).toContain('<button');
    expect(bubble('Привіт', { speak: false })).not.toContain('<button');
    expect(typeof speak).toBe('function');
  });
  it('перемикач звуку є і має підпис', () => {
    expect(soundButton()).toContain('data-sound');
    expect(soundButton()).toContain('aria-label="Звуки');
  });
});
