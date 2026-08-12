import { InvoiceA5Header } from './invoice-a5-header';
import type { InvoiceA5TemplateProps } from './invoice-a5-template.types';
import { createQrSvg } from './thermal-sticker-template-utils';

export function ToBePaidReceiptA5Template(props: InvoiceA5TemplateProps) {
  const {
    bookingCode,
    destinationBranchName,
    destinationLocationName,
    issuedAtLabel,
    parcelContent,
    parcelDetails,
    qrValue,
    receiverName,
    receiverTelephone,
    receiverToPayCedis,
    senderName,
    senderTelephone,
  } = props;
  const deliveryAddress = formatDestination(destinationBranchName, destinationLocationName);
  const itemDescription = [parcelDetails, parcelContent]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' — ');
  const amountDue = `GHS ${receiverToPayCedis.toFixed(2)}`;
  const qrSvg = createQrSvg(qrValue);

  return (
    <div
      className="invoice-a5-root bg-white text-black"
      style={{
        width: '198mm',
        boxSizing: 'border-box',
        border: '0.35mm solid #111',
        padding: '2.6mm 3.2mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '3.8mm',
        lineHeight: 1.2,
      }}
    >
      <InvoiceA5Header issuedAtLabel={issuedAtLabel} title="ACKNOWLEDGEMENT NOTE" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 40mm', gap: '4mm' }}>
        <div>
          <div style={{ textAlign: 'center', fontSize: '6mm', fontWeight: 900 }}>
            PARCEL DELIVERY RECEIPT
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.2mm 5mm',
              marginTop: '2mm',
            }}
          >
            <ReceiptField label="Receipt Number" value="#________________" />
            <ReceiptField label="Date" value={issuedAtLabel} />
          </div>

          <ReceiptField label="Parcel Code" value={bookingCode} emphasis />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5mm' }}>
            <ReceiptParty title="Sender Information" name={senderName} phone={senderTelephone} />
            <ReceiptParty
              title="Recipient Information"
              name={receiverName}
              phone={receiverTelephone}
            />
          </div>

          <ReceiptField label="Delivery Address" value={deliveryAddress} />
          <ReceiptField label="Item Description" value={itemDescription || '-'} />
          <ReceiptField label="Amount Due upon Delivery" value={amountDue} emphasis />
        </div>

        <div
          aria-label="Parcel tracking QR code"
          style={{ width: '36mm', height: '36mm', justifySelf: 'center', alignSelf: 'start' }}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      </div>

      <div
        style={{
          marginTop: '2.2mm',
          border: '0.35mm solid #111',
          padding: '2mm 2.4mm',
          fontSize: '4.2mm',
          fontWeight: 700,
          lineHeight: 1.25,
          textAlign: 'center',
        }}
      >
        <strong>NOTICE:</strong> The sender has made <strong>NO PAYMENT</strong>. Full payment of{' '}
        <strong>{amountDue}</strong> will be collected from the recipient before the parcel is
        released.
      </div>
    </div>
  );
}

function ReceiptParty({ title, name, phone }: { title: string; name: string; phone: string }) {
  return (
    <section style={{ borderTop: '0.25mm solid #111', paddingTop: '1.2mm', marginTop: '1.5mm' }}>
      <div style={{ fontSize: '4.2mm', fontWeight: 900 }}>{title}</div>
      <ReceiptField label="Name" value={name} />
      <ReceiptField label="Phone Number" value={phone || '-'} />
    </section>
  );
}

function ReceiptField({
  emphasis = false,
  label,
  value,
}: {
  emphasis?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div style={{ marginTop: '1.2mm', minWidth: 0 }}>
      <span style={{ fontWeight: 700 }}>{label}: </span>
      <span
        style={{
          fontSize: emphasis ? '5.2mm' : undefined,
          fontWeight: emphasis ? 900 : 600,
          overflowWrap: 'anywhere',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function formatDestination(branchName: string, locationName: string) {
  const branch = branchName.trim() || '-';
  const location = locationName.trim();
  return !location || location === '-' ? branch : `${location}, ${branch}`;
}
