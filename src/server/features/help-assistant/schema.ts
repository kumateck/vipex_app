import { t } from 'elysia';

export const HelpAssistantAskBodySchema = t.Object({
  question: t.String({ minLength: 3, maxLength: 500 }),
});
