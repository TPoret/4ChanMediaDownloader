const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  globalTimeout: 1800000,
  // 3 workers: each spec file gets its own Firefox instance, keeping background
  // script DownloadStore state isolated across download-button, download-all,
  // and download-by-extension test suites.
  workers: 3,
  reporter: [['list']],
  use: { actionTimeout: 30000 },
});
