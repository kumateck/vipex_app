import { DataTable } from '@/components/datatable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useSelfServiceQueue } from '../../hooks';
import { SelfServiceCustomerDialog } from '../../dialogs';
import { useSelfServiceQueueColumns } from './use-self-service-queue-columns';

export function SelfServiceQueue() {
  const state = useSelfServiceQueue();
  const columns = useSelfServiceQueueColumns(state);
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Self-Service Bookings</CardTitle>
            <CardDescription>
              Review customer details, make corrections where needed, and complete submitted
              bookings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              mode="client"
              data={state.drafts}
              columns={columns}
              loading={state.isLoading}
              error={state.error}
              searchPlaceholder="Search sender, receiver, phone, parcel content or status..."
              emptyMessage="No pending self-service bookings for your branch."
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>
      {state.selectedDraft ? (
        <SelfServiceCustomerDialog
          key={`${state.selectedDraft.id}:${state.selectedDraft.updatedAt}`}
          draft={state.selectedDraft}
          canEdit={state.canComplete}
          onClose={state.onClose}
        />
      ) : null}
    </div>
  );
}
