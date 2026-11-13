import { cn } from '@/lib/utils';
import { pickupOfficeLabel, type ParcelReceivingOffice } from '@/shared/shipments/receiving-office';

export function ParcelPickupOffice({
  parcel,
  className,
  showLabel = true,
  fallback = null,
}: {
  parcel: ParcelReceivingOffice;
  className?: string;
  showLabel?: boolean;
  fallback?: string | null;
}) {
  const pickup = pickupOfficeLabel(parcel.pickupLocationName, parcel.receivingOfficeName);
  if (!pickup) return fallback;

  return (
    <p className={cn('max-w-60 whitespace-normal break-words', className)}>
      {showLabel ? <span className="font-medium">Pickup: </span> : null}
      {pickup}
    </p>
  );
}
