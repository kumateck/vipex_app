import type { DateRange } from 'react-day-picker';
import { endOfDay, startOfDay } from 'date-fns';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';

export type CustomerDetailsTabKey =
  | 'transactions'
  | 'payments'
  | 'statements'
  | 'credits'
  | 'cards';

type CustomerTabRangeFilterProps = {
  activeTab: CustomerDetailsTabKey;
  transactionsRange?: DateRange;
  onTransactionsRangeChange: (range: DateRange | undefined) => void;
  paymentsRange?: DateRange;
  onPaymentsRangeChange: (range: DateRange | undefined) => void;
  statementsRange?: DateRange;
  onStatementsRangeChange: (range: DateRange | undefined) => void;
  creditsRange?: DateRange;
  onCreditsRangeChange: (range: DateRange | undefined) => void;
};

export function CustomerTabRangeFilter({
  activeTab,
  transactionsRange,
  onTransactionsRangeChange,
  paymentsRange,
  onPaymentsRangeChange,
  statementsRange,
  onStatementsRangeChange,
  creditsRange,
  onCreditsRangeChange,
}: CustomerTabRangeFilterProps) {
  if (activeTab === 'cards') return null;

  const value =
    activeTab === 'transactions'
      ? transactionsRange
      : activeTab === 'payments'
        ? paymentsRange
        : activeTab === 'statements'
          ? statementsRange
          : creditsRange;

  const onChange =
    activeTab === 'transactions'
      ? onTransactionsRangeChange
      : activeTab === 'payments'
        ? onPaymentsRangeChange
        : activeTab === 'statements'
          ? onStatementsRangeChange
          : onCreditsRangeChange;

  const handleChange = (range: DateRange | undefined) => {
    if (!range) {
      onChange(undefined);
      return;
    }
    onChange({
      from: range.from ? startOfDay(range.from) : undefined,
      to: range.to ? endOfDay(range.to) : undefined,
    });
  };

  return (
    <div className="w-full max-w-sm space-y-1.5">
      <Label>Date range</Label>
      <DateRangePicker value={value} onChange={handleChange} />
    </div>
  );
}
