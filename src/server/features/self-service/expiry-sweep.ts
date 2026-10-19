import { sweepExpiredSelfServiceDraftsSvc } from './drafts.service';
import { sweepExpiredSelfServiceSessions } from './session-store';

const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let started = false;

// Both deletions are idempotent across server instances. Expiry is enforced on
// every request even if this cleanup timer is delayed or the server is offline.
export function startSelfServiceDraftExpirySweep(): void {
  if (started) return;
  started = true;

  const runSweep = () => {
    sweepExpiredSelfServiceSessions().catch((error) => {
      console.error('[self-service] Failed to sweep expired sessions', error);
    });
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
