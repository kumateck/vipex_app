import { afterEach, describe, expect, test } from 'bun:test';
import {
  prepareLandscapeReceipt,
  normalizeReceiptPaperFormat,
  receiptLayoutFromHtml,
} from '@/shared/printing';
import { createPrintableHtmlDocument } from '@/features/printing/services/html-document';
import {
  printViaDesktop,
  printParallelViaDesktop,
} from '@/features/printing/services/desktop-print';
import { setPrinterPreferenceMapping } from '@/features/printing/services/printer-preferences';
import { prepareReceiptPaper } from '../../apps/desktop/src/printing/receipt-paper';
import { getPrintOptions } from '../../apps/desktop/src/printing/print-options';
import type { DesktopPrintRequest, DesktopParallelPrintRequest } from '@/features/printing/types';

function fixture(height = 420) {
  const root = { style: {}, getBoundingClientRect: () => ({ width: (198 * 96) / 25.4, height }) };
  let css = '';
  const document = {
    querySelector: () => root,
    body: { append: () => {} },
    createElement: () => ({ textContent: '' }),
    head: {
      append: (style: { textContent: string }) => {
        css = style.textContent;
      },
    },
  } as unknown as Document;
  return { document, root, css: () => css };
}
afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
  Reflect.deleteProperty(globalThis, 'localStorage');
});
describe('browser-style acknowledgement on an 80 mm roll', () => {
  test('rotates original artwork inside the printable width with positive offsets and feed clearance', () => {
    const { document, root, css } = fixture();
    const height = prepareLandscapeReceipt(document)!;
    const transform = (root.style as { transform: string }).transform;
    const values = transform.match(
      /translate\(([\d.]+)px, ([\d.]+)px\) rotate\(90deg\) scale\(([\d.]+)\)/,
    )!;
    const [left, top, scale] = values.slice(1).map(Number) as [number, number, number];
    const pixelsPerMm = 96 / 25.4;
    expect((420 * scale) / pixelsPerMm).toBeCloseTo(72);
    expect((left - 420 * scale) / pixelsPerMm).toBeCloseTo(4);
    expect(left / pixelsPerMm).toBeCloseTo(76);
    expect(top / pixelsPerMm).toBeCloseTo(2);
    expect(height).toBeGreaterThan(198 * pixelsPerMm * scale + top);
    expect(css()).toContain('size: 80mm');
    expect(css()).not.toContain('A5');
  });
  test('allows wrapped taller receipts, rejects invalid artwork and ignores other document types', () => {
    expect(prepareLandscapeReceipt(fixture(800).document)).toBeLessThan(
      prepareLandscapeReceipt(fixture().document)!,
    );
    for (const height of [0, NaN, Infinity, -1])
      expect(() => prepareLandscapeReceipt(fixture(height).document)).toThrow(
        'dimensions are invalid',
      );
    expect(
      prepareLandscapeReceipt({ querySelector: () => null } as unknown as Document),
    ).toBeUndefined();
  });
  test('uses identical prepared paper geometry for the native job, without applying scale twice', async () => {
    const preparedHeight = prepareLandscapeReceipt(fixture().document)!;
    const height = await prepareReceiptPaper(
      {
        executeJavaScript: async (script: string) => {
          expect(script).toContain('rotate(90deg)');
          return preparedHeight;
        },
        insertCSS: async () => {
          throw new Error('Do not replace the shared page geometry');
        },
      },
      'receipt-80mm',
    );
    expect(height).toBe(Math.ceil((preparedHeight * 25400) / 96));
    expect(getPrintOptions({ html: '', layout: 'receipt-80mm' }, height)).toMatchObject({
      pageSize: { width: 80000, height },
      landscape: false,
      scaleFactor: 100,
      margins: { marginType: 'none' },
    });
  });
  test('persists the new format and routes single/parallel receipt jobs independently of stickers', async () => {
    const values = new Map<string, string>();
    Reflect.set(globalThis, 'localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    let single: DesktopPrintRequest | undefined;
    let parallel: DesktopParallelPrintRequest | undefined;
    Reflect.set(globalThis, 'window', {
      dispatchEvent: () => true,
      api: {
        printHtml: async (job: DesktopPrintRequest) => {
          single = job;
          return { ok: true };
        },
        printParallel: async (jobs: DesktopParallelPrintRequest) => {
          parallel = jobs;
          return { ok: true, jobs: [] };
        },
      },
    });
    expect(normalizeReceiptPaperFormat('xprinter-80mm-landscape')).toBe('xprinter-80mm-landscape');
    setPrinterPreferenceMapping({
      invoicePrinter: 'XP-80C',
      stickerPrinter: 'TSC',
      receiptPaperFormat: 'xprinter-80mm-landscape',
    });
    const html = createPrintableHtmlDocument({
      title: 'Receipt',
      bodyHtml:
        '<div class="invoice-a5-root" data-receipt-paper="xprinter-80mm-landscape">Receipt</div>',
      pageStyle: '@page { size: A5 landscape; }',
    });
    expect(html).not.toContain('A5 landscape');
    expect(receiptLayoutFromHtml(html)).toBe('receipt-80mm');
    const job: DesktopPrintRequest = { html, layout: 'invoice-a5-receipt' };
    await printViaDesktop(job);
    expect(single).toMatchObject({ layout: 'receipt-80mm', deviceName: 'XP-80C', silent: true });
    await printParallelViaDesktop({
      jobs: [{ html: '', layout: 'thermal-sticker', copies: 2 }, job],
    });
    expect(parallel?.jobs[0]).toMatchObject({
      layout: 'thermal-sticker',
      deviceName: 'TSC',
      copies: 2,
    });
    expect(parallel?.jobs[1]).toMatchObject({ layout: 'receipt-80mm', deviceName: 'XP-80C' });
  });
});
