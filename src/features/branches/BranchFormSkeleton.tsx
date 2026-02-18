import { Skeleton } from '@/components/ui/skeleton';

export function BranchFormSkeleton() {
  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
