import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useUploadImageMutation } from '@/features/uploads/api/uploads.api';
import { useCreateCommunicationMessageMutation } from '../../../api/communication.api';
import {
  extractVideoThumbnailDataUrl,
  normalizeMediaKind,
  toDataUrl,
} from '../utils/communication-chat-thread-detail-media';
import {
  SUPPORTED_UPLOAD_MIME_TYPES,
  type PendingFileUpload,
} from '../types/communication-chat-thread-detail.types';
import { useChatThreadRecording } from './use-chat-thread-recording';

type UseChatThreadUploadParams = {
  normalizedThreadId: string;
  refetchMessages: () => void;
  setTyping: (threadId: string, isTyping: boolean) => void;
};

export function useChatThreadUpload({
  normalizedThreadId,
  refetchMessages,
  setTyping,
}: UseChatThreadUploadParams) {
  const [pendingUpload, setPendingUpload] = useState<PendingFileUpload | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [filePickerAccept, setFilePickerAccept] = useState('*/*');
  const [isVideoPlayerDialogOpen, setIsVideoPlayerDialogOpen] = useState(false);
  const [activeVideoAttachment, setActiveVideoAttachment] = useState<{
    url: string;
    label?: string;
  } | null>(null);
  const [recordingPreviewUrl, setRecordingPreviewUrl] = useState<string | null>(null);

  const [uploadImage, { isLoading: isUploadingFile }] = useUploadImageMutation();
  const [createMessage, { isLoading: isSendingUploadedMessage }] =
    useCreateCommunicationMessageMutation();

  const recording = useChatThreadRecording({
    onRecorded: (pending) => {
      if (recordingPreviewUrl) {
        URL.revokeObjectURL(recordingPreviewUrl);
      }
      setRecordingPreviewUrl(pending.previewUrl);
      setPendingUpload(pending);
      setUploadCaption('');
      setIsUploadDialogOpen(true);
    },
  });

  useEffect(() => {
    return () => {
      if (pendingUpload?.previewUrl) {
        URL.revokeObjectURL(pendingUpload.previewUrl);
      }
    };
  }, [pendingUpload]);

  useEffect(() => {
    return () => {
      if (recordingPreviewUrl) {
        URL.revokeObjectURL(recordingPreviewUrl);
      }
    };
  }, [recordingPreviewUrl]);

  const openFilePicker = (accept: string) => {
    setFilePickerAccept(accept);
    setIsUploadDialogOpen(true);
  };

  const handlePickedFile = async (file: File) => {
    if (!file) return;
    if (!SUPPORTED_UPLOAD_MIME_TYPES.has(file.type)) {
      toast.error(
        'Unsupported file type. Use image, audio/video, pdf, txt, zip, doc, docx, xls, or xlsx.',
      );
      return;
    }

    try {
      const dataUrl = await toDataUrl(file);
      const previewUrl = URL.createObjectURL(file);
      const kind =
        normalizeMediaKind(file.type) ?? (file.type.startsWith('image/') ? 'image' : 'file');
      const videoThumbnailDataUrl =
        kind === 'video' ? ((await extractVideoThumbnailDataUrl(file)) ?? undefined) : undefined;
      if (pendingUpload?.previewUrl) {
        URL.revokeObjectURL(pendingUpload.previewUrl);
      }
      setPendingUpload({ file, dataUrl, previewUrl, kind, videoThumbnailDataUrl });
      setUploadCaption('');
      setIsUploadDialogOpen(true);
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to open file preview.');
    }
  };

  const onPickFilesFromDrop = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    void handlePickedFile(file);
  };

  const clearPendingUpload = () => {
    if (pendingUpload?.previewUrl) {
      URL.revokeObjectURL(pendingUpload.previewUrl);
    }
    setPendingUpload(null);
    setUploadCaption('');
    setIsUploadDialogOpen(false);
  };

  const onUploadPickedFile = async () => {
    if (!pendingUpload || !normalizedThreadId) return;
    try {
      const uploaded = await uploadImage({
        modelType: 'communication-message',
        modelId: normalizedThreadId,
        fileName: pendingUpload.file.name,
        dataUrl: pendingUpload.dataUrl,
      }).unwrap();

      await createMessage({
        threadId: normalizedThreadId,
        body: uploadCaption.trim() || null,
        messageType: pendingUpload.kind,
        metadataJson: {
          url: uploaded.url,
          kind: pendingUpload.kind,
          name: uploaded.fileName,
          contentType: uploaded.contentType,
          sizeBytes: uploaded.sizeBytes,
          uploadId: uploaded.id,
          ...(pendingUpload.kind === 'video' && pendingUpload.videoThumbnailDataUrl
            ? { thumbnailUrl: pendingUpload.videoThumbnailDataUrl }
            : {}),
          ...(typeof pendingUpload.recordingDurationSec === 'number'
            ? {
                recordingDurationSec: pendingUpload.recordingDurationSec,
                durationSec: pendingUpload.recordingDurationSec,
              }
            : {}),
        },
      }).unwrap();

      clearPendingUpload();
      setTyping(normalizedThreadId, false);
      refetchMessages();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to upload file.');
    }
  };

  const onOpenVideoAttachment = (url: string, label?: string) => {
    setActiveVideoAttachment({ url, label });
    setIsVideoPlayerDialogOpen(true);
  };

  return {
    pendingUpload,
    uploadCaption,
    setUploadCaption,
    isUploadDialogOpen,
    setIsUploadDialogOpen,
    filePickerAccept,
    openFilePicker,
    handlePickedFile,
    onPickFilesFromDrop,
    clearPendingUpload,
    onUploadPickedFile,
    isUploadingFile,
    isSendingUploadedMessage,
    isVideoPlayerDialogOpen,
    setIsVideoPlayerDialogOpen,
    activeVideoAttachment,
    setActiveVideoAttachment,
    onOpenVideoAttachment,
    recording,
  };
}
