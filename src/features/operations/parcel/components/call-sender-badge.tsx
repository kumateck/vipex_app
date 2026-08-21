import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function CallSenderBadge({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          className={cn(
            'gap-1 border-amber-500/60 bg-amber-500/15 text-amber-700 dark:text-amber-400',
            className,
          )}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
          </span>
          CS
        </Badge>
      </TooltipTrigger>
      <TooltipContent>Call the sender before this parcel is given to the receiver</TooltipContent>
    </Tooltip>
  );
}
