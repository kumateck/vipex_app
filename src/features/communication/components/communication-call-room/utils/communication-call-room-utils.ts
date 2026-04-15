import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';

export const AUDIO_INPUT_STORAGE_KEY = 'communication.audioInputDeviceId';
export const VIDEO_INPUT_STORAGE_KEY = 'communication.videoInputDeviceId';
export const AUDIO_OUTPUT_STORAGE_KEY = 'communication.audioOutputDeviceId';

export function readStoredDeviceId(storageKey: string): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(storageKey) ?? '';
}

export function writeStoredDeviceId(storageKey: string, value: string) {
  if (typeof window === 'undefined') return;
  if (!value) {
    window.localStorage.removeItem(storageKey);
    return;
  }
  window.localStorage.setItem(storageKey, value);
}

export function prettyValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return sharedFormatDateTime(value);
}

export function getParticipantLabel(params: {
  userId: string;
  displayName?: string | null;
  userLabelById: Map<string, string>;
  currentUserId: string;
}) {
  if (params.userId === params.currentUserId) return 'You';
  if (params.displayName?.trim()) return params.displayName.trim();
  const fromOptions = params.userLabelById.get(params.userId);
  if (fromOptions?.trim()) return fromOptions;
  return 'Participant';
}

export function toRemoteKind(kind: Track.Kind): 'audio' | 'video' {
  return kind === Track.Kind.Audio ? 'audio' : 'video';
}
