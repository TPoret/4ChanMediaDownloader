const { test: base, expect } = require('@playwright/test');
const { By, until } = require('selenium-webdriver');
const path = require('path');
const fs = require('fs');
const { createDriver, DEFAULT_DOWNLOADS_DIR } = require('./browser');
const { startServer } = require('./server');

const test = base.extend({
  _server: [
    async ({}, use) => {
      const server = await startServer();
      await use(server);
      await new Promise((resolve) => server.close(resolve));
    },
    { scope: 'worker' },
  ],

  port: [
    async ({ _server }, use) => {
      await use(_server.port);
    },
    { scope: 'worker' },
  ],

  // Each worker process gets its own downloads directory to avoid inter-worker races.
  // process.pid is unique per worker since Playwright forks one process per worker.
  downloadsDir: [
    async ({}, use) => {
      const dir = path.join(DEFAULT_DOWNLOADS_DIR, `worker-${process.pid}`);
      fs.mkdirSync(dir, { recursive: true });
      await use(dir);
    },
    { scope: 'worker' },
  ],

  driver: [
    async ({ _server, downloadsDir }, use) => {
      const driver = await createDriver(downloadsDir);
      await use(driver);
      await driver.quit();
    },
    { scope: 'worker' },
  ],
});

module.exports = { test, expect, By, until };
