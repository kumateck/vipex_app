import {
  SUPPORTED_UPLOAD_MIME_TYPES,
  type PendingFileUpload,
  type RecordingMode,
} from '../types/communication-chat-thread-detail.types';
import {
  extractVideoThumbnailDataUrl,
  getFileExtensionByMimeType,
  normalizeMimeType,
  toDataUrl,
} from '../utils/communication-chat-thread-detail-media';

export async function buildRecordedUpload(params: {
  mode: RecordingMode;
  mimeType?: string;
  chunks: Blob[];
  recordingStartedAt: number | null;
}): Promise<PendingFileUpload> {
  const blobType =
    params.chunks[0]?.type ||
    params.mimeType ||
    (params.mode === 'video' ? 'video/webm' : 'audio/webm');
  const normalizedBlobType = normalizeMimeType(blobType);
  const blob = new Blob(params.chunks, { type: blobType });
  const extension = getFileExtensionByMimeType(
    normalizedBlobType || blobType,
    params.mode === 'video' ? 'webm' : 'wav',
  );
  const file = new File([blob], `recording-${Date.now()}.${extension}`, {
    type: normalizedBlobType || blobType,
  });

  if (!SUPPORTED_UPLOAD_MIME_TYPES.has(normalizeMimeType(file.type))) {
    throw new Error('Recorded format is not supported by the upload API.');
  }

  const recordingDurationSec =
    params.recordingStartedAt && params.recordingStartedAt > 0
      ? Math.max(1, Math.round((Date.now() - params.recordingStartedAt) / 1000))
      : undefined;

  const dataUrl = await toDataUrl(file);
  const previewUrl = URL.createObjectURL(file);
  const videoThumbnailDataUrl =
    params.mode === 'video' ? ((await extractVideoThumbnailDataUrl(file)) ?? undefined) : undefined;

  return {
    file,
    dataUrl,
    previewUrl,
    kind: params.mode,
    recordingDurationSec,
    videoThumbnailDataUrl,
  };
}
