import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'MCP Debug Tests',
    include: [
      'src/tests/mcp.test.ts',
      'src/tests/debugger.test.ts'
    ],
    environment: 'jsdom',
    setupFiles: ['src/tests/setup.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**/*',
        'src/tests/**/*',
        '**/*.d.ts',
        'src-tauri/**/*',
      ],
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: './src' },
    ],
  },
})