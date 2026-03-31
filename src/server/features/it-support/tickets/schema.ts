import { t } from 'elysia';

export const ItSupportTicketsListQuerySchema = t.Object({
  status: t.Optional(t.String({ minLength: 1 })),
  priority: t.Optional(t.String({ minLength: 1 })),
  assignedToUserId: t.Optional(t.String({ minLength: 1 })),
});

export const ItSupportTicketsIdParamSchema = t.Object({
  id: t.String({ minLength: 1 }),
});

export const ItSupportTicketAttachmentInputSchema = t.Object({
  fileName: t.String({ minLength: 1, maxLength: 255 }),
  dataUrl: t.String({ minLength: 1 }),
});

export const ItSupportTicketsCreateBodySchema = t.Object({
  subject: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  priority: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 20 }), t.Null()])),
  category: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 60 }), t.Null()])),
  branchId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  locationId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  assignedToUserId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  attachments: t.Optional(t.Array(ItSupportTicketAttachmentInputSchema)),
});

export const ItSupportTicketsUpdateBodySchema = t.Object({
  status: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 30 }), t.Null()])),
  priority: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 20 }), t.Null()])),
  category: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 60 }), t.Null()])),
  assignedToUserId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  note: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
});

export const ItSupportTicketNoteBodySchema = t.Object({
  note: t.String({ minLength: 1, maxLength: 3000 }),
});
