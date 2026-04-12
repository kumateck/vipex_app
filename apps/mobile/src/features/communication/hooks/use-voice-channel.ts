import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { joinCommunicationVoiceChannel, markCommunicationChannelRead } from '@mobile/lib/api';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import type { Room } from 'livekit-client';
import { useCommunicationSocket } from '@mobile/features/communication/use-communication-socket';
import {
  buildVideoTrackByUserId,
  getLiveKitRuntime,
  mergeParticipantsFromRoom,
} from '@mobile/features/communication/hooks/voice-livekit';

export type VoiceSocketParticipant = {
  userId: string;
  displayName?: string;
  joinedAt: string;
  isMuted: boolean;
  isVideoOff: boolean;
};

export function useVoiceChannel() {
  const { withAuth, session } = useAuth();
  const params = useLocalSearchParams<{
    channelId?: string;
    name?: string;
    callId?: string;
    roomName?: string;
  }>();
  const channelId = (params.channelId ?? '').trim();
  const channelName = typeof params.name === 'string' ? params.name : 'Voice Channel';
  const roomRef = useRef<Room | null>(null);

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState<VoiceSocketParticipant[]>([]);
  const [videoTrackByUserId, setVideoTrackByUserId] = useState<Record<string, unknown>>({});
  const [latestCallId, setLatestCallId] = useState<string | null>(
    typeof params.callId === 'string' ? params.callId : null,
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [prejoinChecked, setPrejoinChecked] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<
    'good' | 'degraded' | 'poor' | 'unknown'
  >('unknown');
  const [audioRouteLabel, setAudioRouteLabel] = useState<'speaker' | 'earpiece' | 'default'>(
    'speaker',
  );

  const {
    isConnected: isSocketConnected,
    joinCall,
    leaveCall,
    requestCallParticipants,
    setCallMediaState,
  } = useCommunicationSocket(session.accessToken, {
    onCallParticipantsUpdated: (payload) => {
      if (!latestCallId || payload.callId !== latestCallId) return;
      setParticipants(payload.participants);
    },
  });

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!channelId) return;
    void withAuth((token) => markCommunicationChannelRead(token, { id: channelId })).catch(() => {
      // Non-blocking for voice experience; unread badge can sync later.
    });
  }, [channelId, withAuth]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const { AudioSession } = await getLiveKitRuntime();
        await AudioSession.startAudioSession();
        if (Platform.OS === 'ios') {
          await AudioSession.selectAudioOutput('force_speaker');
          setAudioRouteLabel('speaker');
        } else {
          await AudioSession.selectAudioOutput('speaker');
          setAudioRouteLabel('speaker');
        }
      } catch {
        // Non-blocking.
      }
      if (!mounted) return;
      setSpeakerOn(true);
    })();

    return () => {
      mounted = false;
      void (async () => {
        try {
          const { AudioSession } = await getLiveKitRuntime();
          await AudioSession.stopAudioSession();
        } catch {
          // non-blocking cleanup
        }
      })();
    };
  }, []);

  useEffect(() => {
    if (!latestCallId || !isSocketConnected) return;
    requestCallParticipants(latestCallId);
  }, [isSocketConnected, latestCallId, requestCallParticipants]);

  const syncVideoTracks = useCallback(
    (room: Room) => {
      setVideoTrackByUserId(buildVideoTrackByUserId(room));
      setParticipants((prev) => mergeParticipantsFromRoom(room, prev, session.user?.sub));
    },
    [session.user?.sub],
  );

  const connectToLiveKit = useCallback(
    async (payload: { livekitUrl: string; token: string }) => {
      const { Room, RoomEvent, ConnectionQuality } = await getLiveKitRuntime();
      roomRef.current?.disconnect();
      const room = new Room();
      roomRef.current = room;
      room.on(RoomEvent.Disconnected, () => {
        setConnected(false);
        setConnectionQuality('unknown');
        setVideoTrackByUserId({});
      });
      room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        if (!participant?.isLocal) return;
        if (quality === ConnectionQuality.Excellent || quality === ConnectionQuality.Good) {
          setConnectionQuality('good');
          return;
        }
        if (quality === ConnectionQuality.Poor) {
          setConnectionQuality('poor');
          return;
        }
        setConnectionQuality('degraded');
      });
      room.on(RoomEvent.TrackSubscribed, () => syncVideoTracks(room));
      room.on(RoomEvent.TrackUnsubscribed, () => syncVideoTracks(room));
      room.on(RoomEvent.TrackPublished, () => syncVideoTracks(room));
      room.on(RoomEvent.TrackUnpublished, () => syncVideoTracks(room));
      room.on(RoomEvent.LocalTrackPublished, () => syncVideoTracks(room));
      room.on(RoomEvent.LocalTrackUnpublished, () => syncVideoTracks(room));
      room.on(RoomEvent.ParticipantConnected, () => syncVideoTracks(room));
      room.on(RoomEvent.ParticipantDisconnected, () => syncVideoTracks(room));
      await room.connect(payload.livekitUrl, payload.token);
      await room.localParticipant.setMicrophoneEnabled(!isMuted);
      await room.localParticipant.setCameraEnabled(!isVideoOff);
      syncVideoTracks(room);
      setConnected(true);
    },
    [isMuted, isVideoOff, syncVideoTracks],
  );

  const onJoin = useCallback(async () => {
    if (!channelId) return;
    setJoining(true);
    try {
      const joined = await withAuth((token) => joinCommunicationVoiceChannel(token, { channelId }));
      setLatestCallId(joined.call.id);
      void withAuth((token) => markCommunicationChannelRead(token, { id: channelId })).catch(() => {
        // Non-blocking for voice join.
      });
      await connectToLiveKit({
        livekitUrl: joined.livekit.livekitUrl,
        token: joined.livekit.token,
      });
      joinCall(joined.call.id);
      requestCallParticipants(joined.call.id);
      notifySuccess('Joined voice channel session.');
    } catch (error) {
      notifyError(
        'Join failed',
        error instanceof Error ? error.message : 'Unable to join voice channel',
      );
    } finally {
      setJoining(false);
    }
  }, [channelId, connectToLiveKit, joinCall, requestCallParticipants, withAuth]);

  const onLeave = useCallback(() => {
    if (latestCallId) leaveCall(latestCallId);
    roomRef.current?.disconnect();
    roomRef.current = null;
    setConnected(false);
    setParticipants([]);
    setVideoTrackByUserId({});
  }, [latestCallId, leaveCall]);

  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room) {
      setIsMuted((prev) => !prev);
      return;
    }
    const next = !isMuted;
    try {
      await room.localParticipant.setMicrophoneEnabled(!next);
      setIsMuted(next);
      if (latestCallId) setCallMediaState(latestCallId, { isMuted: next });
    } catch {
      notifyError('Audio failed', 'Unable to update microphone state.');
    }
  }, [isMuted, latestCallId, setCallMediaState]);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) {
      setIsVideoOff((prev) => !prev);
      return;
    }
    const next = !isVideoOff;
    try {
      await room.localParticipant.setCameraEnabled(!next);
      setIsVideoOff(next);
      if (latestCallId) setCallMediaState(latestCallId, { isVideoOff: next });
    } catch {
      notifyError('Video failed', 'Unable to update camera state.');
    }
  }, [isVideoOff, latestCallId, setCallMediaState]);

  const toggleSpeaker = useCallback(async () => {
    const next = !speakerOn;
    try {
      const { AudioSession } = await getLiveKitRuntime();
      if (Platform.OS === 'ios') {
        await AudioSession.selectAudioOutput(next ? 'force_speaker' : 'default');
        setAudioRouteLabel(next ? 'speaker' : 'default');
      } else {
        await AudioSession.selectAudioOutput(next ? 'speaker' : 'earpiece');
        setAudioRouteLabel(next ? 'speaker' : 'earpiece');
      }
      setSpeakerOn(next);
    } catch {
      notifyError('Speaker failed', 'Unable to change audio output.');
    }
  }, [speakerOn]);

  const runPrejoinCheck = useCallback(async () => {
    try {
      const { AudioSession } = await getLiveKitRuntime();
      await AudioSession.startAudioSession();
      if (Platform.OS === 'ios') {
        await AudioSession.selectAudioOutput(speakerOn ? 'force_speaker' : 'default');
      } else {
        await AudioSession.selectAudioOutput(speakerOn ? 'speaker' : 'earpiece');
      }
      setPrejoinChecked(true);
      notifySuccess('Pre-join check complete.');
    } catch {
      notifyError('Pre-join check failed', 'Audio session could not be prepared.');
    }
  }, [speakerOn]);

  const orderedParticipants = useMemo(
    () => [...participants].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt)),
    [participants],
  );

  return {
    session,
    channelName,
    loading,
    joining,
    connected,
    orderedParticipants,
    videoTrackByUserId,
    latestCallId,
    isMuted,
    isVideoOff,
    speakerOn,
    prejoinChecked,
    connectionQuality,
    audioRouteLabel,
    isSocketConnected,
    onJoin,
    onLeave,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    runPrejoinCheck,
  };
}
