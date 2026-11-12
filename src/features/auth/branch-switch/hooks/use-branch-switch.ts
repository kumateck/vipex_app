import { useState } from 'react';
import { useBreadcrumbStore } from '@/stores/route-store';
import { switchAuthSessionBranch } from '@/features/auth/session';
import { canChangeBranchSelection, type BranchSwitchChoice } from '@/shared/auth/branch-switch';
import { useGetBranchSwitchOptionsQuery } from '../services/branch-switch-api';

export function useBranchSwitch() {
  const options = useGetBranchSwitchOptionsQuery(undefined, { refetchOnMountOrArgChange: true });
  const [choice, setChoice] = useState<BranchSwitchChoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selection = choice ?? options.data?.current;
  const branch = options.data?.branches.find((candidate) => candidate.id === selection?.branchId);
  const canSwitch = canChangeBranchSelection(options.data, selection);

  async function submit() {
    if (!selection || !canSwitch || saving) return;
    setSaving(true);
    setError(null);
    const result = await switchAuthSessionBranch(selection);
    if (result.status === 'refreshed') {
      useBreadcrumbStore.getState().reset();
      window.location.replace('/');
      return;
    }
    setError(
      result.status === 'switch-rejected' ? result.message : 'Unable to switch branch. Try again.',
    );
    setSaving(false);
  }

  return { options, selection, branch, canSwitch, saving, error, setChoice, submit };
}
