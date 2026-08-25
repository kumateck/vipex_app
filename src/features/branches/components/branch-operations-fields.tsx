import { Controller, type Control } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import type { BranchFormInput } from '../schemas/branch-form.schema';

type BranchOperationsFieldsProps = {
  control: Control<BranchFormInput>;
};

const SETTINGS = [
  {
    name: 'usePickupQueue' as const,
    id: 'use-pickup-queue',
    title: 'Use pickup queue',
    description: 'Require queue ticket generation before parcel handover at this branch.',
  },
  {
    name: 'requirePickupOtp' as const,
    id: 'require-pickup-otp',
    title: 'Require pickup OTP',
    description: 'Verify an OTP before handing over sender-paid parcels at this branch.',
  },
  {
    name: 'requireReceiverOtp' as const,
    id: 'require-receiver-otp',
    title: 'Require receiver OTP',
    description: 'Verify an OTP before receiver payment and handover at this branch.',
  },
];

export function BranchOperationsFields({ control }: BranchOperationsFieldsProps) {
  return SETTINGS.map((setting) => (
    <Field key={setting.name}>
      <label htmlFor={setting.id} className="flex items-start gap-3 rounded-md border p-3">
        <Controller
          control={control}
          name={setting.name}
          render={({ field }) => (
            <Checkbox
              id={setting.id}
              checked={field.value}
              onCheckedChange={(value) => field.onChange(value === true)}
            />
          )}
        />
        <span className="text-sm">
          <span className="block font-medium">{setting.title}</span>
          <span className="text-muted-foreground">{setting.description}</span>
        </span>
      </label>
    </Field>
  ));
}
