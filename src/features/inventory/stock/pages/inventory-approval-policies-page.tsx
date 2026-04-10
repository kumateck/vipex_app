import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useListInventoryApprovalPoliciesQuery } from '@/features/inventory/api';
import { useAuthStore } from '@/stores/auth-store';

export function InventoryApprovalPoliciesPage() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const { data = [], isLoading } = useListInventoryApprovalPoliciesQuery(
    { companyId: companyId ?? '' },
    { skip: !companyId },
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <div className="flex justify-end gap-2">
          <Button asChild variant="outline">
            <Link to="/inventory/approval-requests">Approval Requests</Link>
          </Button>
          <Button asChild>
            <Link to="/inventory/approval-policies/new">New Approval Policy</Link>
          </Button>
        </div>
        <div className="rounded border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2">Entity Type</th>
                <th className="text-left p-2">Amount Range</th>
                <th className="text-left p-2">SLA (hrs)</th>
                <th className="text-left p-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="p-2">{row.entityType}</td>
                  <td className="p-2">
                    {row.minAmount} - {row.maxAmount ?? 'No upper limit'}
                  </td>
                  <td className="p-2">{row.slaHours}</td>
                  <td className="p-2">{row.active ? 'Yes' : 'No'}</td>
                </tr>
              ))}
              {!isLoading && !data.length ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={4}>
                    No approval policies yet.
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
