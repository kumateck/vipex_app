import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ParcelBookingSearchFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  onSearch: () => Promise<void> | void;
  isSearching: boolean;
};

export function ParcelBookingSearchField({
  id,
  label,
  placeholder,
  value,
  onValueChange,
  onSearch,
  isSearching,
}: ParcelBookingSearchFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" onClick={onSearch} disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>
    </div>
  );
}
