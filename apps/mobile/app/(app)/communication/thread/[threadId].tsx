import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import {
  createCommunicationMessage,
  listCommunicationMessages,
  listMobileUserOptions,
  markCommunicationThreadRead,
} from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { CommunicationMessage, MobileUserOption } from '@mobile/types/communication';
import { useCommunicationSocket } from '@mobile/features/communication/use-communication-socket';
import { ChatBubble } from '@mobile/components/courier';
import {
  enqueuePendingThreadMessage,
  loadPendingThreadQueue,
  loadThreadMessageCache,
  removePendingThreadMessage,
  saveThreadMessageCache,
} from '@mobile/lib/communication-local';
import { AppButton, AppCard, AppInput, AppSkeletonCard } from '@/components/ui/mobile';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

function normalizeMentionHandle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
}

function getUserMentionHandles(user: MobileUserOption) {
  const handles = new Set<string>();
  handles.add(normalizeMentionHandle(user.id));
  const emailPrefix = user.email.split('@')[0] ?? '';
  if (emailPrefix) handles.add(normalizeMentionHandle(emailPrefix));
  const full = normalizeMentionHandle(user.fullname.replace(/\s+/g, ''));
  if (full) handles.add(full);
  const first = normalizeMentionHandle(user.fullname.split(/\s+/)[0] ?? '');
  if (first) handles.add(first);
  return [...handles].filter(Boolean);
}

function buildMentionLookup(users: MobileUserOption[]) {
  const map = new Map<string, string>();
  for (const user of users) {
    for (const handle of getUserMentionHandles(user)) {
      if (!map.has(handle)) map.set(handle, user.id);
    }
  }
  return map;
}

function extractMentionsFromText(text: string, mentionLookup: Map<string, string>) {
  const mentionedUserIds = new Set<string>();
  let mentionAll = false;
  const regex = /(^|\s)@([a-zA-Z0-9._-]+)/g;
  let match = regex.exec(text);
  while (match) {
    const token = normalizeMentionHandle(match[2] ?? '');
    if (token === 'everyone') {
      mentionAll = true;
    } else {
      const userId = mentionLookup.get(token);
      if (userId) mentionedUserIds.add(userId);
    }
    match = regex.exec(text);
  }
  return { mentionAll, mentionedUserIds: [...mentionedUserIds] };
}

function formatTime(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

function extractActiveMention(
  value: string,
  cursor: number,
): { query: string; startIndex: number; endIndex: number } | null {
  const safeCursor = Math.max(0, Math.min(cursor, value.length));
  const left = value.slice(0, safeCursor);
  const match = left.match(/(^|\s)@([a-zA-Z0-9._-]*)$/);
  if (!match) return null;
  const token = match[2] ?? '';
  const atIndex = left.lastIndexOf('@');
  if (atIndex < 0) return null;
  return { query: token, startIndex: atIndex + 1, endIndex: safeCursor };
}

export default function MobileCommunicationThreadScreen() {
  const { theme } = useAppearance();
  const { withAuth, session } = useAuth();
  const params = useLocalSearchParams<{ threadId?: string; title?: string }>();
  const threadId = (params.threadId ?? '').trim();
  const title = typeof params.title === 'string' ? params.title : 'Chat Thread';
  const currentUserId = session.user?.sub ?? null;

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<
    Array<CommunicationMessage & { _optimistic?: boolean; _failed?: boolean }>
  >([]);
  const [userOptions, setUserOptions] = useState<MobileUserOption[]>([]);
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [pendingQueueCount, setPendingQueueCount] = useState(0);

  const usersById = useMemo(
    () => new Map(userOptions.map((user) => [user.id, user])),
    [userOptions],
  );
  const mentionLookup = useMemo(() => buildMentionLookup(userOptions), [userOptions]);
  const activeMention = useMemo(
    () => extractActiveMention(text, selection.start),
    [selection.start, text],
  );
  const mentionSuggestions = useMemo(() => {
    if (!activeMention) return [];
    const q = normalizeMentionHandle(activeMention.query);
    const pool = userOptions.filter((user) => {
      if (!q) return true;
      const full = normalizeMentionHandle(user.fullname);
      const first = normalizeMentionHandle(user.fullname.split(/\s+/)[0] ?? '');
      const emailPrefix = normalizeMentionHandle(user.email.split('@')[0] ?? '');
      return full.includes(q) || first.includes(q) || emailPrefix.includes(q);
    });
    return pool.slice(0, 6);
  }, [activeMention, userOptions]);

  const loadMessages = useCallback(async () => {
    if (!threadId) return;
    const cached = await loadThreadMessageCache(threadId);
    if (cached.length) {
      setMessages(cached);
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
      setMessages((prev) => {
        const failedOptimistic = prev.filter((item) => item._optimistic && item._failed);
        const merged = [...nextMessages];
        for (const failed of failedOptimistic) {
          if (!merged.some((item) => item.id === failed.id)) {
            merged.push(failed);
          }
        }
        return merged;
      });
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
  }, [threadId, withAuth]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const { isConnected: isSocketConnected, setTyping } = useCommunicationSocket(
    session.accessToken,
    {
      onMessageCreated: (payload) => {
        if (payload.threadId !== threadId) return;
        setMessages((prev) => {
          if (prev.some((item) => item.id === payload.id)) return prev;
          return [...prev, payload];
        });
        if (payload.senderUserId && payload.senderUserId !== currentUserId) {
          void withAuth((token) => markCommunicationThreadRead(token, { threadId }));
        }
      },
    },
  );

  const flushPendingQueue = useCallback(async () => {
    if (!threadId) return;
    const queue = await loadPendingThreadQueue(threadId);
    if (!queue.length) {
      setPendingQueueCount(0);
      return;
    }
    setPendingQueueCount(queue.length);
    for (const pending of queue) {
      try {
        const created = await withAuth((token) =>
          createCommunicationMessage(token, {
            threadId,
            body: pending.body,
            metadataJson:
              pending.metadataJson && typeof pending.metadataJson === 'object'
                ? (pending.metadataJson as Record<string, unknown>)
                : null,
          }),
        );
        setMessages((prev) => prev.map((item) => (item.id === pending.tempId ? created : item)));
        await removePendingThreadMessage(threadId, pending.tempId);
      } catch {
        break;
      }
    }
    const latestQueue = await loadPendingThreadQueue(threadId);
    setPendingQueueCount(latestQueue.length);
  }, [threadId, withAuth]);

  useEffect(() => {
    if (!isSocketConnected) return;
    void flushPendingQueue();
  }, [flushPendingQueue, isSocketConnected]);

  useEffect(() => {
    if (!threadId) return;
    const isTyping = text.trim().length > 0;
    setTyping(threadId, isTyping);
    return () => {
      setTyping(threadId, false);
    };
  }, [setTyping, text, threadId]);

  useEffect(() => {
    if (!threadId) return;
    const serializable = messages.map((message) => ({
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
    void saveThreadMessageCache(threadId, serializable);
  }, [messages, threadId]);

  const onSend = async () => {
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
    } else if (mentionData.mentionedUserIds.length) {
      const labels = mentionData.mentionedUserIds
        .map((id) => usersById.get(id)?.fullname || usersById.get(id)?.email)
        .filter(Boolean)
        .slice(0, 3);
      const proceed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Send with mentions?',
          `This message will notify: ${labels.join(', ')}${mentionData.mentionedUserIds.length > labels.length ? ' and others' : ''}.`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Send', onPress: () => resolve(true) },
          ],
        );
      });
      if (!proceed) return;
    }

    const tempId = `temp-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const optimisticMessage: CommunicationMessage & { _optimistic?: boolean; _failed?: boolean } = {
      id: tempId,
      threadId,
      senderUserId: currentUserId,
      messageType: 'text',
      body,
      metadataJson: {
        mentionAll: mentionData.mentionAll,
        mentionedUserIds: mentionData.mentionedUserIds,
      },
      createdAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
      _optimistic: true,
      _failed: false,
    };

    setSending(true);
    setText('');
    setMessages((prev) => [...prev, optimisticMessage]);
    try {
      const created = await withAuth((token) =>
        createCommunicationMessage(token, {
          threadId,
          body,
          metadataJson: {
            mentionAll: mentionData.mentionAll,
            mentionedUserIds: mentionData.mentionedUserIds,
          },
        }),
      );
      setMessages((prev) => prev.map((item) => (item.id === tempId ? created : item)));
    } catch (error) {
      setMessages((prev) =>
        prev.map((item) => (item.id === tempId ? { ...item, _failed: true } : item)),
      );
      await enqueuePendingThreadMessage(threadId, {
        tempId,
        body,
        createdAt: new Date().toISOString(),
        metadataJson: {
          mentionAll: mentionData.mentionAll,
          mentionedUserIds: mentionData.mentionedUserIds,
        },
      });
      const queued = await loadPendingThreadQueue(threadId);
      setPendingQueueCount(queued.length);
      notifyError('Send failed', error instanceof Error ? error.message : 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  const insertMention = (user: MobileUserOption | 'everyone') => {
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
  };

  return (
    <AppScreen refreshing={loading} onRefresh={() => void loadMessages()}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Use `@everyone` or `@username` to mention participants.
      </Text>
      <Text style={[styles.note, { color: theme.colors.textSubtle }]}>
        Socket: {isSocketConnected ? 'Live' : 'Offline'}
      </Text>
      <Text style={[styles.note, { color: theme.colors.textSubtle }]}>
        Pending queue: {pendingQueueCount}
      </Text>

      <AppCard>
        <AppInput
          value={text}
          onChangeText={setText}
          onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
          placeholder="Type a message... (@everyone, @jane)"
          multiline
        />
        {activeMention ? (
          <View style={styles.suggestionsWrap}>
            <Pressable
              onPress={() => insertMention('everyone')}
              style={[styles.suggestionItem, { borderColor: theme.colors.border }]}
            >
              <Text style={{ color: theme.colors.text }}>@everyone</Text>
            </Pressable>
            {mentionSuggestions.map((user) => (
              <Pressable
                key={user.id}
                onPress={() => insertMention(user)}
                style={[styles.suggestionItem, { borderColor: theme.colors.border }]}
              >
                <Text style={{ color: theme.colors.text }}>
                  @{normalizeMentionHandle(user.email.split('@')[0] ?? user.fullname)}
                </Text>
                <Text style={{ color: theme.colors.textSubtle, fontSize: 12 }}>
                  {user.fullname}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <AppButton
          title={sending ? 'Sending...' : 'Send'}
          onPress={() => void onSend()}
          disabled={sending}
        />
      </AppCard>

      {loading ? (
        <>
          <AppSkeletonCard lines={3} />
          <AppSkeletonCard lines={3} />
        </>
      ) : messages.length ? (
        <View style={styles.list}>
          {messages.map((message) => {
            const isMine = currentUserId && message.senderUserId === currentUserId;
            const sender =
              (message.senderUserId ? usersById.get(message.senderUserId)?.fullname : null) ||
              (message.senderUserId ? usersById.get(message.senderUserId)?.email : null) ||
              (isMine ? 'You' : 'Unknown user');
            return (
              <View key={message.id}>
                <Text style={[styles.sender, { color: theme.colors.text }]}>{sender}</Text>
                <ChatBubble
                  body={message.body ?? ''}
                  sentAt={message.createdAt}
                  isMine={Boolean(isMine)}
                  seen={!message._optimistic && !message._failed}
                />
                {message._optimistic ? (
                  <Text
                    style={[
                      styles.time,
                      { color: message._failed ? theme.colors.danger : theme.colors.textSubtle },
                    ]}
                  >
                    {message._failed ? 'Failed to send' : 'Sending...'}
                  </Text>
                ) : null}
                <Text style={[styles.time, { color: theme.colors.textSubtle }]}>
                  {formatTime(message.createdAt)}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={{ color: theme.colors.textSubtle }}>No messages yet.</Text>
      )}
      <Text style={[styles.note, { color: theme.colors.textSubtle }]}>
        Live via socket. Pull to refresh as fallback.
      </Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  subtitle: { marginTop: -2, lineHeight: 20, marginBottom: mobileSpacing.xs },
  list: { gap: mobileSpacing.sm },
  sender: { fontWeight: '700' },
  time: { fontSize: 11 },
  note: { fontSize: 12, textAlign: 'center', marginTop: mobileSpacing.xs },
  suggestionsWrap: {
    gap: 6,
    marginTop: 2,
  },
  suggestionItem: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
});
