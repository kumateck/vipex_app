import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SpendCounts } from '../../types';
import { formatMoney } from '../../utils';

function StatCard({ title, value, note }: { title: string; value: string; note?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
      </CardContent>
    </Card>
  );
}

export const SpendSummaryCards = memo(function SpendSummaryCards({
  totals,
  currency,
}: {
  totals: SpendCounts;
  currency: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Messages sent" value={totals.messages.toLocaleString()} />
      <StatCard
        title="Delivered"
        value={totals.delivered.toLocaleString()}
        note={
          totals.failed > 0 ? `${totals.failed.toLocaleString()} failed (not billed)` : undefined
        }
      />
      <StatCard title="Billable messages" value={totals.billable.toLocaleString()} />
      <StatCard
        title="Amount due"
        value={formatMoney(totals.amount, currency)}
        note={
          totals.unconfirmed > 0
            ? `${totals.unconfirmed.toLocaleString()} awaiting delivery confirmation (not billed)`
            : undefined
        }
      />
    </div>
  );
});
