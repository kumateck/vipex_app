import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { ParcelSecondReceiverState } from '../hooks/use-parcel-second-receiver';

export function ParcelSecondReceiverRemoveConfirm({ state }: { state: ParcelSecondReceiverState }) {
  const name = state.parcel?.secondReceiverName || state.parcel?.secondReceiverPhone || '';

  return (
    <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-3">
      <p className="text-sm">
        Remove <span className="font-medium">{name}</span> as second receiver? Only the main
        receiver will be able to collect this parcel.
      </p>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => state.setConfirmingRemove(false)}
          disabled={state.isSaving}
        >
          Keep
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => void state.remove()}
          disabled={state.isSaving}
        >
          {state.isSaving ? <Spinner /> : null}
          Confirm Remove
        </Button>
      </div>
    </div>
  );
}
