'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button, Spinner } from '@/components/ui';
import { PasswordField } from '@/features/auth/components/password-field';
import { useVerifyCurrentUserPasswordMutation } from '@/features/auth/api';
import { useAuthStore } from '@/stores/auth-store';
import { useSecurityPreferencesStore } from '@/stores/security-preferences-store';
import ThrowErrorMessage from '@/lib/throw-error';

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'focus',
];

export function ScreenTimeoutGuard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const logout = useAuthStore((state) => state.logout);
  const getScreenTimeoutMinutes = useSecurityPreferencesStore(
    (state) => state.getScreenTimeoutMinutes,
  );
  const [verifyPassword, { isLoading }] = useVerifyCurrentUserPasswordMutation();

  const [locked, setLocked] = useState(false);
  const [password, setPassword] = useState('');
  const timerRef = useRef<number | null>(null);

  const timeoutMinutes = user ? getScreenTimeoutMinutes(user.id) : 0;
  const timeoutMs = useMemo(() => {
    if (!timeoutMinutes || timeoutMinutes <= 0) return null;
    return timeoutMinutes * 60 * 1000;
  }, [timeoutMinutes]);

  useEffect(() => {
    if (!isAuthenticated || !timeoutMs || locked) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const scheduleLock = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setLocked(true);
      }, timeoutMs);
    };

    scheduleLock();
    const handleActivity = () => scheduleLock();

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleActivity);
      }
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAuthenticated, locked, timeoutMs]);

  useEffect(() => {
    if (!locked) setPassword('');
  }, [locked]);

  if (!isAuthenticated || !user) return null;

  const initials = user.fullname
    .split(' ')
    .map((token) => token[0] ?? '')
    .join('')
    .toUpperCase();

  const onUnlock = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = password.trim();
    if (!value) return;

    try {
      await verifyPassword({ password: value }).unwrap();
      setLocked(false);
      setPassword('');
      toast.success('Welcome back');
    } catch (error) {
      ThrowErrorMessage(error);
      setPassword('');
    }
  };

  const onLogout = () => {
    if (refreshToken) {
      void fetch('/v1/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
    logout();
    setLocked(false);
    navigate('/login', { replace: true });
  };

  return (
    <Dialog open={locked}>
      <DialogContent
        className="max-w-md"
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          <Avatar className="h-20 w-20 border border-border/70">
            <AvatarImage src={undefined} alt={user.fullname} />
            <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <DialogTitle className="pt-3 text-xl">{user.fullname}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onUnlock} className="space-y-3">
          <PasswordField
            id="screen-lock-password"
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            required
          />

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isLoading || !password.trim()}>
              {isLoading ? <Spinner /> : null}
              {isLoading ? 'Unlocking...' : 'Unlock'}
            </Button>
            <Button type="button" variant="outline" onClick={onLogout} disabled={isLoading}>
              Switch account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
