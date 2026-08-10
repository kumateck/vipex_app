import { afterEach, describe, expect, test } from 'bun:test';
import {
  printParallelViaDesktop,
  printViaDesktop,
} from '@/features/printing/services/desktop-print';
import { getPreferredPrinterForLayout } from '@/features/printing/services/printer-preferences';
import type { DesktopParallelPrintRequest, DesktopPrintRequest } from '@/features/printing/types';

const MAPPING = {
  stickerPrinter: 'Thermal Printer',
  invoicePrinter: 'A5 Printer',
  a4Printer: 'A4 Office Printer',
};

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage');
  Reflect.deleteProperty(globalThis, 'window');
});

describe('printer preference routing', () => {
  test('routes each supported layout to its configured printer', () => {
    expect(getPreferredPrinterForLayout('thermal-sticker', MAPPING)).toBe('Thermal Printer');
    expect(getPreferredPrinterForLayout('invoice-a5', MAPPING)).toBe('A5 Printer');
    expect(getPreferredPrinterForLayout('invoice-a5-receipt', MAPPING)).toBe('A5 Printer');
    expect(getPreferredPrinterForLayout('report-a4', MAPPING)).toBe('A4 Office Printer');
  });

  test('dispatches A4 desktop jobs silently to the configured printer', async () => {
    let dispatchedRequest: DesktopPrintRequest | undefined;
    const preferences = new Map([['vipex:printer:a4', MAPPING.a4Printer]]);

    Reflect.set(globalThis, 'localStorage', {
      getItem: (key: string) => preferences.get(key) ?? null,
      removeItem: (key: string) => preferences.delete(key),
      setItem: (key: string, value: string) => preferences.set(key, value),
    });
    Reflect.set(globalThis, 'window', {
      api: {
        printHtml: (request: DesktopPrintRequest) => {
          dispatchedRequest = request;
          return Promise.resolve({ ok: true });
        },
      },
    });

    const result = await printViaDesktop({
      html: '<p>Daily report</p>',
      layout: 'report-a4',
      title: 'Daily report',
    });

    expect(result.ok).toBe(true);
    expect(dispatchedRequest).toEqual({
      deviceName: MAPPING.a4Printer,
      html: '<p>Daily report</p>',
      layout: 'report-a4',
      silent: true,
      title: 'Daily report',
    });
  });

  test('dispatches A5 receipts silently to the configured invoice printer', async () => {
    let dispatchedRequest: DesktopPrintRequest | undefined;
    installDesktopPrintMocks((request) => {
      dispatchedRequest = request;
      return Promise.resolve({ ok: true });
    });

    const result = await printViaDesktop({
      html: '<p>Parcel receipt</p>',
      layout: 'invoice-a5-receipt',
      title: 'Parcel receipt',
    });

    expect(result.ok).toBe(true);
    expect(dispatchedRequest?.deviceName).toBe(MAPPING.invoicePrinter);
    expect(dispatchedRequest?.silent).toBe(true);
  });

  test('routes parallel sticker and receipt jobs to separate printers', async () => {
    let dispatchedRequest: DesktopParallelPrintRequest | undefined;
    installPrinterPreferences();
    Reflect.set(globalThis, 'window', {
      api: {
        printParallel: (request: DesktopParallelPrintRequest) => {
          dispatchedRequest = request;
          return Promise.resolve({
            ok: true,
            jobs: request.jobs.map((job) => ({ ...job, ok: true })),
          });
        },
      },
    });

    const result = await printParallelViaDesktop({
      jobs: [
        { html: '<p>Sticker</p>', layout: 'thermal-sticker', title: 'Sticker' },
        { html: '<p>Receipt</p>', layout: 'invoice-a5-receipt', title: 'Receipt' },
      ],
    });

    expect(result.ok).toBe(true);
    expect(dispatchedRequest?.jobs).toEqual([
      expect.objectContaining({ deviceName: MAPPING.stickerPrinter, silent: true }),
      expect.objectContaining({ deviceName: MAPPING.invoicePrinter, silent: true }),
    ]);
  });
});

function installPrinterPreferences() {
  const preferences = new Map([
    ['vipex:printer:sticker', MAPPING.stickerPrinter],
    ['vipex:printer:invoice', MAPPING.invoicePrinter],
    ['vipex:printer:a4', MAPPING.a4Printer],
  ]);
  Reflect.set(globalThis, 'localStorage', {
    getItem: (key: string) => preferences.get(key) ?? null,
    removeItem: (key: string) => preferences.delete(key),
    setItem: (key: string, value: string) => preferences.set(key, value),
  });
}

function installDesktopPrintMocks(
  printHtml: (request: DesktopPrintRequest) => Promise<{ ok: true }>,
) {
  installPrinterPreferences();
  Reflect.set(globalThis, 'window', { api: { printHtml } });
}
