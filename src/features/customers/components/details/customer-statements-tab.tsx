import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CustomerStatement } from '@/features/customers/api';
import { formatMoney } from './customer-details.utils';

type StatementRowWithRunningBalance = CustomerStatement['rows'][number] & {
  runningBalancePsw: number;
};

type CustomerStatementsTabProps = {
  isFetchingStatement: boolean;
  statement: CustomerStatement | undefined;
  statementRowsWithRunningBalance: StatementRowWithRunningBalance[];
};

export function CustomerStatementsTab({
  isFetchingStatement,
  statement,
  statementRowsWithRunningBalance,
}: CustomerStatementsTabProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Statements</CardTitle>
        <CardDescription>Unified customer statement ledger.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {isFetchingStatement ? (
          <p className="text-xs text-muted-foreground">Loading statement...</p>
        ) : null}

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border p-2 text-xs">
            <p className="text-muted-foreground">Sent parcels</p>
            <p className="font-medium">{statement?.summary.sentParcels ?? 0}</p>
          </div>
          <div className="rounded-md border p-2 text-xs">
            <p className="text-muted-foreground">Received parcels</p>
            <p className="font-medium">{statement?.summary.receivedParcels ?? 0}</p>
          </div>
          <div className="rounded-md border p-2 text-xs">
            <p className="text-muted-foreground">Payments by customer</p>
            <p className="font-medium">
              {formatMoney(statement?.summary.paymentsMadeByCustomerPsw ?? 0)}
            </p>
          </div>
          <div className="rounded-md border p-2 text-xs">
            <p className="text-muted-foreground">Closing credit balance</p>
            <p className="font-medium">
              {formatMoney(statement?.summary.closingCreditBalancePsw ?? 0)}
            </p>
          </div>
        </div>

        <div className="max-h-80 space-y-1 overflow-auto pr-1">
          {statementRowsWithRunningBalance.map((row) => (
            <div key={row.id} className="rounded-md border p-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{row.entryType.replaceAll('_', ' ')}</p>
                <p className="font-medium">
                  {row.amountPsw != null ? formatMoney(row.amountPsw) : '-'}
                </p>
              </div>
              <p className="text-muted-foreground">{new Date(row.timestamp).toLocaleString()}</p>
              <p className="text-muted-foreground">
                Running balance: {formatMoney(row.runningBalancePsw)}
              </p>
              <p className="text-muted-foreground">{row.notes}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
