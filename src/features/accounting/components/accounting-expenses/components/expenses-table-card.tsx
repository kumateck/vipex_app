import { DataTable } from '@/components/datatable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ColumnDef } from '@tanstack/react-table';
import type { ExpenseRequestRow } from '../../../api';
import type { ExpensesPageView } from '../types/accounting-expenses.types';

export function ExpensesTableCard(props: {
  columns: ColumnDef<ExpenseRequestRow>[];
  isFetching: boolean;
  pageDescription: string;
  pageTitle: string;
  rows: ExpenseRequestRow[];
  view: ExpensesPageView;
}) {
  if (props.view === 'main') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Workflow Pages</CardTitle>
          <CardDescription>
            Expense stages are now split into standalone pages for faster processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Navigate to `Expenses / Drafts`, `Expenses / Approvals`, `Expenses / Payments`,
            `Expenses / Posting`, and `Expenses / History` from the Accounting menu.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.pageTitle}</CardTitle>
        <CardDescription>{props.pageDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          mode="client"
          data={props.rows}
          columns={props.columns}
          loading={props.isFetching}
          showSearch
          searchPlaceholder="Search expense requests"
          pageSizeOptions={[10, 20, 50]}
        />
      </CardContent>
    </Card>
  );
}
