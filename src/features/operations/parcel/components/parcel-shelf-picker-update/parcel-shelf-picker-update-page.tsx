import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { DataTable } from '@/components/datatable';
import { ParcelStatus } from '@/db/schemas/enums';
import { useShelfPickerUpdateWorkflow } from './use-shelf-picker-update-workflow';
import { toast } from 'sonner';
import { useShelfPickerUpdateColumns } from './use-shelf-picker-update-columns';
import { EMPTY_META } from './shelf-picker-update-types';
import { UpdateShelfPickerDialog } from './update-shelf-picker-dialog';
import { PaymentStatusLegend } from '../parcel-processed-consignment';
import { EditIncomingTransitParcelDialog } from '../parcel-in-transit/edit-incoming-transit-parcel-dialog';

export function ParcelShelfPickerUpdatePage() {
  const workflow = useShelfPickerUpdateWorkflow();
  const { context, table, dialog, edit } = workflow;

  const columns = useShelfPickerUpdateColumns({
    onOpenUpdateDialog: table.openUpdateDialog,
    onEdit: table.openEditDialog,
    onRequestDelivery: table.handleRequestDelivery,
    isRequestingDelivery: table.isRequestingDelivery,
    canRequestDelivery: table.canRequestDelivery,
  });

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Shelf Picker Update</CardTitle>
                <CardDescription>
                  Update shelf picker staff assignments for parcels awaiting pickup, including both
                  paid and to-be-paid parcels.
                </CardDescription>
              </div>
              <PaymentStatusLegend />
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
                status: ParcelStatus.AWAITING_PICKUP,
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
            try {
              await dialog.handleUpdateShelfPicker();
              toast.success('Shelf picker assignment updated');
              table.handleSearchSubmit();
            } catch (error) {
              toast.error(
                getApplicationErrorMessage(error, '') || 'Failed to update shelf picker assignment',
              );
            }
          }}
        />

        <EditIncomingTransitParcelDialog
          open={Boolean(edit.editingParcel)}
          onClose={() => edit.setEditingParcel(null)}
          editParcelDetails={edit.editParcelDetails}
          onEditParcelDetailsChange={edit.setEditParcelDetails}
          editReceiverName={edit.editReceiverName}
          onEditReceiverNameChange={edit.setEditReceiverName}
          editReceiverPhone={edit.editReceiverPhone}
          onEditReceiverPhoneChange={edit.setEditReceiverPhone}
          isSaving={edit.isSaving}
          onSave={edit.handleSaveEdit}
        />
      </ScrollableWrapper>
    </div>
  );
}
