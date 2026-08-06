import { useCallback, useEffect, useState } from 'react';
import {
  listCommunicationCalls,
  listCommunicationChannelUnreadCounts,
  listCommunicationChannels,
  listCommunicationEngagementRequests,
  listCommunicationEngagementRequestTargets,
  listCommunicationThreads,
  listCommunicationUnreadCounts,
  listMobileUserOptions,
} from '@mobile/lib/api';
import {
  loadChannelNotificationPrefs,
  type ChannelNotificationMode,
} from '@mobile/lib/communication-local';
import { notifyError } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import { useCommunicationSocket } from '@mobile/features/communication/use-communication-socket';
import { EMPTY_DATA } from './use-communication-hub-helpers';
import {
  dedupeMobileUserOptions,
  dedupeRequestTargets,
  normalizeIdentity,
} from '@mobile/features/communication/utils/hub-dedupe';
import type { CommunicationLoadState, CommunicationTabKey } from '../types';
import { useCommunicationHubActions } from './use-communication-hub-actions';
import { useCommunicationHubDerived } from './use-communication-hub-derived';

function isAuthorizationError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('unauthorized') ||
    msg.includes('forbidden')
  );
}

export function useCommunicationHub() {
  const { withAuth, session } = useAuth();
  const currentUser = session.user;
  const currentUserId = currentUser?.sub ?? null;

  const [activeTab, setActiveTab] = useState<CommunicationTabKey>('chats');
  const [loading, setLoading] = useState(true);
  const [joiningChannelId, setJoiningChannelId] = useState<string | null>(null);
  const [startingUserId, setStartingUserId] = useState<string | null>(null);
  const [selectedRequestTargetId, setSelectedRequestTargetId] = useState<string | null>(null);
  const [requestReasonNote, setRequestReasonNote] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [decidingRequestId, setDecidingRequestId] = useState<string | null>(null);
  const [callOccupancyByCallId, setCallOccupancyByCallId] = useState<Record<string, number>>({});
  const [typingByThreadId, setTypingByThreadId] = useState<Record<string, boolean>>({});
  const [channelNotifModes, setChannelNotifModes] = useState<
    Record<string, ChannelNotificationMode>
  >({});
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editingChannelName, setEditingChannelName] = useState('');
  const [editingArchive, setEditingArchive] = useState(false);
  const [participantInput, setParticipantInput] = useState('');
  const [updatingChannel, setUpdatingChannel] = useState(false);
  const [engagementApisAvailable, setEngagementApisAvailable] = useState(true);
  const [data, setData] = useState<CommunicationLoadState>(EMPTY_DATA);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const next = await withAuth(async (token) => {
        const [
          threads,
          textChannels,
          voiceChannels,
          threadUnread,
          voiceUnread,
          activeCalls,
          users,
        ] = await Promise.all([
          listCommunicationThreads(token),
          listCommunicationChannels(token, { channelType: 'text' }),
          listCommunicationChannels(token, { channelType: 'voice' }),
          listCommunicationUnreadCounts(token),
          listCommunicationChannelUnreadCounts(token, { channelType: 'voice' }),
          listCommunicationCalls(token, { status: 'active' }),
          listMobileUserOptions(token),
        ]);

        let requestTargets: Awaited<ReturnType<typeof listCommunicationEngagementRequestTargets>> =
          [];
        let incomingRequests: Awaited<ReturnType<typeof listCommunicationEngagementRequests>> = [];
        let outgoingRequests: Awaited<ReturnType<typeof listCommunicationEngagementRequests>> = [];

        if (engagementApisAvailable) {
          try {
            [requestTargets, incomingRequests, outgoingRequests] = await Promise.all([
              listCommunicationEngagementRequestTargets(token),
              listCommunicationEngagementRequests(token, {
                view: 'incoming',
                status: 'pending',
              }),
              listCommunicationEngagementRequests(token, {
                view: 'outgoing',
                status: 'pending',
              }),
            ]);
          } catch (error) {
            if (isAuthorizationError(error)) {
              setEngagementApisAvailable(false);
            } else {
              throw error;
            }
          }
        }

        const dedupedUsers = dedupeMobileUserOptions(users);
        const dedupedRequestTargets = dedupeRequestTargets(requestTargets);

        return {
          threads,
          textChannels,
          voiceChannels,
          users: dedupedUsers,
          requestTargets: dedupedRequestTargets,
          incomingRequests,
          outgoingRequests,
          activeCalls,
          threadUnreadById: new Map(
            threadUnread.map((item) => [
              item.threadId,
              { unread: item.unreadCount, mentions: item.mentionCount },
            ]),
          ),
          voiceUnreadById: new Map(
            voiceUnread.map((item) => [
              item.channelId,
              { unread: item.unreadCount, mentions: item.mentionCount },
            ]),
          ),
        } as CommunicationLoadState;
      });
      setData(next);
    } catch (error) {
      notifyError(
        'Communication load failed',
        error instanceof Error ? error.message : 'Unable to load communication data',
      );
    } finally {
      setLoading(false);
    }
  }, [engagementApisAvailable, withAuth]);

  useEffect(() => {
    setEngagementApisAvailable(true);
  }, [currentUserId, session.accessToken]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void loadChannelNotificationPrefs().then(setChannelNotifModes);
  }, []);

  const derived = useCommunicationHubDerived({
    data,
    currentUser: currentUser ?? null,
    currentUserId,
    selectedRequestTargetId,
    setSelectedRequestTargetId,
  });

  const { isConnected, requestCallParticipants } = useCommunicationSocket(session.accessToken, {
    onThreadCreated: () => void loadData(),
    onMessageCreated: () => void loadData(),
    onCallCreated: () => void loadData(),
    onCallUpdated: () => void loadData(),
    onCallParticipantsUpdated: ({ callId, participants }) => {
      setCallOccupancyByCallId((prev) => ({ ...prev, [callId]: participants.length }));
    },
    onTypingUpdated: ({ threadId, userId, isTyping }) => {
      if (!threadId || !userId) return;
      if (derived.currentUserTypingIdentitySet.has(normalizeIdentity(userId))) return;
      setTypingByThreadId((prev) => ({ ...prev, [threadId]: isTyping }));
    },
  });

  useEffect(() => {
    if (!isConnected) return;
    data.activeCalls.forEach((call) => requestCallParticipants(call.id));
  }, [data.activeCalls, isConnected, requestCallParticipants]);

  const actions = useCommunicationHubActions({
    withAuth,
    loadData,
    dataThreads: data.threads,
    requestableUsers: derived.requestableUsers,
    selectedRequestTargetId,
    requestReasonNote,
    channelNotifModes,
    editingChannelId,
    editingChannelName,
    editingArchive,
    participantInput,
    setActiveTab,
    setSelectedRequestTargetId,
    setStartingUserId,
    setIsSubmittingRequest,
    setDecidingRequestId,
    setJoiningChannelId,
    setChannelNotifModes,
    setUpdatingChannel,
    setRequestReasonNote,
    setParticipantInput,
  });

  return {
    activeTab,
    setActiveTab,
    loading,
    loadData,
    data,
    directThreads: derived.directThreads,
    groupThreads: derived.groupThreads,
    activeCallByChannelId: derived.activeCallByChannelId,
    chatEntries: derived.chatEntries,
    requestableUsers: derived.requestableUsers,
    userEntries: derived.usersWithoutThread,
    selectedRequestTargetId,
    setSelectedRequestTargetId,
    requestReasonNote,
    setRequestReasonNote,
    isSubmittingRequest,
    decidingRequestId,
    callOccupancyByCallId,
    typingByThreadId,
    channelNotifModes,
    joiningChannelId,
    startingUserId,
    editingChannelId,
    editingChannelName,
    setEditingChannelName,
    editingArchive,
    setEditingArchive,
    participantInput,
    setParticipantInput,
    updatingChannel,
    setEditingChannelId,
    ...actions,
  };
}
