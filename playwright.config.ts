import { defineConfig } from '@playwright/test';

const liveURL = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  projects: liveURL
    ? [{ name: 'production' }]
    : [
        { name: 'production' },
        {
          name: 'development',
          testMatch: '**/stability.spec.ts',
          use: { baseURL: 'http://127.0.0.1:4189' },
        },
      ],
  use: {
    baseURL: liveURL || 'http://127.0.0.1:4188',
    viewport: { width: 1536, height: 1024 },
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  webServer: liveURL
    ? undefined
    : [
        {
          command: 'npm run build && npm run preview -- --port 4188',
          url: 'http://127.0.0.1:4188',
          reuseExistingServer: false,
          timeout: 120000,
        },
        {
          command: 'npm run dev -- --port 4189',
          url: 'http://127.0.0.1:4189',
          reuseExistingServer: false,
          timeout: 30000,
        },
      ],
});
