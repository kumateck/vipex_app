import { useState } from 'react';
import { format } from 'date-fns';
import { BranchType } from '@/db/schemas/enums';
import type { AuthUser } from '@/stores/auth-store';
import type { TaxDataFilters } from '../types';
import { parseTaxDataAmount, parseTaxDataOccurrences } from '../utils';

export function useTaxDataFilters(user: AuthUser | null) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [branchId, setBranchId] = useState('all');
  const [destinationBranchId, setDestinationBranchId] = useState('all');
  const [amount, setAmount] = useState('');
  const [confirmation, setConfirmation] = useState<TaxDataFilters['confirmation']>('all');
  const [maxOccurrences, setMaxOccurrences] = useState('50');
  const isHeadOffice = user?.branch?.type === BranchType.HEADOFFICE;
  const parsedAmount = parseTaxDataAmount(amount);
  const parsedMax = parseTaxDataOccurrences(maxOccurrences);
  const valid = Boolean(date && user?.company?.id && (isHeadOffice || user?.branch?.id));
  const filters: TaxDataFilters = {
    date,
    confirmation,
    amountPsw: parsedAmount ?? undefined,
    destinationBranchId: destinationBranchId === 'all' ? undefined : destinationBranchId,
    maxOccurrences: parsedMax ?? undefined,
    branchId: isHeadOffice ? (branchId === 'all' ? undefined : branchId) : user?.branch?.id,
  };
  return {
    open,
    setOpen,
    date,
    setDate,
    branchId,
    setBranchId,
    destinationBranchId,
    setDestinationBranchId,
    amount,
    setAmount,
    confirmation,
    setConfirmation,
    maxOccurrences,
    setMaxOccurrences,
    limit: Math.min(parsedMax ?? 50, 100),
    recordsValid: parsedAmount !== undefined && parsedAmount !== null && parsedMax !== null,
    maxInvalid: parsedMax === null,
    isHeadOffice,
    valid,
    filters,
    amountInvalid: parsedAmount === null,
    branchName: user?.branch?.name ?? 'My branch',
  };
}
