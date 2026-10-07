import { SFX_KEY } from './settings.js';

// Звукові ефекти через Web Audio API: усе синтезується, аудіофайлів немає.
// Звуки м'які й короткі; «помилки» немає — підказка звучить спокійно і не нижче за дзвінкі звуки успіху.
// Нічого не ламається, якщо звуку немає: усі звернення в try/catch.

// Ноти (Гц)
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, A5 = 880, D5 = 587.33;

// Кожен звук — список «тонів»: частота, початок (с), тривалість (с), гучність, тип хвилі
const SOUNDS = {
  tap: () => [{ f: A5, d: 0.05, v: 0.07, type: 'triangle' }], // правильна клавіша: легке «тік»
  hint: () => [{ f: D5, d: 0.16, v: 0.09, type: 'sine' }, { f: C5, t: 0.09, d: 0.2, v: 0.07, type: 'sine' }], // м'яке «бом-бом», не сумне
  step: () => [{ f: C5, d: 0.12, v: 0.12 }, { f: E5, t: 0.09, d: 0.18, v: 0.12 }], // вправу зроблено
  click: () => [{ f: 440, d: 0.05, v: 0.07, type: 'triangle' }], // кнопки
  pop: () => [{ f: 660, d: 0.08, v: 0.1, type: 'triangle' }, { f: 990, t: 0.05, d: 0.12, v: 0.08, type: 'sine' }], // кулька лопнула / літеру спіймано
  badge: () => [C6, G5, C6, E5 * 2].map((f, i) => ({ f, t: i * 0.09, d: 0.2, v: 0.1, type: 'sine' })), // значок: іскорки
};
const starsSound = (n) => {
  const notes = [C5, E5, G5].slice(0, Math.max(1, Math.min(3, n)));
  const tones = notes.map((f, i) => ({ f, t: i * 0.16, d: 0.3, v: 0.13, type: 'triangle' }));
  if (n >= 3) tones.push({ f: C6, t: 0.5, d: 0.6, v: 0.13, type: 'triangle' }, { f: G5, t: 0.5, d: 0.6, v: 0.07, type: 'sine' });
  return tones;
};

export const SOUND_NAMES = [...Object.keys(SOUNDS), 'stars'];

// Фабрика потрібна для тестів: туди підставляють «несправжній» звук і сховище
export function createSfx({ makeContext = defaultContext, storage = safeStorage() } = {}) {
  let ctx = null;
  let master = null;
  let broken = false;
  let enabled = true;
  const listeners = new Set();

  try { enabled = storage?.getItem(SFX_KEY) !== 'off'; } catch { /* сховища немає — звук увімкнено */ }

  // Звук можна запускати лише після дії дитини (правило браузера), тому контекст створюємо ліниво
  function ensure() {
    if (broken) return null;
    try {
      if (!ctx) {
        ctx = makeContext();
        if (!ctx) { broken = true; return null; }
        master = ctx.createGain();
        master.gain.value = 0.6;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume?.();
      return ctx;
    } catch {
      broken = true;
      return null;
    }
  }

  function play(name, arg) {
    if (!enabled) return false;
    const make = name === 'stars' ? () => starsSound(arg ?? 1) : SOUNDS[name];
    if (!make) return false;
    const c = ensure();
    if (!c) return false;
    try {
      const now = c.currentTime;
      for (const { f, t = 0, d, v, type = 'sine' } of make()) {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.value = f;
        const at = now + t;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(v, at + 0.008); // без «клацання» на початку
        gain.gain.exponentialRampToValueAtTime(0.0001, at + d);
        osc.connect(gain);
        gain.connect(master);
        osc.start(at);
        osc.stop(at + d + 0.02);
      }
      return true;
    } catch {
      return false;
    }
  }

  function setEnabled(on) {
    enabled = !!on;
    try { storage?.setItem(SFX_KEY, enabled ? 'on' : 'off'); } catch { /* не збережеться — не страшно */ }
    if (enabled) play('click'); // коротке «тік» підтверджує, що звук увімкнено
    listeners.forEach((fn) => fn(enabled));
  }

  return {
    play,
    ensure,
    setEnabled,
    isEnabled: () => enabled,
    onChange: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

function defaultContext() {
  const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  return AC ? new AC() : null;
}
function safeStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}

export const sfx = createSfx();
export const playSfx = (name, arg) => sfx.play(name, arg);
