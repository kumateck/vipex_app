import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { CompensationItemCalculationType, PayrollItemType } from '@/db/schemas/enums';
import type { EmployeeCompensationForm } from './hooks/use-employee-compensation-form';

export function CompensationItemsEditor({ form }: { form: EmployeeCompensationForm }) {
  const availableTypes =
    form.newItem.itemType === PayrollItemType.DEDUCTION ? form.deductions : form.earnings;
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="font-medium">Compensation items</div>
      <div className="grid gap-2 md:grid-cols-5">
        <Select
          value={String(form.newItem.itemType)}
          onValueChange={(value) =>
            form.setNewItem((item) => ({ ...item, itemType: Number(value), typeId: '' }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={String(PayrollItemType.EARNING)}>Earning</SelectItem>
            <SelectItem value={String(PayrollItemType.DEDUCTION)}>Deduction</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={form.newItem.typeId}
          onValueChange={(value) => form.setNewItem((item) => ({ ...item, typeId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select item" />
          </SelectTrigger>
          <SelectContent>
            {availableTypes.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.code} · {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(form.newItem.calculationType)}
          onValueChange={(value) =>
            form.setNewItem((item) => ({ ...item, calculationType: Number(value) }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={String(CompensationItemCalculationType.FIXED)}>
              Fixed amount
            </SelectItem>
            <SelectItem value={String(CompensationItemCalculationType.PERCENTAGE)}>
              Percentage
            </SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={form.newItem.amountPsw}
          onChange={(event) =>
            form.setNewItem((item) => ({ ...item, amountPsw: event.target.value }))
          }
          placeholder="Amount"
        />
        <Button
          type="button"
          variant="outline"
          disabled={!form.newItem.typeId || !form.newItem.amountPsw}
          onClick={form.addItem}
        >
          Add item
        </Button>
      </div>
      {form.items.map((item) => {
        const lookup = (
          item.itemType === PayrollItemType.DEDUCTION ? form.deductions : form.earnings
        ).find((type) => type.id === item.typeId);
        return (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <span>
              {lookup?.name ?? 'Item'} · {item.amountPsw}
              {item.calculationType === CompensationItemCalculationType.PERCENTAGE ? '%' : ' psw'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => form.removeItem(item.id)}
            >
              Remove
            </Button>
          </div>
        );
      })}
    </div>
  );
}
