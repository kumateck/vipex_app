import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
  hint?: string;
  secret?: boolean;
};

export const WhatsAppProviderField = memo(function WhatsAppProviderField({
  id,
  label,
  value,
  onChange,
  disabled,
  placeholder,
  hint,
  secret = false,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={secret ? 'password' : 'text'}
        autoComplete={secret ? 'new-password' : 'off'}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
});

/** Placeholder shown for write-only secrets. */
export function secretPlaceholder(isSet: boolean, source?: 'provider' | 'environment' | null) {
  if (!isSet) return 'Not set';
  return source === 'environment'
    ? 'Using server environment value'
    : 'Stored — leave blank to keep';
}
