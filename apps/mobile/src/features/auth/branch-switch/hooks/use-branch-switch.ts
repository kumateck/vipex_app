import { useState } from 'react';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { useAuth } from '@mobile/providers/auth-provider';
import {
  canChangeBranchSelection,
  type BranchSwitchChoice,
  type BranchSwitchOptions,
} from '@/shared/auth/branch-switch';
import { getBranchSwitchOptions } from '../services/get-branch-switch-options';

export function useBranchSwitch() {
  const { withAuth, switchBranch } = useAuth();
  const [options, setOptions] = useState<BranchSwitchOptions>();
  const [choice, setChoice] = useState<BranchSwitchChoice>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selection = choice ?? options?.current;
  const branch = options?.branches.find(({ id }) => id === selection?.branchId);
  const canSwitch = canChangeBranchSelection(options, selection);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setOptions(await withAuth(getBranchSwitchOptions));
    } catch (cause) {
      setError(getMobileErrorMessage(cause, 'Unable to load available branches.'));
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!selection || !canSwitch || saving) return;
    setSaving(true);
    setError(null);
    try {
      await switchBranch(selection);
    } catch (cause) {
      setError(getMobileErrorMessage(cause, 'Unable to switch branch.'));
      setSaving(false);
    }
  }

  return { options, selection, branch, canSwitch, loading, saving, error, setChoice, load, submit };
}
