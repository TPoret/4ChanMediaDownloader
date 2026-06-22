const { Builder } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const os = require('os');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.join(__dirname, '..', '..');
const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');
// Use the actual geckodriver binary (geckodriver npm pkg caches it in os.tmpdir())
const GECKODRIVER = process.env.GECKODRIVER_PATH || path.join(os.tmpdir(), 'geckodriver');
const FIREFOX_BIN = '/usr/bin/firefox';

// Extension files to copy into a clean temp dir for installAddon
const EXT_FILES = ['manifest.json', 'content.js', 'background.js'];

function buildExtDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ext-4chan-'));
  for (const f of EXT_FILES) {
    fs.copyFileSync(path.join(ROOT_DIR, f), path.join(dir, f));
  }
  const iconsDir = path.join(ROOT_DIR, 'icons');
  const destIcons = path.join(dir, 'icons');
  fs.mkdirSync(destIcons);
  for (const icon of fs.readdirSync(iconsDir)) {
    fs.copyFileSync(path.join(iconsDir, icon), path.join(destIcons, icon));
  }
  return dir;
}

async function createDriver(downloadsDir = DOWNLOADS_DIR) {
  fs.mkdirSync(downloadsDir, { recursive: true });

  const options = new firefox.Options();
  options.setBinary(FIREFOX_BIN);
  options.setPreference('xpinstall.signatures.required', false);
  options.setPreference('browser.download.folderList', 2);
  options.setPreference('browser.download.dir', downloadsDir);
  options.setPreference('browser.download.useDownloadDir', true);
  options.setPreference(
    'browser.helperApps.neverAsk.saveToDisk',
    'image/jpeg,image/png,image/gif,video/webm,video/mp4,image/webp'
  );
  options.setPreference('browser.download.manager.showWhenStarting', false);
  options.setPreference('browser.download.manager.focusWhenStarting', false);

  const service = new firefox.ServiceBuilder(GECKODRIVER);

  const driver = await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .setFirefoxService(service)
    .build();

  const extDir = buildExtDir();
  try {
    await driver.installAddon(extDir, true);
  } finally {
    fs.rmSync(extDir, { recursive: true, force: true });
  }

  return driver;
}

module.exports = { createDriver, DOWNLOADS_DIR, DEFAULT_DOWNLOADS_DIR: DOWNLOADS_DIR };
