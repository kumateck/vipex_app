import { Button } from '@/components/ui/button';

interface InventoryLocationLoadErrorProps {
  message?: string;
  onBack: () => void;
}

export function InventoryLocationLoadError({
  message = 'Failed to load inventory location',
  onBack,
}: InventoryLocationLoadErrorProps) {
  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-4">
      <p className="text-destructive">{message}</p>
      <Button variant="outline" onClick={onBack}>
        Back to list
      </Button>
    </div>
  );
}
