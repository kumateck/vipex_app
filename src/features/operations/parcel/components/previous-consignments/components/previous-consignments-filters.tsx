import type { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { ALL_BRANCHES } from '../hooks/use-previous-consignments';

type BranchOption = { id: string; name: string };

export function PreviousConsignmentsFilters(props: {
  branches: BranchOption[];
  isHeadOffice: boolean;
  isLoading: boolean;
  range: DateRange | undefined;
  sourceId: string;
  onRangeChange: (range: DateRange | undefined) => void;
  onSearch: () => void;
  onSourceChange: (sourceId: string) => void;
}) {
  return (
    <div className="grid gap-3 rounded-md border p-3 md:grid-cols-[minmax(260px,1fr)_minmax(220px,1fr)_auto]">
      <div className="space-y-2">
        <Label>Consignment Date</Label>
        <DateRangePicker
          value={props.range}
          onChange={props.onRangeChange}
          placeholder="Select one date or a date range"
        />
      </div>
      {props.isHeadOffice ? (
        <div className="space-y-2">
          <Label htmlFor="previous-consignment-source">Source Branch</Label>
          <Select value={props.sourceId} onValueChange={props.onSourceChange}>
            <SelectTrigger id="previous-consignment-source">
              <SelectValue placeholder="All source branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BRANCHES}>All source branches</SelectItem>
              {props.branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div />
      )}
      <div className="flex items-end">
        <Button onClick={props.onSearch} disabled={props.isLoading} className="w-full md:w-auto">
          {props.isLoading ? 'Loading…' : 'Retrieve Consignments'}
        </Button>
      </div>
    </div>
  );
}
