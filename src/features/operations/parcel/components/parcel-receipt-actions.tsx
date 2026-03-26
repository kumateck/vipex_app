import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { computeGhanaTaxesFromPrincipal } from '@/server/utils/tax/ghana';
import {
  InvoiceA5Template,
  PAGE_STYLES,
  ThermalStickerTemplate,
  useManagedReactPrint,
} from '@/features/printing';

export type ReceiptPrintData = {
  bookingCode: string;
  trackingCode: string;
  parcelDetails: string;
  senderName: string;
  senderTelephone: string;
  receiverName: string;
  receiverTelephone: string;
  destinationBranchName: string;
  destinationLocationName: string;
  totalChargeCedis: number;
  senderPaidCedis: number;
  receiverToPayCedis: number;
  amountPaidCedis?: number;
  issuedAt: string;
  taxBreakdown?: {
    vatCedis: number;
    getfundCedis: number;
    nhilCedis: number;
    covidCedis: number;
    taxTotalCedis: number;
  };
};

type ParcelReceiptActionsProps = {
  data: ReceiptPrintData;
  triggerLabel?: string;
  autoPrint?: boolean;
  onAutoPrintComplete?: () => void;
};

function formatMoney(amount: number) {
  return `GHS ${amount.toFixed(2)}`;
}

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function toWordsUnderThousand(n: number): string {
  const under20 = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];
  const tens = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];

  if (n < 20) return under20[n] ?? '';
  if (n < 100) {
    const t = Math.floor(n / 10);
    const r = n % 10;
    return r ? `${tens[t]}-${under20[r]}` : (tens[t] ?? '');
  }

  const h = Math.floor(n / 100);
  const r = n % 100;
  return r ? `${under20[h]} hundred and ${toWordsUnderThousand(r)}` : `${under20[h]} hundred`;
}

function toAmountWords(amount: number) {
  if (!Number.isFinite(amount) || amount < 0) return 'invalid amount';
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);

  const toWords = (value: number): string => {
    if (value === 0) return 'zero';
    if (value < 1000) return toWordsUnderThousand(value);
    if (value < 1_000_000) {
      const thousands = Math.floor(value / 1000);
      const remainder = value % 1000;
      return remainder
        ? `${toWordsUnderThousand(thousands)} thousand ${toWordsUnderThousand(remainder)}`
        : `${toWordsUnderThousand(thousands)} thousand`;
    }
    return String(value);
  };

  if (cents === 0) return `${toWords(whole)} Ghana cedis only`;
  return `${toWords(whole)} Ghana cedis and ${toWords(cents)} pesewas`;
}

function getPaymentModeLabel(senderPaidCedis: number, receiverToPayCedis: number) {
  if (senderPaidCedis > 0 && receiverToPayCedis > 0) return 'Shared Payment';
  if (senderPaidCedis > 0 && receiverToPayCedis <= 0) return 'Sender Paid';
  return 'Receiver Pays';
}

export function ParcelReceiptActions({
  data,
  triggerLabel = 'Print Sticker + Invoice',
  autoPrint = false,
  onAutoPrintComplete,
}: ParcelReceiptActionsProps) {
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
        covid: data.taxBreakdown.covidCedis,
        totalTax: data.taxBreakdown.taxTotalCedis,
        residual: 0,
      };
    }
    return computeGhanaTaxesFromPrincipal(amountPaid);
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

  const handlePrintBoth = () => {
    if (!isSenderPaid) {
      void printSticker();
      return;
    }
    setQueueInvoiceAfterSticker(true);
    void printSticker();
  };

  useEffect(() => {
    if (!autoPrint || hasAutoPrinted.current) return;
    hasAutoPrinted.current = true;
    handlePrintBoth();
  }, [autoPrint]);

  const amountPaidCedis = data.amountPaidCedis ?? data.senderPaidCedis;

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
            tax={{
              vat: tax.vat,
              getfund: tax.getfund,
              nhil: tax.nhil,
              covid: tax.covid,
              totalTax: tax.totalTax,
            }}
            qrValue={qrUrl}
            formatMoney={formatMoney}
          />
        </div>
      </div>

      {!autoPrint ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={handlePrintBoth}>
            {isSenderPaid ? triggerLabel : 'Print Sticker'}
          </Button>
        </div>
      ) : null}
    </>
  );
}
