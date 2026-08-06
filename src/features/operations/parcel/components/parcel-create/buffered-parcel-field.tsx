import { memo, useCallback, useEffect, useState } from 'react';
import type { Control, FieldPathByValue, RegisterOptions } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { sanitizeString } from '@/lib/utils';
import type { ParcelBookingFormValues } from './parcel-form.types';

type BufferedParcelFieldProps = {
  control: Control<ParcelBookingFormValues>;
  name: FieldPathByValue<ParcelBookingFormValues, string>;
  label: string;
  placeholder?: string;
  description?: string;
  inputMode?: 'decimal' | 'numeric';
  multiline?: boolean;
  rules?: RegisterOptions<
    ParcelBookingFormValues,
    FieldPathByValue<ParcelBookingFormValues, string>
  >;
};

export const BufferedParcelField = memo(function BufferedParcelField({
  control,
  name,
  label,
  placeholder,
  description,
  inputMode,
  multiline = false,
  rules,
}: BufferedParcelFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      rules={rules}
      render={({ field }) => (
        <BufferedParcelFieldControl
          name={field.name}
          refCallback={field.ref}
          value={sanitizeString(field.value)}
          onCommit={field.onChange}
          onBlur={field.onBlur}
          label={label}
          placeholder={placeholder}
          description={description}
          inputMode={inputMode}
          multiline={multiline}
        />
      )}
    />
  );
});

type BufferedParcelFieldControlProps = {
  name: string;
  refCallback: (instance: HTMLInputElement | HTMLTextAreaElement | null) => void;
  value: string;
  onCommit: (value: string) => void;
  onBlur: () => void;
  label: string;
  placeholder?: string;
  description?: string;
  inputMode?: 'decimal' | 'numeric';
  multiline: boolean;
};

const BufferedParcelFieldControl = memo(function BufferedParcelFieldControl({
  name,
  refCallback,
  value,
  onCommit,
  onBlur,
  label,
  placeholder,
  description,
  inputMode,
  multiline,
}: BufferedParcelFieldControlProps) {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  const handleBlur = useCallback(() => {
    onCommit(draftValue);
    onBlur();
  }, [draftValue, onBlur, onCommit]);

  const commitDraftValue = useCallback(() => {
    onCommit(draftValue);
  }, [draftValue, onCommit]);

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        {multiline ? (
          <Textarea
            name={name}
            ref={refCallback}
            onBlur={handleBlur}
            onChange={(event) => setDraftValue(event.target.value)}
            value={draftValue}
            placeholder={placeholder}
            className="field-sizing-fixed min-h-24 resize-y"
          />
        ) : (
          <Input
            name={name}
            ref={refCallback}
            onBlur={handleBlur}
            onChange={(event) => setDraftValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                commitDraftValue();
              }
            }}
            value={draftValue}
            inputMode={inputMode}
            placeholder={placeholder}
          />
        )}
      </FormControl>
      {description ? <FormDescription>{description}</FormDescription> : null}
      <FormMessage />
    </FormItem>
  );
});
