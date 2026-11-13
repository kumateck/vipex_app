import { useRef, useState, type FormEvent } from 'react';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useLazyFindCorrectionParcelsQuery } from '../services';
import type { CorrectionParcel } from '../types';

export function useCorrectionLookup() {
  const [bookingCode, setBookingCode] = useState('');
  const [parcels, setParcels] = useState<CorrectionParcel[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');
  const [lookup, { isFetching }] = useLazyFindCorrectionParcelsQuery();
  const request = useRef(0);
  const activeCode = useRef('');
  const changeCode = (value: string) => {
    request.current++;
    activeCode.current = value;
    setBookingCode(value);
    setParcels([]);
    setSelectedId('');
    setError('');
  };
  const find = async (event: FormEvent) => {
    event.preventDefault();
    const code = bookingCode.trim();
    if (!code) return;
    const version = ++request.current;
    setParcels([]);
    setSelectedId('');
    setError('');
    try {
      const rows = await lookup(code, false).unwrap();
      if (version !== request.current) return;
      setParcels(rows);
      if (rows.length === 1) setSelectedId(rows[0]!.id);
    } catch (failure) {
      if (version === request.current)
        setError(getErrorMessage(failure, 'Parcel lookup failed; try again'));
    }
  };
  const saved = async (parcel: CorrectionParcel) => {
    if (activeCode.current.trim() !== parcel.bookingCode) return;
    setParcels((rows) => rows.map((row) => (row.id === parcel.id ? { ...row, ...parcel } : row)));
    const current = ++request.current;
    try {
      const rows = await lookup(parcel.bookingCode, false).unwrap();
      if (current === request.current) setParcels(rows);
    } catch {
      if (current === request.current)
        setError('Correction saved. Find the booking again to refresh the other parcels.');
    }
  };
  return {
    bookingCode,
    changeCode,
    parcels,
    selectedId,
    setSelectedId,
    selected: parcels.find((parcel) => parcel.id === selectedId),
    error,
    isFetching,
    find,
    saved,
  };
}
