import { useEffect, useRef } from 'react';
import type { LocalVideoTrack, RemoteTrack } from 'livekit-client';

type TrackRendererProps = {
  track: LocalVideoTrack | RemoteTrack;
  className?: string;
  muted?: boolean;
};

export function TrackRenderer({ track, className, muted = false }: TrackRendererProps) {
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
