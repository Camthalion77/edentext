# desktop/

Electron shell around `../dist`. Its own npm project, so the web app's install and CI never fetch Electron.

- No preload and no bridge: the app runs on the fixed secure origin `app://edentext`, where Chromium's File System Access API and `queryLocalFonts` work, so `saveFile.ts` and `recentFiles.ts` take their Chromium path unchanged. Electron grants their permissions because no permission handler is set.
- `main.mjs` covers only what a browser does around the page: `http(s)` links go to the system browser, navigation off the origin (a dropped file) is blocked, and `will-prevent-unload` turns the page's silent `beforeunload` block into a discard dialog.
- The service worker cannot register on `app://`; `src/main.ts` already swallows that.
- Version and metadata come from the root `package.json` (`electron-builder.config.cjs`). The `desktop` job in `.github/workflows/release.yml` builds unsigned installers per platform and uploads them to the tag's release.
