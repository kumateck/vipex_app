import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  RefreshCcw,
  RotateCcw,
  Monitor,
  Globe,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

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
      progress?: number;
      message?: string;
    };

const STATUS_LABEL: Record<DesktopUpdateStatus['state'], string> = {
  idle: 'Idle',
  checking: 'Checking',
  available: 'Available',
  downloading: 'Downloading',
  downloaded: 'Ready to Install',
  'not-available': 'Up to Date',
  error: 'Error',
};

function isDesktopUpdaterAvailable() {
  return typeof window !== 'undefined' && typeof window.api?.updates?.getStatus === 'function';
}

export function AppUpdatesPage() {
  const isDesktop = useMemo(() => isDesktopUpdaterAvailable(), []);
  const [status, setStatus] = useState<DesktopUpdateStatus>({
    state: 'idle',
    message: isDesktop
      ? 'Ready to check for updates.'
      : 'Desktop updater is only available inside the Electron app.',
  });
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!isDesktop) return;
    let mounted = true;

    const run = async () => {
      try {
        const current = await window.api!.updates.getStatus();
        if (!mounted) return;
        setStatus(current);
      } catch {
        if (!mounted) return;
        setStatus({
          state: 'error',
          message: 'Unable to load updater status.',
        });
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

  async function handleCheck() {
    if (!isDesktop) return;
    setIsBusy(true);
    try {
      const result = await window.api!.updates.check();
      setStatus(result.status);
      if (!result.ok && result.reason) {
        toast.error(result.reason);
      } else {
        toast.success('Update check started.');
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDownload() {
    if (!isDesktop) return;
    setIsBusy(true);
    try {
      const result = await window.api!.updates.download();
      setStatus(result.status);
      if (!result.ok && result.reason) {
        toast.error(result.reason);
      } else {
        toast.success('Update download started.');
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function handleInstall() {
    if (!isDesktop) return;
    setIsBusy(true);
    try {
      const result = await window.api!.updates.install();
      if (!result.ok && result.reason) {
        toast.error(result.reason);
        return;
      }
      toast.success('Restarting app to install update...');
    } finally {
      setIsBusy(false);
    }
  }

  const canDownload = isDesktop && (status.state === 'available' || status.state === 'downloading');
  const canInstall = isDesktop && status.state === 'downloaded';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">App Updates</h1>
          <p className="text-sm text-muted-foreground">
            Manage desktop updates without reinstalling. This page applies to Electron builds.
          </p>
        </div>
        <Badge variant={isDesktop ? 'default' : 'secondary'} className="gap-2">
          {isDesktop ? <Monitor className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
          {isDesktop ? 'Desktop Runtime' : 'Web Runtime'}
        </Badge>
      </div>

      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Updater Status</CardTitle>
            <CardDescription>
              Current state of the packaged desktop updater and available actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{STATUS_LABEL[status.state]}</Badge>
              {status.version ? <Badge variant="secondary">Version: {status.version}</Badge> : null}
              {status.state === 'downloaded' ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Ready
                </Badge>
              ) : null}
              {status.state === 'error' ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Attention
                </Badge>
              ) : null}
            </div>

            <div className="rounded-md border p-3">
              <p className="text-sm text-muted-foreground">
                {status.message ?? 'No update activity yet.'}
              </p>
              {typeof status.progress === 'number' ? (
                <div className="mt-3 space-y-2">
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, status.progress))}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Download progress: {Math.round(status.progress)}%
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void handleCheck()}
                disabled={!isDesktop || isBusy}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Check for Updates
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDownload()}
                disabled={!canDownload || isBusy}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Update
              </Button>

              <Button
                type="button"
                variant="default"
                onClick={() => void handleInstall()}
                disabled={!canInstall || isBusy}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restart & Install
              </Button>
            </div>

            {!isDesktop ? (
              <p className="text-sm text-muted-foreground">
                Open the installed desktop app to use update controls. Web browser sessions cannot
                trigger desktop install.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </ScrollableWrapper>
    </div>
  );
}
