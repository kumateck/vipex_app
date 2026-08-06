import { Pressable, Text, View } from 'react-native';
import type { CommunicationThread } from '@mobile/types/communication';
import { mobileRadius, mobileTextStyles } from '@mobile/theme/layout';
import { formatTime, hubStyles, initialsFromName } from '../hub-ui';

type GroupChatRowProps = {
  thread: CommunicationThread;
  unreadCount: number;
  avatarSize: number;
  scale: number;
  colors: {
    border: string;
    borderWidth: number;
    card: string;
    bgElevated: string;
    textMuted: string;
    text: string;
    textSubtle: string;
    primary: string;
    primaryText: string;
  };
  onOpenThread: (thread: CommunicationThread) => void;
};

export function GroupChatRow({
  thread,
  unreadCount,
  avatarSize,
  scale,
  colors,
  onOpenThread,
}: GroupChatRowProps) {
  const title = thread.title ?? 'Group chat';
  return (
    <Pressable
      style={({ pressed }) => [
        hubStyles.waRow,
        {
          opacity: pressed ? 0.85 : 1,
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: colors.borderWidth,
        },
      ]}
      onPress={() => onOpenThread(thread)}
    >
      <View style={[hubStyles.avatarWrap, { width: avatarSize, height: avatarSize }]}>
        <View
          style={[
            hubStyles.avatarCircle,
            {
              backgroundColor: colors.bgElevated,
              borderColor: colors.border,
              borderWidth: 1,
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        >
          <Text style={[hubStyles.avatarText, { color: colors.textMuted, fontSize: 17 * scale }]}>
            {initialsFromName(title)}
          </Text>
        </View>
      </View>
      <View style={hubStyles.waCenter}>
        <Text
          numberOfLines={1}
          style={[
            hubStyles.waName,
            {
              color: colors.text,
              fontSize: mobileTextStyles.subhead.fontSize * scale,
              lineHeight: mobileTextStyles.subhead.lineHeight * scale,
            },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            hubStyles.waMeta,
            {
              color: colors.textSubtle,
              fontSize: mobileTextStyles.footnote.fontSize * scale,
              lineHeight: mobileTextStyles.footnote.lineHeight * scale,
            },
          ]}
        >
          {thread.participantCount ?? 0} participants
        </Text>
        <Text
          numberOfLines={1}
          style={[
            hubStyles.waPreview,
            {
              color: colors.textMuted,
              fontSize: mobileTextStyles.subhead.fontSize * scale,
              lineHeight: mobileTextStyles.subhead.lineHeight * scale,
            },
          ]}
        >
          {thread.lastMessageAt ? 'Latest activity in group' : 'No messages yet'}
        </Text>
      </View>
      <View style={hubStyles.waRight}>
        <Text
          style={[
            hubStyles.waTime,
            { color: colors.textSubtle, fontSize: mobileTextStyles.footnote.fontSize * scale },
          ]}
        >
          {formatTime(thread.lastMessageAt)}
        </Text>
        {unreadCount ? (
          <View
            style={[
              hubStyles.unreadPill,
              {
                backgroundColor: colors.primary,
                minWidth: 20 * scale,
                height: 20 * scale,
                borderRadius: mobileRadius.pill,
              },
            ]}
          >
            <Text
              style={[
                hubStyles.unreadText,
                {
                  color: colors.primaryText,
                  fontSize: mobileTextStyles.caption1.fontSize * scale,
                },
              ]}
            >
              {unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
