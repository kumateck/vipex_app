import type { InvoiceA5TemplateProps } from './invoice-a5-template.types';
import type { ReceiptPaperFormat } from '@/shared/printing/receipt-paper';
import { isToBePaidDeliveryReceipt } from './invoice-a5-template.utils';
import { ReceiptRollShell, ReceiptRollField } from './receipt-roll-shell';
import { ReceiptRollPayment } from './receipt-roll-payment';

export function ReceiptRollTemplate(
  props: InvoiceA5TemplateProps & {
    paperFormat: Exclude<ReceiptPaperFormat, 'a5'>;
  },
) {
  const unpaid = isToBePaidDeliveryReceipt(props);
  const money = props.formatMoney;
  const destination = [props.destinationLocationName, props.destinationBranchName]
    .filter((value) => value && value !== '-')
    .join(', ');
  return (
    <ReceiptRollShell
      paperFormat={props.paperFormat}
      issuedAtLabel={props.issuedAtLabel}
      title={unpaid ? 'ACKNOWLEDGEMENT NOTE' : 'Tax Invoice'}
      cashierName={props.cashierName}
      duplicate={props.duplicate}
      qrValue={props.qrValue}
    >
      {unpaid ? (
        <div style={{ border: '0.25mm solid #000', padding: '1.5mm', fontWeight: 700 }}>
          NOTICE: The sender has made NO PAYMENT. Full payment of {money(props.receiverToPayCedis)}{' '}
          will be collected from the recipient before the parcel is released.
        </div>
      ) : null}
      <ReceiptRollField label="Parcel Code" value={`#${props.bookingCode.replace(/^#+/, '')}`} />
      <ReceiptRollField
        label="Sender"
        value={`${props.senderName} (${props.senderTelephone || '-'})`}
      />
      <ReceiptRollField
        label="Recipient"
        value={`${props.receiverName} (${props.receiverTelephone || '-'})`}
      />
      <ReceiptRollField label="Delivery Location" value={destination} />
      <ReceiptRollField
        label="Item Description"
        value={[props.parcelDetails, props.parcelContent].filter(Boolean).join(' — ')}
      />
      <ReceiptRollPayment {...props} />
    </ReceiptRollShell>
  );
}
