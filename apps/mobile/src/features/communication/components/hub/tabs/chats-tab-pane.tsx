import { useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { CommunicationThread } from '@mobile/types/communication';
import type { UserChatEntry } from '@mobile/features/communication/types/hub';
import { EmptyText, SectionTitle, formatTime, hubStyles, initialsFromName } from '../hub-ui';
import { getMobileScale } from '@mobile/features/communication/utils';

export function ChatsTabPane({
  chatEntries,
  groupThreads,
  threadUnreadById,
  typingByThreadId,
  onOpenThread,
}: {
  chatEntries: UserChatEntry[];
  groupThreads: CommunicationThread[];
  threadUnreadById: Map<string, { unread: number; mentions: number }>;
  typingByThreadId: Record<string, boolean>;
  onOpenThread: (thread: CommunicationThread) => void;
}) {
  const { theme } = useAppearance();
  const { width } = useWindowDimensions();
  const scale = getMobileScale(width);
  const avatarSize = 50 * scale;
  const dotSize = Math.max(10, 12 * scale);
  const [filter, setFilter] = useState<'all' | 'unread' | 'favourites' | 'groups'>('all');
  const [favourites, setFavourites] = useState<Record<string, boolean>>({});

  const archivedChats = useMemo(
    () =>
      chatEntries.filter(
        (entry) =>
          entry.thread &&
          ((entry.thread.isArchived ?? false) ||
            entry.thread.title?.toLowerCase().includes('archived')),
      ),
    [chatEntries],
  );
  const visibleChats = useMemo(
    () =>
      chatEntries.filter((entry) => {
        const thread = entry.thread;
        if (!thread) return false;
        const unread = threadUnreadById.get(thread.id)?.unread ?? 0;
        if (filter === 'all') return true;
        if (filter === 'unread') return unread > 0;
        if (filter === 'favourites') return favourites[entry.id] || thread.isFavourite;
        return false;
      }),
    [chatEntries, favourites, filter, threadUnreadById],
  );
  const visibleGroups = useMemo(
    () =>
      filter === 'groups'
        ? groupThreads
        : groupThreads.filter((thread) => !(thread.isArchived ?? false)),
    [filter, groupThreads],
  );

  return (
    <>
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
              onPress={() => setFilter(item.key as typeof filter)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? theme.colors.primary : theme.colors.border,
                backgroundColor: active ? theme.colors.primary : theme.colors.cardMuted,
              }}
            >
              <Text
                style={{
                  color: active ? theme.colors.primaryText : theme.colors.textMuted,
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

      {archivedChats.length ? (
        <Text style={{ color: theme.colors.textSubtle, fontSize: 12 * scale }}>
          Archived: {archivedChats.length}
        </Text>
      ) : null}

      <SectionTitle title="Direct Chats" />
      {visibleChats.length ? (
        visibleChats.map((entry) => {
          const thread = entry.thread!;
          const unread = threadUnreadById.get(thread.id);
          const unreadCount = unread?.unread ?? 0;
          const isTyping = typingByThreadId[thread.id];
          const hasPresence = unreadCount > 0 || isTyping;
          return (
            <Pressable
              key={entry.id}
              style={[
                hubStyles.waRow,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
              ]}
              onPress={() => onOpenThread(thread)}
              onLongPress={() =>
                setFavourites((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }))
              }
            >
              <View style={[hubStyles.avatarWrap, { width: avatarSize, height: avatarSize }]}>
                <View
                  style={[
                    hubStyles.avatarCircle,
                    {
                      backgroundColor: theme.colors.bgElevated,
                      borderColor: theme.colors.border,
                      borderWidth: 1,
                      width: avatarSize,
                      height: avatarSize,
                      borderRadius: avatarSize / 2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      hubStyles.avatarText,
                      { color: theme.colors.textMuted, fontSize: 17 * scale },
                    ]}
                  >
                    {initialsFromName(entry.fullname)}
                  </Text>
                </View>
                <View
                  style={[
                    hubStyles.presenceDot,
                    {
                      backgroundColor: hasPresence
                        ? theme.colors.indicatorOnline
                        : theme.colors.indicatorMuted,
                      borderColor: theme.colors.card,
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
                    { color: theme.colors.text, fontSize: 14 * scale, lineHeight: 18 * scale },
                  ]}
                >
                  {entry.fullname}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    hubStyles.waMeta,
                    {
                      color: theme.colors.textSubtle,
                      fontSize: 13 * scale,
                      lineHeight: 17 * scale,
                    },
                  ]}
                >
                  {[entry.roleName, entry.branchName, entry.locationName]
                    .filter(Boolean)
                    .join(' • ') || 'Direct'}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    hubStyles.waPreview,
                    { color: theme.colors.textMuted, fontSize: 14 * scale, lineHeight: 18 * scale },
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
                    { color: theme.colors.textSubtle, fontSize: 13 * scale },
                  ]}
                >
                  {formatTime(thread.lastMessageAt)}
                </Text>
                {unreadCount ? (
                  <View
                    style={[
                      hubStyles.unreadPill,
                      {
                        backgroundColor: theme.colors.primary,
                        minWidth: 20 * scale,
                        height: 20 * scale,
                        borderRadius: 10 * scale,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        hubStyles.unreadText,
                        { color: theme.colors.primaryText, fontSize: 12 * scale },
                      ]}
                    >
                      {unreadCount}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })
      ) : (
        <EmptyText value="No chats yet." />
      )}

      <SectionTitle title="Group Chats" />
      {visibleGroups.length ? (
        visibleGroups.map((thread) => {
          const unread = threadUnreadById.get(thread.id);
          const unreadCount = unread?.unread ?? 0;
          const title = thread.title ?? 'Group chat';
          return (
            <Pressable
              key={thread.id}
              style={[
                hubStyles.waRow,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
              ]}
              onPress={() => onOpenThread(thread)}
            >
              <View style={[hubStyles.avatarWrap, { width: avatarSize, height: avatarSize }]}>
                <View
                  style={[
                    hubStyles.avatarCircle,
                    {
                      backgroundColor: theme.colors.bgElevated,
                      borderColor: theme.colors.border,
                      borderWidth: 1,
                      width: avatarSize,
                      height: avatarSize,
                      borderRadius: avatarSize / 2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      hubStyles.avatarText,
                      { color: theme.colors.textMuted, fontSize: 17 * scale },
                    ]}
                  >
                    {initialsFromName(title)}
                  </Text>
                </View>
              </View>
              <View style={hubStyles.waCenter}>
                <Text
                  numberOfLines={1}
                  style={[
                    hubStyles.waName,
                    { color: theme.colors.text, fontSize: 14 * scale, lineHeight: 18 * scale },
                  ]}
                >
                  {title}
                </Text>
                <Text
                  style={[
                    hubStyles.waMeta,
                    {
                      color: theme.colors.textSubtle,
                      fontSize: 13 * scale,
                      lineHeight: 17 * scale,
                    },
                  ]}
                >
                  {thread.participantCount ?? 0} participants
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    hubStyles.waPreview,
                    { color: theme.colors.textMuted, fontSize: 14 * scale, lineHeight: 18 * scale },
                  ]}
                >
                  {thread.lastMessageAt ? 'Latest activity in group' : 'No messages yet'}
                </Text>
              </View>
              <View style={hubStyles.waRight}>
                <Text
                  style={[
                    hubStyles.waTime,
                    { color: theme.colors.textSubtle, fontSize: 13 * scale },
                  ]}
                >
                  {formatTime(thread.lastMessageAt)}
                </Text>
                {unreadCount ? (
                  <View
                    style={[
                      hubStyles.unreadPill,
                      {
                        backgroundColor: theme.colors.primary,
                        minWidth: 20 * scale,
                        height: 20 * scale,
                        borderRadius: 10 * scale,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        hubStyles.unreadText,
                        { color: theme.colors.primaryText, fontSize: 12 * scale },
                      ]}
                    >
                      {unreadCount}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })
      ) : (
        <EmptyText value="No group chats yet." />
      )}
    </>
  );
}
