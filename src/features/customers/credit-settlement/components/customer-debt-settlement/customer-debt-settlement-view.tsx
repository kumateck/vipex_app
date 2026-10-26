import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreditSettlementModel } from '../../hooks';
import { formatCreditMoney } from '../../utils';

export function CustomerDebtSettlementView({ model }: { model: CreditSettlementModel }) {
  return (
    <section
      className="space-y-4 rounded-lg border p-4"
      aria-label="Settle parcel debt"
      aria-busy={model.isLoading}
    >
      <div>
        <h3 className="font-semibold">Settle parcel debt</h3>
        <p className="text-sm text-muted-foreground">
          Select parcels, then enter their exact outstanding total. Each selected parcel is settled
          in full.
        </p>
      </div>
      {model.isError ? (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>Could not load outstanding parcels.</p>
          <Button variant="outline" onClick={() => void model.refetch()}>
            Retry
          </Button>
        </div>
      ) : model.isFetching ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading outstanding parcels…
        </p>
      ) : model.parcels.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No outstanding parcel debt for this customer.
        </p>
      ) : (
        <fieldset disabled={model.isLoading} className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Outstanding parcels</legend>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {model.parcels.map((parcel) => (
              <label
                key={parcel.parcelId}
                className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-[[data-state=checked]]:border-primary"
              >
                <Checkbox
                  className="mt-1"
                  checked={model.selectedIdSet.has(parcel.parcelId)}
                  onCheckedChange={() => model.toggleParcel(parcel.parcelId)}
                  aria-label={`Settle ${parcel.bookingCode}`}
                />
                <span className="flex min-w-0 flex-1 flex-wrap justify-between gap-2 text-sm">
                  <span>
                    <span className="block font-medium">{parcel.bookingCode}</span>
                    <span className="text-xs text-muted-foreground">{parcel.trackingCode}</span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatCreditMoney(parcel.outstandingAmountPsw)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div
        role="status"
        className="flex flex-wrap justify-between gap-2 rounded-md bg-muted p-3 text-sm"
      >
        <span>{model.selectedIds.length} selected</span>
        <strong className="tabular-nums">Total: {formatCreditMoney(model.totalPsw)}</strong>
      </div>
      <fieldset
        disabled={model.isLoading || model.isFetching || model.isError}
        className="grid gap-4 sm:grid-cols-2"
      >
        <div className="space-y-2">
          <Label htmlFor="credit-settlement-amount">Amount paid (GHS)</Label>
          <Input
            id="credit-settlement-amount"
            inputMode="decimal"
            placeholder="0.00"
            value={model.amount}
            onChange={(e) => model.setAmount(e.target.value)}
            aria-describedby="credit-settlement-amount-help"
          />
          <p id="credit-settlement-amount-help" className="text-xs text-muted-foreground">
            {model.amount && !model.exactAmount
              ? 'Amount must match the selected total exactly.'
              : 'No partial payment or excess amount is accepted.'}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="credit-settlement-reference">Reference (optional)</Label>
          <Input
            id="credit-settlement-reference"
            maxLength={255}
            value={model.reference}
            onChange={(e) => model.setReference(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="credit-settlement-notes">Notes (optional)</Label>
          <Input
            id="credit-settlement-notes"
            maxLength={1000}
            value={model.notes}
            onChange={(e) => model.setNotes(e.target.value)}
          />
        </div>
      </fieldset>
      <Button type="button" disabled={!model.canSubmit} onClick={() => void model.submit()}>
        {model.isLoading ? 'Recording payment…' : 'Pay selected parcels'}
      </Button>
    </section>
  );
}
