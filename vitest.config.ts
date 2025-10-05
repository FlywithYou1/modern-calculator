import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const resolveFromRoot = (relativePath: string) => resolve(rootDir, relativePath)

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      'src-tauri',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**/*',
        'src/tests/**/*',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/**/*',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  // Add types for vitest globals
  define: {
    'import.meta.vitest': undefined,
  },
  resolve: {
    alias: [
      { find: '@/components', replacement: resolveFromRoot('src/components') },
      { find: '@/styles', replacement: resolveFromRoot('src/styles') },
      { find: '@/utils', replacement: resolveFromRoot('src/utils') },
      { find: '@/types', replacement: resolveFromRoot('src/types') },
      { find: '@/mobile', replacement: resolveFromRoot('src/mobile') },
      { find: '@/tests', replacement: resolveFromRoot('src/tests') },
      { find: '@', replacement: resolveFromRoot('src') },
    ],
  },
})