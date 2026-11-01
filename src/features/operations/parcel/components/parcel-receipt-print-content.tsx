import type { RefObject } from 'react';
import { InvoiceA5Template, ThermalStickerTemplate } from '@/features/printing';
import type { ReceiptPrintData } from './parcel-receipt.types';
import { buildParcelStickerQrValue } from '../utils/tracking-url';
import { formatMoney } from './parcel-receipt-formatters';
import { buildInvoiceA5Props } from '../utils/build-invoice-a5-props';
import {
  assertVerifiedStickerPayment,
  formatStickerDateTime,
  type VerifiedStickerPayment,
} from '@/shared/printing';

type ParcelReceiptPrintContentProps = {
  data: ReceiptPrintData;
  verifiedStickerPayment?: VerifiedStickerPayment | null;
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
  verifiedStickerPayment,
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
  const payment = verifiedStickerPayment
    ? assertVerifiedStickerPayment(verifiedStickerPayment, data)
    : null;
  const stickerTemplateProps = {
    bookingCode: data.bookingCode,
    duplicate: isDuplicate,
    issuedAtLabel: formatStickerDateTime(data.issuedAt),
    printedByName,
    printedByBranchName,
    printedByLocationName,
    parcelDetails: data.parcelDetails,
    parcelContent: data.parcelContent,
    senderName: data.senderName,
    senderTelephone: data.senderTelephone,
    senderTelephone2: data.senderTelephone2,
    receiverName: payment?.relatedStaffNameSnapshot
      ? `${data.receiverName} — ${payment.relatedStaffNameSnapshot}`
      : data.receiverName,
    receiverTelephone: data.receiverTelephone,
    receiverTelephone2: data.receiverTelephone2,
    callSender: data.callSender,
    paymentStatusLabel: payment?.status,
    destinationBranchName: data.destinationBranchName,
    destinationLocationName: data.destinationLocationName,
    toBePaidCedis: payment?.amountCedis,
    qrValue: buildParcelStickerQrValue(data.trackingCode),
    formatMoney,
  };

  return (
    <>
      <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '100mm' }}>
        <div ref={stickerRef}>
          {payment
            ? Array.from({ length: copies }, (_, index) => (
                <div
                  key={`${data.trackingCode}-${index}`}
                  style={{ breakAfter: index === copies - 1 ? 'auto' : 'page' }}
                >
                  <ThermalStickerTemplate {...stickerTemplateProps} />
                </div>
              ))
            : null}
        </div>
      </div>

      <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '100mm' }}>
        <div ref={desktopStickerRef}>
          {payment ? <ThermalStickerTemplate {...stickerTemplateProps} /> : null}
        </div>
      </div>

      <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '148mm' }}>
        <div ref={invoiceRef}>
          <InvoiceA5Template
            {...buildInvoiceA5Props(
              {
                ...data,
                stickerStatusLabel: payment?.status ?? data.stickerStatusLabel,
                relatedStaffNameSnapshot:
                  payment?.relatedStaffNameSnapshot ?? data.relatedStaffNameSnapshot,
              },
              {
                amountPaidCedis,
                tax,
                qrUrl,
                cashierName: printedByName,
                isDuplicate,
              },
            )}
          />
        </div>
      </div>
    </>
  );
}
