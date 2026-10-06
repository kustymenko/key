import { awardBadges } from './badges.js';

// Профілі й прогрес у localStorage. Кожне звернення — в try/catch:
// якщо сховище недоступне (приватне вікно, заборона, переповнення), тренажер працює далі, але без збереження.
export const KEY = 'klaviaturka.v1';
export const MAX_PROFILES = 17;
export const MAX_NAME = 12;
export const LEVELS = ['1-2', '3-4'];
export const LAYOUTS = ['ua', 'en'];

const emptyStats = () => ({ typed: 0, errors: 0, ms: 0, chars: 0, missed: {} });
const num = (v) => (Number.isFinite(v) && v >= 0 ? v : 0);

// Приводимо дані з сховища до безпечного вигляду (зіпсований запис не ламає тренажер)
export function cleanProfile(p) {
  if (!p || typeof p !== 'object' || typeof p.id !== 'string') return null;
  const progress = { ua: {}, en: {} };
  for (const lay of LAYOUTS) {
    for (const [id, n] of Object.entries(p.progress?.[lay] ?? {})) if ([1, 2, 3].includes(n)) progress[lay][id] = n;
  }
  const s = p.stats ?? {};
  const missed = {};
  for (const [ch, n] of Object.entries(s.missed ?? {})) if (num(n)) missed[ch] = n;
  const badges = {};
  for (const [id, t] of Object.entries(p.badges ?? {})) if (Number.isFinite(t)) badges[id] = t;
  return {
    id: p.id,
    name: String(p.name ?? '').slice(0, MAX_NAME) || '?',
    avatar: typeof p.avatar === 'string' ? p.avatar : 'fox',
    level: LEVELS.includes(p.level) ? p.level : '1-2',
    layout: LAYOUTS.includes(p.layout) ? p.layout : 'ua',
    progress,
    stats: { typed: num(s.typed), errors: num(s.errors), ms: num(s.ms), chars: num(s.chars), missed },
    badges,
    flags: { clean: !!p.flags?.clean },
    resume: p.resume && typeof p.resume === 'object' && Array.isArray(p.resume.steps) ? p.resume : null,
  };
}

function safeStorage() {
  try { return window.localStorage; } catch { return null; }
}

// store.persistent — чи вдалося зберегти востаннє (для м'якого повідомлення дорослому)
export function createStore(storage = safeStorage()) {
  let profiles = [];
  let persistent = !!storage;

  function load() {
    try {
      const raw = storage?.getItem(KEY);
      const data = raw ? JSON.parse(raw) : null;
      profiles = (Array.isArray(data?.profiles) ? data.profiles : []).map(cleanProfile).filter(Boolean);
    } catch {
      profiles = [];
      persistent = false;
    }
  }

  function save() {
    try {
      if (!storage) throw new Error('немає сховища');
      storage.setItem(KEY, JSON.stringify({ v: 1, profiles }));
      persistent = true;
    } catch {
      persistent = false;
    }
  }

  try { // перевірка: чи справді можна писати (приватне вікно, заборона)
    storage?.setItem(`${KEY}.probe`, '1');
    storage?.removeItem(`${KEY}.probe`);
  } catch { persistent = false; }
  load();

  const find = (id) => profiles.find((p) => p.id === id) ?? null;
  const api = {
    get persistent() { return persistent; },
    list: () => profiles,
    get: find,
    canCreate: () => profiles.length < MAX_PROFILES,

    create({ name, avatar, level = '1-2', layout = 'ua' }) {
      const clean = String(name).trim().slice(0, MAX_NAME);
      if (!clean || !api.canCreate()) return null;
      const p = cleanProfile({ id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name: clean, avatar, level, layout });
      profiles.push(p);
      save();
      return p;
    },

    update(id, patch) {
      const p = find(id);
      if (!p) return null;
      if (LEVELS.includes(patch.level)) p.level = patch.level;
      if (LAYOUTS.includes(patch.layout)) p.layout = patch.layout;
      save();
      return p;
    },

    // Прогрес після кожної вправи: додаємо статистику й запам'ятовуємо, де зупинилась дитина
    saveStep(id, { typed, errors, ms, chars, missed, resume }) {
      const p = find(id);
      if (!p) return;
      const s = p.stats;
      s.typed += typed; s.errors += errors; s.ms += ms; s.chars += chars;
      for (const [ch, n] of Object.entries(missed ?? {})) s.missed[ch] = (s.missed[ch] ?? 0) + n;
      p.resume = resume ?? null;
      save();
    },

    // Урок завершено: зірочки (лише більше за попередні), значки; повертає id нових значків
    finishLesson(id, { layout, lessonId, stars, errors }) {
      const p = find(id);
      if (!p) return [];
      p.progress[layout][lessonId] = Math.max(p.progress[layout][lessonId] ?? 0, stars);
      if (errors === 0) p.flags.clean = true;
      p.resume = null;
      const fresh = awardBadges(p);
      save();
      return fresh;
    },

    // Скинути прогрес: зірочки, значки, статистика; ім'я, тваринка й рівень лишаються
    resetProgress(id) {
      const p = find(id);
      if (!p) return;
      Object.assign(p, cleanProfile({ id: p.id, name: p.name, avatar: p.avatar, level: p.level, layout: p.layout }));
      save();
    },

    remove(id) {
      profiles = profiles.filter((p) => p.id !== id);
      save();
    },
  };
  return api;
}
