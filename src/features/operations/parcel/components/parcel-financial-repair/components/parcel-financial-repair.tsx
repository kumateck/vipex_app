import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useParcelFinancialRepair } from '../hooks/use-parcel-financial-repair';

function money(amountPsw: number) {
  return `GHS ${(amountPsw / 100).toFixed(2)}`;
}

export function ParcelFinancialRepair() {
  const state = useParcelFinancialRepair();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Parcel Financial Repair</CardTitle>
        <CardDescription>
          Review and repair a parcel’s To Be Paid amount using its charge and active principal
          payments. Each repair is recorded in the audit log.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form className="flex gap-2" onSubmit={state.findParcel}>
          <Input
            aria-label="Booking or tracking code"
            placeholder="Booking code or tracking code"
            value={state.searchInput}
            onChange={(event) => state.setSearchInput(event.target.value)}
            minLength={3}
            required
          />
          <Button type="submit" disabled={state.isLoading}>
            {state.isLoading ? 'Searching…' : 'Review'}
          </Button>
        </form>
        {state.preview ? (
          <section className="space-y-4 rounded-md border p-4" aria-label="Repair preview">
            <div>
              <h2 className="font-semibold">{state.preview.bookingCode}</h2>
              <p className="text-sm text-muted-foreground">{state.preview.trackingCode}</p>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Parcel charge</dt>
                <dd>{money(state.preview.chargePsw)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Active principal paid</dt>
                <dd>{money(state.preview.activePrincipalPaidPsw)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Current To Be Paid</dt>
                <dd>{money(state.preview.currentToBePaidPsw)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Calculated To Be Paid</dt>
                <dd className="font-semibold">{money(state.preview.expectedToBePaidPsw)}</dd>
              </div>
            </dl>
            {state.preview.restriction ? (
              <div
                role="alert"
                className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
              >
                <strong>Repair unavailable</strong>
                <p>{state.preview.restriction}</p>
              </div>
            ) : state.preview.needsRepair ? (
              <>
                <Textarea
                  aria-label="Repair reason"
                  placeholder="Reason for repair (at least 5 characters)"
                  value={state.reason}
                  maxLength={500}
                  onChange={(event) => state.setReason(event.target.value)}
                />
                <Button
                  onClick={state.applyRepair}
                  disabled={state.isSaving || state.reason.trim().length < 5}
                >
                  {state.isSaving ? 'Repairing…' : 'Apply repair'}
                </Button>
              </>
            ) : (
              <div role="status" className="rounded-md border p-3 text-sm">
                <strong>No repair needed</strong>
                <p>The recorded amount matches active principal payments.</p>
              </div>
            )}
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
