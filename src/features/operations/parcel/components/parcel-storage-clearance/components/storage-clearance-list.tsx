import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useStorageClearanceList } from '../hooks';
import {
  StorageClearanceActionDialog,
  StorageClearanceResubmitDialog,
  StorageClearanceDetailDialog,
} from '../dialogs';
import { STORAGE_CLEARANCE_STATUS_OPTIONS } from '../constants';
import type { StorageClearanceMode } from '../types';
import { ParcelStorageClearanceTable } from './parcel-storage-clearance-table';
const LABELS = {
  history: 'Storage Fee Clearance Requests',
  approvals: 'Storage Clearance Approvals',
  execution: 'Finance Storage Clearance Execution',
};
export function StorageClearanceList({ mode }: { mode: StorageClearanceMode }) {
  const state = useStorageClearanceList(mode);
  const rows = state.result.data?.data ?? [];
  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{LABELS[mode]}</CardTitle>
              <CardDescription>
                {mode === 'history'
                  ? 'View status, evidence and history. Review returned requests and resubmit for approval.'
                  : mode === 'approvals'
                    ? 'Review submitted requests and approve or reject them.'
                    : 'Review current accrual, execute approved clearances, return for review, or reject.'}
              </CardDescription>
            </div>
            {mode === 'history' && state.canRequest ? (
              <Button asChild>
                <Link to="/parcels/storage-clearances/new">Create Clearance</Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              className="flex-1"
              aria-label="Search requests"
              placeholder="Search booking, tracking, telephone, or reason"
              value={state.search}
              onChange={(event) => state.setSearch(event.target.value)}
            />
            {mode === 'history' ? (
              <select
                aria-label="Request status"
                className="rounded-md border px-3"
                value={state.status}
                onChange={(event) => state.setStatus(event.target.value)}
              >
                <option value="all">All statuses</option>
                {STORAGE_CLEARANCE_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          {state.result.isError ? (
            <p role="alert" className="text-destructive">
              Could not load requests.{' '}
              <Button variant="outline" onClick={() => void state.result.refetch()}>
                Retry
              </Button>
            </p>
          ) : null}
          <ParcelStorageClearanceTable
            rows={rows}
            loading={state.result.isFetching}
            canApprove={mode === 'approvals'}
            canExecute={mode === 'execution'}
            requesterId={state.user?.id}
            onSelect={state.showDetails}
            onResubmit={state.canRequest ? state.review : undefined}
            onApprove={(row) => state.openAction(row, 'approve')}
            onReject={(row) => state.openAction(row, 'reject')}
            onExecute={(row) => state.openAction(row, 'execute')}
            onReturn={(row) => state.openAction(row, 'return')}
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{state.result.data?.meta?.totalRecords ?? 0} requests</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={state.page <= 1 || state.result.isFetching}
                onClick={() => state.setPage(state.page - 1)}
              >
                Previous
              </Button>
              <span className="self-center">Page {state.page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={!state.result.data?.meta?.hasNextPage || state.result.isFetching}
                onClick={() => state.setPage(state.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {state.action ? (
        <StorageClearanceActionDialog
          key={state.action.row.id + state.action.mode}
          row={state.action.row}
          mode={state.action.mode}
          onClose={state.closeAction}
        />
      ) : null}
      {state.resubmitRow ? (
        <StorageClearanceResubmitDialog
          key={state.resubmitRow.id}
          row={state.resubmitRow}
          onClose={state.closeReview}
        />
      ) : null}
      {state.detailRow ? (
        <StorageClearanceDetailDialog row={state.detailRow} onClose={state.closeDetails} />
      ) : null}
    </div>
  );
}
