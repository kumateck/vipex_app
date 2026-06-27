import type { RefObject } from 'react';
import { InvoiceA5Template, ThermalStickerTemplate } from '@/features/printing';
import type { ReceiptPrintData } from './parcel-receipt.types';
import {
  formatDate,
  formatMoney,
  getPaymentModeLabel,
  toAmountWords,
} from './parcel-receipt-formatters';

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
    totalTax: number;
  };
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
}: ParcelReceiptPrintContentProps) {
  const copies = Math.max(Math.trunc(stickerCopies), 1);

  return (
    <>
      <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '100mm' }}>
        <div ref={stickerRef}>
          {Array.from({ length: copies }, (_, index) => (
            <div
              key={`${data.trackingCode}-${index}`}
              style={{ breakAfter: index === copies - 1 ? 'auto' : 'page' }}
            >
              <ThermalStickerTemplate
                bookingCode={data.bookingCode}
                issuedAtLabel={formatDate(data.issuedAt)}
                printedByName={printedByName}
                printedByBranchName={printedByBranchName}
                printedByLocationName={printedByLocationName}
                parcelDetails={data.parcelDetails}
                parcelContent={data.parcelContent}
                senderName={data.senderName}
                senderTelephone={data.senderTelephone}
                senderTelephone2={data.senderTelephone2}
                receiverName={data.receiverName}
                receiverTelephone={data.receiverTelephone}
                receiverTelephone2={data.receiverTelephone2}
                destinationBranchName={data.destinationBranchName}
                destinationLocationName={data.destinationLocationName}
                toBePaidCedis={data.receiverToPayCedis > 0 ? data.receiverToPayCedis : undefined}
                qrValue={qrUrl}
                formatMoney={formatMoney}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '100mm' }}>
        <div ref={desktopStickerRef}>
          <ThermalStickerTemplate
            bookingCode={data.bookingCode}
            issuedAtLabel={formatDate(data.issuedAt)}
            printedByName={printedByName}
            printedByBranchName={printedByBranchName}
            printedByLocationName={printedByLocationName}
            parcelDetails={data.parcelDetails}
            parcelContent={data.parcelContent}
            senderName={data.senderName}
            senderTelephone={data.senderTelephone}
            senderTelephone2={data.senderTelephone2}
            receiverName={data.receiverName}
            receiverTelephone={data.receiverTelephone}
            receiverTelephone2={data.receiverTelephone2}
            destinationBranchName={data.destinationBranchName}
            destinationLocationName={data.destinationLocationName}
            toBePaidCedis={data.receiverToPayCedis > 0 ? data.receiverToPayCedis : undefined}
            qrValue={qrUrl}
            formatMoney={formatMoney}
          />
        </div>
      </div>

      <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '148mm' }}>
        <div ref={invoiceRef}>
          <InvoiceA5Template
            bookingCode={data.bookingCode}
            issuedAtLabel={formatDate(data.issuedAt)}
            parcelDetails={data.parcelDetails}
            parcelContent={data.parcelContent}
            parcelValueCedis={data.parcelValueCedis}
            receivedByName={data.receivedByName}
            destinationBranchName={data.destinationBranchName}
            destinationLocationName={data.destinationLocationName}
            senderName={data.senderName}
            senderTelephone={
              data.senderTelephone2
                ? `${data.senderTelephone}, ${data.senderTelephone2}`
                : data.senderTelephone
            }
            receiverName={data.receiverName}
            receiverTelephone={
              data.receiverTelephone2
                ? `${data.receiverTelephone}, ${data.receiverTelephone2}`
                : data.receiverTelephone
            }
            paymentModeLabel={getPaymentModeLabel(data.senderPaidCedis, data.receiverToPayCedis)}
            totalChargeCedis={data.totalChargeCedis}
            senderPaidCedis={data.senderPaidCedis}
            receiverToPayCedis={data.receiverToPayCedis}
            amountPaidCedis={amountPaidCedis}
            amountInWords={toAmountWords(amountPaidCedis)}
            tax={tax}
            qrValue={qrUrl}
            formatMoney={formatMoney}
          />
        </div>
      </div>
    </>
  );
}
