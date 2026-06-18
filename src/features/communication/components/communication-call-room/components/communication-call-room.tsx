import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Track } from 'livekit-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { useCommunicationCallRoomData } from '../hooks/use-communication-call-room-data';
import { useCommunicationCallRoomMedia } from '../hooks/use-communication-call-room-media';
import { CommunicationCallRoomControls } from './communication-call-room-controls';
import { CommunicationCallRoomHeader } from './communication-call-room-header';
import { CommunicationCallRoomSidebar } from './communication-call-room-sidebar';
import { CommunicationCallRoomStage } from './communication-call-room-stage';

export function CommunicationCallRoom() {
  const params = useParams<{ id: string }>();
  const callId = params.id?.trim() ?? '';
  const currentUserId = useAuthStore((state) => state.user?.id ?? '');
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [isStageFullscreen, setIsStageFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const [focusedTrackKey, setFocusedTrackKey] = useState<string | null>(null);

  const data = useCommunicationCallRoomData({ callId, currentUserId });
  const media = useCommunicationCallRoomMedia({
    callId,
    call: data.call,
    currentParticipant: data.currentParticipant,
    joinCall: data.joinCall,
    leaveCall: data.leaveCall,
    setCallMediaState: data.setCallMediaState,
    requestCallParticipants: data.requestCallParticipants,
  });

  const dominantSpeakerUserId = useMemo(() => {
    if (!media.activeSpeakerUserIds.length) return null;
    const remoteUserIds = new Set(media.remoteVideoTracks.map((item) => item.userId));
    return (
      media.activeSpeakerUserIds.find((id) => remoteUserIds.has(id)) ??
      media.activeSpeakerUserIds[0] ??
      null
    );
  }, [media.activeSpeakerUserIds, media.remoteVideoTracks]);

  const orderedRemoteVideoTracks = useMemo(() => {
    if (!dominantSpeakerUserId) return media.remoteVideoTracks;
    return [...media.remoteVideoTracks].sort((a, b) => {
      const aDominant = a.userId === dominantSpeakerUserId ? 1 : 0;
      const bDominant = b.userId === dominantSpeakerUserId ? 1 : 0;
      return bDominant - aDominant;
    });
  }, [dominantSpeakerUserId, media.remoteVideoTracks]);

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
    return data.userLabelById.get(focusedRemoteTrack.userId) ?? 'Unknown participant';
  }, [data.userLabelById, focusedRemoteTrack, hasFocusedLocal]);

  const remoteScreenShareTracks = useMemo(
    () =>
      media.remoteTracks.filter(
        (row) => row.kind === 'video' && row.track.source === Track.Source.ScreenShare,
      ),
    [media.remoteTracks],
  );
  const primaryScreenShareTrack = remoteScreenShareTracks[0] ?? null;
  const isScreenShareLayout = Boolean(primaryScreenShareTrack) || media.isScreenSharing;

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
      } else if (node.requestFullscreen) {
        await node.requestFullscreen();
      } else if (node.webkitRequestFullscreen) {
        await node.webkitRequestFullscreen();
      } else {
        setIsPseudoFullscreen((prev) => !prev);
      }
    } catch {
      setIsPseudoFullscreen((prev) => !prev);
    }
  };

  if (!data.call) {
    return (
      <div className="flex h-[calc(100vh-5rem)] w-full min-h-0 flex-col gap-4 p-4">
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
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] w-full min-h-0 flex-col gap-4 p-4">
      <CommunicationCallRoomHeader
        call={data.call}
        threadLabelById={data.threadLabelById}
        isConnected={data.isConnected}
        isMediaConnected={media.isMediaConnected}
        isMediaConnecting={media.isMediaConnecting}
        onRefresh={() => data.refetchCalls()}
      />

      {media.mediaError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Media connection failed: {media.mediaError}
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-h-0 flex-col gap-3">
          <CommunicationCallRoomStage
            stageRef={stageRef}
            isPseudoFullscreen={isPseudoFullscreen}
            isExpandedStage={isExpandedStage}
            isStageFullscreen={isStageFullscreen}
            onToggleStageFullscreen={() => {
              void onToggleStageFullscreen();
            }}
            focusedTrackKey={focusedTrackKey}
            setFocusedTrackKey={setFocusedTrackKey}
            focusedLabel={focusedLabel}
            hasFocusedLocal={hasFocusedLocal}
            focusedRemoteTrack={focusedRemoteTrack}
            localVideoTrack={media.localVideoTrack}
            isScreenShareLayout={isScreenShareLayout}
            primaryScreenShareTrack={primaryScreenShareTrack}
            isVideoOff={media.isVideoOff}
            orderedRemoteVideoTracks={orderedRemoteVideoTracks}
            remoteAudioTracks={media.remoteAudioTracks}
            participants={data.participants}
            activeSpeakerUserIds={media.activeSpeakerUserIds}
            dominantSpeakerUserId={dominantSpeakerUserId}
            participantNameById={data.participantNameById}
            userLabelById={data.userLabelById}
            currentUserId={currentUserId}
          />

          <CommunicationCallRoomControls
            isConnected={data.isConnected}
            isMediaConnected={media.isMediaConnected}
            isMediaConnecting={media.isMediaConnecting}
            isMuted={media.isMuted}
            isVideoOff={media.isVideoOff}
            isScreenSharing={media.isScreenSharing}
            onJoin={() => void media.onJoin()}
            onLeave={media.onLeave}
            onToggleMuted={() => void media.onToggleMuted()}
            onToggleVideo={() => void media.onToggleVideo()}
            onToggleScreenShare={() => void media.onToggleScreenShare()}
          />
        </div>

        <CommunicationCallRoomSidebar
          call={data.call}
          currentUserId={currentUserId}
          userLabelById={data.userLabelById}
          callChatMessages={data.callChatMessages}
          callChatInput={data.callChatInput}
          setCallChatInput={data.setCallChatInput}
          callChatPanelOpen={data.callChatPanelOpen}
          setCallChatPanelOpen={data.setCallChatPanelOpen}
          unseenCallChatCount={data.unseenCallChatCount}
          callChatViewportRef={data.callChatViewportRef}
          isSendingCallChatMessage={data.isSendingCallChatMessage}
          onSendCallChatMessage={() => void data.onSendCallChatMessage()}
          isUpdatingStatus={data.isUpdatingStatus}
          onChangeStatus={(status) => void data.onChangeStatus(status)}
          selectedAudioInputDeviceId={media.selectedAudioInputDeviceId}
          selectedVideoInputDeviceId={media.selectedVideoInputDeviceId}
          selectedAudioOutputDeviceId={media.selectedAudioOutputDeviceId}
          audioInputDevices={media.audioInputDevices}
          videoInputDevices={media.videoInputDevices}
          audioOutputDevices={media.audioOutputDevices}
          onSelectAudioInput={(value) => void media.onSelectAudioInput(value)}
          onSelectVideoInput={(value) => void media.onSelectVideoInput(value)}
          onSelectAudioOutput={(value) => void media.onSelectAudioOutput(value)}
          participants={data.participants}
          activeSpeakerUserIds={media.activeSpeakerUserIds}
        />
      </div>
    </div>
  );
}
