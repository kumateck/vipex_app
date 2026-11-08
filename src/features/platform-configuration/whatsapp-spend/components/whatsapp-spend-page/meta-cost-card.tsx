import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MetaSpend } from '../../types';
import { formatMoney } from '../../utils';

/** Platform managers only: what Meta charged and the margin. Hidden when printing. */
export const MetaCostCard = memo(function MetaCostCard({
  metaCost,
  margin,
  amountDue,
  freeMessages,
  currency,
}: {
  metaCost: MetaSpend;
  margin: number | null;
  amountDue: number;
  freeMessages: number;
  currency: string;
}) {
  return (
    <Card className="border-dashed print:hidden">
      <CardHeader>
        <CardTitle>Meta cost (only visible to you)</CardTitle>
        <CardDescription>
          What Meta charged the WhatsApp Business Account, read from Meta. It can lag a few hours,
          and includes test messages that are not on the client bill.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {metaCost.available ? (
          <>
            <div className="grid gap-2 sm:grid-cols-3">
              <p>
                Meta cost: <strong>{formatMoney(metaCost.total, metaCost.currency ?? '')}</strong>
              </p>
              <p>
                Amount due: <strong>{formatMoney(amountDue, currency)}</strong>
              </p>
              <p>
                Margin:{' '}
                <strong>
                  {margin === null ? 'n/a (different currencies)' : formatMoney(margin, currency)}
                </strong>
              </p>
            </div>
            {freeMessages > 0 ? (
              <p>
                {freeMessages.toLocaleString()} delivered messages were free from Meta and are still
                on the client bill (all margin).
              </p>
            ) : null}
            {metaCost.byCategory.map((item) => (
              <p key={item.category} className="text-muted-foreground">
                {item.category}: {item.volume.toLocaleString()} messages ·{' '}
                {formatMoney(item.cost, metaCost.currency ?? '')}
              </p>
            ))}
          </>
        ) : (
          <p className="text-destructive">Meta cost unavailable: {metaCost.error}</p>
        )}
      </CardContent>
    </Card>
  );
});
