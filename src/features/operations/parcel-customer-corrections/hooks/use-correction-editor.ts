import { useRef, useState } from 'react';
import { useHasPermission } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { limitPhoneDigits } from '@/lib/phone';
import { toast } from 'sonner';
import { useCorrectParcelCustomerMutation, useLazyFindCorrectionCustomersQuery } from '../services';
import type {
  CorrectionCustomer,
  CorrectionMode,
  CorrectionParcel,
  CorrectionParty,
} from '../types';

export function useCorrectionEditor(
  parcel: CorrectionParcel,
  party: CorrectionParty,
  onSaved: (parcel: CorrectionParcel) => void,
) {
  const customer = parcel.parties[party]!;
  const canRelink = useHasPermission(PermissionKeys.CanCorrectParcelCustomers);
  const canEdit = useHasPermission(PermissionKeys.CanOverrideParcelCustomerDetails);
  const [mode, setMode] = useState<CorrectionMode>(canEdit ? 'profile' : 'relink');
  const [fullname, setFullname] = useState(customer.fullname);
  const [updateName, setUpdateName] = useState(false);
  const [telephone, setTelephone] = useState(customer.telephone ?? '');
  const [telephone2, setTelephone2] = useState(customer.telephone2 ?? '');
  const [reason, setReason] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [matches, setMatches] = useState<CorrectionCustomer[] | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');
  const [findCustomers, lookupState] = useLazyFindCorrectionCustomersQuery();
  const [correct, saveState] = useCorrectParcelCustomerMutation();
  const version = useRef(0);
  const saving = useRef(false);
  const selected = matches?.find((row) => row.id === selectedId);
  const changeLookupPhone = (value: string) => {
    version.current++;
    setLookupPhone(limitPhoneDigits(value));
    setMatches(null);
    setSelectedId('');
    setError('');
  };
  const lookup = async () => {
    if (lookupPhone.length !== 10) return;
    const current = ++version.current;
    setError('');
    try {
      const rows = await findCustomers(lookupPhone, false).unwrap();
      if (current === version.current) {
        setMatches(rows);
        setSelectedId('');
      }
    } catch (failure) {
      if (current === version.current) setError(getErrorMessage(failure, 'Customer lookup failed'));
    }
  };
  const validProfile =
    fullname.trim().length > 0 &&
    fullname.trim().length <= 255 &&
    /^\d{10}$/.test(telephone) &&
    (!telephone2 || /^\d{10}$/.test(telephone2)) &&
    telephone !== telephone2;
  const canSave =
    !parcel.restriction &&
    reason.trim().length >= 5 &&
    (mode === 'profile'
      ? canEdit && validProfile
      : canRelink && !!selected && selected.id !== customer.id);
  const save = async () => {
    if (!canSave || saving.current) return;
    saving.current = true;
    setError('');
    try {
      const result = await correct({
        parcelId: parcel.id,
        expectedVersion: parcel.version,
        expectedCustomerVersion: customer.version,
        party,
        mode,
        updateName,
        fullname: mode === 'relink' ? selected!.fullname : fullname,
        telephone: mode === 'relink' ? lookupPhone : telephone,
        telephone2: mode === 'relink' ? (selected?.telephone2 ?? null) : telephone2 || null,
        customerId: mode === 'relink' ? selected?.id : undefined,
        replacementVersion: mode === 'relink' ? selected?.version : undefined,
        reason: reason.trim(),
      }).unwrap();
      toast.success(`Customer correction saved for ${result.bookingCode}`);
      onSaved(result);
    } catch (failure) {
      setError(getErrorMessage(failure, 'Correction failed; review the details and try again'));
    } finally {
      saving.current = false;
    }
  };
  return {
    customer,
    mode,
    setMode,
    canRelink,
    canEdit,
    fullname,
    setFullname: (value: string) => {
      setFullname(value);
      setUpdateName(true);
    },
    updateName,
    setUpdateName,
    telephone,
    setTelephone: (value: string) => setTelephone(limitPhoneDigits(value)),
    telephone2,
    setTelephone2: (value: string) => setTelephone2(limitPhoneDigits(value)),
    reason,
    setReason,
    lookupPhone,
    changeLookupPhone,
    matches,
    selectedId,
    setSelectedId,
    selected,
    lookup,
    isFetching: lookupState.isFetching,
    isSaving: saveState.isLoading,
    error,
    canSave,
    save,
  };
}
