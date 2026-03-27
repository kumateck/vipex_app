import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  platform: async () => process.platform,
  ping: async () => 'pong',
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
});
