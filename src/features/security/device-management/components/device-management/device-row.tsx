import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RegisteredDevice, ReviewAction } from '../../types/device-management.types';
import { actionLabel, availableDeviceActions } from '../../utils/device-actions';

type Props = {
  device: RegisteredDevice;
  currentUserId: string | undefined;
  onAction: (device: RegisteredDevice, action: ReviewAction) => void;
};

export function DeviceRow({ device, currentUserId, onAction }: Props) {
  const actions = availableDeviceActions(device.status).filter(
    (action) => !(action === 'approve' && device.userId === currentUserId),
  );
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-md border p-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{device.deviceName}</span>
          <Badge variant="outline">{device.kind}</Badge>
          <Badge variant={device.status === 'approved' ? 'default' : 'secondary'}>
            {device.status.replaceAll('_', ' ')}
          </Badge>
        </div>
        <p className="text-sm">
          {device.userName} · {device.userEmail}
        </p>
        <p className="text-xs text-muted-foreground">
          {device.osName} {device.osVersion ?? ''} · {device.model ?? 'Unknown model'} · app{' '}
          {device.appVersion ?? 'unknown'}
        </p>
        <p className="text-xs text-muted-foreground">
          Requested {new Date(device.createdAt).toLocaleString()} · Last sign-in/refresh{' '}
          {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'never'}
        </p>
        {device.reviewReason ? <p className="text-xs">Reason: {device.reviewReason}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action}
            size="sm"
            variant={action === 'permanently_deny' ? 'destructive' : 'outline'}
            onClick={() => onAction(device, action)}
          >
            {actionLabel(action)}
          </Button>
        ))}
      </div>
    </div>
  );
}
