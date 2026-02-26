import { Button } from '@/components/ui/button';

interface InventoryCategoryLoadErrorProps {
  message?: string;
  onBack: () => void;
}

export function InventoryCategoryLoadError({
  message = 'Failed to load product category',
  onBack,
}: InventoryCategoryLoadErrorProps) {
  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-4">
      <p className="text-destructive">{message}</p>
      <Button variant="outline" onClick={onBack}>
        Back to list
      </Button>
    </div>
  );
}
