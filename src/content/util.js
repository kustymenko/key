// Допоміжне для банків слів: розбити рядок на слова з позначками і прибрати повтори.
export const T = (level, theme, text) => text.split(/\s+/).filter(Boolean).map((w) => ({ w, level, theme }));

export const uniq = (items) => {
  const seen = new Set();
  return items.filter((x) => !seen.has(x.w + x.level) && seen.add(x.w + x.level));
};
