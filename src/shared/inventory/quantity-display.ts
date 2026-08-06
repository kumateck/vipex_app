import { UnitOfMeasure } from '@/db/schemas/enums';
import { getBestUnitBreakdown, type UnitConversion } from './unit-conversion';

const unitLabelByValue = new Map<number, string>([
  [UnitOfMeasure.PIECE, 'piece'],
  [UnitOfMeasure.BOX, 'box'],
  [UnitOfMeasure.CARTON, 'carton'],
  [UnitOfMeasure.KG, 'kg'],
  [UnitOfMeasure.LITER, 'liter'],
  [UnitOfMeasure.METER, 'meter'],
  [UnitOfMeasure.PACK, 'pack'],
  [UnitOfMeasure.DOZEN, 'dozen'],
]);

export function formatBaseQuantityWithBestUnits(
  quantityInBaseUnits: string | number,
  conversions: UnitConversion[] | undefined,
): string {
  const quantity =
    typeof quantityInBaseUnits === 'string'
      ? Number.parseInt(quantityInBaseUnits, 10)
      : Math.floor(quantityInBaseUnits);

  if (!Number.isFinite(quantity)) return String(quantityInBaseUnits);

  const safeConversions = conversions?.length
    ? conversions
    : [{ unitOfMeasure: UnitOfMeasure.PIECE, factorToBase: 1 }];
  const breakdown = getBestUnitBreakdown(quantity, safeConversions);
  if (!breakdown.length) return '0';

  return breakdown
    .map(
      (item) =>
        `${item.quantity} ${unitLabelByValue.get(item.unitOfMeasure) ?? `uom-${item.unitOfMeasure}`}`,
    )
    .join(' ');
}
