export type ReceiptPaperFormat = 'a5' | 'xprinter-80mm' | 'xprinter-58mm';
export type RollReceiptLayout = 'receipt-80mm' | 'receipt-58mm';

export function normalizeReceiptPaperFormat(value: string | null | undefined): ReceiptPaperFormat {
  return value === 'xprinter-80mm' || value === 'xprinter-58mm' ? value : 'a5';
}

export function receiptPaperWidth(format: Exclude<ReceiptPaperFormat, 'a5'>) {
  return format === 'xprinter-58mm' ? 58 : 80;
}

export function receiptLayoutFromHtml(html: string): RollReceiptLayout | undefined {
  if (/data-receipt-paper="xprinter-80mm"/.test(html)) return 'receipt-80mm';
  if (/data-receipt-paper="xprinter-58mm"/.test(html)) return 'receipt-58mm';
  return undefined;
}

export function rollWidthForLayout(layout: string): number | undefined {
  if (layout === 'receipt-80mm') return 80;
  if (layout === 'receipt-58mm') return 58;
  return undefined;
}
