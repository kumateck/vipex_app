import { sweepExpiredSelfServiceDraftsSvc } from './drafts.service';

const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let started = false;

// Self-service drafts have a 1-hour TTL and must be auto-deleted if no agent
// completes them in time. There is no cron/scheduler infrastructure in this
// codebase, but the server runs as a single long-lived Bun process (see
// src/index.tsx), so a simple in-process interval is sufficient - call this
// once at server boot.
export function startSelfServiceDraftExpirySweep(): void {
  if (started) return;
  started = true;

  const runSweep = () => {
    sweepExpiredSelfServiceDraftsSvc().catch((error) => {
      console.error('[self-service] Failed to sweep expired drafts', error);
    });
  };

  runSweep();
  const interval = setInterval(runSweep, SWEEP_INTERVAL_MS) as unknown as {
    unref?: () => void;
  };
  // Don't let the sweep keep the process alive on its own (matters for tests
  // and graceful shutdown, which don't run through the long-lived server).
  interval.unref?.();
}
