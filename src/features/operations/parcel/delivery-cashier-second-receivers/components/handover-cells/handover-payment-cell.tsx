import type { ParcelSearchRow } from '../../../api/parcel.api';
import { ParcelSuperSearchPaymentCell } from '../../../components/parcel-super-search';
import { formatHandoverMoney } from '../../utils';
import { HandoverField } from './handover-field';

export function HandoverPaymentCell({ parcel }: { parcel: ParcelSearchRow }) {
  return (
    <div className="w-48 max-w-full space-y-2 text-xs">
      <ParcelSuperSearchPaymentCell parcel={parcel} />
      <div className="space-y-1">
        <HandoverField label="Delivery fee">
          {formatHandoverMoney(parcel.deliveryFeePsw)}
        </HandoverField>
        <HandoverField label="Delivery fee to collect">
          {formatHandoverMoney(parcel.outstandingDeliveryFeePsw ?? parcel.deliveryFeePsw)}
        </HandoverField>
      </div>
    </div>
  );
}
