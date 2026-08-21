import type { DailyCashierSalesReport } from '@/features/reporting/api/reporting.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime, formatMoneyPsw } from './daily-cashier-sales-utils';

type DailyCashierSalesToBePaidTableProps = {
  report?: DailyCashierSalesReport;
  isFetching: boolean;
  isUninitialized: boolean;
};

export function DailyCashierSalesToBePaidTable({
  report,
  isFetching,
  isUninitialized,
}: DailyCashierSalesToBePaidTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>To Be Paid</CardTitle>
        <CardDescription>Outstanding amounts created in the sending session.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Created Time</TableHead>
              <TableHead>Booking</TableHead>
              <TableHead>Parcel</TableHead>
              <TableHead>Sender</TableHead>
              <TableHead>Receiver</TableHead>
              <TableHead className="text-right">To Be Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderRows({ report, isFetching, isUninitialized })}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function renderRows({ report, isFetching, isUninitialized }: DailyCashierSalesToBePaidTableProps) {
  if (isFetching) return <EmptyRow>Loading...</EmptyRow>;
  if (isUninitialized) return <EmptyRow>Select filters and click Load report.</EmptyRow>;
  if ((report?.toBePaidRows.length ?? 0) === 0) {
    return <EmptyRow>No to-be-paid parcels found for the selected session filters.</EmptyRow>;
  }

  return report?.toBePaidRows.map((row, index) => (
    <TableRow key={row.parcelId}>
      <TableCell>{index + 1}</TableCell>
      <TableCell>{formatDateTime(row.createdAt)}</TableCell>
      <TableCell>{row.bookingCode}</TableCell>
      <TableCell>
        <p className="font-medium">{row.parcelDetails || '-'}</p>
        <p className="text-muted-foreground text-xs">{row.parcelContent || '-'}</p>
      </TableCell>
      <TableCell>
        <p className="font-medium">{row.senderName ?? '-'}</p>
        <p className="text-muted-foreground text-xs">{row.senderTelephone || '-'}</p>
      </TableCell>
      <TableCell>
        <p className="font-medium">{row.receiverName ?? '-'}</p>
        <p className="text-muted-foreground text-xs">{row.receiverTelephone || '-'}</p>
      </TableCell>
      <TableCell className="text-right">{formatMoneyPsw(row.plannedToBePaidPsw)}</TableCell>
    </TableRow>
  ));
}

function EmptyRow({ children }: { children: string }) {
  return (
    <TableRow>
      <TableCell colSpan={7} className="text-center text-muted-foreground">
        {children}
      </TableCell>
    </TableRow>
  );
}
