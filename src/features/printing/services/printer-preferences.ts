const STICKER_PRINTER_KEY = 'vipex:printer:sticker';
const INVOICE_PRINTER_KEY = 'vipex:printer:invoice';

export type PrinterPreferenceMapping = {
  stickerPrinter?: string;
  invoicePrinter?: string;
};

export function getPrinterPreferenceMapping(): PrinterPreferenceMapping {
  if (typeof window === 'undefined') return {};
  const stickerPrinter = localStorage.getItem(STICKER_PRINTER_KEY)?.trim() || undefined;
  const invoicePrinter = localStorage.getItem(INVOICE_PRINTER_KEY)?.trim() || undefined;
  return { stickerPrinter, invoicePrinter };
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
}
