import { useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent, Track, type LocalVideoTrack } from 'livekit-client';
import { toast } from 'sonner';
import {
  useCreateCommunicationCallLivekitTokenMutation,
  useJoinVoiceChannelMutation,
  useUpdateCommunicationCallStatusMutation,
  type CommunicationCallSession,
} from '../../../api/communication.api';
import type { CallParticipant, RemoteMediaTrack } from '../types/communication-call-room.types';
import { toRemoteKind } from '../utils/communication-call-room-utils';
import { useCommunicationCallRoomDevices } from './use-communication-call-room-devices';

export function useCommunicationCallRoomMedia({
  callId,
  call,
  currentParticipant,
  joinCall,
  leaveCall,
  setCallMediaState,
  requestCallParticipants,
}: {
  callId: string;
  call: CommunicationCallSession | null;
  currentParticipant: CallParticipant | null;
  joinCall: (callId: string) => void;
  leaveCall: (callId: string) => void;
  setCallMediaState: (callId: string, media: { isMuted?: boolean; isVideoOff?: boolean }) => void;
  requestCallParticipants: (callId: string) => void;
}) {
  const roomRef = useRef<Room | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isMediaConnecting, setIsMediaConnecting] = useState(false);
  const [isMediaConnected, setIsMediaConnected] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(null);
  const [remoteTracks, setRemoteTracks] = useState<RemoteMediaTrack[]>([]);
  const [activeSpeakerUserIds, setActiveSpeakerUserIds] = useState<string[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [createLivekitToken] = useCreateCommunicationCallLivekitTokenMutation();
  const [joinVoiceChannel] = useJoinVoiceChannelMutation();
  const [updateCallStatus] = useUpdateCommunicationCallStatusMutation();
  const {
    audioInputDevices,
    videoInputDevices,
    audioOutputDevices,
    selectedAudioInputDeviceId,
    selectedVideoInputDeviceId,
    selectedAudioOutputDeviceId,
    refreshDevices,
    onSelectAudioInput,
    onSelectVideoInput,
    onSelectAudioOutput,
  } = useCommunicationCallRoomDevices(roomRef);

  const remoteVideoTracks = useMemo(
    () => remoteTracks.filter((row) => row.kind === 'video'),
    [remoteTracks],
  );

  const remoteAudioTracks = useMemo(
    () => remoteTracks.filter((row) => row.kind === 'audio'),
    [remoteTracks],
  );

  useEffect(() => {
    if (!currentParticipant) return;
    setIsMuted(currentParticipant.isMuted);
    setIsVideoOff(currentParticipant.isVideoOff);
  }, [currentParticipant]);

  const resetMediaState = () => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setIsMediaConnected(false);
    setLocalVideoTrack(null);
    setRemoteTracks([]);
    setIsScreenSharing(false);
    setActiveSpeakerUserIds([]);
  };

  useEffect(
    () => () => {
      leaveCall(callId);
      resetMediaState();
    },
    [callId, leaveCall],
  );

  const syncLocalVideoTrack = (room: Room) => {
    for (const publication of room.localParticipant.videoTrackPublications.values()) {
      if (publication.track && publication.track.kind === Track.Kind.Video) {
        setLocalVideoTrack(publication.track as LocalVideoTrack);
        return;
      }
    }
    setLocalVideoTrack(null);
  };

  const connectLivekitRoom = async () => {
    if (!call) return;
    setMediaError(null);
    setIsMediaConnecting(true);
    try {
      const tokenPayload = call.channelId
        ? (await joinVoiceChannel({ channelId: call.channelId }).unwrap()).livekit
        : await createLivekitToken({ id: call.id }).unwrap();
      const room = new Room();
      roomRef.current = room;

      const syncScreenShareState = () => {
        const hasScreenShare = [...room.localParticipant.videoTrackPublications.values()].some(
          (publication) =>
            publication.track &&
            publication.source === Track.Source.ScreenShare &&
            !publication.isMuted,
        );
        setIsScreenSharing(hasScreenShare);
      };

      room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        setRemoteTracks((prev) => {
          const trackId = track.sid ?? `${participant.identity}-${track.kind}-${Date.now()}`;
          const next = prev.filter((item) => item.id !== trackId);
          next.push({
            id: trackId,
            userId: participant.identity,
            kind: toRemoteKind(track.kind),
            track,
          });
          return next;
        });
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        setRemoteTracks((prev) => prev.filter((item) => item.id !== track.sid));
      });

      room.on(RoomEvent.Disconnected, () => {
        setIsMediaConnected(false);
        setLocalVideoTrack(null);
        setRemoteTracks([]);
        setActiveSpeakerUserIds([]);
      });

      room.on(RoomEvent.LocalTrackPublished, () => {
        syncLocalVideoTrack(room);
        syncScreenShareState();
      });

      room.on(RoomEvent.LocalTrackUnpublished, () => {
        syncLocalVideoTrack(room);
        syncScreenShareState();
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        setActiveSpeakerUserIds(speakers.map((participant) => participant.identity));
      });

      await room.connect(tokenPayload.livekitUrl, tokenPayload.token);
      if (selectedAudioInputDeviceId)
        await room.switchActiveDevice('audioinput', selectedAudioInputDeviceId);
      if (selectedVideoInputDeviceId)
        await room.switchActiveDevice('videoinput', selectedVideoInputDeviceId);
      if (selectedAudioOutputDeviceId)
        await room.switchActiveDevice('audiooutput', selectedAudioOutputDeviceId);
      await room.localParticipant.setMicrophoneEnabled(!isMuted);
      await room.localParticipant.setCameraEnabled(!isVideoOff);
      syncLocalVideoTrack(room);
      syncScreenShareState();
      await refreshDevices();
      setIsMediaConnected(true);
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : 'Unable to connect media room.');
      throw error;
    } finally {
      setIsMediaConnecting(false);
    }
  };

  const onJoin = async () => {
    if (!callId) return;
    try {
      if (!isMediaConnected) {
        await connectLivekitRoom();
      }
      joinCall(callId);
      requestCallParticipants(callId);
      if (!call) return;
      if (call.status === 'pending' || call.status === 'ringing') {
        await updateCallStatus({ id: call.id, status: 'active' }).unwrap();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join call room.');
    }
  };

  const onLeave = () => {
    if (!callId) return;
    leaveCall(callId);
    resetMediaState();
  };

  const onToggleMuted = async () => {
    if (!callId) return;
    const next = !isMuted;
    setIsMuted(next);
    setCallMediaState(callId, { isMuted: next });
    if (roomRef.current) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!next);
    }
  };

  const onToggleVideo = async () => {
    if (!callId) return;
    const next = !isVideoOff;
    try {
      setIsVideoOff(next);
      setCallMediaState(callId, { isVideoOff: next });
      if (roomRef.current) {
        await roomRef.current.localParticipant.setCameraEnabled(!next);
        syncLocalVideoTrack(roomRef.current);
      }
    } catch {
      setIsVideoOff((prev) => !prev);
      toast.error('Unable to toggle camera. Check camera permission/device.');
    }
  };

  const onToggleScreenShare = async () => {
    if (!roomRef.current || !isMediaConnected) return;

    const isDesktopProtocolError = (error: unknown) => {
      if (!(error instanceof Error)) return false;
      const msg = error.message.toLowerCase();
      return (
        msg.includes('getdisplaymedia') ||
        msg.includes('display media') ||
        msg.includes('not supported') ||
        msg.includes('permission denied') ||
        msg.includes('denied') ||
        msg.includes('aborted')
      );
    };

    try {
      const next = !isScreenSharing;
      await roomRef.current.localParticipant.setScreenShareEnabled(next);
      setIsScreenSharing(next);
      if (next) toast.success('Screen sharing started.');
    } catch (error) {
      if (isDesktopProtocolError(error)) {
        toast.error('Screen share needs desktop capture support in Electron (getDisplayMedia).');
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Unable to toggle screen share.');
    }
  };

  return {
    isMuted,
    isVideoOff,
    isMediaConnecting,
    isMediaConnected,
    mediaError,
    localVideoTrack,
    remoteTracks,
    remoteVideoTracks,
    remoteAudioTracks,
    audioInputDevices,
    videoInputDevices,
    audioOutputDevices,
    selectedAudioInputDeviceId,
    selectedVideoInputDeviceId,
    selectedAudioOutputDeviceId,
    activeSpeakerUserIds,
    isScreenSharing,
    onJoin,
    onLeave,
    onToggleMuted,
    onToggleVideo,
    onToggleScreenShare,
    onSelectAudioInput,
    onSelectVideoInput,
    onSelectAudioOutput,
  };
}
