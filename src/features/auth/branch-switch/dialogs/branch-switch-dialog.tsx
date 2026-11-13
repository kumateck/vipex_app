import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BranchSwitchFields } from './branch-switch-fields';
import { Spinner } from '@/components/ui/spinner';
import { useBranchSwitch } from '../hooks/use-branch-switch';

type BranchSwitchDialogProps = {
  currentRole: string;
  currentBranch: string;
  onClose: () => void;
  returnFocus: RefObject<HTMLButtonElement | null>;
};

export function BranchSwitchDialog({
  currentRole,
  currentBranch,
  onClose,
  returnFocus,
}: BranchSwitchDialogProps) {
  const {
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
  } = useBranchSwitch();
  const loading = options.isFetching && !options.data;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={!saving}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.current?.focus();
        }}
      >
        <DialogHeader className="text-left">
          <DialogTitle>Switch branch</DialogTitle>
          <DialogDescription>Choose the branch and location for this sign-in.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Current role</dt>
              <dd className="mt-1 font-medium wrap-break-word">{currentRole}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Current branch</dt>
              <dd className="mt-1 font-medium wrap-break-word">{currentBranch}</dd>
            </div>
          </dl>
          <BranchSwitchFields
            branches={branches}
            branch={branch}
            selection={selection}
            loading={loading}
            saving={saving}
            failed={options.isError}
            chooseBranch={chooseBranch}
            chooseLocation={chooseLocation}
          />
          {options.isError ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-destructive" role="alert">
                Unable to load available branches.
              </p>
              <Button variant="outline" size="sm" onClick={() => void options.refetch()}>
                Retry
              </Button>
            </div>
          ) : null}
          {options.isSuccess && branches.length === 0 ? (
            <p className="text-sm text-muted-foreground" role="status">
              No other branches are available.
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={!canSwitch || saving || options.isError}>
            {saving ? (
              <>
                <Spinner aria-hidden="true" /> Switching…
              </>
            ) : branch ? (
              `Switch to ${branch.name}`
            ) : (
              'Switch'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
