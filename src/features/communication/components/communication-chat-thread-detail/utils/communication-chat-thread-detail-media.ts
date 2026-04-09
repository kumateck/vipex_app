import type { CommunicationMessage } from '../../../api/communication.api';
import type {
  MediaAttachment,
  MediaKind,
  RecordingMode,
} from '../types/communication-chat-thread-detail.types';

export function normalizeMimeType(mimeType: string | null | undefined) {
  if (!mimeType) return '';
  return mimeType.split(';')[0]?.trim().toLowerCase() ?? '';
}

export function getFileExtensionByMimeType(mimeType: string, fallback: string) {
  const normalizedMimeType = normalizeMimeType(mimeType);
  const map: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
  };
  return map[normalizedMimeType] ?? fallback;
}

export function pickSupportedRecorderMimeType(mode: RecordingMode): string | null {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') return null;
  const candidates =
    mode === 'video' ? ['video/webm', 'video/mp4'] : ['audio/webm', 'audio/ogg', 'audio/mp4'];
  for (const candidate of candidates) {
    if (window.MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return null;
}

export async function toDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed reading file: ${file.name}`));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

export async function extractVideoThumbnailDataUrl(file: File): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'metadata';
    video.src = objectUrl;
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      const onLoadedData = () => resolve();
      const onError = () => reject(new Error('Failed to load video for thumbnail'));
      video.addEventListener('loadeddata', onLoadedData, { once: true });
      video.addEventListener('error', onError, { once: true });
    });

    if (!video.videoWidth || !video.videoHeight) return null;
    const maxWidth = 360;
    const targetWidth = Math.min(maxWidth, video.videoWidth);
    const targetHeight = Math.max(
      1,
      Math.round((video.videoHeight * targetWidth) / video.videoWidth),
    );

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(video, 0, 0, targetWidth, targetHeight);
    return canvas.toDataURL('image/jpeg', 0.72);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function firstString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

export function normalizeMediaKind(raw: unknown): MediaKind | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim().toLowerCase();
  if (value === 'image' || value === 'video' || value === 'audio' || value === 'file') return value;
  if (value.startsWith('image/')) return 'image';
  if (value.startsWith('video/')) return 'video';
  if (value.startsWith('audio/')) return 'audio';
  return null;
}

export function inferKindFromUrl(url: string): MediaKind {
  const normalized = url.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?|#|$)/.test(normalized)) return 'image';
  if (/\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/.test(normalized)) return 'video';
  if (/\.(mp3|wav|m4a|aac|oga|flac)(\?|#|$)/.test(normalized)) return 'audio';
  return 'file';
}

export function extractMediaAttachments(message: CommunicationMessage): MediaAttachment[] {
  const metadata = asRecord(message.metadataJson);
  const attachmentsRaw = metadata?.attachments;

  if (Array.isArray(attachmentsRaw)) {
    const parsedAttachments = attachmentsRaw
      .map((attachment): MediaAttachment | null => {
        const record = asRecord(attachment);
        if (!record) return null;
        const url = firstString([record.url, record.src, record.href]);
        if (!url) return null;
        const kind =
          normalizeMediaKind(record.kind ?? record.type ?? record.mimeType) ??
          inferKindFromUrl(url);
        const label = firstString([record.name, record.filename, record.title]) ?? undefined;
        const thumbnailUrl =
          firstString([
            record.thumbnailUrl,
            record.thumbnailSrc,
            record.posterUrl,
            record.previewImage,
          ]) ?? undefined;
        return { kind, url, label, thumbnailUrl };
      })
      .filter((attachment): attachment is MediaAttachment => attachment !== null);
    if (parsedAttachments.length) return parsedAttachments;
  }

  const singleUrl = firstString([
    metadata?.url,
    metadata?.src,
    metadata?.href,
    metadata?.mediaUrl,
    metadata?.fileUrl,
  ]);
  if (!singleUrl) return [];

  const explicitKind = normalizeMediaKind(
    metadata?.kind ?? metadata?.type ?? metadata?.mimeType ?? message.messageType,
  );
  return [
    {
      kind: explicitKind ?? inferKindFromUrl(singleUrl),
      url: singleUrl,
      label: firstString([metadata?.name, metadata?.filename, metadata?.title]) ?? undefined,
      thumbnailUrl:
        firstString([
          metadata?.thumbnailUrl,
          metadata?.thumbnailSrc,
          metadata?.posterUrl,
          metadata?.previewImage,
        ]) ?? undefined,
    },
  ];
}
