import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { PHONE_DIGITS } from '@/lib/phone';

type ExistingCustomerEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerLabel: string;
  fullname: string;
  primaryTelephone: string;
  secondaryTelephone: string;
  isSaving: boolean;
  onFullnameChange: (value: string) => void;
  onSecondaryTelephoneChange: (value: string) => void;
  onSave: () => Promise<void>;
};

export function ExistingCustomerEditDialog({
  open,
  onOpenChange,
  customerLabel,
  fullname,
  primaryTelephone,
  secondaryTelephone,
  isSaving,
  onFullnameChange,
  onSecondaryTelephoneChange,
  onSave,
}: ExistingCustomerEditDialogProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Edit {customerLabel} customer</DialogTitle>
            <DialogDescription>
              Update the existing customer name or add a secondary telephone number.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${customerLabel}-customer-fullname`}>Full name</Label>
              <Input
                id={`${customerLabel}-customer-fullname`}
                value={fullname}
                onChange={(event) => onFullnameChange(event.target.value)}
                maxLength={255}
                autoComplete="name"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${customerLabel}-customer-primary-phone`}>Telephone</Label>
              <Input
                id={`${customerLabel}-customer-primary-phone`}
                value={primaryTelephone}
                readOnly
                disabled
              />
              <p className="text-xs text-muted-foreground">
                The lookup telephone cannot be changed here.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${customerLabel}-customer-secondary-phone`}>
                Telephone 2 (Optional)
              </Label>
              <Input
                id={`${customerLabel}-customer-secondary-phone`}
                value={secondaryTelephone}
                onChange={(event) => onSecondaryTelephoneChange(event.target.value)}
                inputMode="numeric"
                autoComplete="tel"
                maxLength={PHONE_DIGITS}
                placeholder="0240000001"
                disabled={isSaving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !fullname.trim()}>
              {isSaving ? <Spinner /> : null}
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
