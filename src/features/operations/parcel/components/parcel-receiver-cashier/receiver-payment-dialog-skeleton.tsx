import { Skeleton } from '@/components/ui/skeleton';

function SkeletonPanel({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-md border p-3">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function ReceiverPaymentDialogSkeleton() {
  return (
    <div
      className="grid gap-6 md:grid-cols-2"
      role="status"
      aria-label="Loading receiver payment details"
    >
      <span className="sr-only">Loading receiver payment details</span>
      <div className="space-y-4">
        <SkeletonPanel rows={4} />
        <div className="space-y-3 py-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-5 w-72 max-w-full" />
          <Skeleton className="h-5 w-48" />
        </div>
        <SkeletonPanel rows={4} />
        <SkeletonPanel rows={1} />
      </div>
      <div className="space-y-4">
        <SkeletonPanel rows={2} />
        <SkeletonPanel rows={2} />
        <SkeletonPanel rows={1} />
        <SkeletonPanel rows={2} />
      </div>
    </div>
  );
}
