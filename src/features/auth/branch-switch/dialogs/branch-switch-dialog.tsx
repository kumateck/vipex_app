import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { selectBranch } from '@/shared/auth/branch-switch';
import { useBranchSwitch } from '../hooks/use-branch-switch';

export function BranchSwitchDialog() {
  const { options, selection, branch, canSwitch, saving, error, setChoice, submit } =
    useBranchSwitch();
  const data = options.data;
  return (
    <DialogContent
      className="sm:max-w-md"
      showCloseButton={!saving}
      onEscapeKeyDown={(event) => {
        if (saving) event.preventDefault();
      }}
      onPointerDownOutside={(event) => {
        if (saving) event.preventDefault();
      }}
    >
      <DialogHeader>
        <DialogTitle>Switch branch</DialogTitle>
        <DialogDescription>Choose the branch and location for this sign-in.</DialogDescription>
      </DialogHeader>
      {options.isLoading ? <p role="status">Loading branches…</p> : null}
      {options.isError ? (
        <div className="space-y-2">
          <p role="alert">Unable to load available branches.</p>
          <Button variant="outline" onClick={() => void options.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}
      {data && !options.isError ? (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="switch-branch">Branch</Label>
            <Select
              value={selection?.branchId ?? ''}
              disabled={saving}
              onValueChange={(id) => {
                const next = data.branches.find((candidate) => candidate.id === id);
                if (next) setChoice(selectBranch(next, data.current));
              }}
            >
              <SelectTrigger id="switch-branch">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {data.branches.map(({ id, name }) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {branch?.locations.length ? (
            <div className="grid gap-2">
              <Label htmlFor="switch-location">Location</Label>
              <Select
                value={selection?.locationId ?? ''}
                disabled={saving}
                onValueChange={(locationId) => setChoice({ branchId: branch.id, locationId })}
              >
                <SelectTrigger id="switch-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {branch.locations.map(({ id, name }) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <DialogFooter>
        <Button onClick={() => void submit()} disabled={!canSwitch || saving || options.isError}>
          {saving ? 'Switching…' : 'Switch branch'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
