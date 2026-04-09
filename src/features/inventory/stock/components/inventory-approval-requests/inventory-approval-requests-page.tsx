import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useDecideInventoryApprovalRequestMutation,
  useEscalateOverdueInventoryApprovalRequestsMutation,
  useListInventoryApprovalRequestsQuery,
} from '@/features/inventory/api';
import { useAuthStore } from '@/stores/auth-store';

export function InventoryApprovalRequestsPage() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data = [], isLoading } = useListInventoryApprovalRequestsQuery(
    { companyId: companyId ?? '', status: statusFilter ? Number(statusFilter) : undefined },
    { skip: !companyId },
  );
  const [decide, { isLoading: isDeciding }] = useDecideInventoryApprovalRequestMutation();
  const [escalate, { isLoading: isEscalating }] =
    useEscalateOverdueInventoryApprovalRequestsMutation();

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Button asChild variant="outline">
            <Link to="/inventory/approval-policies">Approval Policies</Link>
          </Button>
          <Button
            variant="outline"
            disabled={!companyId || isEscalating}
            onClick={() => {
              if (!companyId) return;
              void escalate({ companyId });
            }}
          >
            Escalate Overdue
          </Button>
        </div>
        <div className="max-w-xs">
          <select
            className="h-9 w-full rounded border px-3"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="0">Pending</option>
            <option value="1">Approved</option>
            <option value="2">Rejected</option>
            <option value="3">Escalated</option>
          </select>
        </div>
        <div className="rounded border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2">Entity</th>
                <th className="text-left p-2">Amount</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Due</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="p-2">
                    {row.entityType} / {row.entityId}
                  </td>
                  <td className="p-2">{row.amount}</td>
                  <td className="p-2">{row.status}</td>
                  <td className="p-2">{row.dueAt ?? '-'}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isDeciding}
                        onClick={() => void decide({ id: row.id, body: { status: 1 } })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isDeciding}
                        onClick={() => void decide({ id: row.id, body: { status: 2 } })}
                      >
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !data.length ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={5}>
                    No approval requests found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </ScrollableWrapper>
  );
}
