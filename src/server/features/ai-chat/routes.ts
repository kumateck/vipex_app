import { Elysia } from 'elysia';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { getLatestAiChatConversationCtrl, sendAiChatMessageCtrl } from './controller';
import { aiChatRateLimit } from './rate-limit';
import { AiChatSendMessageBodySchema } from './schema';

export const aiChatRoutes = new Elysia({ name: 'ai-chat' })
  .use(authPlugin)
  .get(
    '/conversations/latest',
    async ({ user }) =>
      getLatestAiChatConversationCtrl({ companyId: user!.companyId!, userId: user!.sub }),
    {
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUseAIChat)],
    },
  )
  .post(
    '/messages',
    async ({ body, user }) =>
      sendAiChatMessageCtrl({
        companyId: user!.companyId!,
        userId: user!.sub,
        conversationId: body.conversationId ?? null,
        message: body.message,
      }),
    {
      body: AiChatSendMessageBodySchema,
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUseAIChat),
        aiChatRateLimit(),
      ],
    },
  );
