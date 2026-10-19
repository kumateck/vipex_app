import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ReturnedRiderParcelsActionsCell } from './returned-rider-parcels-actions-cell';
import { ReturnedRiderParcelsBulkBar } from './returned-rider-parcels-bulk-bar';
import {
  ReturnedRiderParcelCell,
  ReturnedRiderPaymentCell,
  ReturnedRiderRecipientCell,
} from './returned-rider-parcels-group-cells';

export function ReturnedRiderParcelsTable(props: ReturnedRiderParcelsTableProps) {
  const selectedSet = useMemo(() => new Set(props.selectedParcelIds), [props.selectedParcelIds]);
  const pageIds = useMemo(() => props.rows.map((row) => row.id), [props.rows]);
  const selectedOnPage = pageIds.filter((id) => selectedSet.has(id)).length;
  const allSelected = pageIds.length > 0 && selectedOnPage === pageIds.length;
  const rowsLocked = props.busyParcelId !== null || props.isBulkRedispatching;

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
      <ReturnedRiderParcelsBulkBar
        count={selectedOnPage}
        riderUserId={props.riderUserId}
        isBusy={props.isBulkRedispatching}
        onBulkRedispatch={props.onBulkRedispatch}
        onClear={props.onClearSelection}
      />
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all parcels on this page"
                  checked={allSelected ? true : selectedOnPage > 0 ? 'indeterminate' : false}
                  disabled={pageIds.length === 0 || rowsLocked}
                  onCheckedChange={(checked) => props.onPageSelectionChange(checked === true)}
                />
              </TableHead>
              <TableHead>Parcel</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Previous Assigned Rider</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="align-top">
                  <Checkbox
                    aria-label={`Select ${row.bookingCode}`}
                    checked={selectedSet.has(row.id)}
                    disabled={rowsLocked}
                    onCheckedChange={(checked) =>
                      props.onToggleParcelSelected(row.id, checked === true)
                    }
                  />
                </TableCell>
                <TableCell className="align-top">
                  <ReturnedRiderParcelCell row={row} />
                </TableCell>
                <TableCell className="align-top">
                  <ReturnedRiderRecipientCell row={row} />
                </TableCell>
                <TableCell className="align-top">
                  <ReturnedRiderPaymentCell row={row} />
                </TableCell>
                <TableCell className="align-top">{row.riderName ?? '—'}</TableCell>
                <TableCell className="align-top">
                  <ReturnedRiderParcelsActionsCell
                    row={row}
                    riderUserId={props.riderUserId}
                    isBusy={rowsLocked}
                    onReprocess={props.onReprocess}
                  />
                </TableCell>
              </TableRow>
            ))}
            {props.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
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
