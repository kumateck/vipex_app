import type { RefObject } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommunicationCallParticipantTile } from './communication-call-participant-tile';
import type { RemoteMediaTrack } from '../types/communication-call-room.types';
import { getParticipantLabel } from '../utils/communication-call-room-utils';
import { TrackRenderer } from './track-renderer';

type CommunicationCallRoomStageProps = {
  stageRef: RefObject<HTMLDivElement | null>;
  isPseudoFullscreen: boolean;
  isExpandedStage: boolean;
  isStageFullscreen: boolean;
  onToggleStageFullscreen: () => void;
  focusedTrackKey: string | null;
  setFocusedTrackKey: (value: string | null) => void;
  focusedLabel: string | null;
  hasFocusedLocal: boolean;
  focusedRemoteTrack: RemoteMediaTrack | null;
  localVideoTrack: Parameters<typeof TrackRenderer>[0]['track'] | null;
  isScreenShareLayout: boolean;
  primaryScreenShareTrack: RemoteMediaTrack | null;
  isVideoOff: boolean;
  orderedRemoteVideoTracks: RemoteMediaTrack[];
  remoteAudioTracks: RemoteMediaTrack[];
  participants: Array<{
    userId: string;
    displayName?: string;
    joinedAt: string;
    isMuted: boolean;
    isVideoOff: boolean;
  }>;
  activeSpeakerUserIds: string[];
  dominantSpeakerUserId: string | null;
  participantNameById: Map<string, string>;
  userLabelById: Map<string, string>;
  currentUserId: string;
};

export function CommunicationCallRoomStage({
  stageRef,
  isPseudoFullscreen,
  isExpandedStage,
  isStageFullscreen,
  onToggleStageFullscreen,
  focusedTrackKey,
  setFocusedTrackKey,
  focusedLabel,
  hasFocusedLocal,
  focusedRemoteTrack,
  localVideoTrack,
  isScreenShareLayout,
  primaryScreenShareTrack,
  isVideoOff,
  orderedRemoteVideoTracks,
  remoteAudioTracks,
  participants,
  activeSpeakerUserIds,
  dominantSpeakerUserId,
  participantNameById,
  userLabelById,
  currentUserId,
}: CommunicationCallRoomStageProps) {
  const remoteVideoByUserId = new Map<string, RemoteMediaTrack>();
  for (const track of orderedRemoteVideoTracks) {
    if (!remoteVideoByUserId.has(track.userId)) {
      remoteVideoByUserId.set(track.userId, track);
    }
  }

  const participantByUserId = new Map<
    string,
    {
      userId: string;
      displayName?: string;
      joinedAt: string;
      isMuted: boolean;
      isVideoOff: boolean;
    }
  >();
  for (const participant of participants) {
    if (!participantByUserId.has(participant.userId)) {
      participantByUserId.set(participant.userId, participant);
    }
  }
  if (!participantByUserId.has(currentUserId)) {
    participantByUserId.set(currentUserId, {
      userId: currentUserId,
      displayName: userLabelById.get(currentUserId) ?? 'You',
      joinedAt: new Date().toISOString(),
      isMuted: false,
      isVideoOff,
    });
  }
  const participantTiles = [...participantByUserId.values()].sort((a, b) =>
    a.userId === currentUserId
      ? -1
      : b.userId === currentUserId
        ? 1
        : a.joinedAt.localeCompare(b.joinedAt),
  );
  const currentSharerUserId = primaryScreenShareTrack?.userId ?? currentUserId;

  return (
    <div
      ref={stageRef}
      className={`relative flex-1 overflow-hidden rounded-xl border bg-muted/20 p-3 ${
        isPseudoFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-0 bg-background p-4 shadow-2xl'
          : ''
      }`}
    >
      <div className="mb-2 flex items-center justify-end">
        <Button size="sm" variant="outline" onClick={onToggleStageFullscreen}>
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
                      displayName: participantNameById.get(primaryScreenShareTrack.userId),
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
              {participantTiles
                .filter((participant) => participant.userId !== currentSharerUserId)
                .map((item) => {
                  const label = getParticipantLabel({
                    userId: item.userId,
                    displayName: item.displayName ?? participantNameById.get(item.userId),
                    userLabelById,
                    currentUserId,
                  });
                  const remoteVideo = remoteVideoByUserId.get(item.userId);
                  const tileTrack =
                    item.userId === currentUserId ? localVideoTrack : (remoteVideo?.track ?? null);
                  const isSpeaking = activeSpeakerUserIds.includes(item.userId);
                  const onFocus =
                    !item.isVideoOff && tileTrack
                      ? () =>
                          setFocusedTrackKey(
                            item.userId === currentUserId
                              ? 'local'
                              : `remote:${remoteVideo?.id ?? ''}`,
                          )
                      : null;
                  return (
                    <CommunicationCallParticipantTile
                      key={item.userId}
                      label={label}
                      isMuted={item.isMuted}
                      isVideoOff={item.isVideoOff}
                      isSpeaking={isSpeaking}
                      isDominant={false}
                      compact
                      track={tileTrack}
                      onFocus={onFocus}
                    />
                  );
                })}
            </div>
          </div>
        ) : (
          <div
            className={`grid gap-3 ${isExpandedStage ? 'h-full min-h-0 auto-rows-min overflow-y-auto pr-1' : ''} md:grid-cols-2 2xl:grid-cols-3`}
          >
            {participantTiles.map((item) => {
              const label = getParticipantLabel({
                userId: item.userId,
                displayName: item.displayName ?? participantNameById.get(item.userId),
                userLabelById,
                currentUserId,
              });
              const isSpeaking = activeSpeakerUserIds.includes(item.userId);
              const isDominant = item.userId === dominantSpeakerUserId;
              const remoteVideo = remoteVideoByUserId.get(item.userId);
              const tileTrack =
                item.userId === currentUserId ? localVideoTrack : (remoteVideo?.track ?? null);
              const onFocus =
                !item.isVideoOff && tileTrack
                  ? () =>
                      setFocusedTrackKey(
                        item.userId === currentUserId ? 'local' : `remote:${remoteVideo?.id ?? ''}`,
                      )
                  : null;
              return (
                <CommunicationCallParticipantTile
                  key={item.userId}
                  label={label}
                  isMuted={item.isMuted}
                  isVideoOff={item.isVideoOff}
                  isSpeaking={isSpeaking}
                  isDominant={isDominant && participantTiles.length > 1}
                  track={tileTrack}
                  onFocus={onFocus}
                />
              );
            })}
            {!participantTiles.length ? (
              <div className="grid h-[min(58vh,680px)] place-content-center rounded-xl border border-dashed text-sm text-muted-foreground md:col-span-2 2xl:col-span-3">
                Waiting for participants to join
              </div>
            ) : null}
          </div>
        )}
      </div>

      {remoteAudioTracks.map((item) => (
        <TrackRenderer key={item.id} track={item.track} className="hidden" />
      ))}
    </div>
  );
}
