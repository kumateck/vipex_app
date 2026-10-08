import { afterEach, describe, expect, test } from 'bun:test';
import { getPrintOptions } from '../../apps/desktop/src/printing/print-options';
import {
  prepareReceiptPaper,
  receiptHeightMicrons,
} from '../../apps/desktop/src/printing/receipt-paper';
import { createPrintableHtmlDocument } from '@/features/printing/services/html-document';
import {
  printParallelViaDesktop,
  printViaDesktop,
} from '@/features/printing/services/desktop-print';
import {
  getPrinterPreferenceMapping,
  setPrinterPreferenceMapping,
} from '@/features/printing/services/printer-preferences';
import {
  normalizeReceiptPaperFormat,
  receiptLayoutFromHtml,
} from '@/shared/printing/receipt-paper';
import type { DesktopPrintRequest, DesktopParallelPrintRequest } from '@/features/printing/types';

function installPreferences() {
  const values = new Map<string, string>();
  Reflect.set(globalThis, 'localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
  Reflect.set(globalThis, 'window', { dispatchEvent: () => true });
  return values;
}
afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
  Reflect.deleteProperty(globalThis, 'localStorage');
});

const body = (width: 58 | 80) =>
  `<div class="thermal-receipt-root" data-receipt-paper="xprinter-${width}mm">Receipt</div>`;

describe('Xprinter profile and routing', () => {
  test('defaults old/invalid profiles to A5 and persists the selected device and paper width', () => {
    installPreferences();
    expect(normalizeReceiptPaperFormat('unknown')).toBe('a5');
    expect(getPrinterPreferenceMapping().receiptPaperFormat).toBe('a5');
    setPrinterPreferenceMapping({ invoicePrinter: 'XP-80', receiptPaperFormat: 'xprinter-80mm' });
    expect(getPrinterPreferenceMapping()).toMatchObject({
      invoicePrinter: 'XP-80',
      receiptPaperFormat: 'xprinter-80mm',
    });
    setPrinterPreferenceMapping({});
    expect(getPrinterPreferenceMapping().receiptPaperFormat).toBe('a5');
    expect(getPrinterPreferenceMapping().invoicePrinter).toBeUndefined();
  });

  test('HTML and native options agree on roll width without A5 landscape sizing', () => {
    for (const width of [58, 80] as const) {
      const html = createPrintableHtmlDocument({
        title: 'Receipt',
        bodyHtml: body(width),
        pageStyle: '@page { size: A5 landscape; }',
      });
      expect(html).toContain(`size: ${width}mm 297mm`);
      expect(html).not.toContain('A5 landscape');
      const layout = receiptLayoutFromHtml(html)!;
      expect(getPrintOptions({ html, layout }, 150000)).toMatchObject({
        pageSize: { width: width * 1000, height: 150000 },
        landscape: false,
        scaleFactor: 100,
        margins: { marginType: 'none' },
        duplexMode: 'simplex',
      });
      expect(getPrintOptions({ html, layout }).pageRanges).toBeUndefined();
    }
  });

  test('preserves legacy A5 landscape receipts, stickers and A4', () => {
    expect(getPrintOptions({ html: '', layout: 'invoice-a5-receipt' })).toMatchObject({
      pageSize: 'A5',
      landscape: true,
    });
    expect(getPrintOptions({ html: '', layout: 'thermal-sticker', copies: 3 })).toMatchObject({
      pageSize: { width: 100000, height: 100000 },
      landscape: false,
      copies: 3,
    });
    expect(getPrintOptions({ html: '', layout: 'report-a4' }).pageSize).toBe('A4');
  });

  test('measures roll height with clearance, rejects invalid/oversize content and updates print CSS', async () => {
    expect(receiptHeightMicrons(96)).toBe(30000);
    expect(receiptHeightMicrons(384)).toBe(105600);
    for (const height of [NaN, Infinity, 0, -1, 10000])
      expect(() => receiptHeightMicrons(height)).toThrow();
    let css = '';
    const contents = {
      executeJavaScript: async () => 384,
      insertCSS: async (value: string) => {
        css = value;
        return 'css-key';
      },
    };
    expect(await prepareReceiptPaper(contents, 'receipt-80mm')).toBe(105600);
    expect(css).toContain('size: 80mm 105.6mm');
    expect(await prepareReceiptPaper(contents, 'report-a4')).toBeUndefined();
    await expect(
      prepareReceiptPaper(
        { ...contents, executeJavaScript: async () => undefined },
        'receipt-58mm',
      ),
    ).rejects.toThrow('content is missing');
  });

  test('routes a vertical receipt to the selected Xprinter and honors explicit device overrides', async () => {
    installPreferences();
    setPrinterPreferenceMapping({ invoicePrinter: 'XP-80', receiptPaperFormat: 'xprinter-80mm' });
    const requests: DesktopPrintRequest[] = [];
    Reflect.set(globalThis, 'window', {
      api: {
        printHtml: async (request: DesktopPrintRequest) => {
          requests.push(request);
          return { ok: true };
        },
      },
    });
    await printViaDesktop({ html: body(80), layout: 'invoice-a5-receipt' });
    await printViaDesktop({ html: body(58), layout: 'invoice-a5-receipt', deviceName: 'XP-58' });
    expect(requests[0]).toMatchObject({
      layout: 'receipt-80mm',
      deviceName: 'XP-80',
      silent: true,
    });
    expect(requests[1]).toMatchObject({ layout: 'receipt-58mm', deviceName: 'XP-58' });
  });

  test('parallel sticker and Xprinter receipt jobs retain their own printer, layout and copies', async () => {
    installPreferences();
    setPrinterPreferenceMapping({ stickerPrinter: 'Label printer', invoicePrinter: 'XP-80' });
    let dispatched: DesktopParallelPrintRequest | undefined;
    Reflect.set(globalThis, 'window', {
      api: {
        printParallel: async (request: DesktopParallelPrintRequest) => {
          dispatched = request;
          return { ok: true, jobs: request.jobs.map((job) => ({ ...job, ok: true })) };
        },
      },
    });
    await printParallelViaDesktop({
      jobs: [
        { html: 'Sticker', layout: 'thermal-sticker', copies: 2 },
        { html: body(80), layout: 'invoice-a5-receipt' },
      ],
    });
    expect(dispatched?.jobs[0]).toMatchObject({
      deviceName: 'Label printer',
      layout: 'thermal-sticker',
      copies: 2,
    });
    expect(dispatched?.jobs[1]).toMatchObject({ deviceName: 'XP-80', layout: 'receipt-80mm' });
    expect(dispatched?.jobs[1].copies).toBeUndefined();
  });
});
