import { z } from 'zod';
import { USER_TYPES } from '@/shared/access/constants';

const nonEmpty255 = z.string().min(1, 'Required').max(255);

export const userFormSchema = z.object({
  fullname: nonEmpty255,
  telephone: nonEmpty255,
  email: z.string().email('Invalid email'),
  status: z.number().int().min(0).max(20),
  roleId: nonEmpty255,
  branchId: nonEmpty255,
  locationId: z.string().max(255).optional().or(z.literal('')),
  userType: z.number().int().refine((value) => USER_TYPES.includes(value as (typeof USER_TYPES)[number]), {
    message: 'Invalid user type',
  }),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
