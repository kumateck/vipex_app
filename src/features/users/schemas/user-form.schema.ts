import { z } from 'zod';

const nonEmpty255 = z.string().min(1, 'Required').max(255);

export const userFormSchema = z.object({
  fullname: nonEmpty255,
  telephone: nonEmpty255,
  email: z.string().email('Invalid email'),
  status: z.number().int().min(0).max(20),
  roleId: nonEmpty255,
  branchId: nonEmpty255,
});

export type UserFormValues = z.infer<typeof userFormSchema>;
