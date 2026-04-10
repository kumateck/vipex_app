import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  Video,
  VideoOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type CommunicationCallRoomControlsProps = {
  isConnected: boolean;
  isMediaConnected: boolean;
  isMediaConnecting: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onToggleMuted: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
};

export function CommunicationCallRoomControls({
  isConnected,
  isMediaConnected,
  isMediaConnecting,
  isMuted,
  isVideoOff,
  isScreenSharing,
  onJoin,
  onLeave,
  onToggleMuted,
  onToggleVideo,
  onToggleScreenShare,
}: CommunicationCallRoomControlsProps) {
  return (
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
        onClick={onToggleScreenShare}
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
  );
}
