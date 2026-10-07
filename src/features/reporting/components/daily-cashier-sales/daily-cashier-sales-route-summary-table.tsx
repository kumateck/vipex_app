import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CashierSalesRouteSummary } from './daily-cashier-sales-route-summary';
import { formatMoneyPsw } from './daily-cashier-sales-utils';

export function DailyCashierSalesRouteSummaryTable({
  routes,
}: {
  routes: CashierSalesRouteSummary[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by Route</CardTitle>
        <CardDescription>
          Payments grouped by parcel source and destination. Cash and non-cash amounts are included
          in the total (non-cash includes credit); unpaid To Be Paid balances are excluded.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source → Destination</TableHead>
              <TableHead className="text-right">Payments</TableHead>
              <TableHead className="text-right">Sender</TableHead>
              <TableHead className="text-right">Receiver</TableHead>
              <TableHead className="text-right">Delivery</TableHead>
              <TableHead className="text-right">Cash</TableHead>
              <TableHead className="text-right">Non-cash</TableHead>
              <TableHead className="text-right font-semibold">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No collected payments for these filters.
                </TableCell>
              </TableRow>
            ) : (
              routes.map((route) => (
                <TableRow key={`${route.sourceBranchId}:${route.destinationBranchId}`}>
                  <TableCell className="font-medium">
                    {route.sourceBranchName} → {route.destinationBranchName}
                  </TableCell>
                  <TableCell className="text-right">{route.transactions}</TableCell>
                  <TableCell className="text-right">{formatMoneyPsw(route.senderPsw)}</TableCell>
                  <TableCell className="text-right">{formatMoneyPsw(route.receiverPsw)}</TableCell>
                  <TableCell className="text-right">{formatMoneyPsw(route.deliveryPsw)}</TableCell>
                  <TableCell className="text-right">{formatMoneyPsw(route.cashPsw)}</TableCell>
                  <TableCell className="text-right">{formatMoneyPsw(route.nonCashPsw)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoneyPsw(route.grossPsw)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
