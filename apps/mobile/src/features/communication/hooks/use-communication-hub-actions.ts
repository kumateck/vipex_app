import { useCallback } from 'react';
import { router } from 'expo-router';
import {
  addCommunicationChannelParticipants,
  approveCommunicationEngagementRequest,
  createCommunicationEngagementRequest,
  createCommunicationThread,
  declineCommunicationEngagementRequest,
  joinCommunicationVoiceChannel,
  markCommunicationChannelRead,
  updateCommunicationChannel,
} from '@mobile/lib/api';
import {
  saveChannelNotificationPrefs,
  type ChannelNotificationMode,
} from '@mobile/lib/communication-local';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import type { CommunicationChannel, CommunicationThread } from '@mobile/types/communication';
import type { UserChatEntry } from '../types/hub';

type UseCommunicationHubActionsParams = {
  withAuth: <T>(fn: (token: string) => Promise<T>) => Promise<T>;
  loadData: () => Promise<void>;
  dataThreads: CommunicationThread[];
  requestableUsers: UserChatEntry[];
  selectedRequestTargetId: string | null;
  requestReasonNote: string;
  channelNotifModes: Record<string, ChannelNotificationMode>;
  editingChannelId: string | null;
  editingChannelName: string;
  editingArchive: boolean;
  participantInput: string;
  setActiveTab: (tab: 'chats' | 'channels' | 'users' | 'requests') => void;
  setSelectedRequestTargetId: (id: string | null) => void;
  setStartingUserId: (id: string | null) => void;
  setIsSubmittingRequest: (value: boolean) => void;
  setDecidingRequestId: (id: string | null) => void;
  setJoiningChannelId: (id: string | null) => void;
  setChannelNotifModes: (value: Record<string, ChannelNotificationMode>) => void;
  setUpdatingChannel: (value: boolean) => void;
  setRequestReasonNote: (value: string) => void;
  setParticipantInput: (value: string) => void;
};

export function useCommunicationHubActions(params: UseCommunicationHubActionsParams) {
  const {
    withAuth,
    loadData,
    dataThreads,
    requestableUsers,
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
  } = params;

  const openThread = useCallback((thread: CommunicationThread) => {
    router.push({
      pathname: '/communication/thread/[threadId]' as never,
      params: {
        threadId: thread.id,
        title: thread.title ?? 'Thread',
        threadType: thread.threadType,
        peerUserId: thread.directPeerUserId ?? undefined,
      },
    });
  }, []);

  const openThreadById = useCallback(
    (threadId: string) => {
      const thread = dataThreads.find((item) => item.id === threadId);
      if (thread) openThread(thread);
    },
    [dataThreads, openThread],
  );

  const openTextChannel = useCallback((channel: CommunicationChannel) => {
    if (!channel.threadId) return;
    router.push({
      pathname: '/communication/thread/[threadId]' as never,
      params: { threadId: channel.threadId, title: `#${channel.name}`, threadType: 'channel' },
    });
  }, []);

  const startDirectChat = useCallback(
    async (entry: UserChatEntry) => {
      if (entry.thread) return openThread(entry.thread);
      if (entry.requiresRequest) {
        setSelectedRequestTargetId(entry.id);
        return setActiveTab('requests');
      }
      setStartingUserId(entry.id);
      try {
        const created = await withAuth((token) =>
          createCommunicationThread(token, {
            threadType: 'direct',
            participantUserIds: [entry.id],
            title: entry.fullname,
          }),
        );
        notifySuccess('Chat thread created.');
        openThread(created);
        await loadData();
      } catch (error) {
        notifyError(
          'Chat start failed',
          error instanceof Error ? error.message : 'Unable to start direct chat',
        );
      } finally {
        setStartingUserId(null);
      }
    },
    [loadData, openThread, setActiveTab, setSelectedRequestTargetId, setStartingUserId, withAuth],
  );

  const submitChatRequest = useCallback(async () => {
    const target = requestableUsers.find((entry) => entry.id === selectedRequestTargetId);
    if (!target) {
      notifyError('Request target required', 'Select one user to request chat access.');
      return;
    }
    setIsSubmittingRequest(true);
    try {
      await withAuth((token) =>
        createCommunicationEngagementRequest(token, {
          targetUserId: target.id,
          reasonNote: requestReasonNote.trim() || null,
        }),
      );
      notifySuccess('Chat request sent.');
      setRequestReasonNote('');
      setSelectedRequestTargetId(null);
      await loadData();
    } catch (error) {
      notifyError(
        'Request failed',
        error instanceof Error ? error.message : 'Unable to submit chat request',
      );
    } finally {
      setIsSubmittingRequest(false);
    }
  }, [
    loadData,
    requestReasonNote,
    requestableUsers,
    selectedRequestTargetId,
    setIsSubmittingRequest,
    setRequestReasonNote,
    setSelectedRequestTargetId,
    withAuth,
  ]);

  const decideRequest = useCallback(
    async (requestId: string, approve: boolean) => {
      setDecidingRequestId(requestId);
      try {
        await withAuth((token) =>
          approve
            ? approveCommunicationEngagementRequest(token, { id: requestId })
            : declineCommunicationEngagementRequest(token, { id: requestId }),
        );
        notifySuccess(approve ? 'Request approved.' : 'Request declined.');
        await loadData();
      } catch (error) {
        notifyError(
          approve ? 'Approve failed' : 'Decline failed',
          error instanceof Error ? error.message : 'Unable to decide request',
        );
      } finally {
        setDecidingRequestId(null);
      }
    },
    [loadData, setDecidingRequestId, withAuth],
  );

  const joinVoice = useCallback(
    async (channel: CommunicationChannel) => {
      setJoiningChannelId(channel.id);
      try {
        const joined = await withAuth((token) =>
          joinCommunicationVoiceChannel(token, { channelId: channel.id }),
        );
        await withAuth((token) => markCommunicationChannelRead(token, { id: channel.id }));
        router.push({
          pathname: '/communication/voice/[channelId]' as never,
          params: {
            channelId: channel.id,
            name: channel.name,
            callId: joined.call.id,
            roomName: joined.livekit.roomName,
          },
        });
        await loadData();
      } catch (error) {
        notifyError(
          'Voice join failed',
          error instanceof Error ? error.message : 'Unable to join voice channel',
        );
      } finally {
        setJoiningChannelId(null);
      }
    },
    [loadData, setJoiningChannelId, withAuth],
  );

  const cycleNotificationMode = useCallback(
    async (channelId: string) => {
      const current = channelNotifModes[channelId] ?? 'all';
      const next: ChannelNotificationMode =
        current === 'all' ? 'mentions' : current === 'mentions' ? 'mute' : 'all';
      const merged = { ...channelNotifModes, [channelId]: next };
      setChannelNotifModes(merged);
      await saveChannelNotificationPrefs(merged);
    },
    [channelNotifModes, setChannelNotifModes],
  );

  const saveChannelSettings = useCallback(async () => {
    if (!editingChannelId) return;
    setUpdatingChannel(true);
    try {
      await withAuth((token) =>
        updateCommunicationChannel(token, {
          id: editingChannelId,
          name: editingChannelName.trim() || undefined,
          isArchived: editingArchive,
        }),
      );
      if (participantInput.trim()) {
        const ids = participantInput
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);
        if (ids.length) {
          await withAuth((token) =>
            addCommunicationChannelParticipants(token, {
              id: editingChannelId,
              participantUserIds: ids,
            }),
          );
        }
      }
      setParticipantInput('');
      await loadData();
    } catch (error) {
      notifyError(
        'Update channel failed',
        error instanceof Error ? error.message : 'Unable to update channel settings',
      );
    } finally {
      setUpdatingChannel(false);
    }
  }, [
    editingArchive,
    editingChannelId,
    editingChannelName,
    loadData,
    participantInput,
    setParticipantInput,
    setUpdatingChannel,
    withAuth,
  ]);

  return {
    openThread,
    openThreadById,
    openTextChannel,
    startDirectChat,
    submitChatRequest,
    decideRequest,
    joinVoice,
    cycleNotificationMode,
    saveChannelSettings,
  };
}
