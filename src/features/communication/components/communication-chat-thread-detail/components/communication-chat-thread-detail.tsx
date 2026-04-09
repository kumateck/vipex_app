import { ArrowLeft, Phone, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { CreateCallBubbleDialog } from '../create-call-bubble-dialog';
import { RecorderDialog } from '../recorder-dialog';
import { ScheduleMeetingBubbleDialog } from '../schedule-meeting-bubble-dialog';
import { UploadAttachmentDialog } from '../upload-attachment-dialog';
import { VideoPlayerDialog } from '../video-player-dialog';
import { useChatThreadActions } from '../hooks/use-chat-thread-actions';
import { useChatThreadComposer } from '../hooks/use-chat-thread-composer';
import { useChatThreadData } from '../hooks/use-chat-thread-data';
import { useChatThreadUpload } from '../hooks/use-chat-thread-upload';
import { hasUserFlag, prettyValue } from '../utils/communication-chat-thread-detail-message';
import { ChatThreadComposer } from './chat-thread-composer';
import { ChatThreadMessages } from './chat-thread-messages';

export function CommunicationChatThreadDetail({ threadId }: { threadId: string }) {
  const currentUserId = useAuthStore((state) => state.user?.id ?? '');
  const navigate = useNavigate();
  const normalizedThreadId = threadId.trim();

  const data = useChatThreadData({ normalizedThreadId, currentUserId });
  const composer = useChatThreadComposer({
    normalizedThreadId,
    userOptions: data.userOptions,
    usersById: data.usersById,
    setTyping: data.setTyping,
    refetchMessages: data.refetchMessages,
  });
  const actions = useChatThreadActions({
    normalizedThreadId,
    selectedThread: data.selectedThread,
    refetchMessages: data.refetchMessages,
  });
  const upload = useChatThreadUpload({
    normalizedThreadId,
    refetchMessages: data.refetchMessages,
    setTyping: data.setTyping,
  });

  const onReplyMessage = (message: (typeof data.messages)[number]) => {
    composer.setReplyToMessage(message);
    composer.setEditingMessage(null);
  };

  const onEditMessage = (message: (typeof data.messages)[number]) => {
    composer.setEditingMessage(message);
    composer.setNewMessage(message.body ?? '');
    composer.setReplyToMessage(null);
  };

  return (
    <div className="w-full p-3">
      <div className="flex h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-2xl border bg-background shadow">
        <div className="z-20 flex shrink-0 items-center justify-between border-b bg-background/95 px-3 py-2 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => navigate('/communication/chat')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {(data.selectedThread?.title || 'T').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {data.selectedThread?.title || 'Untitled thread'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {data.selectedThread
                  ? prettyValue(data.selectedThread.threadType)
                  : 'Conversation thread'}
                {data.selectedThread?.participantCount
                  ? ` • ${data.selectedThread.participantCount} members`
                  : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => {
                actions.setCreateCallType('audio');
                actions.setIsCallDialogOpen(true);
              }}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => {
                actions.setCreateCallType('video');
                actions.setIsCallDialogOpen(true);
              }}
            >
              <Video className="h-4 w-4" />
            </Button>
            <Badge
              variant={data.isSocketConnected ? 'default' : 'outline'}
              className="ml-1 hidden sm:inline-flex"
            >
              {data.isSocketConnected ? 'Live' : 'Offline'}
            </Badge>
          </div>
        </div>

        <ChatThreadMessages
          messagesViewportRef={data.messagesViewportRef}
          onMessagesScroll={data.onMessagesScroll}
          isLoadingOlder={data.isLoadingOlder}
          isLoadingMessages={data.isLoadingMessages}
          messages={data.messages}
          currentUserId={currentUserId}
          usersById={data.usersById}
          threadCalls={data.threadCalls}
          reactionMenuMessageId={data.reactionMenuMessageId}
          actionsMenuMessageId={data.actionsMenuMessageId}
          setReactionMenuMessageId={data.setReactionMenuMessageId}
          setActionsMenuMessageId={data.setActionsMenuMessageId}
          nowTs={data.nowTs}
          resolveMentionLabel={composer.resolveMentionLabel}
          resolveReplySenderLabel={composer.resolveReplySenderLabel}
          onReplyMessage={onReplyMessage}
          onForwardMessage={(message) => void actions.onForwardMessage(message)}
          onToggleFlag={(message, flag) => {
            const enabled = !hasUserFlag(message, currentUserId, flag);
            void actions.onToggleFlag(message, flag, enabled);
          }}
          onEditMessage={onEditMessage}
          onDeleteMessage={(message) => void actions.onDeleteMessage(message)}
          onQuickReact={(message, emoji) => void actions.onQuickReact(message, emoji)}
          onOpenVideoAttachment={upload.onOpenVideoAttachment}
          typingUserLabels={data.typingUserLabels}
        />

        <ChatThreadComposer
          normalizedThreadId={normalizedThreadId}
          replyToMessage={composer.replyToMessage}
          setReplyToMessage={composer.setReplyToMessage}
          editingMessage={composer.editingMessage}
          setEditingMessage={composer.setEditingMessage}
          usersById={data.usersById}
          showMediaComposer={composer.showMediaComposer}
          setShowMediaComposer={composer.setShowMediaComposer}
          messageKind={composer.messageKind}
          setMessageKind={composer.setMessageKind}
          mediaUrl={composer.mediaUrl}
          setMediaUrl={composer.setMediaUrl}
          mediaLabel={composer.mediaLabel}
          setMediaLabel={composer.setMediaLabel}
          isSendingMessage={composer.isSendingMessage}
          openFilePicker={upload.openFilePicker}
          onOpenCallDialog={() => actions.setIsCallDialogOpen(true)}
          onOpenMeetingDialog={() => actions.setIsMeetingDialogOpen(true)}
          onRecordAudio={() => void upload.recording.onRecordMedia('audio')}
          onRecordVideo={() => void upload.recording.onRecordMedia('video')}
          isMentionMenuOpen={composer.isMentionMenuOpen}
          mentionSuggestions={composer.mentionSuggestions}
          activeMentionIndex={composer.activeMentionIndex}
          insertMentionSuggestion={composer.insertMentionSuggestion}
          composerInputRef={composer.composerInputRef}
          newMessage={composer.newMessage}
          setComposerCaret={composer.setComposerCaret}
          onMessageInputChange={composer.onMessageInputChange}
          onInputBlur={() => {
            if (normalizedThreadId) data.setTyping(normalizedThreadId, false);
          }}
          onInputKeyDown={composer.onInputKeyDown}
          canSendMessage={composer.canSendMessage}
          onSendMessage={() => void composer.onSendMessage()}
          isPreparingRecording={upload.recording.isPreparingRecording}
        />

        <UploadAttachmentDialog
          open={upload.isUploadDialogOpen}
          onOpenChange={(open) =>
            open ? upload.setIsUploadDialogOpen(true) : upload.clearPendingUpload()
          }
          pendingUpload={upload.pendingUpload}
          onFilesChange={upload.onPickFilesFromDrop}
          accept={upload.filePickerAccept}
          isUploadingFile={upload.isUploadingFile}
          isSendingMessage={upload.isSendingUploadedMessage}
          uploadCaption={upload.uploadCaption}
          onUploadCaptionChange={upload.setUploadCaption}
          onCancel={upload.clearPendingUpload}
          onUpload={() => void upload.onUploadPickedFile()}
        />

        <RecorderDialog
          open={upload.recording.isRecorderDialogOpen}
          onOpenChange={(open) =>
            open
              ? upload.recording.setIsRecorderDialogOpen(true)
              : upload.recording.closeRecorderDialog()
          }
          recordingMode={upload.recording.recordingMode}
          isRecording={upload.recording.isRecording}
          recordingElapsedSec={upload.recording.recordingElapsedSec}
          recorderPreviewRef={upload.recording.recorderPreviewRef}
          isPreparingRecording={upload.recording.isPreparingRecording}
          onCancel={() => upload.recording.closeRecorderDialog()}
          onStopRecording={upload.recording.onStopRecording}
        />

        <VideoPlayerDialog
          open={upload.isVideoPlayerDialogOpen}
          onOpenChange={(open) => {
            upload.setIsVideoPlayerDialogOpen(open);
            if (!open) upload.setActiveVideoAttachment(null);
          }}
          activeVideoAttachment={upload.activeVideoAttachment}
        />

        <CreateCallBubbleDialog
          open={actions.isCallDialogOpen}
          onOpenChange={actions.setIsCallDialogOpen}
          createCallType={actions.createCallType}
          onCreateCallTypeChange={actions.setCreateCallType}
          onCancel={() => actions.setIsCallDialogOpen(false)}
          onCreate={() => void actions.onCreateCallBubble()}
          isCreatingCall={actions.isCreatingCall}
        />

        <ScheduleMeetingBubbleDialog
          open={actions.isMeetingDialogOpen}
          onOpenChange={actions.setIsMeetingDialogOpen}
          meetingTitle={actions.meetingTitle}
          onMeetingTitleChange={actions.setMeetingTitle}
          meetingLink={actions.meetingLink}
          onMeetingLinkChange={actions.setMeetingLink}
          meetingStartAt={actions.meetingStartAt}
          onMeetingStartAtChange={actions.setMeetingStartAt}
          meetingReminderMinutes={actions.meetingReminderMinutes}
          onMeetingReminderMinutesChange={actions.setMeetingReminderMinutes}
          onCancel={() => actions.setIsMeetingDialogOpen(false)}
          onCreate={() => void actions.onCreateMeetingBubble()}
        />
      </div>
    </div>
  );
}
