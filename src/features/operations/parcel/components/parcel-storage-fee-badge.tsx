import { Badge } from '@/components/ui/badge';

type ParcelStorageFeeBadgeProps = {
  storageChargePsw?: number | null;
};

export function ParcelStorageFeeBadge({ storageChargePsw }: ParcelStorageFeeBadgeProps) {
  const amountPsw = Number(storageChargePsw ?? 0);
  if (amountPsw <= 0) return null;

  return (
    <Badge variant="outline" className="border-amber-500 text-amber-700">
      Storage fee · GHS {(amountPsw / 100).toFixed(2)}
    </Badge>
  );
}
