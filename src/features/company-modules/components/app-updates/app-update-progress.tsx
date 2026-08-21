import { Download } from 'lucide-react';

type AppUpdateProgressProps = {
  progress?: number;
};

function normalizeProgress(progress?: number) {
  if (!Number.isFinite(progress)) return 0;
  return Math.max(0, Math.min(100, progress ?? 0));
}

export function AppUpdateProgress({ progress }: AppUpdateProgressProps) {
  const normalizedProgress = normalizeProgress(progress);
  const roundedProgress = Math.round(normalizedProgress);

  return (
    <div
      className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 animate-pulse text-primary" aria-hidden="true" />
          <p className="text-sm font-medium">Downloading update</p>
        </div>
        <span className="text-sm font-semibold tabular-nums text-primary">{roundedProgress}%</span>
      </div>

      <div
        role="progressbar"
        aria-label="Desktop update download progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={roundedProgress}
        className="h-3 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Keep Vipex open while the update downloads. You can continue working.
      </p>
    </div>
  );
}
