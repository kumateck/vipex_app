import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { DataTable } from '@/components/datatable';
import { ParcelStatus } from '@/db/schemas/enums';
import { useCallCenterAssignmentWorkflow } from './use-call-center-assignment-workflow';
import { useCallCenterAssignmentColumns } from './use-call-center-assignment-columns';
import { EMPTY_META } from './call-center-assignment-types';
import { AssignParcelDialog } from './assign-parcel-dialog';
import { BulkAssignParcelsDialog } from './bulk-assign-parcels-dialog';

export function ParcelCallCenterAssignmentPage() {
  const workflow = useCallCenterAssignmentWorkflow();
  const { context, table, dialog } = workflow;
  const [searchInput, setSearchInput] = useState('');
  const [selectedParcelIds, setSelectedParcelIds] = useState<Set<string>>(new Set());
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const columns = useCallCenterAssignmentColumns({
    onOpenAssignDialog: table.openAssignDialog,
    selectedParcelIds,
    onToggleParcel: (parcelId) =>
      setSelectedParcelIds((current) => {
        const next = new Set(current);
        if (next.has(parcelId)) next.delete(parcelId);
        else next.add(parcelId);
        return next;
      }),
    rows: table.rows,
    onToggleAll: (checked) => {
      setSelectedParcelIds((current) => {
        const next = new Set(current);
        for (const row of table.rows) {
          if (checked) next.add(row.id);
          else next.delete(row.id);
        }
        return next;
      });
    },
  });

  const assignSelected = async () => {
    const staffId = dialog.selectedStaffId;
    if (!staffId || selectedParcelIds.size === 0) return;
    setIsBulkSaving(true);
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch('/v1/shipments/parcels/bulk-assign-call-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ parcelIds: [...selectedParcelIds], userId: staffId }),
      });
      if (!response.ok) throw new Error('Failed to assign selected parcels');
      setSelectedParcelIds(new Set());
      dialog.setSelectedParcel(null);
      setBulkOpen(false);
      table.handleSearchSubmit(searchInput);
      toast.success(`${selectedParcelIds.size} parcels assigned successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign selected parcels');
      throw error;
    } finally {
      setIsBulkSaving(false);
    }
  };

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Call Center Assignment</CardTitle>
                <CardDescription>
                  Assign parcels to call center representatives for outbound calling and follow-ups.
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

            <div className="flex items-center justify-end">
              <Button
                type="button"
                disabled={selectedParcelIds.size === 0}
                onClick={() => setBulkOpen(true)}
              >
                Assign selected ({selectedParcelIds.size})
              </Button>
            </div>
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

        <BulkAssignParcelsDialog
          open={bulkOpen}
          parcels={table.rows.filter((parcel) => selectedParcelIds.has(parcel.id))}
          staffOptions={dialog.staffOptions}
          selectedStaffId={dialog.selectedStaffId}
          onStaffIdChange={dialog.setSelectedStaffId}
          isSaving={isBulkSaving}
          onClose={() => setBulkOpen(false)}
          onAssign={assignSelected}
        />
      </ScrollableWrapper>
    </div>
  );
}
