import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useSaveWhatsAppBillingRatesMutation } from '../services';
import type { WhatsAppPrices } from '../types';
import { toIsoDate } from '../utils';

type RateField = 'authentication' | 'utility' | 'marketing';
type RateValues = { currency: string } & Record<RateField, string>;

/** Starts from the latest price so a change only needs the new numbers and date. */
function initialValues(prices: WhatsAppPrices): RateValues {
  const latest = prices.history.at(-1) ?? prices.current;
  return {
    currency: prices.currency,
    authentication: String(latest?.authentication ?? 0),
    utility: String(latest?.utility ?? 0),
    marketing: String(latest?.marketing ?? 0),
  };
}

export function useBillingRatesForm(prices: WhatsAppPrices, onClose: () => void) {
  const [values, setValues] = useState(() => initialValues(prices));
  const [startDate, setStartDate] = useState<Date | undefined>(() => new Date());
  const [save, { isLoading: isSaving }] = useSaveWhatsAppBillingRatesMutation();

  const setField = useCallback((field: keyof RateValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  }, []);

  const effectiveFrom = startDate ? toIsoDate(startDate) : '';
  const today = toIsoDate(new Date());
  const replaces = useMemo(
    () => prices.history.find((period) => period.effectiveFrom === effectiveFrom) ?? null,
    [prices.history, effectiveFrom],
  );

  const submit = useCallback(async () => {
    try {
      await save({
        effectiveFrom,
        currency: values.currency.trim().toUpperCase(),
        authentication: Number(values.authentication) || 0,
        utility: Number(values.utility) || 0,
        marketing: Number(values.marketing) || 0,
      }).unwrap();
      toast.success(`Price saved from ${effectiveFrom}`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save the price'));
    }
  }, [effectiveFrom, values, save, onClose]);

  return {
    values,
    setField,
    startDate,
    setStartDate,
    submit,
    isSaving,
    isValid: Boolean(effectiveFrom) && /^[A-Za-z]{3}$/.test(values.currency.trim()),
    /** The new price changes reports for days that already happened. */
    isBackdated: Boolean(effectiveFrom) && effectiveFrom < today,
    replaces,
    /** Currency is fixed once prices exist, unless only the replaced period exists. */
    isCurrencyLocked: prices.history.some((period) => period.effectiveFrom !== effectiveFrom),
  };
}
