import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Room, RoomEvent, Track, type LocalVideoTrack, type RemoteTrack } from 'livekit-client';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import { useAuthStore } from '@/stores/auth-store';
import {
  useCreateCommunicationCallLivekitTokenMutation,
  useListCommunicationCallsQuery,
  useUpdateCommunicationCallStatusMutation,
} from '../api/communication.api';
import { useCommunicationSocket } from '../hooks/use-communication-socket';

type CallParticipant = {
  userId: string;
  joinedAt: string;
  isMuted: boolean;
  isVideoOff: boolean;
};

type RemoteMediaTrack = {
  id: string;
  userId: string;
  kind: 'audio' | 'video';
  track: RemoteTrack;
};

const AUDIO_INPUT_STORAGE_KEY = 'communication.audioInputDeviceId';
const VIDEO_INPUT_STORAGE_KEY = 'communication.videoInputDeviceId';
const AUDIO_OUTPUT_STORAGE_KEY = 'communication.audioOutputDeviceId';

function readStoredDeviceId(storageKey: string): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(storageKey) ?? '';
}

function writeStoredDeviceId(storageKey: string, value: string) {
  if (typeof window === 'undefined') return;
  if (!value) {
    window.localStorage.removeItem(storageKey);
    return;
  }
  window.localStorage.setItem(storageKey, value);
}

function prettyValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString();
}

function TrackRenderer({
  track,
  className,
  muted = false,
}: {
  track: LocalVideoTrack | RemoteTrack;
  className?: string;
  muted?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const attached = track.attach();
    attached.autoplay = true;
    attached.setAttribute('playsinline', 'true');
    if ('muted' in attached) attached.muted = muted;
    attached.className = className ?? '';
    container.replaceChildren(attached);
    return () => {
      track.detach(attached);
      attached.remove();
    };
  }, [className, muted, track]);

  return <div ref={containerRef} />;
}

function toRemoteKind(kind: Track.Kind): 'audio' | 'video' {
  return kind === Track.Kind.Audio ? 'audio' : 'video';
}

export function CommunicationCallRoomPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const callId = params.id?.trim() ?? '';
  const currentUserId = useAuthStore((state) => state.user?.id ?? '');

  const roomRef = useRef<Room | null>(null);

  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isMediaConnecting, setIsMediaConnecting] = useState(false);
  const [isMediaConnected, setIsMediaConnected] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(null);
  const [remoteTracks, setRemoteTracks] = useState<RemoteMediaTrack[]>([]);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioInputDeviceId, setSelectedAudioInputDeviceId] = useState(() =>
    readStoredDeviceId(AUDIO_INPUT_STORAGE_KEY),
  );
  const [selectedVideoInputDeviceId, setSelectedVideoInputDeviceId] = useState(() =>
    readStoredDeviceId(VIDEO_INPUT_STORAGE_KEY),
  );
  const [selectedAudioOutputDeviceId, setSelectedAudioOutputDeviceId] = useState(() =>
    readStoredDeviceId(AUDIO_OUTPUT_STORAGE_KEY),
  );
  const [activeSpeakerUserIds, setActiveSpeakerUserIds] = useState<string[]>([]);

  const { data: calls = [], refetch } = useListCommunicationCallsQuery();
  const { data: userOptions = [] } = useListUserOptionsQuery();
  const [updateCallStatus, { isLoading: isUpdatingStatus }] =
    useUpdateCommunicationCallStatusMutation();
  const [createLivekitToken] = useCreateCommunicationCallLivekitTokenMutation();

  const call = useMemo(() => calls.find((row) => row.id === callId) ?? null, [callId, calls]);
  const currentParticipant = useMemo(
    () => participants.find((item) => item.userId === currentUserId) ?? null,
    [currentUserId, participants],
  );
  const remoteVideoTracks = useMemo(
    () => remoteTracks.filter((row) => row.kind === 'video'),
    [remoteTracks],
  );
  const remoteAudioTracks = useMemo(
    () => remoteTracks.filter((row) => row.kind === 'audio'),
    [remoteTracks],
  );

  const { isConnected, joinCall, leaveCall, setCallMediaState, requestCallParticipants } =
    useCommunicationSocket({
      onCallParticipantsUpdated: ({
        callId: incomingCallId,
        participants: incomingParticipants,
      }) => {
        if (incomingCallId !== callId) return;
        setParticipants(incomingParticipants);
      },
      onCallUpdated: (payload) => {
        if (payload.id !== callId) return;
        refetch();
      },
    });

  useEffect(() => {
    if (!callId || !isConnected) return;
    requestCallParticipants(callId);
  }, [callId, isConnected, requestCallParticipants]);

  useEffect(() => {
    if (!currentParticipant) return;
    setIsMuted(currentParticipant.isMuted);
    setIsVideoOff(currentParticipant.isVideoOff);
  }, [currentParticipant]);

  useEffect(
    () => () => {
      leaveCall(callId);
      roomRef.current?.disconnect();
      roomRef.current = null;
      setIsMediaConnected(false);
      setLocalVideoTrack(null);
      setRemoteTracks([]);
    },
    [callId, leaveCall],
  );

  const refreshDevices = async () => {
    try {
      const [audioInputs, videoInputs, audioOutputs] = await Promise.all([
        Room.getLocalDevices('audioinput'),
        Room.getLocalDevices('videoinput'),
        Room.getLocalDevices('audiooutput'),
      ]);
      setAudioInputDevices(audioInputs);
      setVideoInputDevices(videoInputs);
      setAudioOutputDevices(audioOutputs);

      if (!selectedAudioInputDeviceId && audioInputs[0]?.deviceId) {
        setSelectedAudioInputDeviceId(audioInputs[0].deviceId);
      }
      if (!selectedVideoInputDeviceId && videoInputs[0]?.deviceId) {
        setSelectedVideoInputDeviceId(videoInputs[0].deviceId);
      }
      if (!selectedAudioOutputDeviceId && audioOutputs[0]?.deviceId) {
        setSelectedAudioOutputDeviceId(audioOutputs[0].deviceId);
      }
    } catch {
      // Non-blocking: media may still connect with browser defaults.
    }
  };

  useEffect(() => {
    void refreshDevices();
  }, []);

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
      const tokenPayload = await createLivekitToken({ id: call.id }).unwrap();
      const room = new Room();
      roomRef.current = room;

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
      });

      room.on(RoomEvent.LocalTrackUnpublished, () => {
        syncLocalVideoTrack(room);
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        setActiveSpeakerUserIds(speakers.map((participant) => participant.identity));
      });

      await room.connect(tokenPayload.livekitUrl, tokenPayload.token);
      if (selectedAudioInputDeviceId) {
        await room.switchActiveDevice('audioinput', selectedAudioInputDeviceId);
      }
      if (selectedVideoInputDeviceId) {
        await room.switchActiveDevice('videoinput', selectedVideoInputDeviceId);
      }
      if (selectedAudioOutputDeviceId) {
        await room.switchActiveDevice('audiooutput', selectedAudioOutputDeviceId);
      }
      await room.localParticipant.setMicrophoneEnabled(!isMuted);
      await room.localParticipant.setCameraEnabled(call.callType === 'video' ? !isVideoOff : false);
      syncLocalVideoTrack(room);
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

  const onLeave = async () => {
    if (!callId) return;
    leaveCall(callId);
    roomRef.current?.disconnect();
    roomRef.current = null;
    setIsMediaConnected(false);
    setLocalVideoTrack(null);
    setRemoteTracks([]);
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
    if (!callId || !call || call.callType !== 'video') return;
    const next = !isVideoOff;
    setIsVideoOff(next);
    setCallMediaState(callId, { isVideoOff: next });
    if (roomRef.current) {
      await roomRef.current.localParticipant.setCameraEnabled(!next);
      syncLocalVideoTrack(roomRef.current);
    }
  };

  const onSelectAudioInput = async (value: string) => {
    const next = value === '__default__' ? '' : value;
    setSelectedAudioInputDeviceId(next);
    writeStoredDeviceId(AUDIO_INPUT_STORAGE_KEY, next);
    if (!roomRef.current || !next) return;
    try {
      await roomRef.current.switchActiveDevice('audioinput', next);
    } catch {
      toast.error('Unable to switch microphone device.');
    }
  };

  const onSelectVideoInput = async (value: string) => {
    const next = value === '__default__' ? '' : value;
    setSelectedVideoInputDeviceId(next);
    writeStoredDeviceId(VIDEO_INPUT_STORAGE_KEY, next);
    if (!roomRef.current || !next) return;
    try {
      await roomRef.current.switchActiveDevice('videoinput', next);
    } catch {
      toast.error('Unable to switch camera device.');
    }
  };

  const onSelectAudioOutput = async (value: string) => {
    const next = value === '__default__' ? '' : value;
    setSelectedAudioOutputDeviceId(next);
    writeStoredDeviceId(AUDIO_OUTPUT_STORAGE_KEY, next);
    if (!roomRef.current || !next) return;
    try {
      await roomRef.current.switchActiveDevice('audiooutput', next);
    } catch {
      toast.error('This browser does not support selecting output devices.');
    }
  };

  const onChangeStatus = async (
    status: 'pending' | 'ringing' | 'active' | 'ended' | 'cancelled',
  ) => {
    if (!call) return;
    try {
      await updateCallStatus({ id: call.id, status }).unwrap();
      toast.success(`Call marked as ${prettyValue(status)}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update call status.');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">Call Room</h1>
            <p className="text-sm text-muted-foreground">
              Join real-time media, manage microphone/camera, and track participants.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/communication/calls')}>
              Back to Calls
            </Button>
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!call ? (
              <p className="text-sm text-muted-foreground">
                Call session not found.{' '}
                <Link to="/communication/calls" className="underline">
                  Return to list
                </Link>
                .
              </p>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Call ID</p>
                    <p className="text-sm font-medium">{call.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-sm font-medium">{prettyValue(call.callType)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="outline">{prettyValue(call.status)}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Room</p>
                    <p className="text-sm font-medium">
                      {call.livekitRoomName || `call-${call.id}`}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Started</p>
                    <p className="text-sm">{formatDateTime(call.startedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ended</p>
                    <p className="text-sm">{formatDateTime(call.endedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Socket</p>
                    <Badge variant={isConnected ? 'default' : 'outline'}>
                      {isConnected ? 'Live' : 'Offline'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Media</p>
                    <Badge variant={isMediaConnected ? 'default' : 'outline'}>
                      {isMediaConnected
                        ? 'Connected'
                        : isMediaConnecting
                          ? 'Connecting...'
                          : 'Disconnected'}
                    </Badge>
                  </div>
                </div>
                {mediaError ? (
                  <p className="text-sm text-destructive">Media connection failed: {mediaError}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={onJoin} disabled={!isConnected || isMediaConnecting}>
                    {isMediaConnected ? 'Rejoin room' : 'Join room'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onLeave}
                    disabled={!isConnected && !isMediaConnected}
                  >
                    Leave room
                  </Button>
                  <Button variant="outline" onClick={onToggleMuted} disabled={!isMediaConnected}>
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onToggleVideo}
                    disabled={!isMediaConnected || call.callType !== 'video'}
                  >
                    {isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  </Button>
                  <Select
                    value={call.status}
                    onValueChange={(value) =>
                      onChangeStatus(
                        value as 'pending' | 'ringing' | 'active' | 'ended' | 'cancelled',
                      )
                    }
                    disabled={isUpdatingStatus}
                  >
                    <SelectTrigger className="w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="ringing">Ringing</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="ended">Ended</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Microphone</p>
                <Select
                  value={selectedAudioInputDeviceId || '__default__'}
                  onValueChange={(value) => void onSelectAudioInput(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Default microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">Default microphone</SelectItem>
                    {audioInputDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.slice(0, 6)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Camera</p>
                <Select
                  value={selectedVideoInputDeviceId || '__default__'}
                  onValueChange={(value) => void onSelectVideoInput(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Default camera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">Default camera</SelectItem>
                    {videoInputDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 6)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Speaker</p>
                <Select
                  value={selectedAudioOutputDeviceId || '__default__'}
                  onValueChange={(value) => void onSelectAudioOutput(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Default speaker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">Default speaker</SelectItem>
                    {audioOutputDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Speaker ${device.deviceId.slice(0, 6)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-md border p-2">
                <p className="mb-2 text-xs text-muted-foreground">You</p>
                {localVideoTrack ? (
                  <TrackRenderer
                    track={localVideoTrack}
                    muted
                    className="h-[220px] w-full rounded bg-black object-cover"
                  />
                ) : (
                  <div className="grid h-[220px] place-content-center rounded bg-muted text-xs text-muted-foreground">
                    Camera not publishing
                  </div>
                )}
              </div>
              {remoteVideoTracks.map((item) => {
                const label =
                  userOptions.find((row) => row.id === item.userId)?.fullname ?? item.userId;
                return (
                  <div key={item.id} className="rounded-md border p-2">
                    <p className="mb-2 text-xs text-muted-foreground">{label}</p>
                    <TrackRenderer
                      track={item.track}
                      className="h-[220px] w-full rounded bg-black object-cover"
                    />
                  </div>
                );
              })}
            </div>
            {remoteAudioTracks.map((item) => (
              <TrackRenderer key={item.id} track={item.track} className="hidden" />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants ({participants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {participants.length ? (
                participants.map((participant) => {
                  const label =
                    userOptions.find((item) => item.id === participant.userId)?.fullname ??
                    participant.userId;
                  return (
                    <div
                      key={participant.userId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatDateTime(participant.joinedAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={participant.isMuted ? 'outline' : 'default'}>
                          {participant.isMuted ? 'Muted' : 'Mic On'}
                        </Badge>
                        <Badge variant={participant.isVideoOff ? 'outline' : 'default'}>
                          {participant.isVideoOff ? 'Video Off' : 'Video On'}
                        </Badge>
                        <Badge
                          variant={
                            activeSpeakerUserIds.includes(participant.userId)
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {activeSpeakerUserIds.includes(participant.userId)
                            ? 'Speaking'
                            : 'Not Speaking'}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No participants in room yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
