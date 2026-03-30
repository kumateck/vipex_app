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

contextBridge.exposeInMainWorld('api', {
  platform: async () => process.platform,
  ping: async () => 'pong',
  retryDesktopLoad: async () => ipcRenderer.invoke('app:retry-load'),
  openInBrowser: async (url: string) => ipcRenderer.invoke('app:open-external', url),
  printHtml: async (request: {
    html: string;
    layout: 'thermal-sticker' | 'invoice-a5' | 'invoice-a5-receipt' | 'report-a4';
    title?: string;
    silent?: boolean;
    deviceName?: string;
  }) => ipcRenderer.invoke('print:html', request),
  printParallel: async (request: {
    jobs: Array<{
      html: string;
      layout: 'thermal-sticker' | 'invoice-a5' | 'invoice-a5-receipt' | 'report-a4';
      title?: string;
      silent?: boolean;
      deviceName?: string;
    }>;
  }) => ipcRenderer.invoke('print:parallel', request),
  listPrinters: async () => ipcRenderer.invoke('print:list-printers'),
  updates: {
    getStatus: async () => ipcRenderer.invoke('updates:get-status') as Promise<UpdateStatus>,
    check: async () =>
      ipcRenderer.invoke('updates:check') as Promise<{
        ok: boolean;
        reason?: string;
        status: UpdateStatus;
      }>,
    download: async () =>
      ipcRenderer.invoke('updates:download') as Promise<{
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
