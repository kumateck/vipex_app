import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { DateRange } from 'react-day-picker';
import type { AccountingTaxViewData } from '../types/accounting-tax-view-data';
import { toDateInputValue } from '../utils/date-utils';

export function TaxFilingPeriodCard({
  filingPeriods,
  isMutating,
  periodDateFrom,
  periodDateTo,
  periodName,
  periodNotes,
  selectedPeriodId,
  setPeriodDateFrom,
  setPeriodDateTo,
  setPeriodName,
  setPeriodNotes,
  setSelectedPeriodId,
  handleCreatePeriod,
}: Pick<
  AccountingTaxViewData,
  | 'filingPeriods'
  | 'isMutating'
  | 'periodDateFrom'
  | 'periodDateTo'
  | 'periodName'
  | 'periodNotes'
  | 'selectedPeriodId'
  | 'setPeriodDateFrom'
  | 'setPeriodDateTo'
  | 'setPeriodName'
  | 'setPeriodNotes'
  | 'setSelectedPeriodId'
  | 'handleCreatePeriod'
>) {
  const periodRange: DateRange | undefined = {
    from: periodDateFrom ? new Date(`${periodDateFrom}T00:00:00`) : undefined,
    to: periodDateTo ? new Date(`${periodDateTo}T00:00:00`) : undefined,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Filing Period</CardTitle>
        <CardDescription>
          Filing periods help you review and group tax items before they are marked as filed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="tax-period-name">Period Name</Label>
            <Input
              id="tax-period-name"
              value={periodName}
              onChange={(event) => setPeriodName(event.target.value)}
              placeholder="March 2026 VAT Filing"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax-period-date-from">Date From</Label>
            <DateRangePicker
              value={periodRange}
              onChange={(value) => {
                setPeriodDateFrom(toDateInputValue(value?.from));
                setPeriodDateTo(toDateInputValue(value?.to));
              }}
              placeholder="Select filing period range"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax-period-filter">Current Filing Period</Label>
            <Select
              value={selectedPeriodId || 'all'}
              onValueChange={(value) => setSelectedPeriodId(value === 'all' ? '' : value)}
            >
              <SelectTrigger id="tax-period-filter">
                <SelectValue placeholder="All periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All periods</SelectItem>
                {filingPeriods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 xl:col-span-4">
            <Label htmlFor="tax-period-notes">Notes</Label>
            <Input
              id="tax-period-notes"
              value={periodNotes}
              onChange={(event) => setPeriodNotes(event.target.value)}
              placeholder="Optional notes for the filing review pack"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => void handleCreatePeriod()} disabled={isMutating}>
            Create Filing Period
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
