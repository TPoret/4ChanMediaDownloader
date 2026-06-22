const { test, expect, PORT } = require('../helpers/test-fixtures');
const fs = require('fs');
const path = require('path');

const FIXTURES = fs.readdirSync(path.join(__dirname, '..', 'fixtures'))
  .filter((f) => f.endsWith('.html'));

for (const fixture of FIXTURES) {
  test.describe(`${fixture} - Download All`, () => {
    test.beforeEach(async ({ page, downloadsDir }) => {
      for (const f of fs.readdirSync(downloadsDir)) {
        fs.rmSync(path.join(downloadsDir, f), { recursive: true, force: true });
      }
      await page.goto(`http://localhost:${PORT}/${fixture}`);
      await page.waitForSelector('button:has-text("Download")', { timeout: 10000 });
    });

    test('downloads all media files with correct count', async ({ page, downloadsDir }) => {
      test.setTimeout(120000);

      const expectedItems = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.file > .fileThumb')).map((fileThumb) => {
          const anchor = fileThumb.parentElement.querySelector('.fileText > a');
          const filename =
            anchor.title || anchor.parentElement.title || anchor.textContent.trim();
          return { filename, mediaUrl: fileThumb.href };
        });
      });

      await page.getByRole('button', { name: 'Download All' }).click();

      await page.waitForFunction(
        () => {
          const buttons = Array.from(document.querySelectorAll('.file button'));
          return buttons.length > 0 && buttons.every((b) => b.textContent.trim() === 'Done');
        },
        { timeout: 120000 }
      );

      const downloadedFiles = fs.readdirSync(downloadsDir);
      expect(downloadedFiles.length).toBe(expectedItems.length);
    });

    test('downloaded files have correct extensions', async ({ page, downloadsDir }) => {
      test.setTimeout(120000);

      const expectedExtensions = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.file > .fileThumb')).map((fileThumb) => {
          const url = new URL(fileThumb.href);
          return url.pathname.split('.').pop().toLowerCase();
        });
      });

      await page.getByRole('button', { name: 'Download All' }).click();

      await page.waitForFunction(
        () => {
          const buttons = Array.from(document.querySelectorAll('.file button'));
          return buttons.length > 0 && buttons.every((b) => b.textContent.trim() === 'Done');
        },
        { timeout: 120000 }
      );

      const downloadedFiles = fs.readdirSync(downloadsDir);
      const downloadedExtensions = downloadedFiles.map((f) =>
        path.extname(f).replace('.', '').toLowerCase()
      );

      downloadedExtensions.sort();
      expectedExtensions.sort();
      expect(downloadedExtensions).toEqual(expectedExtensions);
    });

    test('downloaded filenames match original names from thread', async ({
      page,
      downloadsDir,
    }) => {
      test.setTimeout(120000);

      const expectedItems = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.file > .fileThumb')).map((fileThumb) => {
          const anchor = fileThumb.parentElement.querySelector('.fileText > a');
          const filename =
            anchor.title || anchor.parentElement.title || anchor.textContent.trim();
          const ext = new URL(fileThumb.href).pathname.split('.').pop().toLowerCase();
          return { filename, ext };
        });
      });

      await page.getByRole('button', { name: 'Download All' }).click();

      await page.waitForFunction(
        () => {
          const buttons = Array.from(document.querySelectorAll('.file button'));
          return buttons.length > 0 && buttons.every((b) => b.textContent.trim() === 'Done');
        },
        { timeout: 120000 }
      );

      const downloadedFiles = fs.readdirSync(downloadsDir);

      for (const { filename, ext } of expectedItems) {
        const escapedBase = path.basename(filename, path.extname(filename)).replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        );
        const pattern = new RegExp(`^${escapedBase}(?: \\(\\d+\\))?\\.${ext}$`);
        const match = downloadedFiles.some((f) => pattern.test(f));
        expect(match, `Expected a file matching "${filename}" (.${ext}) in downloads`).toBe(true);
      }
    });

    test('all Download buttons are disabled and show Done after Download All', async ({
      page,
    }) => {
      test.setTimeout(120000);

      await page.getByRole('button', { name: 'Download All' }).click();

      await page.waitForFunction(
        () => {
          const buttons = Array.from(document.querySelectorAll('.file button'));
          return buttons.length > 0 && buttons.every((b) => b.textContent.trim() === 'Done');
        },
        { timeout: 120000 }
      );

      const doneButtons = page.locator('.file button', { hasText: 'Done' });
      const thumbCount = await page.locator('.file > .fileThumb').count();
      await expect(doneButtons).toHaveCount(thumbCount);

      for (const btn of await doneButtons.all()) {
        await expect(btn).toBeDisabled();
      }
    });
  });
}
