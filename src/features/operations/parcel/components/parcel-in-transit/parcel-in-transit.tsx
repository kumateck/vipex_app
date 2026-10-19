import { DataTable } from '@/components/datatable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { ParcelReceiptActions } from '../parcel-receipt-actions';
import { PaymentStatusLegend } from '../parcel-processed-consignment/payment-status-legend';
import { ConfirmMarkArrivedDialog } from './confirm-mark-arrived-dialog';
import { ConfirmBulkArrivalDialog } from './confirm-bulk-arrival-dialog';
import { EditIncomingTransitParcelDialog } from './edit-incoming-transit-parcel-dialog';
import { LogDiscrepancyDialog } from './log-discrepancy-dialog';
import { ParcelDetailsDialog } from '@/features/operations/parcel-details';
import { IncomingTransitFilters } from './incoming-transit-filters';
import { useParcelTransitWorkflow, type InTransitView } from './use-parcel-transit-workflow';
import { useParcelTransitColumns } from './use-parcel-transit-columns';
import { EMPTY_META } from './parcel-transit.utils';

export function ParcelInTransit({ view }: { view: InTransitView }) {
  const workflow = useParcelTransitWorkflow(view);
  const columns = useParcelTransitColumns(workflow);
  const {
    title,
    description,
    batchArrival,
    setDiscrepancyParcel,
    setDiscrepancyDialogOpen,
    setMissingTrackingCode,
    setMissingBookingCode,
    setDiscrepancyNotes,
    branchOptions,
    setIncomingFilters,
    handleSearchSubmit,
    searchInput,
    setSearchInput,
    companyId,
    branchId,
    setQuery,
    serverFilters,
    rows,
    data,
    isLoading,
    handleRequestChange,
    selectedParcelId,
    setSelectedParcelId,
    arrivalConfirmationParcel,
    isUpdatingStatus,
    setArrivalConfirmationParcel,
    handleConfirmMarkAsArrived,
    discrepancyDialogOpen,
    discrepancyParcel,
    missingTrackingCode,
    missingBookingCode,
    discrepancyNotes,
    isLoggingDiscrepancy,
    handleLogDiscrepancy,
    outgoingPrint,
    edit,
  } = workflow;
  const {
    editingParcel,
    setEditingParcel,
    editParcelDetails,
    setEditParcelDetails,
    editReceiverName,
    setEditReceiverName,
    editReceiverPhone,
    setEditReceiverPhone,
  } = edit;
  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
              <PaymentStatusLegend />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {view === 'incoming' ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => batchArrival.setIsConfirmationOpen(true)}
                  disabled={batchArrival.selectedCount === 0 || batchArrival.isLoading}
                >
                  Mark Arrived ({batchArrival.selectedCount})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDiscrepancyParcel(null);
                    setDiscrepancyDialogOpen(true);
                    setMissingTrackingCode('');
                    setMissingBookingCode('');
                    setDiscrepancyNotes('');
                  }}
                >
                  Log Missing Physical Parcel
                </Button>
              </div>
            ) : null}
            {view === 'incoming' ? (
              <IncomingTransitFilters
                branches={branchOptions}
                onApply={(filters) => {
                  batchArrival.clearSelection();
                  setIncomingFilters(filters);
                }}
              />
            ) : null}
            <form className="flex items-center gap-2" onSubmit={handleSearchSubmit}>
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by tracking, booking, sender or receiver"
                className="h-11 text-base"
              />
              <Button type="submit" className="h-11 px-6" disabled={!companyId || !branchId}>
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 px-6"
                onClick={() => {
                  batchArrival.clearSelection();
                  setSearchInput('');
                  setQuery((prev) => ({
                    ...prev,
                    page: 1,
                    search: undefined,
                    filters: serverFilters,
                  }));
                }}
              >
                Clear
              </Button>
            </form>
            <DataTable
              mode="server"
              data={rows}
              columns={columns}
              meta={data?.meta ?? EMPTY_META}
              loading={isLoading}
              showSearch={false}
              serverFilters={serverFilters}
              onRequestChange={handleRequestChange}
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>

      <ParcelDetailsDialog parcelId={selectedParcelId} onClose={() => setSelectedParcelId(null)} />

      <ConfirmMarkArrivedDialog
        parcel={arrivalConfirmationParcel}
        isConfirming={isUpdatingStatus}
        onCancel={() => setArrivalConfirmationParcel(null)}
        onConfirm={handleConfirmMarkAsArrived}
      />

      <ConfirmBulkArrivalDialog
        open={view === 'incoming' && batchArrival.isConfirmationOpen}
        parcels={batchArrival.selectedParcels}
        isConfirming={batchArrival.isLoading}
        onOpenChange={batchArrival.setIsConfirmationOpen}
        onConfirm={batchArrival.confirmArrival}
      />

      <LogDiscrepancyDialog
        open={view === 'incoming' && discrepancyDialogOpen}
        onOpenChange={(open) => {
          setDiscrepancyDialogOpen(open);
          if (open) return;
          setDiscrepancyParcel(null);
          setMissingTrackingCode('');
          setMissingBookingCode('');
          setDiscrepancyNotes('');
        }}
        discrepancyParcel={discrepancyParcel}
        missingTrackingCode={missingTrackingCode}
        onMissingTrackingCodeChange={setMissingTrackingCode}
        missingBookingCode={missingBookingCode}
        onMissingBookingCodeChange={setMissingBookingCode}
        discrepancyNotes={discrepancyNotes}
        onDiscrepancyNotesChange={setDiscrepancyNotes}
        isLoggingDiscrepancy={isLoggingDiscrepancy}
        onCancel={() => {
          setDiscrepancyParcel(null);
          setDiscrepancyDialogOpen(false);
          setMissingTrackingCode('');
          setMissingBookingCode('');
          setDiscrepancyNotes('');
        }}
        onSave={handleLogDiscrepancy}
      />

      <EditIncomingTransitParcelDialog
        open={Boolean(editingParcel)}
        onClose={() => setEditingParcel(null)}
        editParcelDetails={editParcelDetails}
        onEditParcelDetailsChange={setEditParcelDetails}
        editReceiverName={editReceiverName}
        onEditReceiverNameChange={setEditReceiverName}
        editReceiverPhone={editReceiverPhone}
        onEditReceiverPhoneChange={setEditReceiverPhone}
        isSaving={edit.isSaving}
        onSave={edit.handleSaveEdit}
      />

      {outgoingPrint.printData ? (
        <ParcelReceiptActions
          data={outgoingPrint.printData}
          autoPrint
          autoPrintSelection={outgoingPrint.selection}
          stickerCopies={outgoingPrint.stickerCopies}
          mode="reprint"
          onAutoPrintComplete={outgoingPrint.clear}
        />
      ) : null}
    </div>
  );
}
