import { Elysia } from 'elysia';
import type { AuthUser } from '@/server/plugins/auth';
import { authPlugin, requireAuth, requireModuleEnabled } from '@/server/plugins/auth';
import {
  addCommunicationChannelParticipantsCtrl,
  createCommunicationChannelsCtrl,
  getCommunicationChannelByIdCtrl,
  listCommunicationChannelUnreadCountsCtrl,
  listCommunicationChannelsCtrl,
  markCommunicationChannelReadCtrl,
  removeCommunicationChannelParticipantCtrl,
  updateCommunicationChannelsCtrl,
} from './controller';
import {
  CommunicationChannelsCreateBodySchema,
  CommunicationChannelsIdParamSchema,
  CommunicationChannelsListQuerySchema,
  CommunicationChannelsParticipantParamSchema,
  CommunicationChannelsParticipantsBodySchema,
  CommunicationChannelsUnreadCountsQuerySchema,
  CommunicationChannelsUpdateBodySchema,
} from './schema';

export const CommunicationChannelsRoutes = new Elysia({ name: 'channels' })
  .use(authPlugin)
  .get(
    '/',
    async ({ query, user }) =>
      listCommunicationChannelsCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        channelType: query.channelType ?? undefined,
        includeArchived: query.includeArchived ?? false,
      }),
    {
      query: CommunicationChannelsListQuerySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .get(
    '/unread-counts',
    async ({ query, user }) =>
      listCommunicationChannelUnreadCountsCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        channelType: query.channelType ?? undefined,
      }),
    {
      query: CommunicationChannelsUnreadCountsQuerySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .get(
    '/:id',
    async ({ params, user }) =>
      getCommunicationChannelByIdCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        id: params.id,
      }),
    {
      params: CommunicationChannelsIdParamSchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .post(
    '/',
    async ({ body, user }) =>
      createCommunicationChannelsCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        name: body.name,
        description: body.description ?? null,
        branchId: body.branchId ?? null,
        locationId: body.locationId ?? null,
        channelType: body.channelType ?? 'text',
        visibility: body.visibility ?? 'public',
        participantUserIds: body.participantUserIds ?? [],
        isCallEnabled: body.isCallEnabled ?? body.channelType === 'voice',
        isAnnouncementOnly: body.isAnnouncementOnly ?? false,
        maxParticipants: body.maxParticipants ?? null,
      }),
    {
      body: CommunicationChannelsCreateBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .patch(
    '/:id',
    async ({ params, body, user }) =>
      updateCommunicationChannelsCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        id: params.id,
        name: body.name ?? undefined,
        description: body.description ?? undefined,
        isArchived: body.isArchived ?? undefined,
        isCallEnabled: body.isCallEnabled ?? undefined,
        isAnnouncementOnly: body.isAnnouncementOnly ?? undefined,
        maxParticipants: body.maxParticipants ?? undefined,
      }),
    {
      params: CommunicationChannelsIdParamSchema,
      body: CommunicationChannelsUpdateBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .post(
    '/:id/participants',
    async ({ params, body, user }) =>
      addCommunicationChannelParticipantsCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        id: params.id,
        participantUserIds: body.participantUserIds,
      }),
    {
      params: CommunicationChannelsIdParamSchema,
      body: CommunicationChannelsParticipantsBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .delete(
    '/:id/participants/:userId',
    async ({ params, user }) =>
      removeCommunicationChannelParticipantCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        id: params.id,
        participantUserId: params.userId,
      }),
    {
      params: CommunicationChannelsParticipantParamSchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .post(
    '/:id/read',
    async ({ params, user }) =>
      markCommunicationChannelReadCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        id: params.id,
      }),
    {
      params: CommunicationChannelsIdParamSchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  );
