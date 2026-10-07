import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ReturnedRiderParcelsTableProps } from '../../types';
import { formatRiderReturnDate } from '../../utils';

export function ReturnedRiderParcelsTable(props: ReturnedRiderParcelsTableProps) {
  return (
    <div className="space-y-4">
      <form
        className="flex max-w-xl gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          props.onSearch();
        }}
      >
        <Input
          aria-label="Search rider returns"
          placeholder="Search tracking, booking, sender or receiver"
          value={props.searchInput}
          onChange={(event) => props.onSearchInputChange(event.target.value)}
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      <div className="flex items-center gap-2">
        <span className="text-sm">Rider for redispatch</span>
        <Select value={props.riderUserId} onValueChange={props.onRiderChange}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select rider" />
          </SelectTrigger>
          <SelectContent>
            {props.riders.map((rider) => (
              <SelectItem key={rider.id} value={rider.id}>
                {rider.fullname}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking</TableHead>
              <TableHead>Booking</TableHead>
              <TableHead>Parcel</TableHead>
              <TableHead>Receiver</TableHead>
              <TableHead>Delivery address</TableHead>
              <TableHead>Rider</TableHead>
              <TableHead>Returned</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reprocess</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.trackingCode}</TableCell>
                <TableCell>{row.bookingCode}</TableCell>
                <TableCell>{row.parcelDetails}</TableCell>
                <TableCell>
                  {row.receiverName ?? '—'}
                  {row.receiverPhone ? ` (${row.receiverPhone})` : ''}
                </TableCell>
                <TableCell>{row.dropoffAddress ?? '—'}</TableCell>
                <TableCell>{row.riderName ?? '—'}</TableCell>
                <TableCell>{formatRiderReturnDate(row.riderReturnedAt)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">Returned by Rider</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={props.busyParcelId !== null}
                    onClick={() => props.onReprocess(row, 'pickup')}
                  >
                    Move to Pickup
                  </Button>
                  <Button
                    size="sm"
                    disabled={props.busyParcelId !== null || !props.riderUserId}
                    onClick={() => props.onReprocess(row, 'redispatch')}
                  >
                    Redispatch
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {props.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  {props.hasError
                    ? 'Could not load rider returns.'
                    : props.isFetching
                      ? 'Loading rider returns...'
                      : 'No rider-returned parcels found.'}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={props.page <= 1 || props.isFetching}
          onClick={() => props.onPageChange(props.page - 1)}
        >
          Previous
        </Button>
        <span className="text-sm">Page {props.page}</span>
        <Button
          size="sm"
          variant="outline"
          disabled={!props.hasNextPage || props.isFetching}
          onClick={() => props.onPageChange(props.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
