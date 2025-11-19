/**
 * Vitest
 */

/* Imports */

import { defineConfig } from 'vitest/config'

/* Config */

export default defineConfig({
  test: {
    cache: false,
    globals: true,
    clearMocks: true,
    environment: 'node',
    testTimeout: 10000,
    coverage: {
      reporter: [
        'text'
      ],
      include: [
        'src/**/*.ts'
      ],
      exclude: [
        '**/*.test.ts',
        'src/**/*Types.ts'
      ]
    }
  }
})
