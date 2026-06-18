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
  stickerRef: RefObject<HTMLDivElement | null>;
  invoiceRef: RefObject<HTMLDivElement | null>;
  isSenderPaid: boolean;
  qrUrl: string;
  amountPaidCedis: number;
  tax: {
    vat: number;
    getfund: number;
    nhil: number;
    totalTax: number;
  };
};

export function ParcelReceiptPrintContent({
  data,
  stickerRef,
  invoiceRef,
  isSenderPaid,
  qrUrl,
  amountPaidCedis,
  tax,
}: ParcelReceiptPrintContentProps) {
  return (
    <>
      <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '80mm' }}>
        <div ref={stickerRef}>
          <ThermalStickerTemplate
            bookingCode={data.bookingCode}
            receiverName={data.receiverName}
            receiverTelephone={data.receiverTelephone}
            receiverTelephone2={data.receiverTelephone2}
            destinationBranchName={data.destinationBranchName}
            destinationLocationName={data.destinationLocationName}
            isPaid={isSenderPaid}
            toBePaidCedis={isSenderPaid ? undefined : data.receiverToPayCedis}
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
