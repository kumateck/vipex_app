import { Button } from '@/components/ui/button';
import { formatStorageMoney } from '../utils';
import type { StorageClearanceCreateState as State } from '../types';
import { ViewParcelDetailsButton } from '@/features/operations/parcel-details';

export function StorageClearanceSearchResults({ state }: { state: State }) {
  return (
    <>
      {state.result.isError ? (
        <p role="alert" className="text-destructive">
          Unable to search parcels. Please retry.
        </p>
      ) : null}
      <div className="space-y-2">
        {(state.result.data?.data ?? []).map((parcel) => (
          <div key={parcel.id} className="flex items-center gap-2">
            <button
              type="button"
              className={`w-full rounded-md border p-3 text-left ${state.selected?.id === parcel.id ? 'border-primary' : ''}`}
              onClick={() => state.setSelected(parcel)}
            >
              <strong>{parcel.bookingCode}</strong> · {parcel.trackingCode}
              <p className="text-sm text-muted-foreground">
                Accrued storage: {parcel.storageChargeDays ?? 0} days ·{' '}
                {formatStorageMoney(parcel.storageChargePsw)}
              </p>
            </button>
            <ViewParcelDetailsButton parcelId={parcel.id} />
          </div>
        ))}
      </div>
      {state.result.data && !state.result.data.data.length ? (
        <p className="text-sm text-muted-foreground">No matching parcels found.</p>
      ) : null}
      {state.result.data ? (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            disabled={state.searchPage <= 1 || state.result.isFetching}
            onClick={() => state.setSearchPage(state.searchPage - 1)}
          >
            Previous
          </Button>
          <span className="self-center text-sm">Page {state.searchPage}</span>
          <Button
            variant="outline"
            disabled={!state.result.data.meta?.hasNextPage || state.result.isFetching}
            onClick={() => state.setSearchPage(state.searchPage + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </>
  );
}
