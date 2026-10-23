import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { parcelStatusLabel } from '@/shared/shipments/parcel-status-labels';
import { useParcelAnalyticsDetails } from '../../hooks';
import type { ParcelAnalyticsQuery } from '../../types';
import { formatMoney } from '../../utils';

export function ParcelAnalyticsDetails({
  query,
  onClose,
}: {
  query: ParcelAnalyticsQuery;
  onClose: () => void;
}) {
  const result = useParcelAnalyticsDetails(query);
  return (
    <section className="space-y-3 rounded-md border bg-card p-4" aria-label="Matching parcels">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Matching parcels</h2>
          <p className="text-sm text-muted-foreground">
            {query.status === undefined ? 'All statuses' : parcelStatusLabel(query.status)} ·{' '}
            {query.from} to {query.to}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close parcel list
        </Button>
      </div>
      {result.isError ? (
        <div role="alert">
          <p>Could not load matching parcels.</p>
          <Button variant="outline" onClick={() => void result.refetch()}>
            Retry parcel list
          </Button>
        </div>
      ) : result.isFetching ? (
        <p role="status">Loading matching parcels…</p>
      ) : (
        <Table className="parcel-analytics-table">
          <caption className="sr-only">Matching parcels, page {result.page}</caption>
          <TableHeader>
            <TableRow>
              {[
                'Booking',
                'Tracking',
                'Status',
                'Origin',
                'Destination',
                'Booked on',
                'Charges',
                'Receiver outstanding',
              ].map((label) => (
                <TableHead key={label} className="whitespace-nowrap">
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data?.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.bookingCode}</TableCell>
                <TableCell>{row.trackingCode}</TableCell>
                <TableCell>{parcelStatusLabel(row.status)}</TableCell>
                <TableCell>{row.sourceBranchName}</TableCell>
                <TableCell>{row.destinationBranchName}</TableCell>
                <TableCell>{row.createdAt.slice(0, 10)}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatMoney(row.chargePsw)}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatMoney(row.receiverOutstandingPsw)}
                </TableCell>
              </TableRow>
            ))}
            {!result.data?.rows.length ? (
              <TableRow>
                <TableCell colSpan={8}>No matching parcels.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      )}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          disabled={result.page === 1 || result.isFetching}
          onClick={() => result.setPage((page) => page - 1)}
        >
          Previous
        </Button>
        <span className="text-sm">Page {result.page}</span>
        <Button
          variant="outline"
          disabled={!result.data?.hasMore || result.isFetching || result.isError}
          onClick={() => result.setPage((page) => page + 1)}
        >
          Next
        </Button>
      </div>
    </section>
  );
}
