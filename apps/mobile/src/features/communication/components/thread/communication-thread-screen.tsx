import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@mobile/components/screen';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { AppSkeletonCard } from '@/components/ui/mobile';
import { mobileSpacing } from '@mobile/theme/layout';
import { useCommunicationThread } from '@mobile/features/communication/hooks/use-communication-thread';
import { formatDayLabel, toDayKey } from '@mobile/features/communication/utils/thread-time';
import { getMobileScale } from '@mobile/features/communication/utils';
import type { CommunicationMessage } from '@mobile/types/communication';
import { ThreadComposer } from './thread-composer';
import { ThreadMessageRow } from './thread-message-row';
import { ThreadTopBar } from './thread-top-bar';

type ThreadDisplayMessage = CommunicationMessage & { _optimistic?: boolean; _failed?: boolean };

type Row =
  | { type: 'day'; key: string; label: string }
  | { type: 'message'; key: string; message: ThreadDisplayMessage };

export function CommunicationThreadScreen() {
  const { theme } = useAppearance();
  const thread = useCommunicationThread();
  const { width } = useWindowDimensions();
  const scale = getMobileScale(width);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const timelineRef = useRef<ScrollView | null>(null);
  const messageOffsetByIdRef = useRef<Map<string, number>>(new Map());
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDark = theme.scheme === 'dark';
  const colors = {
    timelineBg: isDark ? '#0B1220' : '#F2EFE8',
    dayChipBg: isDark ? '#1F2937' : '#E5E7EB',
    dayChipText: isDark ? '#CBD5E1' : '#475569',
  };

  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    const deduped: ThreadDisplayMessage[] = [];
    for (const message of thread.messages as ThreadDisplayMessage[]) {
      if (!message?.id) continue;
      if (seen.has(message.id)) continue;
      seen.add(message.id);
      deduped.push(message);
    }
    return deduped;
  }, [thread.messages]);

  const selectedMessage = useMemo(
    () => uniqueMessages.find((message) => message.id === selectedMessageId) ?? null,
    [selectedMessageId, uniqueMessages],
  );

  const replySenderLabel = useMemo(() => {
    if (!thread.replyToMessage) return 'Unknown user';
    if (thread.replyToMessage.senderUserId === thread.currentUserId) return 'You';
    if (!thread.replyToMessage.senderUserId) {
      return thread.replyToMessage.senderName?.trim() || 'Unknown user';
    }
    return (
      thread.usersById.get(thread.replyToMessage.senderUserId)?.fullname?.trim() ||
      thread.usersById.get(thread.replyToMessage.senderUserId)?.email?.trim() ||
      thread.replyToMessage.senderName?.trim() ||
      'Unknown user'
    );
  }, [thread.currentUserId, thread.replyToMessage, thread.usersById]);

  const typingLabel =
    thread.typingUsers.length === 0
      ? null
      : thread.typingUsers.length === 1
        ? `${thread.typingUsers[0]} typing...`
        : `${thread.typingUsers.length} typing...`;

  const rows: Row[] = [];
  let lastDay = '';
  for (const message of uniqueMessages) {
    const dayKey = toDayKey(message.createdAt);
    if (dayKey !== lastDay) {
      rows.push({ type: 'day', key: `day-${dayKey}`, label: formatDayLabel(message.createdAt) });
      lastDay = dayKey;
    }
    rows.push({
      type: 'message',
      key: `message-${message.id}-${message.createdAt ?? 'none'}-${rows.length}`,
      message,
    });
  }

  const clearSelection = () => setSelectedMessageId(null);
  useEffect(
    () => () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    },
    [],
  );
  const onCaptureMessageLayout = useCallback((messageId: string, y: number) => {
    messageOffsetByIdRef.current.set(messageId, y);
  }, []);
  const onPressReplyContext = useCallback((targetMessageId: string) => {
    const targetY = messageOffsetByIdRef.current.get(targetMessageId);
    if (typeof targetY !== 'number' || !Number.isFinite(targetY)) return;
    timelineRef.current?.scrollTo({ y: Math.max(0, targetY - 32), animated: true });
    setHighlightedMessageId(targetMessageId);
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedMessageId((current) => (current === targetMessageId ? null : current));
      highlightTimerRef.current = null;
    }, 3000);
  }, []);
  const selectReply = () => {
    if (!selectedMessage) return;
    thread.setReplyToMessage(selectedMessage);
    clearSelection();
  };

  const selectPlaceholderAction = (title: string) => {
    clearSelection();
    Alert.alert(title, `${title} flow will be connected next.`);
  };

  return (
    <AppScreen scrollable={false}>
      <ThreadTopBar
        selectedMessage={selectedMessage}
        scale={scale}
        title={thread.title}
        isSocketConnected={thread.isSocketConnected}
        isDirectThread={thread.isDirectThread}
        participantCount={thread.participantCount}
        typingLabel={typingLabel}
        onBackPress={() => router.back()}
        onCallPress={() => {
          Alert.alert('Voice Call', 'Open Channels tab and join a voice channel to start a call.');
        }}
        onClearSelection={clearSelection}
        onReply={selectReply}
        onForward={() => selectPlaceholderAction('Forward')}
        onPin={() => selectPlaceholderAction('Pin')}
        onStar={() => selectPlaceholderAction('Star')}
        onDelete={() => selectPlaceholderAction('Delete')}
      />

      <ScrollView
        ref={timelineRef}
        style={[
          styles.timeline,
          {
            backgroundColor: colors.timelineBg,
            borderColor: theme.colors.border,
            borderRadius: 14 * scale,
          },
        ]}
        contentContainerStyle={styles.timelineContent}
        onScrollBeginDrag={() => {
          if (selectedMessageId) setSelectedMessageId(null);
        }}
      >
        {thread.loading ? (
          <>
            <AppSkeletonCard lines={3} />
            <AppSkeletonCard lines={3} />
          </>
        ) : rows.length ? (
          rows.map((row) => {
            if (row.type === 'day') {
              return (
                <View key={row.key} style={styles.dayWrap}>
                  <Text
                    style={[
                      styles.dayText,
                      { color: colors.dayChipText, backgroundColor: colors.dayChipBg },
                    ]}
                  >
                    {row.label}
                  </Text>
                </View>
              );
            }

            const message = row.message;
            return (
              <View
                key={row.key}
                onLayout={(event) => onCaptureMessageLayout(message.id, event.nativeEvent.layout.y)}
              >
                <ThreadMessageRow
                  message={message}
                  isMine={thread.isMyMessage(message)}
                  showSenderNames={thread.showSenderNames}
                  sender={
                    (message.senderUserId
                      ? thread.usersById.get(message.senderUserId)?.fullname
                      : null) || (thread.isMyMessage(message) ? 'You' : 'Unknown')
                  }
                  usersById={thread.usersById}
                  scale={scale}
                  isDark={isDark}
                  selected={selectedMessageId === message.id}
                  highlighted={highlightedMessageId === message.id}
                  onLongPress={() => setSelectedMessageId(message.id)}
                  onPressReplyContext={onPressReplyContext}
                />
              </View>
            );
          })
        ) : (
          <Text style={{ color: theme.colors.textSubtle }}>No messages yet.</Text>
        )}
      </ScrollView>

      <ThreadComposer
        scale={scale}
        text={thread.text}
        setText={thread.setText}
        setSelection={thread.setSelection}
        sending={thread.sending}
        onSend={() => void thread.onSend()}
        showActions={thread.showActions}
        setShowActions={thread.setShowActions}
        activeMention={thread.activeMention}
        mentionSuggestions={thread.mentionSuggestions}
        insertMention={thread.insertMention}
        replyToMessage={thread.replyToMessage}
        replySenderLabel={replySenderLabel}
        onClearReply={() => thread.setReplyToMessage(null)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  timeline: { flex: 1, borderRadius: 14, borderWidth: 1 },
  timelineContent: { gap: 7, paddingBottom: mobileSpacing.sm, padding: 10 },
  dayWrap: { alignItems: 'center', marginTop: 6, marginBottom: 4 },
  dayText: { fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
});
