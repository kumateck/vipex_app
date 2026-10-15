import { useState } from 'react';
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

type Props = {
  email: string;
  registering: boolean;
  onRegister: (password: string) => Promise<boolean>;
  onClose: () => void;
};

export function RegisterDeviceDialog({ email, registering, onRegister, onClose }: Props) {
  const [password, setPassword] = useState('');
  const submit = async () => {
    if (!password || registering) return;
    if (await onRegister(password)) onClose();
  };
  return (
    <Dialog open onOpenChange={(open) => !open && !registering && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register this device</DialogTitle>
          <DialogDescription>
            Confirm your password to register this desktop for approval. It does not change how you
            sign in until your company turns on device verification.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="register-device-email">Email</Label>
            <Input id="register-device-email" value={email} readOnly disabled />
          </div>
          <div className="space-y-1">
            <Label htmlFor="register-device-password">Password</Label>
            <Input
              id="register-device-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={registering} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!password || registering}>
              {registering ? 'Registering...' : 'Register device'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
