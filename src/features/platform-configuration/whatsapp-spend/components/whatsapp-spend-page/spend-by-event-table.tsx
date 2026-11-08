import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SpendByEvent, SpendCounts } from '../../types';
import { formatMoney, formatRate } from '../../utils';

export const SpendByEventTable = memo(function SpendByEventTable({
  rows,
  totals,
  currency,
}: {
  rows: SpendByEvent[];
  totals: SpendCounts;
  currency: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>By message type</CardTitle>
        <CardDescription>Billable messages × price per message = amount.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Message type</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Delivered</TableHead>
              <TableHead className="text-right">Failed</TableHead>
              <TableHead className="text-right">Billable</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No WhatsApp messages in this period.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.eventCode}>
                  <TableCell>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.category}</p>
                  </TableCell>
                  <TableCell className="text-right">{row.messages.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{row.delivered.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{row.failed.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{row.billable.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {formatRate(row.rate, currency)}
                    {row.rateVaries ? (
                      <p className="text-xs text-muted-foreground">price changed in period</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(row.amount, currency)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="text-right">{totals.messages.toLocaleString()}</TableCell>
              <TableCell className="text-right">{totals.delivered.toLocaleString()}</TableCell>
              <TableCell className="text-right">{totals.failed.toLocaleString()}</TableCell>
              <TableCell className="text-right">{totals.billable.toLocaleString()}</TableCell>
              <TableCell />
              <TableCell className="text-right font-semibold">
                {formatMoney(totals.amount, currency)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
});
