import { useMemo, useState } from 'react';
import { Text, useWindowDimensions } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { CommunicationThread } from '@mobile/types/communication';
import type { UserChatEntry } from '@mobile/features/communication/types/hub';
import { EmptyText, SectionTitle } from '../hub-ui';
import { getMobileScale } from '@mobile/features/communication/utils';
import {
  ChatFilterBar,
  DirectChatRow,
  GroupChatRow,
  type ChatFilterKey,
} from './chats-tab-pane-sections';

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
  const [filter, setFilter] = useState<ChatFilterKey>('all');
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
      <ChatFilterBar
        filter={filter}
        scale={scale}
        onChange={setFilter}
        colors={{
          primary: theme.colors.primary,
          border: theme.colors.border,
          cardMuted: theme.colors.cardMuted,
          primaryText: theme.colors.primaryText,
          textMuted: theme.colors.textMuted,
        }}
      />

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
          return (
            <DirectChatRow
              key={entry.id}
              entry={entry}
              thread={thread}
              unreadCount={unreadCount}
              isTyping={Boolean(isTyping)}
              avatarSize={avatarSize}
              dotSize={dotSize}
              scale={scale}
              onOpenThread={onOpenThread}
              onToggleFavourite={(entryId) =>
                setFavourites((prev) => ({ ...prev, [entryId]: !prev[entryId] }))
              }
              colors={{
                border: theme.colors.border,
                card: theme.colors.card,
                bgElevated: theme.colors.bgElevated,
                textMuted: theme.colors.textMuted,
                text: theme.colors.text,
                textSubtle: theme.colors.textSubtle,
                indicatorOnline: theme.colors.indicatorOnline,
                indicatorMuted: theme.colors.indicatorMuted,
                primary: theme.colors.primary,
                primaryText: theme.colors.primaryText,
              }}
            />
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
          return (
            <GroupChatRow
              key={thread.id}
              thread={thread}
              unreadCount={unreadCount}
              avatarSize={avatarSize}
              scale={scale}
              onOpenThread={onOpenThread}
              colors={{
                border: theme.colors.border,
                card: theme.colors.card,
                bgElevated: theme.colors.bgElevated,
                textMuted: theme.colors.textMuted,
                text: theme.colors.text,
                textSubtle: theme.colors.textSubtle,
                primary: theme.colors.primary,
                primaryText: theme.colors.primaryText,
              }}
            />
          );
        })
      ) : (
        <EmptyText value="No group chats yet." />
      )}
    </>
  );
}
