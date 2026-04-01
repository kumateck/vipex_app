import { Elysia } from 'elysia';
import type { AuthUser } from '@/server/plugins/auth';
import { authPlugin, requireAuth, requireModuleEnabled } from '@/server/plugins/auth';
import {
  createCommunicationMessagesCtrl,
  deleteCommunicationMessageCtrl,
  listCommunicationMeetingsCtrl,
  listCommunicationMessagesCtrl,
  listCommunicationMessagesUnreadCountsCtrl,
  markCommunicationThreadReadCtrl,
  toggleCommunicationMessageFlagCtrl,
  toggleCommunicationMessageReactionCtrl,
  updateCommunicationMessageCtrl,
} from './controller';
import {
  CommunicationMeetingsListQuerySchema,
  CommunicationMessagesCreateBodySchema,
  CommunicationMessagesIdParamSchema,
  CommunicationMessagesMarkThreadReadBodySchema,
  CommunicationMessagesListQuerySchema,
  CommunicationMessagesUnreadCountsQuerySchema,
  CommunicationMessagesToggleFlagBodySchema,
  CommunicationMessagesToggleReactionBodySchema,
  CommunicationMessagesUpdateBodySchema,
} from './schema';

export const CommunicationMessagesRoutes = new Elysia({ name: 'messages' })
  .use(authPlugin)
  .get(
    '/meetings',
    async ({ query, user }) =>
      listCommunicationMeetingsCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        threadId: query.threadId,
        from: query.from,
        to: query.to,
        limit: typeof query.limit === 'number' ? query.limit : undefined,
      }),
    {
      query: CommunicationMeetingsListQuerySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .get(
    '/unread-counts',
    async ({ user }) =>
      listCommunicationMessagesUnreadCountsCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
      }),
    {
      query: CommunicationMessagesUnreadCountsQuerySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .post(
    '/read',
    async ({ body, user }) =>
      markCommunicationThreadReadCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        threadId: body.threadId,
      }),
    {
      body: CommunicationMessagesMarkThreadReadBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .get(
    '/',
    async ({ query, user }) =>
      listCommunicationMessagesCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        threadId: query.threadId,
        limit: typeof query.limit === 'number' ? query.limit : undefined,
      }),
    {
      query: CommunicationMessagesListQuerySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .post(
    '/',
    async ({ body, user }) =>
      createCommunicationMessagesCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        threadId: body.threadId,
        body: body.body ?? null,
        messageType: body.messageType ?? null,
        metadataJson: body.metadataJson ?? null,
        replyToMessageId: body.replyToMessageId ?? null,
      }),
    {
      body: CommunicationMessagesCreateBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .patch(
    '/:id',
    async ({ params, body, user }) =>
      updateCommunicationMessageCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        id: params.id,
        body: body.body ?? null,
        metadataJson: body.metadataJson ?? null,
      }),
    {
      params: CommunicationMessagesIdParamSchema,
      body: CommunicationMessagesUpdateBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .delete(
    '/:id',
    async ({ params, user }) =>
      deleteCommunicationMessageCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        id: params.id,
      }),
    {
      params: CommunicationMessagesIdParamSchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .post(
    '/:id/flags',
    async ({ params, body, user }) =>
      toggleCommunicationMessageFlagCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        id: params.id,
        flag: body.flag,
        enabled: body.enabled,
      }),
    {
      params: CommunicationMessagesIdParamSchema,
      body: CommunicationMessagesToggleFlagBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .post(
    '/:id/reactions',
    async ({ params, body, user }) =>
      toggleCommunicationMessageReactionCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        id: params.id,
        emoji: body.emoji,
        enabled: body.enabled ?? true,
      }),
    {
      params: CommunicationMessagesIdParamSchema,
      body: CommunicationMessagesToggleReactionBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  );
