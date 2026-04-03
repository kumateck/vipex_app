import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { AudioSession } from '@livekit/react-native';
import { Room, RoomEvent } from 'livekit-client';
import { AppScreen } from '@mobile/components/screen';
import {
  joinCommunicationVoiceChannel,
  listCommunicationCalls,
  markCommunicationChannelRead,
} from '@mobile/lib/api';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { CommunicationCallSession } from '@mobile/types/communication';
import { useCommunicationSocket } from '@mobile/features/communication/use-communication-socket';
import { AppButton, AppCard } from '@/components/ui/mobile';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

type SocketParticipant = {
  userId: string;
  displayName?: string;
  joinedAt: string;
  isMuted: boolean;
  isVideoOff: boolean;
};

function formatTime(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

export default function MobileVoiceChannelScreen() {
  const { theme } = useAppearance();
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
  const [calls, setCalls] = useState<CommunicationCallSession[]>([]);
  const [participants, setParticipants] = useState<SocketParticipant[]>([]);
  const [latestCallId, setLatestCallId] = useState<string | null>(
    typeof params.callId === 'string' ? params.callId : null,
  );
  const [latestRoomName, setLatestRoomName] = useState<string | null>(
    typeof params.roomName === 'string' ? params.roomName : null,
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [audioRouteLabel, setAudioRouteLabel] = useState<'speaker' | 'earpiece' | 'default'>(
    'speaker',
  );

  const loadCalls = useCallback(async () => {
    if (!channelId) return;
    setLoading(true);
    try {
      const next = await withAuth((token) => listCommunicationCalls(token, { channelId }));
      setCalls(next);
    } catch (error) {
      notifyError(
        'Voice load failed',
        error instanceof Error ? error.message : 'Unable to load voice channel data',
      );
    } finally {
      setLoading(false);
    }
  }, [channelId, withAuth]);

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
    onCallUpdated: (payload) => {
      if (!payload.channelId || payload.channelId !== channelId) return;
      void loadCalls();
    },
  });

  useEffect(() => {
    void loadCalls();
  }, [loadCalls]);

  useEffect(() => {
    if (!channelId) return;
    void withAuth((token) => markCommunicationChannelRead(token, { id: channelId }));
  }, [channelId, withAuth]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
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
      void AudioSession.stopAudioSession();
    };
  }, []);

  useEffect(() => {
    if (!latestCallId || !isSocketConnected) return;
    requestCallParticipants(latestCallId);
  }, [isSocketConnected, latestCallId, requestCallParticipants]);

  const connectToLiveKit = async (payload: { livekitUrl: string; token: string }) => {
    roomRef.current?.disconnect();
    const room = new Room();
    roomRef.current = room;
    room.on(RoomEvent.Disconnected, () => {
      setConnected(false);
    });
    await room.connect(payload.livekitUrl, payload.token);
    await room.localParticipant.setMicrophoneEnabled(!isMuted);
    await room.localParticipant.setCameraEnabled(!isVideoOff);
    setConnected(true);
  };

  const onJoin = async () => {
    if (!channelId) return;
    setJoining(true);
    try {
      const joined = await withAuth((token) => joinCommunicationVoiceChannel(token, { channelId }));
      setLatestCallId(joined.call.id);
      setLatestRoomName(joined.livekit.roomName);
      await withAuth((token) => markCommunicationChannelRead(token, { id: channelId }));
      await connectToLiveKit({
        livekitUrl: joined.livekit.livekitUrl,
        token: joined.livekit.token,
      });
      joinCall(joined.call.id);
      requestCallParticipants(joined.call.id);
      notifySuccess('Joined voice channel session.');
      await loadCalls();
    } catch (error) {
      notifyError(
        'Join failed',
        error instanceof Error ? error.message : 'Unable to join voice channel',
      );
    } finally {
      setJoining(false);
    }
  };

  const onLeave = async () => {
    if (latestCallId) {
      leaveCall(latestCallId);
    }
    roomRef.current?.disconnect();
    roomRef.current = null;
    setConnected(false);
    setParticipants([]);
  };

  const toggleMute = async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !isMuted;
    try {
      await room.localParticipant.setMicrophoneEnabled(!next);
      setIsMuted(next);
      if (latestCallId) {
        setCallMediaState(latestCallId, { isMuted: next });
      }
    } catch {
      notifyError('Audio failed', 'Unable to update microphone state.');
    }
  };

  const toggleCamera = async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !isVideoOff;
    try {
      await room.localParticipant.setCameraEnabled(!next);
      setIsVideoOff(next);
      if (latestCallId) {
        setCallMediaState(latestCallId, { isVideoOff: next });
      }
    } catch {
      notifyError('Video failed', 'Unable to update camera state.');
    }
  };

  const toggleSpeaker = async () => {
    const next = !speakerOn;
    try {
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
  };

  const orderedParticipants = useMemo(
    () => [...participants].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt)),
    [participants],
  );

  return (
    <AppScreen refreshing={loading} onRefresh={() => void loadCalls()}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{channelName}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Persistent voice room with LiveKit media controls.
      </Text>
      <Text style={[styles.note, { color: theme.colors.textSubtle }]}>
        Socket: {isSocketConnected ? 'Live' : 'Offline'} • Media: {connected ? 'Connected' : 'Idle'}
      </Text>
      {connected && !isSocketConnected ? (
        <View
          style={[
            styles.reconnectBanner,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.cardMuted },
          ]}
        >
          <Text style={{ color: theme.colors.textMuted }}>
            Reconnecting realtime channel. Media stays active.
          </Text>
        </View>
      ) : null}

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Current Session</Text>
        <Text style={{ color: theme.colors.textMuted }}>Latest Call ID: {latestCallId ?? '-'}</Text>
        <Text style={{ color: theme.colors.textMuted }}>Room Name: {latestRoomName ?? '-'}</Text>
        <Text style={{ color: theme.colors.textMuted }}>Audio Route: {audioRouteLabel}</Text>
        <View style={styles.controlsRow}>
          <AppButton
            title={joining ? 'Joining...' : 'Join'}
            onPress={() => void onJoin()}
            disabled={joining}
          />
          <AppButton title="Leave" onPress={() => void onLeave()} variant="secondary" />
        </View>
        <View style={styles.controlsRow}>
          <AppButton
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            onPress={() => void toggleMute()}
            variant="secondary"
          />
          <AppButton
            title={isVideoOff ? 'Camera On' : 'Camera Off'}
            onPress={() => void toggleCamera()}
            variant="secondary"
          />
        </View>
        <View style={styles.controlsRow}>
          <AppButton
            title={speakerOn ? 'Speaker On' : 'Speaker Off'}
            onPress={() => void toggleSpeaker()}
            variant="secondary"
          />
        </View>
      </AppCard>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Participants ({orderedParticipants.length})
        </Text>
        {orderedParticipants.length ? (
          <View style={styles.list}>
            {orderedParticipants.map((participant) => (
              <View
                key={`${participant.userId}-${participant.joinedAt}`}
                style={[
                  styles.callRow,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.cardMuted },
                ]}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
                  {participant.displayName || participant.userId}
                </Text>
                <Text style={{ color: theme.colors.textMuted }}>
                  Mic: {participant.isMuted ? 'Muted' : 'On'} • Camera:{' '}
                  {participant.isVideoOff ? 'Off' : 'On'}
                </Text>
                <Text style={{ color: theme.colors.textSubtle }}>
                  Joined: {formatTime(participant.joinedAt)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ color: theme.colors.textSubtle }}>No participants connected.</Text>
        )}
      </AppCard>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Recent Call Activity
        </Text>
        {calls.length ? (
          <View style={styles.list}>
            {calls.slice(0, 10).map((call) => (
              <View
                key={call.id}
                style={[
                  styles.callRow,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.cardMuted },
                ]}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{call.status}</Text>
                <Text style={{ color: theme.colors.textMuted }}>ID: {call.id}</Text>
                <Text style={{ color: theme.colors.textSubtle }}>
                  Updated: {formatTime(call.updatedAt)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ color: theme.colors.textSubtle }}>No voice calls yet.</Text>
        )}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  subtitle: { marginTop: -2, lineHeight: 20, marginBottom: mobileSpacing.xs },
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  list: { gap: mobileSpacing.sm },
  callRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: mobileSpacing.sm + 2,
    gap: 2,
  },
  controlsRow: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  reconnectBanner: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  note: { fontSize: 12, marginBottom: mobileSpacing.xs },
});
