import { ParcelPickupOffice } from '@/features/operations/parcel-receiving-office';
import { ParcelHandoverNoteAction } from '@/features/operations/parcel-handover-note';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ReceiverHandoverWatchKey } from '@/shared/shipments/receiver-cashier-signature';
import { useReceiverHandoverList } from './hooks';

export function ReceiverHandoverList({
  enabled,
  onOpen,
}: {
  enabled: boolean;
  onOpen: (pending: ReceiverHandoverWatchKey) => void;
}) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [after, setAfter] = useState<string>();
  const state = useReceiverHandoverList(search, after);
  const page = state?.page;
  if (!enabled && !page?.rows.length && !search && !after) return null;

  return (
    <section className="space-y-3 rounded-md border p-4" aria-label="Receiver signatures">
      <h2 className="font-semibold">Receiver signatures</h2>
      <p className="text-sm text-muted-foreground">
        Open a parcel to see its signature status. Confirm signed parcels in Vipex Desktop.
      </p>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(input.trim());
          setAfter(undefined);
        }}
      >
        <Input
          aria-label="Search receiver signatures"
          placeholder="Tracking, booking, or collector name"
          maxLength={100}
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <Button variant="secondary" type="submit">
          Search
        </Button>
      </form>
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
        <Button variant="outline" onClick={() => setAfter(undefined)}>
          First page
        </Button>
      ) : null}
      {page?.next ? (
        <Button variant="outline" onClick={() => setAfter(page.next ?? undefined)}>
          Next page
        </Button>
      ) : null}
    </section>
  );
}
