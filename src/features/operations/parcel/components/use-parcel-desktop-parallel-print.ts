import { useCallback, type RefObject } from 'react';
import { toast } from 'sonner';
import {
  createPrintableHtmlDocument,
  getPrinterPreferenceMapping,
  PAGE_STYLES,
  printParallelViaDesktop,
} from '@/features/printing';
import { useLogParcelStickerPrintMutation } from '../api/parcel.api';
import { createDesktopStickerHtml } from './parcel-desktop-sticker-print';

type UseParcelDesktopParallelPrintParams = {
  bookingCode: string;
  trackingCode: string;
  canPrintForSession: boolean;
  invoiceRef: RefObject<HTMLDivElement | null>;
  hasPrintableReceipt: boolean;
  isStickerPrintEnabled: boolean;
  mode: 'sender-payment' | 'receiver-payment' | 'reprint' | 'default';
  stickerCopies: number;
  onAutoPrintComplete?: () => void;
  stickerRef: RefObject<HTMLDivElement | null>;
};

export function useParcelDesktopParallelPrint({
  bookingCode,
  trackingCode,
  canPrintForSession,
  invoiceRef,
  hasPrintableReceipt,
  isStickerPrintEnabled,
  mode,
  stickerCopies,
  onAutoPrintComplete,
  stickerRef,
}: UseParcelDesktopParallelPrintParams) {
  const [logStickerPrint] = useLogParcelStickerPrintMutation();
  return useCallback(async () => {
    if (
      mode !== 'sender-payment' ||
      !hasPrintableReceipt ||
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
          copies: stickerCopies,
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

    const stickerJobOk = result.jobs.some((job) => job.layout === 'thermal-sticker' && job.ok);
    if (stickerJobOk) {
      void logStickerPrint({ bookingCode, trackingCode, copies: stickerCopies }).catch((error) =>
        console.error('[parcel-sticker-print] log-failed', error),
      );
    }

    if (!result.ok) {
      const failed = result.jobs.filter((job) => !job.ok);
      const reason = failed.map((job) => `${job.layout}: ${job.reason ?? 'failed'}`).join(' | ');
      console.warn('[PRINT_PARALLEL_FAILED]', reason);
      toast.error(`One or more print jobs failed: ${reason}`);
      onAutoPrintComplete?.();
      return true;
    }

    onAutoPrintComplete?.();
    return true;
  }, [
    bookingCode,
    trackingCode,
    canPrintForSession,
    invoiceRef,
    hasPrintableReceipt,
    isStickerPrintEnabled,
    logStickerPrint,
    mode,
    onAutoPrintComplete,
    stickerRef,
    stickerCopies,
  ]);
}
