import { Button } from '@/components/ui/button';

interface StatusLoadErrorProps {
  message?: string;
  onBack: () => void;
}

export function StatusLoadError({ message = 'Failed to load status', onBack }: StatusLoadErrorProps) {
  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-4">
      <p className="text-destructive">{message}</p>
      <Button variant="outline" onClick={onBack}>
        Back to list
      </Button>
    </div>
  );
}
