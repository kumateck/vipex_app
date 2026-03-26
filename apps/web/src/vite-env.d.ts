/// <reference types="vite/client" />

type PrintLayout = 'thermal-sticker' | 'invoice-a5' | 'invoice-a5-receipt' | 'report-a4';

type DesktopPrinterInfo = {
  name: string;
  displayName?: string;
  description?: string;
  status?: number;
  isDefault?: boolean;
};

declare global {
  interface Window {
    api?: {
      platform: () => Promise<NodeJS.Platform>;
      ping: () => Promise<string>;
      printHtml: (request: {
        html: string;
        layout: PrintLayout;
        title?: string;
        silent?: boolean;
        deviceName?: string;
      }) => Promise<{ ok: boolean; reason?: string }>;
      listPrinters: () => Promise<DesktopPrinterInfo[]>;
    };
  }
}

export {};
