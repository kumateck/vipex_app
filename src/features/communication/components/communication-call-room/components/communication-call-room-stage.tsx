import type { RefObject } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  remoteCameraTracks: RemoteMediaTrack[];
  orderedRemoteVideoTracks: RemoteMediaTrack[];
  remoteAudioTracks: RemoteMediaTrack[];
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
  remoteCameraTracks,
  orderedRemoteVideoTracks,
  remoteAudioTracks,
  activeSpeakerUserIds,
  dominantSpeakerUserId,
  participantNameById,
  userLabelById,
  currentUserId,
}: CommunicationCallRoomStageProps) {
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
              <span className="text-muted-foreground">{isVideoOff ? 'Camera off' : 'Preview'}</span>
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
  );
}
