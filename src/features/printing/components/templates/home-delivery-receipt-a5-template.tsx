import { BrandedQrCode } from '@/components/ui/branded-qr-code';
import { InvoiceA5Header } from './invoice-a5-header';
import { InvoiceA5Terms } from './invoice-a5-terms';
import { InvoiceTaxSummary } from './invoice-tax-summary';

export type HomeDeliveryReceiptA5Props = {
  issuedAtLabel: string;
  bookingCode: string;
  trackingCode: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  parcelDetails: string;
  parcelContent: string;
  destinationName: string;
  dropoffAddress: string;
  chargePsw: number;
  deliveryFeePsw: number;
  paidPrincipalPsw: number;
  paidDeliveryFeePsw: number;
  principalDuePsw: number;
  deliveryFeeDuePsw: number;
  totalDuePsw: number;
  grossPsw: number;
  netPsw: number;
  taxRows: Array<{ label: string; amountPsw: number }>;
  qrValue: string;
};

const money = (amountPsw: number) => `GH₵ ${(amountPsw / 100).toFixed(2)}`;
const moneyCedis = (amount: number) => `GH₵ ${amount.toFixed(2)}`;

function AmountLine({ label, amountPsw }: { label: string; amountPsw: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '3mm' }}>
      <span>{label}</span>
      <strong>{money(amountPsw)}</strong>
    </div>
  );
}

export function HomeDeliveryReceiptA5Template(props: HomeDeliveryReceiptA5Props) {
  return (
    <div
      className="invoice-a5-root bg-white text-black"
      style={{
        width: '198mm',
        boxSizing: 'border-box',
        border: '0.35mm solid #111',
        padding: '2.6mm 3.2mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '3.6mm',
        lineHeight: 1.1,
      }}
    >
      <InvoiceA5Header issuedAtLabel={props.issuedAtLabel} title="Tax Invoice" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 44mm', gap: '3mm' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3mm' }}>
          <div>
            <strong>Receiver Info</strong>
            <div style={{ fontSize: '5mm', fontWeight: 700 }}>{props.receiverName || '-'}</div>
            <div>{props.receiverPhone || '-'}</div>
            <div style={{ marginTop: '1mm' }}>Delivery address: {props.dropoffAddress || '-'}</div>
          </div>
          <div>
            <strong>Sender Info</strong>
            <div style={{ fontSize: '5mm', fontWeight: 700 }}>{props.senderName || '-'}</div>
            <div>{props.senderPhone || '-'}</div>
            <div style={{ marginTop: '1mm' }}>Destination: {props.destinationName || '-'}</div>
          </div>
          <div style={{ gridColumn: '1 / -1', borderTop: '0.2mm solid #111', paddingTop: '1mm' }}>
            <strong>Booking: {props.bookingCode}</strong>
            <div>
              Parcel: {props.parcelDetails || '-'} · {props.parcelContent || '-'}
            </div>
          </div>
        </div>
        <BrandedQrCode
          value={props.qrValue}
          size={300}
          variant="print"
          ariaLabel="Parcel tracking QR code"
          style={{ width: '34mm', height: '34mm', justifySelf: 'center' }}
        />
      </div>
      <div
        style={{
          borderTop: '0.28mm solid #111',
          paddingTop: '1mm',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4mm',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8mm' }}>
          {props.principalDuePsw > 0 ? (
            <AmountLine label="To be paid" amountPsw={props.principalDuePsw} />
          ) : null}
          <AmountLine label="Delivery fee" amountPsw={props.deliveryFeeDuePsw} />

          <div style={{ borderTop: '0.2mm solid #111', paddingTop: '0.8mm', fontSize: '5mm' }}>
            <AmountLine label="Amount due on delivery" amountPsw={props.totalDuePsw} />
          </div>
        </div>
        <InvoiceTaxSummary
          formatMoney={moneyCedis}
          isToBePaidReceipt={false}
          priceBeforeTax={props.netPsw / 100}
          taxRows={props.taxRows.map((row) => ({ label: row.label, value: row.amountPsw / 100 }))}
          totalPaid={props.grossPsw / 100}
        />
      </div>
      <InvoiceA5Terms />
    </div>
  );
}
