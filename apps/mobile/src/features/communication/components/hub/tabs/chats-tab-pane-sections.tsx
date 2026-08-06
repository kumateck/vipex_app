import { Pressable, Text, View } from 'react-native';
import type { CommunicationThread } from '@mobile/types/communication';
import type { UserChatEntry } from '@mobile/features/communication/types/hub';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { formatTime, hubStyles, initialsFromName } from '../hub-ui';

export { GroupChatRow } from './group-chat-row';

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
    <View style={{ flexDirection: 'row', gap: mobileSpacing.sm, marginBottom: mobileSpacing.xs }}>
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
            style={[
              {
                paddingVertical: mobileSpacing.xs + 2,
                paddingHorizontal: mobileSpacing.md,
                borderRadius: mobileRadius.pill,
                backgroundColor: active ? colors.primary : colors.cardMuted,
              },
              active ? mobileShadow.card : null,
            ]}
          >
            <Text
              style={{
                color: active ? colors.primaryText : colors.textMuted,
                fontWeight: '700',
                fontSize: mobileTextStyles.caption1.fontSize * scale,
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
    borderWidth: number;
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
            {
              color: colors.text,
              fontSize: mobileTextStyles.subhead.fontSize * scale,
              lineHeight: mobileTextStyles.subhead.lineHeight * scale,
            },
          ]}
        >
          {entry.fullname}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            hubStyles.waMeta,
            {
              color: colors.textSubtle,
              fontSize: mobileTextStyles.footnote.fontSize * scale,
              lineHeight: mobileTextStyles.footnote.lineHeight * scale,
            },
          ]}
        >
          {[entry.roleName, entry.branchName, entry.locationName].filter(Boolean).join(' • ') ||
            'Direct'}
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
          {isTyping
            ? 'typing...'
            : thread.lastMessagePreview ||
              (thread.lastMessageAt ? 'Last message' : 'No conversation yet')}
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
