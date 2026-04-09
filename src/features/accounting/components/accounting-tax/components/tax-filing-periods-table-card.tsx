import { DataTable } from '@/components/datatable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ColumnDef } from '@tanstack/react-table';
import type { TaxFilingPeriodRow } from '../../../api';

export function TaxFilingPeriodsTableCard(props: {
  columns: ColumnDef<TaxFilingPeriodRow>[];
  isLoading: boolean;
  periods: TaxFilingPeriodRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filing Periods</CardTitle>
        <CardDescription>
          Keep filing periods visible so accounting and audit users can reconcile what was reviewed
          and filed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          mode="client"
          data={props.periods}
          columns={props.columns}
          loading={props.isLoading}
          showSearch
          searchPlaceholder="Search filing periods"
          pageSizeOptions={[10, 20, 50]}
        />
      </CardContent>
    </Card>
  );
}
