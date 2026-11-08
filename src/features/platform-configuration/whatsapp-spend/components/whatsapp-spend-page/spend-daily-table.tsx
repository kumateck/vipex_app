import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SpendByDay } from '../../types';
import { formatMoney } from '../../utils';

export const SpendDailyTable = memo(function SpendDailyTable({
  rows,
  currency,
}: {
  rows: SpendByDay[];
  currency: string;
}) {
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>By day</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Delivered</TableHead>
              <TableHead className="text-right">Failed</TableHead>
              <TableHead className="text-right">Billable</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.day}>
                <TableCell>{row.day}</TableCell>
                <TableCell className="text-right">{row.messages.toLocaleString()}</TableCell>
                <TableCell className="text-right">{row.delivered.toLocaleString()}</TableCell>
                <TableCell className="text-right">{row.failed.toLocaleString()}</TableCell>
                <TableCell className="text-right">{row.billable.toLocaleString()}</TableCell>
                <TableCell className="text-right">{formatMoney(row.amount, currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
});
