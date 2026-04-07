import { api } from '@/services/api';

export type CommunicationThread = {
  id: string;
  companyId: string;
  branchId: string | null;
  locationId: string | null;
  threadType: 'direct' | 'group' | 'channel' | string;
  title: string | null;
  isPrivate: boolean;
  lastMessageAt: string | null;
  createdAt: string | null;
  participantCount?: number;
};

export type CommunicationMessage = {
  id: string;
  threadId: string;
  senderUserId: string | null;
  senderName?: string | null;
  messageType: string;
  body: string | null;
  metadataJson: unknown;
  replyToMessageId?: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string | null;
};

export type CommunicationUnreadCount = {
  threadId: string;
  unreadCount: number;
  mentionCount: number;
  lastReadAt: string | null;
  lastMessageAt: string | null;
};

export type CommunicationChannelUnreadCount = {
  channelId: string;
  unreadCount: number;
  mentionCount: number;
  lastReadAt: string | null;
  latestActivityAt: string | null;
};

export type CommunicationMeeting = {
  messageId: string;
  threadId: string;
  threadTitle: string | null;
  threadType: string;
  senderUserId: string | null;
  body: string | null;
  title: string;
  link: string | null;
  startsAt: string | null;
  metadataJson: unknown;
  createdAt: string | null;
};

export type CommunicationCallSession = {
  id: string;
  companyId: string;
  threadId: string | null;
  chatThreadId: string | null;
  channelId: string | null;
  initiatorUserId: string | null;
  callType: 'audio' | 'video' | string;
  status: string;
  livekitRoomName: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CommunicationPresence = {
  id: string;
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline' | string;
  lastSeenAt: string | null;
  updatedAt: string | null;
};

export type CommunicationChannel = {
  id: string;
  companyId: string;
  branchId: string | null;
  locationId: string | null;
  name: string;
  description: string | null;
  channelType: 'text' | 'voice' | string;
  visibility: 'public' | 'private' | string;
  isCallEnabled: boolean;
  isAnnouncementOnly: boolean;
  threadId: string | null;
  maxParticipants: number | null;
  isArchived: boolean;
  archivedAt: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  participantCount: number;
  participantUserIds?: string[];
};

export type CommunicationLivekitToken = {
  callId: string;
  roomName: string;
  livekitUrl: string;
  token: string;
  expiresAt: string;
};

export type CommunicationVoiceJoin = {
  call: CommunicationCallSession;
  livekit: CommunicationLivekitToken;
};

export const communicationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listCommunicationThreads: builder.query<
      CommunicationThread[],
      { threadType?: 'direct' | 'group' | 'channel' } | void
    >({
      query: (params) => ({
        url: '/communication/threads',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'Communication', id: 'THREADS' }],
    }),

    createCommunicationThread: builder.mutation<
      CommunicationThread,
      {
        threadType: 'direct' | 'group' | 'channel';
        title?: string | null;
        participantUserIds: string[];
        branchId?: string | null;
        locationId?: string | null;
      }
    >({
      query: (body) => ({
        url: '/communication/threads',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Communication', id: 'THREADS' }],
    }),

    listCommunicationMessages: builder.query<
      CommunicationMessage[],
      { threadId: string; limit?: number }
    >({
      query: (params) => ({
        url: '/communication/messages',
        params,
      }),
      providesTags: (_result, _error, { threadId }) => [
        { type: 'Communication', id: `MESSAGES:${threadId}` },
      ],
    }),

    listCommunicationMeetings: builder.query<
      CommunicationMeeting[],
      { threadId?: string; from?: string; to?: string; limit?: number } | void
    >({
      query: (params) => ({
        url: '/communication/messages/meetings',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'Communication', id: 'MEETINGS' }],
    }),

    createCommunicationMessage: builder.mutation<
      CommunicationMessage,
      {
        threadId: string;
        body?: string | null;
        messageType?: string | null;
        metadataJson?: Record<string, unknown> | null;
        replyToMessageId?: string | null;
      }
    >({
      query: (body) => ({
        url: '/communication/messages',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { threadId }) => [
        { type: 'Communication', id: `MESSAGES:${threadId}` },
        { type: 'Communication', id: 'UNREAD_COUNTS' },
        { type: 'Communication', id: 'CHANNEL_UNREAD_COUNTS' },
      ],
    }),

    updateCommunicationMessage: builder.mutation<
      CommunicationMessage,
      {
        id: string;
        threadId: string;
        body?: string | null;
        metadataJson?: Record<string, unknown> | null;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/communication/messages/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { threadId }) => [
        { type: 'Communication', id: `MESSAGES:${threadId}` },
        { type: 'Communication', id: 'UNREAD_COUNTS' },
        { type: 'Communication', id: 'CHANNEL_UNREAD_COUNTS' },
      ],
    }),

    deleteCommunicationMessage: builder.mutation<
      CommunicationMessage,
      { id: string; threadId: string }
    >({
      query: ({ id }) => ({
        url: `/communication/messages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { threadId }) => [
        { type: 'Communication', id: `MESSAGES:${threadId}` },
        { type: 'Communication', id: 'UNREAD_COUNTS' },
        { type: 'Communication', id: 'CHANNEL_UNREAD_COUNTS' },
      ],
    }),

    toggleCommunicationMessageFlag: builder.mutation<
      CommunicationMessage,
      {
        id: string;
        threadId: string;
        flag: 'pinnedByUserIds' | 'starredByUserIds';
        enabled: boolean;
      }
    >({
      query: ({ id, flag, enabled }) => ({
        url: `/communication/messages/${id}/flags`,
        method: 'POST',
        body: { flag, enabled },
      }),
      invalidatesTags: (_result, _error, { threadId }) => [
        { type: 'Communication', id: `MESSAGES:${threadId}` },
        { type: 'Communication', id: 'UNREAD_COUNTS' },
        { type: 'Communication', id: 'CHANNEL_UNREAD_COUNTS' },
      ],
    }),

    toggleCommunicationMessageReaction: builder.mutation<
      CommunicationMessage,
      {
        id: string;
        threadId: string;
        emoji: string;
        enabled?: boolean;
      }
    >({
      query: ({ id, emoji, enabled }) => ({
        url: `/communication/messages/${id}/reactions`,
        method: 'POST',
        body: { emoji, enabled },
      }),
      invalidatesTags: (_result, _error, { threadId }) => [
        { type: 'Communication', id: `MESSAGES:${threadId}` },
        { type: 'Communication', id: 'UNREAD_COUNTS' },
        { type: 'Communication', id: 'CHANNEL_UNREAD_COUNTS' },
      ],
    }),

    listCommunicationUnreadCounts: builder.query<CommunicationUnreadCount[], void>({
      query: () => ({
        url: '/communication/messages/unread-counts',
      }),
      providesTags: [{ type: 'Communication', id: 'UNREAD_COUNTS' }],
    }),

    markCommunicationThreadRead: builder.mutation<
      { threadId: string; readAt: string | null },
      { threadId: string }
    >({
      query: (body) => ({
        url: '/communication/messages/read',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Communication', id: 'UNREAD_COUNTS' }],
    }),

    listCommunicationChannelUnreadCounts: builder.query<
      CommunicationChannelUnreadCount[],
      { channelType?: 'text' | 'voice' } | void
    >({
      query: (params) => ({
        url: '/communication/channels/unread-counts',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'Communication', id: 'CHANNEL_UNREAD_COUNTS' }],
    }),

    markCommunicationChannelRead: builder.mutation<
      { channelId: string; readAt: string | null },
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/communication/channels/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Communication', id: 'CHANNEL_UNREAD_COUNTS' }],
    }),

    listCommunicationCalls: builder.query<
      CommunicationCallSession[],
      { threadId?: string; channelId?: string; status?: string } | void
    >({
      query: (params) => ({
        url: '/communication/calls',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'Communication', id: 'CALLS' }],
    }),

    createCommunicationCall: builder.mutation<
      CommunicationCallSession,
      {
        threadId?: string | null;
        channelId?: string | null;
        callType?: 'audio' | 'video';
        livekitRoomName?: string | null;
      }
    >({
      query: (body) => ({
        url: '/communication/calls',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Communication', id: 'CALLS' },
        { type: 'Communication', id: 'CHANNEL_UNREAD_COUNTS' },
      ],
    }),

    updateCommunicationCallStatus: builder.mutation<
      CommunicationCallSession,
      { id: string; status: 'pending' | 'ringing' | 'active' | 'ended' | 'cancelled' }
    >({
      query: ({ id, status }) => ({
        url: `/communication/calls/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: [
        { type: 'Communication', id: 'CALLS' },
        { type: 'Communication', id: 'CHANNEL_UNREAD_COUNTS' },
      ],
    }),

    createCommunicationCallLivekitToken: builder.mutation<
      CommunicationLivekitToken,
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/communication/calls/${id}/livekit-token`,
        method: 'POST',
      }),
    }),

    listCommunicationPresence: builder.query<CommunicationPresence[], void>({
      query: () => ({
        url: '/communication/presence',
      }),
      providesTags: [{ type: 'Communication', id: 'PRESENCE' }],
    }),

    setCommunicationPresence: builder.mutation<
      CommunicationPresence,
      { status: 'online' | 'away' | 'busy' | 'offline' }
    >({
      query: (body) => ({
        url: '/communication/presence',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Communication', id: 'PRESENCE' }],
    }),

    listCommunicationChannels: builder.query<
      CommunicationChannel[],
      { channelType?: 'text' | 'voice'; includeArchived?: boolean } | void
    >({
      query: (params) => ({
        url: '/communication/channels',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'Communication', id: 'CHANNELS' }],
    }),

    getCommunicationChannelById: builder.query<CommunicationChannel, { id: string }>({
      query: ({ id }) => ({
        url: `/communication/channels/${id}`,
      }),
      providesTags: (_result, _error, { id }) => [
        { type: 'Communication', id: 'CHANNELS' },
        { type: 'Communication', id: `CHANNEL:${id}` },
      ],
    }),

    createCommunicationChannel: builder.mutation<
      CommunicationChannel,
      {
        name: string;
        description?: string | null;
        branchId?: string | null;
        locationId?: string | null;
        channelType?: 'text' | 'voice';
        visibility?: 'public' | 'private';
        participantUserIds?: string[];
        isCallEnabled?: boolean;
        isAnnouncementOnly?: boolean;
        maxParticipants?: number | null;
      }
    >({
      query: (body) => ({
        url: '/communication/channels',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Communication', id: 'CHANNELS' },
        { type: 'Communication', id: 'CHANNEL_UNREAD_COUNTS' },
      ],
    }),

    updateCommunicationChannel: builder.mutation<
      CommunicationChannel,
      {
        id: string;
        name?: string | null;
        description?: string | null;
        isArchived?: boolean;
        isCallEnabled?: boolean;
        isAnnouncementOnly?: boolean;
        maxParticipants?: number | null;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/communication/channels/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [
        { type: 'Communication', id: 'CHANNELS' },
        { type: 'Communication', id: 'CHANNEL_UNREAD_COUNTS' },
      ],
    }),

    addCommunicationChannelParticipants: builder.mutation<
      CommunicationChannel,
      { id: string; participantUserIds: string[] }
    >({
      query: ({ id, participantUserIds }) => ({
        url: `/communication/channels/${id}/participants`,
        method: 'POST',
        body: { participantUserIds },
      }),
      invalidatesTags: [
        { type: 'Communication', id: 'CHANNELS' },
        { type: 'Communication', id: 'CHANNEL_UNREAD_COUNTS' },
      ],
    }),

    removeCommunicationChannelParticipant: builder.mutation<
      CommunicationChannel,
      { id: string; userId: string }
    >({
      query: ({ id, userId }) => ({
        url: `/communication/channels/${id}/participants/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Communication', id: 'CHANNELS' },
        { type: 'Communication', id: 'CHANNEL_UNREAD_COUNTS' },
      ],
    }),

    joinVoiceChannel: builder.mutation<CommunicationVoiceJoin, { channelId: string }>({
      query: ({ channelId }) => ({
        url: `/communication/calls/voice/${channelId}/join`,
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'Communication', id: 'CALLS' },
        { type: 'Communication', id: 'CHANNEL_UNREAD_COUNTS' },
      ],
    }),
  }),
});

export const {
  useListCommunicationThreadsQuery,
  useCreateCommunicationThreadMutation,
  useListCommunicationMessagesQuery,
  useListCommunicationMeetingsQuery,
  useCreateCommunicationMessageMutation,
  useUpdateCommunicationMessageMutation,
  useDeleteCommunicationMessageMutation,
  useToggleCommunicationMessageFlagMutation,
  useToggleCommunicationMessageReactionMutation,
  useListCommunicationUnreadCountsQuery,
  useMarkCommunicationThreadReadMutation,
  useListCommunicationChannelUnreadCountsQuery,
  useMarkCommunicationChannelReadMutation,
  useListCommunicationCallsQuery,
  useCreateCommunicationCallMutation,
  useUpdateCommunicationCallStatusMutation,
  useCreateCommunicationCallLivekitTokenMutation,
  useListCommunicationPresenceQuery,
  useSetCommunicationPresenceMutation,
  useListCommunicationChannelsQuery,
  useGetCommunicationChannelByIdQuery,
  useCreateCommunicationChannelMutation,
  useUpdateCommunicationChannelMutation,
  useAddCommunicationChannelParticipantsMutation,
  useRemoveCommunicationChannelParticipantMutation,
  useJoinVoiceChannelMutation,
} = communicationApi;
