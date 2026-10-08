import type { InvoiceA5TemplateProps } from './invoice-a5-template.types';
import { ReceiptRollField, ReceiptRollAmount } from './receipt-roll-shell';
import { receiptTaxRows } from './receipt-tax-rows';
import { isToBePaidDeliveryReceipt } from './invoice-a5-template.utils';

export function ReceiptRollPayment(props: InvoiceA5TemplateProps) {
  const money = props.formatMoney;
  const unpaid = isToBePaidDeliveryReceipt(props);
  if (unpaid)
    return (
      <>
        <strong>PAYMENT STATUS: TO BE PAID</strong>
        <ReceiptRollAmount label="Amount Due for payment" value={money(props.receiverToPayCedis)} />
      </>
    );
  return <ReceiptRollPaidPayment {...props} />;
}

function ReceiptRollPaidPayment(props: InvoiceA5TemplateProps) {
  const money = props.formatMoney;
  const partial = props.senderPaidCedis > 0 && props.receiverToPayCedis > 0;
  const storage = props.storageChargeCedis ?? 0;
  return (
    <>
      {partial ? <strong>PARTIAL PAYMENT RECEIPT</strong> : null}
      <ReceiptRollField
        label={props.payerLabel}
        value={`${props.payerName} (${props.payerTelephone || '-'})`}
      />
      {props.parcelValueCedis != null ? (
        <ReceiptRollAmount label="Value of Parcel(s)" value={money(props.parcelValueCedis)} />
      ) : null}
      <ReceiptRollField label="Amount in Words" value={props.amountInWords} />
      <div style={{ borderTop: '0.25mm solid #000', paddingTop: '2mm' }}>
        <ReceiptRollAmount
          label="Price"
          value={money(Math.max(props.amountPaidCedis - props.tax.totalTax, 0))}
        />
        {storage > 0 ? (
          <ReceiptRollAmount label="Ageing storage (included)" value={money(storage)} />
        ) : null}
        {receiptTaxRows(props.tax).map((row) => (
          <ReceiptRollAmount key={row.label} label={row.label} value={money(row.value)} />
        ))}
        <ReceiptRollAmount label="Total" value={money(props.amountPaidCedis)} />
        {partial ? (
          <ReceiptRollAmount label="Receiver to pay" value={money(props.receiverToPayCedis)} />
        ) : null}
      </div>
    </>
  );
}
