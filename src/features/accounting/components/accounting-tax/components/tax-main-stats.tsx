import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '../../accounting-shared';
import type { AccountingTaxViewData } from '../types/accounting-tax-view-data';

export function TaxMainStats({
  readyCount,
  taxItems,
  totalTaxPsw,
}: Pick<AccountingTaxViewData, 'readyCount' | 'taxItems' | 'totalTaxPsw'>) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Tax Items in View</CardDescription>
          <CardTitle>{taxItems.length}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Total Tax</CardDescription>
          <CardTitle>{formatMoney(totalTaxPsw)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Ready for Filing</CardDescription>
          <CardTitle>{readyCount}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
