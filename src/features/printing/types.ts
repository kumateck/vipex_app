export type PrintLayout = 'thermal-sticker' | 'invoice-a5' | 'invoice-a5-receipt' | 'report-a4';

export type DesktopPrintRequest = {
  html: string;
  layout: PrintLayout;
  title?: string;
  silent?: boolean;
  deviceName?: string;
};

export type DesktopPrintResult = {
  ok: boolean;
  reason?: string;
};

export type DesktopParallelPrintRequest = {
  jobs: [DesktopPrintRequest, DesktopPrintRequest];
};

export type DesktopParallelPrintResult = {
  ok: boolean;
  jobs: Array<
    DesktopPrintResult & {
      layout: PrintLayout;
      deviceName?: string;
      title?: string;
    }
  >;
};

export type PrintRuntime = 'web' | 'desktop';
