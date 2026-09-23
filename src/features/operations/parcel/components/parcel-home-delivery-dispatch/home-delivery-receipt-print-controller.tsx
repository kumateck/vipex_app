import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { HomeDeliveryReceiptA5Template } from '@/features/printing/components/templates/home-delivery-receipt-a5-template';
import { PAGE_STYLES } from '@/features/printing/constants/page-styles';
import { useManagedReactPrint } from '@/features/printing/hooks/use-managed-react-print';
import { printViaDesktop } from '@/features/printing/services/desktop-print';
import { createPrintableHtmlDocument } from '@/features/printing/services/html-document';
import { getPrinterPreferenceMapping } from '@/features/printing/services/printer-preferences';
import { formatDate } from '../parcel-receipt-formatters';
import { buildParcelTrackingUrl } from '../../utils/tracking-url';
import type { HomeDeliveryReceipt, ParcelSearchRow } from '../../api/parcel.api';

export function HomeDeliveryReceiptPrintController({
  parcel,
  receipt,
  onComplete,
}: {
  parcel: ParcelSearchRow;
  receipt: HomeDeliveryReceipt;
  onComplete: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const documentTitle = `home-delivery-receipt-${receipt.bookingCode}`;
  const browserPrint = useManagedReactPrint({
    contentRef,
    documentTitle,
    pageStyle: PAGE_STYLES['invoice-a5-receipt'],
    onAfterPrint: onComplete,
  });

  useEffect(() => {
    if (started.current) return;
    const frame = requestAnimationFrame(() => {
      if (started.current) return;
      started.current = true;
      if (typeof window.api?.printHtml !== 'function') {
        void browserPrint();
        return;
      }
      const node = contentRef.current;
      if (!node) {
        toast.error('Home delivery receipt could not be prepared');
        onComplete();
        return;
      }
      const { invoicePrinter } = getPrinterPreferenceMapping();
      void printViaDesktop({
        html: createPrintableHtmlDocument({
          title: documentTitle,
          pageStyle: PAGE_STYLES['invoice-a5-receipt'],
          bodyHtml: node.outerHTML,
        }),
        layout: 'invoice-a5-receipt',
        title: documentTitle,
        silent: Boolean(invoicePrinter),
        deviceName: invoicePrinter,
      })
        .then((result) => {
          if (!result.ok) toast.error(result.reason ?? 'Failed to print home delivery receipt');
        })
        .catch(() => toast.error('Failed to print home delivery receipt'))
        .finally(onComplete);
    });
    return () => cancelAnimationFrame(frame);
  }, [browserPrint, documentTitle, onComplete]);

  return (
    <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '210mm' }}>
      <div ref={contentRef}>
        <HomeDeliveryReceiptA5Template
          issuedAtLabel={formatDate(new Date().toISOString())}
          bookingCode={receipt.bookingCode}
          trackingCode={receipt.trackingCode}
          senderName={parcel.senderName ?? ''}
          senderPhone={[parcel.senderPhone, parcel.senderPhone2].filter(Boolean).join(', ')}
          receiverName={parcel.receiverName ?? ''}
          receiverPhone={[parcel.receiverPhone, parcel.receiverPhone2].filter(Boolean).join(', ')}
          parcelDetails={parcel.parcelDetails}
          parcelContent={parcel.parcelContent}
          destinationName={parcel.destinationName ?? ''}
          dropoffAddress={parcel.dropoffAddress ?? ''}
          chargePsw={receipt.chargePsw}
          deliveryFeePsw={receipt.deliveryFeePsw}
          paidPrincipalPsw={receipt.paidPrincipalPsw}
          paidDeliveryFeePsw={receipt.paidDeliveryFeePsw}
          principalDuePsw={receipt.principalDuePsw}
          deliveryFeeDuePsw={receipt.deliveryFeeDuePsw}
          totalDuePsw={receipt.totalDuePsw}
          grossPsw={receipt.grossPsw}
          netPsw={receipt.netPsw}
          taxRows={receipt.taxRows}
          qrValue={buildParcelTrackingUrl(receipt.trackingCode)}
        />
      </div>
    </div>
  );
}
