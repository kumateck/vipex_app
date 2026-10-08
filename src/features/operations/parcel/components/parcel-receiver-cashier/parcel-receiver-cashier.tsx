import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReceiverReceiptReprint } from '../../hooks';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { DataTable } from '@/components/datatable';
import { ParcelStatus } from '@/db/schemas/enums';
import { ParcelReceiptActions } from '../parcel-receipt-actions';
import { ParcelSessionGuard } from '../parcel-session-guard';
import { PAYMENT_TYPE_LEGEND } from './receiver-cashier-constants';
import { ReceiverPaymentDeliveryDialog } from './receiver-payment-delivery-dialog';
import { EMPTY_META } from './receiver-cashier-types';
import { useParcelReceiverCashierColumns } from './use-parcel-receiver-cashier-columns';
import { useParcelReceiverCashierWorkflow } from './use-parcel-receiver-cashier-workflow';
import { EditIncomingTransitParcelDialog } from '../parcel-in-transit/edit-incoming-transit-parcel-dialog';

export function ParcelReceiverCashier() {
  const workflow = useParcelReceiverCashierWorkflow();
  const { context, table, dialog, receipt, edit } = workflow;
  const reprint = useReceiverReceiptReprint();

  const columns = useParcelReceiverCashierColumns({
    isPickupQueueEnabled: context.isPickupQueueEnabled,
    isSaving: table.isSaving || reprint.isLoading,
    onReprintReceipt: reprint.print,
    page: table.query.page ?? 1,
    pageSize: table.query.pageSize ?? 20,
    onOpenParcelDialog: table.openParcelDialog,
    onEdit: table.openEditDialog,
    onRequestDelivery: (parcel) => void table.handleRequestDelivery(parcel),
  });

  return (
    <div className="w-full p-4 space-y-4">
      <ParcelSessionGuard>
        <ScrollableWrapper>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Receiver Cashier</CardTitle>
                  <CardDescription>
                    {table.isDelivered
                      ? 'Search delivered office parcels at this branch and reprint the receiver receipt.'
                      : context.isPickupQueueEnabled
                        ? 'Receiver-pay parcels awaiting payment collection and office handover.'
                        : 'Search for a receiver-pay parcel to collect payment and complete handover at this branch.'}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {PAYMENT_TYPE_LEGEND.map((item) => (
                    <div key={item.label} className="inline-flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.dotClassName}`} />
                      <span className="text-muted-foreground text-xs">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={String(table.status)}
                onValueChange={(value) => table.setStatus(Number(value))}
              >
                <SelectTrigger className="w-48" aria-label="Parcel status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(ParcelStatus.AWAITING_PICKUP)}>
                    Awaiting Pickup
                  </SelectItem>
                  <SelectItem value={String(ParcelStatus.DELIVERED_BY_OFFICE)}>
                    Delivered
                  </SelectItem>
                </SelectContent>
              </Select>
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
                meta={table.listQuery.currentData?.meta ?? EMPTY_META}
                loading={table.listQuery.isFetching}
                showSearch={false}
                serverFilters={table.query.filters}
                onRequestChange={table.handleRequestChange}
                enableVirtualization={false}
              />
            </CardContent>
          </Card>
        </ScrollableWrapper>

        <ReceiverPaymentDeliveryDialog context={context} dialog={dialog} />

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

        {reprint.printData ? (
          <ParcelReceiptActions
            key={`reprint-${reprint.printData.trackingCode}`}
            data={reprint.printData}
            autoPrint
            autoPrintSelection="invoice"
            mode="reprint"
            onAutoPrintComplete={reprint.clear}
          />
        ) : null}

        {receipt.lastPrintedReceipt ? (
          <ParcelReceiptActions
            data={receipt.lastPrintedReceipt}
            autoPrint
            autoPrintSelection="invoice"
            mode="receiver-payment"
            onAutoPrintComplete={receipt.clearLastPrintedReceipt}
          />
        ) : null}
      </ParcelSessionGuard>
    </div>
  );
}
