import { useEffect, useRef, useState } from 'react';
import { useCommunicationSocket } from '@/features/communication/hooks/use-communication-socket';

type UseCommunicationActivityStateInput = {
  currentUserId: string | null;
};

export function useCommunicationActivityState({
  currentUserId,
}: UseCommunicationActivityStateInput) {
  const [typingUserIdsByThread, setTypingUserIdsByThread] = useState<Record<string, string[]>>({});
  const [draftByThreadId, setDraftByThreadId] = useState<Record<string, string>>({});
  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hydrateDrafts = () => {
      const next: Record<string, string> = {};
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (!key || !key.startsWith('communication:draft:')) continue;
        const threadId = key.replace('communication:draft:', '');
        const value = window.localStorage.getItem(key);
        if (threadId && value?.trim()) next[threadId] = value.trim();
      }
      setDraftByThreadId(next);
    };

    const onStorage = (event: StorageEvent) => {
      if (!event.key || !event.key.startsWith('communication:draft:')) return;
      hydrateDrafts();
    };

    hydrateDrafts();
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useCommunicationSocket({
    onTypingUpdated: ({ threadId, userId, isTyping }) => {
      if (userId === currentUserId) return;

      const timerKey = `${threadId}:${userId}`;
      const timers = typingTimersRef.current;
      if (timers[timerKey]) {
        clearTimeout(timers[timerKey]);
        delete timers[timerKey];
      }

      setTypingUserIdsByThread((prev) => {
        const current = new Set(prev[threadId] ?? []);
        if (isTyping) current.add(userId);
        else current.delete(userId);
        return { ...prev, [threadId]: [...current] };
      });

      if (isTyping) {
        timers[timerKey] = setTimeout(() => {
          setTypingUserIdsByThread((prev) => {
            const current = new Set(prev[threadId] ?? []);
            current.delete(userId);
            return { ...prev, [threadId]: [...current] };
          });
          delete timers[timerKey];
        }, 2200);
      }
    },
  });

  useEffect(() => {
    return () => {
      for (const timer of Object.values(typingTimersRef.current)) {
        clearTimeout(timer);
      }
      typingTimersRef.current = {};
    };
  }, []);

  return {
    typingUserIdsByThread,
    draftByThreadId,
  };
}
