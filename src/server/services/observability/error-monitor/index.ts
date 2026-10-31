import { env } from '@/server/utils/env';
import { logger } from '@/server/utils/logger';
import { ErrorMonitor } from './client';
import { buildErrorEvent, type RequestErrorContext } from './event';

export { ErrorMonitor } from './client';
export { buildErrorEvent, computeFingerprint } from './event';

type MonitorEnv = {
  ERROR_MONITOR_URL?: string;
  ERROR_MONITOR_KEY?: string;
  ERROR_MONITOR_INSTANCE?: string;
  RELEASE?: string;
};

/** Returns a monitor only when both ERROR_MONITOR_URL and ERROR_MONITOR_KEY are set (and the URL is valid). */
export function createErrorMonitorFromEnv(source: MonitorEnv): ErrorMonitor | null {
  const url = source.ERROR_MONITOR_URL?.trim();
  const apiKey = source.ERROR_MONITOR_KEY?.trim();
  if (!url || !apiKey) return null;
  try {
    new URL(url);
  } catch {
    logger.warn('ERROR_MONITOR_URL is not a valid URL; error monitoring is off.');
    return null;
  }
  return new ErrorMonitor({
    url,
    apiKey,
    instance: source.ERROR_MONITOR_INSTANCE?.trim() || null,
    release: source.RELEASE?.trim() || null,
    log: (message, data) => logger.warn(`error-monitor: ${message}`, data),
  });
}

let monitor: ErrorMonitor | null | undefined;

/** The process-wide monitor (null when not configured). Starts the heartbeat on first use. */
export function getErrorMonitor(): ErrorMonitor | null {
  if (monitor === undefined) {
    monitor = createErrorMonitorFromEnv(env);
    monitor?.start();
    if (monitor) logger.info('error-monitor: forwarding errors', { url: monitor.url });
  }
  return monitor;
}

/** Tests only: replaces the process-wide monitor (undefined = read the environment again). */
export function setErrorMonitorForTesting(value: ErrorMonitor | null | undefined): void {
  monitor = value;
}

/** Queues an error for the monitor. No-op when not configured; never throws. */
export function reportError(
  error: unknown,
  context: RequestErrorContext = {},
  level = 'Error',
): void {
  try {
    const target = getErrorMonitor();
    if (target) target.capture({ ...buildErrorEvent(error, context), level });
  } catch {
    // Reporting must never break the caller.
  }
}

let processHandlersInstalled = false;

/**
 * Reports uncaught exceptions and unhandled rejections, then exits with code 1 as Bun does by default.
 * Only installed when the monitor is configured, so behaviour is unchanged otherwise.
 */
export function installProcessErrorHandlers(): void {
  const target = getErrorMonitor();
  if (!target || processHandlersInstalled) return;
  processHandlersInstalled = true;

  const fatal = (kind: string) => async (error: unknown) => {
    console.error(`${kind}:`, error);
    reportError(error, { category: kind }, 'Critical');
    await target.flushWithin(2_000);
    process.exit(1);
  };
  process.on('uncaughtException', fatal('uncaughtException'));
  process.on('unhandledRejection', fatal('unhandledRejection'));
}
