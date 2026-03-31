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
  messageType: string;
  body: string | null;
  metadataJson: unknown;
  replyToMessageId?: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string | null;
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

export type CommunicationLivekitToken = {
  callId: string;
  roomName: string;
  livekitUrl: string;
  token: string;
  expiresAt: string;
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
      ],
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
      invalidatesTags: [{ type: 'Communication', id: 'CALLS' }],
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
      invalidatesTags: [{ type: 'Communication', id: 'CALLS' }],
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
  useListCommunicationCallsQuery,
  useCreateCommunicationCallMutation,
  useUpdateCommunicationCallStatusMutation,
  useCreateCommunicationCallLivekitTokenMutation,
  useListCommunicationPresenceQuery,
  useSetCommunicationPresenceMutation,
} = communicationApi;
