import {
  createCommunicationMessage,
  listCommunicationMessages,
  listMobileUserOptions,
  markCommunicationThreadRead,
} from '@mobile/lib/api';
import {
  loadPendingThreadQueue,
  loadThreadMessageCache,
  removePendingThreadMessage,
  saveThreadMessageCache,
} from '@mobile/lib/communication-local';
import type { CommunicationMessage, MobileUserOption } from '@mobile/types/communication';
import type { Dispatch, SetStateAction } from 'react';

type ThreadMessage = CommunicationMessage & { _optimistic?: boolean; _failed?: boolean };

export async function loadThreadData(input: {
  threadId: string;
  withAuth: <T>(run: (token: string) => Promise<T>) => Promise<T>;
  dedupeMessages: (entries: ThreadMessage[]) => ThreadMessage[];
  setMessages: Dispatch<SetStateAction<ThreadMessage[]>>;
  setUserOptions: Dispatch<SetStateAction<MobileUserOption[]>>;
  setPendingQueueCount: Dispatch<SetStateAction<number>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
}) {
  const {
    threadId,
    withAuth,
    dedupeMessages,
    setMessages,
    setUserOptions,
    setPendingQueueCount,
    setLoading,
  } = input;
  if (!threadId) return;
  const cached = await loadThreadMessageCache(threadId);
  if (cached.length) {
    setMessages(dedupeMessages(cached));
    setLoading(false);
  } else {
    setLoading(true);
  }

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
}

export async function flushThreadPendingQueue(input: {
  threadId: string;
  withAuth: <T>(run: (token: string) => Promise<T>) => Promise<T>;
  dedupeMessages: (entries: ThreadMessage[]) => ThreadMessage[];
  setMessages: Dispatch<SetStateAction<ThreadMessage[]>>;
}) {
  const { threadId, withAuth, dedupeMessages, setMessages } = input;
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
}
