export type SessionBranch = { id: string; name: string; type: number };
export type SessionLocation = { id: string; name: string };

export type BranchSwitchChoice = {
  branchId: string;
  locationId: string | null;
};

export type BranchSwitchOptions = {
  current: BranchSwitchChoice;
  branches: Array<SessionBranch & { locations: SessionLocation[] }>;
};

export function selectBranch(
  branch: BranchSwitchOptions['branches'][number],
  current: BranchSwitchChoice,
): BranchSwitchChoice {
  return {
    branchId: branch.id,
    locationId:
      branch.id === current.branchId
        ? current.locationId
        : branch.locations.length === 1
          ? branch.locations[0]!.id
          : null,
  };
}

export function sessionBranchKey(
  user?: {
    id: string;
    company?: { id: string } | null;
    companyId?: string | null;
    branch?: { id: string } | null;
    branchId?: string | null;
    location?: { id: string } | null;
    locationId?: string | null;
  } | null,
): string {
  return JSON.stringify([
    user?.id,
    user?.company?.id ?? user?.companyId,
    user?.branch?.id ?? user?.branchId,
    user?.location?.id ?? user?.locationId,
  ]);
}

export function canChangeBranchSelection(
  options: BranchSwitchOptions | undefined,
  selection: BranchSwitchChoice | undefined,
): boolean {
  if (!options || !selection) return false;
  const branch = options.branches.find(({ id }) => id === selection.branchId);
  if (!branch) return false;
  const validLocation = branch.locations.length
    ? branch.locations.some(({ id }) => id === selection.locationId)
    : selection.locationId === null;
  return (
    validLocation &&
    (selection.branchId !== options.current.branchId ||
      selection.locationId !== options.current.locationId)
  );
}
