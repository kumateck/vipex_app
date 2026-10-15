import type { ReactNode } from 'react';
import { BrandedQrCode } from '@/components/ui/branded-qr-code';
import { receiptPaperWidth, type ReceiptPaperFormat } from '@/shared/printing/receipt-paper';
import { InvoiceA5Header } from './invoice-a5-header';
import { InvoiceA5Terms } from './invoice-a5-terms';

export function ReceiptRollShell({
  paperFormat,
  title,
  issuedAtLabel,
  cashierName,
  duplicate,
  qrValue,
  children,
}: {
  paperFormat: Exclude<ReceiptPaperFormat, 'a5'>;
  title: 'Tax Invoice' | 'ACKNOWLEDGEMENT NOTE';
  issuedAtLabel: string;
  cashierName?: string | null;
  duplicate?: boolean;
  qrValue: string;
  children: ReactNode;
}) {
  const width = receiptPaperWidth(paperFormat);
  return (
    <div
      className="thermal-receipt-root"
      data-receipt-paper={paperFormat}
      style={{
        width: `${width}mm`,
        padding: width === 58 ? '3mm 5mm' : '3mm 4mm',
        boxSizing: 'border-box',
        background: '#fff',
        color: '#000',
        fontFamily: 'Arial, sans-serif',
        fontSize: '3mm',
        lineHeight: 1.35,
        overflowWrap: 'anywhere',
      }}
    >
      <InvoiceA5Header
        compact
        title={title}
        issuedAtLabel={issuedAtLabel}
        cashierName={cashierName}
        duplicate={duplicate}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5mm', paddingTop: '2mm' }}>
        {children}
      </div>
      <div
        style={{ display: 'flex', justifyContent: 'center', margin: '3mm 0', breakInside: 'avoid' }}
      >
        <BrandedQrCode
          value={qrValue}
          size={300}
          variant="print"
          ariaLabel="Parcel tracking QR code"
          style={{ width: '25mm', height: '25mm' }}
        />
      </div>
      <InvoiceA5Terms />
    </div>
  );
}

export function ReceiptRollField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <strong>{label}: </strong>
      {value || '-'}
    </div>
  );
}

export function ReceiptRollAmount({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '2mm' }}>
      <span>{label}:</span>
      <strong style={{ whiteSpace: 'nowrap' }}>{value}</strong>
    </div>
  );
}
