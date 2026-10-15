import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatStorageMoney } from '../utils';
import type { useStorageClearanceForm } from '../hooks';

export function StorageClearanceFields({
  form,
}: {
  form: ReturnType<typeof useStorageClearanceForm>;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <span>
          Unpaid accrued days: <strong>{form.accruedDays}</strong>
        </span>
        <span>
          Requested days: <strong>{form.requestedDays || 0}</strong>
        </span>
        <span>
          Balance days after clearance: <strong>{form.remainingDays}</strong>
        </span>
      </div>
      <p className="text-sm">
        Outstanding storage: {formatStorageMoney(form.outstandingPsw)} · Rate:{' '}
        {formatStorageMoney(form.dailyRatePsw)} / day
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.clearAll}
          disabled={form.isSaving}
          onChange={(event) => form.update({ clearAll: event.target.checked })}
        />{' '}
        Clear all accrued days
      </label>
      <Label htmlFor="storage-clearance-days">Days to clear</Label>
      <Input
        id="storage-clearance-days"
        type="number"
        min={1}
        step={1}
        value={form.clearAll ? form.accruedDays : form.days}
        disabled={form.clearAll || form.isSaving}
        onChange={(event) => form.update({ days: event.target.value })}
      />
      <p className="text-sm text-muted-foreground">
        Requested amount: {formatStorageMoney(form.requestedAmountPsw || 0)}
      </p>
      {form.requestedAmountPsw > form.outstandingPsw ? (
        <p className="text-sm text-amber-700">
          The requested days exceed the current unpaid accrual. Finance can return the request for
          review.
        </p>
      ) : null}
      {form.accruedDays <= 0 ? (
        <p className="text-sm text-destructive">There is no unpaid storage accrual to clear.</p>
      ) : null}
      <Label htmlFor="storage-clearance-reason">Reason for clearance</Label>
      <Textarea
        id="storage-clearance-reason"
        value={form.reason}
        disabled={form.isSaving}
        maxLength={1000}
        onChange={(event) => form.update({ reason: event.target.value })}
      />
      <Label htmlFor="storage-clearance-evidence">
        Evidence reference or attachment URL (optional)
      </Label>
      <Input
        id="storage-clearance-evidence"
        value={form.evidenceUrl}
        disabled={form.isSaving}
        maxLength={2000}
        onChange={(event) => form.update({ evidenceUrl: event.target.value })}
      />
    </div>
  );
}
