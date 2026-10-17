import type { RefObject } from 'react';
import { InvoiceA5Template, ThermalStickerTemplate } from '@/features/printing';
import type { ReceiptPrintData } from './parcel-receipt.types';
import { buildParcelStickerQrValue } from '../utils/tracking-url';
import { formatDate, formatMoney } from './parcel-receipt-formatters';
import { buildInvoiceA5Props } from '../utils/build-invoice-a5-props';

type ParcelReceiptPrintContentProps = {
  data: ReceiptPrintData;
  desktopStickerRef: RefObject<HTMLDivElement | null>;
  stickerRef: RefObject<HTMLDivElement | null>;
  invoiceRef: RefObject<HTMLDivElement | null>;
  qrUrl: string;
  printedByName?: string | null;
  printedByBranchName?: string | null;
  printedByLocationName?: string | null;
  amountPaidCedis: number;
  stickerCopies?: number;
  tax: {
    vat: number;
    getfund: number;
    nhil: number;
    covid: number;
    totalTax: number;
    taxComponentKeys?: string[];
  };
  isDuplicate?: boolean;
};

export function ParcelReceiptPrintContent({
  data,
  desktopStickerRef,
  stickerRef,
  invoiceRef,
  qrUrl,
  printedByName,
  printedByBranchName,
  printedByLocationName,
  amountPaidCedis,
  stickerCopies = 1,
  tax,
  isDuplicate = false,
}: ParcelReceiptPrintContentProps) {
  const copies = Math.max(Math.trunc(stickerCopies), 1);
  const stickerTemplateProps = {
    bookingCode: data.bookingCode,
    duplicate: isDuplicate,
    issuedAtLabel: formatDate(data.issuedAt),
    printedByName,
    printedByBranchName,
    printedByLocationName,
    parcelDetails: data.parcelDetails,
    parcelContent: data.parcelContent,
    senderName: data.senderName,
    senderTelephone: data.senderTelephone,
    senderTelephone2: data.senderTelephone2,
    receiverName: data.receiverName,
    receiverTelephone: data.receiverTelephone,
    receiverTelephone2: data.receiverTelephone2,
    callSender: data.callSender,
    destinationBranchName: data.destinationBranchName,
    destinationLocationName: data.destinationLocationName,
    toBePaidCedis: data.receiverToPayCedis > 0 ? data.receiverToPayCedis : undefined,
    qrValue: buildParcelStickerQrValue(data.trackingCode),
    formatMoney,
  };

  return (
    <>
      <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '100mm' }}>
        <div ref={stickerRef}>
          {Array.from({ length: copies }, (_, index) => (
            <div
              key={`${data.trackingCode}-${index}`}
              style={{ breakAfter: index === copies - 1 ? 'auto' : 'page' }}
            >
              <ThermalStickerTemplate {...stickerTemplateProps} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '100mm' }}>
        <div ref={desktopStickerRef}>
          <ThermalStickerTemplate {...stickerTemplateProps} />
        </div>
      </div>

      <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '148mm' }}>
        <div ref={invoiceRef}>
          <InvoiceA5Template
            {...buildInvoiceA5Props(data, {
              amountPaidCedis,
              tax,
              qrUrl,
              cashierName: printedByName,
              isDuplicate,
            })}
          />
        </div>
      </div>
    </>
  );
}
