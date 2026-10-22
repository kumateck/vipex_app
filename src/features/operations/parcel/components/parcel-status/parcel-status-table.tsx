import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import type { ParcelStatusTableProps } from '../../types';
import { useParcelStatusColumns } from '../../hooks/use-parcel-status-columns';
import { PaymentTypeFilter } from './payment-type-filter';
import { ParcelStatusSearch } from './parcel-status-search';
import { ParcelSavedOutcomesFilter } from './parcel-saved-outcomes-filter';
import { EMPTY_META as DEFAULT_META } from '../parcel-super-search/constants';

export function ParcelStatusTable(props: ParcelStatusTableProps) {
  const {
    rows,
    loading,
    isSaving,
    companyId,
    branchId,
    searchInput,
    onSearchInputChange,
    onSearchSubmit,
    selectedParcelIds,
    onBatchCallOutcome,
    meta,
    onRequestChange,
    paymentType,
    onPaymentTypeChange,
    includeSavedOutcomes,
    onIncludeSavedOutcomesChange,
  } = props;
  const selectedCount = rows.filter((row) => selectedParcelIds.has(row.id)).length;
  const columns = useParcelStatusColumns(props);
  return (
    <ScrollableWrapper>
      <Card>
        <CardHeader>
          <CardTitle>Parcel Status (Call Receivers)</CardTitle>
          <CardDescription>
            Assigned parcels needing a call are shown by default. Include saved outcomes to resend
            their notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ParcelStatusSearch
            value={searchInput}
            onChange={onSearchInputChange}
            onSubmit={onSearchSubmit}
            disabled={!companyId || !branchId}
          />
          <div className="flex flex-wrap items-center gap-4">
            <PaymentTypeFilter value={paymentType} onChange={onPaymentTypeChange} />
            <ParcelSavedOutcomesFilter
              value={includeSavedOutcomes}
              onChange={onIncludeSavedOutcomesChange}
              disabled={isSaving}
            />
          </div>
          {selectedCount > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedCount} parcel(s) selected
              </span>
              <Button type="button" onClick={onBatchCallOutcome} disabled={isSaving}>
                Call Outcome for Selected
              </Button>
            </div>
          ) : null}
          <DataTable
            mode="server"
            data={rows}
            columns={columns}
            meta={meta ?? DEFAULT_META}
            loading={loading}
            showSearch={false}
            enableVirtualization={false}
            pageSizeOptions={[10, 20, 30, 40, 50]}
            onRequestChange={onRequestChange}
          />
        </CardContent>
      </Card>
    </ScrollableWrapper>
  );
}
