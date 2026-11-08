import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PricePeriod } from '../../types';
import { formatRate } from '../../utils';

/** Price periods, newest first; each applies until the next one starts. */
export const PriceHistoryList = memo(function PriceHistoryList({
  history,
  currency,
  onDelete,
  disabled,
}: {
  history: PricePeriod[];
  currency: string;
  onDelete: (period: PricePeriod) => void;
  disabled?: boolean;
}) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">No prices yet.</p>;
  }
  const newestFirst = history.toReversed();
  return (
    <ul className="divide-y rounded-md border text-sm">
      {newestFirst.map((period, index) => {
        const nextStart = index > 0 ? newestFirst[index - 1]?.effectiveFrom : null;
        return (
          <li key={period.id} className="flex items-center justify-between gap-2 p-2">
            <div>
              <p className="font-medium">
                From {period.effectiveFrom}
                {nextStart ? ` until the day before ${nextStart}` : ' onwards'}
              </p>
              <p className="text-muted-foreground">
                Pickup code {formatRate(period.authentication, currency)} · Receipt{' '}
                {formatRate(period.utility, currency)}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Delete price from ${period.effectiveFrom}`}
              onClick={() => onDelete(period)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
});
