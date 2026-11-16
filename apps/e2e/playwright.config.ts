import { defineConfig, devices } from '@playwright/test'
import { Duration } from 'effect'

import { apiUrl, outboxPath, platformUrl } from './src/environment'

const isCI = process.env.CI !== undefined

const platformEnv = {
  PORT: new URL(platformUrl).port,
  VITE_API_URL: apiUrl,
  VITE_APP_BASE_URL: platformUrl,
  VITE_MAIN_PAGE_BASE_URL: 'http://localhost:8100',
  VITE_GOOGLE_TAG_MANAGER_ID: '',
  VITE_META_PIXEL_ID: '',
}

export default defineConfig({
  testDir: './src',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  workers: isCI ? 2 : undefined,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  failOnFlakyTests: isCI,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: platformUrl,
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter @inzpro/api e2e:serve',
      url: `${apiUrl}/api/v1/health-check`,
      env: {
        PORT: new URL(apiUrl).port,
        BETTER_AUTH_URL: apiUrl,
        TRUSTED_ORIGINS: platformUrl,
        TRUSTED_CLIENT_IP_HEADER: 'x-forwarded-for',
        E2E_OUTBOX: outboxPath,
      },
      reuseExistingServer: false,
      timeout: Duration.toMillis(Duration.minutes(3)),
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command:
        'turbo build --filter=@inzpro/platform^... && pnpm --filter @inzpro/platform exec vite build && pnpm --filter @inzpro/platform exec vite preview --port ' +
        platformEnv.PORT +
        ' --strictPort',
      url: platformUrl,
      env: platformEnv,
      reuseExistingServer: false,
      timeout: Duration.toMillis(Duration.minutes(5)),
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
})
