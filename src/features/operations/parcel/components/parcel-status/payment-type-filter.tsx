import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type PaymentType = 'all' | 'paid' | 'to_be_paid' | 'partial';

type PaymentTypeFilterProps = {
  value: PaymentType;
  onChange: (value: PaymentType) => void;
};

export function PaymentTypeFilter({ value, onChange }: PaymentTypeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Payment type</span>
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as PaymentType)}>
        <SelectTrigger className="w-44" aria-label="Filter by payment type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All payment types</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="to_be_paid">To Be Paid</SelectItem>
          <SelectItem value="partial">Partial</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
