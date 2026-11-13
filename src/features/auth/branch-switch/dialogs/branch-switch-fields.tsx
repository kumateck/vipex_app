import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { BranchSwitchChoice, BranchSwitchOptions } from '@/shared/auth/branch-switch';

type BranchOption = BranchSwitchOptions['branches'][number];

export function BranchSwitchFields({
  branches,
  branch,
  selection,
  loading,
  saving,
  failed,
  chooseBranch,
  chooseLocation,
}: {
  branches: BranchOption[];
  branch?: BranchOption;
  selection?: BranchSwitchChoice;
  loading: boolean;
  saving: boolean;
  failed: boolean;
  chooseBranch: (id: string) => void;
  chooseLocation: (id: string) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="switch-branch">Branch</Label>
        <SearchableSelect
          id="switch-branch"
          value={selection?.branchId}
          onValueChange={chooseBranch}
          options={branches.map(({ id, name }) => ({ value: id, label: name }))}
          disabled={saving || loading || failed || branches.length === 0}
          placeholder={loading ? 'Loading branches…' : 'Choose a branch'}
          searchPlaceholder="Search branches"
          emptyMessage="No branches found."
        />
      </div>
      {branch?.locations.length ? (
        <div className="space-y-2">
          <Label htmlFor="switch-location">Location</Label>
          <SearchableSelect
            key={branch.id}
            id="switch-location"
            value={selection?.locationId ?? undefined}
            onValueChange={chooseLocation}
            options={branch.locations.map(({ id, name }) => ({ value: id, label: name }))}
            disabled={saving || failed}
            placeholder="Choose a location"
            searchPlaceholder="Search locations"
            emptyMessage="No locations found."
          />
        </div>
      ) : null}
    </>
  );
}
