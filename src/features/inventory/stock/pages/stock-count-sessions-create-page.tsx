import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect } from '@/components/ui/multi-select';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import { useCreateStockCountSessionMutation } from '@/features/inventory/api';
import { useAuthStore } from '@/stores/auth-store';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';

function locationTypeLabel(type: number) {
  if (type === 0) return 'Main Store';
  if (type === 1) return 'Branch Store';
  if (type === 2) return 'Consumption Location';
  return 'Unknown';
}

export function StockCountSessionsCreatePage() {
  const navigate = useNavigate();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const [locationId, setLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [productIds, setProductIds] = useState<string[]>([]);
  const [createSession, { isLoading }] = useCreateStockCountSessionMutation();
  const { data: locations = [], isLoading: isLoadingLocations } =
    useListInventoryLocationOptionsQuery({ companyId }, { skip: !companyId });
  const { data: products = [], isLoading: isLoadingProducts } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const locationOptions = useMemo<SearchableSelectOption[]>(
    () =>
      locations.map((location) => ({
        value: location.id,
        label: location.name,
        searchText: `${locationTypeLabel(location.locationType)} ${location.id}`,
      })),
    [locations],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!locationId.trim()) {
      toast.error('Location is required');
      return;
    }
    try {
      const result = await createSession({
        locationId: locationId.trim(),
        notes: notes.trim() || undefined,
        productIds: productIds.length ? productIds : undefined,
      }).unwrap();
      toast.success('Stock count session created');
      navigate(`/inventory/stock-count-sessions/view/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create session');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Create Stock Count Session</CardTitle>
            <Link className="underline text-sm" to="/inventory/stock-count-sessions">
              Back to sessions
            </Link>
          </CardHeader>
          <CardContent>
            <form className="space-y-4 max-w-xl" onSubmit={onSubmit}>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="locationId">
                  Location
                </label>
                <SearchableSelect
                  options={locationOptions}
                  value={locationId}
                  onValueChange={setLocationId}
                  placeholder={isLoadingLocations ? 'Loading locations...' : 'Select location'}
                  searchPlaceholder="Search location"
                  emptyMessage="No inventory locations found."
                  isLoading={isLoadingLocations}
                  disabled={isLoading || !companyId}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Scope Products (Optional)</label>
                <MultiSelect
                  options={products}
                  value={productIds}
                  onValueChange={setProductIds}
                  getLabel={(option) => `${option.name} (${option.sku})`}
                  getValue={(option) => option.id}
                  placeholder={
                    isLoadingProducts ? 'Loading products...' : 'Select specific products'
                  }
                  searchPlaceholder="Search product"
                  emptyMessage="No products found."
                  disabled={isLoading || isLoadingProducts || !companyId}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to generate lines for all products currently stocked at this location.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="notes">
                  Notes
                </label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Session'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/inventory/stock-count-sessions')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
