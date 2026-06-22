const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  globalTimeout: 1800000,
  // 2 workers: each spec file gets its own Firefox instance, keeping background
  // script state isolated between download-button and download-all test suites.
  workers: 2,
  reporter: [['list']],
  use: { actionTimeout: 30000 },
});
