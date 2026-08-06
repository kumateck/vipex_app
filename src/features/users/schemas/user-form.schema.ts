import { z } from 'zod';
import { CASHIER_TYPES, USER_TYPES } from '@/shared/access/constants';
import { UserType } from '@/db/schemas/enums';
import { PHONE_DIGITS, normalizePhoneDigits } from '@/lib/phone';

const nonEmpty255 = z.string().min(1, 'Required').max(255);
const telephone = z
  .string()
  .transform(normalizePhoneDigits)
  .refine((value) => value.length === PHONE_DIGITS, {
    message: `Telephone must be exactly ${PHONE_DIGITS} digits`,
  });

export const userFormSchema = z
  .object({
    fullname: nonEmpty255,
    telephone,
    email: z.string().email('Invalid email'),
    status: z.number().int().min(0).max(20),
    roleId: nonEmpty255,
    branchId: nonEmpty255,
    locationId: z.string().max(255).optional().or(z.literal('')),
    userType: z
      .number()
      .int()
      .refine((value) => USER_TYPES.includes(value as (typeof USER_TYPES)[number]), {
        message: 'Invalid user type',
      }),
    cashierType: z
      .number()
      .int()
      .refine((value) => CASHIER_TYPES.includes(value as (typeof CASHIER_TYPES)[number]), {
        message: 'Invalid cashier type',
      })
      .optional()
      .nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.userType === UserType.CASHIER) {
      if (value.cashierType === null || value.cashierType === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cashier type is required for cashier users',
          path: ['cashierType'],
        });
      }
      return;
    }

    if (value.cashierType !== null && value.cashierType !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cashier type is only allowed for cashier users',
        path: ['cashierType'],
      });
    }
  });

export type UserFormValues = z.infer<typeof userFormSchema>;
