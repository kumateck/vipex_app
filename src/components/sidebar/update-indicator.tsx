import { useEffect, useMemo, useState } from 'react';
import { ArrowDownCircle, AlertTriangle, CheckCircle2, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  if (status.state === 'idle' || status.state === 'not-available') return null;

  const meta =
    status.state === 'downloaded'
      ? {
          label: 'Update ready',
          Icon: CheckCircle2,
          className: 'bg-green-500/10 text-green-600 border-green-500/30',
        }
      : status.state === 'available' ||
          status.state === 'downloading' ||
          status.state === 'checking'
        ? {
            label: status.state === 'downloading' ? 'Downloading update' : 'Update available',
            Icon: status.state === 'checking' ? RefreshCcw : ArrowDownCircle,
            className: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
          }
        : {
            label: 'Update issue',
            Icon: AlertTriangle,
            className: 'bg-destructive/10 text-destructive border-destructive/30',
          };

  return (
    <Button
      type="button"
      variant="ghost"
      className="h-8 px-2"
      onClick={() => navigate('/settings/app-updates')}
      title={status.message ?? meta.label}
    >
      <Badge variant="outline" className={meta.className}>
        <meta.Icon className="mr-1 h-3.5 w-3.5" />
        {meta.label}
      </Badge>
    </Button>
  );
}
