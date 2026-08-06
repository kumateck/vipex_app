import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  getPrintRuntime,
  getPrinterPreferenceMapping,
  listDesktopPrinters,
  setPrinterPreferenceMapping,
} from '@/features/printing';

function normalizePrinterNames(printers: Array<{ name?: string | null }>) {
  return printers
    .map((printer) => printer.name?.trim())
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b));
}

export function useDesktopPrinterRouting() {
  const [printerMapping, setPrinterMapping] = useState(() => getPrinterPreferenceMapping());
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [printerNames, setPrinterNames] = useState<string[]>([]);
  const isDesktopRuntime = useMemo(() => getPrintRuntime() === 'desktop', []);
  const stickerPrinter = printerMapping.stickerPrinter ?? '';
  const invoicePrinter = printerMapping.invoicePrinter ?? '';
  const a4Printer = printerMapping.a4Printer ?? '';

  const refreshPrinters = useCallback(async () => {
    try {
      setIsLoadingPrinters(true);
      const printers = await listDesktopPrinters();
      setPrinterNames(normalizePrinterNames(printers));
    } catch {
      toast.error('Failed to refresh printer list');
    } finally {
      setIsLoadingPrinters(false);
    }
  }, []);

  useEffect(() => {
    if (!isDesktopRuntime) return;
    void refreshPrinters();
  }, [isDesktopRuntime, refreshPrinters]);

  function savePrinterMapping() {
    setPrinterPreferenceMapping({
      stickerPrinter: stickerPrinter || undefined,
      invoicePrinter: invoicePrinter || undefined,
      a4Printer: a4Printer || undefined,
    });
    toast.success('Printer routing saved');
  }

  function clearPrinterMapping() {
    setPrinterMapping({});
    setPrinterPreferenceMapping({});
    toast.success('Printer routing cleared');
  }

  return {
    a4Printer,
    clearPrinterMapping,
    invoicePrinter,
    isDesktopRuntime,
    isLoadingPrinters,
    printerNames,
    refreshPrinters,
    savePrinterMapping,
    setA4Printer: (a4Printer: string) =>
      setPrinterMapping((current) => ({ ...current, a4Printer })),
    setInvoicePrinter: (invoicePrinter: string) =>
      setPrinterMapping((current) => ({ ...current, invoicePrinter })),
    setStickerPrinter: (stickerPrinter: string) =>
      setPrinterMapping((current) => ({ ...current, stickerPrinter })),
    stickerPrinter,
  };
}
