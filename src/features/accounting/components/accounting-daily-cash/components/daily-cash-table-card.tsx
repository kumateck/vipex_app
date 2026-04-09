import { DataTable } from '@/components/datatable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ColumnDef } from '@tanstack/react-table';
import type { DailyCashConfirmationRow } from '../../../api';
import type { DailyCashPageView } from '../types/accounting-daily-cash.types';

export function DailyCashTableCard(props: {
  columns: ColumnDef<DailyCashConfirmationRow>[];
  isFetching: boolean;
  rows: DailyCashConfirmationRow[];
  view: DailyCashPageView;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {props.view === 'recorded'
            ? 'Recorded Confirmations'
            : props.view === 'approvals'
              ? 'Approval Queue'
              : 'Draft Confirmations'}
        </CardTitle>
        <CardDescription>
          {props.view === 'recorded'
            ? 'Confirmed rows can be posted into the ledger; posted rows remain as audit records.'
            : 'Draft rows can be confirmed before they become eligible for posting.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          mode="client"
          data={props.rows}
          columns={props.columns}
          loading={props.isFetching}
          searchPlaceholder="Search daily cash confirmations"
          showSearch
          pageSizeOptions={[10, 20, 50]}
        />
      </CardContent>
    </Card>
  );
}
