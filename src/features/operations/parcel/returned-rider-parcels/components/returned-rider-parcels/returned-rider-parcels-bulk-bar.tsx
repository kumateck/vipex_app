import { Button } from '@/components/ui/button';

type ReturnedRiderParcelsBulkBarProps = {
  count: number;
  riderUserId: string;
  isBusy: boolean;
  onBulkRedispatch: () => void;
  onClear: () => void;
};

export function ReturnedRiderParcelsBulkBar({
  count,
  riderUserId,
  isBusy,
  onBulkRedispatch,
  onClear,
}: ReturnedRiderParcelsBulkBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm">{count} parcel(s) selected</span>
      <Button size="sm" disabled={!riderUserId || isBusy} onClick={onBulkRedispatch}>
        {isBusy ? 'Redispatching...' : `Redispatch ${count} to rider`}
      </Button>
      <Button size="sm" variant="outline" disabled={isBusy} onClick={onClear}>
        Clear selection
      </Button>
      {riderUserId ? null : (
        <span className="text-xs text-muted-foreground">
          Select a rider above to bulk redispatch
        </span>
      )}
    </div>
  );
}
