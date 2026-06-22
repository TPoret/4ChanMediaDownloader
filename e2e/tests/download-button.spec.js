const { test, expect, By, until } = require('../helpers/test-fixtures');
const fs = require('fs');
const path = require('path');

const FIXTURES = fs.readdirSync(path.join(__dirname, '..', 'fixtures'))
  .filter((f) => f.endsWith('.html'));

const DOWNLOAD_BTN_XPATH = '//button[normalize-space(text())="Download"]';

async function jsClick(driver, el) {
  await driver.executeScript('arguments[0].scrollIntoView(true)', el);
  await driver.executeScript('arguments[0].click()', el);
}

for (const fixture of FIXTURES) {
  test.describe(fixture, () => {
    test.beforeEach(async ({ driver, downloadsDir, port }) => {
      for (const f of fs.readdirSync(downloadsDir)) {
        fs.rmSync(path.join(downloadsDir, f), { recursive: true, force: true });
      }
      await driver.get(`http://localhost:${port}/${encodeURIComponent(fixture)}`);
      await driver.wait(until.elementLocated(By.xpath(DOWNLOAD_BTN_XPATH)), 10000);
      // Allow background script port to stabilize before tests start clicking
      await driver.sleep(500);
    });

    test('Download All button is present', async ({ driver }) => {
      // findElement throws NoSuchElementError if absent — that's the assertion
      const btn = await driver.findElement(
        By.xpath('//button[normalize-space(text())="Download All"]')
      );
      expect(btn).toBeTruthy();
    });

    test('one Download button per media file', async ({ driver }) => {
      const thumbCount = (await driver.findElements(By.css('.file > .fileThumb'))).length;
      const downloadBtns = await driver.findElements(By.xpath(DOWNLOAD_BTN_XPATH));
      expect(downloadBtns.length).toBe(thumbCount);
    });

    test('clicking Download downloads the file with correct name and extension', async ({
      driver,
      downloadsDir,
      port,
    }) => {
      test.setTimeout(120000);

      const { filename, mediaUrl } = await driver.executeScript(function() {
        const fileThumb = document.querySelector('.file > .fileThumb');
        const anchor = fileThumb.parentElement.querySelector('.fileText > a');
        const filename = anchor.title || anchor.parentElement.title || anchor.textContent.trim();
        return { filename, mediaUrl: fileThumb.href };
      });

      const expectedExt = path.extname(new URL(mediaUrl).pathname).toLowerCase();

      const firstBtn = await driver.findElement(By.xpath(DOWNLOAD_BTN_XPATH));
      await jsClick(driver, firstBtn);

      await driver.wait(
        until.elementLocated(By.xpath('//button[normalize-space(text())="Done"]')),
        110000
      );

      const doneBtn = await driver.findElement(By.xpath('//button[normalize-space(text())="Done"]'));
      expect(await doneBtn.isEnabled()).toBe(false);

      const files = fs.readdirSync(downloadsDir);
      expect(files.length).toBe(1);

      const downloadedFile = files[0];
      expect(path.extname(downloadedFile).toLowerCase()).toBe(expectedExt);

      const expectedBase = path.basename(filename, path.extname(filename));
      expect(path.basename(downloadedFile, path.extname(downloadedFile))).toMatch(
        new RegExp(`^${expectedBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
      );
    });

    test('clicking Download on a truncated-name file uses the full title as filename', async ({
      driver,
      downloadsDir,
      port,
    }) => {
      test.setTimeout(120000);

      const result = await driver.executeScript(function () {
        const thumbs = Array.from(document.querySelectorAll('.file > .fileThumb'));
        for (const thumb of thumbs) {
          const anchor = thumb.parentElement.querySelector('.fileText > a');
          if (anchor && anchor.title && anchor.title !== anchor.textContent.trim()) {
            return { fullTitle: anchor.title, mediaUrl: thumb.href };
          }
        }
        return null;
      });

      test.skip(result === null, 'no truncated filenames in this fixture');

      const { fullTitle, mediaUrl } = result;
      const expectedExt = path.extname(new URL(mediaUrl).pathname).toLowerCase();

      const btn = await driver.findElement(By.id(mediaUrl));
      await jsClick(driver, btn);

      await driver.wait(
        until.elementLocated(By.xpath('//button[normalize-space(text())="Done"]')),
        110000
      );

      const files = fs.readdirSync(downloadsDir);
      expect(files.length).toBe(1);

      const downloadedFile = files[0];
      expect(path.extname(downloadedFile).toLowerCase()).toBe(expectedExt);
      expect(path.basename(downloadedFile, path.extname(downloadedFile))).toBe(
        path.basename(fullTitle, path.extname(fullTitle))
      );
    });
  });
}
