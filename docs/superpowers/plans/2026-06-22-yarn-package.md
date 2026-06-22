# yarn package Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `yarn package` script that builds the extension and produces a deployable zip in `dist/` for upload to addons.mozilla.org.

**Architecture:** Two shell changes: add the `package` script to `package.json` (chaining `yarn build` then `web-ext build`) and add `dist/` to `.gitignore`. No new dependencies — `web-ext` is already installed.

**Tech Stack:** `web-ext` (already in devDependencies), `esbuild` (via existing `yarn build`)

## Global Constraints

- Target: Firefox extension (manifest v2)
- `web-ext` version already locked in `yarn.lock` — do not upgrade
- Output must land in `dist/`, not in `web-ext-artifacts/` (the `web-ext` default)
- Zip filename is auto-derived from `manifest.json` `"name"` and `"version"` fields by `web-ext`

---

### Task 1: Add `package` script and update `.gitignore`

**Files:**
- Modify: `package.json` (scripts section)
- Modify: `.gitignore`

**Interfaces:**
- Consumes: existing `"build"` script in `package.json`, `web-ext` binary in `node_modules/.bin/`
- Produces: `yarn package` command; `dist/4chanmediadownloader-{version}.zip` at runtime

- [ ] **Step 1: Add `dist/` to `.gitignore`**

Open `.gitignore` and append one line:

```
dist/
```

Current `.gitignore` content for reference:
```
web-ext-artifacts
node_modules
content.js
background.js
e2e/downloads/
__pycache__/
docs/superpowers/
```

After edit:
```
web-ext-artifacts
node_modules
content.js
background.js
e2e/downloads/
__pycache__/
docs/superpowers/
dist/
```

- [ ] **Step 2: Add `package` script to `package.json`**

In `package.json`, add `"package"` to the `"scripts"` object:

```json
"scripts": {
  "build": "esbuild src/content_script.js --target=firefox57 --bundle --outfile=content.js && esbuild src/background_script.js --target=firefox57 --bundle --outfile=background.js",
  "test:e2e": "yarn build && playwright test --config e2e/playwright.config.js",
  "package": "yarn build && web-ext build --source-dir . --artifacts-dir dist --ignore-files 'src e2e node_modules docs test-results *.config.js yarn.lock package.json *.md *.png diag-* .git *.cjs *.properties'"
}
```

- [ ] **Step 3: Smoke-test by running `yarn package`**

```bash
yarn package
```

Expected output (last few lines):
```
Your web extension is ready: dist/4chanmediadownloader-1.0.3.zip
```

Then verify the zip contains exactly the right files:

```bash
unzip -l dist/4chanmediadownloader-1.0.3.zip
```

Expected: entries for `manifest.json`, `content.js`, `background.js`, `icons/icon.png`, `icons/icon-128x128.png` — and nothing from `src/`, `node_modules/`, `e2e/`, `docs/`, etc.

- [ ] **Step 4: Commit**

```bash
git add package.json .gitignore
git commit -m "feat: add yarn package command to build deployable zip"
```
