import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useGetStockAllocationPolicyQuery } from '@/features/inventory/api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function strategyLabel(strategy: number) {
  if (strategy === 0) return 'FEFO';
  if (strategy === 1) return 'Oldest Receipt';
  if (strategy === 2) return 'Highest Available';
  return 'Unknown';
}

export function StockAllocationPolicyPage() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useGetStockAllocationPolicyQuery(
    { companyId: user?.company?.id ?? '' },
    { skip: !user?.company?.id },
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Stock Allocation Policy</CardTitle>
            <Button asChild>
              <Link to="/inventory/stock-allocation-policy/edit">Edit policy</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading policy...</p>
            ) : data ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p>
                  <strong>Strategy:</strong> {strategyLabel(data.strategy)}
                </p>
                <p>
                  <strong>Allow Partial:</strong> {data.allowPartial ? 'Yes' : 'No'}
                </p>
                <p>
                  <strong>Prioritize Same Branch:</strong>{' '}
                  {data.prioritizeSameBranch ? 'Yes' : 'No'}
                </p>
                <p>
                  <strong>Max Source Locations:</strong> {data.maxSourceLocations}
                </p>
                <p>
                  <strong>Active:</strong> {data.active ? 'Yes' : 'No'}
                </p>
              </div>
            ) : (
              <p>No policy configured.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
