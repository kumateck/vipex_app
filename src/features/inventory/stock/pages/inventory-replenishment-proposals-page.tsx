import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useListReplenishmentProposalsQuery } from '@/features/inventory/api';
import { useAuthStore } from '@/stores/auth-store';

export function InventoryReplenishmentProposalsPage() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const { data = [], isLoading } = useListReplenishmentProposalsQuery(
    { companyId: companyId ?? '' },
    { skip: !companyId },
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <div className="flex justify-end">
          <Button asChild>
            <Link to="/inventory/replenishment-proposals/new">Generate Proposal</Link>
          </Button>
        </div>
        <div className="rounded border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2">Proposal No</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Generated At</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="p-2">{row.proposalNo}</td>
                  <td className="p-2">{row.status}</td>
                  <td className="p-2">{row.generatedAt ?? '-'}</td>
                  <td className="p-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/inventory/replenishment-proposals/view/${row.id}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {!isLoading && !data.length ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={4}>
                    No proposals generated yet.
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
