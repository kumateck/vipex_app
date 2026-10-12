import { memo } from 'react';
import type { Control, FieldPathByValue } from 'react-hook-form';
import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useParcelChargeAgentOptions } from '../../hooks';
import type { ParcelChargeAgentSource } from '../../types';
import type { ParcelBookingFormValues } from './parcel-form.types';

type Props = {
  control: Control<ParcelBookingFormValues>;
  name: FieldPathByValue<ParcelBookingFormValues, string>;
  source?: ParcelChargeAgentSource;
};

export const ParcelChargeAgentField = memo(function ParcelChargeAgentField({
  control,
  name,
  source,
}: Props) {
  const { data = [], isFetching, isError, refetch } = useParcelChargeAgentOptions(source);
  return (
    <FormField
      control={control}
      name={name}
      rules={{
        required: 'Select the agent who charged the parcel',
        validate: (value) =>
          data.some((agent) => agent.id === value) || 'Select an available charge agent',
      }}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Agent who charged the parcel</FormLabel>
          <Select
            value={String(field.value ?? '')}
            onValueChange={field.onChange}
            disabled={isFetching || isError || !data.length}
          >
            <FormControl>
              <SelectTrigger onBlur={field.onBlur} ref={field.ref}>
                <SelectValue placeholder={isFetching ? 'Loading agents...' : 'Select agent'} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {data.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.fullname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isError ? (
            <div className="flex items-center gap-2 text-sm text-destructive">
              Unable to load agents.
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Retry loading agents"
                aria-label="Retry loading agents"
                onClick={() => void refetch()}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          ) : !isFetching && !data.length ? (
            <p className="text-sm text-muted-foreground">
              No active agents available at this branch.
            </p>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
});
