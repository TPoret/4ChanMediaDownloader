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

// Returns true when every individual download button has settled to a terminal state:
// "Done" (success) or "Download" (reset after CDN 404 / invalid filename / interrupt).
function allButtonsTerminal(driver) {
  return driver.executeScript(function() {
    const buttons = Array.from(document.querySelectorAll('.file button'))
      .filter(function(b) { return b.textContent.trim() !== 'Download All'; });
    if (buttons.length === 0) return false;
    return buttons.every(function(b) {
      const t = b.textContent.trim();
      return t === 'Done' || t === 'Download';
    });
  });
}

// Returns counts of buttons in each terminal state.
function getTerminalCounts(driver) {
  return driver.executeScript(function() {
    const buttons = Array.from(document.querySelectorAll('.file button'))
      .filter(function(b) { return b.textContent.trim() !== 'Download All'; });
    const done = buttons.filter(function(b) { return b.textContent.trim() === 'Done'; }).length;
    const failed = buttons.filter(function(b) { return b.textContent.trim() === 'Download'; }).length;
    return { done, failed, total: buttons.length };
  });
}

// One combined test per fixture to avoid the persistent-store re-download issue:
// the background script's DownloadStore deduplicates by URL and skips re-downloading
// URLs already marked "complete", so repeating Download All in the same Firefox session
// would leave buttons stuck at "Pending...". Running one test per fixture and keeping
// the two fixtures' tests sequential within the same worker avoids any URL overlap.
for (const fixture of FIXTURES) {
  test(`${fixture} - Download All downloads files with correct names and states`, async ({
    driver,
    downloadsDir,
    port,
  }) => {
    test.setTimeout(300000);

    fs.readdirSync(downloadsDir).forEach((f) =>
      fs.rmSync(path.join(downloadsDir, f), { recursive: true, force: true })
    );

    await driver.get(`http://localhost:${port}/${encodeURIComponent(fixture)}`);
    await driver.wait(until.elementLocated(By.xpath(DOWNLOAD_BTN_XPATH)), 10000);
    await driver.sleep(500);

    const expectedCount = (await driver.findElements(By.css('.file > .fileThumb'))).length;
    const expectedExts = await driver.executeScript(function() {
      return Array.from(document.querySelectorAll('.file > .fileThumb')).map(function(ft) {
        return new URL(ft.href).pathname.split('.').pop().toLowerCase();
      });
    });

    const downloadAllBtn = await driver.findElement(
      By.xpath('//button[normalize-space(text())="Download All"]')
    );
    await jsClick(driver, downloadAllBtn);

    await driver.wait(() => allButtonsTerminal(driver), 280000);

    const { done, total } = await getTerminalCounts(driver);
    const downloadedFiles = fs.readdirSync(downloadsDir);

    expect(total).toBe(expectedCount);
    expect(done).toBe(total);
    expect(downloadedFiles.length).toBe(done);

    for (const ext of downloadedFiles.map((f) => path.extname(f).replace('.', '').toLowerCase())) {
      expect(expectedExts).toContain(ext);
    }

    const doneButtons = await driver.findElements(By.xpath('//button[normalize-space(text())="Done"]'));
    expect(doneButtons.length).toBeGreaterThan(0);
    for (const btn of doneButtons) {
      expect(await btn.isEnabled()).toBe(false);
    }
  });
}
