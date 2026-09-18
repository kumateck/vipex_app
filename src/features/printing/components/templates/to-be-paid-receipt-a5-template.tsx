import { BrandedQrCode } from '@/components/ui/branded-qr-code';
import { InvoiceA5Header } from './invoice-a5-header';
import { InvoiceA5Terms } from './invoice-a5-terms';
import type { InvoiceA5TemplateProps } from './invoice-a5-template.types';

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
  const parcelCode = `#${bookingCode.trim().replace(/^#+/, '')}`;

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

      <div
        style={{
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 40mm', gap: '4mm' }}>
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.2mm 5mm',
              marginTop: '2mm',
            }}
          >
            <ReceiptField label="Parcel Code" value={parcelCode} emphasis />
            <ReceiptField label="Date" value={issuedAtLabel} />
          </div>

          <ReceiptParty label="Sender" name={senderName} phone={senderTelephone} />
          <ReceiptParty label="Recipient" name={receiverName} phone={receiverTelephone} />
          <ReceiptField label="Delivery Location" value={deliveryAddress} />
          <ReceiptField label="Item Description" value={itemDescription || '-'} />

          <div
            style={{
              marginTop: '2mm',
              border: '0.35mm solid #111',
              padding: '1.5mm 2mm',
              textAlign: 'center',
              fontSize: '4.8mm',
              fontWeight: 900,
            }}
          >
            PAYMENT STATUS: TO BE PAID
          </div>

          <ReceiptField label="Amount Due for payment" value={amountDue} emphasis />
        </div>

        <BrandedQrCode
          value={qrValue}
          size={320}
          variant="print"
          ariaLabel="Parcel tracking QR code"
          className="self-start justify-self-center"
          style={{ width: '36mm', height: '36mm', justifySelf: 'center', alignSelf: 'start' }}
        />
      </div>
      <InvoiceA5Terms />
    </div>
  );
}

function ReceiptParty({ label, name, phone }: { label: string; name: string; phone: string }) {
  return (
    <div style={{ marginTop: '1.5mm', minWidth: 0, overflowWrap: 'anywhere' }}>
      <span style={{ fontWeight: 700 }}>{label}: </span>
      <span style={{ fontWeight: 600 }}>
        {name || '-'} ({phone || '-'})
      </span>
    </div>
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
