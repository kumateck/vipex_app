import type { RemoteTrack } from 'livekit-client';

export type CallParticipant = {
  userId: string;
  displayName?: string;
  joinedAt: string;
  isMuted: boolean;
  isVideoOff: boolean;
};

export type RemoteMediaTrack = {
  id: string;
  userId: string;
  kind: 'audio' | 'video';
  track: RemoteTrack;
};
