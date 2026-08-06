import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { getSenderNameColor } from '@mobile/features/communication/utils/thread-sender-color';
import type { CommunicationMessage } from '@mobile/types/communication';
import { formatMessageTime } from '@mobile/features/communication/utils/thread-time';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import {
  ThreadMessageContent,
  extractThreadMessageReactions,
  extractThreadReplyPreview,
} from './thread-message-content';

type ThreadDisplayMessage = CommunicationMessage & { _optimistic?: boolean; _failed?: boolean };

function asRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
}

function extractReplyId(message: ThreadDisplayMessage) {
  const metadata = asRecord(message.metadataJson);
  const nestedReply = asRecord(metadata.replyTo);
  const directReplyId =
    message && typeof (message as { replyToMessageId?: unknown }).replyToMessageId === 'string'
      ? ((message as { replyToMessageId?: string }).replyToMessageId ?? null)
      : null;
  const candidates = [
    directReplyId,
    metadata.replyToMessageId,
    metadata.replyToId,
    metadata.replyId,
    nestedReply.id,
  ];
  for (const value of candidates) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

export function ThreadMessageRow({
  message,
  isMine,
  showSenderNames,
  sender,
  scale,
  isDark,
  selected,
  highlighted,
  onLongPress,
  onPressReplyContext,
  usersById,
}: {
  message: ThreadDisplayMessage;
  isMine: boolean;
  showSenderNames: boolean;
  sender: string;
  scale: number;
  isDark: boolean;
  selected: boolean;
  highlighted: boolean;
  onLongPress: () => void;
  onPressReplyContext: (replyMessageId: string) => void;
  usersById: Map<string, { fullname?: string | null; email?: string | null }>;
}) {
  const { theme } = useAppearance();
  const senderColor = getSenderNameColor(message.senderUserId ?? sender, isDark);
  const reactions = extractThreadMessageReactions(message);
  const replyPreview = extractThreadReplyPreview(message);
  const replyId = extractReplyId(message);
  const hasReplyContext = Boolean(replyPreview || replyId);
  const canJumpToReply = Boolean(replyId);
  const replySenderLabel = replyPreview?.senderUserId
    ? usersById.get(replyPreview.senderUserId)?.fullname?.trim() ||
      usersById.get(replyPreview.senderUserId)?.email?.trim() ||
      replyPreview.sender?.trim() ||
      'Unknown user'
    : replyPreview?.sender?.trim() || 'Original message';
  const replyBodyLabel = replyPreview?.body?.trim() || '(attachment)';

  const bubbleBg = isMine ? theme.colors.primary : theme.colors.cardMuted;
  const bubbleTextColor = isMine ? theme.colors.primaryText : theme.colors.text;
  const bubbleMetaColor = isMine ? theme.colors.primaryText : theme.colors.textSubtle;

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={200}
      style={[styles.messageWrap, isMine ? styles.mineWrap : styles.theirWrap]}
    >
      {!isMine && showSenderNames ? (
        <Text
          style={[styles.sender, { color: senderColor, fontSize: 11 * scale }]}
          numberOfLines={1}
        >
          {sender}
        </Text>
      ) : null}

      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
          {
            backgroundColor: bubbleBg,
            borderColor: selected ? theme.colors.primary : 'transparent',
            borderWidth: selected ? 1.5 : 0,
            shadowColor: highlighted ? theme.colors.primary : 'transparent',
            shadowOpacity: highlighted ? 0.35 : 0,
            shadowRadius: highlighted ? 8 : 0,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        {hasReplyContext ? (
          <Pressable
            disabled={!canJumpToReply}
            onPress={() => {
              if (!replyId) return;
              onPressReplyContext(replyId);
            }}
            style={[
              styles.replyPreview,
              {
                borderLeftColor: bubbleTextColor,
                backgroundColor: isMine ? 'rgba(255,255,255,0.16)' : theme.colors.bgElevated,
                opacity: canJumpToReply ? 1 : 0.9,
              },
            ]}
          >
            <Text style={[styles.replySender, { color: bubbleTextColor }]} numberOfLines={1}>
              {replySenderLabel}
            </Text>
            <Text style={[styles.replyBody, { color: bubbleMetaColor }]} numberOfLines={2}>
              {replyBodyLabel}
            </Text>
          </Pressable>
        ) : null}
        <ThreadMessageContent message={message} scale={scale} />
        <View style={styles.metaRow}>
          {message._optimistic ? (
            <Text
              style={[
                styles.meta,
                { color: message._failed ? theme.colors.danger : bubbleMetaColor },
              ]}
            >
              {message._failed ? 'failed' : 'sending'}
            </Text>
          ) : null}
          <Text style={[styles.meta, { color: bubbleMetaColor, fontSize: 11 * scale }]}>
            {formatMessageTime(message.createdAt)}
          </Text>
        </View>
      </View>

      {reactions.length ? (
        <View
          style={[
            styles.reactionTipRow,
            isMine ? styles.reactionTipMine : styles.reactionTipTheirs,
          ]}
        >
          {reactions.map((reaction) => (
            <View
              key={`${message.id}-reaction-${reaction.emoji}`}
              style={[styles.reactionTipPill, { backgroundColor: theme.colors.cardMuted }]}
            >
              <Text style={{ color: theme.colors.text, fontSize: 12 * scale }}>
                {reaction.emoji}
                {reaction.count > 1 ? ` ${reaction.count}` : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  messageWrap: { maxWidth: '86%' },
  mineWrap: { alignSelf: 'flex-end' },
  theirWrap: { alignSelf: 'flex-start' },
  sender: { fontSize: 13, marginBottom: 2, fontWeight: '700', marginLeft: 4 },
  bubble: {
    borderRadius: mobileRadius.lg,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: mobileSpacing.sm,
  },
  bubbleMine: { borderBottomRightRadius: mobileRadius.sm },
  bubbleTheirs: { borderBottomLeftRadius: mobileRadius.sm },
  replyPreview: {
    borderLeftWidth: 3,
    borderRadius: mobileRadius.sm,
    paddingHorizontal: mobileSpacing.sm,
    paddingVertical: mobileSpacing.xs + 2,
    marginBottom: mobileSpacing.xs + 2,
  },
  replySender: { ...mobileTextStyles.caption2, fontWeight: '700' },
  replyBody: { ...mobileTextStyles.caption2, marginTop: 2 },
  metaRow: {
    marginTop: mobileSpacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: mobileSpacing.xs + 2,
  },
  meta: { fontSize: 11, textTransform: 'lowercase', lineHeight: 13 },
  reactionTipRow: {
    marginTop: -8,
    flexDirection: 'row',
    gap: mobileSpacing.xs + 2,
    maxWidth: '95%',
    flexWrap: 'wrap',
  },
  reactionTipMine: { alignSelf: 'flex-end', marginRight: mobileSpacing.sm },
  reactionTipTheirs: { alignSelf: 'flex-start', marginLeft: mobileSpacing.sm },
  reactionTipPill: {
    borderRadius: mobileRadius.pill,
    paddingHorizontal: mobileSpacing.sm,
    paddingVertical: 2,
  },
});
