const { firefox } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EXT_ID = '4chan-media-downloader@tpt';
const ROOT_DIR = path.join(__dirname, '..', '..');
const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');

async function createBrowserContext() {
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ff-4chan-'));
  const extDir = path.join(profileDir, 'extensions', EXT_ID);
  fs.mkdirSync(extDir, { recursive: true });
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

  for (const file of ['manifest.json', 'content.js', 'background.js']) {
    fs.copyFileSync(path.join(ROOT_DIR, file), path.join(extDir, file));
  }

  const iconsDir = path.join(ROOT_DIR, 'icons');
  const extIconsDir = path.join(extDir, 'icons');
  fs.mkdirSync(extIconsDir, { recursive: true });
  for (const icon of fs.readdirSync(iconsDir)) {
    fs.copyFileSync(path.join(iconsDir, icon), path.join(extIconsDir, icon));
  }

  const context = await firefox.launchPersistentContext(profileDir, {
    headless: false,
    firefoxUserPrefs: {
      'xpinstall.signatures.required': false,
      'extensions.autoDisableScopes': 0,
      'extensions.enabledScopes': 15,
      'browser.download.folderList': 2,
      'browser.download.dir': DOWNLOADS_DIR,
      'browser.download.useDownloadDir': true,
      'browser.helperApps.neverAsk.saveToDisk':
        'image/jpeg,image/png,image/gif,video/webm,video/mp4,image/webp',
      'browser.download.manager.showWhenStarting': false,
      'browser.download.manager.focusWhenStarting': false,
    },
  });

  async function cleanup() {
    await context.close();
    fs.rmSync(profileDir, { recursive: true, force: true });
  }

  return { context, cleanup };
}

module.exports = { createBrowserContext, DOWNLOADS_DIR };
