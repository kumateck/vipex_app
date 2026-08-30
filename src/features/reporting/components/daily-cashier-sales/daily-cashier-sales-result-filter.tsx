import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { DailyCashierSalesModuleFilter } from './daily-cashier-sales-types';
import { CASHIER_MODULE_LABELS } from './daily-cashier-sales-module-filter';

export function DailyCashierSalesResultFilter(props: {
  value: DailyCashierSalesModuleFilter;
  onChange: (value: DailyCashierSalesModuleFilter) => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-medium">Loaded Report Breakdown</p>
          <p className="text-sm text-muted-foreground">
            Narrow the loaded report without loading it again. To Be Paid rows belong to Sender.
          </p>
        </div>
        <div className="w-full space-y-2 md:w-64">
          <Label htmlFor="daily-cashier-sales-module-filter">Cashier Module</Label>
          <Select
            value={props.value}
            onValueChange={(value) => props.onChange(value as DailyCashierSalesModuleFilter)}
          >
            <SelectTrigger id="daily-cashier-sales-module-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CASHIER_MODULE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
