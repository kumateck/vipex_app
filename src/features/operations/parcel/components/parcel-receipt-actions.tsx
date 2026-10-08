import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useGetCurrentActiveSessionQuery } from '@/features/cashiers/api/cashiers.api';
import { PAGE_STYLES } from '@/features/printing/constants/page-styles';
import { useManagedReactPrint } from '@/features/printing/hooks/use-managed-react-print';
import { useAuthStore } from '@/stores/auth-store';
import {
  useParcelInvoicePrintAction,
  useParcelReceiptTax,
  useStickerPrintModule,
  useParcelPrintCompletion,
} from '../hooks';
import { buildParcelTrackingUrl } from '../utils/tracking-url';
import {
  normalizeStickerCopies,
  ParcelReceiptPrintControls,
} from './parcel-receipt-print-controls';
import { ParcelReceiptPrintContent } from './parcel-receipt-print-content';
import type { ReceiptPrintData } from './parcel-receipt.types';
import { useParcelDesktopInvoicePrint } from './parcel-desktop-print';
import { useParcelDesktopParallelPrint } from './use-parcel-desktop-parallel-print';
import { useParcelDesktopStickerPrint } from './use-parcel-desktop-sticker-print';
import { useLogParcelStickerPrintMutation } from '../api/parcel.api';

type ParcelReceiptActionsProps = {
  data: ReceiptPrintData;
  triggerLabel?: string;
  autoPrint?: boolean;
  autoPrintSelection?: 'sticker' | 'invoice' | 'both';
  mode?: 'sender-payment' | 'receiver-payment' | 'reprint' | 'default';
  showSelectionMenu?: boolean;
  stickerCopies?: number;
  onAutoPrintComplete?: () => void;
};
export function ParcelReceiptActions({
  data,
  triggerLabel = 'Print Sticker + Invoice',
  autoPrint = false,
  autoPrintSelection = 'both',
  mode = 'default',
  showSelectionMenu = false,
  stickerCopies = 1,
  onAutoPrintComplete: onPrintComplete,
}: ParcelReceiptActionsProps) {
  const { hasPrinted, onAutoPrintComplete } = useParcelPrintCompletion(onPrintComplete);
  const user = useAuthStore((state) => state.user);
  const cashierType = user?.cashierType ?? null;
  const isCashier = cashierType !== null && cashierType !== undefined;
  const { data: activeSession, isLoading: isLoadingActiveSession } =
    useGetCurrentActiveSessionQuery(undefined, { skip: !isCashier });
  const canPrintForSession = !isCashier || !!activeSession;
  const { isStickerPrintEnabled, isLoadingStickerPrintModule } = useStickerPrintModule();
  const stickerRef = useRef<HTMLDivElement>(null);
  const desktopStickerRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const hasAutoPrinted = useRef(false);
  const [queueInvoiceAfterSticker, setQueueInvoiceAfterSticker] = useState(false);
  const [selectedStickerCopies, setSelectedStickerCopies] = useState(() =>
    normalizeStickerCopies(stickerCopies),
  );
  const canPrintStickerViaDesktop =
    typeof window !== 'undefined' && typeof window.api?.printHtml === 'function';
  const canPrintInvoiceViaDesktop = canPrintStickerViaDesktop;
  const [logStickerPrint] = useLogParcelStickerPrintMutation();
  const qrUrl = buildParcelTrackingUrl(data.trackingCode);
  const hasPaidAmount = (data.amountPaidCedis ?? data.senderPaidCedis) > 0;
  const hasPrintableReceipt = hasPaidAmount || data.receiverToPayCedis > 0;
  const missingPaidTax = hasPaidAmount && !data.taxBreakdown;
  const tax = useParcelReceiptTax(data);
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
      void logStickerPrint({
        bookingCode: data.bookingCode,
        trackingCode: data.trackingCode,
        copies: selectedStickerCopies,
      }).catch((error) => console.error('[parcel-sticker-print] log-failed', error));
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
  const printStickerViaDesktop = useParcelDesktopStickerPrint({
    bookingCode: data.bookingCode,
    trackingCode: data.trackingCode,
    canPrintStickerViaDesktop,
    stickerRef: desktopStickerRef,
  });
  const printInvoiceViaDesktop = useParcelDesktopInvoicePrint({
    bookingCode: data.bookingCode,
    canPrintViaDesktop: canPrintInvoiceViaDesktop,
    invoiceRef,
  });

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
    if (canPrintStickerViaDesktop) {
      void printStickerViaDesktop(selectedStickerCopies).then(() => {
        onAutoPrintComplete?.();
      });
      return;
    }
    void printSticker();
  }, [
    canPrintForSession,
    canPrintStickerViaDesktop,
    isStickerPrintEnabled,
    onAutoPrintComplete,
    printSticker,
    printStickerViaDesktop,
    selectedStickerCopies,
  ]);
  const handlePrintBoth = useCallback(() => {
    if (missingPaidTax) {
      toast.error('Tax breakdown is required to print a paid receipt');
      onAutoPrintComplete?.();
      return;
    }
    if (!canPrintForSession) {
      toast.error('Open a cashier session before printing receipts');
      return;
    }
    if (!isStickerPrintEnabled) {
      if (hasPrintableReceipt) {
        if (canPrintInvoiceViaDesktop) {
          void printInvoiceViaDesktop().then(() => onAutoPrintComplete?.());
          return;
        }
        void printInvoice();
        return;
      }
      toast.error('Sticker print is disabled for this company');
      onAutoPrintComplete?.();
      return;
    }
    if (!hasPrintableReceipt) {
      handlePrintStickerOnly();
      return;
    }
    if (canPrintStickerViaDesktop) {
      void printStickerViaDesktop(selectedStickerCopies).then(async (printed) => {
        if (printed) await printInvoiceViaDesktop();
        onAutoPrintComplete?.();
      });
      return;
    }
    setQueueInvoiceAfterSticker(true);
    void printSticker();
  }, [
    canPrintForSession,
    canPrintInvoiceViaDesktop,
    canPrintStickerViaDesktop,
    handlePrintStickerOnly,
    hasPrintableReceipt,
    isStickerPrintEnabled,
    missingPaidTax,
    onAutoPrintComplete,
    printInvoice,
    printInvoiceViaDesktop,
    printSticker,
    printStickerViaDesktop,
    selectedStickerCopies,
  ]);
  const handlePrintBothParallelDesktop = useParcelDesktopParallelPrint({
    bookingCode: data.bookingCode,
    trackingCode: data.trackingCode,
    canPrintForSession,
    invoiceRef,
    hasPrintableReceipt,
    isStickerPrintEnabled,
    mode,
    onAutoPrintComplete,
    stickerRef: desktopStickerRef,
    stickerCopies: selectedStickerCopies,
  });
  const handlePrintInvoiceOnly = useParcelInvoicePrintAction({
    canPrintForSession,
    canPrintInvoiceViaDesktop,
    missingPaidTax,
    onAutoPrintComplete,
    printInvoice,
    printInvoiceViaDesktop,
  });
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
        desktopStickerRef={desktopStickerRef}
        stickerRef={stickerRef}
        invoiceRef={invoiceRef}
        qrUrl={qrUrl}
        printedByName={user?.fullname ?? null}
        printedByBranchName={user?.branch?.name ?? null}
        printedByLocationName={user?.location?.name ?? user?.locationName ?? null}
        amountPaidCedis={amountPaidCedis}
        stickerCopies={canPrintStickerViaDesktop ? 1 : selectedStickerCopies}
        tax={{
          vat: tax.vat,
          getfund: tax.getfund,
          nhil: tax.nhil,
          covid: tax.covid,
          totalTax: tax.totalTax,
          taxComponentKeys: tax.taxComponentKeys,
        }}
        isDuplicate={mode === 'reprint' || showSelectionMenu || hasPrinted}
      />

      <ParcelReceiptPrintControls
        autoPrint={autoPrint}
        canPrintForSession={canPrintForSession}
        isLoading={isLoadingActiveSession || isLoadingStickerPrintModule}
        hasPrintableReceipt={hasPrintableReceipt}
        isStickerPrintEnabled={isStickerPrintEnabled}
        showSelectionMenu={showSelectionMenu}
        triggerLabel={triggerLabel}
        stickerCopies={selectedStickerCopies}
        onStickerCopiesChange={(copies) => setSelectedStickerCopies(normalizeStickerCopies(copies))}
        onPrintBoth={handlePrintBoth}
        onPrintInvoice={handlePrintInvoiceOnly}
        onPrintSticker={handlePrintStickerOnly}
      />
    </>
  );
}
