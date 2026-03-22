import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

type PasswordFieldProps = Omit<React.ComponentProps<'input'>, 'type'> & {
  label?: React.ReactNode;
  error?: string;
  wrapperClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  labelAction?: React.ReactNode;
};

export function PasswordField({
  id,
  label,
  error,
  wrapperClassName,
  inputClassName,
  labelClassName,
  labelAction,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? `password-${generatedId}`;
  const actionLabel = visible ? 'Hide password' : 'Show password';

  return (
    <div className={cn('space-y-2', wrapperClassName)}>
      {label ? (
        <div className="flex items-center gap-2">
          <Label htmlFor={inputId} className={labelClassName}>
            {label}
          </Label>
          {labelAction ? <div className="ml-auto">{labelAction}</div> : null}
        </div>
      ) : null}

      <InputGroup>
        <InputGroupInput
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error) || inputProps['aria-invalid'] === true}
          className={inputClassName}
          {...inputProps}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={() => setVisible((state) => !state)}
            aria-label={actionLabel}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
