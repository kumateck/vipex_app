import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { getActionOptionsForCaseType } from './utils';

type ReconciliationActionSelectProps = {
  id: string;
  label: string;
  value: number;
  caseType: number;
  placeholder: string;
  onValueChange: (value: number) => void;
};

export function ReconciliationActionSelect({
  id,
  label,
  value,
  caseType,
  placeholder,
  onValueChange,
}: ReconciliationActionSelectProps) {
  const actionOptions = getActionOptionsForCaseType(caseType);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={String(value)} onValueChange={(nextValue) => onValueChange(Number(nextValue))}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {actionOptions.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
