import {
  app,
  BrowserWindow,
  desktopCapturer,
  dialog,
  ipcMain,
  net,
  session,
  shell,
  type WebContentsPrintOptions,
} from 'electron';
import { lookup } from 'node:dns/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { autoUpdater } from 'electron-updater';

declare const __DESKTOP_WEB_BASE_URL__: string;
declare const __DESKTOP_UPDATE_FEED_URL__: string;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow: BrowserWindow | null = null;
const PACKAGED_WEB_BASE_URL = 'https://testing.app.vipexparcel.com/';
const DEV_WEB_BASE_URL = 'http://localhost:5173/';
const DEFAULT_DESKTOP_UPDATE_FEED_URL =
  'http://164.90.142.68:9000/vipex-uploads/desktop/windows/latest/';
const BUILD_DESKTOP_WEB_BASE_URL = __DESKTOP_WEB_BASE_URL__.trim();
const BUILD_DESKTOP_UPDATE_FEED_URL = __DESKTOP_UPDATE_FEED_URL__.trim();
let pendingDeepLink: string | null = null;
let activeDesktopBaseUrl: string | null = null;
let lastDesktopLoadError: string | null = null;
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
  copies?: number;
};

type ParallelPrintRequest = {
  jobs: [PrintHtmlRequest, PrintHtmlRequest];
};

type PrintDiagnosticEvent = {
  event: string;
  details?: unknown;
};

type DesktopNetworkProbe = {
  host: string;
  ok: boolean;
  resolvedAddress?: string;
  error?: string;
};

type DesktopNetworkDiagnostics = {
  timestamp: string;
  appVersion: string;
  isPackaged: boolean;
  selectedBaseUrl: string;
  activeBaseUrl: string | null;
  candidateBaseUrls: string[];
  electronOnline: boolean;
  proxy: string;
  probes: DesktopNetworkProbe[];
  lastLoadError: string | null;
};

if (!app.isPackaged) {
  // Avoid stale CSS/asset cache during desktop dev.
  app.commandLine.appendSwitch('disable-http-cache');
}

function normalizeWebBaseUrl(raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = new URL(raw.trim());
    parsed.pathname = parsed.pathname.replace(/\/v1\/?$/, '/');
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/, '/') || null;
  } catch {
    return null;
  }
}

function getWebBaseUrl() {
  if (!app.isPackaged) return DEV_WEB_BASE_URL;
  const [firstCandidate] = getPackagedWebBaseUrlCandidates();
  return firstCandidate ?? PACKAGED_WEB_BASE_URL;
}

function getPackagedWebBaseUrlCandidates() {
  const override = process.env.DESKTOP_WEB_BASE_URL?.trim();
  const overrideMany = process.env.DESKTOP_WEB_BASE_URLS?.trim();
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const viteApiBase = process.env.VITE_API_BASE_URL?.trim();

  const urls = [
    ...(overrideMany ? overrideMany.split(',') : []),
    override,
    BUILD_DESKTOP_WEB_BASE_URL,
    apiBase,
    viteApiBase,
    PACKAGED_WEB_BASE_URL,
  ]
    .map((entry) => normalizeWebBaseUrl(entry))
    .filter((entry): entry is string => Boolean(entry));

  return [...new Set(urls)];
}

function logDesktopRoutingSelection() {
  const candidates = getPackagedWebBaseUrlCandidates();
  const selectedBaseUrl = candidates[0] ?? PACKAGED_WEB_BASE_URL;
  const envOverrides = {
    DESKTOP_WEB_BASE_URLS: process.env.DESKTOP_WEB_BASE_URLS?.trim() || '(unset)',
    DESKTOP_WEB_BASE_URL: process.env.DESKTOP_WEB_BASE_URL?.trim() || '(unset)',
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || '(unset)',
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL?.trim() || '(unset)',
  };

  console.info(`[desktop-routing] selected-base-url=${selectedBaseUrl}`);
  console.info(`[desktop-routing] candidates=${candidates.join(', ')}`);
  console.info(`[desktop-routing] overrides=${JSON.stringify(envOverrides)}`);
}

async function buildDesktopNetworkDiagnostics(): Promise<DesktopNetworkDiagnostics> {
  const candidates = getPackagedWebBaseUrlCandidates();
  const selectedBaseUrl = candidates[0] ?? PACKAGED_WEB_BASE_URL;
  const uniqueHosts = [...new Set(candidates.map((entry) => new URL(entry).hostname))];
  const probes = await Promise.all(
    uniqueHosts.map(async (host): Promise<DesktopNetworkProbe> => {
      try {
        const result = await lookup(host);
        return { host, ok: true, resolvedAddress: result.address };
      } catch (error) {
        return {
          host,
          ok: false,
          error: error instanceof Error ? error.message : 'DNS lookup failed.',
        };
      }
    }),
  );

  let proxy = 'unknown';
  try {
    proxy = await session.defaultSession.resolveProxy(selectedBaseUrl);
  } catch (error) {
    proxy = `resolve-proxy-error: ${error instanceof Error ? error.message : 'unknown error'}`;
  }

  return {
    timestamp: new Date().toISOString(),
    appVersion: app.getVersion(),
    isPackaged: app.isPackaged,
    selectedBaseUrl,
    activeBaseUrl: activeDesktopBaseUrl,
    candidateBaseUrls: candidates,
    electronOnline: net.isOnline(),
    proxy,
    probes,
    lastLoadError: lastDesktopLoadError,
  };
}

function attachDesktopNetworkLogging() {
  session.defaultSession.webRequest.onErrorOccurred((details) => {
    console.warn(
      `[desktop-network] request-error resource=${details.resourceType} status=${details.error} url=${details.url}`,
    );
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildDesktopLoadErrorHtml(baseUrl: string, details: string) {
  const safeBase = escapeHtml(baseUrl);
  const safeDetails = escapeHtml(details);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vipex Desktop</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #0b1020;
        color: #f8fafc;
        display: grid;
        min-height: 100vh;
        place-items: center;
        padding: 24px;
      }
      .card {
        width: min(720px, 100%);
        border: 1px solid #334155;
        border-radius: 14px;
        background: #111827;
        padding: 20px;
        box-sizing: border-box;
      }
      h1 { margin: 0 0 8px; font-size: 24px; }
      p { margin: 0 0 8px; color: #cbd5e1; }
      .muted { color: #94a3b8; font-size: 13px; margin-bottom: 14px; }
      code {
        display: block;
        background: #0f172a;
        color: #cbd5e1;
        border-radius: 8px;
        padding: 10px;
        margin: 10px 0 14px;
        word-break: break-all;
      }
      .actions { display: flex; gap: 10px; flex-wrap: wrap; }
      button {
        appearance: none;
        border: none;
        padding: 10px 14px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      }
      .primary { background: #f59e0b; color: #111827; }
      .secondary { background: #1f2937; color: #f8fafc; border: 1px solid #334155; }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Unable to load Vipex</h1>
      <p>The desktop shell could not open the hosted app.</p>
      <p class="muted">Check internet access or server availability, then retry.</p>
      <code>App URL: ${safeBase}</code>
      <code>Error: ${safeDetails}</code>
      <div class="actions">
        <button class="primary" id="retry">Retry</button>
        <button class="secondary" id="open">Open in Browser</button>
      </div>
    </main>
    <script>
      const retryBtn = document.getElementById('retry');
      const openBtn = document.getElementById('open');
      retryBtn?.addEventListener('click', () => window.api?.retryDesktopLoad?.());
      openBtn?.addEventListener('click', () => window.api?.openInBrowser?.(${JSON.stringify(baseUrl)}));
    </script>
  </body>
</html>`;
}

async function showDesktopLoadError(baseUrl: string, details: string) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const html = buildDesktopLoadErrorHtml(baseUrl, details);
  const encoded = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  await mainWindow.loadURL(encoded);
}

async function loadPackagedMainContent() {
  const candidates = getPackagedWebBaseUrlCandidates();
  let lastError = 'Unknown load failure';

  for (const baseUrl of candidates) {
    try {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      await mainWindow.loadURL(baseUrl);
      activeDesktopBaseUrl = baseUrl;
      lastDesktopLoadError = null;
      console.info(`[desktop-routing] loaded-base-url=${baseUrl}`);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown load failure';
      lastDesktopLoadError = `${baseUrl}: ${lastError}`;
      console.warn(`[desktop-routing] failed-base-url=${baseUrl} reason=${lastError}`);
    }
  }

  const primaryBase = candidates[0] ?? PACKAGED_WEB_BASE_URL;
  activeDesktopBaseUrl = null;
  await showDesktopLoadError(primaryBase, lastError);
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
    process.env.DESKTOP_UPDATE_FEED_URL?.trim() ||
    BUILD_DESKTOP_UPDATE_FEED_URL ||
    DEFAULT_DESKTOP_UPDATE_FEED_URL;
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

  if (request.copies && request.copies > 1) {
    baseOptions.copies = request.copies;
  }

  if (request.layout === 'thermal-sticker') {
    baseOptions.landscape = false;
    baseOptions.scaleFactor = 100;
    baseOptions.margins = {
      marginType: 'none',
    };
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

function createPrintWindow(request: PrintHtmlRequest) {
  const isSilent = Boolean(request.silent);

  return new BrowserWindow({
    show: !isSilent,
    title: request.title ?? 'Print Document',
    width: 520,
    height: 720,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
}

async function printHtmlWithNativeDialog(request: PrintHtmlRequest) {
  const diagnostics: PrintDiagnosticEvent[] = [];
  const printerError = await validateRequestedPrinter(request);
  if (printerError) {
    console.error('[desktop-print] printer-validation-failed', {
      layout: request.layout,
      title: request.title,
      deviceName: request.deviceName,
      reason: printerError,
    });
    return { ok: false, reason: printerError };
  }

  const printWindow = createPrintWindow(request);
  attachPrintWindowDiagnostics(printWindow, diagnostics);

  try {
    const title = request.title ?? 'Print Document';
    const html = request.html.replace('<head>', `<head><title>${title}</title>`);
    const encoded = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    console.info('[desktop-print] load-start', {
      layout: request.layout,
      title,
      silent: Boolean(request.silent),
      deviceName: request.deviceName ?? null,
      copies: request.copies ?? 1,
      htmlLength: request.html.length,
    });
    await printWindow.loadURL(encoded);
    if (!request.silent) {
      printWindow.show();
      printWindow.focus();
      await waitForPrintDialogWindow();
    }

    const result = await printLoadedWindow(request, printWindow, diagnostics);
    if (!result.ok && !request.silent) {
      console.error('[desktop-print] keeping-window-open-after-failure', {
        title,
        diagnostics,
      });
      return result;
    }

    if (!printWindow.isDestroyed()) {
      printWindow.close();
    }
    return result;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown print load error.';
    console.error('[desktop-print] load-failed', {
      layout: request.layout,
      title: request.title,
      deviceName: request.deviceName,
      reason,
      diagnostics,
    });
    return { ok: false, reason };
  } finally {
    if (request.silent && !printWindow.isDestroyed()) {
      printWindow.close();
    }
  }
}

async function printLoadedWindow(
  request: PrintHtmlRequest,
  printWindow: BrowserWindow,
  diagnostics: PrintDiagnosticEvent[],
) {
  const options = getPrintOptions(request);
  const printers = await printWindow.webContents.getPrintersAsync();
  const printerSummary = printers.map((printer) => ({
    name: printer.name,
    displayName: printer.displayName,
    description: printer.description,
    options: printer.options,
  }));

  console.info('[desktop-print] print-start', {
    layout: request.layout,
    title: request.title,
    options,
    printers: printerSummary,
    diagnostics,
  });

  return new Promise<{ ok: boolean; reason?: string }>((resolve) => {
    printWindow.webContents.print(options, (success, failureReason) => {
      const result = {
        success,
        failureReason: failureReason || null,
        diagnostics,
      };
      if (success) {
        console.info('[desktop-print] print-success', {
          layout: request.layout,
          title: request.title,
        });
      } else {
        console.error('[desktop-print] print-failed', {
          layout: request.layout,
          title: request.title,
          failureReason: failureReason || null,
          options,
          printers: printerSummary,
          diagnostics,
        });
      }
      resolve({
        ok: success,
        reason: success
          ? undefined
          : `${failureReason || 'Print was cancelled or failed.'} ${JSON.stringify(result)}`,
      });
    });
  });
}

function attachPrintWindowDiagnostics(
  printWindow: BrowserWindow,
  diagnostics: PrintDiagnosticEvent[],
) {
  const record = (event: string, details?: unknown) => {
    const entry = { event, details };
    diagnostics.push(entry);
    console.info('[desktop-print] diagnostic', entry);
  };

  printWindow.once('ready-to-show', () => record('ready-to-show'));
  printWindow.once('closed', () => record('closed'));
  printWindow.once('unresponsive', () => record('unresponsive'));
  printWindow.once('responsive', () => record('responsive'));

  printWindow.webContents.once('did-finish-load', () => record('did-finish-load'));
  printWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) =>
    record('did-fail-load', { errorCode, errorDescription, validatedURL }),
  );
  printWindow.webContents.on(
    'did-fail-provisional-load',
    (_event, errorCode, errorDescription, validatedURL) =>
      record('did-fail-provisional-load', { errorCode, errorDescription, validatedURL }),
  );
  printWindow.webContents.on('render-process-gone', (_event, details) =>
    record('render-process-gone', details),
  );
  printWindow.webContents.on('console-message', (_event, level, message, line, sourceId) =>
    record('console-message', { level, message, line, sourceId }),
  );
}

async function waitForPrintDialogWindow() {
  await new Promise((resolve) => setTimeout(resolve, 300));
}

async function validateRequestedPrinter(request: PrintHtmlRequest) {
  const requestedPrinter = request.deviceName?.trim();
  if (!requestedPrinter || !mainWindow || mainWindow.isDestroyed()) return null;

  const printers = await mainWindow.webContents.getPrintersAsync();
  const printerExists = printers.some((printer) => printer.name === requestedPrinter);
  if (printerExists) return null;

  return `Printer "${requestedPrinter}" is not available. Refresh printer routing and select the installed printer again.`;
}

function registerIpcHandlers() {
  ipcMain.handle('app:retry-load', async () => {
    if (!app.isPackaged) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        await mainWindow.reload();
      }
      return { ok: true };
    }

    await loadPackagedMainContent();
    return { ok: true };
  });

  ipcMain.handle('app:open-external', async (_event, url: string) => {
    if (!url || typeof url !== 'string') return { ok: false, reason: 'Invalid URL' };
    await shell.openExternal(url);
    return { ok: true };
  });

  ipcMain.handle('app:get-network-diagnostics', async () => buildDesktopNetworkDiagnostics());

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

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame) return;
      const details = `${errorDescription} (code: ${errorCode}) while loading ${validatedURL}`;
      lastDesktopLoadError = details;
      console.error(`[desktop-routing] did-fail-load ${details}`);
      void showDesktopLoadError(
        getPackagedWebBaseUrlCandidates()[0] ?? PACKAGED_WEB_BASE_URL,
        details,
      );
    },
  );

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    const reason = `${details.reason}${details.exitCode ? ` (exit: ${details.exitCode})` : ''}`;
    lastDesktopLoadError = `Renderer process crashed: ${reason}`;
    console.error(`[desktop-runtime] render-process-gone ${reason}`);
    void showDesktopLoadError(
      getPackagedWebBaseUrlCandidates()[0] ?? PACKAGED_WEB_BASE_URL,
      `Renderer process crashed: ${reason}`,
    );
  });

  mainWindow.on('unresponsive', () => {
    lastDesktopLoadError = 'The renderer became unresponsive.';
    console.error('[desktop-runtime] renderer unresponsive');
    void showDesktopLoadError(
      getPackagedWebBaseUrlCandidates()[0] ?? PACKAGED_WEB_BASE_URL,
      'The renderer became unresponsive.',
    );
  });

  void loadPackagedMainContent();
  mainWindow.webContents.once('did-finish-load', () => {
    if (!pendingDeepLink) return;
    const link = pendingDeepLink;
    pendingDeepLink = null;
    void navigateToDeepLink(link);
  });
}

function configureDesktopCapturePermissions() {
  const ses = session.defaultSession;

  ses.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === 'media') {
      return true;
    }
    return false;
  });

  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
      return;
    }
    callback(false);
  });

  ses.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['screen', 'window'],
          fetchWindowIcons: true,
          thumbnailSize: { width: 320, height: 180 },
        });

        const preferred =
          sources.find((source) => source.id.startsWith('screen:')) ?? sources[0] ?? null;

        if (!preferred) {
          callback({ video: undefined, audio: undefined });
          return;
        }

        callback({
          video: preferred,
          audio: 'loopback',
        });
      } catch {
        callback({ video: undefined, audio: undefined });
      }
    },
    { useSystemPicker: true },
  );
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
  logDesktopRoutingSelection();
  attachDesktopNetworkLogging();

  if (app.isPackaged) {
    app.setAsDefaultProtocolClient('vipex');
  }

  configureAutoUpdater();
  configureDesktopCapturePermissions();
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
