import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  createPrintableHtmlDocument,
  PAGE_STYLES,
  getPrinterPreferenceMapping,
  printParallelViaDesktop,
  useManagedReactPrint,
} from '@/features/printing';
import { useGetCurrentActiveSessionQuery } from '@/features/cashiers/api/cashiers.api';
import { useAuthStore } from '@/stores/auth-store';
import { useStickerPrintModule } from '../hooks';
import { ParcelReceiptPrintControls } from './parcel-receipt-print-controls';
import { ParcelReceiptPrintContent } from './parcel-receipt-print-content';
import type { ReceiptPrintData } from './parcel-receipt.types';

type ParcelReceiptActionsProps = {
  data: ReceiptPrintData;
  triggerLabel?: string;
  autoPrint?: boolean;
  autoPrintSelection?: 'sticker' | 'invoice' | 'both';
  mode?: 'sender-payment' | 'receiver-payment' | 'reprint' | 'default';
  showSelectionMenu?: boolean;
  onAutoPrintComplete?: () => void;
};
export function ParcelReceiptActions({
  data,
  triggerLabel = 'Print Sticker + Invoice',
  autoPrint = false,
  autoPrintSelection = 'both',
  mode = 'default',
  showSelectionMenu = false,
  onAutoPrintComplete,
}: ParcelReceiptActionsProps) {
  const cashierType = useAuthStore((state) => state.user?.cashierType ?? null);
  const isCashier = cashierType !== null && cashierType !== undefined;
  const { data: activeSession, isLoading: isLoadingActiveSession } =
    useGetCurrentActiveSessionQuery(undefined, { skip: !isCashier });
  const canPrintForSession = !isCashier || !!activeSession;
  const { isStickerPrintEnabled, isLoadingStickerPrintModule } = useStickerPrintModule();
  const stickerRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const hasAutoPrinted = useRef(false);
  const [queueInvoiceAfterSticker, setQueueInvoiceAfterSticker] = useState(false);
  const qrUrl = useMemo(
    () => `https://vipexparcel.com/tracking/${encodeURIComponent(data.trackingCode)}`,
    [data.trackingCode],
  );
  const isSenderPaid = (data.amountPaidCedis ?? data.senderPaidCedis) > 0;
  const tax = useMemo(() => {
    const amountPaid = data.amountPaidCedis ?? data.senderPaidCedis;
    if (data.taxBreakdown) {
      return {
        principal: amountPaid,
        net: amountPaid - data.taxBreakdown.taxTotalCedis,
        vat: data.taxBreakdown.vatCedis,
        getfund: data.taxBreakdown.getfundCedis,
        nhil: data.taxBreakdown.nhilCedis,
        totalTax: data.taxBreakdown.taxTotalCedis,
        residual: 0,
      };
    }
    return {
      principal: amountPaid,
      net: amountPaid,
      vat: 0,
      getfund: 0,
      nhil: 0,
      totalTax: 0,
      residual: 0,
    };
  }, [data.amountPaidCedis, data.senderPaidCedis, data.taxBreakdown]);
  const printInvoice = useManagedReactPrint({
    contentRef: invoiceRef,
    documentTitle: `invoice-${data.bookingCode}`,
    pageStyle: PAGE_STYLES['invoice-a5-receipt'],
    onAfterPrint: () => {
      onAutoPrintComplete?.();
    },
  });
  const printSticker = useManagedReactPrint({
    contentRef: stickerRef,
    documentTitle: `sticker-${data.bookingCode}`,
    pageStyle: PAGE_STYLES['thermal-sticker'],
    onAfterPrint: () => {
      if (!queueInvoiceAfterSticker) {
        onAutoPrintComplete?.();
        return;
      }
      setQueueInvoiceAfterSticker(false);
      setTimeout(() => {
        void printInvoice();
      }, 120);
    },
  });
  const handlePrintBoth = useCallback(() => {
    if (!canPrintForSession) {
      toast.error('Open a cashier session before printing receipts');
      return;
    }
    if (!isStickerPrintEnabled) {
      if (isSenderPaid) {
        void printInvoice();
        return;
      }
      toast.error('Sticker print is disabled for this company');
      onAutoPrintComplete?.();
      return;
    }
    if (!isSenderPaid) {
      void printSticker();
      return;
    }
    setQueueInvoiceAfterSticker(true);
    void printSticker();
  }, [
    canPrintForSession,
    isSenderPaid,
    isStickerPrintEnabled,
    onAutoPrintComplete,
    printInvoice,
    printSticker,
  ]);
  const handlePrintBothParallelDesktop = useCallback(async () => {
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
    if (!stickerPrinter || !invoicePrinter) {
      return false;
    }
    const stickerHtml = createPrintableHtmlDocument({
      title: `sticker-${data.bookingCode}`,
      pageStyle: PAGE_STYLES['thermal-sticker'],
      bodyHtml: stickerNode.outerHTML,
    });
    const invoiceHtml = createPrintableHtmlDocument({
      title: `invoice-${data.bookingCode}`,
      pageStyle: PAGE_STYLES['invoice-a5-receipt'],
      bodyHtml: invoiceNode.outerHTML,
    });
    const result = await printParallelViaDesktop({
      jobs: [
        {
          html: stickerHtml,
          layout: 'thermal-sticker',
          title: `sticker-${data.bookingCode}`,
          silent: true,
          deviceName: stickerPrinter,
        },
        {
          html: invoiceHtml,
          layout: 'invoice-a5-receipt',
          title: `invoice-${data.bookingCode}`,
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
    canPrintForSession,
    data.bookingCode,
    isSenderPaid,
    isStickerPrintEnabled,
    mode,
    onAutoPrintComplete,
  ]);
  const handlePrintInvoiceOnly = useCallback(() => {
    if (!canPrintForSession) {
      toast.error('Open a cashier session before printing receipts');
      return;
    }
    void printInvoice();
  }, [canPrintForSession, printInvoice]);
  const handlePrintStickerOnly = useCallback(() => {
    if (!canPrintForSession) {
      toast.error('Open a cashier session before printing parcel stickers');
      return;
    }
    if (!isStickerPrintEnabled) {
      toast.error('Sticker print is disabled for this company');
      onAutoPrintComplete?.();
      return;
    }
    void printSticker();
  }, [canPrintForSession, isStickerPrintEnabled, onAutoPrintComplete, printSticker]);
  useEffect(() => {
    if (
      !autoPrint ||
      hasAutoPrinted.current ||
      isLoadingActiveSession ||
      isLoadingStickerPrintModule ||
      !canPrintForSession
    ) {
      return;
    }
    hasAutoPrinted.current = true;
    if (autoPrintSelection === 'sticker') {
      handlePrintStickerOnly();
      return;
    }
    if (autoPrintSelection === 'invoice') {
      handlePrintInvoiceOnly();
      return;
    }
    void (async () => {
      const ranParallel = await handlePrintBothParallelDesktop();
      if (!ranParallel) {
        handlePrintBoth();
      }
    })();
  }, [
    autoPrint,
    autoPrintSelection,
    canPrintForSession,
    handlePrintBoth,
    handlePrintBothParallelDesktop,
    handlePrintInvoiceOnly,
    handlePrintStickerOnly,
    isLoadingActiveSession,
    isLoadingStickerPrintModule,
  ]);
  const amountPaidCedis = data.amountPaidCedis ?? data.senderPaidCedis;
  return (
    <>
      <ParcelReceiptPrintContent
        data={data}
        stickerRef={stickerRef}
        invoiceRef={invoiceRef}
        isSenderPaid={isSenderPaid}
        qrUrl={qrUrl}
        amountPaidCedis={amountPaidCedis}
        tax={{
          vat: tax.vat,
          getfund: tax.getfund,
          nhil: tax.nhil,
          totalTax: tax.totalTax,
        }}
      />

      <ParcelReceiptPrintControls
        autoPrint={autoPrint}
        canPrintForSession={canPrintForSession}
        isLoading={isLoadingActiveSession || isLoadingStickerPrintModule}
        isSenderPaid={isSenderPaid}
        isStickerPrintEnabled={isStickerPrintEnabled}
        showSelectionMenu={showSelectionMenu}
        triggerLabel={triggerLabel}
        onPrintBoth={handlePrintBoth}
        onPrintInvoice={handlePrintInvoiceOnly}
        onPrintSticker={handlePrintStickerOnly}
      />
    </>
  );
}
