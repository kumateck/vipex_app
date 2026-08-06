import type { Participant, Room } from 'livekit-client';
import { Track } from 'livekit-client';

type VoiceSocketParticipant = {
  userId: string;
  displayName?: string;
  joinedAt: string;
  isMuted: boolean;
  isVideoOff: boolean;
};

export type RuntimeAudioSession = {
  startAudioSession: () => Promise<void> | void;
  stopAudioSession: () => Promise<void> | void;
  selectAudioOutput: (
    route: 'force_speaker' | 'default' | 'speaker' | 'earpiece',
  ) => Promise<void> | void;
};

type LiveKitRuntime = {
  AudioSession: RuntimeAudioSession;
  Room: typeof import('livekit-client').Room;
  RoomEvent: typeof import('livekit-client').RoomEvent;
  ConnectionQuality: typeof import('livekit-client').ConnectionQuality;
};

let liveKitRuntimePromise: Promise<LiveKitRuntime> | null = null;

export function getLiveKitRuntime() {
  if (!liveKitRuntimePromise) {
    liveKitRuntimePromise = Promise.all([
      import('@livekit/react-native'),
      import('livekit-client'),
    ]).then(([nativeMod, clientMod]) => ({
      AudioSession: nativeMod.AudioSession as RuntimeAudioSession,
      Room: clientMod.Room,
      RoomEvent: clientMod.RoomEvent,
      ConnectionQuality: clientMod.ConnectionQuality,
    }));
  }
  return liveKitRuntimePromise;
}

export function buildVideoTrackByUserId(room: Room): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  const applyParticipant = (participant: Participant) => {
    if (!participant?.identity || !participant.videoTrackPublications) return;
    for (const publication of participant.videoTrackPublications.values()) {
      if (!publication?.track || publication.source !== Track.Source.Camera) continue;
      next[participant.identity] = {
        participant,
        publication,
        source: publication.source,
      };
      break;
    }
  };

  applyParticipant(room.localParticipant);
  for (const participant of room.remoteParticipants.values()) {
    applyParticipant(participant);
  }

  return next;
}

export function mergeParticipantsFromRoom(
  room: Room,
  prev: VoiceSocketParticipant[],
  currentUserId: string | null | undefined,
) {
  const nextByUserId = new Map(prev.map((item) => [item.userId, item]));
  const syncParticipant = (participant: Participant) => {
    const userId = participant.identity?.trim();
    if (!userId) return;
    const existing = nextByUserId.get(userId);
    const hasCameraPublication = [...participant.videoTrackPublications.values()].some(
      (publication) => publication.source === Track.Source.Camera,
    );
    const isMuted = participant.isMicrophoneEnabled === false;
    const isVideoOff = participant.isCameraEnabled === false || !hasCameraPublication;
    nextByUserId.set(userId, {
      userId,
      displayName:
        participant.name?.trim() ||
        existing?.displayName ||
        (userId === currentUserId ? 'You' : userId),
      joinedAt: existing?.joinedAt || new Date().toISOString(),
      isMuted,
      isVideoOff,
    });
  };

  syncParticipant(room.localParticipant);
  for (const participant of room.remoteParticipants.values()) {
    syncParticipant(participant);
  }

  return [...nextByUserId.values()].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
}
