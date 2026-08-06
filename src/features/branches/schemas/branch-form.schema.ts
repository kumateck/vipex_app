import { z } from 'zod';
import { BRANCH_TYPES } from '@/shared/access/constants';
import { PHONE_DIGITS, normalizePhoneDigits } from '@/lib/phone';

const nonEmpty255 = z.string().min(1, 'Required').max(255);
const optionalString255 = z.string().max(255).optional().or(z.literal(''));
const optionalTelephone = z
  .string()
  .transform(normalizePhoneDigits)
  .refine((value) => value.length === 0 || value.length === PHONE_DIGITS, {
    message: `Telephone must be exactly ${PHONE_DIGITS} digits`,
  });

export const branchFormSchema = z.object({
  name: nonEmpty255,
  type: z
    .number()
    .int()
    .refine((value) => BRANCH_TYPES.includes(value as (typeof BRANCH_TYPES)[number]), {
      message: 'Invalid branch type',
    }),
  telephone: optionalTelephone,
  address: optionalString255,
  email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  usePickupQueue: z.boolean().default(false),
});

export type BranchFormInput = z.input<typeof branchFormSchema>;
export type BranchFormValues = z.output<typeof branchFormSchema>;
