import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import { notifyError, notifySuccess } from '@mobile/lib/notify';
import { listMobileCustomers, updateMobileCustomer } from '../services';
import type { MobileCustomer, MobileCustomerPatch } from '../types';

export function useMobileCustomerDirectory(canRead: boolean, canUpdate: boolean) {
  const { withAuth } = useAuth();
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [customers, setCustomers] = useState<MobileCustomer[]>([]);
  const [selected, setSelected] = useState<MobileCustomer | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      const result = await withAuth((token) => listMobileCustomers(token, submittedSearch));
      setCustomers(result.data);
    } catch (error) {
      notifyError('Customers unavailable', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  }, [canRead, submittedSearch, withAuth]);

  useEffect(() => void load(), [load]);

  const save = useCallback(
    async (patch: MobileCustomerPatch) => {
      if (!canUpdate) return;
      setSaving(true);
      try {
        await withAuth((token) => updateMobileCustomer(token, patch));
        notifySuccess('Customer contact details were updated.', 'Customer saved');
        setSelected(null);
        await load();
      } catch (error) {
        notifyError('Customer not saved', error instanceof Error ? error.message : 'Try again.');
      } finally {
        setSaving(false);
      }
    },
    [canUpdate, load, withAuth],
  );

  const submitSearch = useCallback(() => {
    const next = search.trim();
    if (next === submittedSearch) void load();
    else setSubmittedSearch(next);
  }, [load, search, submittedSearch]);

  return {
    search,
    setSearch,
    customers,
    selected,
    setSelected,
    loading,
    saving,
    load,
    submitSearch,
    save,
  };
}
