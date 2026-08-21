import { Elysia } from 'elysia';
import { authPlugin, requireAuth } from '@/server/plugins/auth';
import { askHelpAssistantCtrl } from './controller';
import { HelpAssistantAskBodySchema } from './schema';
import { helpAssistantRateLimit } from './rate-limit';

export const helpAssistantRoutes = new Elysia({ name: 'help-assistant' }).use(authPlugin).post(
  '/ask',
  async ({ body, user }) =>
    askHelpAssistantCtrl({
      companyId: user!.companyId!,
      userId: user!.sub,
      question: body.question,
    }),
  {
    body: HelpAssistantAskBodySchema,
    beforeHandle: [requireAuth(), helpAssistantRateLimit()],
  },
);
