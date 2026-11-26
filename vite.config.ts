import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Served from https://iheb-sebai.github.io/iheb-sebai-calculator/ (GitHub Pages).
  base: '/iheb-sebai-calculator/',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
