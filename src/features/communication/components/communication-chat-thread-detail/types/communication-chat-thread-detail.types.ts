export type MediaKind = 'image' | 'video' | 'audio' | 'file';

export type MediaAttachment = {
  kind: MediaKind;
  url: string;
  label?: string;
  thumbnailUrl?: string;
};

export type ComposerMessageKind = 'text' | MediaKind;

export type PendingFileUpload = {
  file: File;
  dataUrl: string;
  previewUrl: string;
  kind: MediaKind;
  recordingDurationSec?: number;
  videoThumbnailDataUrl?: string;
};

export type RecordingMode = 'audio' | 'video';

export type MentionSuggestion = {
  key: string;
  label: string;
  subLabel: string;
  insertHandle: string;
};

export const typingDotStyle = ['0ms', '180ms', '360ms'] as const;

export const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const;

export const SUPPORTED_UPLOAD_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);
