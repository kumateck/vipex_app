import { Link } from 'react-router-dom';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useListProcurementFleetPoliciesQuery } from '../api/procurement.api';

function urgencyLabel(value: number) {
  if (value === 0) return 'Low';
  if (value === 1) return 'Normal';
  if (value === 2) return 'High';
  if (value === 3) return 'Critical';
  return 'Unknown';
}

export function ProcurementFleetPoliciesListPage() {
  const { data = [], isLoading } = useListProcurementFleetPoliciesQuery();

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Fleet Procurement Policy Rules</CardTitle>
            <Button asChild>
              <Link to="/procurement/fleet-policies/new">Create policy rule</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading policy rules...</p>
            ) : null}
            {!isLoading && data.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No fleet procurement policy rules yet.
              </p>
            ) : null}
            {data.map((row) => (
              <div key={row.id} className="rounded border p-3 text-sm">
                <p className="font-medium">
                  Scope: {row.branchId ? `Branch ${row.branchId}` : 'Global'}
                </p>
                <p className="text-muted-foreground">
                  Preferred supplier:{' '}
                  {row.preferredSupplierName ?? row.preferredSupplierId ?? 'None'}
                </p>
                <p className="text-muted-foreground">
                  Urgency: {urgencyLabel(row.demandUrgency)} | Replenish multiplier:{' '}
                  {row.replenishMultiplier} | {row.isActive ? 'Active' : 'Inactive'}
                </p>
                {row.note ? <p className="text-muted-foreground">Note: {row.note}</p> : null}
                <div className="mt-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/procurement/fleet-policies/edit/${row.id}`}>Edit</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
