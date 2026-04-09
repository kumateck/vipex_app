import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CommunicationCallSession } from '../../../api/communication.api';
import { prettyValue } from '../utils/communication-call-room-utils';

type CommunicationCallRoomHeaderProps = {
  call: CommunicationCallSession;
  threadLabelById: Map<string, string>;
  isConnected: boolean;
  isMediaConnected: boolean;
  isMediaConnecting: boolean;
  onRefresh: () => void;
};

export function CommunicationCallRoomHeader({
  call,
  threadLabelById,
  isConnected,
  isMediaConnected,
  isMediaConnecting,
  onRefresh,
}: CommunicationCallRoomHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">
          {call.threadId ? (threadLabelById.get(call.threadId) ?? 'Call') : 'Voice Channel Call'}
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
        <Button variant="outline" onClick={onRefresh}>
          Refresh
        </Button>
      </div>
    </div>
  );
}
