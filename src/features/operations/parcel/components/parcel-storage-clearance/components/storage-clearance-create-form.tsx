import { Button } from '@/components/ui/button';
import { useStorageClearanceForm } from '../hooks';
import type { StorageClearanceCreateState as State } from '../types';
import { StorageClearanceFields } from './storage-clearance-fields';

function SelectedRequestForm({ state }: { state: State }) {
  const form = useStorageClearanceForm({
    accruedDays: state.accruedDays,
    dailyRatePsw: state.dailyRatePsw,
    outstandingPsw: state.outstandingPsw,
    parcelId: state.selected?.id,
    onDone: state.cancel,
  });
  return (
    <form
      className="space-y-4 rounded-md border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.submit();
      }}
    >
      <StorageClearanceFields form={form} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={form.isSaving} onClick={state.cancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!form.canSubmit}>
          {form.isSaving ? 'Submitting…' : 'Submit for Approval'}
        </Button>
      </div>
    </form>
  );
}
export function StorageClearanceCreateForm({ state }: { state: State }) {
  return (
    <>
      {state.selected && state.detail.isFetching ? <p>Loading current storage accrual…</p> : null}
      {state.selected && state.detail.isError ? (
        <p role="alert" className="text-destructive">
          Unable to load current accrual.{' '}
          <Button variant="outline" onClick={() => void state.detail.refetch()}>
            Retry
          </Button>
        </p>
      ) : null}
      {state.selected && state.detail.currentData && !state.detail.isFetching ? (
        <SelectedRequestForm key={state.selected.id} state={state} />
      ) : null}{' '}
    </>
  );
}
