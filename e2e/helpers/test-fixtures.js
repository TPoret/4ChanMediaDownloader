const { test: base, expect } = require('@playwright/test');
const { createBrowserContext, DOWNLOADS_DIR } = require('./browser');
const { startServer, PORT } = require('./server');

const test = base.extend({
  _server: [async ({}, use) => {
    const server = await startServer();
    await use(server);
    await new Promise((resolve) => server.close(resolve));
  }, { scope: 'worker' }],

  context: [async ({ _server }, use) => {
    const { context, cleanup } = await createBrowserContext();
    await use(context);
    await cleanup();
  }, { scope: 'worker' }],

  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },

  downloadsDir: [async ({}, use) => {
    await use(DOWNLOADS_DIR);
  }, { scope: 'worker' }],
});

module.exports = { test, expect, PORT };
