import { useEffect, useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { QRCode } from 'react-qrcode-logo';
import { Button } from '@/components/ui/button';
import { computeGhanaTaxesFromPrincipal } from '@/server/utils/tax/ghana';

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
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

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
    () => `https://vipexparcel.com/tracker/${encodeURIComponent(data.trackingCode)}`,
    [data.trackingCode],
  );

  const tax = useMemo(() => {
    if (data.taxBreakdown) {
      return {
        principal: data.senderPaidCedis,
        net: data.senderPaidCedis - data.taxBreakdown.taxTotalCedis,
        vat: data.taxBreakdown.vatCedis,
        getfund: data.taxBreakdown.getfundCedis,
        nhil: data.taxBreakdown.nhilCedis,
        covid: data.taxBreakdown.covidCedis,
        totalTax: data.taxBreakdown.taxTotalCedis,
        residual: 0,
      };
    }
    return computeGhanaTaxesFromPrincipal(data.senderPaidCedis);
  }, [data.senderPaidCedis, data.taxBreakdown]);

  const printInvoice = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `invoice-${data.bookingCode}`,
    onAfterPrint: () => {
      onAutoPrintComplete?.();
    },
  });

  const printSticker = useReactToPrint({
    contentRef: stickerRef,
    documentTitle: `sticker-${data.bookingCode}`,
    onAfterPrint: () => {
      if (!queueInvoiceAfterSticker) return;
      setQueueInvoiceAfterSticker(false);
      setTimeout(() => {
        void printInvoice();
      }, 120);
    },
  });

  const handlePrintBoth = () => {
    setQueueInvoiceAfterSticker(true);
    void printSticker();
  };

  useEffect(() => {
    if (!autoPrint || hasAutoPrinted.current) return;
    hasAutoPrinted.current = true;
    handlePrintBoth();
  }, [autoPrint]);

  return (
    <>
      <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '80mm' }}>
        <div ref={stickerRef} className="bg-white text-black" style={{ width: '76mm', padding: '2mm', fontFamily: 'Arial, sans-serif' }}>
          <style>
            {`@media print { @page { size: 80mm auto; margin: 2mm; } body { margin: 0; } }`}
          </style>

          <div style={{ textAlign: 'center', marginBottom: '2mm' }}>
            <div style={{ fontWeight: 700, fontSize: '12px' }}>VIPEX PARCEL STICKER</div>
            <QRCode value={qrUrl} size={84} quietZone={2} ecLevel="M" />
          </div>

          <div style={{ fontSize: '11px', lineHeight: 1.35 }}>
            <div><strong>Booking:</strong> {data.bookingCode}</div>
            <div><strong>Receiver:</strong> {data.receiverName}</div>
            <div><strong>Phone:</strong> {data.receiverTelephone || '-'}</div>
            <div><strong>Destination:</strong> {data.destinationBranchName}</div>
            <div><strong>Location:</strong> {data.destinationLocationName}</div>
            {data.receiverToPayCedis > 0 ? (
              <div style={{ marginTop: '2mm', fontWeight: 700 }}>
                TO PAY: {formatMoney(data.receiverToPayCedis)}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '148mm' }}>
        <div ref={invoiceRef} className="bg-white text-black" style={{ width: '148mm', minHeight: '210mm', padding: '10mm', fontFamily: 'Arial, sans-serif' }}>
          <style>
            {`@media print { @page { size: A5 portrait; margin: 8mm; } body { margin: 0; } }`}
          </style>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8mm' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '18px' }}>Invoice Receipt</h1>
              <div style={{ fontSize: '12px', marginTop: '2mm' }}>Issued: {formatDate(data.issuedAt)}</div>
            </div>
            <QRCode value={qrUrl} size={88} quietZone={2} ecLevel="M" />
          </div>

          <div style={{ fontSize: '12px', lineHeight: 1.5, marginBottom: '6mm' }}>
            <div><strong>Booking Code:</strong> {data.bookingCode}</div>
            <div><strong>Parcel Details:</strong> {data.parcelDetails}</div>
            <div><strong>Destination Branch:</strong> {data.destinationBranchName}</div>
            <div><strong>Sender:</strong> {data.senderName}</div>
            <div><strong>Sender Phone:</strong> {data.senderTelephone || '-'}</div>
            <div><strong>Payment Mode:</strong> {getPaymentModeLabel(data.senderPaidCedis, data.receiverToPayCedis)}</div>
          </div>

          <div style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '4mm 0', marginBottom: '6mm', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Charge</span>
              <strong>{formatMoney(data.totalChargeCedis)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Sender Paid</span>
              <strong>{formatMoney(data.senderPaidCedis)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Receiver To Pay</span>
              <strong>{formatMoney(data.receiverToPayCedis)}</strong>
            </div>
            <div style={{ marginTop: '2mm', fontStyle: 'italic' }}>
              Amount in words: {toAmountWords(data.senderPaidCedis)}
            </div>
          </div>

          <div style={{ fontSize: '12px' }}>
            <div style={{ fontWeight: 700, marginBottom: '2mm' }}>Tax Breakdown (Sender Paid)</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>VAT</span>
              <span>{formatMoney(tax.vat)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>GETFund</span>
              <span>{formatMoney(tax.getfund)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>NHIL</span>
              <span>{formatMoney(tax.nhil)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>COVID Levy</span>
              <span>{formatMoney(tax.covid)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #777', marginTop: '2mm', paddingTop: '2mm' }}>
              <strong>Total Tax</strong>
              <strong>{formatMoney(tax.totalTax)}</strong>
            </div>
          </div>
        </div>
      </div>

      {!autoPrint ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={handlePrintBoth}>
            {triggerLabel}
          </Button>
        </div>
      ) : null}
    </>
  );
}
