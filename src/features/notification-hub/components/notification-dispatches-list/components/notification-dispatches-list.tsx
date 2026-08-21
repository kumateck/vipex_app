import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { NotificationDispatchDetailsDialog } from '../dialogs/notification-dispatch-details-dialog';
import { useNotificationDispatchesList } from '../hooks/use-notification-dispatches-list';
import { NotificationDispatchesFilters } from './notification-dispatches-filters';
import { NotificationDispatchesTable } from './notification-dispatches-table';

export function NotificationDispatchesList() {
  const dispatches = useNotificationDispatchesList();

  return (
    <ScrollableWrapper>
      <div className="w-full space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Notification Delivery Logs</CardTitle>
            <CardDescription>
              Filter by SMS and Sent to review every submitted SMS and its complete message.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <NotificationDispatchesFilters
              searchInput={dispatches.searchInput}
              channel={dispatches.channel}
              status={dispatches.status}
              onSearchInputChange={dispatches.onSearchInputChange}
              onChannelChange={dispatches.onChannelChange}
              onStatusChange={dispatches.onStatusChange}
            />

            <NotificationDispatchesTable
              rows={dispatches.rows}
              isLoading={dispatches.isLoading}
              isRetrying={dispatches.isRetrying}
              onView={dispatches.onView}
              onRetry={dispatches.onRetry}
            />

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {dispatches.page} of {dispatches.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={dispatches.onPreviousPage}
                  disabled={dispatches.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={dispatches.onNextPage}
                  disabled={dispatches.page >= dispatches.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <NotificationDispatchDetailsDialog
        dispatch={dispatches.selectedDispatch}
        onClose={dispatches.onCloseDetails}
      />
    </ScrollableWrapper>
  );
}
