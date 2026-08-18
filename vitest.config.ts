import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Test config, separate from vite.config.ts on purpose.
 *
 * Tests need JSX and the `@` alias and nothing else: no Tailwind pass, no React
 * Compiler babel pass. Leaving those out keeps the suite fast, and keeps a
 * failure in the build pipeline from looking like a failing test.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
    unstubGlobals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
