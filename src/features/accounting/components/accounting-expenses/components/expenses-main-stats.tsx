import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '../../accounting-shared';
import type { AccountingExpensesViewData } from '../types/accounting-expenses-view-data';

export function ExpensesMainStats({
  bankAccounts,
  pendingCount,
  totalRequestedPsw,
}: Pick<AccountingExpensesViewData, 'bankAccounts' | 'pendingCount' | 'totalRequestedPsw'>) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Total Requests</CardDescription>
          <CardTitle>{formatMoney(totalRequestedPsw)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Awaiting Action</CardDescription>
          <CardTitle>{pendingCount}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Company Bank Accounts</CardDescription>
          <CardTitle>{bankAccounts.length}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
