import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { DataTable } from '@/components/datatable';
import { ParcelStatus } from '@/db/schemas/enums';
import { ParcelSessionGuard } from '../parcel-session-guard';
import { useShelfPickerUpdateWorkflow } from './use-shelf-picker-update-workflow';
import { useShelfPickerUpdateColumns } from './use-shelf-picker-update-columns';
import { EMPTY_META } from './shelf-picker-update-types';
import { UpdateShelfPickerDialog } from './update-shelf-picker-dialog';

export function ParcelShelfPickerUpdatePage() {
  const workflow = useShelfPickerUpdateWorkflow();
  const { context, table, dialog } = workflow;

  const columns = useShelfPickerUpdateColumns({
    onOpenUpdateDialog: table.openUpdateDialog,
  });

  return (
    <div className="w-full p-4 space-y-4">
      <ParcelSessionGuard>
        <ScrollableWrapper>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Shelf Picker Update</CardTitle>
                  <CardDescription>
                    Update shelf picker staff assignments for parcels before cashier handover. Works
                    for both paid and to-be-paid parcels.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  table.handleSearchSubmit();
                }}
              >
                <Input
                  value={table.searchInput}
                  onChange={(event) => table.setSearchInput(event.target.value)}
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
                  status: [ParcelStatus.AWAITING_PICKUP, ParcelStatus.CREATED],
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

          <UpdateShelfPickerDialog
            open={Boolean(dialog.selectedParcel)}
            parcel={dialog.selectedParcel}
            staffOptions={dialog.staffOptions}
            selectedStaffId={dialog.selectedStaffId}
            onStaffIdChange={dialog.setSelectedStaffId}
            isSaving={dialog.isSaving}
            onClose={() => dialog.setSelectedParcel(null)}
            onUpdate={async () => {
              await dialog.handleUpdateShelfPicker();
              table.handleSearchSubmit();
            }}
          />
        </ScrollableWrapper>
      </ParcelSessionGuard>
    </div>
  );
}
