import { useMemo } from 'react';
import type { UserOption } from '@/features/users/api/users.api';
import type {
  CommunicationCallSession,
  CommunicationChannel,
  CommunicationChannelUnreadCount,
  CommunicationThread,
  CommunicationUnreadCount,
} from '../../../api/communication.api';
import type { UserTransferItem } from '../types/communication-chat.types';

type UseCommunicationChatDerivedDataArgs = {
  threads: CommunicationThread[];
  textChannels: CommunicationChannel[];
  activeCalls: CommunicationCallSession[];
  unreadCounts: CommunicationUnreadCount[];
  voiceUnreadCounts: CommunicationChannelUnreadCount[];
  userOptions: UserOption[];
};

export function useCommunicationChatDerivedData({
  threads,
  textChannels,
  activeCalls,
  unreadCounts,
  voiceUnreadCounts,
  userOptions,
}: UseCommunicationChatDerivedDataArgs) {
  const userLabelById = useMemo(
    () =>
      new Map(
        userOptions.map((option) => [option.id, option.fullname || option.email || option.id]),
      ),
    [userOptions],
  );

  const allUserTransferItems = useMemo<UserTransferItem[]>(
    () =>
      userOptions.map((option) => ({
        id: option.id,
        label: option.fullname || option.email || option.id,
        subLabel: option.email,
      })),
    [userOptions],
  );

  const directThreads = useMemo(
    () => threads.filter((thread) => thread.threadType === 'direct'),
    [threads],
  );

  const textChannelThreadIds = useMemo(() => {
    const ids = textChannels
      .map((channel) => channel.threadId)
      .filter((id): id is string => Boolean(id));
    return new Set(ids);
  }, [textChannels]);

  const groupThreads = useMemo(
    () =>
      threads.filter(
        (thread) =>
          thread.threadType === 'group' ||
          (thread.threadType === 'channel' && !textChannelThreadIds.has(thread.id)),
      ),
    [textChannelThreadIds, threads],
  );

  const activeCallByChannelId = useMemo(() => {
    const map = new Map<string, CommunicationCallSession>();
    for (const call of activeCalls) {
      if (!call.channelId) continue;
      const existing = map.get(call.channelId);
      const existingTime = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      const currentTime = call.updatedAt ? new Date(call.updatedAt).getTime() : 0;
      if (!existing || currentTime >= existingTime) {
        map.set(call.channelId, call);
      }
    }
    return map;
  }, [activeCalls]);

  const { unreadByThreadId, mentionsByThreadId, voiceUnreadByChannelId, voiceMentionsByChannelId } =
    useMemo(
      () => ({
        unreadByThreadId: new Map(unreadCounts.map((item) => [item.threadId, item.unreadCount])),
        mentionsByThreadId: new Map(unreadCounts.map((item) => [item.threadId, item.mentionCount])),
        voiceUnreadByChannelId: new Map(
          voiceUnreadCounts.map((item) => [item.channelId, item.unreadCount]),
        ),
        voiceMentionsByChannelId: new Map(
          voiceUnreadCounts.map((item) => [item.channelId, item.mentionCount]),
        ),
      }),
      [unreadCounts, voiceUnreadCounts],
    );

  return {
    userLabelById,
    allUserTransferItems,
    directThreads,
    groupThreads,
    activeCallByChannelId,
    unreadByThreadId,
    mentionsByThreadId,
    voiceUnreadByChannelId,
    voiceMentionsByChannelId,
  };
}
