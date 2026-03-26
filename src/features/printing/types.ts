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

export type PrintRuntime = 'web' | 'desktop';
