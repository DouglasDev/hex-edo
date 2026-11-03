import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:5187', trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 5187 --strictPort',
    port: 5187,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'iphone-webkit',
      use: {
        ...devices['iPhone 13'],
        defaultBrowserType: 'webkit',
        viewport: { width: 844, height: 390 },
      },
    },
    {
      name: 'android-chromium',
      use: { ...devices['Pixel 7'], viewport: { width: 915, height: 412 } },
    },
  ],
});
