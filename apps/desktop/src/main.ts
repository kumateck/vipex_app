import { app, BrowserWindow, ipcMain, type WebContentsPrintOptions } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow: BrowserWindow | null = null;
const PACKAGED_WEB_BASE_URL = 'https://testing.app.vipexparcel.com/';
const DEV_WEB_BASE_URL = 'http://localhost:5173/';
let pendingDeepLink: string | null = null;

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
    mainWindow.loadURL('http://localhost:5173');
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

  registerIpcHandlers();
  createWindow();

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
