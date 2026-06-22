const { test, expect, PORT } = require('../helpers/test-fixtures');
const fs = require('fs');
const path = require('path');

const FIXTURES = fs.readdirSync(path.join(__dirname, '..', 'fixtures'))
  .filter((f) => f.endsWith('.html'));

for (const fixture of FIXTURES) {
  test.describe(fixture, () => {
    test.beforeEach(async ({ page, downloadsDir }) => {
      for (const f of fs.readdirSync(downloadsDir)) {
        fs.unlinkSync(path.join(downloadsDir, f));
      }
      await page.goto(`http://localhost:${PORT}/${fixture}`);
      await page.waitForSelector('button:has-text("Download")', { timeout: 10000 });
    });

    test('Download All button is present', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Download All' })).toBeVisible();
    });

    test('one Download button per media file', async ({ page }) => {
      const thumbCount = await page.locator('.file > .fileThumb').count();
      const downloadButtons = page.getByRole('button', { name: 'Download' });
      await expect(downloadButtons).toHaveCount(thumbCount);
    });

    test('clicking Download downloads the file with correct name and extension', async ({
      page,
      downloadsDir,
    }) => {
      const { filename, mediaUrl } = await page.evaluate(() => {
        const fileThumb = document.querySelector('.file > .fileThumb');
        const anchor = fileThumb.parentElement.querySelector('.fileText > a');
        const filename =
          anchor.title || anchor.parentElement.title || anchor.textContent.trim();
        return { filename, mediaUrl: fileThumb.href };
      });

      const expectedExt = path.extname(new URL(mediaUrl).pathname).toLowerCase();

      await page.getByRole('button', { name: 'Download' }).first().click();

      await expect(
        page.getByRole('button', { name: 'In progress...' }).first()
      ).toBeVisible({ timeout: 10000 });

      await expect(
        page.getByRole('button', { name: 'Done' }).first()
      ).toBeVisible({ timeout: 60000 });

      await expect(
        page.getByRole('button', { name: 'Download' }).first()
      ).toBeDisabled();

      const files = fs.readdirSync(downloadsDir);
      expect(files.length).toBe(1);

      const downloadedFile = files[0];
      expect(path.extname(downloadedFile).toLowerCase()).toBe(expectedExt);

      const expectedBase = path.basename(filename, path.extname(filename));
      expect(path.basename(downloadedFile, path.extname(downloadedFile))).toMatch(
        new RegExp(`^${expectedBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
      );
    });

    test('Download button is disabled and shows Done after download completes', async ({
      page,
    }) => {
      const firstButton = page.getByRole('button', { name: 'Download' }).first();
      await firstButton.click();
      await expect(firstButton).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Done' }).first()).toBeVisible({
        timeout: 60000,
      });
    });
  });
}
