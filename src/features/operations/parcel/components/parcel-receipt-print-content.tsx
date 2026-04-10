import type { RefObject } from 'react';
import { InvoiceA5Template, ThermalStickerTemplate } from '@/features/printing';
import type { ReceiptPrintData } from './parcel-receipt-actions';
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
            senderName={data.senderName}
            senderTelephone={data.senderTelephone}
            bookingCode={data.bookingCode}
            parcelDetails={data.parcelDetails}
            destinationBranchName={data.destinationBranchName}
            destinationLocationName={data.destinationLocationName}
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
            senderTelephone={data.senderTelephone}
            receiverName={data.receiverName}
            receiverTelephone={data.receiverTelephone}
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
