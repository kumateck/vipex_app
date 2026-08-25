import { useMemo } from 'react';
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
import type { DailyCashierSalesDisplayTransaction } from './daily-cashier-sales-types';
import {
  formatDateTime,
  formatMoneyPsw,
  groupDeliveryCashierTransactions,
} from './daily-cashier-sales-utils';

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
  const transactions = useMemo(
    () => groupDeliveryCashierTransactions(report?.transactions ?? []),
    [report?.transactions],
  );

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
              <TableHead>#</TableHead>
              <TableHead>Payment Time</TableHead>
              <TableHead>Booking</TableHead>
              <TableHead>Parcel</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Who Paid</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderRows({ transactions, isFetching, isUninitialized })}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function renderRows({
  transactions,
  isFetching,
  isUninitialized,
}: Omit<DailyCashierSalesTransactionsTableProps, 'report'> & {
  transactions: DailyCashierSalesDisplayTransaction[];
}) {
  if (isFetching) {
    return <EmptyRow>Loading...</EmptyRow>;
  }

  if (isUninitialized) {
    return <EmptyRow>Select filters and click Load report.</EmptyRow>;
  }

  if (transactions.length === 0) {
    return <EmptyRow>No sales found for the selected filters.</EmptyRow>;
  }

  return transactions.map((row, index) => (
    <TableRow key={row.paymentIds.join(':')}>
      <TableCell>{index + 1}</TableCell>
      <TableCell>{formatDateTime(row.receivedAt)}</TableCell>
      <TableCell>{row.bookingCode}</TableCell>
      <TableCell>
        <p className="font-medium">{row.parcelDetails || '-'}</p>
        <p className="text-muted-foreground text-xs">{row.parcelContent || '-'}</p>
      </TableCell>
      <TableCell>
        <p className="font-medium">{row.payerName}</p>
        <p className="text-muted-foreground text-xs">{row.payerTelephone || '-'}</p>
      </TableCell>
      <TableCell>{row.whoPaid}</TableCell>
      <TableCell>{PAYMENT_METHOD_LABELS[row.method] ?? String(row.method)}</TableCell>
      <TableCell className="text-right">
        <AmountPaidCell transaction={row} />
      </TableCell>
    </TableRow>
  ));
}

function AmountPaidCell({ transaction }: { transaction: DailyCashierSalesDisplayTransaction }) {
  return (
    <div className="space-y-1">
      <p className="font-semibold">{formatMoneyPsw(transaction.grossAmountPsw)}</p>
      {transaction.isDeliveryCashierGroup ? (
        <div className="text-muted-foreground text-xs leading-4">
          <p>To Be Paid: {formatMoneyPsw(transaction.toBePaidAmountPsw)}</p>
          <p>Delivery Fee: {formatMoneyPsw(transaction.deliveryFeeAmountPsw)}</p>
        </div>
      ) : null}
    </div>
  );
}

function EmptyRow({ children }: { children: string }) {
  return (
    <TableRow>
      <TableCell colSpan={8} className="text-center text-muted-foreground">
        {children}
      </TableCell>
    </TableRow>
  );
}
