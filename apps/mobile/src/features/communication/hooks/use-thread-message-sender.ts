import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { createCommunicationMessage } from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import {
  enqueuePendingThreadMessage,
  loadPendingThreadQueue,
} from '@mobile/lib/communication-local';
import { extractMentionsFromText } from '@mobile/features/communication/utils/thread-mentions';
import { extractHttpStatus } from '@mobile/features/communication/utils/thread-identity';
import type { CommunicationMessage } from '@mobile/types/communication';

type ThreadMessage = CommunicationMessage & { _optimistic?: boolean; _failed?: boolean };

type MentionLookup = Map<string, string>;

type SendMessageParams = {
  currentUserId: string | null;
  dedupeMessages: (entries: ThreadMessage[]) => ThreadMessage[];
  loadMessages: () => Promise<void>;
  mentionLookup: MentionLookup;
  replyToMessage: ThreadMessage | null;
  text: string;
  threadId: string;
  usersById: Map<string, { fullname?: string | null; email?: string | null }>;
  withAuth: <T>(run: (token: string) => Promise<T>) => Promise<T>;
  setSending: (value: boolean) => void;
  setText: (value: string) => void;
  setReplyToMessage: (message: ThreadMessage | null) => void;
  setMessages: (updater: (prev: ThreadMessage[]) => ThreadMessage[]) => void;
  setPendingQueueCount: (value: number) => void;
  setShowActions: (updater: (prev: boolean) => boolean) => void;
};

export function useThreadMessageSender({
  currentUserId,
  dedupeMessages,
  loadMessages,
  mentionLookup,
  replyToMessage,
  text,
  threadId,
  usersById,
  withAuth,
  setSending,
  setText,
  setReplyToMessage,
  setMessages,
  setPendingQueueCount,
  setShowActions,
}: SendMessageParams) {
  return useCallback(async () => {
    const body = text.trim();
    if (!threadId || !body) return;

    const mentionData = extractMentionsFromText(body, mentionLookup);
    if (mentionData.mentionAll) {
      const proceed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Mention everyone?',
          'This message contains @everyone and will notify everyone in this chat.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Send', onPress: () => resolve(true) },
          ],
        );
      });
      if (!proceed) return;
    }

    const isReplyFromCurrentUser =
      Boolean(currentUserId) && replyToMessage?.senderUserId === currentUserId;
    const replySenderName = isReplyFromCurrentUser
      ? 'You'
      : replyToMessage?.senderUserId
        ? usersById.get(replyToMessage.senderUserId)?.fullname?.trim() ||
          usersById.get(replyToMessage.senderUserId)?.email?.trim() ||
          replyToMessage.senderName?.trim() ||
          'Unknown user'
        : replyToMessage?.senderName?.trim() || 'Unknown user';

    const replyMetadata = replyToMessage
      ? {
          replyTo: {
            id: replyToMessage.id,
            body: replyToMessage.body ?? '',
            sender: replySenderName,
            senderName: replySenderName,
            senderUserId: replyToMessage.senderUserId ?? null,
          },
          replyToBody: replyToMessage.body ?? '',
          replyToSender: replySenderName,
          replyToSenderName: replySenderName,
          replyToSenderUserId: replyToMessage.senderUserId ?? null,
        }
      : {};

    const metadataPayload = {
      ...replyMetadata,
      mentionAll: mentionData.mentionAll,
      mentionedUserIds: mentionData.mentionedUserIds,
    };

    const tempId = `temp-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const optimistic: ThreadMessage = {
      id: tempId,
      threadId,
      senderUserId: currentUserId,
      messageType: 'text',
      body,
      metadataJson: metadataPayload,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
      _optimistic: true,
      _failed: false,
    };

    setSending(true);
    setText('');
    setReplyToMessage(null);
    setMessages((prev) => dedupeMessages([...prev, optimistic]));

    try {
      const created = await withAuth((token) =>
        createCommunicationMessage(token, {
          threadId,
          body,
          replyToMessageId: replyToMessage?.id ?? null,
          metadataJson: metadataPayload,
        }),
      );
      setMessages((prev) =>
        dedupeMessages(prev.map((item) => (item.id === tempId ? created : item))),
      );
    } catch (error) {
      setMessages((prev) =>
        dedupeMessages(
          prev.map((item) => (item.id === tempId ? { ...item, _failed: true } : item)),
        ),
      );
      await enqueuePendingThreadMessage(threadId, {
        tempId,
        body,
        createdAt: new Date().toISOString(),
        metadataJson: metadataPayload,
        replyToMessageId: replyToMessage?.id ?? null,
      });
      const queued = await loadPendingThreadQueue(threadId);
      setPendingQueueCount(queued.length);
      const status = extractHttpStatus(error);
      const suffix =
        status === 401
          ? ' Session expired. Please sign in again.'
          : status === 403
            ? ' You may not have permission for this thread.'
            : '';
      notifyError(
        'Send failed',
        `${getMobileErrorMessage(error, '') || 'Unable to send message'}${suffix}`,
      );
      void loadMessages();
    } finally {
      setSending(false);
      setShowActions((prev) => (prev ? false : prev));
    }
  }, [
    currentUserId,
    dedupeMessages,
    loadMessages,
    mentionLookup,
    replyToMessage,
    setMessages,
    setPendingQueueCount,
    setReplyToMessage,
    setSending,
    setShowActions,
    setText,
    text,
    threadId,
    usersById,
    withAuth,
  ]);
}
