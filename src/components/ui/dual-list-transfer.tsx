import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type DualListTransferItem = {
  id: string;
  label: string;
  subLabel?: string;
};

type DualListTransferProps = {
  items: DualListTransferItem[];
  selectedIds: string[];
  onSelectedIdsChange: (nextIds: string[]) => void;
  leftTitle?: string;
  rightTitle?: string;
  disabled?: boolean;
  className?: string;
};

export function DualListTransfer({
  items,
  selectedIds,
  onSelectedIdsChange,
  leftTitle = 'Not In',
  rightTitle = 'In',
  disabled = false,
  className,
}: DualListTransferProps) {
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const leftItems = useMemo(
    () => items.filter((item) => !selectedSet.has(item.id)),
    [items, selectedSet],
  );
  const rightItems = useMemo(
    () => items.filter((item) => selectedSet.has(item.id)),
    [items, selectedSet],
  );

  const [activeLeftIds, setActiveLeftIds] = useState<string[]>([]);
  const [activeRightIds, setActiveRightIds] = useState<string[]>([]);

  const moveRight = () => {
    if (!activeLeftIds.length) return;
    const nextSet = new Set(selectedIds);
    for (const id of activeLeftIds) nextSet.add(id);
    onSelectedIdsChange([...nextSet]);
    setActiveLeftIds([]);
  };

  const moveLeft = () => {
    if (!activeRightIds.length) return;
    const removeSet = new Set(activeRightIds);
    onSelectedIdsChange(selectedIds.filter((id) => !removeSet.has(id)));
    setActiveRightIds([]);
  };

  const toggle = (id: string, side: 'left' | 'right') => {
    if (side === 'left') {
      setActiveLeftIds((prev) =>
        prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
      );
      return;
    }
    setActiveRightIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const renderList = (
    list: DualListTransferItem[],
    activeIds: string[],
    side: 'left' | 'right',
  ) => (
    <div className="space-y-2 rounded-md border p-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {side === 'left' ? leftTitle : rightTitle}
      </div>
      <div className="max-h-72 space-y-1 overflow-y-auto">
        {list.length ? (
          list.map((item) => {
            const isActive = activeIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id, side)}
                disabled={disabled}
                className={cn(
                  'w-full rounded-md border px-2 py-1.5 text-left transition-colors',
                  isActive
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-transparent bg-muted/20 hover:border-border hover:bg-muted/50',
                  disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                )}
              >
                <div className="truncate text-sm font-medium">{item.label}</div>
                {item.subLabel ? (
                  <div className="truncate text-xs text-muted-foreground">{item.subLabel}</div>
                ) : null}
              </button>
            );
          })
        ) : (
          <p className="px-1 py-2 text-xs text-muted-foreground">No users</p>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn('grid grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] gap-3', className)}>
      {renderList(leftItems, activeLeftIds, 'left')}

      <div className="flex flex-col items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={moveRight}
          disabled={disabled || !activeLeftIds.length}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={moveLeft}
          disabled={disabled || !activeRightIds.length}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {renderList(rightItems, activeRightIds, 'right')}
    </div>
  );
}
