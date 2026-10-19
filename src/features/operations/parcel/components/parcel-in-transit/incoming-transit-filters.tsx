import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type IncomingTransitFilterValues = {
  sentDate?: string;
  sourceId?: string;
  consignmentNumber?: string;
};

type Props = {
  branches: { id: string; name: string }[];
  onApply: (filters: IncomingTransitFilterValues) => void;
};

export function IncomingTransitFilters({ branches, onApply }: Props) {
  const [sentDate, setSentDate] = useState<Date>();
  const [sourceId, setSourceId] = useState('all');
  const [consignmentNumber, setConsignmentNumber] = useState('');

  return (
    <form
      className="grid gap-3 md:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto_auto] md:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onApply({
          sentDate: sentDate ? format(sentDate, 'yyyy-MM-dd') : undefined,
          sourceId: sourceId === 'all' ? undefined : sourceId,
          consignmentNumber: consignmentNumber.trim() || undefined,
        });
      }}
    >
      <label className="space-y-1 text-sm font-medium">
        <span>Send Date</span>
        <DatePicker
          date={sentDate}
          onDateChange={setSentDate}
          placeholder="Any send date"
          className="h-11"
        />
      </label>
      <div className="space-y-1 text-sm font-medium">
        <span>Source Branch</span>
        <Select value={sourceId} onValueChange={setSourceId}>
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="All branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All branches</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label className="space-y-1 text-sm font-medium">
        <span>Consignment Number</span>
        <Input
          value={consignmentNumber}
          onChange={(event) => setConsignmentNumber(event.target.value)}
          placeholder="Number or code"
          className="h-11"
        />
      </label>
      <Button type="submit" className="h-11">
        Apply Filters
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11"
        onClick={() => {
          setSentDate(undefined);
          setSourceId('all');
          setConsignmentNumber('');
          onApply({});
        }}
      >
        Clear Filters
      </Button>
    </form>
  );
}
