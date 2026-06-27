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
    });
    toast.success('Printer routing saved');
  }

  function clearPrinterMapping() {
    setPrinterMapping({});
    setPrinterPreferenceMapping({});
    toast.success('Printer routing cleared');
  }

  return {
    clearPrinterMapping,
    invoicePrinter,
    isDesktopRuntime,
    isLoadingPrinters,
    printerNames,
    refreshPrinters,
    savePrinterMapping,
    setInvoicePrinter: (invoicePrinter: string) =>
      setPrinterMapping((current) => ({ ...current, invoicePrinter })),
    setStickerPrinter: (stickerPrinter: string) =>
      setPrinterMapping((current) => ({ ...current, stickerPrinter })),
    stickerPrinter,
  };
}
