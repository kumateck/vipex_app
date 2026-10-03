import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useDeviceManagement } from '../../hooks/use-device-management';
import { DeviceReviewDialog } from '../../dialogs/device-review-dialog';
import { DeviceRow } from './device-row';

export function DeviceManagementPage() {
  const management = useDeviceManagement();
  if (!management.allowed) {
    return (
      <p className="p-4 text-sm text-destructive">
        Head-office user management permission is required.
      </p>
    );
  }
  return (
    <div className="w-full space-y-4 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Registered Devices</h1>
          <p className="text-sm text-muted-foreground">
            Approve mobile and desktop installations before staff can sign in.
          </p>
        </div>
        <Button variant="outline" onClick={() => void management.refetch()}>
          Refresh
        </Button>
      </div>
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Approval queue</CardTitle>
            <CardDescription>
              Revoke an approved device, block it temporarily, or permanently prevent this
              registration. Unblocked devices return to pending approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {management.isLoading ? <p>Loading devices…</p> : null}
            {management.isError ? <p role="alert">Could not load devices.</p> : null}
            {!management.isLoading && !management.devices.length ? (
              <p className="text-sm text-muted-foreground">No device requests yet.</p>
            ) : null}
            {management.devices.map((device) => (
              <DeviceRow
                key={device.id}
                device={device}
                currentUserId={management.userId}
                onAction={(target, action) => management.setSelection({ device: target, action })}
              />
            ))}
          </CardContent>
        </Card>
      </ScrollableWrapper>
      {management.selection ? (
        <DeviceReviewDialog
          key={`${management.selection.device.id}:${management.selection.action}`}
          selection={management.selection}
          onClose={() => management.setSelection(null)}
          onSubmit={(reason) => void management.submit(reason)}
          isUpdating={management.isUpdating}
        />
      ) : null}
    </div>
  );
}
