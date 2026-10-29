import { gzipSync } from 'node:zlib';
import { hostname } from 'node:os';
import type { MonitorEvent } from './event';

// Limits enforced by Oryx Monitor's ingest endpoint.
export const MAX_EVENTS_PER_BATCH = 500;
export const MAX_BODY_BYTES = 5 * 1024 * 1024;
export const API_KEY_HEADER = 'X-Api-Key';

export type ErrorMonitorOptions = {
  url: string;
  apiKey: string;
  instance?: string | null;
  release?: string | null;
  machineName?: string;
  /** Oldest events are dropped beyond this, so a long monitor outage can't use unbounded memory. */
  maxQueue?: number;
  flushDelayMs?: number;
  heartbeatIntervalMs?: number;
  minBackoffMs?: number;
  maxBackoffMs?: number;
  requestTimeoutMs?: number;
  fetch?: typeof fetch;
  log?: (message: string, data?: Record<string, unknown>) => void;
};

type Outcome = 'accepted' | 'unavailable' | 'unauthorized' | 'rejected';
type SendResult = { outcome: Outcome; status?: number; retryAfterMs?: number; error?: string };

const outcomeOf = (status: number): Outcome => {
  if (status >= 200 && status < 300) return 'accepted';
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 400 || status === 413) return 'rejected';
  // 5xx, 429 and anything unexpected (e.g. 404 from a wrong URL): keep the events and retry.
  return 'unavailable';
};

/** Background timers must not keep the process alive. */
const unref = (timer: unknown) => (timer as { unref?: () => void }).unref?.();

const parseRetryAfter = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
};

/**
 * Queues errors in memory and sends them to Oryx Monitor in gzipped batches, plus a heartbeat.
 * Every public method is safe to call from error paths: nothing here throws or blocks a request.
 */
export class ErrorMonitor {
  readonly url: string;
  private readonly apiKey: string;
  private readonly instance: string | null;
  private readonly release: string | null;
  private readonly machineName: string;
  private readonly maxQueue: number;
  private readonly flushDelayMs: number;
  private readonly heartbeatIntervalMs: number;
  private readonly minBackoffMs: number;
  private readonly maxBackoffMs: number;
  private readonly requestTimeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly log: (message: string, data?: Record<string, unknown>) => void;
  private readonly startedAt = new Date().toISOString();

  private queue: MonitorEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;
  private heartbeatTimer: ReturnType<typeof setInterval> | undefined;
  private flushing: Promise<void> | undefined;
  private backoffMs = 0;
  private retryAt = 0;
  private unauthorizedReported = false;
  dropped = 0;

  constructor(options: ErrorMonitorOptions) {
    this.url = options.url.trim().replace(/\/+$/, '');
    this.apiKey = options.apiKey.trim();
    this.instance = options.instance || null;
    this.release = options.release || null;
    this.machineName = options.machineName ?? hostname();
    this.maxQueue = Math.max(1, options.maxQueue ?? 5_000);
    this.flushDelayMs = options.flushDelayMs ?? 2_000;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 5 * 60_000;
    this.minBackoffMs = options.minBackoffMs ?? 5_000;
    this.maxBackoffMs = options.maxBackoffMs ?? 5 * 60_000;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 10_000;
    this.fetchImpl = options.fetch ?? fetch;
    this.log =
      options.log ?? ((message, data) => console.warn(`[error-monitor] ${message}`, data ?? ''));
  }

  get pending(): number {
    return this.queue.length;
  }

  capture(event: MonitorEvent): void {
    try {
      if (this.queue.length >= this.maxQueue) {
        this.queue.shift();
        this.dropped++;
      }
      this.queue.push({
        ...event,
        instance: event.instance ?? this.instance,
        release: event.release ?? this.release,
        machineName: event.machineName ?? this.machineName,
      });
      this.schedule(this.flushDelayMs);
    } catch {
      // Reporting must never break the caller.
    }
  }

  /** Sends everything queued. Resolves (never rejects) once done or the monitor refused for now. */
  flush(): Promise<void> {
    if (this.flushing) return this.flushing;
    this.flushing = this.drain()
      .catch((error) => this.log('Sending errors failed.', { error: String(error) }))
      .finally(() => {
        this.flushing = undefined;
        if (this.queue.length && !this.timer) this.schedule(this.flushDelayMs);
      });
    return this.flushing;
  }

  /** Flushes, but gives up waiting after `ms` (used right before the process exits). */
  async flushWithin(ms: number): Promise<void> {
    await Promise.race([this.flush(), new Promise((resolve) => setTimeout(resolve, ms))]);
  }

  start(): void {
    if (this.heartbeatTimer) return;
    void this.sendHeartbeat();
    this.heartbeatTimer = setInterval(() => void this.sendHeartbeat(), this.heartbeatIntervalMs);
    unref(this.heartbeatTimer);
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.timer = undefined;
    this.heartbeatTimer = undefined;
  }

  async sendHeartbeat(): Promise<boolean> {
    const body = JSON.stringify({
      instance: this.instance,
      release: this.release,
      machineName: this.machineName,
      startedAt: this.startedAt,
      sentAt: new Date().toISOString(),
    });
    const result = await this.post('/ingest/v1/heartbeat', body);
    if (result.outcome !== 'accepted') this.log('Heartbeat was not accepted.', { ...result });
    return result.outcome === 'accepted';
  }

  private schedule(delayMs: number): void {
    if (this.timer) return;
    const wait = Math.max(delayMs, this.retryAt - Date.now());
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.flush();
    }, wait);
    unref(this.timer);
  }

  private async drain(): Promise<void> {
    while (this.queue.length) {
      const done = new Set<MonitorEvent>();
      const failure = await this.sendEvents(this.queue.slice(0, MAX_EVENTS_PER_BATCH), done);
      this.queue = this.queue.filter((event) => !done.has(event));
      if (failure) return this.backOff(failure);
      this.backoffMs = 0;
      this.retryAt = 0;
      this.unauthorizedReported = false;
    }
  }

  /** Sends the events, halving the batch when the monitor rejects it. Returns the failure that stopped it. */
  private async sendEvents(
    events: MonitorEvent[],
    done: Set<MonitorEvent>,
  ): Promise<SendResult | null> {
    const body = JSON.stringify({
      instance: this.instance,
      release: this.release,
      machineName: this.machineName,
      events,
    });
    const result: SendResult =
      Buffer.byteLength(body) > MAX_BODY_BYTES
        ? { outcome: 'rejected', status: 413 }
        : await this.post('/ingest/v1/errors', body);

    if (result.outcome === 'accepted') {
      events.forEach((event) => done.add(event));
      return null;
    }
    if (result.outcome === 'rejected' && events.length === 1) {
      // It can never be accepted; drop it so it doesn't block everything behind it.
      this.log('The monitor rejected an error event; it will not be sent again.', {
        id: events[0]!.id,
        status: result.status,
      });
      done.add(events[0]!);
      return null;
    }
    if (result.outcome === 'rejected') {
      const half = Math.ceil(events.length / 2);
      return (
        (await this.sendEvents(events.slice(0, half), done)) ??
        (await this.sendEvents(events.slice(half), done))
      );
    }
    return result;
  }

  private backOff(failure: SendResult): void {
    let delay: number;
    if (failure.outcome === 'unauthorized') {
      if (!this.unauthorizedReported) {
        this.log('The monitor refused the API key; check ERROR_MONITOR_KEY.', {
          status: failure.status,
        });
      }
      this.unauthorizedReported = true;
      delay = this.maxBackoffMs;
    } else {
      this.backoffMs = this.backoffMs
        ? Math.min(this.backoffMs * 2, this.maxBackoffMs)
        : this.minBackoffMs;
      delay =
        failure.retryAfterMs && failure.retryAfterMs > this.backoffMs
          ? Math.min(failure.retryAfterMs, this.maxBackoffMs)
          : this.backoffMs;
      this.log('The monitor could not take errors; retrying later.', {
        pending: this.queue.length,
        status: failure.status,
        error: failure.error,
        retryInMs: delay,
      });
    }
    this.retryAt = Date.now() + delay;
    // Replace any earlier timer so the retry waits for the backoff.
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.schedule(delay);
  }

  private async post(path: string, json: string): Promise<SendResult> {
    try {
      const response = await this.fetchImpl(`${this.url}${path}`, {
        method: 'POST',
        headers: {
          [API_KEY_HEADER]: this.apiKey,
          'Content-Type': 'application/json',
          'Content-Encoding': 'gzip',
        },
        body: new Uint8Array(gzipSync(json)),
        signal: AbortSignal.timeout(this.requestTimeoutMs),
      });
      await response.body?.cancel().catch(() => undefined);
      return {
        outcome: outcomeOf(response.status),
        status: response.status,
        retryAfterMs: parseRetryAfter(response.headers.get('retry-after')),
      };
    } catch (error) {
      // Network failure or timeout.
      return {
        outcome: 'unavailable',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
