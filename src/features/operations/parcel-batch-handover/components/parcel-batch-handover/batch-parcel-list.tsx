import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ParcelHandoverNoteAction } from '@/features/operations/parcel-handover-note';
import {
  MAX_BATCH_PARCELS,
  type BatchPickupParcel,
} from '@/shared/shipments/parcel-batch-handover';
import { pickupOfficeLabel } from '@/shared/shipments/receiving-office';
import type { useBatchHandover } from '../../hooks';
import { formatBatchAmount } from '../../utils';

const ParcelChoice = memo(function ParcelChoice({
  row,
  checked,
  disabled,
  toggle,
}: {
  row: BatchPickupParcel;
  checked: boolean;
  disabled: boolean;
  toggle: (row: BatchPickupParcel) => void;
}) {
  const office = pickupOfficeLabel(row.pickupLocationName, row.receivingOfficeName);
  return (
    <li className="flex items-start gap-3 rounded-md border p-3">
      <Checkbox
        id={`batch-${row.id}`}
        checked={checked}
        disabled={disabled || Boolean(row.blockedReason)}
        onCheckedChange={() => toggle(row)}
      />
      <div className="min-w-0 flex-1 space-y-1 text-sm">
        <Label htmlFor={`batch-${row.id}`}>
          {row.trackingCode} · {row.receiverName}
        </Label>
        <p className="text-muted-foreground">
          {row.bookingCode} · {row.parcelDetails}
        </p>
        {office || row.queueNumber != null ? (
          <p className="text-muted-foreground">
            {[office, row.queueNumber != null ? `Queue #${row.queueNumber}` : '']
              .filter(Boolean)
              .join(' · ')}
          </p>
        ) : null}
        {row.blockedReason ? <p className="text-destructive">{row.blockedReason}</p> : null}
      </div>
      <ParcelHandoverNoteAction
        parcelId={row.id}
        hasHandoverNote={row.hasHandoverNote}
        handoverNoteCritical={row.handoverNoteCritical}
      />
      {row.principalPsw + row.storagePsw > 0 ? (
        <span className="text-sm font-medium tabular-nums">
          {formatBatchAmount(row.principalPsw + row.storagePsw)}
        </span>
      ) : null}
    </li>
  );
});

export function BatchParcelList({ flow }: { flow: ReturnType<typeof useBatchHandover> }) {
  if (!flow.page) return null;
  return (
    <div className="space-y-3">
      <p className="text-sm">
        {flow.page.rows.length
          ? `Results for ${flow.telephone}`
          : `No matching parcels found so far for ${flow.telephone}.`}
      </p>
      <ul className="space-y-2">
        {flow.page.rows.map((row) => {
          const checked = flow.selectedIds.has(row.id);
          return (
            <ParcelChoice
              key={row.id}
              row={row}
              checked={checked}
              disabled={flow.busy || (!checked && flow.selected.length >= MAX_BATCH_PARCELS)}
              toggle={flow.toggle}
            />
          );
        })}
      </ul>
      {flow.page.next ? (
        <Button
          type="button"
          variant="outline"
          disabled={flow.busy}
          onClick={() => void flow.search(true)}
        >
          Load more parcels
        </Button>
      ) : null}
    </div>
  );
}
