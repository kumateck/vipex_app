import { useCallback, useState } from 'react';
import { format, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { BranchType } from '@/db/schemas/enums';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useAuthStore } from '@/stores/auth-store';
import {
  type SavedConsignmentPrintPayload,
  useLazyGetSavedConsignmentPrintPayloadQuery,
  useListPreviousConsignmentsQuery,
} from '../../../api/parcel.api';

const ALL_BRANCHES = '__all__';
const EMPTY_QUERY = { dateFrom: '', dateTo: '' };

function initialRange(): DateRange {
  const yesterday = subDays(new Date(), 1);
  return { from: yesterday, to: yesterday };
}

function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { message?: unknown } }).data;
    if (typeof data?.message === 'string') return data.message;
  }
  return 'Unable to load the consignment for printing';
}

export function usePreviousConsignments() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const isHeadOffice = user?.branch?.type === BranchType.HEADOFFICE;
  const [range, setRange] = useState<DateRange | undefined>(initialRange);
  const [sourceId, setSourceId] = useState(ALL_BRANCHES);
  const [appliedQuery, setAppliedQuery] = useState<typeof EMPTY_QUERY & { sourceId?: string }>();
  const [printPayload, setPrintPayload] = useState<SavedConsignmentPrintPayload | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const { data: branches = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId || !isHeadOffice },
  );
  const history = useListPreviousConsignmentsQuery(appliedQuery ?? EMPTY_QUERY, {
    skip: !companyId || !appliedQuery,
  });
  const [loadPrintPayload] = useLazyGetSavedConsignmentPrintPayloadQuery();

  const search = useCallback(() => {
    if (!range?.from) {
      toast.error('Select a date or date range');
      return;
    }
    setAppliedQuery({
      dateFrom: format(range.from, 'yyyy-MM-dd'),
      dateTo: format(range.to ?? range.from, 'yyyy-MM-dd'),
      ...(isHeadOffice && sourceId !== ALL_BRANCHES ? { sourceId } : {}),
    });
  }, [isHeadOffice, range, sourceId]);

  const printConsignment = useCallback(
    async (id: string) => {
      setPrintingId(id);
      try {
        setPrintPayload(await loadPrintPayload(id).unwrap());
      } catch (error) {
        toast.error(errorMessage(error));
      } finally {
        setPrintingId(null);
      }
    },
    [loadPrintPayload],
  );

  return {
    appliedQuery,
    branches,
    history,
    isHeadOffice,
    printConsignment,
    printPayload,
    printingId,
    range,
    search,
    setPrintPayload,
    setRange,
    setSourceId,
    sourceId,
  };
}

export { ALL_BRANCHES };
