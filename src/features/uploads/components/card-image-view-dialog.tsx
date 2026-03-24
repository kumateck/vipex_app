import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type CardImageViewDialogProps = {
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  title?: string;
  description?: string;
  frontLabel?: string;
  backLabel?: string;
  triggerLabel?: string;
  trigger?: ReactNode;
};

function CardImagePanel({ label, imageUrl }: { label: string; imageUrl?: string | null }) {
  if (!imageUrl) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex h-56 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
          No image available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <a
          href={imageUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary underline-offset-4 hover:underline"
        >
          Open full image
        </a>
      </div>
      <img
        src={imageUrl}
        alt={label}
        className="h-56 w-full rounded-md border bg-muted object-contain"
      />
    </div>
  );
}

export function CardImageViewDialog({
  frontImageUrl,
  backImageUrl,
  title = 'Card Images',
  description = 'Front and back card images.',
  frontLabel = 'Front',
  backLabel = 'Back',
  triggerLabel = 'View Card',
  trigger,
}: CardImageViewDialogProps) {
  const hasAnyImage = Boolean(frontImageUrl || backImageUrl);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm" variant="outline" disabled={!hasAnyImage}>
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <CardImagePanel label={frontLabel} imageUrl={frontImageUrl} />
          <CardImagePanel label={backLabel} imageUrl={backImageUrl} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
