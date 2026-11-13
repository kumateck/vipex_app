import { useState } from 'react';
import { useBreadcrumbStore } from '@/stores/route-store';
import { switchAuthSessionBranch } from '@/features/auth/session';
import {
  canChangeBranchSelection,
  selectBranch,
  type BranchSwitchChoice,
} from '@/shared/auth/branch-switch';
import { useGetBranchSwitchOptionsQuery } from '../services/branch-switch-api';

export function useBranchSwitch() {
  const options = useGetBranchSwitchOptionsQuery(undefined, { refetchOnMountOrArgChange: true });
  const [choice, setChoice] = useState<BranchSwitchChoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selection = choice ?? undefined;
  const current = options.data?.current;
  const branches = (options.data?.branches ?? []).filter(
    (branch) =>
      branch.id !== current?.branchId ||
      branch.locations.some((location) => location.id !== current.locationId),
  );
  const branch = branches.find((candidate) => candidate.id === selection?.branchId);
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

  function chooseBranch(id: string) {
    const selected = branches.find((candidate) => candidate.id === id);
    if (!selected || !current) return;
    setChoice(selectBranch(selected, current));
    setError(null);
  }

  function chooseLocation(locationId: string) {
    if (!branch) return;
    setChoice({ branchId: branch.id, locationId });
    setError(null);
  }

  return {
    options,
    selection,
    branches,
    branch,
    canSwitch,
    saving,
    error,
    chooseBranch,
    chooseLocation,
    submit,
  };
}
