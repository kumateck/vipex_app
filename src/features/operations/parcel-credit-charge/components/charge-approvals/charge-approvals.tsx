import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useChargeApprovals } from '../../hooks';
import { ChargeApprovalDialog } from '../../dialogs';

export function ChargeApprovalsPage() {
  const model = useChargeApprovals();
  return (
    <ScrollableWrapper>
      <div className="mx-auto w-full max-w-5xl space-y-5 p-4">
        <header>
          <h1 className="text-xl font-semibold">Parcel Charge Approvals</h1>
          <p className="text-sm text-muted-foreground">
            Review corrections from zero charge to CREDIT. Approval updates the parcel and sender’s
            credit balance.
          </p>
        </header>
        <Input
          aria-label="Search charge requests"
          maxLength={80}
          placeholder="Search booking or tracking code"
          value={model.searchInput}
          onChange={(event) => model.setSearchInput(event.target.value)}
        />
        {model.query.isFetching ? <p role="status">Loading charge requests…</p> : null}
        {model.query.isError ? (
          <div role="alert">
            <p>Charge requests could not load.</p>
            <Button variant="outline" onClick={() => void model.query.refetch()}>
              Retry
            </Button>
          </div>
        ) : null}
        {!model.query.isFetching &&
        !model.query.isError &&
        !model.query.currentData?.data.length ? (
          <p>No charge correction requests found.</p>
        ) : null}
        <div className="space-y-3">
          {model.query.currentData?.data.map((row) => (
            <article key={row.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>{row.bookingCode}</strong>
                <Badge variant={row.status === 2 ? 'destructive' : 'outline'}>
                  {row.status === 0
                    ? 'Pending approval'
                    : row.status === 1
                      ? 'Approved · CREDIT'
                      : 'Rejected'}
                </Badge>
              </div>
              <p className="text-sm">
                {row.customerName} ·{' '}
                <strong className="tabular-nums">
                  GHS 0.00 → GHS {(row.chargePsw / 100).toFixed(2)}
                </strong>{' '}
                · {row.originalMethod === 4 ? 'CREDIT' : 'CASH'} → CREDIT
              </p>
              <p className="whitespace-pre-wrap break-words text-sm">{row.reason}</p>
              <p className="text-xs text-muted-foreground">
                Requested by {row.requestedByName} ·{' '}
                {row.requestedAt.replace('T', ' ').slice(0, 16)}
              </p>
              {row.reviewedByName ? (
                <p className="text-xs">
                  Reviewed by {row.reviewedByName}
                  {row.reviewedAt ? ` · ${row.reviewedAt.replace('T', ' ').slice(0, 16)}` : ''}
                  {row.reviewNote ? ` · ${row.reviewNote}` : ''}
                </p>
              ) : null}
              {row.status === 0 ? (
                row.requestedBy === model.userId ? (
                  <p className="text-xs text-muted-foreground">
                    Awaiting another authorized staff member’s approval.
                  </p>
                ) : (
                  <Button size="sm" disabled={model.busy} onClick={() => model.select(row)}>
                    Review correction
                  </Button>
                )
              ) : null}
            </article>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm">Page {model.page}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={model.page <= 1 || model.query.isFetching}
              onClick={() => model.setPage((page) => page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!model.query.currentData?.hasNextPage || model.query.isFetching}
              onClick={() => model.setPage((page) => page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
        <ChargeApprovalDialog model={model} />
      </div>
    </ScrollableWrapper>
  );
}
