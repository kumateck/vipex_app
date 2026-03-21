import { z } from 'zod';

const nonEmpty255 = z.string().min(1, 'Required').max(255);

export const createCardSchema = z.object({
  name: nonEmpty255,
});

export const editCardSchema = z.object({
  name: nonEmpty255,
});

export type CreateCardFormValues = z.infer<typeof createCardSchema>;
export type EditCardFormValues = z.infer<typeof editCardSchema>;
