import { t } from 'elysia';

export const CommunicationPresenceIdParamSchema = t.Object({
  id: t.String({ minLength: 1 }),
});

export const CommunicationPresenceListQuerySchema = t.Object({
  // reserved for future filtering
});

export const CommunicationPresenceCreateBodySchema = t.Object({
  status: t.Union([
    t.Literal('online'),
    t.Literal('away'),
    t.Literal('busy'),
    t.Literal('offline'),
  ]),
});
