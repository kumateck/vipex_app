import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { DataTable } from '@/components/datatable';
import { ParcelStatus } from '@/db/schemas/enums';
import { ParcelSessionGuard } from '../parcel-session-guard';
import { useCallCenterAssignmentWorkflow } from './use-call-center-assignment-workflow';
import { useCallCenterAssignmentColumns } from './use-call-center-assignment-columns';
import { EMPTY_META } from './call-center-assignment-types';
import { AssignParcelDialog } from './assign-parcel-dialog';

export function ParcelCallCenterAssignmentPage() {
  const workflow = useCallCenterAssignmentWorkflow();
  const { context, table, dialog } = workflow;
  const [searchInput, setSearchInput] = useState('');

  const columns = useCallCenterAssignmentColumns({
    onOpenAssignDialog: table.openAssignDialog,
  });

  return (
    <div className="w-full p-4 space-y-4">
      <ParcelSessionGuard>
        <ScrollableWrapper>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Call Center Assignment</CardTitle>
                  <CardDescription>
                    Assign parcels to call center representatives for outbound calling and
                    follow-ups.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  table.handleSearchSubmit(searchInput);
                }}
              >
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by tracking, booking, telephone, or receiver name"
                />
                <Button type="submit">Search</Button>
              </form>

              <DataTable
                mode="server"
                data={table.rows}
                columns={columns}
                meta={table.listQuery.data?.meta ?? EMPTY_META}
                loading={table.listQuery.isLoading}
                showSearch={false}
                serverFilters={{
                  companyId: context.companyId,
                  destinationId: context.branchId,
                  status: ParcelStatus.AWAITING_PICKUP,
                  senderPaid: true,
                }}
                onRequestChange={(next) =>
                  table.setQuery((prev) => ({
                    ...prev,
                    ...next,
                    search: prev.search,
                  }))
                }
              />
            </CardContent>
          </Card>

          <AssignParcelDialog
            open={Boolean(dialog.selectedParcel)}
            parcel={dialog.selectedParcel}
            staffOptions={dialog.staffOptions}
            selectedStaffId={dialog.selectedStaffId}
            onStaffIdChange={dialog.setSelectedStaffId}
            isSaving={dialog.isSaving}
            onClose={() => dialog.setSelectedParcel(null)}
            onAssign={async () => {
              await dialog.handleAssignParcel();
              table.handleSearchSubmit(searchInput);
            }}
          />
        </ScrollableWrapper>
      </ParcelSessionGuard>
    </div>
  );
}
