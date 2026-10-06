// Допоміжні функції для перевірки кольорів (дальтонізм, різниця кольорів).
// Не потрапляють у збірку, використовуються лише тестами й скриптом перевірки.

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp = (v) => Math.min(1, Math.max(0, v));

// Матриці Machado et al. (2009), повна вираженість, у лінійному RGB
export const CVD_MATRICES = {
  normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};

export function simulate(rgb, kind) {
  const lin = rgb.map(toLinear);
  const m = CVD_MATRICES[kind];
  return m.map((row) => clamp(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]));
}

// linear RGB -> CIE Lab (D65)
export function linearToLab(lin) {
  const [r, g, b] = lin;
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function labOf(hex, kind = 'normal') {
  return linearToLab(simulate(hexToRgb(hex), kind));
}

// Проста евклідова різниця у Lab (ΔE76) — для наших цілей достатньо
export function deltaE(hexA, hexB, kind = 'normal') {
  const a = labOf(hexA, kind);
  const b = labOf(hexB, kind);
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

// Змішування з білим: amount 0 = колір, 1 = білий
export function tint(hex, amount) {
  const rgb = hexToRgb(hex).map((c) => c + (1 - c) * amount);
  return '#' + rgb.map((c) => Math.round(clamp(c) * 255).toString(16).padStart(2, '0')).join('');
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(hexA, hexB) {
  const [a, b] = [luminance(hexA), luminance(hexB)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

export { toGamma };
