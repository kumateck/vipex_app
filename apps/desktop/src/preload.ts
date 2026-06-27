import { contextBridge, ipcRenderer } from 'electron';

type UpdateStatus = {
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
};

type UpdateAuthRequest = {
  accessToken?: string | null;
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
  probes: Array<{
    host: string;
    ok: boolean;
    resolvedAddress?: string;
    error?: string;
  }>;
  lastLoadError: string | null;
};

contextBridge.exposeInMainWorld('api', {
  platform: async () => process.platform,
  ping: async () => 'pong',
  retryDesktopLoad: async () => ipcRenderer.invoke('app:retry-load'),
  getNetworkDiagnostics: async () =>
    ipcRenderer.invoke('app:get-network-diagnostics') as Promise<DesktopNetworkDiagnostics>,
  openInBrowser: async (url: string) => ipcRenderer.invoke('app:open-external', url),
  printHtml: async (request: {
    html: string;
    layout: 'thermal-sticker' | 'invoice-a5' | 'invoice-a5-receipt' | 'report-a4';
    title?: string;
    silent?: boolean;
    deviceName?: string;
    copies?: number;
  }) => ipcRenderer.invoke('print:html', request),
  printParallel: async (request: {
    jobs: Array<{
      html: string;
      layout: 'thermal-sticker' | 'invoice-a5' | 'invoice-a5-receipt' | 'report-a4';
      title?: string;
      silent?: boolean;
      deviceName?: string;
      copies?: number;
    }>;
  }) => ipcRenderer.invoke('print:parallel', request),
  listPrinters: async () => ipcRenderer.invoke('print:list-printers'),
  updates: {
    getStatus: async () => ipcRenderer.invoke('updates:get-status') as Promise<UpdateStatus>,
    check: async (request?: UpdateAuthRequest) =>
      ipcRenderer.invoke('updates:check', request) as Promise<{
        ok: boolean;
        reason?: string;
        status: UpdateStatus;
      }>,
    download: async (request?: UpdateAuthRequest) =>
      ipcRenderer.invoke('updates:download', request) as Promise<{
        ok: boolean;
        reason?: string;
        status: UpdateStatus;
      }>,
    install: async () =>
      ipcRenderer.invoke('updates:install') as Promise<{
        ok: boolean;
        reason?: string;
      }>,
    onStatus: (handler: (status: UpdateStatus) => void) => {
      const listener = (_event: unknown, status: UpdateStatus) => {
        handler(status);
      };
      ipcRenderer.on('updates:status', listener);
      return () => {
        ipcRenderer.removeListener('updates:status', listener);
      };
    },
  },
});
