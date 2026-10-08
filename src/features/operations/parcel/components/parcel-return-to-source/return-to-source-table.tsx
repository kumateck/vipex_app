import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { ParcelStorageFeeBadge } from '../parcel-storage-fee-badge';

type Props = {
  rows: ParcelSearchRow[];
  loading: boolean;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  page: number;
  totalRecords: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  canCreateShipment: boolean;
  canManageReconciliation: boolean;
  onViewDetails: (id: string) => void;
  onStartShipment: () => void;
  onManageReconciliation: (bookingCode: string) => void;
};

export function ReturnToSourceTable(props: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Returns to Source</CardTitle>
        <CardDescription>
          Parcels marked for return to this branch. Review the original parcel, manage its
          reconciliation, or create a separate shipment. Return status does not confirm physical
          receipt at this branch.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex max-w-md gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            props.onSearch();
          }}
        >
          <Input
            aria-label="Search returned parcels"
            placeholder="Booking, tracking, sender, or receiver"
            value={props.searchInput}
            onChange={(event) => props.onSearchInputChange(event.target.value)}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking / Tracking</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Parcel</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.loading ? (
                <TableRow>
                  <TableCell colSpan={4}>Loading returns...</TableCell>
                </TableRow>
              ) : props.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>No returned parcels found.</TableCell>
                </TableRow>
              ) : (
                props.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.bookingCode}</div>
                      <div className="text-xs text-muted-foreground">{row.trackingCode}</div>
                      <ParcelStorageFeeBadge storageChargePsw={row.storageChargePsw} />
                    </TableCell>
                    <TableCell>
                      {row.destinationName ?? '-'} → {row.sourceName ?? '-'}
                    </TableCell>
                    <TableCell>{row.parcelDetails || row.parcelContent || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => props.onViewDetails(row.id)}
                        >
                          Review Details
                        </Button>
                        {props.canManageReconciliation ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => props.onManageReconciliation(row.bookingCode)}
                          >
                            Manage Reconciliation
                          </Button>
                        ) : null}
                        {props.canCreateShipment ? (
                          <Button size="sm" onClick={props.onStartShipment}>
                            New Shipment
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            {props.totalRecords} returned parcel{props.totalRecords === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={props.page <= 1 || props.loading}
              onClick={() => props.onPageChange(props.page - 1)}
            >
              Previous
            </Button>
            <span>Page {props.page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!props.hasNextPage || props.loading}
              onClick={() => props.onPageChange(props.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
