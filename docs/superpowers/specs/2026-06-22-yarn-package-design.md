# Design: `yarn package` — Firefox Extension Packaging Command

## Overview

Add a `package` script to `package.json` that builds the extension and produces a deployable zip file in `dist/`, ready for upload to addons.mozilla.org (AMO).

## Implementation

### New script in `package.json`

```json
"package": "yarn build && web-ext build --source-dir . --artifacts-dir dist --ignore-files 'src e2e node_modules docs test-results *.config.js yarn.lock package.json *.md *.png diag-* .git *.cjs *.properties'"
```

### Steps executed by `yarn package`

1. `yarn build` — runs esbuild to bundle `src/content_script.js` → `content.js` and `src/background_script.js` → `background.js`
2. `web-ext build` — zips the extension files into `dist/`

### Files included in the zip

- `manifest.json`
- `content.js` (built output)
- `background.js` (built output)
- `icons/` directory

### Files excluded via `--ignore-files`

- `src/`, `e2e/`, `docs/`, `node_modules/`, `test-results/`
- `*.config.js`, `yarn.lock`, `package.json`, `*.md`, `*.png`, `*.cjs`, `*.properties`
- `diag-*`, `.git`

### Output

`dist/4chanmediadownloader-{version}.zip` — the version is read automatically from `manifest.json`. For example, with the current `"version": "1.0.3"`, the output is `dist/4chanmediadownloader-1.0.3.zip`.

## `.gitignore` update

Add `dist/` to `.gitignore` so built zip artifacts are not committed.

Note: `.gitignore` already excludes `web-ext-artifacts/` (the default output dir for `web-ext build`). The new `dist/` entry covers the explicit `--artifacts-dir dist` we pass.

## Usage

```sh
yarn package
```

The resulting zip at `dist/4chanmediadownloader-{version}.zip` can be uploaded directly to AMO.
