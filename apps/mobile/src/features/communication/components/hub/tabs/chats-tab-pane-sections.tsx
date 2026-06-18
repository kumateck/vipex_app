import { Pressable, Text, View } from 'react-native';
import type { CommunicationThread } from '@mobile/types/communication';
import type { UserChatEntry } from '@mobile/features/communication/types/hub';
import { formatTime, hubStyles, initialsFromName } from '../hub-ui';

export type ChatFilterKey = 'all' | 'unread' | 'favourites' | 'groups';

export function ChatFilterBar({
  filter,
  scale,
  colors,
  onChange,
}: {
  filter: ChatFilterKey;
  scale: number;
  colors: {
    primary: string;
    border: string;
    cardMuted: string;
    primaryText: string;
    textMuted: string;
  };
  onChange: (next: ChatFilterKey) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
      {[
        { key: 'all', label: 'All' },
        { key: 'unread', label: 'Unread' },
        { key: 'favourites', label: 'Favourites' },
        { key: 'groups', label: 'Groups' },
      ].map((item) => {
        const active = filter === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key as ChatFilterKey)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: active ? colors.primary : colors.border,
              backgroundColor: active ? colors.primary : colors.cardMuted,
            }}
          >
            <Text
              style={{
                color: active ? colors.primaryText : colors.textMuted,
                fontWeight: '700',
                fontSize: 12 * scale,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function DirectChatRow({
  entry,
  thread,
  unreadCount,
  isTyping,
  avatarSize,
  dotSize,
  scale,
  colors,
  onOpenThread,
  onToggleFavourite,
}: {
  entry: UserChatEntry;
  thread: CommunicationThread;
  unreadCount: number;
  isTyping: boolean;
  avatarSize: number;
  dotSize: number;
  scale: number;
  colors: {
    border: string;
    card: string;
    bgElevated: string;
    textMuted: string;
    text: string;
    textSubtle: string;
    indicatorOnline: string;
    indicatorMuted: string;
    primary: string;
    primaryText: string;
  };
  onOpenThread: (thread: CommunicationThread) => void;
  onToggleFavourite: (entryId: string) => void;
}) {
  const hasPresence = unreadCount > 0 || isTyping;
  return (
    <Pressable
      style={[hubStyles.waRow, { borderColor: colors.border, backgroundColor: colors.card }]}
      onPress={() => onOpenThread(thread)}
      onLongPress={() => onToggleFavourite(entry.id)}
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
            {initialsFromName(entry.fullname)}
          </Text>
        </View>
        <View
          style={[
            hubStyles.presenceDot,
            {
              backgroundColor: hasPresence ? colors.indicatorOnline : colors.indicatorMuted,
              borderColor: colors.card,
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
            },
          ]}
        />
      </View>
      <View style={hubStyles.waCenter}>
        <Text
          numberOfLines={1}
          style={[
            hubStyles.waName,
            { color: colors.text, fontSize: 14 * scale, lineHeight: 18 * scale },
          ]}
        >
          {entry.fullname}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            hubStyles.waMeta,
            { color: colors.textSubtle, fontSize: 13 * scale, lineHeight: 17 * scale },
          ]}
        >
          {[entry.roleName, entry.branchName, entry.locationName].filter(Boolean).join(' • ') ||
            'Direct'}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            hubStyles.waPreview,
            { color: colors.textMuted, fontSize: 14 * scale, lineHeight: 18 * scale },
          ]}
        >
          {isTyping
            ? 'typing...'
            : thread.lastMessagePreview ||
              (thread.lastMessageAt ? 'Last message' : 'No conversation yet')}
        </Text>
      </View>
      <View style={hubStyles.waRight}>
        <Text style={[hubStyles.waTime, { color: colors.textSubtle, fontSize: 13 * scale }]}>
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
                borderRadius: 10 * scale,
              },
            ]}
          >
            <Text
              style={[hubStyles.unreadText, { color: colors.primaryText, fontSize: 12 * scale }]}
            >
              {unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function GroupChatRow({
  thread,
  unreadCount,
  avatarSize,
  scale,
  colors,
  onOpenThread,
}: {
  thread: CommunicationThread;
  unreadCount: number;
  avatarSize: number;
  scale: number;
  colors: {
    border: string;
    card: string;
    bgElevated: string;
    textMuted: string;
    text: string;
    textSubtle: string;
    primary: string;
    primaryText: string;
  };
  onOpenThread: (thread: CommunicationThread) => void;
}) {
  const title = thread.title ?? 'Group chat';
  return (
    <Pressable
      style={[hubStyles.waRow, { borderColor: colors.border, backgroundColor: colors.card }]}
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
            { color: colors.text, fontSize: 14 * scale, lineHeight: 18 * scale },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            hubStyles.waMeta,
            { color: colors.textSubtle, fontSize: 13 * scale, lineHeight: 17 * scale },
          ]}
        >
          {thread.participantCount ?? 0} participants
        </Text>
        <Text
          numberOfLines={1}
          style={[
            hubStyles.waPreview,
            { color: colors.textMuted, fontSize: 14 * scale, lineHeight: 18 * scale },
          ]}
        >
          {thread.lastMessageAt ? 'Latest activity in group' : 'No messages yet'}
        </Text>
      </View>
      <View style={hubStyles.waRight}>
        <Text style={[hubStyles.waTime, { color: colors.textSubtle, fontSize: 13 * scale }]}>
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
                borderRadius: 10 * scale,
              },
            ]}
          >
            <Text
              style={[hubStyles.unreadText, { color: colors.primaryText, fontSize: 12 * scale }]}
            >
              {unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
