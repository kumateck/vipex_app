import type { CommunicationMessage } from '@mobile/types/communication';
import { ThreadHeader } from './thread-header';
import { ThreadSelectionActions } from './thread-selection-actions';

type ThreadDisplayMessage = CommunicationMessage & { _optimistic?: boolean; _failed?: boolean };

export function ThreadTopBar({
  selectedMessage,
  scale,
  title,
  isSocketConnected,
  isDirectThread,
  participantCount,
  typingLabel,
  onBackPress,
  onCallPress,
  onClearSelection,
  onReply,
  onForward,
  onPin,
  onStar,
  onDelete,
}: {
  selectedMessage: ThreadDisplayMessage | null;
  scale: number;
  title: string;
  isSocketConnected: boolean;
  isDirectThread: boolean;
  participantCount: number;
  typingLabel: string | null;
  onBackPress: () => void;
  onCallPress: () => void;
  onClearSelection: () => void;
  onReply: () => void;
  onForward: () => void;
  onPin: () => void;
  onStar: () => void;
  onDelete: () => void;
}) {
  if (selectedMessage) {
    return (
      <ThreadSelectionActions
        count={1}
        scale={scale}
        onClear={onClearSelection}
        onReply={onReply}
        onForward={onForward}
        onPin={onPin}
        onStar={onStar}
        onDelete={onDelete}
      />
    );
  }

  return (
    <ThreadHeader
      title={title}
      isSocketConnected={isSocketConnected}
      isDirectThread={isDirectThread}
      participantCount={participantCount}
      typingLabel={typingLabel}
      scale={scale}
      onBackPress={onBackPress}
      onCallPress={onCallPress}
    />
  );
}
