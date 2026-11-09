import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '~platform': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    env: {
      VITE_API_URL: 'http://localhost:4000',
      VITE_APP_BASE_URL: 'http://localhost:8001',
      VITE_MAIN_PAGE_BASE_URL: 'http://localhost:8000',
    },
    passWithNoTests: true,
  },
})
