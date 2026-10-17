import { t, type Static } from 'elysia';

export const PublicContactBodySchema = t.Object(
  {
    type: t.Union([t.Literal('enquiry'), t.Literal('complaint'), t.Literal('feedback')]),
    name: t.String({ minLength: 2, maxLength: 120 }),
    phone: t.String({ minLength: 9, maxLength: 32 }),
    email: t.Optional(t.String({ maxLength: 254 })),
    branch: t.Optional(t.String({ maxLength: 120 })),
    trackingCode: t.Optional(t.String({ maxLength: 50 })),
    message: t.String({ minLength: 10, maxLength: 5000 }),
    submissionId: t.Optional(t.String({ format: 'uuid' })),
    website: t.Optional(t.String({ maxLength: 255 })),
  },
  { additionalProperties: false },
);

export type PublicContactInput = Static<typeof PublicContactBodySchema>;
export type ContactRecord = {
  id: string;
  companyId: string;
  reference: string;
  type: PublicContactInput['type'];
  name: string;
  phone: string;
  email: string | null;
  branch: string | null;
  trackingCode: string | null;
  message: string;
};

export const ContactStatusSchema = t.Union([
  t.Literal('new'),
  t.Literal('in_progress'),
  t.Literal('resolved'),
  t.Literal('spam'),
]);
export const ContactListSchema = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, maximum: 100000, multipleOf: 1, default: 1 })),
  pageSize: t.Optional(t.Numeric({ minimum: 1, maximum: 100, multipleOf: 1, default: 25 })),
  status: t.Optional(ContactStatusSchema),
  type: t.Optional(t.Union([t.Literal('enquiry'), t.Literal('complaint'), t.Literal('feedback')])),
});
export const ContactUpdateSchema = t.Object({
  status: ContactStatusSchema,
  note: t.Optional(t.String({ maxLength: 2000 })),
  updatedAt: t.String({ format: 'date-time' }),
});
export type ContactListInput = Static<typeof ContactListSchema> & { companyId: string };
export type ContactUpdateInput = Static<typeof ContactUpdateSchema> & {
  id: string;
  companyId: string;
  userId: string;
};
