import { app, BrowserWindow, dialog, net, protocol, shell } from 'electron';
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
const discardText = () =>
  app.getLocale().startsWith('de')
    ? { message: 'Ungespeicherte Änderungen verwerfen?', buttons: ['Verwerfen', 'Abbrechen'] }
    : { message: 'Discard unsaved changes?', buttons: ['Discard', 'Cancel'] };

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
