import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: './',
  plugins: [vue()],
  build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
  test: { include: ['tests/core/**/*.test.ts', 'tests/sim/**/*.test.ts'], environment: 'node' },
} as any);
