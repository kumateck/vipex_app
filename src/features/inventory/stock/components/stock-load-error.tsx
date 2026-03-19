import { Button } from '@/components/ui/button';

interface StockLoadErrorProps {
  message?: string;
  onBack: () => void;
}

export function StockLoadError({ message = 'Failed to load stock data', onBack }: StockLoadErrorProps) {
  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-4">
      <p className="text-destructive">{message}</p>
      <Button variant="outline" onClick={onBack}>
        Back to list
      </Button>
    </div>
  );
}
