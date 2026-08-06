import { afterEach, describe, expect, test } from 'bun:test';
import { printViaDesktop } from '@/features/printing/services/desktop-print';
import { getPreferredPrinterForLayout } from '@/features/printing/services/printer-preferences';
import type { DesktopPrintRequest } from '@/features/printing/types';

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
});
