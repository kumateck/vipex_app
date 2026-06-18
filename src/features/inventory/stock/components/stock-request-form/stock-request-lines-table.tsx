import { Plus, Trash2 } from 'lucide-react';
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFieldArrayAppend,
} from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Textarea } from '@/components/ui/textarea';
import type { InventoryProductOption } from '@/features/inventory/products/api/inventory-products.api';
import { UNIT_OF_MEASURE_OPTIONS } from '@/features/inventory/products/components/inventory-product-columns';
import type { CreateStockRequestFormValues } from '../../schemas/stock-forms.schema';

type StockRequestLinesTableProps = {
  control: Control<CreateStockRequestFormValues>;
  errors: FieldErrors<CreateStockRequestFormValues>;
  fields: Array<{ id: string }>;
  lineValues: CreateStockRequestFormValues['lines'];
  products: InventoryProductOption[];
  productById: ReadonlyMap<string, InventoryProductOption>;
  isLoadingProducts: boolean;
  append: UseFieldArrayAppend<CreateStockRequestFormValues, 'lines'>;
  remove: (index: number) => void;
};

export function StockRequestLinesTable({
  control,
  errors,
  fields,
  lineValues,
  products,
  productById,
  isLoadingProducts,
  append,
  remove,
}: StockRequestLinesTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FieldLabel>Request lines</FieldLabel>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              productId: '',
              quantityUnitOfMeasure: 0,
              requestedQuantity: '',
              notes: '',
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add line
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 min-w-[260px]">Product</th>
              <th className="text-left p-3 min-w-[160px]">Quantity</th>
              <th className="text-left p-3 min-w-[180px]">Unit</th>
              <th className="text-left p-3 min-w-[260px]">Line notes</th>
              <th className="text-left p-3 w-[80px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const selectedProductId = lineValues?.[index]?.productId ?? '';
              const selectedProduct = productById.get(selectedProductId);
              const unitOptions = (
                selectedProduct?.unitConversions ?? [
                  {
                    unitOfMeasure: selectedProduct?.unitOfMeasure ?? 0,
                    factorToBase: '1',
                  },
                ]
              )
                .map((item) =>
                  UNIT_OF_MEASURE_OPTIONS.find((option) => option.value === item.unitOfMeasure),
                )
                .filter((item): item is (typeof UNIT_OF_MEASURE_OPTIONS)[number] => Boolean(item));

              return (
                <tr key={field.id} className="border-b align-top last:border-b-0">
                  <td className="p-3 space-y-1">
                    <Controller
                      control={control}
                      name={`lines.${index}.productId`}
                      render={({ field: lineField }) => (
                        <SearchableSelect
                          options={products.map((product) => ({
                            value: product.id,
                            label: product.name,
                            searchText: `${product.name} ${product.sku}`,
                          }))}
                          value={lineField.value ?? ''}
                          onValueChange={lineField.onChange}
                          placeholder={isLoadingProducts ? 'Loading products...' : 'Select product'}
                          disabled={isLoadingProducts}
                          isLoading={isLoadingProducts}
                        />
                      )}
                    />
                    {errors.lines?.[index]?.productId?.message ? (
                      <p className="text-sm text-destructive">
                        {errors.lines[index]?.productId?.message}
                      </p>
                    ) : null}
                  </td>

                  <td className="p-3 space-y-1">
                    <Controller
                      control={control}
                      name={`lines.${index}.requestedQuantity`}
                      render={({ field: lineField }) => (
                        <Input
                          placeholder="e.g. 10"
                          value={lineField.value ?? ''}
                          onChange={lineField.onChange}
                        />
                      )}
                    />
                    {errors.lines?.[index]?.requestedQuantity?.message ? (
                      <p className="text-sm text-destructive">
                        {errors.lines[index]?.requestedQuantity?.message}
                      </p>
                    ) : null}
                  </td>

                  <td className="p-3">
                    <Controller
                      control={control}
                      name={`lines.${index}.quantityUnitOfMeasure`}
                      render={({ field: lineField }) => (
                        <Select
                          value={String(lineField.value ?? selectedProduct?.unitOfMeasure ?? 0)}
                          onValueChange={(value) => lineField.onChange(Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {unitOptions.map((option) => (
                              <SelectItem key={option.value} value={String(option.value)}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </td>

                  <td className="p-3">
                    <Controller
                      control={control}
                      name={`lines.${index}.notes`}
                      render={({ field: lineField }) => (
                        <Textarea
                          placeholder="Optional"
                          value={lineField.value ?? ''}
                          onChange={lineField.onChange}
                        />
                      )}
                    />
                  </td>

                  <td className="p-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
