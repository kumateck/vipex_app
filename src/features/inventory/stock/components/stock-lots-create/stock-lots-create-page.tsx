import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { useCreateStockLotMutation } from '@/features/inventory/api';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAuthStore } from '@/stores/auth-store';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { UNIT_OF_MEASURE_OPTIONS } from '@/features/inventory/products/components/inventory-product-columns';
import { convertToBaseUnits } from '@/shared/inventory/unit-conversion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';

export function StockLotsCreatePage() {
  const navigate = useNavigate();
  const [createStockLot, { isLoading }] = useCreateStockLotMutation();
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const { data: products = [], isLoading: isLoadingProducts } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: locations = [], isLoading: isLoadingLocations } =
    useListInventoryLocationOptionsQuery({ companyId }, { skip: !companyId });
  const [productId, setProductId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [quantityOnHand, setQuantityOnHand] = useState('');
  const [quantityUnitOfMeasure, setQuantityUnitOfMeasure] = useState(0);
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.id,
        label: `${product.name} (${product.sku})`,
      })),
    [products],
  );
  const locationOptions = useMemo(
    () =>
      locations.map((location) => ({
        value: location.id,
        label: location.name,
      })),
    [locations],
  );
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId),
    [products, productId],
  );
  const quantityUnitOptions = useMemo(() => {
    if (!selectedProduct) return UNIT_OF_MEASURE_OPTIONS;
    const conversions = selectedProduct.unitConversions ?? [
      { unitOfMeasure: selectedProduct.unitOfMeasure, factorToBase: '1' },
    ];
    return [...conversions]
      .sort((a, b) => Number.parseInt(a.factorToBase, 10) - Number.parseInt(b.factorToBase, 10))
      .map((item) => UNIT_OF_MEASURE_OPTIONS.find((option) => option.value === item.unitOfMeasure))
      .filter((item): item is (typeof UNIT_OF_MEASURE_OPTIONS)[number] => Boolean(item));
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) return;
    setQuantityUnitOfMeasure(selectedProduct.unitOfMeasure);
  }, [selectedProduct]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!productId) {
      toast.error('Please select a product');
      return;
    }
    if (!locationId) {
      toast.error('Please select a location');
      return;
    }
    const enteredQuantity = Number.parseFloat(quantityOnHand);
    if (!Number.isFinite(enteredQuantity) || enteredQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const conversions = selectedProduct?.unitConversions ?? [
      { unitOfMeasure: selectedProduct?.unitOfMeasure ?? 0, factorToBase: '1' },
    ];
    const conversionRows = conversions.map((item) => ({
      unitOfMeasure: item.unitOfMeasure,
      factorToBase: Number.parseInt(item.factorToBase, 10),
    }));
    const baseQuantity = convertToBaseUnits(
      enteredQuantity,
      quantityUnitOfMeasure ?? selectedProduct?.unitOfMeasure ?? 0,
      conversionRows,
    );

    try {
      const result = await createStockLot({
        productId,
        locationId,
        batchNumber,
        quantityOnHand: String(baseQuantity),
        expiryDate: expiryDate ? new Date(`${expiryDate}T00:00:00.000Z`).toISOString() : undefined,
        notes: notes || undefined,
      }).unwrap();
      toast.success('Stock lot saved');
      navigate(`/inventory/stock-lots/view/${result.id}`);
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to save stock lot');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Create Stock Lot</CardTitle>
            <Link className="underline text-sm" to="/inventory/stock-lots">
              Back to lots
            </Link>
          </CardHeader>
          <CardContent>
            <form className="space-y-4 max-w-xl" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="productId">Product</Label>
                <SearchableSelect
                  value={productId}
                  onValueChange={setProductId}
                  options={productOptions}
                  isLoading={isLoadingProducts}
                  disabled={isLoading || isLoadingProducts || !companyId}
                  placeholder={isLoadingProducts ? 'Loading products...' : 'Select product'}
                  searchPlaceholder="Search product..."
                  emptyMessage="No products found."
                />
                <input
                  value={productId}
                  onChange={() => undefined}
                  className="sr-only"
                  required
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationId">Location</Label>
                <SearchableSelect
                  value={locationId}
                  onValueChange={setLocationId}
                  options={locationOptions}
                  isLoading={isLoadingLocations}
                  disabled={isLoading || isLoadingLocations || !companyId}
                  placeholder={isLoadingLocations ? 'Loading locations...' : 'Select location'}
                  searchPlaceholder="Search location..."
                  emptyMessage="No locations found."
                />
                <input
                  value={locationId}
                  onChange={() => undefined}
                  className="sr-only"
                  required
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number</Label>
                <Input
                  id="batchNumber"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantityOnHand">Quantity</Label>
                <Input
                  id="quantityOnHand"
                  value={quantityOnHand}
                  onChange={(e) => setQuantityOnHand(e.target.value)}
                  inputMode="numeric"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantityUnitOfMeasure">Quantity Unit</Label>
                <Select
                  value={String(quantityUnitOfMeasure)}
                  onValueChange={(value) => setQuantityUnitOfMeasure(Number(value))}
                  disabled={isLoading || isLoadingProducts || !companyId || !selectedProduct}
                >
                  <SelectTrigger id="quantityUnitOfMeasure">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {quantityUnitOptions.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <DatePicker
                  date={expiryDate ? new Date(`${expiryDate}T00:00:00.000Z`) : undefined}
                  onDateChange={(date) =>
                    setExpiryDate(date ? date.toISOString().slice(0, 10) : '')
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button disabled={isLoading} type="submit">
                {isLoading ? 'Saving...' : 'Save lot'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
