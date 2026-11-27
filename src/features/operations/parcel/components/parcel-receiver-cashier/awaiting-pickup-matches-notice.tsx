import { memo } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Shown on the Receiver signatures tab when the shared search also matches parcels that still
 * need collection. A parcel without a pending signature request (never requested, or delivered
 * and then reversed) only appears under Awaiting Pickup, so point the cashier there.
 */
export const AwaitingPickupMatchesNotice = memo(function AwaitingPickupMatchesNotice({
  count,
  search,
  onShow,
}: {
  count: number;
  search: string;
  onShow: () => void;
}) {
  return (
    <section
      role="status"
      aria-label="Matching parcels awaiting pickup"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <p>
        {count === 1 ? '1 parcel' : `${count} parcels`} matching “{search}”{' '}
        {count === 1 ? 'has' : 'have'} no signature request yet and {count === 1 ? 'is' : 'are'}{' '}
        under Awaiting Pickup. Open the parcel there to verify OTP and request a new signature. This
        includes parcels whose delivery was reversed.
      </p>
      <Button type="button" variant="outline" onClick={onShow}>
        Show in Awaiting Pickup
      </Button>
    </section>
  );
});
