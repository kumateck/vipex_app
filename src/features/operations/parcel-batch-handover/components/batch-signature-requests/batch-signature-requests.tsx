import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { ParcelHandoverNoteAction } from '@/features/operations/parcel-handover-note';
import type { BatchHandoverWorkflow } from '@/shared/shipments/parcel-batch-handover';
import { useBatchSignatureRequests } from '../../hooks/web';

export const BatchSignatureRequests = memo(function BatchSignatureRequests({
  workflow,
  search = '',
}: {
  workflow: BatchHandoverWorkflow;
  search?: string;
}) {
  const { rows, failed, retry } = useBatchSignatureRequests(workflow, search);
  return (
    <section className="space-y-3 rounded-md border p-4" aria-label="Multiple-parcel signatures">
      <h2 className="font-semibold">Multiple-parcel signatures</h2>
      <p className="text-sm text-muted-foreground">
        Lists sent for one mobile signature. Confirm in the Hand over multiple parcels dialog that
        started the request.
      </p>
      {failed ? (
        <div role="status" className="space-y-2 text-sm">
          <p>Unable to load multiple-parcel signatures.</p>
          <Button variant="outline" onClick={() => void retry()}>
            Retry
          </Button>
        </div>
      ) : null}
      {!rows && !failed ? <p role="status">Loading signatures…</p> : null}
      {rows?.length === 0 ? <p>No multiple-parcel requests.</p> : null}
      <ul className="divide-y">
        {rows?.map((row) => (
          <li key={row.requestId} className="space-y-2 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {row.parcels[0]?.receiverName ?? 'Receiver'} · {row.telephone}
              </p>
              <p className="text-sm" aria-live="polite">
                {row.signedAt ? 'Ready to confirm' : 'Awaiting signature'} · {row.parcels.length}{' '}
                parcels
              </p>
            </div>
            <ul className="space-y-1 pl-3">
              {row.parcels.map((parcel) => (
                <li key={parcel.id} className="text-sm">
                  <span className="font-medium">{parcel.bookingCode}</span>
                  <span className="text-muted-foreground"> · {parcel.parcelDetails}</span>
                  <ParcelHandoverNoteAction
                    parcelId={parcel.id}
                    hasHandoverNote={parcel.hasHandoverNote}
                    handoverNoteCritical={parcel.handoverNoteCritical}
                  />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
});
