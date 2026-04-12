import { DataTable } from '@/components/datatable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { ColumnDef } from '@tanstack/react-table';
import { TaxFilingStatus } from '@/db/schemas/enums';
import type { TaxFilingPeriodRow, TaxJournalItemRow } from '../../../api';

export function TaxJournalItemsCard(props: {
  branchId: string;
  branchOptions: Array<{ id: string; name: string }>;
  filingPeriods: TaxFilingPeriodRow[];
  filingStatus: string;
  isLoadingItems: boolean;
  itemColumns: ColumnDef<TaxJournalItemRow>[];
  selectedPeriodId: string;
  setBranchId: (value: string) => void;
  setFilingStatus: (value: string) => void;
  setSelectedPeriodId: (value: string) => void;
  taxItems: TaxJournalItemRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Journal Items</CardTitle>
        <CardDescription>
          These items come from recorded taxable operations. Filing only changes review status and
          does not alter the underlying tax calculation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="tax-branch-filter">Branch</Label>
            <Select
              value={props.branchId || 'all'}
              onValueChange={(value) => props.setBranchId(value === 'all' ? '' : value)}
            >
              <SelectTrigger id="tax-branch-filter">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {props.branchOptions.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax-status-filter">Filing Status</Label>
            <Select value={props.filingStatus} onValueChange={props.setFilingStatus}>
              <SelectTrigger id="tax-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value={String(TaxFilingStatus.UNFILED)}>Unfiled</SelectItem>
                <SelectItem value={String(TaxFilingStatus.READY_FOR_FILING)}>Ready</SelectItem>
                <SelectItem value={String(TaxFilingStatus.FILED)}>Filed</SelectItem>
                <SelectItem value={String(TaxFilingStatus.EXCLUDED)}>Excluded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax-selected-period">Assign Ready Items To</Label>
            <Select
              value={props.selectedPeriodId || 'all'}
              onValueChange={(value) => props.setSelectedPeriodId(value === 'all' ? '' : value)}
            >
              <SelectTrigger id="tax-selected-period">
                <SelectValue placeholder="Choose a filing period first" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">No selected period</SelectItem>
                {props.filingPeriods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DataTable
          mode="client"
          data={props.taxItems}
          columns={props.itemColumns}
          loading={props.isLoadingItems}
          showSearch
          searchPlaceholder="Search tax journal items"
          pageSizeOptions={[10, 20, 50]}
        />
      </CardContent>
    </Card>
  );
}
