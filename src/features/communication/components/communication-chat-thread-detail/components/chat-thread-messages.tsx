import type { RefObject, UIEvent } from 'react';
import type {
  CommunicationCallSession,
  CommunicationMessage,
} from '../../../api/communication.api';
import { typingDotStyle } from '../types/communication-chat-thread-detail.types';
import { extractMediaAttachments } from '../utils/communication-chat-thread-detail-media';
import {
  extractRecordingDurationLabel,
  extractReactions,
  extractReplyPreview,
  formatDayLabel,
  getDayKey,
  getDisplayNameForUser,
  hasUserFlag,
  isWithinMinutes,
} from '../utils/communication-chat-thread-detail-message';
import { ChatMessageItem } from './chat-message-item';

type ChatThreadMessagesProps = {
  messagesViewportRef: RefObject<HTMLDivElement | null>;
  onMessagesScroll: (event: UIEvent<HTMLDivElement>) => void;
  isLoadingOlder: boolean;
  isLoadingMessages: boolean;
  messages: CommunicationMessage[];
  currentUserId: string;
  usersById: Map<string, { fullname?: string | null; email?: string | null }>;
  threadCalls: CommunicationCallSession[];
  reactionMenuMessageId: string | null;
  actionsMenuMessageId: string | null;
  setReactionMenuMessageId: (value: string | null) => void;
  setActionsMenuMessageId: (value: string | null) => void;
  nowTs: number;
  resolveMentionLabel: (handle: string) => string;
  resolveReplySenderLabel: (replyPreview: {
    sender?: string;
    senderUserId?: string | null;
  }) => string;
  onReplyMessage: (message: CommunicationMessage) => void;
  onForwardMessage: (message: CommunicationMessage) => void;
  onToggleFlag: (
    message: CommunicationMessage,
    flag: 'pinnedByUserIds' | 'starredByUserIds',
  ) => void;
  onEditMessage: (message: CommunicationMessage) => void;
  onDeleteMessage: (message: CommunicationMessage) => void;
  onQuickReact: (message: CommunicationMessage, emoji: string) => void;
  onOpenVideoAttachment: (url: string, label?: string) => void;
  typingUserLabels: string[];
};

export function ChatThreadMessages({
  messagesViewportRef,
  onMessagesScroll,
  isLoadingOlder,
  isLoadingMessages,
  messages,
  currentUserId,
  usersById,
  threadCalls,
  reactionMenuMessageId,
  actionsMenuMessageId,
  setReactionMenuMessageId,
  setActionsMenuMessageId,
  nowTs,
  resolveMentionLabel,
  resolveReplySenderLabel,
  onReplyMessage,
  onForwardMessage,
  onToggleFlag,
  onEditMessage,
  onDeleteMessage,
  onQuickReact,
  onOpenVideoAttachment,
  typingUserLabels,
}: ChatThreadMessagesProps) {
  return (
    <div
      ref={messagesViewportRef}
      onScroll={onMessagesScroll}
      className="flex-1 overflow-y-auto bg-[#efeae2] px-2 py-3 dark:bg-[#0b141a] sm:px-4"
      style={{
        backgroundImage:
          'radial-gradient(circle at 24px 24px, rgba(120,120,120,0.08) 1.2px, transparent 0), radial-gradient(circle at 0 0, rgba(120,120,120,0.05) 1px, transparent 0)',
        backgroundSize: '48px 48px, 32px 32px',
      }}
    >
      {isLoadingOlder ? (
        <div className="flex justify-center py-2">
          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            Loading older messages...
          </span>
        </div>
      ) : null}
      {isLoadingMessages ? (
        <p className="p-4 text-sm text-muted-foreground">Loading messages...</p>
      ) : null}

      {!isLoadingMessages && messages.length
        ? messages.map((message, index) => {
            const isOwnMessage = Boolean(currentUserId && message.senderUserId === currentUserId);
            const senderLabel = message.senderUserId
              ? getDisplayNameForUser(usersById, message.senderUserId)
              : 'System';
            const attachments = extractMediaAttachments(message);
            const replyPreview = extractReplyPreview(message);
            const reactions = extractReactions(message);
            const recordingDuration = extractRecordingDurationLabel(message);
            const messageMetadata =
              message.metadataJson &&
              typeof message.metadataJson === 'object' &&
              !Array.isArray(message.metadataJson)
                ? (message.metadataJson as Record<string, unknown>)
                : null;
            const callIdFromMessage =
              (typeof messageMetadata?.callId === 'string' && messageMetadata.callId) ||
              (typeof messageMetadata?.sessionId === 'string' && messageMetadata.sessionId) ||
              null;
            const liveCallStatus = callIdFromMessage
              ? (threadCalls.find((call) => call.id === callIdFromMessage)?.status ?? null)
              : null;
            const pinned = hasUserFlag(message, currentUserId, 'pinnedByUserIds');
            const starred = hasUserFlag(message, currentUserId, 'starredByUserIds');
            const canEditDelete = Boolean(
              currentUserId &&
                message.senderUserId === currentUserId &&
                isWithinMinutes(message.createdAt, 5),
            );
            const isReactionMenuOpen = reactionMenuMessageId === message.id;
            const isActionsMenuOpen = actionsMenuMessageId === message.id;
            const thisDay = getDayKey(message.createdAt);
            const prevDay = index > 0 ? getDayKey(messages[index - 1]?.createdAt) : null;
            const dayLabel =
              thisDay && thisDay !== prevDay ? formatDayLabel(message.createdAt) : null;

            return (
              <ChatMessageItem
                key={message.id}
                message={message}
                dayLabel={dayLabel}
                isOwnMessage={isOwnMessage}
                senderLabel={senderLabel}
                replyPreview={replyPreview}
                attachments={attachments}
                reactions={reactions}
                recordingDuration={recordingDuration}
                liveCallStatus={liveCallStatus}
                pinned={pinned}
                starred={starred}
                canEditDelete={canEditDelete}
                isReactionMenuOpen={isReactionMenuOpen}
                isActionsMenuOpen={isActionsMenuOpen}
                nowTs={nowTs}
                resolveMentionLabel={resolveMentionLabel}
                resolveReplySenderLabel={resolveReplySenderLabel}
                onReply={() => onReplyMessage(message)}
                onForward={() => onForwardMessage(message)}
                onTogglePin={() => onToggleFlag(message, 'pinnedByUserIds')}
                onToggleStar={() => onToggleFlag(message, 'starredByUserIds')}
                onEdit={() => onEditMessage(message)}
                onDelete={() => onDeleteMessage(message)}
                onQuickReact={(emoji) => onQuickReact(message, emoji)}
                onToggleReactionMenu={() =>
                  setReactionMenuMessageId(isReactionMenuOpen ? null : message.id)
                }
                onReactionMenuOpenChange={(open) =>
                  setReactionMenuMessageId(open ? message.id : null)
                }
                onToggleActionsMenu={(open) => setActionsMenuMessageId(open ? message.id : null)}
                onOpenVideoAttachment={onOpenVideoAttachment}
              />
            );
          })
        : null}

      {!isLoadingMessages && !messages.length ? (
        <p className="p-4 text-sm text-muted-foreground">No messages yet.</p>
      ) : null}

      {typingUserLabels.length ? (
        <div className="mt-2 flex justify-start">
          <div className="rounded-2xl rounded-bl-sm border bg-card px-3 py-2">
            <div className="flex items-center gap-1">
              {typingDotStyle.map((delay, index) => (
                <span
                  key={delay}
                  className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                  style={{ animationDelay: delay }}
                  aria-hidden={index > 0}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {typingUserLabels.join(', ')} {typingUserLabels.length > 1 ? 'are' : 'is'} typing...
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
