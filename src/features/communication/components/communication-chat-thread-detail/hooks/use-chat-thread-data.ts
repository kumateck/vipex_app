import { skipToken } from '@reduxjs/toolkit/query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import {
  useListCommunicationMessagesQuery,
  useListCommunicationCallsQuery,
  useListCommunicationThreadsQuery,
  useMarkCommunicationThreadReadMutation,
} from '../../../api/communication.api';
import { useCommunicationSocket } from '../../../hooks/use-communication-socket';

export function useChatThreadData({
  normalizedThreadId,
  currentUserId,
}: {
  normalizedThreadId: string;
  currentUserId: string;
}) {
  const [messageLimit, setMessageLimit] = useState(60);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [typingUserIdsByThread, setTypingUserIdsByThread] = useState<Record<string, string[]>>({});
  const [reactionMenuMessageId, setReactionMenuMessageId] = useState<string | null>(null);
  const [actionsMenuMessageId, setActionsMenuMessageId] = useState<string | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());

  const typingPresenceTimerByUserRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const preserveScrollOnPrependRef = useRef<{ top: number; height: number } | null>(null);
  const firstLoadDoneRef = useRef(false);
  const stickToBottomRef = useRef(true);

  const { data: userOptions = [] } = useListUserOptionsQuery();
  const { data: threads = [], refetch: refetchThreads } = useListCommunicationThreadsQuery();
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useListCommunicationMessagesQuery(
    normalizedThreadId ? { threadId: normalizedThreadId, limit: messageLimit } : skipToken,
  );
  const { data: threadCalls = [] } = useListCommunicationCallsQuery(
    normalizedThreadId ? { threadId: normalizedThreadId } : skipToken,
  );
  const [markThreadRead] = useMarkCommunicationThreadReadMutation();

  const { isConnected: isSocketConnected, setTyping } = useCommunicationSocket({
    onMessageCreated: (payload) => {
      refetchThreads();
      if (payload.threadId === normalizedThreadId) {
        refetchMessages();
      }
    },
    onTypingUpdated: ({ threadId: updatedThreadId, userId, isTyping }) => {
      const timerKey = `${updatedThreadId}:${userId}`;
      if (typingPresenceTimerByUserRef.current[timerKey]) {
        clearTimeout(typingPresenceTimerByUserRef.current[timerKey]);
        delete typingPresenceTimerByUserRef.current[timerKey];
      }

      setTypingUserIdsByThread((prev) => {
        const current = new Set(prev[updatedThreadId] ?? []);
        if (isTyping) current.add(userId);
        else current.delete(userId);
        return { ...prev, [updatedThreadId]: [...current] };
      });

      if (isTyping) {
        typingPresenceTimerByUserRef.current[timerKey] = setTimeout(() => {
          setTypingUserIdsByThread((prev) => {
            const current = new Set(prev[updatedThreadId] ?? []);
            current.delete(userId);
            return { ...prev, [updatedThreadId]: [...current] };
          });
          delete typingPresenceTimerByUserRef.current[timerKey];
        }, 3500);
      }
    },
  });

  useEffect(() => {
    setMessageLimit(60);
    setIsLoadingOlder(false);
    preserveScrollOnPrependRef.current = null;
    firstLoadDoneRef.current = false;
    stickToBottomRef.current = true;
  }, [normalizedThreadId]);

  useEffect(() => {
    return () => {
      const timers = typingPresenceTimerByUserRef.current;
      for (const key of Object.keys(timers)) {
        clearTimeout(timers[key]);
      }
      typingPresenceTimerByUserRef.current = {};
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === normalizedThreadId) ?? null,
    [normalizedThreadId, threads],
  );

  const usersById = useMemo(
    () => new Map(userOptions.map((user) => [user.id, user])),
    [userOptions],
  );

  const typingUserLabels = useMemo(() => {
    const typingUserIds = typingUserIdsByThread[normalizedThreadId] ?? [];
    return typingUserIds
      .filter((userId) => userId !== currentUserId)
      .map(
        (userId) =>
          usersById.get(userId)?.fullname ?? usersById.get(userId)?.email ?? 'Unknown user',
      )
      .slice(0, 3);
  }, [currentUserId, normalizedThreadId, typingUserIdsByThread, usersById]);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    const preserve = preserveScrollOnPrependRef.current;
    if (preserve) {
      const nextTop = viewport.scrollHeight - preserve.height + preserve.top;
      viewport.scrollTop = nextTop;
      preserveScrollOnPrependRef.current = null;
      setIsLoadingOlder(false);
      return;
    }

    if (!firstLoadDoneRef.current || stickToBottomRef.current) {
      viewport.scrollTop = viewport.scrollHeight;
      firstLoadDoneRef.current = true;
    }
  }, [messages.length, typingUserLabels.length]);

  useEffect(() => {
    if (!isLoadingMessages && isLoadingOlder && !preserveScrollOnPrependRef.current) {
      setIsLoadingOlder(false);
    }
  }, [isLoadingMessages, isLoadingOlder]);

  useEffect(() => {
    if (!normalizedThreadId || isLoadingMessages || !messages.length) return;
    void markThreadRead({ threadId: normalizedThreadId });
  }, [isLoadingMessages, markThreadRead, messages.length, normalizedThreadId]);

  const onMessagesScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceToBottom < 80;

    const hasMoreOlderMessages = messages.length >= messageLimit;
    if (!hasMoreOlderMessages || isLoadingOlder || isLoadingMessages) return;
    if (el.scrollTop > 72) return;

    preserveScrollOnPrependRef.current = {
      top: el.scrollTop,
      height: el.scrollHeight,
    };
    setIsLoadingOlder(true);
    setMessageLimit((prev) => prev + 40);
  };

  return {
    userOptions,
    selectedThread,
    usersById,
    messages,
    isLoadingMessages,
    refetchMessages,
    threadCalls,
    isSocketConnected,
    setTyping,
    typingUserLabels,
    messagesViewportRef,
    onMessagesScroll,
    isLoadingOlder,
    nowTs,
    reactionMenuMessageId,
    setReactionMenuMessageId,
    actionsMenuMessageId,
    setActionsMenuMessageId,
  };
}
