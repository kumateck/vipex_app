import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MaintenanceScript } from '../../types';

export const ScriptList = memo(function ScriptList({
  scripts,
  selectedId,
  disabled,
  onSelect,
}: {
  scripts: MaintenanceScript[];
  selectedId?: string;
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Maintenance scripts"
      className="max-h-80 space-y-1 overflow-y-auto pr-1 lg:max-h-[calc(100dvh-17rem)]"
    >
      {scripts.map((script) => (
        <button
          key={script.id}
          type="button"
          disabled={disabled}
          aria-current={selectedId === script.id ? 'true' : undefined}
          onClick={() => onSelect(script.id)}
          className={cn(
            'w-full rounded-lg p-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
            selectedId === script.id && 'bg-accent text-accent-foreground',
          )}
        >
          <span className="flex flex-wrap items-start justify-between gap-2">
            <span className="text-sm font-medium">{script.title}</span>
            <Badge variant="outline" className="shrink-0 text-xs">
              {script.kind === 'repair' ? 'Repair' : 'Read only'}
            </Badge>
          </span>
          <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
            {script.description}
          </span>
        </button>
      ))}
    </nav>
  );
});
