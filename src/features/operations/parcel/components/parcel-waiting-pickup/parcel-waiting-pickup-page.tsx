import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { ParcelStatus } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { PickupVerificationDialog } from './pickup-verification-dialog';
import { useWaitingPickupColumns } from './use-waiting-pickup-columns';
import { useWaitingPickupWorkflow } from './use-waiting-pickup-workflow';
import { getQueueFilterBySearch, type CardMode, type HandoverTarget } from './waiting-pickup-types';
import { EditIncomingTransitParcelDialog } from '../parcel-in-transit/edit-incoming-transit-parcel-dialog';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : sharedFormatDateTime(value);
}

export function ParcelWaitingPickupPage() {
  const workflow = useWaitingPickupWorkflow();
  const { context, table, dialog, edit } = workflow;
  const columns = useWaitingPickupColumns({
    page: table.query.page ?? 1,
    pageSize: table.query.pageSize ?? 20,
    isPickupQueueEnabled: context.isPickupQueueEnabled,
    isSaving: table.isSaving,
    onOpen: table.openParcelDialog,
    onEdit: table.openEditDialog,
    onRequestDelivery: table.handleRequestDelivery,
  });

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Waiting for Pickup</CardTitle>
            <CardDescription>
              {context.isPickupQueueEnabled
                ? 'Sender-paid parcels awaiting office pickup and identity verification.'
                : 'Search for a sender-paid parcel to process pickup at this branch.'}
            </CardDescription>
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
                senderPaid: true,
                hasPickupQueue: getQueueFilterBySearch(
                  context.isPickupQueueEnabled,
                  table.query.search,
                ),
              }}
              onRequestChange={(next) =>
                table.setQuery((previous) => ({
                  ...previous,
                  ...next,
                  search: previous.search,
                  sort:
                    context.isPickupQueueEnabled && !previous.search?.trim()
                      ? [{ field: 'pickupQueueNumber', direction: 'asc' }]
                      : next.sort,
                  filters: {
                    companyId: context.companyId,
                    destinationId: context.branchId,
                    status: ParcelStatus.AWAITING_PICKUP,
                    senderPaid: true,
                    hasPickupQueue: getQueueFilterBySearch(
                      context.isPickupQueueEnabled,
                      previous.search,
                    ),
                  },
                }))
              }
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>

      <PickupVerificationDialog
        open={Boolean(dialog.selectedParcel)}
        parcel={dialog.selectedParcel}
        onClose={dialog.closeParcelDialog}
        pickerStaffId={dialog.pickerStaffId}
        onPickerStaffIdChange={dialog.setPickerStaffId}
        staffOptions={dialog.staffOptions}
        staffLocationName={context.cashierLocationName}
        isPickupQueueEnabled={context.isPickupQueueEnabled}
        isPickupOtpRequired={context.isPickupOtpRequired}
        hasPickupQueue={dialog.hasPickupQueue}
        parcelDetails={dialog.parcelDetails}
        formatDateTime={formatDateTime}
        mainCardMode={dialog.mainCardMode}
        onMainCardModeChange={(value) => dialog.setMainCardMode(value as CardMode)}
        mainExistingCardRecordId={dialog.mainExistingCardRecordId}
        onMainExistingCardRecordIdChange={dialog.setMainExistingCardRecordId}
        mainNewCardTypeId={dialog.mainNewCardTypeId}
        onMainNewCardTypeIdChange={dialog.setMainNewCardTypeId}
        mainNewCardNumber={dialog.mainNewCardNumber}
        onMainNewCardNumberChange={dialog.setMainNewCardNumber}
        mainReceiverCards={dialog.mainReceiverCards}
        handoverTarget={dialog.handoverTarget}
        onHandoverTargetChange={(value) => dialog.setHandoverTarget(value as HandoverTarget)}
        phoneSlot={dialog.phoneSlot}
        onPhoneSlotChange={dialog.setPhoneSlot}
        secondNewName={dialog.secondNewName}
        onSecondNewNameChange={dialog.setSecondNewName}
        secondNewPhone={dialog.secondNewPhone}
        onSecondNewPhoneChange={dialog.setSecondNewPhone}
        secondCardMode={dialog.secondCardMode}
        onSecondCardModeChange={(value) => dialog.setSecondCardMode(value as CardMode)}
        secondExistingCardRecordId={dialog.secondExistingCardRecordId}
        onSecondExistingCardRecordIdChange={dialog.setSecondExistingCardRecordId}
        secondNewCardTypeId={dialog.secondNewCardTypeId}
        onSecondNewCardTypeIdChange={dialog.setSecondNewCardTypeId}
        secondNewCardNumber={dialog.secondNewCardNumber}
        onSecondNewCardNumberChange={dialog.setSecondNewCardNumber}
        secondReceiverCards={dialog.secondReceiverCards}
        cardOptions={dialog.cardOptions}
        otp={dialog.otp}
        isSaving={dialog.isSaving}
        onRequestHomeDelivery={dialog.handleRequestHomeDelivery}
        onConfirmDelivered={dialog.handleConfirmDelivered}
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
    </div>
  );
}
