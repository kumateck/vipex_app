import { memo } from 'react';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { CallSenderBadge } from '../call-sender-badge';
import { ParcelStorageFeeBadge } from '../parcel-storage-fee-badge';

function phones(primary?: string | null, secondary?: string | null) {
  return [primary, secondary].filter((value) => value?.trim()).join(' / ') || '-';
}

export const ParcelCustomerCell = memo(function ParcelCustomerCell({
  parcel,
}: {
  parcel: ParcelSearchRow;
}) {
  return (
    <div className="max-w-64 space-y-2 whitespace-normal [overflow-wrap:anywhere]">
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <p className="font-medium">{parcel.receiverName ?? '-'}</p>
          {parcel.callSender ? <CallSenderBadge className="h-5 px-1.5 text-[10px]" /> : null}
        </div>
        <p className="text-muted-foreground text-xs">
          {phones(parcel.receiverPhone, parcel.receiverPhone2)}
        </p>
      </div>
      <div className="leading-tight">
        <p className="font-medium">{parcel.senderName ?? '-'}</p>
        <p className="text-muted-foreground text-xs">
          {phones(parcel.senderPhone, parcel.senderPhone2)}
        </p>
      </div>
      <ParcelStorageFeeBadge storageChargePsw={parcel.storageChargePsw} />
    </div>
  );
});
