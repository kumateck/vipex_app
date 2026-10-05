import type { ReactNode } from 'react';
import { useDesktopDeviceAccess } from '../hooks';

export function DesktopDeviceGate({ children }: { children: ReactNode }) {
  const { isBlocked, isUnavailable, retry } = useDesktopDeviceAccess();
  if (isBlocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center text-sm">
        <p>
          {isUnavailable
            ? 'Unable to verify this device right now. Check your connection and try again.'
            : 'Checking company device policy…'}
        </p>
        {isUnavailable ? (
          <button type="button" onClick={retry} className="rounded border px-4 py-2">
            Retry
          </button>
        ) : null}
      </div>
    );
  }
  return children;
}
