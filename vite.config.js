import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Збірка в ОДИН файл docs/index.html: шрифти, стилі й скрипти всередині
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
  test: { include: ['tests/**/*.test.js'] },
});
