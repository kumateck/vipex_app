import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { UserOption } from '@/features/users/api/users.api';
import {
  useCreateCommunicationMessageMutation,
  useUpdateCommunicationMessageMutation,
  type CommunicationMessage,
} from '../../../api/communication.api';
import type {
  ComposerMessageKind,
  MentionSuggestion,
} from '../types/communication-chat-thread-detail.types';
import {
  buildMentionLookup,
  buildMentionSuggestions,
  extractMentionsFromText,
  getActiveMentionQuery,
  getUserMentionHandles,
  normalizeMentionHandle,
} from '../utils/communication-chat-thread-detail-mentions';
import { asRecord } from '../utils/communication-chat-thread-detail-media';
import {
  getDisplayNameForUser,
  looksLikeInternalId,
} from '../utils/communication-chat-thread-detail-message';

type UseChatThreadComposerParams = {
  normalizedThreadId: string;
  userOptions: UserOption[];
  usersById: Map<string, { fullname?: string | null; email?: string | null }>;
  setTyping: (threadId: string, isTyping: boolean) => void;
  refetchMessages: () => void;
};

export function useChatThreadComposer({
  normalizedThreadId,
  userOptions,
  usersById,
  setTyping,
  refetchMessages,
}: UseChatThreadComposerParams) {
  const [newMessage, setNewMessage] = useState('');
  const [messageKind, setMessageKind] = useState<ComposerMessageKind>('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaLabel, setMediaLabel] = useState('');
  const [showMediaComposer, setShowMediaComposer] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<CommunicationMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<CommunicationMessage | null>(null);
  const [composerCaret, setComposerCaret] = useState(0);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  const composerInputRef = useRef<HTMLInputElement | null>(null);
  const composerTypingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [createMessage, { isLoading: isSendingMessage }] = useCreateCommunicationMessageMutation();
  const [updateMessage] = useUpdateCommunicationMessageMutation();

  const mentionLookup = useMemo(() => buildMentionLookup(userOptions), [userOptions]);
  const userIdByMentionHandle = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of userOptions) {
      const handles = getUserMentionHandles(user);
      for (const handle of handles) {
        if (!handle) continue;
        map.set(handle, user.id);
      }
    }
    return map;
  }, [userOptions]);

  const activeMentionQuery = useMemo(
    () => getActiveMentionQuery(newMessage, composerCaret),
    [composerCaret, newMessage],
  );

  const mentionSuggestions = useMemo(
    () => buildMentionSuggestions(userOptions, activeMentionQuery),
    [activeMentionQuery, userOptions],
  );

  const isMentionMenuOpen = Boolean(activeMentionQuery && mentionSuggestions.length);
  const isMediaMode = messageKind !== 'text';
  const canSendMessage = isMediaMode ? Boolean(mediaUrl.trim()) : Boolean(newMessage.trim());

  useEffect(() => {
    setActiveMentionIndex(0);
  }, [activeMentionQuery?.start, activeMentionQuery?.query]);

  useEffect(() => {
    return () => {
      if (composerTypingStopTimerRef.current) {
        clearTimeout(composerTypingStopTimerRef.current);
      }
    };
  }, []);

  const onMessageInputChange = (value: string) => {
    setNewMessage(value);
    if (!normalizedThreadId) return;
    setTyping(normalizedThreadId, value.trim().length > 0);
    if (composerTypingStopTimerRef.current) clearTimeout(composerTypingStopTimerRef.current);
    composerTypingStopTimerRef.current = setTimeout(() => {
      setTyping(normalizedThreadId, false);
    }, 1800);
  };

  const insertMentionSuggestion = (suggestion: MentionSuggestion) => {
    if (!activeMentionQuery) return;
    const prefix = newMessage.slice(0, activeMentionQuery.start);
    const suffix = newMessage.slice(activeMentionQuery.end);
    const insertion = `@${suggestion.insertHandle} `;
    const nextValue = `${prefix}${insertion}${suffix}`;
    const nextCaret = prefix.length + insertion.length;

    setNewMessage(nextValue);
    setComposerCaret(nextCaret);

    requestAnimationFrame(() => {
      const input = composerInputRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const onSendMessage = async () => {
    if (!normalizedThreadId || !canSendMessage) return;

    try {
      const trimmedBody = newMessage.trim();
      const trimmedMediaUrl = mediaUrl.trim();
      const mentionData = extractMentionsFromText(trimmedBody, mentionLookup);
      if (mentionData.mentionAll) {
        const shouldNotifyAll = window.confirm(
          'This message contains @everyone and will notify everyone in this chat. Continue?',
        );
        if (!shouldNotifyAll) return;
      } else if (mentionData.mentionedUserIds.length) {
        const mentionedLabels = mentionData.mentionedUserIds
          .slice(0, 5)
          .map((userId) => getDisplayNameForUser(usersById, userId));
        const shouldNotifyUsers = window.confirm(
          `This message will notify: ${mentionedLabels.join(', ')}${mentionData.mentionedUserIds.length > mentionedLabels.length ? ' and others' : ''}. Continue?`,
        );
        if (!shouldNotifyUsers) return;
      }

      const metadataJson = isMediaMode
        ? {
            url: trimmedMediaUrl,
            kind: messageKind,
            ...(mediaLabel.trim() ? { name: mediaLabel.trim() } : {}),
          }
        : null;

      if (editingMessage) {
        const existingMetadata = asRecord(editingMessage.metadataJson) ?? {};
        await updateMessage({
          id: editingMessage.id,
          threadId: normalizedThreadId,
          body: trimmedBody || null,
          metadataJson: {
            ...existingMetadata,
            ...(metadataJson ?? {}),
            mentionAll: mentionData.mentionAll,
            mentionedUserIds: mentionData.mentionedUserIds,
          },
        }).unwrap();
        setEditingMessage(null);
      } else {
        const replyMetadata = replyToMessage
          ? {
              replyTo: {
                id: replyToMessage.id,
                body: replyToMessage.body ?? '',
                sender: getDisplayNameForUser(usersById, replyToMessage.senderUserId),
                senderName: getDisplayNameForUser(usersById, replyToMessage.senderUserId),
                senderUserId: replyToMessage.senderUserId ?? null,
              },
              replyToBody: replyToMessage.body ?? '',
              replyToSender: getDisplayNameForUser(usersById, replyToMessage.senderUserId),
              replyToSenderName: getDisplayNameForUser(usersById, replyToMessage.senderUserId),
              replyToSenderUserId: replyToMessage.senderUserId ?? null,
            }
          : {};
        await createMessage({
          threadId: normalizedThreadId,
          body: trimmedBody || null,
          messageType: isMediaMode ? messageKind : 'text',
          metadataJson: {
            ...(metadataJson ?? {}),
            ...replyMetadata,
            mentionAll: mentionData.mentionAll,
            mentionedUserIds: mentionData.mentionedUserIds,
          },
          replyToMessageId: replyToMessage?.id ?? null,
        }).unwrap();
      }

      setNewMessage('');
      setMediaUrl('');
      setMediaLabel('');
      setReplyToMessage(null);
      setTyping(normalizedThreadId, false);
      refetchMessages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message.');
    }
  };

  const resolveMentionLabel = (handle: string) => {
    const normalized = normalizeMentionHandle(handle);
    if (!normalized) return 'unknown';
    if (normalized === 'everyone') return 'everyone';

    const userId = userIdByMentionHandle.get(normalized);
    if (userId) return getDisplayNameForUser(usersById, userId, 'unknown');

    if (looksLikeInternalId(normalized)) return 'unknown';
    return normalized;
  };

  const resolveReplySenderLabel = (replyPreview: {
    sender?: string;
    senderUserId?: string | null;
  }) => {
    if (replyPreview.senderUserId) {
      return getDisplayNameForUser(
        usersById,
        replyPreview.senderUserId,
        replyPreview.sender?.trim() || 'Unknown user',
      );
    }
    return replyPreview.sender?.trim() || 'Unknown user';
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isMentionMenuOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveMentionIndex((prev) => (prev + 1) % mentionSuggestions.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveMentionIndex((prev) => (prev <= 0 ? mentionSuggestions.length - 1 : prev - 1));
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        const suggestion = mentionSuggestions[activeMentionIndex] ?? mentionSuggestions[0];
        if (suggestion) insertMentionSuggestion(suggestion);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setComposerCaret(-1);
        return;
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void onSendMessage();
    }
  };

  return {
    newMessage,
    setNewMessage,
    messageKind,
    setMessageKind,
    mediaUrl,
    setMediaUrl,
    mediaLabel,
    setMediaLabel,
    showMediaComposer,
    setShowMediaComposer,
    replyToMessage,
    setReplyToMessage,
    editingMessage,
    setEditingMessage,
    composerCaret,
    setComposerCaret,
    activeMentionIndex,
    mentionSuggestions,
    isMentionMenuOpen,
    isMediaMode,
    canSendMessage,
    composerInputRef,
    onMessageInputChange,
    insertMentionSuggestion,
    onSendMessage,
    resolveMentionLabel,
    resolveReplySenderLabel,
    onInputKeyDown,
    isSendingMessage,
  };
}
