import { memo } from 'react';
import type { DateRange } from 'react-day-picker';
import { Download, Printer, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { SpendPreset } from '../../utils';

type SpendToolbarProps = {
  range: DateRange | undefined;
  onRangeChange: (range: DateRange | undefined) => void;
  onPreset: (preset: SpendPreset) => void;
  onExport: () => void;
  onPrint: () => void;
  canExport: boolean;
  onEditRates?: () => void;
};

export const SpendToolbar = memo(function SpendToolbar({
  range,
  onRangeChange,
  onPreset,
  onExport,
  onPrint,
  canExport,
  onEditRates,
}: SpendToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={() => onPreset('this-month')}>
        This month
      </Button>
      <Button variant="outline" size="sm" onClick={() => onPreset('last-month')}>
        Last month
      </Button>
      <DateRangePicker value={range} onChange={onRangeChange} className="w-full sm:w-72" />
      <div className="ml-auto flex flex-wrap gap-2">
        {onEditRates ? (
          <Button variant="outline" size="sm" onClick={onEditRates}>
            <Settings2 className="mr-2 h-4 w-4" />
            Billing prices
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onClick={onExport} disabled={!canExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={onPrint} disabled={!canExport}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
    </div>
  );
});
