import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  createPrintableHtmlDocument,
  InvoiceA5Template,
  PAGE_STYLES,
  ThermalStickerTemplate,
  getPrinterPreferenceMapping,
  printParallelViaDesktop,
  useManagedReactPrint,
} from '@/features/printing';

export type ReceiptPrintData = {
  bookingCode: string;
  trackingCode: string;
  parcelDetails: string;
  parcelContent?: string | null;
  parcelValueCedis?: number | null;
  receivedByName?: string | null;
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
    covidCedis?: number;
    taxTotalCedis: number;
  };
};

type ParcelReceiptActionsProps = {
  data: ReceiptPrintData;
  triggerLabel?: string;
  autoPrint?: boolean;
  autoPrintSelection?: 'sticker' | 'invoice' | 'both';
  mode?: 'sender-payment' | 'receiver-payment' | 'reprint' | 'default';
  showSelectionMenu?: boolean;
  onAutoPrintComplete?: () => void;
};

function formatMoney(amount: number) {
  return `GH₵ ${amount.toFixed(2)}`;
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
  autoPrintSelection = 'both',
  mode = 'default',
  showSelectionMenu = false,
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

  const handlePrintBoth = () => {
    if (!isSenderPaid) {
      void printSticker();
      return;
    }
    setQueueInvoiceAfterSticker(true);
    void printSticker();
  };

  const handlePrintBothParallelDesktop = async () => {
    if (
      mode !== 'sender-payment' ||
      !isSenderPaid ||
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
  };

  const handlePrintInvoiceOnly = () => {
    void printInvoice();
  };

  const handlePrintStickerOnly = () => {
    void printSticker();
  };

  useEffect(() => {
    if (!autoPrint || hasAutoPrinted.current) return;
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
  }, [autoPrint, autoPrintSelection, mode]);

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
            tax={{
              vat: tax.vat,
              getfund: tax.getfund,
              nhil: tax.nhil,
              totalTax: tax.totalTax,
            }}
            qrValue={qrUrl}
            formatMoney={formatMoney}
          />
        </div>
      </div>

      {!autoPrint ? (
        <div className="flex flex-wrap items-center gap-2">
          {showSelectionMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline">
                  {triggerLabel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={handlePrintStickerOnly}>
                  Reprint Sticker
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintInvoiceOnly}>
                  Reprint Invoice
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintBoth}>
                  Reprint Sticker + Invoice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button type="button" onClick={handlePrintBoth}>
              {isSenderPaid ? triggerLabel : 'Print Sticker'}
            </Button>
          )}
        </div>
      ) : null}
    </>
  );
}
