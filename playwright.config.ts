import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  workers: process.env.CI ? 3 : 4,
  retries: process.env.CI ? 1 : 0,
  testIgnore: /auth\.setup\.ts/, // prevent setup file from running in main project
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: bypass
      ? {
          'x-vercel-protection-bypass': bypass,
          'x-vercel-set-bypass-cookie': 'true',
        }
      : undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command:
      process.platform === 'win32'
        ? 'set NEXT_PUBLIC_E2E=1&& npm run dev -- -p 3000'
        : 'NEXT_PUBLIC_E2E=1 npm run dev -- -p 3000',
    url: 'http://127.0.0.1:3000',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
