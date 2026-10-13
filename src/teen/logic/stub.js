// Заглушки до Етапу Т6: карта світів, квести й нагороди поки статичні.
// Для справжнього профілю — «порожній» прогрес (нічого не виконано). Для демо-сторінки #concepts — приклад.
const WORLD_LIST = [
  { name: 'Зелена долина', sub: 'Основний ряд' },
  { name: 'Кам’яні гори', sub: 'Верхній ряд' },
  { name: 'Піщаний берег', sub: 'Нижній ряд' },
  { name: 'Цифровий ліс', sub: 'Цифри й символи' },
  { name: 'Місто знаків', sub: 'Розділові знаки' },
  { name: 'Вершина швидкості', sub: 'Випробування на час' },
];
const REWARD_NAMES = ['Перша вправа', 'Без помилок', 'Основний ряд', 'Дві мови', 'Верхній ряд', 'Нижній ряд', 'Цифри', 'Знаки', 'Точність 98%', '150 знаків за хвилину', 'Усі світи', 'Майстер друку'];

export function emptyProgress() {
  return {
    worlds: WORLD_LIST.map((w, i) => ({ ...w, state: i === 0 ? 'now' : 'locked', pct: 0 })),
    quests: [
      { t: 'Надрукуй 3 слова без помилок', now: '0 з 3', xp: 30 },
      { t: 'Досягни точності 95%', now: '—', xp: 50 },
      { t: 'Пройди 2 вправи сьогодні', now: '0 з 2', xp: 40 },
    ],
    rewards: REWARD_NAMES.map((name) => ({ name, got: false })),
  };
}

export function sampleProgress() {
  const p = emptyProgress();
  p.worlds[0].state = 'done'; p.worlds[0].pct = 100;
  p.worlds[1].state = 'now'; p.worlds[1].pct = 60;
  p.quests[0] = { t: p.quests[0].t, done: true, xp: 30 };
  p.quests[1].now = '92 з 95'; p.quests[2].now = '1 з 2';
  p.rewards.forEach((r, i) => { r.got = i < 4; });
  return p;
}
