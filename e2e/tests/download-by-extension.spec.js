const { test, expect, By, until } = require('../helpers/test-fixtures');
const fs = require('fs');
const path = require('path');

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const SUPPORTED_EXTENSIONS = ['.jpg', '.png', '.gif', '.webm', '.mp4'];

// Pre-compute which fixture to use for each extension at module-load time.
// Scans fixture HTML files for the first fileThumb href ending with each ext.
function findFixtureForExtension(ext) {
  const fixtureFiles = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.html'));
  for (const fixture of fixtureFiles) {
    const html = fs.readFileSync(path.join(FIXTURES_DIR, fixture), 'utf8');
    const pattern = new RegExp(
      'class="fileThumb"[^>]*href="[^"]*\\' + ext + '"',
      'i'
    );
    if (pattern.test(html)) return fixture;
  }
  throw new Error(`No fixture found containing a ${ext} file`);
}

const FIXTURE_FOR_EXT = Object.fromEntries(
  SUPPORTED_EXTENSIONS.map((ext) => [ext, findFixtureForExtension(ext)])
);

async function jsClick(driver, el) {
  await driver.executeScript('arguments[0].scrollIntoView(true)', el);
  await driver.executeScript('arguments[0].click()', el);
}

for (const ext of SUPPORTED_EXTENSIONS) {
  const fixture = FIXTURE_FOR_EXT[ext];

  test(`clicking Download on a ${ext} file downloads it with ${ext} extension`, async ({
    driver,
    downloadsDir,
    port,
  }) => {
    test.setTimeout(120000);

    fs.readdirSync(downloadsDir).forEach((f) =>
      fs.rmSync(path.join(downloadsDir, f), { recursive: true, force: true })
    );

    await driver.get(`http://localhost:${port}/${encodeURIComponent(fixture)}`);
    await driver.wait(
      until.elementLocated(By.xpath('//button[normalize-space(text())="Download"]')),
      10000
    );
    await driver.sleep(500);

    // Get the resolved href of the first fileThumb with this extension from the live page.
    // fileThumb.href is the fully resolved URL (http://localhost:PORT/...) which the
    // content script uses as the button's id attribute.
    const mediaUrl = await driver.executeScript(function (targetExt) {
      var thumbs = Array.from(document.querySelectorAll('.file > .fileThumb'));
      var match = thumbs.find(function (t) {
        return new URL(t.href).pathname.toLowerCase().endsWith(targetExt);
      });
      return match ? match.href : null;
    }, ext);

    if (!mediaUrl) throw new Error(`No ${ext} fileThumb found on page after navigation`);

    const btn = await driver.findElement(By.id(mediaUrl));
    await jsClick(driver, btn);

    await driver.wait(
      until.elementLocated(By.xpath('//button[normalize-space(text())="Done"]')),
      110000
    );

    const doneBtn = await driver.findElement(By.xpath('//button[normalize-space(text())="Done"]'));
    expect(await doneBtn.isEnabled()).toBe(false);

    const files = fs.readdirSync(downloadsDir);
    expect(files.length).toBe(1);
    expect(path.extname(files[0]).toLowerCase()).toBe(ext);
  });
}
