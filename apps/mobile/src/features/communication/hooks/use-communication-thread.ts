import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  createCommunicationMessage,
  listCommunicationMessages,
  listMobileUserOptions,
  markCommunicationThreadRead,
} from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import type { CommunicationMessage, MobileUserOption } from '@mobile/types/communication';
import { useCommunicationSocket } from '@mobile/features/communication/use-communication-socket';
import {
  loadPendingThreadQueue,
  loadThreadMessageCache,
  removePendingThreadMessage,
  saveThreadMessageCache,
} from '@mobile/lib/communication-local';
import {
  buildMentionLookup,
  extractActiveMention,
  normalizeMentionHandle,
} from '@mobile/features/communication/utils/thread-mentions';
import {
  buildCurrentUserIdentitySet,
  normalizeIdentity,
  resolveDirectThreadTitle,
} from '@mobile/features/communication/utils/thread-identity';
import { useThreadMessageSender } from '@mobile/features/communication/hooks/use-thread-message-sender';
type ThreadMessage = CommunicationMessage & { _optimistic?: boolean; _failed?: boolean };
export function useCommunicationThread() {
  const { withAuth, session } = useAuth();
  const params = useLocalSearchParams<{
    threadId?: string;
    title?: string;
    threadType?: string;
    peerUserId?: string;
  }>();
  const threadId = (params.threadId ?? '').trim();
  const routeTitle = typeof params.title === 'string' ? params.title : 'Chat';
  const threadType = typeof params.threadType === 'string' ? params.threadType.toLowerCase() : '';
  const peerUserId = typeof params.peerUserId === 'string' ? params.peerUserId.trim() : '';
  const showSenderNames =
    threadType === 'group' || threadType === 'channel' || routeTitle.startsWith('#');
  const currentUserId = session.user?.sub ?? null;
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [replyToMessage, setReplyToMessage] = useState<ThreadMessage | null>(null);
  const [userOptions, setUserOptions] = useState<MobileUserOption[]>([]);
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [_pendingQueueCount, setPendingQueueCount] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [typingByUserId, setTypingByUserId] = useState<Record<string, boolean>>({});
  const typingTimerByUserRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const usersById = useMemo(
    () => new Map(userOptions.map((user) => [user.id, user])),
    [userOptions],
  );
  const currentUserIdentitySet = useMemo(
    () =>
      buildCurrentUserIdentitySet({
        currentUserSub: session.user?.sub,
        currentUserFullname: session.user?.fullname,
        currentUserEmail: session.user?.email,
        userOptions,
      }),
    [session.user?.email, session.user?.fullname, session.user?.sub, userOptions],
  );
  const mentionLookup = useMemo(() => buildMentionLookup(userOptions), [userOptions]);
  const activeMention = useMemo(
    () => extractActiveMention(text, selection.start),
    [selection.start, text],
  );
  const mentionSuggestions = useMemo(() => {
    if (!activeMention) return [];
    const query = normalizeMentionHandle(activeMention.query);
    const filtered = userOptions.filter((user) => {
      if (!query) return true;
      const full = normalizeMentionHandle(user.fullname);
      const first = normalizeMentionHandle(user.fullname.split(/\s+/)[0] ?? '');
      const emailPrefix = normalizeMentionHandle(user.email.split('@')[0] ?? '');
      return full.includes(query) || first.includes(query) || emailPrefix.includes(query);
    });
    return filtered.slice(0, 6);
  }, [activeMention, userOptions]);
  const dedupeMessages = useCallback((entries: ThreadMessage[]) => {
    const seen = new Set<string>();
    const deduped: ThreadMessage[] = [];
    for (const entry of entries) {
      if (!entry?.id) continue;
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      deduped.push(entry);
    }
    return deduped;
  }, []);
  const loadMessages = useCallback(async () => {
    if (!threadId) return;
    const cached = await loadThreadMessageCache(threadId);
    if (cached.length) {
      setMessages(dedupeMessages(cached));
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const [nextMessages, users] = await withAuth(async (token) =>
        Promise.all([
          listCommunicationMessages(token, { threadId, limit: 200 }),
          listMobileUserOptions(token),
        ]),
      );
      setMessages(dedupeMessages(nextMessages));
      await saveThreadMessageCache(threadId, nextMessages);
      setUserOptions(users);
      await withAuth((token) => markCommunicationThreadRead(token, { threadId }));
      const queued = await loadPendingThreadQueue(threadId);
      setPendingQueueCount(queued.length);
    } catch (error) {
      notifyError(
        'Chat load failed',
        error instanceof Error ? error.message : 'Unable to load thread messages',
      );
    } finally {
      setLoading(false);
    }
  }, [dedupeMessages, threadId, withAuth]);
  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);
  const { isConnected, setTyping } = useCommunicationSocket(session.accessToken, {
    onMessageCreated: (payload) => {
      if (payload.threadId !== threadId) return;
      setMessages((prev) =>
        prev.some((item) => item.id === payload.id) ? prev : dedupeMessages([...prev, payload]),
      );
      void loadMessages();
      if (payload.senderUserId && payload.senderUserId !== currentUserId) {
        void withAuth((token) => markCommunicationThreadRead(token, { threadId })).catch(() => {
          // Ignore background read-sync errors to avoid unhandled promise noise.
        });
      }
    },
    onTypingUpdated: (payload) => {
      if (payload.threadId !== threadId) return;
      const senderIdentity = normalizeIdentity(payload.userId);
      if (senderIdentity && currentUserIdentitySet.has(senderIdentity)) return;
      const key = senderIdentity || payload.userId;
      if (key && typingTimerByUserRef.current[key]) {
        clearTimeout(typingTimerByUserRef.current[key]);
        delete typingTimerByUserRef.current[key];
      }
      setTypingByUserId((prev) => ({ ...prev, [payload.userId]: payload.isTyping }));
      if (payload.isTyping && key) {
        typingTimerByUserRef.current[key] = setTimeout(() => {
          setTypingByUserId((prev) => ({ ...prev, [payload.userId]: false }));
          delete typingTimerByUserRef.current[key];
        }, 3500);
      }
    },
  });
  useEffect(
    () => () => {
      for (const timer of Object.values(typingTimerByUserRef.current)) {
        clearTimeout(timer);
      }
      typingTimerByUserRef.current = {};
    },
    [],
  );
  const flushPendingQueue = useCallback(async () => {
    if (!threadId) return;
    const queue = await loadPendingThreadQueue(threadId);
    if (!queue.length) return;
    for (const pending of queue) {
      try {
        const created = await withAuth((token) =>
          createCommunicationMessage(token, {
            threadId,
            body: pending.body,
            replyToMessageId: pending.replyToMessageId ?? null,
            metadataJson:
              pending.metadataJson && typeof pending.metadataJson === 'object'
                ? (pending.metadataJson as Record<string, unknown>)
                : null,
          }),
        );
        setMessages((prev) =>
          dedupeMessages(prev.map((item) => (item.id === pending.tempId ? created : item))),
        );
        await removePendingThreadMessage(threadId, pending.tempId);
      } catch {
        break;
      }
    }
    const latest = await loadPendingThreadQueue(threadId);
    if (!latest.length) return;
  }, [dedupeMessages, threadId, withAuth]);
  useEffect(() => {
    if (!isConnected) return;
    void flushPendingQueue();
  }, [flushPendingQueue, isConnected]);
  useEffect(() => {
    if (!threadId) return;
    const typing = text.trim().length > 0;
    setTyping(threadId, typing);
    return () => setTyping(threadId, false);
  }, [setTyping, text, threadId]);
  useEffect(() => {
    if (!threadId) return;
    const compact = messages.map((message) => ({
      id: message.id,
      threadId: message.threadId,
      senderUserId: message.senderUserId,
      messageType: message.messageType,
      body: message.body,
      metadataJson: message.metadataJson,
      createdAt: message.createdAt,
      editedAt: message.editedAt ?? null,
      deletedAt: message.deletedAt ?? null,
    }));
    void saveThreadMessageCache(threadId, compact);
  }, [messages, threadId]);
  const onSend = useThreadMessageSender({
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
  });
  const insertMention = useCallback(
    (user: MobileUserOption | 'everyone') => {
      const active = extractActiveMention(text, selection.start);
      if (!active) return;
      const handle =
        user === 'everyone'
          ? 'everyone'
          : normalizeMentionHandle(
              user.email.split('@')[0] ?? user.fullname.split(/\s+/)[0] ?? 'user',
            );
      const next = text.slice(0, active.startIndex) + handle + ' ' + text.slice(active.endIndex);
      setText(next);
      const caret = active.startIndex + handle.length + 1;
      setSelection({ start: caret, end: caret });
    },
    [selection.start, text],
  );
  const isMyMessage = useCallback(
    (message: ThreadMessage) => {
      if (message._optimistic) return true;
      const sender = normalizeIdentity(message.senderUserId);
      if (!sender) return false;
      return currentUserIdentitySet.has(sender);
    },
    [currentUserIdentitySet],
  );
  const participantCount = useMemo(() => {
    const ids = new Set<string>();
    if (currentUserId) ids.add(currentUserId);
    messages.forEach((message) => {
      const sender = normalizeIdentity(message.senderUserId);
      if (sender) ids.add(sender);
    });
    return Math.max(1, ids.size);
  }, [currentUserId, messages]);
  const typingUsers = useMemo(
    () => [
      ...new Set(
        Object.entries(typingByUserId)
          .filter(([, typing]) => typing)
          .map(([userId]) => usersById.get(userId)?.fullname?.trim() || 'Someone'),
      ),
    ],
    [typingByUserId, usersById],
  );
  const title = useMemo(
    () =>
      threadType === 'direct'
        ? resolveDirectThreadTitle({
            routeTitle,
            messages,
            usersById,
            directPeerUserId: peerUserId || null,
            currentUserIdentitySet,
            currentUserSub: session.user?.sub,
            currentUserFullname: session.user?.fullname,
            currentUserEmail: session.user?.email,
          })
        : routeTitle,
    [
      messages,
      peerUserId,
      routeTitle,
      currentUserIdentitySet,
      session.user?.email,
      session.user?.fullname,
      session.user?.sub,
      threadType,
      usersById,
    ],
  );
  return {
    title,
    isDirectThread: threadType === 'direct',
    loading,
    sending,
    text,
    setText,
    replyToMessage,
    setReplyToMessage,
    messages,
    userOptions,
    usersById,
    selection,
    setSelection,
    showActions,
    setShowActions,
    activeMention,
    mentionSuggestions,
    isSocketConnected: isConnected,
    loadMessages,
    onSend,
    insertMention,
    currentUserId,
    isMyMessage,
    showSenderNames,
    participantCount,
    typingUsers,
  };
}
