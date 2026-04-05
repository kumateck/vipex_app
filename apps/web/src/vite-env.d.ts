/// <reference types="vite/client" />

type PrintLayout = 'thermal-sticker' | 'invoice-a5' | 'invoice-a5-receipt' | 'report-a4';

type DesktopPrinterInfo = {
  name: string;
  displayName?: string;
  description?: string;
  status?: number;
  isDefault?: boolean;
};

type DesktopUpdateStatus = {
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

declare global {
  const __APP_BUILD_ID__: string;

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
      printParallel: (request: {
        jobs: Array<{
          html: string;
          layout: PrintLayout;
          title?: string;
          silent?: boolean;
          deviceName?: string;
        }>;
      }) => Promise<{
        ok: boolean;
        jobs: Array<{
          ok: boolean;
          reason?: string;
          layout: PrintLayout;
          deviceName?: string;
          title?: string;
        }>;
      }>;
      listPrinters: () => Promise<DesktopPrinterInfo[]>;
      updates: {
        getStatus: () => Promise<DesktopUpdateStatus>;
        check: () => Promise<{
          ok: boolean;
          reason?: string;
          status: DesktopUpdateStatus;
        }>;
        download: () => Promise<{
          ok: boolean;
          reason?: string;
          status: DesktopUpdateStatus;
        }>;
        install: () => Promise<{ ok: boolean; reason?: string }>;
        onStatus: (handler: (status: DesktopUpdateStatus) => void) => () => void;
      };
    };
  }
}

export {};
