import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/datatable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { formatDate } from '@/lib/dates';
import type { PreviousConsignmentRow } from '../../api/parcel.api';
import { ConsignmentPrintController } from '../parcel-processed-consignment';
import { PreviousConsignmentsFilters } from './components/previous-consignments-filters';
import { usePreviousConsignments } from './hooks/use-previous-consignments';

export function PreviousConsignmentsPage() {
  const state = usePreviousConsignments();
  const rows = state.history.data ?? [];
  const columns = useMemo<ColumnDef<PreviousConsignmentRow>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Consignment',
        cell: ({ row }) => <span className="font-medium">{row.original.code}</span>,
      },
      {
        id: 'route',
        header: 'Route',
        cell: ({ row }) => `${row.original.sourceName} → ${row.original.destinationName}`,
      },
      {
        accessorKey: 'consignmentDate',
        header: 'Consignment Date',
        cell: ({ row }) => formatDate(row.original.consignmentDate),
      },
      {
        accessorKey: 'itemCount',
        header: 'Parcels',
      },
      {
        id: 'availability',
        header: 'Print Status',
        cell: () => <Badge variant="outline">Available to reprint</Badge>,
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            onClick={() => void state.printConsignment(row.original.id)}
            disabled={state.printingId !== null}
          >
            {state.printingId === row.original.id ? 'Preparing…' : 'Reprint'}
          </Button>
        ),
      },
    ],
    [state.printConsignment, state.printingId],
  );

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Previous Consignments</CardTitle>
            <CardDescription>
              Retrieve saved consignments by a specific date or inclusive date range, then print the
              manifest again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PreviousConsignmentsFilters
              branches={state.branches}
              isHeadOffice={state.isHeadOffice}
              isLoading={state.history.isFetching}
              range={state.range}
              sourceId={state.sourceId}
              onRangeChange={state.setRange}
              onSearch={state.search}
              onSourceChange={state.setSourceId}
            />
            <DataTable
              mode="client"
              data={rows}
              columns={columns}
              loading={state.history.isFetching}
              showSearch={Boolean(state.appliedQuery)}
              searchColumn="code"
              searchPlaceholder="Search consignment number"
              emptyMessage={
                state.appliedQuery
                  ? 'No consignments found for the selected date range.'
                  : 'Select a date or date range to retrieve previous consignments.'
              }
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>
      <ConsignmentPrintController
        payload={state.printPayload}
        onPrinted={() => state.setPrintPayload(null)}
      />
    </div>
  );
}
