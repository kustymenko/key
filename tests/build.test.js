import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

// Перевірка зібраного файлу: один файл, без зовнішніх посилань
describe('збірка docs/index.html', () => {
  const dir = new URL('../docs/', import.meta.url);
  it.skipIf(!existsSync(dir))('у docs/ лише index.html', () => {
    expect(readdirSync(dir)).toEqual(['index.html']);
  });
  it.skipIf(!existsSync(new URL('index.html', dir)))('немає зовнішніх адрес у src/href/url()', () => {
    const html = readFileSync(new URL('index.html', dir), 'utf8');
    expect(html).not.toMatch(/(src|href)=["']https?:/);
    expect(html).not.toMatch(/url\(\s*["']?https?:/);
    expect(html).not.toMatch(/@import\s+url\(["']?https?:/);
  });
});
