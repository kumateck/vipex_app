import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Spinner } from '@/components/ui/spinner';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import {
  useListInventoryReorderPoliciesQuery,
  useListReorderSuggestionsQuery,
} from '@/features/inventory/api';
import { useAuthStore } from '@/stores/auth-store';
import { formatDateTime as formatDateTimeShared } from '@/lib/dates';
import { ReorderPolicyForm } from './reorder-policy-form';
import { ReorderSuggestionsTable } from './reorder-suggestions-table';

function locationTypeLabel(type: number) {
  if (type === 0) return 'Main Store';
  if (type === 1) return 'Branch Store';
  if (type === 2) return 'Consumption Location';
  return 'Unknown';
}

export function InventoryReorderSuggestionsPage() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const [locationId, setLocationId] = useState<string>('all');

  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );

  const queryArg = useMemo(
    () =>
      companyId
        ? {
            companyId,
            locationId: locationId === 'all' ? null : locationId,
          }
        : undefined,
    [companyId, locationId],
  );

  const {
    data,
    isLoading,
    refetch: refetchSuggestions,
  } = useListReorderSuggestionsQuery(queryArg, {
    skip: !queryArg,
    refetchOnMountOrArgChange: true,
  });

  const {
    data: policies = [],
    isLoading: isLoadingPolicies,
    refetch: refetchPolicies,
  } = useListInventoryReorderPoliciesQuery(companyId ? { companyId } : undefined, {
    skip: !companyId,
    refetchOnMountOrArgChange: true,
  });

  const handlePolicySaved = () => {
    void refetchPolicies();
    void refetchSuggestions();
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Reorder Suggestions</CardTitle>
            <Button asChild variant="outline">
              <Link to="/inventory">Back to inventory dashboard</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-sm">
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isLoading ? (
              <Spinner />
            ) : (
              <div className="text-sm text-muted-foreground">
                {data?.totalRows ?? 0} suggestions generated
                {data?.generatedAt ? ` at ${formatDateTimeShared(data.generatedAt)}` : ''}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reorder Policy Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReorderPolicyForm onSaved={handlePolicySaved} />
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Product</th>
                    <th className="text-left py-2 pr-4">Branch</th>
                    <th className="text-left py-2 pr-4">Location type</th>
                    <th className="text-left py-2 pr-4">Location override</th>
                    <th className="text-left py-2 pr-4">Reorder point</th>
                    <th className="text-left py-2 pr-4">Target</th>
                    <th className="text-left py-2 pr-4">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy) => (
                    <tr key={policy.id} className="border-b">
                      <td className="py-2 pr-4">{policy.productName || policy.productId}</td>
                      <td className="py-2 pr-4">{policy.branchName || policy.branchId}</td>
                      <td className="py-2 pr-4">{locationTypeLabel(policy.locationType)}</td>
                      <td className="py-2 pr-4">{policy.locationName || 'Branch+type default'}</td>
                      <td className="py-2 pr-4">{policy.reorderPoint}</td>
                      <td className="py-2 pr-4">{policy.targetLevel}</td>
                      <td className="py-2 pr-4">{policy.active ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                  {!isLoadingPolicies && !policies.length ? (
                    <tr>
                      <td className="py-3 text-muted-foreground" colSpan={7}>
                        No reorder policies yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suggested Replenishments</CardTitle>
          </CardHeader>
          <CardContent>
            <ReorderSuggestionsTable rows={data?.rows ?? []} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
