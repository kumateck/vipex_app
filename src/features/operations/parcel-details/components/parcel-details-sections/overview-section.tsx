import { lazy, memo, Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import type { ParcelFullDetails } from '@/features/operations/parcel/api/parcel.api';
import { ParcelInternalHolderBadge } from '@/features/operations/parcel/components/parcel-internal-holder-badge';
import { ParcelStorageFeeBadge } from '@/features/operations/parcel/components/parcel-storage-fee-badge';
import {
  resolveParcelDeliveredAt,
  resolveParcelRider,
} from '@/features/operations/parcel/components/parcel-super-search/utils';
import { parcelStatusLabel } from '@/shared/shipments/parcel-status-labels';
import { formatMoney, formatWhen, personName } from '../../utils/parcel-details-format';
import { DetailCard, DetailGrid } from '../detail-grid/detail-grid';

const ParcelQrCode = lazy(() =>
  import('@/features/operations/parcel/components/parcel-in-transit/parcel-qr-code').then(
    (module) => ({ default: module.ParcelQrCode }),
  ),
);

export const OverviewSection = memo(function OverviewSection({
  details,
}: {
  details: ParcelFullDetails;
}) {
  const { parcel, summary, delivery } = details;
  const userNames = details.userNames ?? {};
  const rider = resolveParcelRider({
    status: parcel.status,
    riderName: delivery?.riderName ?? summary?.riderName,
  });
  const deliveredAt = resolveParcelDeliveredAt({
    status: parcel.status,
    deliveredAt: delivery?.deliveredAt,
    confirmedAt: parcel.confirmedAt,
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
      <DetailCard title="Parcel">
        <div className="mb-4 space-y-1">
          <Badge variant="secondary" className="text-sm">
            {parcelStatusLabel(parcel.status)}
          </Badge>
          {rider ? (
            <p className="text-sm">
              <span className="text-muted-foreground">{rider.label}:</span> {rider.name}
            </p>
          ) : null}
          <p className="text-sm">
            <span className="text-muted-foreground">Created By:</span>{' '}
            {personName(userNames, parcel.createdBy)}
          </p>
          <ParcelStorageFeeBadge storageChargePsw={summary?.storageChargePsw} />
        </div>
        <DetailGrid
          items={[
            { label: 'Booking', value: parcel.bookingCode },
            { label: 'Tracking', value: parcel.trackingCode },
            { label: 'Consignment', value: summary?.consignmentCode },
            { label: 'Parcel Details', value: parcel.parcelDetails },
            { label: 'Parcel Content', value: parcel.parcelContent },
            { label: 'Declared Value', value: formatMoney(parcel.parcelValuePsw) },
            {
              label: 'Current Holder',
              value: <ParcelInternalHolderBadge holder={details.internalHolder} />,
            },
            { label: 'Created At', value: formatWhen(parcel.createdAt) },
            { label: 'Received At', value: formatWhen(parcel.receivedAt) },
            { label: 'Confirmed At', value: formatWhen(parcel.confirmedAt) },
            { label: 'Delivered At', value: formatWhen(deliveredAt) },
            parcel.isDeleted
              ? {
                  label: 'Deleted',
                  value: `${formatWhen(parcel.deletedAt)} by ${personName(userNames, parcel.deletedBy)}: ${parcel.deleteReason ?? 'No reason given'}`,
                  wide: true,
                }
              : null,
          ]}
        />
      </DetailCard>
      <Suspense
        fallback={
          <div className="grid min-h-64 w-64 place-items-center rounded-lg border text-sm text-muted-foreground">
            Loading QR code...
          </div>
        }
      >
        <ParcelQrCode bookingCode={parcel.bookingCode} trackingCode={parcel.trackingCode} />
      </Suspense>
    </div>
  );
});
