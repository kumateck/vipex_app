import type { PrintLayout } from '../types';
import {
  normalizeReceiptPaperFormat,
  type ReceiptPaperFormat,
} from '@/shared/printing/receipt-paper';

export const RECEIPT_PAPER_KEY = 'vipex:printer:receipt-paper';
export const PRINTER_PREFERENCES_CHANGED = 'vipex:printer-preferences-changed';

const STICKER_PRINTER_KEY = 'vipex:printer:sticker';
const INVOICE_PRINTER_KEY = 'vipex:printer:invoice';
const A4_PRINTER_KEY = 'vipex:printer:a4';

export type PrinterPreferenceMapping = {
  stickerPrinter?: string;
  invoicePrinter?: string;
  a4Printer?: string;
  receiptPaperFormat?: ReceiptPaperFormat;
};

export function getPrinterPreferenceMapping(): PrinterPreferenceMapping {
  if (typeof window === 'undefined') return {};
  const stickerPrinter = localStorage.getItem(STICKER_PRINTER_KEY)?.trim() || undefined;
  const invoicePrinter = localStorage.getItem(INVOICE_PRINTER_KEY)?.trim() || undefined;
  const a4Printer = localStorage.getItem(A4_PRINTER_KEY)?.trim() || undefined;
  const receiptPaperFormat = getReceiptPaperFormat();
  return { stickerPrinter, invoicePrinter, a4Printer, receiptPaperFormat };
}

export function setPrinterPreferenceMapping(mapping: PrinterPreferenceMapping) {
  if (typeof window === 'undefined') return;

  if (mapping.stickerPrinter?.trim()) {
    localStorage.setItem(STICKER_PRINTER_KEY, mapping.stickerPrinter.trim());
  } else {
    localStorage.removeItem(STICKER_PRINTER_KEY);
  }

  if (mapping.invoicePrinter?.trim()) {
    localStorage.setItem(INVOICE_PRINTER_KEY, mapping.invoicePrinter.trim());
  } else {
    localStorage.removeItem(INVOICE_PRINTER_KEY);
  }

  localStorage.setItem(RECEIPT_PAPER_KEY, normalizeReceiptPaperFormat(mapping.receiptPaperFormat));
  if (mapping.a4Printer?.trim()) {
    localStorage.setItem(A4_PRINTER_KEY, mapping.a4Printer.trim());
  } else {
    localStorage.removeItem(A4_PRINTER_KEY);
  }
  window.dispatchEvent?.(new Event(PRINTER_PREFERENCES_CHANGED));
}

export function getReceiptPaperFormat(): ReceiptPaperFormat {
  if (typeof window === 'undefined') return 'a5';
  return normalizeReceiptPaperFormat(localStorage.getItem(RECEIPT_PAPER_KEY));
}

export function getPreferredPrinterForLayout(
  layout: PrintLayout,
  mapping: PrinterPreferenceMapping = getPrinterPreferenceMapping(),
) {
  if (layout === 'thermal-sticker') return mapping.stickerPrinter;
  if (
    layout === 'invoice-a5' ||
    layout === 'invoice-a5-receipt' ||
    layout === 'receipt-80mm' ||
    layout === 'receipt-58mm'
  ) {
    return mapping.invoicePrinter;
  }
  return mapping.a4Printer;
}
