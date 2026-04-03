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

  const usersById = useMemo(
    () => new Map(userOptions.map((user) => [user.id, user])),
    [userOptions],
  );
  const mentionLookup = useMemo(() => buildMentionLookup(userOptions), [userOptions]);

  const loadMessages = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
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
      setUserOptions(users);
      await withAuth((token) => markCommunicationThreadRead(token, { threadId }));
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

  useEffect(() => {
    if (!threadId) return;
    const isTyping = text.trim().length > 0;
    setTyping(threadId, isTyping);
    return () => {
      setTyping(threadId, false);
    };
  }, [setTyping, text, threadId]);

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
      notifyError('Send failed', error instanceof Error ? error.message : 'Unable to send message');
    } finally {
      setSending(false);
    }
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

      <AppCard>
        <AppInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message... (@everyone, @jane)"
          multiline
        />
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
              <Pressable
                key={message.id}
                style={[
                  styles.messageRow,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: isMine ? theme.colors.cardMuted : theme.colors.card,
                  },
                ]}
              >
                <Text style={[styles.sender, { color: theme.colors.text }]}>{sender}</Text>
                <Text style={{ color: theme.colors.textMuted }}>{message.body ?? ''}</Text>
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
              </Pressable>
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
  messageRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: mobileSpacing.md,
    gap: 4,
  },
  sender: { fontWeight: '700' },
  time: { fontSize: 11 },
  note: { fontSize: 12, textAlign: 'center', marginTop: mobileSpacing.xs },
});
