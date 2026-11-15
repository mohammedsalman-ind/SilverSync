import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/services/**', 'src/utils/**', 'src/middleware/**', 'src/repositories/**'],
    },
    setupFiles: ['./src/tests/setup.ts'],
  },
});
