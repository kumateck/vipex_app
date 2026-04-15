import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import type { CustomerCreditSummary, CustomerCreditTransaction } from '@/features/customers/api';
import { formatMoney } from './customer-details.utils';

type CustomerCreditsTabProps = {
  creditSummary: CustomerCreditSummary | undefined;
  creditTransactions: CustomerCreditTransaction[];
};

export function CustomerCreditsTab({ creditSummary, creditTransactions }: CustomerCreditsTabProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Credits</CardTitle>
        <CardDescription>Credit summary and ledger movements.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        <div className="grid gap-2 md:grid-cols-3">
          <div className="rounded-md border p-2 text-xs">
            <p className="text-muted-foreground">Current balance</p>
            <p className="font-medium">{formatMoney(creditSummary?.balancePsw ?? 0)}</p>
          </div>
          <div className="rounded-md border p-2 text-xs">
            <p className="text-muted-foreground">Credit limit</p>
            <p className="font-medium">{formatMoney(creditSummary?.creditLimitPsw ?? 0)}</p>
          </div>
          <div className="rounded-md border p-2 text-xs">
            <p className="text-muted-foreground">Available</p>
            <p className="font-medium">{formatMoney(creditSummary?.availableCreditPsw ?? 0)}</p>
          </div>
        </div>

        <div className="max-h-80 space-y-1 overflow-auto pr-1">
          {creditTransactions.map((row) => (
            <div key={row.id} className="rounded-md border p-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{row.signedAmountPsw >= 0 ? 'Charge' : 'Payment'}</p>
                <p className={row.signedAmountPsw >= 0 ? 'text-destructive' : 'text-green-600'}>
                  {row.signedAmountPsw >= 0 ? '+' : '-'}
                  {formatMoney(Math.abs(row.signedAmountPsw))}
                </p>
              </div>
              <p className="text-muted-foreground">{formatDateTimeShared(row.createdAt)}</p>
              {row.notes ? <p className="text-muted-foreground">{row.notes}</p> : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
