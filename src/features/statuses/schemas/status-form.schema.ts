import { z } from 'zod';

const nonEmpty255 = z.string().min(1, 'Required').max(255);

export const statusFormSchema = z.object({
  name: nonEmpty255,
  color: nonEmpty255,
});

export type StatusFormValues = z.infer<typeof statusFormSchema>;
