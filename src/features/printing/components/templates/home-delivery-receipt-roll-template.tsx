import type { HomeDeliveryReceiptA5Props } from './home-delivery-receipt-a5-template';
import type { ReceiptPaperFormat } from '@/shared/printing/receipt-paper';
import { ReceiptRollShell, ReceiptRollField, ReceiptRollAmount } from './receipt-roll-shell';

export function HomeDeliveryReceiptRollTemplate(
  props: HomeDeliveryReceiptA5Props & {
    paperFormat: Exclude<ReceiptPaperFormat, 'a5'>;
  },
) {
  const money = (psw: number) => `GH₵ ${(psw / 100).toFixed(2)}`;
  return (
    <ReceiptRollShell
      paperFormat={props.paperFormat}
      title="Tax Invoice"
      issuedAtLabel={props.issuedAtLabel}
      cashierName={props.cashierName}
      qrValue={props.qrValue}
    >
      <ReceiptRollField label="Booking" value={props.bookingCode} />
      <ReceiptRollField
        label="Receiver Info"
        value={`${props.receiverName} (${props.receiverPhone || '-'})`}
      />
      <ReceiptRollField
        label="Sender Info"
        value={`${props.senderName} (${props.senderPhone || '-'})`}
      />
      <ReceiptRollField label="Destination" value={props.destinationName} />
      <ReceiptRollField label="Delivery address" value={props.dropoffAddress} />
      <ReceiptRollField label="Parcel" value={`${props.parcelDetails} · ${props.parcelContent}`} />
      {props.principalDuePsw > 0 ? (
        <ReceiptRollAmount label="To be paid" value={money(props.principalDuePsw)} />
      ) : null}
      <ReceiptRollAmount label="Delivery fee" value={money(props.deliveryFeeDuePsw)} />
      <ReceiptRollAmount label="Amount due on delivery" value={money(props.totalDuePsw)} />
      <div style={{ borderTop: '0.25mm solid #000', paddingTop: '2mm' }}>
        <ReceiptRollAmount label="Price" value={money(props.netPsw)} />
        {props.taxRows.map((row) => (
          <ReceiptRollAmount key={row.label} label={row.label} value={money(row.amountPsw)} />
        ))}
        <ReceiptRollAmount label="Total" value={money(props.grossPsw)} />
      </div>
    </ReceiptRollShell>
  );
}
