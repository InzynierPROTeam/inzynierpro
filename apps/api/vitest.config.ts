import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ['src/**/*.test.ts'],
    globalSetup: ['src/test/global-setup.ts'],
    // Files own their accounts, queues and scoped services; reuse imports within each worker.
    isolate: false,
  },
})
