import { ParcelPickupOffice } from '@/features/operations/parcel-receiving-office';
import { ParcelHandoverNoteAction } from '@/features/operations/parcel-handover-note';
import { Button } from '@/components/ui/button';
import type { ReceiverHandoverWatchKey } from '@/shared/shipments/receiver-cashier-signature';
import { useReceiverHandoverSearch } from './hooks';

export function ReceiverHandoverList({
  enabled,
  search = '',
  onOpen,
}: {
  enabled: boolean;
  search?: string;
  onOpen: (pending: ReceiverHandoverWatchKey) => void;
}) {
  const state = useReceiverHandoverSearch(search);
  const { page, after } = state;
  if (!enabled && page && !page.rows.length && !search && !after && !state.failed) return null;

  return (
    <section className="space-y-3 rounded-md border p-4" aria-label="Receiver signatures">
      <h2 className="font-semibold">Receiver signatures</h2>
      <p className="text-sm text-muted-foreground">
        Continue an earlier handover, including one started by another cashier at this branch. Use
        the parcel search above to find it. Confirm signed parcels in Vipex Desktop.
      </p>
      {state?.failed ? <p role="status">Unable to refresh signatures. Retrying…</p> : null}
      {!page && !state?.failed ? <p role="status">Loading signatures…</p> : null}
      {page?.rows.length === 0 ? <p>No matching parcels.</p> : null}
      <ul className="divide-y">
        {page?.rows.map((row) => (
          <li
            key={row.handoverId}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div>
              <p className="font-medium">
                {row.trackingCode} · {row.bookingCode}
              </p>
              <p className="text-sm text-muted-foreground">
                {row.collectorName} · Associate: {row.associateName}
              </p>
              <ParcelPickupOffice parcel={row} className="text-sm text-muted-foreground" />
              <p className="text-sm" aria-live="polite">
                {row.signedAt ? 'Ready to confirm' : 'Awaiting signature'}
              </p>
              <ParcelHandoverNoteAction
                parcelId={row.id}
                hasHandoverNote={row.hasHandoverNote}
                handoverNoteCritical={row.handoverNoteCritical}
              />
            </div>
            <Button
              variant={row.signedAt ? 'default' : 'secondary'}
              onClick={() => onOpen({ parcelId: row.id, handoverId: row.handoverId })}
            >
              {row.signedAt ? 'Review signature' : 'Open handover'}
            </Button>
          </li>
        ))}
      </ul>
      {after ? (
        <Button variant="outline" onClick={state.firstPage}>
          First page
        </Button>
      ) : null}
      {page?.next ? (
        <Button variant="outline" onClick={state.nextPage}>
          Next page
        </Button>
      ) : null}
    </section>
  );
}
