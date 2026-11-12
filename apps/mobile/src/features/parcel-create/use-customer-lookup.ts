import { isNonIndividualCustomerType } from '@/shared/customers/customer-types';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { useCallback, useEffect, useRef, useState } from 'react';
import { findCustomersByTelephone } from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import type { CustomerLookupResult } from '@mobile/types/booking';
import { findNonIndividualSenders } from './services';
import { isTenDigitPhone, limitPhoneDigits } from './phone-utils';
export { isTenDigitPhone, limitPhoneDigits, normalizePhoneDigits } from './phone-utils';

type WithAuth = <T>(run: (accessToken: string) => Promise<T>) => Promise<T>;

function otherTelephone(match: CustomerLookupResult, phone: string, nonIndividualOnly: boolean) {
  return (
    (nonIndividualOnly && match.telephone2 === phone ? match.telephone : match.telephone2) ?? ''
  );
}

export function useCustomerLookup(withAuth: WithAuth, nonIndividualOnly = false) {
  const [telephone, setTelephoneRaw] = useState('');
  const [telephone2, setTelephone2Raw] = useState('');
  const [fullname, setFullname] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [matches, setMatches] = useState<CustomerLookupResult[]>([]);
  const [hasLookedUp, setHasLookedUp] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const lookupVersion = useRef(0);
  const selectedCustomerId = useRef('');

  const clearMatch = () => {
    selectedCustomerId.current = '';
    setCustomerId('');
    setMatches([]);
    setHasLookedUp(false);
  };

  const setTelephone = (value: string) => {
    lookupVersion.current += 1;
    setTelephoneRaw(limitPhoneDigits(value));
    setIsLookingUp(false);
    setFullname('');
    setTelephone2Raw('');
    clearMatch();
  };

  const setTelephone2 = (value: string) => {
    lookupVersion.current += 1;
    setTelephone2Raw(limitPhoneDigits(value));
  };

  const selectMatch = (match: CustomerLookupResult) => {
    selectedCustomerId.current = match.id;
    setCustomerId(match.id);
    setFullname(match.fullname);
    if ([match.telephone, match.telephone2].includes(telephone)) {
      setTelephone2Raw(otherTelephone(match, telephone, nonIndividualOnly));
    }
  };

  const lookup = useCallback(async () => {
    if (!isTenDigitPhone(telephone)) return;
    const version = ++lookupVersion.current;
    setIsLookingUp(true);
    try {
      const phones = [telephone, telephone2].filter(isTenDigitPhone);
      const found = await Promise.all(
        phones.map((phone) =>
          withAuth((token) =>
            nonIndividualOnly
              ? findNonIndividualSenders(token, phone)
              : findCustomersByTelephone(token, { telephone: phone }),
          ),
        ),
      );
      const eligible = found
        .flat()
        .filter((match) => !nonIndividualOnly || isNonIndividualCustomerType(match.customerType));
      const results = [...new Map(eligible.map((match) => [match.id, match])).values()];
      if (version !== lookupVersion.current) return;
      setMatches(results);
      setHasLookedUp(true);
      if (results.length === 1 && results[0]) {
        selectedCustomerId.current = results[0].id;
        setCustomerId(results[0].id);
        setFullname(results[0].fullname);
        if ([results[0].telephone, results[0].telephone2].includes(telephone)) {
          setTelephone2Raw(otherTelephone(results[0], telephone, nonIndividualOnly));
        }
      } else if (results.some((match) => match.id === selectedCustomerId.current)) {
        // Preserve an explicit selection when both numbers return multiple people.
      } else {
        selectedCustomerId.current = '';
        setCustomerId('');
      }
    } catch (error) {
      if (version !== lookupVersion.current) return;
      notifyError(
        'Lookup failed',
        getMobileErrorMessage(error, '') || 'Unable to look up customer',
      );
    } finally {
      if (version === lookupVersion.current) setIsLookingUp(false);
    }
  }, [nonIndividualOnly, telephone, telephone2, withAuth]);

  useEffect(() => {
    if (!isTenDigitPhone(telephone)) return;
    const timer = setTimeout(() => void lookup(), 350);
    return () => clearTimeout(timer);
  }, [lookup, telephone, telephone2]);

  const applyUpdatedCustomer = (updated: { id: string; fullname: string }) => {
    lookupVersion.current += 1;
    setIsLookingUp(false);
    setMatches((current) =>
      current.map((row) => (row.id === updated.id ? { ...row, fullname: updated.fullname } : row)),
    );
    if (selectedCustomerId.current === updated.id) setFullname(updated.fullname);
  };

  const reset = () => {
    lookupVersion.current += 1;
    setTelephoneRaw('');
    setTelephone2Raw('');
    setFullname('');
    clearMatch();
    setIsLookingUp(false);
  };

  const isExistingCustomer = Boolean(customerId);
  const isNewCustomer = !nonIndividualOnly && hasLookedUp && !isExistingCustomer;

  return {
    nonIndividualOnly,
    telephone,
    setTelephone,
    telephone2,
    setTelephone2,
    fullname,
    setFullname,
    customerId,
    customerType: matches.find((row) => row.id === customerId)?.customerType,
    matches,
    hasLookedUp,
    isLookingUp,
    isExistingCustomer,
    isNewCustomer,
    selectMatch,
    applyUpdatedCustomer,
    lookup,
    reset,
  };
}

export type UseCustomerLookupResult = ReturnType<typeof useCustomerLookup>;
