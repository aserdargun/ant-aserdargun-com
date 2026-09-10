import { defineConfig } from '@playwright/test';

const liveURL = process.env.PLAYWRIGHT_BASE_URL;
const port = Number(process.env.ANT_E2E_PORT || 4188);
if (!Number.isInteger(port) || port < 1024 || port > 65534)
  throw new Error('ANT_E2E_PORT must be an integer from 1024 to 65534.');
const previewURL = `http://127.0.0.1:${port}`;
const developmentURL = `http://127.0.0.1:${port + 1}`;
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
          use: { baseURL: developmentURL },
        },
      ],
  use: {
    baseURL: liveURL || previewURL,
    viewport: { width: 1536, height: 1024 },
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  webServer: liveURL
    ? undefined
    : [
        {
          command: `npm run build && npm run preview -- --port ${port}`,
          url: previewURL,
          reuseExistingServer: false,
          timeout: 120000,
        },
        {
          command: `npm run dev -- --port ${port + 1}`,
          url: developmentURL,
          reuseExistingServer: false,
          timeout: 30000,
        },
      ],
});
