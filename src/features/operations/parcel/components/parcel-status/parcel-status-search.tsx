import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ParcelStatusSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
};

export function ParcelStatusSearch({
  value,
  onChange,
  onSubmit,
  disabled,
}: ParcelStatusSearchProps) {
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by tracking, booking, receiver name or phone"
        className="h-11 text-base"
      />
      <Button type="submit" className="h-11 px-6" disabled={disabled}>
        Search
      </Button>
    </form>
  );
}
