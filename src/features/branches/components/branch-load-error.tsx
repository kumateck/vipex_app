import { Button } from '@/components/ui/button';

interface BranchLoadErrorProps {
  message?: string;
  onBack: () => void;
}

export function BranchLoadError({ message = 'Failed to load branch', onBack }: BranchLoadErrorProps) {
  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-4">
      <p className="text-destructive">{message}</p>
      <Button variant="outline" onClick={onBack}>
        Back to list
      </Button>
    </div>
  );
}
