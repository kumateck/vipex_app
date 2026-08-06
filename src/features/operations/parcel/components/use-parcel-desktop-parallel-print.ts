import { useCallback, type RefObject } from 'react';
import {
  createPrintableHtmlDocument,
  getPrinterPreferenceMapping,
  PAGE_STYLES,
  printParallelViaDesktop,
} from '@/features/printing';
import { createDesktopStickerHtml } from './parcel-desktop-sticker-print';

type UseParcelDesktopParallelPrintParams = {
  bookingCode: string;
  canPrintForSession: boolean;
  invoiceRef: RefObject<HTMLDivElement | null>;
  isSenderPaid: boolean;
  isStickerPrintEnabled: boolean;
  mode: 'sender-payment' | 'receiver-payment' | 'reprint' | 'default';
  onAutoPrintComplete?: () => void;
  stickerRef: RefObject<HTMLDivElement | null>;
};

export function useParcelDesktopParallelPrint({
  bookingCode,
  canPrintForSession,
  invoiceRef,
  isSenderPaid,
  isStickerPrintEnabled,
  mode,
  onAutoPrintComplete,
  stickerRef,
}: UseParcelDesktopParallelPrintParams) {
  return useCallback(async () => {
    if (
      mode !== 'sender-payment' ||
      !isSenderPaid ||
      !isStickerPrintEnabled ||
      !canPrintForSession ||
      typeof window === 'undefined' ||
      typeof window.api?.printParallel !== 'function'
    ) {
      return false;
    }

    const stickerNode = stickerRef.current;
    const invoiceNode = invoiceRef.current;
    if (!stickerNode || !invoiceNode) return false;

    const { stickerPrinter, invoicePrinter } = getPrinterPreferenceMapping();
    if (!stickerPrinter || !invoicePrinter) return false;

    const result = await printParallelViaDesktop({
      jobs: [
        {
          html: createDesktopStickerHtml({
            orientation: 'portrait',
            title: `sticker-${bookingCode}`,
            stickerNode,
          }),
          layout: 'thermal-sticker',
          title: `sticker-${bookingCode}`,
          silent: true,
          deviceName: stickerPrinter,
        },
        {
          html: createPrintableHtmlDocument({
            title: `invoice-${bookingCode}`,
            pageStyle: PAGE_STYLES['invoice-a5-receipt'],
            bodyHtml: invoiceNode.outerHTML,
          }),
          layout: 'invoice-a5-receipt',
          title: `invoice-${bookingCode}`,
          silent: true,
          deviceName: invoicePrinter,
        },
      ],
    });

    if (!result.ok) {
      const failed = result.jobs.filter((job) => !job.ok);
      const reason = failed.map((job) => `${job.layout}: ${job.reason ?? 'failed'}`).join(' | ');
      console.warn('[PRINT_PARALLEL_FAILED]', reason);
      return false;
    }

    onAutoPrintComplete?.();
    return true;
  }, [
    bookingCode,
    canPrintForSession,
    invoiceRef,
    isSenderPaid,
    isStickerPrintEnabled,
    mode,
    onAutoPrintComplete,
    stickerRef,
  ]);
}
