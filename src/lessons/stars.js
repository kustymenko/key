// Зірочки за урок (typing-pedagogy): завжди щонайменше одна.
// 1–2 клас: за кількістю помилок; 3–4 клас: за точністю.
export function starsFor({ level = '1-2', errors = 0, total = 0 }) {
  if (level === '3-4') {
    const acc = total + errors === 0 ? 1 : total / (total + errors);
    return acc >= 0.95 ? 3 : acc >= 0.85 ? 2 : 1;
  }
  return errors <= 2 ? 3 : errors <= 6 ? 2 : 1;
}
