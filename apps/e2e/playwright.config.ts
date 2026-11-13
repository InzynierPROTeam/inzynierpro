import { defineConfig, devices } from '@playwright/test'
import { Duration } from 'effect'

import { apiUrl, outboxPath, platformUrl } from './src/environment'

const isCI = process.env.CI !== undefined

// Ports differ from local development, so the suite runs beside `pnpm dev`.
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
  forbidOnly: isCI,
  // In CI the retry only records a trace; a test that passes on retry still fails the run.
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
        // Every test reports its own client address; see the `visitor` fixture.
        TRUSTED_CLIENT_IP_HEADER: 'x-forwarded-for',
        E2E_OUTBOX: outboxPath,
      },
      reuseExistingServer: false,
      timeout: Duration.toMillis(Duration.minutes(3)),
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      // A production build served by the Cloudflare runtime, as deployed.
      command:
        'turbo build --filter=@inzpro/platform^... && pnpm --filter @inzpro/platform exec vite build && pnpm --filter @inzpro/platform exec vite preview --port ' +
        platformEnv.PORT +
        ' --strictPort',
      url: platformUrl,
      env: platformEnv,
      reuseExistingServer: false,
      // The production build runs first.
      timeout: Duration.toMillis(Duration.minutes(5)),
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
})
