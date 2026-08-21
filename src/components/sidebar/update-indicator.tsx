import { useEffect, useMemo, useState } from 'react';
import { ArrowDownCircle, CheckCircle2, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type DesktopUpdateStatus = NonNullable<Window['api']>['updates'] extends {
  getStatus: () => Promise<infer T>;
}
  ? T
  : {
      state:
        | 'idle'
        | 'checking'
        | 'available'
        | 'downloading'
        | 'downloaded'
        | 'not-available'
        | 'error';
      version?: string;
      currentVersion?: string;
      availableVersion?: string;
      progress?: number;
      message?: string;
    };

function isDesktopUpdaterAvailable() {
  return typeof window !== 'undefined' && typeof window.api?.updates?.getStatus === 'function';
}

export function UpdateIndicator() {
  const navigate = useNavigate();
  const isDesktop = useMemo(() => isDesktopUpdaterAvailable(), []);
  const [status, setStatus] = useState<DesktopUpdateStatus>({ state: 'idle' });

  useEffect(() => {
    if (!isDesktop) return;
    let mounted = true;

    const run = async () => {
      try {
        const next = await window.api!.updates.getStatus();
        if (!mounted) return;
        setStatus(next);
      } catch {
        if (!mounted) return;
        setStatus({ state: 'error', message: 'Update status unavailable' });
      }
    };
    void run();

    const unsubscribe = window.api!.updates.onStatus((next) => {
      if (!mounted) return;
      setStatus(next);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [isDesktop]);

  if (!isDesktop) return null;
  // Only shown for a genuine, actionable update — not while merely checking or on error.
  if (
    status.state !== 'available' &&
    status.state !== 'downloading' &&
    status.state !== 'downloaded'
  )
    return null;

  const meta =
    status.state === 'downloaded'
      ? {
          label: 'Update ready to install',
          Icon: CheckCircle2,
          dot: 'bg-green-500',
          icon: 'text-green-600',
          ring: 'border-green-500/60',
        }
      : {
          label:
            status.state === 'downloading'
              ? `Downloading update – ${Math.round(Math.max(0, Math.min(100, status.progress ?? 0)))}%`
              : 'Update available',
          Icon: status.state === 'downloading' ? RefreshCcw : ArrowDownCircle,
          dot: 'bg-amber-500',
          icon: 'text-amber-600',
          ring: 'border-amber-500/60',
        };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn('relative', meta.ring)}
      onClick={() => navigate('/settings/app-updates')}
      title={status.message ?? meta.label}
      aria-label={meta.label}
    >
      <meta.Icon
        className={cn('size-4', meta.icon, status.state === 'downloading' && 'animate-spin')}
      />
      {status.state === 'downloading' ? (
        <span className="absolute -top-2 -right-3 min-w-6 rounded-full bg-primary px-1 text-[9px] leading-4 font-semibold tabular-nums text-primary-foreground">
          {Math.round(Math.max(0, Math.min(100, status.progress ?? 0)))}%
        </span>
      ) : (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span
            className={cn('absolute inline-flex h-full w-full animate-ping rounded-full', meta.dot)}
          />
          <span className={cn('relative inline-flex h-3 w-3 rounded-full', meta.dot)} />
        </span>
      )}
      <span className="sr-only">{meta.label}</span>
    </Button>
  );
}
