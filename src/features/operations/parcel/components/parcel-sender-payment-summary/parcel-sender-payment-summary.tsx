import { memo } from 'react';

export type ParcelSenderPaymentSummaryItem = {
  parcelId: string;
  bookingCode: string;
  destinationBranchName: string;
  destinationLocationName?: string | null;
  parcelDetails?: string | null;
  parcelContent?: string | null;
  parcelValueCedis?: number | null;
  expectedChargeCedis: number;
  senderShouldPayCedis: number;
  senderName?: string | null;
  senderPhone?: string | null;
  senderPhone2?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  receiverPhone2?: string | null;
};

type ParcelSenderPaymentSummaryProps = {
  items: ParcelSenderPaymentSummaryItem[];
};

export const ParcelSenderPaymentSummary = memo(function ParcelSenderPaymentSummary({
  items,
}: ParcelSenderPaymentSummaryProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item.parcelId} className="rounded-md border border-border/70 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryField label="Booking Code" value={item.bookingCode} strong />
            <SummaryField
              label="Destination"
              value={item.destinationBranchName}
              detail={item.destinationLocationName}
              strong
            />
            <SummaryField label="Parcel Details" value={item.parcelDetails} />
            <SummaryField label="Content" value={item.parcelContent} />
            <SummaryField label="Parcel Value" value={formatMoney(item.parcelValueCedis)} strong />
            <SummaryField
              label="Expected Charge"
              value={formatMoney(item.expectedChargeCedis)}
              strong
            />
            <SummaryContact
              label="Sender"
              name={item.senderName}
              phone={item.senderPhone}
              phone2={item.senderPhone2}
            />
            <SummaryContact
              label="Receiver"
              name={item.receiverName}
              phone={item.receiverPhone}
              phone2={item.receiverPhone2}
            />
          </div>

          <div className="mt-3 flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
            <span className="text-sm text-muted-foreground">Sender Should Pay</span>
            <span className="font-semibold">{formatMoney(item.senderShouldPayCedis)}</span>
          </div>
        </article>
      ))}
    </div>
  );
});

function SummaryField({
  label,
  value,
  detail,
  strong = false,
}: {
  label: string;
  value?: string | number | null;
  detail?: string | null;
  strong?: boolean;
}) {
  const displayValue = formatText(value);

  return (
    <div className="min-w-0 space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={strong ? 'break-words font-medium' : 'break-words'}>{displayValue}</p>
      {detail ? <p className="break-words text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function SummaryContact({
  label,
  name,
  phone,
  phone2,
}: {
  label: string;
  name?: string | null;
  phone?: string | null;
  phone2?: string | null;
}) {
  return (
    <SummaryField
      label={label}
      value={name}
      detail={[phone, phone2].filter(Boolean).join(', ') || '-'}
      strong
    />
  );
}

function formatMoney(value?: number | null) {
  return `GHS ${Number(value ?? 0).toFixed(2)}`;
}

function formatText(value?: string | number | null) {
  if (typeof value === 'number') return String(value);
  return value?.trim() ? value : '-';
}
