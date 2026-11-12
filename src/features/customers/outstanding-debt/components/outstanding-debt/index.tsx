import { Printer, RefreshCw } from 'lucide-react';
import type { Customer } from '@/features/customers/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTimeTZ } from '@/lib/dates';
import { useOutstandingDebt } from '../../hooks';
import { debtSummaryLines } from '../../utils';
import { DebtParcelsTable } from './debt-parcels-table';
import { DebtStatementPrint } from './debt-statement-print';

export function OutstandingDebtTab({
  customer,
  onViewParcel,
}: {
  customer: Customer;
  onViewParcel: (parcelId: string) => void;
}) {
  const debt = useOutstandingDebt(customer.id);
  const statement = debt.isError ? undefined : debt.currentData;

  return (
    <Card className="flex h-full flex-col" aria-busy={debt.isFetching}>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Outstanding Debt</CardTitle>
          {statement ? (
            <p className="text-sm text-muted-foreground">
              Balance as of {formatDateTimeTZ(statement.generatedAt)} GMT
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={debt.isFetching || debt.printing}
            onClick={() => void debt.refetch()}
          >
            <RefreshCw className="size-4" />
            {debt.isError ? 'Retry' : 'Refresh'}
          </Button>
          <Button disabled={!debt.canPrint} onClick={() => void debt.printStatement()}>
            <Printer className="size-4" />
            {debt.printing ? 'Printing…' : 'Print statement'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-4 overflow-auto">
        {debt.isError ? (
          <p role="alert" className="text-sm text-destructive">
            Could not load outstanding debt.
          </p>
        ) : null}
        {!statement && debt.isFetching ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading outstanding debt…
          </p>
        ) : null}
        {statement ? (
          <>
            <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {debtSummaryLines(statement.summary).map(({ label, value }) => (
                <div key={label} className="rounded-md border p-3">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="overflow-x-auto">
              <DebtParcelsTable parcels={statement.parcels} onViewParcel={onViewParcel} />
            </div>
            <DebtStatementPrint
              printRef={debt.printRef}
              companyName={debt.companyName}
              customer={customer}
              statement={statement}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
