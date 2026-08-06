import type { PrintLayout } from '../types';

const STICKER_PRINTER_KEY = 'vipex:printer:sticker';
const INVOICE_PRINTER_KEY = 'vipex:printer:invoice';
const A4_PRINTER_KEY = 'vipex:printer:a4';

export type PrinterPreferenceMapping = {
  stickerPrinter?: string;
  invoicePrinter?: string;
  a4Printer?: string;
};

export function getPrinterPreferenceMapping(): PrinterPreferenceMapping {
  if (typeof window === 'undefined') return {};
  const stickerPrinter = localStorage.getItem(STICKER_PRINTER_KEY)?.trim() || undefined;
  const invoicePrinter = localStorage.getItem(INVOICE_PRINTER_KEY)?.trim() || undefined;
  const a4Printer = localStorage.getItem(A4_PRINTER_KEY)?.trim() || undefined;
  return { stickerPrinter, invoicePrinter, a4Printer };
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

  if (mapping.a4Printer?.trim()) {
    localStorage.setItem(A4_PRINTER_KEY, mapping.a4Printer.trim());
  } else {
    localStorage.removeItem(A4_PRINTER_KEY);
  }
}

export function getPreferredPrinterForLayout(
  layout: PrintLayout,
  mapping: PrinterPreferenceMapping = getPrinterPreferenceMapping(),
) {
  if (layout === 'thermal-sticker') return mapping.stickerPrinter;
  if (layout === 'invoice-a5' || layout === 'invoice-a5-receipt') {
    return mapping.invoicePrinter;
  }
  return mapping.a4Printer;
}
