import { app, BrowserWindow, dialog, ipcMain, type WebContentsPrintOptions } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { autoUpdater } from 'electron-updater';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow: BrowserWindow | null = null;
const PACKAGED_WEB_BASE_URL = 'https://test.app.vipexparcel.com/';
const DEV_WEB_BASE_URL = 'http://localhost:5173/';
const DEFAULT_DESKTOP_UPDATE_FEED_URL =
  'http://164.90.142.68:9000/vipex-uploads/desktop/windows/latest/';
let pendingDeepLink: string | null = null;
let updateStatus: {
  state:
    | 'idle'
    | 'checking'
    | 'available'
    | 'downloading'
    | 'downloaded'
    | 'not-available'
    | 'error';
  version?: string;
  progress?: number;
  message?: string;
} = { state: 'idle', version: app.getVersion() };

type PrintLayout = 'thermal-sticker' | 'invoice-a5' | 'invoice-a5-receipt' | 'report-a4';

type PrintHtmlRequest = {
  html: string;
  layout: PrintLayout;
  title?: string;
  silent?: boolean;
  deviceName?: string;
};

type ParallelPrintRequest = {
  jobs: [PrintHtmlRequest, PrintHtmlRequest];
};

if (!app.isPackaged) {
  // Avoid stale CSS/asset cache during desktop dev.
  app.commandLine.appendSwitch('disable-http-cache');
}

function getWebBaseUrl() {
  return app.isPackaged ? PACKAGED_WEB_BASE_URL : DEV_WEB_BASE_URL;
}

function setUpdateStatus(
  next: Partial<{
    state:
      | 'idle'
      | 'checking'
      | 'available'
      | 'downloading'
      | 'downloaded'
      | 'not-available'
      | 'error';
    version?: string;
    progress?: number;
    message?: string;
  }>,
) {
  updateStatus = { ...updateStatus, ...next };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updates:status', updateStatus);
  }
}

function configureAutoUpdater() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.logger = null;

  const genericFeedUrl =
    process.env.DESKTOP_UPDATE_FEED_URL?.trim() || DEFAULT_DESKTOP_UPDATE_FEED_URL;
  if (genericFeedUrl) {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: genericFeedUrl,
    });
  }

  autoUpdater.on('checking-for-update', () => {
    setUpdateStatus({ state: 'checking', message: undefined, progress: undefined });
  });

  autoUpdater.on('update-available', (info) => {
    setUpdateStatus({
      state: 'available',
      version: info.version,
      message: 'Update is available for download.',
      progress: undefined,
    });
  });

  autoUpdater.on('update-not-available', () => {
    setUpdateStatus({
      state: 'not-available',
      message: 'You are on the latest version.',
      progress: undefined,
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    setUpdateStatus({
      state: 'downloading',
      progress: progress.percent,
      message: `Downloading update (${Math.round(progress.percent)}%).`,
    });
  });

  autoUpdater.on('update-downloaded', async (info) => {
    setUpdateStatus({
      state: 'downloaded',
      version: info.version,
      progress: 100,
      message: 'Update downloaded. Restart to install.',
    });

    if (!mainWindow || mainWindow.isDestroyed()) return;

    const response = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      buttons: ['Install now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Update ready',
      message: 'A new version has been downloaded.',
      detail: 'Restart the app now to install the update.',
    });

    if (response.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on('error', (error) => {
    setUpdateStatus({
      state: 'error',
      message: error.message || 'Unable to check for updates.',
      progress: undefined,
    });
  });
}

function extractDeepLinkUrl(argv: string[]) {
  return argv.find((arg) => typeof arg === 'string' && arg.startsWith('vipex://')) ?? null;
}

function mapDeepLinkToHash(deepLinkUrl: string) {
  try {
    const parsed = new URL(deepLinkUrl);
    const routePath = `${parsed.hostname}${parsed.pathname === '/' ? '' : parsed.pathname}`
      .replace(/^\/+/, '')
      .toLowerCase();

    if (routePath === 'reset-password') {
      const token = parsed.searchParams.get('token') ?? '';
      return `#/reset-password${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    }

    if (routePath === 'set-password' || routePath === 'invite') {
      const token = parsed.searchParams.get('token') ?? '';
      return `#/set-password${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    }

    return null;
  } catch {
    return null;
  }
}

async function navigateToDeepLink(deepLinkUrl: string) {
  const hashPath = mapDeepLinkToHash(deepLinkUrl);
  if (!hashPath || !mainWindow || mainWindow.isDestroyed()) return;

  const base = getWebBaseUrl().replace(/\/+$/, '');
  const target = `${base}/${hashPath}`;
  await mainWindow.loadURL(target);
}

function getPrintOptions(request: PrintHtmlRequest): WebContentsPrintOptions {
  const baseOptions: WebContentsPrintOptions = {
    silent: Boolean(request.silent),
    printBackground: true,
    margins: {
      marginType: 'none',
    },
  };

  if (request.deviceName) {
    baseOptions.deviceName = request.deviceName;
  }

  if (request.layout === 'invoice-a5' || request.layout === 'invoice-a5-receipt') {
    baseOptions.pageSize = 'A5';
    if (request.layout === 'invoice-a5-receipt') {
      baseOptions.landscape = true;
    }
  } else if (request.layout === 'report-a4') {
    baseOptions.pageSize = 'A4';
  }

  return baseOptions;
}

async function printHtmlWithNativeDialog(request: PrintHtmlRequest) {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  try {
    const title = request.title ?? 'Print Document';
    const html = request.html.replace('<head>', `<head><title>${title}</title>`);
    const encoded = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    await printWindow.loadURL(encoded);

    const ok = await new Promise<boolean>((resolve) => {
      printWindow.webContents.print(getPrintOptions(request), (success) => {
        resolve(success);
      });
    });

    return { ok, reason: ok ? undefined : 'Print was cancelled or failed.' };
  } finally {
    if (!printWindow.isDestroyed()) {
      printWindow.close();
    }
  }
}

function registerIpcHandlers() {
  ipcMain.handle('print:html', async (_event, request: PrintHtmlRequest) => {
    if (!request?.html) {
      return { ok: false, reason: 'No printable HTML payload was provided.' };
    }

    return printHtmlWithNativeDialog(request);
  });

  ipcMain.handle('print:list-printers', async () => {
    if (!mainWindow) return [];
    return mainWindow.webContents.getPrintersAsync();
  });

  ipcMain.handle('print:parallel', async (_event, request: ParallelPrintRequest) => {
    const jobs = Array.isArray(request?.jobs) ? request.jobs : [];
    if (jobs.length !== 2) {
      return {
        ok: false,
        jobs: [],
        reason: 'Parallel print expects exactly two jobs.',
      };
    }

    const results = await Promise.all(
      jobs.map(async (job) => {
        if (!job?.html) {
          return {
            ok: false,
            reason: 'No printable HTML payload was provided.',
            layout: job?.layout,
            deviceName: job?.deviceName,
            title: job?.title,
          };
        }

        const result = await printHtmlWithNativeDialog(job);
        return {
          ...result,
          layout: job.layout,
          deviceName: job.deviceName,
          title: job.title,
        };
      }),
    );

    return {
      ok: results.every((entry) => entry.ok),
      jobs: results,
    };
  });

  ipcMain.handle('updates:get-status', async () => updateStatus);

  ipcMain.handle('updates:check', async () => {
    if (!app.isPackaged) {
      return {
        ok: false,
        reason: 'Auto update is only available in packaged builds.',
        status: { state: 'idle', message: 'Development build.' },
      };
    }

    try {
      setUpdateStatus({ state: 'checking', message: undefined, progress: undefined });
      await autoUpdater.checkForUpdates();
      return { ok: true, status: updateStatus };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to check for updates.';
      setUpdateStatus({ state: 'error', message });
      return { ok: false, reason: message, status: updateStatus };
    }
  });

  ipcMain.handle('updates:download', async () => {
    if (!app.isPackaged) {
      return {
        ok: false,
        reason: 'Auto update is only available in packaged builds.',
        status: { state: 'idle', message: 'Development build.' },
      };
    }

    try {
      await autoUpdater.downloadUpdate();
      return { ok: true, status: updateStatus };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to download update.';
      setUpdateStatus({ state: 'error', message });
      return { ok: false, reason: message, status: updateStatus };
    }
  });

  ipcMain.handle('updates:install', async () => {
    if (!app.isPackaged) {
      return { ok: false, reason: 'Install is only available in packaged builds.' };
    }
    if (updateStatus.state !== 'downloaded') {
      return { ok: false, reason: 'No downloaded update available.' };
    }

    autoUpdater.quitAndInstall();
    return { ok: true };
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (!app.isPackaged) {
    void mainWindow.webContents.session.clearCache();
    mainWindow.loadURL(DEV_WEB_BASE_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    mainWindow.webContents.once('did-finish-load', () => {
      if (!pendingDeepLink) return;
      const link = pendingDeepLink;
      pendingDeepLink = null;
      void navigateToDeepLink(link);
    });
    return;
  }

  mainWindow.loadURL(PACKAGED_WEB_BASE_URL);
  mainWindow.webContents.once('did-finish-load', () => {
    if (!pendingDeepLink) return;
    const link = pendingDeepLink;
    pendingDeepLink = null;
    void navigateToDeepLink(link);
  });
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
}

pendingDeepLink = extractDeepLinkUrl(process.argv);

app.on('second-instance', (_event, argv) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }

  const link = extractDeepLinkUrl(argv);
  if (link) {
    if (!mainWindow || mainWindow.isDestroyed()) {
      pendingDeepLink = link;
      return;
    }
    void navigateToDeepLink(link);
  }
});

app.on('open-url', (event, url) => {
  event.preventDefault();
  if (!url.startsWith('vipex://')) return;
  if (!mainWindow || mainWindow.isDestroyed()) {
    pendingDeepLink = url;
    return;
  }
  void navigateToDeepLink(url);
});

app.whenReady().then(() => {
  if (app.isPackaged) {
    app.setAsDefaultProtocolClient('vipex');
  }

  configureAutoUpdater();
  registerIpcHandlers();
  createWindow();

  if (app.isPackaged) {
    setTimeout(() => {
      void autoUpdater.checkForUpdates().catch(() => {
        // keep current status state handling via updater events/error callback
      });
    }, 8000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
