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
import { PAYMENT_METHOD_LABELS } from './daily-cashier-sales-constants';
import { formatDateTime, formatMoneyPsw } from './daily-cashier-sales-utils';

type DailyCashierSalesTransactionsTableProps = {
  report?: DailyCashierSalesReport;
  isFetching: boolean;
  isUninitialized: boolean;
};

export function DailyCashierSalesTransactionsTable({
  report,
  isFetching,
  isUninitialized,
}: DailyCashierSalesTransactionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>Ordered by payment timestamp.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment Time</TableHead>
              <TableHead>Booking</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Who Paid</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderRows({ report, isFetching, isUninitialized })}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function renderRows({
  report,
  isFetching,
  isUninitialized,
}: DailyCashierSalesTransactionsTableProps) {
  if (isFetching) {
    return <EmptyRow>Loading...</EmptyRow>;
  }

  if (isUninitialized) {
    return <EmptyRow>Select filters and click Load report.</EmptyRow>;
  }

  if ((report?.transactions.length ?? 0) === 0) {
    return <EmptyRow>No sales found for the selected filters.</EmptyRow>;
  }

  return report?.transactions.map((row) => (
    <TableRow key={row.paymentId}>
      <TableCell>{formatDateTime(row.receivedAt)}</TableCell>
      <TableCell>{row.bookingCode}</TableCell>
      <TableCell>{row.payerName}</TableCell>
      <TableCell>{row.whoPaid}</TableCell>
      <TableCell>{PAYMENT_METHOD_LABELS[row.method] ?? String(row.method)}</TableCell>
      <TableCell className="text-right">{formatMoneyPsw(row.grossAmountPsw)}</TableCell>
    </TableRow>
  ));
}

function EmptyRow({ children }: { children: string }) {
  return (
    <TableRow>
      <TableCell colSpan={6} className="text-center text-muted-foreground">
        {children}
      </TableCell>
    </TableRow>
  );
}
