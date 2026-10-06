const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  // The app and fullscreen viewport tests share timing-sensitive browser resources.
  // Keep the canonical suite serial and retry an isolated browser context once.
  workers: 1,
  retries: 1,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'node tests/support/static-server.js',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } }
  ]
});
