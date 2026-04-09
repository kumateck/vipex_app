import { useEffect, useMemo, useRef, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Room, RoomEvent, Track, type LocalVideoTrack, type RemoteTrack } from 'livekit-client';
import {
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  Minimize2,
  Phone,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  Video,
  VideoOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import { useAuthStore } from '@/stores/auth-store';
import {
  type CommunicationMessage,
  useCreateCommunicationMessageMutation,
  useCreateCommunicationCallLivekitTokenMutation,
  useListCommunicationMessagesQuery,
  useListCommunicationCallsQuery,
  useListCommunicationThreadsQuery,
  useMarkCommunicationChannelReadMutation,
  useUpdateCommunicationCallStatusMutation,
} from '../../api/communication.api';
import { useCommunicationSocket } from '../../hooks/use-communication-socket';

type CallParticipant = {
  userId: string;
  displayName?: string;
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

function getParticipantLabel(params: {
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

function toRemoteKind(kind: Track.Kind): 'audio' | 'video' {
  return kind === Track.Kind.Audio ? 'audio' : 'video';
}

export function CommunicationCallRoomPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const callId = params.id?.trim() ?? '';
  const currentUserId = useAuthStore((state) => state.user?.id ?? '');

  const roomRef = useRef<Room | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

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
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isStageFullscreen, setIsStageFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const [focusedTrackKey, setFocusedTrackKey] = useState<string | null>(null);
  const [callChatInput, setCallChatInput] = useState('');
  const [callChatPanelOpen, setCallChatPanelOpen] = useState(true);
  const [unseenCallChatCount, setUnseenCallChatCount] = useState(0);
  const callChatViewportRef = useRef<HTMLDivElement | null>(null);

  const { data: calls = [], refetch } = useListCommunicationCallsQuery();
  const { data: threads = [] } = useListCommunicationThreadsQuery();
  const { data: userOptions = [] } = useListUserOptionsQuery();
  const [updateCallStatus, { isLoading: isUpdatingStatus }] =
    useUpdateCommunicationCallStatusMutation();
  const [createLivekitToken] = useCreateCommunicationCallLivekitTokenMutation();
  const [markChannelRead] = useMarkCommunicationChannelReadMutation();
  const [createMessage, { isLoading: isSendingCallChatMessage }] =
    useCreateCommunicationMessageMutation();

  const call = useMemo(() => calls.find((row) => row.id === callId) ?? null, [callId, calls]);
  const callChatThreadId = call?.chatThreadId ?? call?.threadId ?? null;
  const { data: callChatMessages = [], refetch: refetchCallChatMessages } =
    useListCommunicationMessagesQuery(
      callChatThreadId ? { threadId: callChatThreadId, limit: 120 } : skipToken,
    );
  const threadLabelById = useMemo(
    () =>
      new Map(
        threads.map((thread) => [
          thread.id,
          thread.title || `${prettyValue(thread.threadType)} thread`,
        ]),
      ),
    [threads],
  );
  const userLabelById = useMemo(
    () =>
      new Map(
        userOptions.map((option) => [option.id, option.fullname || option.email || 'Unknown user']),
      ),
    [userOptions],
  );
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
  const dominantSpeakerUserId = useMemo(() => {
    if (!activeSpeakerUserIds.length) return null;
    const remoteUserIds = new Set(remoteVideoTracks.map((item) => item.userId));
    return (
      activeSpeakerUserIds.find((id) => remoteUserIds.has(id)) ?? activeSpeakerUserIds[0] ?? null
    );
  }, [activeSpeakerUserIds, remoteVideoTracks]);
  const orderedRemoteVideoTracks = useMemo(() => {
    if (!dominantSpeakerUserId) return remoteVideoTracks;
    return [...remoteVideoTracks].sort((a, b) => {
      const aDominant = a.userId === dominantSpeakerUserId ? 1 : 0;
      const bDominant = b.userId === dominantSpeakerUserId ? 1 : 0;
      return bDominant - aDominant;
    });
  }, [dominantSpeakerUserId, remoteVideoTracks]);
  const focusedRemoteTrack = useMemo(() => {
    if (!focusedTrackKey?.startsWith('remote:')) return null;
    const id = focusedTrackKey.replace('remote:', '');
    return orderedRemoteVideoTracks.find((item) => item.id === id) ?? null;
  }, [focusedTrackKey, orderedRemoteVideoTracks]);

  const hasFocusedLocal = focusedTrackKey === 'local';
  const isExpandedStage = isStageFullscreen || isPseudoFullscreen;

  const focusedLabel = useMemo(() => {
    if (hasFocusedLocal) return 'You';
    if (!focusedRemoteTrack) return null;
    return userLabelById.get(focusedRemoteTrack.userId) ?? 'Unknown participant';
  }, [focusedRemoteTrack, hasFocusedLocal, userLabelById]);
  const remoteScreenShareTracks = useMemo(
    () =>
      remoteTracks.filter(
        (row) => row.kind === 'video' && row.track.source === Track.Source.ScreenShare,
      ),
    [remoteTracks],
  );
  const remoteCameraTracks = useMemo(
    () =>
      remoteTracks.filter(
        (row) => row.kind === 'video' && row.track.source !== Track.Source.ScreenShare,
      ),
    [remoteTracks],
  );
  const primaryScreenShareTrack = remoteScreenShareTracks[0] ?? null;
  const isScreenShareLayout = Boolean(primaryScreenShareTrack) || isScreenSharing;
  const participantNameById = useMemo(
    () =>
      new Map(
        participants.map((participant) => [participant.userId, participant.displayName ?? '']),
      ),
    [participants],
  );

  const { isConnected, joinCall, leaveCall, setCallMediaState, requestCallParticipants } =
    useCommunicationSocket({
      onMessageCreated: (payload) => {
        if (payload.threadId !== callChatThreadId) return;
        refetchCallChatMessages();
        if (!callChatPanelOpen) {
          setUnseenCallChatCount((prev) => prev + 1);
        }
      },
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
    if (!callChatPanelOpen) return;
    const viewport = callChatViewportRef.current;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
    setUnseenCallChatCount(0);
  }, [callChatMessages.length, callChatPanelOpen]);

  const onSendCallChatMessage = async () => {
    if (!callChatThreadId) return;
    const trimmed = callChatInput.trim();
    if (!trimmed) return;
    try {
      await createMessage({
        threadId: callChatThreadId,
        body: trimmed,
        messageType: 'text',
      }).unwrap();
      setCallChatInput('');
      refetchCallChatMessages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send in-call chat message.');
    }
  };

  useEffect(() => {
    if (!callId || !isConnected) return;
    requestCallParticipants(callId);
  }, [callId, isConnected, requestCallParticipants]);

  useEffect(() => {
    if (!call?.channelId) return;
    void markChannelRead({ id: call.channelId });
  }, [call?.channelId, markChannelRead]);

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
      setIsScreenSharing(false);
      setFocusedTrackKey(null);
    },
    [callId, leaveCall],
  );

  useEffect(() => {
    const onFullscreenChange = () => {
      const webkitDoc = document as Document & { webkitFullscreenElement?: Element | null };
      setIsStageFullscreen(
        Boolean(document.fullscreenElement || webkitDoc.webkitFullscreenElement),
      );
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isPseudoFullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsPseudoFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPseudoFullscreen]);

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

  const onLeave = async () => {
    if (!callId) return;
    leaveCall(callId);
    roomRef.current?.disconnect();
    roomRef.current = null;
    setIsMediaConnected(false);
    setLocalVideoTrack(null);
    setRemoteTracks([]);
    setIsScreenSharing(false);
    setFocusedTrackKey(null);
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
    if (!callId || !call) return;
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

  const onToggleStageFullscreen = async () => {
    if (!stageRef.current) return;
    try {
      const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
      const node = stageRef.current as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };

      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (
        doc.webkitExitFullscreen &&
        (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
      ) {
        await doc.webkitExitFullscreen();
      } else {
        if (node.requestFullscreen) {
          await node.requestFullscreen();
        } else if (node.webkitRequestFullscreen) {
          await node.webkitRequestFullscreen();
        } else {
          setIsPseudoFullscreen((prev) => !prev);
          return;
        }
      }
    } catch {
      setIsPseudoFullscreen((prev) => !prev);
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
    <div className="flex h-[calc(100vh-5rem)] w-full min-h-0 flex-col gap-4 p-4">
      {!call ? (
        <Card>
          <CardHeader>
            <CardTitle>Call Room</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Call session not found.{' '}
              <Link to="/communication/calls" className="underline">
                Return to list
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">
                {call.threadId
                  ? (threadLabelById.get(call.threadId) ?? 'Call')
                  : 'Voice Channel Call'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {prettyValue(call.callType)} • {call.livekitRoomName || 'Auto-generated room'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? 'default' : 'outline'}>
                {isConnected ? 'Socket live' : 'Socket offline'}
              </Badge>
              <Badge variant={isMediaConnected ? 'default' : 'outline'}>
                {isMediaConnected
                  ? 'Media connected'
                  : isMediaConnecting
                    ? 'Connecting...'
                    : 'Disconnected'}
              </Badge>
              <Button variant="outline" onClick={() => navigate('/communication/calls')}>
                Back
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
          </div>

          {mediaError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Media connection failed: {mediaError}
            </p>
          ) : null}

          <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-h-0 flex-col gap-3">
              <div
                ref={stageRef}
                className={`relative flex-1 overflow-hidden rounded-xl border bg-muted/20 p-3 ${isPseudoFullscreen ? 'fixed inset-0 z-50 rounded-none border-0 bg-background p-4 shadow-2xl' : ''}`}
              >
                <div className="mb-2 flex items-center justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void onToggleStageFullscreen()}
                  >
                    {isStageFullscreen || isPseudoFullscreen ? (
                      <>
                        <Minimize2 className="mr-2 h-4 w-4" /> Exit Fullscreen
                      </>
                    ) : (
                      <>
                        <Maximize2 className="mr-2 h-4 w-4" /> Fullscreen
                      </>
                    )}
                  </Button>
                </div>

                <div className={`${isExpandedStage ? 'h-[calc(100%-2.5rem)] min-h-0' : ''}`}>
                  {focusedTrackKey ? (
                    <div className="mb-3 rounded-xl border border-primary/60 p-2">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-medium">Focus: {focusedLabel}</p>
                        <Button size="sm" variant="ghost" onClick={() => setFocusedTrackKey(null)}>
                          Clear Focus
                        </Button>
                      </div>
                      {hasFocusedLocal && localVideoTrack ? (
                        <TrackRenderer
                          track={localVideoTrack}
                          muted
                          className={`${isExpandedStage ? 'h-[calc(100vh-10rem)] min-h-[260px]' : 'h-[360px]'} w-full rounded-lg bg-black object-cover`}
                        />
                      ) : focusedRemoteTrack ? (
                        <TrackRenderer
                          track={focusedRemoteTrack.track}
                          className={`${isExpandedStage ? 'h-[calc(100vh-10rem)] min-h-[260px]' : 'h-[360px]'} w-full rounded-lg bg-black object-cover`}
                        />
                      ) : (
                        <div
                          className={`grid ${isExpandedStage ? 'h-[calc(100vh-10rem)] min-h-[260px]' : 'h-[360px]'} place-content-center rounded-lg bg-muted text-xs text-muted-foreground`}
                        >
                          Focused track unavailable
                        </div>
                      )}
                    </div>
                  ) : null}

                  {isScreenShareLayout ? (
                    <div
                      className={`grid min-h-0 gap-3 ${isExpandedStage ? 'h-full' : ''} xl:grid-cols-[minmax(0,1fr)_260px]`}
                    >
                      <div className="flex min-h-0 flex-col rounded-xl border p-2">
                        <p className="mb-2 truncate text-xs font-medium">
                          {primaryScreenShareTrack
                            ? `${getParticipantLabel({
                                userId: primaryScreenShareTrack.userId,
                                displayName: participantNameById.get(
                                  primaryScreenShareTrack.userId,
                                ),
                                userLabelById,
                                currentUserId,
                              })} is sharing`
                            : 'You are sharing'}
                        </p>
                        {primaryScreenShareTrack || localVideoTrack ? (
                          <TrackRenderer
                            track={primaryScreenShareTrack?.track ?? localVideoTrack!}
                            className={`${isExpandedStage ? 'h-full min-h-0' : 'h-[min(62vh,760px)]'} w-full rounded-lg bg-black object-contain`}
                          />
                        ) : (
                          <div
                            className={`grid ${isExpandedStage ? 'h-full min-h-0' : 'h-[min(62vh,760px)]'} place-content-center rounded-lg bg-muted text-sm text-muted-foreground`}
                          >
                            Screen share is starting...
                          </div>
                        )}
                      </div>
                      <div
                        className={`grid min-h-0 gap-2 overflow-y-auto pr-1 ${isExpandedStage ? 'h-full' : 'max-h-[min(62vh,760px)]'}`}
                      >
                        {remoteCameraTracks.map((item) => {
                          const label = getParticipantLabel({
                            userId: item.userId,
                            displayName: participantNameById.get(item.userId),
                            userLabelById,
                            currentUserId,
                          });
                          return (
                            <div key={`cube-${item.id}`} className="rounded-lg border p-2">
                              <p className="mb-1 truncate text-[11px] font-medium">{label}</p>
                              <TrackRenderer
                                track={item.track}
                                className="h-28 w-full rounded-md bg-black object-cover"
                              />
                            </div>
                          );
                        })}
                        {localVideoTrack ? (
                          <div className="rounded-lg border p-2">
                            <p className="mb-1 truncate text-[11px] font-medium">You</p>
                            <TrackRenderer
                              track={localVideoTrack}
                              muted
                              className="h-28 w-full rounded-md bg-black object-cover"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`grid gap-3 ${isExpandedStage ? 'h-full min-h-0 auto-rows-min overflow-y-auto pr-1' : ''} md:grid-cols-2 2xl:grid-cols-3`}
                    >
                      {orderedRemoteVideoTracks.map((item) => {
                        const label = getParticipantLabel({
                          userId: item.userId,
                          displayName: participantNameById.get(item.userId),
                          userLabelById,
                          currentUserId,
                        });
                        const isSpeaking = activeSpeakerUserIds.includes(item.userId);
                        const isDominant = item.userId === dominantSpeakerUserId;
                        return (
                          <div
                            key={item.id}
                            className={`rounded-xl border p-2 ${isSpeaking ? 'border-primary/70 ring-2 ring-primary/20' : 'border-border/70'} ${isDominant && orderedRemoteVideoTracks.length > 1 ? 'md:col-span-2' : ''}`}
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="truncate text-xs font-medium">{label}</p>
                              <div className="flex items-center gap-2">
                                {isSpeaking ? (
                                  <Badge variant="default" className="gap-1">
                                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                                    Speaking
                                  </Badge>
                                ) : null}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setFocusedTrackKey(`remote:${item.id}`)}
                                >
                                  Focus
                                </Button>
                              </div>
                            </div>
                            <TrackRenderer
                              track={item.track}
                              className={`${isDominant ? 'h-[320px]' : 'h-[240px]'} w-full rounded-lg bg-black object-cover`}
                            />
                          </div>
                        );
                      })}

                      {!orderedRemoteVideoTracks.length ? (
                        <div className="grid h-[min(58vh,680px)] place-content-center rounded-xl border border-dashed text-sm text-muted-foreground md:col-span-2 2xl:col-span-3">
                          Waiting for participants to turn on video
                        </div>
                      ) : null}
                    </div>
                  )}

                  {!isScreenShareLayout ? (
                    <div className="pointer-events-none absolute bottom-5 right-5 w-44 rounded-xl border bg-background/90 p-2 shadow-lg backdrop-blur">
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="font-medium">You</span>
                        <span className="text-muted-foreground">
                          {isVideoOff ? 'Camera off' : 'Preview'}
                        </span>
                      </div>
                      {localVideoTrack ? (
                        <button
                          type="button"
                          className="pointer-events-auto block w-full"
                          onClick={() => setFocusedTrackKey('local')}
                        >
                          <TrackRenderer
                            track={localVideoTrack}
                            muted
                            className="h-24 w-full rounded-md bg-black object-cover"
                          />
                        </button>
                      ) : (
                        <div className="grid h-24 place-content-center rounded-md bg-muted text-[11px] text-muted-foreground">
                          Camera off
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {remoteAudioTracks.map((item) => (
                  <TrackRenderer key={item.id} track={item.track} className="hidden" />
                ))}
              </div>

              <div className="sticky bottom-0 z-30 flex flex-wrap items-center justify-center gap-3 rounded-xl border bg-card/95 p-3 backdrop-blur">
                {!isMediaConnected ? (
                  <Button
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={onJoin}
                    disabled={!isConnected || isMediaConnecting}
                    title="Join"
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                ) : null}
                <Button
                  size="icon"
                  variant={isMuted ? 'secondary' : 'outline'}
                  className="h-12 w-12 rounded-full"
                  onClick={onToggleMuted}
                  disabled={!isMediaConnected}
                  title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Button
                  size="icon"
                  variant={isVideoOff ? 'secondary' : 'outline'}
                  className="h-12 w-12 rounded-full"
                  onClick={onToggleVideo}
                  disabled={!isMediaConnected}
                  title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
                >
                  {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </Button>
                <Button
                  size="icon"
                  variant={isScreenSharing ? 'secondary' : 'outline'}
                  className="h-12 w-12 rounded-full"
                  onClick={() => void onToggleScreenShare()}
                  disabled={!isMediaConnected}
                  title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
                >
                  {isScreenSharing ? (
                    <ScreenShareOff className="h-5 w-5" />
                  ) : (
                    <ScreenShare className="h-5 w-5" />
                  )}
                </Button>
                {isMediaConnected ? (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-12 w-12 rounded-full"
                    onClick={onLeave}
                    disabled={!isConnected && !isMediaConnected}
                    title="Leave call"
                  >
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="min-h-0 overflow-y-auto pr-1">
              <div className="space-y-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> In-call Chat
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCallChatPanelOpen((prev) => !prev)}
                      >
                        {callChatPanelOpen ? 'Hide' : 'Show'}
                        {unseenCallChatCount > 0 ? ` (${unseenCallChatCount})` : ''}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  {callChatPanelOpen ? (
                    <CardContent className="space-y-2">
                      <div
                        ref={callChatViewportRef}
                        className="max-h-52 space-y-2 overflow-y-auto rounded-md border bg-muted/10 p-2"
                      >
                        {callChatMessages.length ? (
                          callChatMessages.map((message: CommunicationMessage) => {
                            const isOwn = message.senderUserId === currentUserId;
                            const label =
                              userLabelById.get(message.senderUserId ?? '') ??
                              message.senderName ??
                              'User';
                            return (
                              <div
                                key={`call-chat-${message.id}`}
                                className={`rounded-md px-2 py-1 text-xs ${
                                  isOwn ? 'bg-primary/10' : 'bg-background'
                                }`}
                              >
                                <p className="font-medium">{isOwn ? 'You' : label}</p>
                                <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground">
                                  {message.body ?? '(attachment)'}
                                </p>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No call chat messages yet.
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={callChatInput}
                          onChange={(event) => setCallChatInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              void onSendCallChatMessage();
                            }
                          }}
                          className="h-8 flex-1 rounded-md border bg-background px-2 text-xs"
                          placeholder="Type in-call chat..."
                        />
                        <Button
                          size="sm"
                          onClick={() => void onSendCallChatMessage()}
                          disabled={isSendingCallChatMessage || !callChatInput.trim()}
                        >
                          Send
                        </Button>
                      </div>
                    </CardContent>
                  ) : null}
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Call Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Status</span>
                      <Select
                        value={call.status}
                        onValueChange={(value) =>
                          onChangeStatus(
                            value as 'pending' | 'ringing' | 'active' | 'ended' | 'cancelled',
                          )
                        }
                        disabled={isUpdatingStatus}
                      >
                        <SelectTrigger className="w-[160px]">
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
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Started</span>
                      <span>{formatDateTime(call.startedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Ended</span>
                      <span>{formatDateTime(call.endedAt)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Devices</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Microphone</p>
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
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Camera</p>
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
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Speaker</p>
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Participants ({participants.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                      {participants.length ? (
                        participants.map((participant) => {
                          const label =
                            userLabelById.get(participant.userId) ?? 'Unknown participant';
                          return (
                            <div
                              key={participant.userId}
                              className={`rounded-md border p-2 ${activeSpeakerUserIds.includes(participant.userId) ? 'border-primary/60 bg-primary/5' : ''}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-medium">{label}</p>
                                <div className="flex gap-1">
                                  {activeSpeakerUserIds.includes(participant.userId) ? (
                                    <Badge variant="default" className="gap-1">
                                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                                      Speaking
                                    </Badge>
                                  ) : null}
                                  <Badge variant={participant.isMuted ? 'outline' : 'default'}>
                                    {participant.isMuted ? 'Muted' : 'Mic'}
                                  </Badge>
                                  <Badge variant={participant.isVideoOff ? 'outline' : 'default'}>
                                    {participant.isVideoOff ? 'No Cam' : 'Cam'}
                                  </Badge>
                                </div>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Joined {formatDateTime(participant.joinedAt)}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No participants in room yet.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
