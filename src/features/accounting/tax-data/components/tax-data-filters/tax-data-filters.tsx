import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { useTaxData } from '../../hooks';
import { TaxDataRouteFields } from './tax-data-route-fields';

export function TaxDataFilters({
  data,
  disabled,
}: {
  data: ReturnType<typeof useTaxData>;
  disabled: boolean;
}) {
  const d = data.draft;
  return (
    <div className="space-y-5">
      <TaxDataRouteFields data={data} />
      {data.optionsError ? (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">
          <p>Could not load route options. Check accounting access and try again.</p>
          <Button variant="outline" onClick={() => void data.retryOptions()}>
            Retry route options
          </Button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          disabled={!data.canLoad || data.busy || disabled}
          onClick={() => data.apply('counts')}
        >
          Count
        </Button>
        <p className="text-sm text-muted-foreground">
          Lists every paid amount and its number of occurrences.
        </p>
      </div>
      <div className="grid items-start gap-4 border-t pt-5 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="tax-data-amount">Amount paid (GHS)</Label>
          <Input
            id="tax-data-amount"
            inputMode="decimal"
            placeholder="Select a count or enter an amount"
            value={d.amount}
            onChange={(event) => d.setAmount(event.target.value)}
            aria-invalid={d.amountInvalid}
            aria-describedby="tax-data-amount-help"
          />
          <p
            id="tax-data-amount-help"
            className={
              d.amountInvalid ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'
            }
          >
            {d.amountInvalid
              ? 'Enter a positive amount with up to two decimal places.'
              : 'Get data matches this exact principal-paid amount.'}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax-data-max">Maximum occurrences</Label>
          <Input
            id="tax-data-max"
            inputMode="numeric"
            value={d.maxOccurrences}
            onChange={(event) => d.setMaxOccurrences(event.target.value)}
            aria-invalid={d.maxInvalid}
            aria-describedby="tax-data-max-help"
          />
          <p
            id="tax-data-max-help"
            className={d.maxInvalid ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}
          >
            {d.maxInvalid
              ? 'Enter a whole number from 1 to 500.'
              : 'Retrieve up to this many matching parcels in total (1–500).'}
          </p>
        </div>
        <Button
          className="xl:mt-6"
          disabled={!data.canGetData || data.busy || disabled}
          onClick={() => data.apply('records')}
        >
          Get data
        </Button>
      </div>
    </div>
  );
}
