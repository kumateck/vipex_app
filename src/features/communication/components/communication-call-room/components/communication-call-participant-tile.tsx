import { Mic, MicOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrackRenderer } from './track-renderer';

type ParticipantTileTrack = Parameters<typeof TrackRenderer>[0]['track'] | null;

function toInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() ?? 'U';
  return `${parts[0]?.charAt(0) ?? ''}${parts[1]?.charAt(0) ?? ''}`.toUpperCase();
}

export function CommunicationCallParticipantTile({
  label,
  isMuted,
  isVideoOff,
  isSpeaking,
  isDominant,
  track,
  compact = false,
  onFocus,
}: {
  label: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking: boolean;
  isDominant: boolean;
  track: ParticipantTileTrack;
  compact?: boolean;
  onFocus?: (() => void) | null;
}) {
  const showVideo = !isVideoOff && Boolean(track);
  const tileHeight = compact ? 'h-28' : isDominant ? 'h-[320px]' : 'h-[240px]';

  return (
    <div
      className={`rounded-xl border p-2 ${isSpeaking ? 'border-primary/70 ring-2 ring-primary/20' : 'border-border/70'} ${isDominant ? 'md:col-span-2' : ''}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium">{label}</p>
        <div className="flex items-center gap-2">
          <Badge variant={isMuted ? 'destructive' : 'outline'} className="gap-1">
            {isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
            {isMuted ? 'Muted' : 'Live'}
          </Badge>
          {showVideo && onFocus ? (
            <Button size="sm" variant="ghost" onClick={onFocus}>
              Focus
            </Button>
          ) : null}
        </div>
      </div>

      {showVideo && track ? (
        <TrackRenderer
          track={track}
          className={`${tileHeight} w-full rounded-lg bg-black object-cover`}
        />
      ) : (
        <div className={`${tileHeight} grid place-content-center rounded-lg bg-muted`}>
          <div className={`flex flex-col items-center ${compact ? 'gap-2' : 'gap-3'}`}>
            <div
              className={`flex items-center justify-center rounded-full border font-semibold ${
                compact ? 'h-14 w-14 text-sm' : 'h-20 w-20 text-xl'
              }`}
            >
              {toInitials(label)}
            </div>
            <p
              className={`max-w-[180px] truncate text-center font-medium ${compact ? 'text-xs' : 'text-sm'}`}
            >
              {label}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
