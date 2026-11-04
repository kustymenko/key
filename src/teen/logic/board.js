// Таблиця лідерів ноутбука (Етап Т8) і особистий прогрес. Одна логіка для всіх трьох світів: без DOM і малювання.
// Правила: лише цей ноутбук (дані беруться з профілів, нічого не вивантажується); показуємо ТІЛЬКИ першу п'ятірку;
// останніх місць немає в даних, які віддає ця функція; у таблицю йде лише швидкість при точності ≥ 95%.
// Головне — змагання з собою: рекорд і порівняння з минулими спробами.
import { BOARD_ACC, gradeOf } from './challenge.js';

export const BOARD_SIZE = 5;

/**
 * Перша п'ятірка ноутбука для класу (5 або 6) і мови. enabled=false → нічого не повертає (вимкнено дорослим).
 * Повертає не більше 5 рядків { place, id, name, cpm, acc } — учні поза п'ятіркою в результат не потрапляють взагалі.
 */
export function boardRows(profiles, grade, layout, enabled = true) {
  if (!enabled) return [];
  const g = gradeOf(grade);
  const lay = layout === 'en' ? 'en' : 'ua';
  return (profiles ?? [])
    .filter((p) => p?.level === g && p.challenge?.rec?.[lay]?.topCpm > 0 && p.challenge.rec[lay].topAcc >= BOARD_ACC)
    .map((p) => ({ id: p.id, name: p.name, cpm: p.challenge.rec[lay].topCpm, acc: p.challenge.rec[lay].topAcc }))
    .sort((a, b) => b.cpm - a.cpm || b.acc - a.acc || a.name.localeCompare(b.name, 'uk') || (a.id < b.id ? -1 : 1))
    .slice(0, BOARD_SIZE)
    .map((r, i) => ({ place: i + 1, ...r }));
}

/**
 * Що сказати учневі про його шлях до таблиці (без місця й без порівняння з іншими поза п'ятіркою).
 * Повертає { onBoard, line }.
 */
export function boardNote(profile, rows, layout) {
  const rec = profile?.challenge?.rec?.[layout === 'en' ? 'en' : 'ua'];
  if (rows.some((r) => r.id === profile.id)) return { onBoard: true, line: 'Ти в п’ятірці ноутбука. Головне — перевершити себе.' };
  if (!rec || !rec.runs) return { onBoard: false, line: 'Пройди випробування — і тут з’явиться твій перший результат.' };
  if (!rec.topCpm) return { onBoard: false, line: `Щоб потрапити до таблиці, потрібен результат із точністю від ${BOARD_ACC}%.` };
  if (rows.length < BOARD_SIZE) return { onBoard: false, line: 'У п’ятірці ще є вільні місця.' };
  const gap = Math.max(1, rows[BOARD_SIZE - 1].cpm - rec.topCpm + 1);
  return { onBoard: false, line: `Для таблиці: ${rec.topCpm} знаків за хвилину при точності від ${BOARD_ACC}%. До п’ятірки ще ${gap}.` };
}

/**
 * Прогрес учня порівняно з його власними спробами.
 * { runs, bestCpm, bestAcc, hist (до 12 останніх), last, prev, dCpm, dAcc (остання проти минулої), sinceFirst (кращий проти першої), line }
 */
export function progressOf(rec) {
  const hist = rec?.hist ?? [];
  const out = {
    runs: rec?.runs ?? 0, bestCpm: rec?.bestCpm ?? 0, bestAcc: rec?.bestAcc ?? 0, hist,
    last: hist[hist.length - 1] ?? null, prev: hist[hist.length - 2] ?? null, dCpm: 0, dAcc: 0, sinceFirst: null, line: '',
  };
  if (!out.runs) { out.line = 'Тут буде видно, як ти ростеш від спроби до спроби.'; return out; }
  if (!out.prev) { out.line = 'Це твоя точка відліку. Наступні спроби порівняємо з нею.'; return out; }
  out.dCpm = out.last.cpm - out.prev.cpm;
  out.dAcc = out.last.acc - out.prev.acc;
  // зростання від першої збереженої спроби до найкращої (лише швидкість при гідній точності — рекорд)
  if (hist.length >= 2 && out.bestCpm) out.sinceFirst = Math.max(0, out.bestCpm - hist[0].cpm);
  out.line = out.dCpm > 0 || out.dAcc > 0 ? 'Ти стаєш кращим за себе минулого.' : out.dCpm === 0 && out.dAcc === 0 ? 'Так само, як минулого разу. Стабільність — теж навичка.' : 'Буває по-різному. Дивись на кілька спроб поспіль.';
  return out;
}

export const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
