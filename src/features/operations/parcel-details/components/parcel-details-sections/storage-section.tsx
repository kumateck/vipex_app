import { memo } from 'react';
import { ParcelDispositionActionType } from '@/db/schemas/enums';
import type { ParcelFullDetails } from '@/features/operations/parcel/api/parcel.api';
import { formatMoney, formatWhen } from '../../utils/parcel-details-format';
import { DetailCard, DetailGrid, EmptyNote } from '../detail-grid/detail-grid';

function dispositionName(actionType: number) {
  const name = ParcelDispositionActionType[actionType];
  return typeof name === 'string'
    ? name.replaceAll('_', ' ').toLowerCase()
    : `Action ${actionType}`;
}

export const StorageSection = memo(function StorageSection({
  details,
}: {
  details: ParcelFullDetails;
}) {
  const { storageSettlement, storageWaivers, dispositionActions, summary } = details;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DetailCard title="Storage Charges" className="lg:col-span-2">
        <DetailGrid
          items={[
            { label: 'Storage Days Charged', value: summary?.storageChargeDays ?? 0 },
            { label: 'Charging Since', value: formatWhen(summary?.storageChargeStartAt) },
            { label: 'Accrued', value: formatMoney(storageSettlement?.accruedPsw) },
            { label: 'Paid', value: formatMoney(storageSettlement?.paidPsw) },
            { label: 'Waived', value: formatMoney(storageSettlement?.waivedPsw) },
            { label: 'Outstanding', value: formatMoney(storageSettlement?.outstandingPsw) },
          ]}
        />
      </DetailCard>
      <DetailCard title={`Storage Waivers (${storageWaivers.length})`}>
        {storageWaivers.length === 0 ? (
          <EmptyNote>No storage waivers.</EmptyNote>
        ) : (
          <ul className="space-y-2 text-sm">
            {storageWaivers.map((waiver) => (
              <li key={waiver.id} className="rounded-md border p-3">
                <p className="font-medium">{formatMoney(waiver.waivedAmountPsw)} waived</p>
                <p className="text-muted-foreground">{waiver.reason}</p>
                <p className="text-muted-foreground">
                  {formatWhen(waiver.waivedAt)} by {waiver.waivedByName ?? '-'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DetailCard>
      <DetailCard title={`Disposition Actions (${dispositionActions.length})`}>
        {dispositionActions.length === 0 ? (
          <EmptyNote>No disposition actions.</EmptyNote>
        ) : (
          <ul className="space-y-2 text-sm">
            {dispositionActions.map((action) => (
              <li key={action.id} className="rounded-md border p-3">
                <p className="font-medium capitalize">{dispositionName(action.actionType)}</p>
                {action.warehouseName ? (
                  <p className="text-muted-foreground">Warehouse: {action.warehouseName}</p>
                ) : null}
                {action.recoveredAmountPsw > 0 ? (
                  <p className="text-muted-foreground">
                    Recovered: {formatMoney(action.recoveredAmountPsw)}
                  </p>
                ) : null}
                {action.notes ? <p className="text-muted-foreground">{action.notes}</p> : null}
                <p className="text-muted-foreground">
                  {formatWhen(action.performedAt)} by {action.performedByName ?? '-'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DetailCard>
    </div>
  );
});
