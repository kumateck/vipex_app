import { app, BrowserWindow, ipcMain, session } from 'electron';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { runSigWebCapture } from './sigweb-capture-page';
import { openLocalCaptureOrigin } from './local-capture-origin';

let active = false;

async function loadSdk() {
  const sdkPath = join(app.getPath('userData'), 'topaz', 'SigWebTablet.js');
  try {
    if ((await stat(sdkPath)).size > 512_000) throw new Error('Invalid SDK size');
    return await readFile(sdkPath, 'utf8');
  } catch {
    throw new Error(`Install Topaz SigWeb and copy the official SigWebTablet.js to ${sdkPath}.`);
  }
}

async function captureTopazSignature(parent: BrowserWindow) {
  if (process.platform !== 'win32')
    throw new Error('Topaz capture requires Vipex Desktop on Windows.');
  if (active) throw new Error('A signature capture is already open.');
  active = true;
  let capture: BrowserWindow | undefined;
  let origin: Awaited<ReturnType<typeof openLocalCaptureOrigin>> | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const sdk = await loadSdk();
    origin = await openLocalCaptureOrigin();
    const captureUrl = origin.url;
    // This session has no Vipex credentials or desktop preload API.
    const captureSession = session.fromPartition('vipex-topaz-capture');
    capture = new BrowserWindow({
      parent,
      modal: true,
      width: 550,
      height: 390,
      autoHideMenuBar: true,
      webPreferences: { session: captureSession, sandbox: true, contextIsolation: true },
    });
    const window = capture;
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', (event) => event.preventDefault());
    window.webContents.on('will-attach-webview', (event) => event.preventDefault());
    const closed = new Promise<null>((resolve) => window.once('closed', () => resolve(null)));
    const limit = new Promise<never>((_, reject) => {
      timeout = setTimeout(
        () => reject(new Error('Signature capture timed out. Reopen the parcel to retry.')),
        180_000,
      );
    });
    const captureSignature = async () => {
      await window.loadURL(captureUrl);
      await window.webContents.executeJavaScript(sdk + '\n;void 0;');
      return window.webContents.executeJavaScript(`(${runSigWebCapture.toString()})()`) as Promise<{
        signatureImage: string;
        sigString: string;
      } | null>;
    };
    return await Promise.race([closed, limit, captureSignature()]);
  } finally {
    origin?.close();
    if (timeout) clearTimeout(timeout);
    if (capture && !capture.isDestroyed()) capture.close();
    active = false;
  }
}

export function registerTopazCaptureHandler(
  getWindow: () => BrowserWindow | null,
  getActiveUrl: () => string | null,
) {
  ipcMain.handle('receiver-signature:capture', (event) => {
    const parent = getWindow();
    const activeUrl = getActiveUrl();
    const frame = event.senderFrame;
    if (
      !parent ||
      !activeUrl ||
      !frame ||
      event.sender !== parent.webContents ||
      frame !== parent.webContents.mainFrame ||
      new URL(frame.url).origin !== new URL(activeUrl).origin
    )
      throw new Error('Signature capture is only available in the Vipex window.');
    return captureTopazSignature(parent);
  });
}
