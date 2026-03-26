import { app, BrowserWindow, ipcMain, type WebContentsPrintOptions } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow: BrowserWindow | null = null;

type PrintLayout = 'thermal-sticker' | 'invoice-a5' | 'invoice-a5-receipt' | 'report-a4';

type PrintHtmlRequest = {
  html: string;
  layout: PrintLayout;
  title?: string;
  silent?: boolean;
  deviceName?: string;
};

if (!app.isPackaged) {
  // Avoid stale CSS/asset cache during desktop dev.
  app.commandLine.appendSwitch('disable-http-cache');
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
    return;
  }

  mainWindow.loadFile(path.resolve(process.cwd(), '../web/dist/index.html'));
}

app.whenReady().then(() => {
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
