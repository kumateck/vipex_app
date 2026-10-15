import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeviceManagement } from '../../hooks/use-device-management';
import { DeviceReviewDialog } from '../../dialogs/device-review-dialog';
import { DEVICE_FILTER_LABELS, type DeviceFilter } from '../../utils/device-filters';
import { DeviceRow } from './device-row';

const FILTERS: DeviceFilter[] = ['pending', 'approved', 'blocked', 'all'];

export function DeviceManagementPage() {
  const management = useDeviceManagement();
  if (!management.allowed) {
    return (
      <p className="p-4 text-sm text-destructive">
        Registered device approval permission is required.
      </p>
    );
  }
  return (
    <div className="w-full space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Device Approvals</h1>
          <p className="text-sm text-muted-foreground">
            Approve mobile and desktop app installations before staff can sign in on them.
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
            <Tabs
              value={management.filter}
              onValueChange={(value) => management.setFilter(value as DeviceFilter)}
            >
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
                {FILTERS.map((filter) => (
                  <TabsTrigger key={filter} value={filter}>
                    {DEVICE_FILTER_LABELS[filter]} ({management.counts[filter]})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {management.isLoading ? <p>Loading devices…</p> : null}
            {management.isError ? <p role="alert">Could not load devices.</p> : null}
            {!management.isLoading && !management.isError && !management.devices.length ? (
              <p className="text-sm text-muted-foreground">
                {management.filter === 'pending'
                  ? 'No devices are waiting for approval.'
                  : 'No devices in this view.'}
              </p>
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
