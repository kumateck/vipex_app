import { useCallback, useEffect, useState } from 'react';
import { getParcelDetails, searchParcels } from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import { hapticError } from '@mobile/lib/haptics';
import type { ParcelFullDetails, ParcelSearchRow } from '@mobile/types/parcels';

type WithAuth = <T>(cb: (token: string) => Promise<T>) => Promise<T>;

function buildDetailsFallback(inputRow: ParcelSearchRow | null): ParcelFullDetails | null {
  if (!inputRow) return null;
  const nowIso = new Date().toISOString();
  return {
    parcel: {
      id: inputRow.id,
      trackingCode: inputRow.trackingCode ?? '',
      bookingCode: inputRow.bookingCode ?? '',
      status: inputRow.status ?? 0,
      senderId: inputRow.sourceId ?? '',
      receiverId: inputRow.receiverId ?? '',
      sourceId: inputRow.sourceId ?? '',
      destinationId: inputRow.destinationId ?? '',
      parcelDetails: inputRow.parcelDetails ?? '',
      parcelContent: inputRow.parcelContent ?? '',
      parcelValuePsw: inputRow.parcelValuePsw ?? 0,
      chargePsw: inputRow.chargePsw ?? 0,
      plannedToBePaidPsw: inputRow.plannedToBePaidPsw ?? 0,
      createdAt: nowIso,
      receivedAt: null,
      confirmedAt: null,
    },
    pickupQueue: inputRow.pickupQueueId
      ? {
          id: inputRow.pickupQueueId,
          queueCode: inputRow.pickupQueueCode ?? '',
          queueNumber: inputRow.pickupQueueNumber ?? 0,
          queuedAt: inputRow.pickupQueuedAt ?? nowIso,
          paymentBucket: '',
        }
      : null,
    payments: [],
    delivery: null,
  };
}

export function useParcelRecordDetails({
  parcelId,
  companyId,
  withAuth,
}: {
  parcelId?: string;
  companyId?: string | null;
  withAuth: WithAuth;
}) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<ParcelFullDetails | null>(null);
  const [row, setRow] = useState<ParcelSearchRow | null>(null);
  const [relatedRows, setRelatedRows] = useState<ParcelSearchRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!parcelId) return;
    setLoading(true);
    setLoadError(null);
    try {
      if (!companyId) {
        try {
          const detailsPayload = await withAuth((token) => getParcelDetails(token, parcelId));
          setDetails(detailsPayload);
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : 'Unable to load parcel details without company context';
          setLoadError(message);
          setDetails(null);
        }
        setRow(null);
        setRelatedRows([]);
        return;
      }

      const parcelIdSearchPayload = await withAuth((token) =>
        searchParcels(token, {
          search: parcelId,
          companyId,
          includeDeleted: true,
          page: 1,
          pageSize: 50,
        }),
      );
      const parcelIdSearch = parcelIdSearchPayload.data ?? [];

      const baseRow =
        parcelIdSearch.find((item) => item.id === parcelId) ?? parcelIdSearch[0] ?? null;
      const bookingCodeFromSearch = baseRow?.bookingCode?.trim();
      const trackingCodeFromSearch = baseRow?.trackingCode?.trim();
      const detailLookupKeys = [parcelId, bookingCodeFromSearch, trackingCodeFromSearch].filter(
        (value): value is string => Boolean(value && value.trim()),
      );

      let detailsPayload: ParcelFullDetails | null = null;
      let lastDetailError: Error | null = null;
      for (const key of detailLookupKeys) {
        try {
          detailsPayload = await withAuth((token) => getParcelDetails(token, key));
          break;
        } catch (err) {
          lastDetailError = err instanceof Error ? err : new Error(String(err));
        }
      }

      if (!detailsPayload) {
        const fallbackDetails = buildDetailsFallback(baseRow);
        if (!fallbackDetails) throw lastDetailError ?? new Error('Unable to load parcel details.');
        setDetails(fallbackDetails);
      } else {
        setDetails(detailsPayload);
      }

      const resolvedBookingCode = (
        detailsPayload?.parcel.bookingCode ??
        baseRow?.bookingCode ??
        ''
      ).trim();
      const bookingSearch =
        resolvedBookingCode &&
        resolvedBookingCode !== parcelId &&
        resolvedBookingCode !== bookingCodeFromSearch
          ? await withAuth((token) =>
              searchParcels(token, {
                search: resolvedBookingCode,
                companyId,
                includeDeleted: true,
                page: 1,
                pageSize: 50,
              }),
            )
          : null;

      const mergedById = new Map<string, ParcelSearchRow>();
      for (const item of [...parcelIdSearch, ...(bookingSearch?.data ?? [])]) {
        if (!item?.id) continue;
        mergedById.set(item.id, item);
      }
      const mergedRows = [...mergedById.values()];
      setRelatedRows(mergedRows);
      setRow(mergedRows.find((item) => item.id === parcelId) ?? mergedRows[0] ?? null);

      if (!detailsPayload) {
        const strongestRow =
          mergedRows.find((item) => item.id === parcelId) ?? mergedRows[0] ?? baseRow;
        setDetails(buildDetailsFallback(strongestRow));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load record details';
      setLoadError(message);
      notifyError('Load failed', message);
      void hapticError();
    } finally {
      setLoading(false);
    }
  }, [companyId, parcelId, withAuth]);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, details, row, relatedRows, loadError, load };
}
