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
  currentVersion?: string;
  availableVersion?: string;
  progress?: number;
  message?: string;
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

type DesktopUpdateAuthRequest = {
  accessToken?: string | null;
};

declare global {
  const __APP_BUILD_ID__: string;

  interface Window {
    api?: {
      platform: () => Promise<NodeJS.Platform>;
      ping: () => Promise<string>;
      getNetworkDiagnostics: () => Promise<DesktopNetworkDiagnostics>;
      printHtml: (request: {
        html: string;
        layout: PrintLayout;
        title?: string;
        silent?: boolean;
        deviceName?: string;
        copies?: number;
      }) => Promise<{ ok: boolean; reason?: string }>;
      printParallel: (request: {
        jobs: Array<{
          html: string;
          layout: PrintLayout;
          title?: string;
          silent?: boolean;
          deviceName?: string;
          copies?: number;
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
        check: (request?: DesktopUpdateAuthRequest) => Promise<{
          ok: boolean;
          reason?: string;
          status: DesktopUpdateStatus;
        }>;
        download: (request?: DesktopUpdateAuthRequest) => Promise<{
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
