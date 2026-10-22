import type { ParcelSearchRow } from '../../../api/parcel.api';
import { CallSenderBadge } from '../../../components/call-sender-badge';
import { formatHandoverPhones } from '../../utils';
import { HandoverField } from './handover-field';

export function HandoverCustomersCell({ parcel }: { parcel: ParcelSearchRow }) {
  return (
    <div className="w-56 max-w-full space-y-2 whitespace-normal break-words text-xs">
      <div className="space-y-1">
        <HandoverField label="Sender">{parcel.senderName}</HandoverField>
        <HandoverField label="Tel">
          {formatHandoverPhones(parcel.senderPhone, parcel.senderPhone2)}
        </HandoverField>
        {parcel.callSender ? <CallSenderBadge /> : null}
      </div>
      <div className="space-y-1">
        <HandoverField label="Main receiver">{parcel.receiverName}</HandoverField>
        <HandoverField label="Tel">
          {formatHandoverPhones(parcel.receiverPhone, parcel.receiverPhone2)}
        </HandoverField>
      </div>
      <div className="space-y-1">
        <HandoverField label="Second receiver">
          {parcel.secondReceiverName || 'Not added'}
        </HandoverField>
        <HandoverField label="Tel">
          {formatHandoverPhones(parcel.secondReceiverPhone, parcel.secondReceiverPhone2)}
        </HandoverField>
      </div>
    </div>
  );
}
