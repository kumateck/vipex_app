import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { TaxDataRow } from '../types';
import { mergeTaxDataSelection, sumTaxDataRows } from '../utils';
const EMPTY_ROWS: TaxDataRow[] = [];

export function useTaxDataSelection(viewerKey: string) {
  const [basket, setBasket] = useState<{ owner: string; rows: TaxDataRow[] }>({
    owner: viewerKey,
    rows: [],
  });
  const rows = basket.owner === viewerKey ? basket.rows : EMPTY_ROWS;
  const versions = useMemo(() => new Map(rows.map((row) => [row.parcelId, row.version])), [rows]);
  const totals = useMemo(() => sumTaxDataRows(rows), [rows]);
  const add = useCallback(
    (incoming: TaxDataRow[]) => {
      try {
        setBasket({ owner: viewerKey, rows: mergeTaxDataSelection(rows, incoming) });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not add records');
      }
    },
    [rows, viewerKey],
  );
  const remove = useCallback(
    (id: string) =>
      setBasket((current) => ({
        owner: viewerKey,
        rows: current.owner === viewerKey ? current.rows.filter((row) => row.parcelId !== id) : [],
      })),
    [viewerKey],
  );
  const clear = useCallback(() => setBasket({ owner: viewerKey, rows: [] }), [viewerKey]);
  const replace = useCallback(
    (next: TaxDataRow[]) => setBasket({ owner: viewerKey, rows: next }),
    [viewerKey],
  );
  return { rows, versions, totals, add, remove, clear, replace };
}
