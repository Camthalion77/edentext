import { app, BrowserWindow, dialog, net, protocol, shell } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// One fixed secure origin keeps localStorage across launches and lets the
// File System Access API run, so saveFile.ts needs no desktop branch.
const ORIGIN = 'app://edentext';
const ROOT = app.isPackaged
  ? path.join(process.resourcesPath, 'app')
  : fileURLToPath(new URL('../dist', import.meta.url));

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

// app.getLocale() is only filled once the app is ready.
const german = () => app.getLocale().startsWith('de');
const discardText = () =>
  german()
    ? { message: 'Ungespeicherte Änderungen verwerfen?', buttons: ['Verwerfen', 'Abbrechen'] }
    : { message: 'Discard unsaved changes?', buttons: ['Discard', 'Cancel'] };

// Points at a newer release instead of installing it: an unsigned macOS app cannot
// update itself. Offline or rate-limited, the app simply starts without asking.
const RELEASES = 'https://github.com/stffnb/edentext/releases/latest';
// The one release the user chose to skip; the next one asks again.
const skippedFile = () => path.join(app.getPath('userData'), 'skipped-version');
const skipped = () => { try { return readFileSync(skippedFile(), 'utf8'); } catch { return ''; } };
async function checkForUpdate(win) {
  if (!app.isPackaged) return;
  const res = await net.fetch('https://api.github.com/repos/stffnb/edentext/releases/latest');
  if (!res.ok) return;
  const latest = String((await res.json()).tag_name ?? '').replace(/^v/, '');
  if (latest === skipped() || latest.localeCompare(app.getVersion(), undefined, { numeric: true }) <= 0) return;
  const { response } = await dialog.showMessageBox(win, {
    type: 'info',
    message: german() ? `EdenText ${latest} ist verfügbar.` : `EdenText ${latest} is available.`,
    detail: german() ? `Installiert ist ${app.getVersion()}.` : `You have ${app.getVersion()}.`,
    buttons: german() ? ['Herunterladen', 'Später', 'Diese Version überspringen'] : ['Download', 'Later', 'Skip This Version'],
    defaultId: 0,
    cancelId: 1,
  });
  if (response === 0) void shell.openExternal(RELEASES);
  if (response === 2) writeFileSync(skippedFile(), latest);
}

function createWindow() {
  const win = new BrowserWindow({ width: 1280, height: 900, title: 'EdenText' });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(`${ORIGIN}/`)) return { action: 'allow' };
    if (/^https?:/.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  // A file dropped outside the editor would otherwise replace the app.
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(`${ORIGIN}/`)) e.preventDefault();
  });
  // The page's beforeunload guard blocks closing silently; ask instead.
  win.webContents.on('will-prevent-unload', (e) => {
    const choice = dialog.showMessageBoxSync(win, { type: 'question', ...discardText(), defaultId: 1, cancelId: 1 });
    if (choice === 0) e.preventDefault();
  });
  void win.loadURL(`${ORIGIN}/index.html`);
  win.webContents.once('did-finish-load', () => checkForUpdate(win).catch(() => {}));
}

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const file = path.join(ROOT, decodeURIComponent(new URL(req.url).pathname));
    if (!file.startsWith(ROOT)) return new Response('', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
