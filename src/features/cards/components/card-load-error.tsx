import { Button } from '@/components/ui/button';

interface CardLoadErrorProps {
  message?: string;
  onBack: () => void;
}

export function CardLoadError({ message = 'Failed to load card', onBack }: CardLoadErrorProps) {
  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-4">
      <p className="text-destructive">{message}</p>
      <Button variant="outline" onClick={onBack}>
        Back to list
      </Button>
    </div>
  );
}
