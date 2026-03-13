import { Skeleton } from '@/components/ui/skeleton';

export function InventoryLocationFormSkeleton() {
  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}
