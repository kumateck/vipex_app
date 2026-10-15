import { useState } from 'react';
import { MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthStore } from '@/stores/auth-store';
import { RegisterDeviceDialog } from '../dialogs';
import { useDesktopDevicePrompt } from '../hooks';

export function RegisterDeviceButton() {
  const email = useAuthStore((state) => state.user?.email ?? '');
  const { needsRegistration, registering, register } = useDesktopDevicePrompt();
  const [open, setOpen] = useState(false);
  if (!needsRegistration || !email) return null;
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Register this device"
            onClick={() => setOpen(true)}
          >
            <MonitorSmartphone className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Register this device</TooltipContent>
      </Tooltip>
      {open ? (
        <RegisterDeviceDialog
          email={email}
          registering={registering}
          onRegister={(password) => register(email, password)}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
