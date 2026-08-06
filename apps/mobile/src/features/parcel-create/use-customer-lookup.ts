import { useState } from 'react';
import { findCustomersByTelephone } from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import type { CustomerLookupResult } from '@mobile/types/booking';

const PHONE_DIGITS = 10;

export function normalizePhoneDigits(value: string | null | undefined) {
  return String(value ?? '').replace(/\D/g, '');
}

export function limitPhoneDigits(value: string | null | undefined) {
  return normalizePhoneDigits(value).slice(0, PHONE_DIGITS);
}

export function isTenDigitPhone(value: string | null | undefined) {
  return normalizePhoneDigits(value).length === PHONE_DIGITS;
}

type WithAuth = <T>(run: (accessToken: string) => Promise<T>) => Promise<T>;

export function useCustomerLookup(withAuth: WithAuth) {
  const [telephone, setTelephoneRaw] = useState('');
  const [telephone2, setTelephone2Raw] = useState('');
  const [fullname, setFullname] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [matches, setMatches] = useState<CustomerLookupResult[]>([]);
  const [hasLookedUp, setHasLookedUp] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const clearMatch = () => {
    setCustomerId('');
    setMatches([]);
    setHasLookedUp(false);
  };

  const setTelephone = (value: string) => {
    setTelephoneRaw(limitPhoneDigits(value));
    clearMatch();
  };

  const setTelephone2 = (value: string) => {
    setTelephone2Raw(limitPhoneDigits(value));
  };

  const selectMatch = (match: CustomerLookupResult) => {
    setCustomerId(match.id);
    setFullname(match.fullname);
    setTelephone2Raw(match.telephone2 ?? '');
  };

  const lookup = async () => {
    if (!isTenDigitPhone(telephone)) return;
    setIsLookingUp(true);
    try {
      const results = await withAuth((token) => findCustomersByTelephone(token, { telephone }));
      setMatches(results);
      setHasLookedUp(true);
      if (results.length === 1 && results[0]) {
        selectMatch(results[0]);
      } else {
        setCustomerId('');
        setFullname('');
      }
    } catch (error) {
      notifyError(
        'Lookup failed',
        error instanceof Error ? error.message : 'Unable to look up customer',
      );
    } finally {
      setIsLookingUp(false);
    }
  };

  const reset = () => {
    setTelephoneRaw('');
    setTelephone2Raw('');
    setFullname('');
    clearMatch();
  };

  const isExistingCustomer = Boolean(customerId);
  const isNewCustomer = hasLookedUp && !isExistingCustomer;

  return {
    telephone,
    setTelephone,
    telephone2,
    setTelephone2,
    fullname,
    setFullname,
    customerId,
    matches,
    hasLookedUp,
    isLookingUp,
    isExistingCustomer,
    isNewCustomer,
    selectMatch,
    lookup,
    reset,
  };
}

export type UseCustomerLookupResult = ReturnType<typeof useCustomerLookup>;
